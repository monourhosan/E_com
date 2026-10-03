<?php

namespace Tests\Feature;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutAndInventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_checkout_with_valid_cart(): void
    {
        $product = Product::create([
            'name' => 'Apex Ergonomic Mouse',
            'sku' => 'APEX-MOU-01',
            'price' => 75.00,
            'stock' => 15,
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Tasnim Rahman',
            'customer_phone' => '01711223344',
            'customer_email' => 'tasnim@example.com',
            'shipping_address' => 'House 10, Road 2, Dhanmondi, Dhaka',
            'payment_method' => 'bkash',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/store/checkout', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.customer_name', 'Tasnim Rahman')
            ->assertJsonPath('data.status', 'pending_payment');

        $this->assertEquals(13, $product->fresh()->stock);
    }

    public function test_checkout_fails_if_requested_quantity_exceeds_stock(): void
    {
        $product = Product::create([
            'name' => 'Scarce mechanical keyboard',
            'sku' => 'APEX-KEY-SCR',
            'price' => 150.00,
            'stock' => 2,
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Sabbir Ahmed',
            'customer_phone' => '01811223344',
            'customer_email' => 'sabbir@example.com',
            'shipping_address' => 'Mirpur 10, Dhaka',
            'payment_method' => 'sslcommerz',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // Exceeds available stock of 2
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/store/checkout', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('error', "Insufficient stock for product: Scarce mechanical keyboard. Remaining: 2");

        // Stock must remain unchanged
        $this->assertEquals(2, $product->fresh()->stock);
        $this->assertEquals(0, Order::count());
    }

    public function test_inventory_is_decremented_atomically_upon_order_creation(): void
    {
        $product = Product::create([
            'name' => 'Apex ANC Headphones',
            'sku' => 'APEX-ANC-09',
            'price' => 250.00,
            'stock' => 20,
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Farhan Kabir',
            'customer_phone' => '01911223344',
            'customer_email' => 'farhan@example.com',
            'shipping_address' => 'Uttara Sector 3, Dhaka',
            'payment_method' => 'cod',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 4,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/store/checkout', $payload);

        $response->assertStatus(201);

        $order = Order::where('customer_email', 'farhan@example.com')->first();
        $this->assertNotNull($order);

        // Verify product stock decremented
        $this->assertEquals(16, $product->fresh()->stock);

        // Verify inventory log audit trail
        $log = InventoryLog::where('product_id', $product->id)
            ->where('reference_id', $order->order_number)
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals(-4, $log->quantity_change);
        $this->assertEquals(16, $log->balance_after);
    }

    public function test_concurrent_checkout_prevents_negative_stock(): void
    {
        // Remaining stock is exactly 1 unit
        $product = Product::create([
            'name' => 'Single Unit Laptop',
            'sku' => 'APEX-ONE-01',
            'price' => 1200.00,
            'stock' => 1,
            'status' => 'active',
        ]);

        $payloadBuyerA = [
            'customer_name' => 'Buyer Alpha',
            'customer_phone' => '01700000001',
            'customer_email' => 'buyer.a@example.com',
            'shipping_address' => 'Gulshan 2, Dhaka',
            'payment_method' => 'bkash',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ];

        $payloadBuyerB = [
            'customer_name' => 'Buyer Beta',
            'customer_phone' => '01700000002',
            'customer_email' => 'buyer.b@example.com',
            'shipping_address' => 'Banani Road 11, Dhaka',
            'payment_method' => 'sslcommerz',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ];

        // First customer checkout transaction
        $responseA = $this->postJson('/api/v1/store/checkout', $payloadBuyerA);
        $responseA->assertStatus(201);
        $this->assertEquals(0, $product->fresh()->stock);

        // Second consecutive checkout transaction attempting to buy the same depleted item
        $responseB = $this->postJson('/api/v1/store/checkout', $payloadBuyerB);
        $responseB->assertStatus(422)
            ->assertJsonPath('error', "Insufficient stock for product: Single Unit Laptop. Remaining: 0");

        // Stock must remain strictly 0 and never turn negative
        $this->assertEquals(0, $product->fresh()->stock);
        $this->assertGreaterThanOrEqual(0, $product->fresh()->stock);
        $this->assertEquals(1, Order::count());
    }
}
