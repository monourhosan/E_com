<?php

namespace App\Console\Commands;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CancelStaleOrdersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:cancel-stale {--minutes=30 : The age in minutes after which unpaid orders are cancelled}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically cancel abandoned pending_payment orders and return reserved inventory stock';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $minutes = (int) $this->option('minutes');
        $cutoff = now()->subMinutes($minutes);

        $this->info("Scanning for pending_payment orders placed before {$cutoff->toDateTimeString()} ({$minutes} mins ago)...");

        $staleOrders = Order::with('items')
            ->where('status', Order::STATUS_PENDING_PAYMENT)
            ->where('created_at', '<=', $cutoff)
            ->get();

        if ($staleOrders->isEmpty()) {
            $this->info("No stale orders found.");
            return self::SUCCESS;
        }

        $cancelledCount = 0;

        foreach ($staleOrders as $order) {
            DB::transaction(function () use ($order, &$cancelledCount, $minutes) {
                // Re-lock the order row to prevent race conditions with an in-flight callback
                $lockedOrder = Order::where('id', $order->id)
                    ->lockForUpdate()
                    ->first();

                if (! $lockedOrder || $lockedOrder->status !== Order::STATUS_PENDING_PAYMENT) {
                    return;
                }

                // Return stock for all items
                foreach ($lockedOrder->items as $item) {
                    $product = Product::where('id', $item->product_id)
                        ->lockForUpdate()
                        ->first();

                    if ($product) {
                        $product->increment('stock', $item->quantity);

                        InventoryLog::create([
                            'product_id' => $product->id,
                            'quantity_change' => $item->quantity,
                            'balance_after' => $product->fresh()->stock,
                            'reference_type' => 'stale_order_auto_cancellation',
                            'reference_id' => $lockedOrder->id,
                        ]);
                    }
                }

                $lockedOrder->update([
                    'status' => Order::STATUS_CANCELLED,
                    'notes' => ($lockedOrder->notes ? $lockedOrder->notes . ' | ' : '') .
                        "Auto-cancelled due to payment timeout ({$minutes} mins). Stock released.",
                ]);

                $cancelledCount++;

                Log::info("Stale order #{$lockedOrder->order_number} auto-cancelled. Stock restored.");
            });
        }

        $this->info("Successfully cancelled {$cancelledCount} stale orders and restored stock.");

        return self::SUCCESS;
    }
}
