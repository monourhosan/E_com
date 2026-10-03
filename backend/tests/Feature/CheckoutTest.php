<?php

namespace Tests\Feature;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_checkout_with_valid_payload(): void
    {
        $product1 = Product::create([
            'name' => 'Apex ANC Headphones',
            'sku' => 'APEX-AUD-001',
            'price' => 299.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        $product2 = Product::create([
            'name' => 'Apex Pro Smartwatch',
            'sku' => 'APEX-WR-001',
            'price' => 349.00,
            'stock' => 5,
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Tanvir Ahmed',
            'customer_phone' => '01712345678',
            'customer_email' => 'tanvir@example.com',
            'shipping_address' => 'House 14, Road 5, Dhanmondi, Dhaka 1205',
            'payment_method' => 'bkash',
            'notes' => 'Ring doorbell twice',
            'items' => [
                [
                    'product_id' => $product1->id,
                    'quantity' => 2,
                ],
                [
                    'product_id' => $product2->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/store/checkout', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.customer_name', 'Tanvir Ahmed')
            ->assertJsonPath('data.payment_method', 'bkash')
            ->assertJsonPath('data.status', 'pending_payment');

        // Subtotal = (299 * 2) + 349 = 598 + 349 = 947
        // Tax (5%) = 47.35
        // Shipping fee = 60.00 (since 947 < 1000)
        // Total = 947 + 47.35 + 60 = 1054.35
        $response->assertJsonPath('data.subtotal', 947.0)
            ->assertJsonPath('data.shipping_fee', 60.0)
            ->assertJsonPath('data.total_amount', 1054.35);

        // Verify database stock decrement
        $this->assertEquals(8, $product1->fresh()->stock);
        $this->assertEquals(4, $product2->fresh()->stock);

        // Verify order items created
        $order = Order::where('customer_email', 'tanvir@example.com')->first();
        $this->assertNotNull($order);
        $this->assertCount(2, $order->items);

        // Verify inventory audit logs recorded
        $logs = InventoryLog::where('reference_id', $order->order_number)->get();
        $this->assertCount(2, $logs);
        $this->assertEquals(-2, $logs->where('product_id', $product1->id)->first()->quantity_change);
        $this->assertEquals(8, $logs->where('product_id', $product1->id)->first()->balance_after);
    }

    public function test_checkout_fails_and_rolls_back_when_stock_is_insufficient(): void
    {
        $product = Product::create([
            'name' => 'Limited Edition Laptop',
            'sku' => 'APEX-PC-LTD',
            'price' => 1899.00,
            'stock' => 2,
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Karim Hasan',
            'customer_phone' => '01812345678',
            'customer_email' => 'karim@example.com',
            'shipping_address' => 'Banani Road 11, Dhaka',
            'payment_method' => 'cod',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // Exceeds stock of 2
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/store/checkout', $payload);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'error' => "Insufficient stock for product: Limited Edition Laptop. Remaining: 2",
            ]);

        // Verify stock was unaffected
        $this->assertEquals(2, $product->fresh()->stock);

        // Verify no order was created
        $this->assertEquals(0, Order::count());
        $this->assertEquals(0, InventoryLog::count());
    }

    public function test_checkout_applies_free_shipping_for_subtotal_over_1000(): void
    {
        $product = Product::create([
            'name' => 'Apex Vision 4K Monitor',
            'sku' => 'APEX-DISP-001',
            'price' => 1099.00,
            'stock' => 5,
            'status' => 'active',
        ]);

        $payload = [
            'customer_name' => 'Sultana Begum',
            'customer_phone' => '01912345678',
            'customer_email' => 'sultana@example.com',
            'shipping_address' => 'Gulshan 2, Dhaka',
            'payment_method' => 'sslcommerz',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/store/checkout', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.subtotal', 1099.0)
            ->assertJsonPath('data.shipping_fee', 0.0);
    }
}
