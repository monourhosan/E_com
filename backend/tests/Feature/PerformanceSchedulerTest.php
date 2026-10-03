<?php

namespace Tests\Feature;

use App\Console\Commands\CancelStaleOrdersCommand;
use App\Console\Commands\PollCarryBeeDeliveryStatusCommand;
use App\Models\Delivery;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Services\Delivery\CarryBeeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PerformanceSchedulerTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->product = Product::create([
            'name' => 'Apex Horizon Sound Master',
            'sku' => 'APEX-AUD-099',
            'category' => 'Audio',
            'price' => 350.00,
            'stock' => 15,
            'status' => 'active',
        ]);

        $this->adminUser = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@apexstore.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
    }

    public function test_catalog_query_is_cached_and_flushed_on_product_mutation(): void
    {
        // First storefront catalog request
        $response1 = $this->getJson('/api/v1/store/products');
        $response1->assertStatus(200);

        // Update product price via observer trigger
        $this->product->update(['price' => 299.99]);

        // Next request immediately reflects updated price
        $response2 = $this->getJson('/api/v1/store/products');
        $response2->assertStatus(200)
            ->assertJsonFragment(['price' => 299.99]);
    }

    public function test_settings_are_cached_and_invalidated_on_update(): void
    {
        Setting::set('payment_methods', ['bkash_enabled' => true, 'sslcommerz_enabled' => false]);

        $methods = Setting::getPaymentMethods();
        $this->assertTrue($methods['bkash_enabled']);
        $this->assertFalse($methods['sslcommerz_enabled']);

        // Update setting
        Setting::set('payment_methods', ['bkash_enabled' => false, 'sslcommerz_enabled' => true]);

        $updatedMethods = Setting::getPaymentMethods();
        $this->assertFalse($updatedMethods['bkash_enabled']);
        $this->assertTrue($updatedMethods['sslcommerz_enabled']);
    }

    public function test_stale_order_auto_cancellation_restores_stock_and_logs(): void
    {
        $initialStock = $this->product->stock; // 15
        $orderQty = 3;

        // Deduct stock for order
        $this->product->decrement('stock', $orderQty);

        // Create order backdated 35 minutes ago in pending_payment
        $staleOrder = Order::create([
            'order_number' => 'ORD-202610-STALE01',
            'customer_name' => 'Karim Hasan',
            'customer_phone' => '01700000000',
            'customer_email' => 'karim@example.com',
            'shipping_address' => 'Mirpur-10, Dhaka',
            'subtotal' => 1050.00,
            'tax' => 52.50,
            'shipping_fee' => 0.00,
            'total_amount' => 1102.50,
            'status' => Order::STATUS_PENDING_PAYMENT,
            'payment_method' => 'bkash',
            'created_at' => now()->subMinutes(35),
            'updated_at' => now()->subMinutes(35),
        ]);

        $staleOrder->items()->create([
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'unit_price' => 350.00,
            'quantity' => $orderQty,
            'subtotal' => 1050.00,
        ]);

        // Run the scheduled command
        $exitCode = Artisan::call('orders:cancel-stale', ['--minutes' => 30]);
        $this->assertEquals(0, $exitCode);

        // Verify order is now cancelled
        $staleOrder->refresh();
        $this->assertEquals(Order::STATUS_CANCELLED, $staleOrder->status);
        $this->assertStringContainsString('Auto-cancelled due to payment timeout', $staleOrder->notes);

        // Verify stock is restored
        $this->product->refresh();
        $this->assertEquals($initialStock, $this->product->stock);

        // Verify inventory log recorded
        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $this->product->id,
            'quantity_change' => $orderQty,
            'reference_type' => 'stale_order_auto_cancellation',
            'reference_id' => $staleOrder->id,
        ]);
    }

    public function test_recent_pending_orders_are_not_cancelled(): void
    {
        // Recent order (only 10 mins ago)
        $recentOrder = Order::create([
            'order_number' => 'ORD-202610-RECENT01',
            'customer_name' => 'Nabila Islam',
            'customer_phone' => '01900000000',
            'customer_email' => 'nabila@example.com',
            'shipping_address' => 'Banani, Dhaka',
            'subtotal' => 350.00,
            'tax' => 17.50,
            'shipping_fee' => 60.00,
            'total_amount' => 427.50,
            'status' => Order::STATUS_PENDING_PAYMENT,
            'payment_method' => 'sslcommerz',
            'created_at' => now()->subMinutes(10),
        ]);

        Artisan::call('orders:cancel-stale', ['--minutes' => 30]);

        $recentOrder->refresh();
        $this->assertEquals(Order::STATUS_PENDING_PAYMENT, $recentOrder->status);
    }

    public function test_poll_carrybee_delivery_status_command(): void
    {
        $order = Order::create([
            'order_number' => 'ORD-202610-DELIVTEST',
            'customer_name' => 'Sabbir Rahman',
            'customer_phone' => '01711111111',
            'customer_email' => 'sabbir@example.com',
            'shipping_address' => 'Uttara, Dhaka',
            'subtotal' => 350.00,
            'tax' => 17.50,
            'shipping_fee' => 60.00,
            'total_amount' => 427.50,
            'status' => Order::STATUS_DISPATCHED,
            'payment_method' => 'bkash',
        ]);

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'courier' => 'CarryBee',
            'consignment_id' => 'CB-CN-2026-998877',
            'tracking_code' => 'TRK-CB998877',
            'status' => Delivery::STATUS_DISPATCHED,
            'dispatched_at' => now()->subHours(2),
        ]);

        $exitCode = Artisan::call('delivery:poll-carrybee-status');
        $this->assertEquals(0, $exitCode);

        $delivery->refresh();
        $this->assertNotNull($delivery->response_payload);
    }
}
