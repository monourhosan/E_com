<?php

namespace App\Console\Commands;

use App\Models\Delivery;
use App\Models\Order;
use App\Services\Delivery\CarryBeeService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PollCarryBeeDeliveryStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'delivery:poll-carrybee-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Poll CarryBee API for live status tracking of in-transit consignments';

    /**
     * Execute the console command.
     */
    public function handle(CarryBeeService $carryBeeService): int
    {
        $this->info("Scanning for active CarryBee deliveries requiring status updates...");

        $activeDeliveries = Delivery::with('order')
            ->whereIn('status', [Delivery::STATUS_DISPATCHED, Delivery::STATUS_IN_TRANSIT])
            ->whereNotNull('consignment_id')
            ->get();

        if ($activeDeliveries->isEmpty()) {
            $this->info("No active in-transit deliveries found.");
            return self::SUCCESS;
        }

        $updatedCount = 0;

        foreach ($activeDeliveries as $delivery) {
            try {
                $tracking = $carryBeeService->trackConsignment($delivery->consignment_id);

                if (! empty($tracking['status'])) {
                    $newStatus = match (strtolower($tracking['status'])) {
                        'delivered' => Delivery::STATUS_DELIVERED,
                        'in_transit', 'out_for_delivery' => Delivery::STATUS_IN_TRANSIT,
                        'failed', 'cancelled', 'returned' => Delivery::STATUS_FAILED,
                        default => $delivery->status,
                    };

                    if ($newStatus !== $delivery->status) {
                        $delivery->update([
                            'status' => $newStatus,
                            'response_payload' => array_merge((array) $delivery->response_payload, ['latest_tracking' => $tracking]),
                        ]);

                        if ($newStatus === Delivery::STATUS_DELIVERED && $delivery->order) {
                            $delivery->order->update(['status' => Order::STATUS_COMPLETED]);
                        }

                        $updatedCount++;
                        $this->info("Updated consignment #{$delivery->consignment_id} -> {$newStatus}");
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Failed polling CarryBee status for consignment {$delivery->consignment_id}: {$e->getMessage()}");
            }
        }

        $this->info("Completed status poll. Updated {$updatedCount} packages.");

        return self::SUCCESS;
    }
}
