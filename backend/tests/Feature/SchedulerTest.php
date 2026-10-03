<?php

namespace Tests\Feature;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class SchedulerTest extends TestCase
{
    use RefreshDatabase;

    public function test_stale_order_command_cancels_unpaid_orders_and_restores_stock(): void
    {
        $product = Product::create([
            'name' => 'Apex Pro Soundbar',
            'sku' => 'SCHED-SND-01',
            'price' => 300.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        $initialStock = $product->stock; // 10
        $orderQuantity = 3;

        // Simulate reservation
        $product->decrement('stock', $orderQuantity);
        $this->assertEquals(7, $product->fresh()->stock);

        // Create stale order created 40 minutes ago in pending_payment
        $staleOrder = Order::create([
            'order_number' => 'ORD-STALE-998877',
            'customer_name' => 'Mahmudul Hasan',
            'customer_phone' => '01711223344',
            'customer_email' => 'mahmud@example.com',
            'shipping_address' => 'House 5, Road 2, Dhanmondi, Dhaka',
            'subtotal' => 900.00,
            'tax' => 45.00,
            'shipping_fee' => 60.00,
            'total_amount' => 1005.00,
            'status' => Order::STATUS_PENDING_PAYMENT,
            'payment_method' => 'bkash',
            'created_at' => now()->subMinutes(40),
            'updated_at' => now()->subMinutes(40),
        ]);

        $staleOrder->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'unit_price' => 300.00,
            'quantity' => $orderQuantity,
            'subtotal' => 900.00,
            'created_at' => now()->subMinutes(40),
            'updated_at' => now()->subMinutes(40),
        ]);

        // Execute scheduled stale order cancellation command (30 min cutoff)
        $exitCode = Artisan::call('orders:cancel-stale', ['--minutes' => 30]);
        $this->assertEquals(0, $exitCode);

        // Verify order is cancelled
        $staleOrder->refresh();
        $this->assertEquals(Order::STATUS_CANCELLED, $staleOrder->status);
        $this->assertStringContainsString('Auto-cancelled due to payment timeout', $staleOrder->notes);

        // Verify inventory stock is restored to initial balance
        $product->refresh();
        $this->assertEquals($initialStock, $product->stock);

        // Verify inventory log audit trail
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $product->id,
            'quantity_change' => $orderQuantity,
            'reference_type' => 'stale_order_auto_cancellation',
            'reference_id' => $staleOrder->id,
        ]);
    }
}
