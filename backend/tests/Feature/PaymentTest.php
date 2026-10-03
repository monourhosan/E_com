<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $product = Product::create([
            'name' => 'Apex Pulse ANC Wireless Headphones',
            'sku' => 'APEX-AUD-001',
            'price' => 299.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        $this->order = Order::create([
            'order_number' => 'ORD-202610-TEST01',
            'customer_name' => 'Tanvir Ahmed',
            'customer_phone' => '01712345678',
            'customer_email' => 'tanvir@example.com',
            'shipping_address' => 'House 14, Road 5, Dhanmondi, Dhaka',
            'subtotal' => 299.00,
            'tax' => 14.95,
            'shipping_fee' => 60.00,
            'total_amount' => 373.95,
            'status' => Order::STATUS_PENDING_PAYMENT,
            'payment_method' => 'bkash',
        ]);

        $this->order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'unit_price' => 299.00,
            'quantity' => 1,
            'subtotal' => 299.00,
        ]);
    }

    public function test_payment_can_be_initiated_for_pending_order(): void
    {
        $response = $this->postJson("/api/v1/store/orders/{$this->order->order_number}/pay", [
            'gateway' => 'bkash',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('data.gateway', 'bkash')
            ->assertJsonPath('data.order_number', $this->order->order_number);

        $this->assertDatabaseHas('payments', [
            'order_id' => $this->order->id,
            'gateway' => 'bkash',
            'status' => 'initiated',
        ]);
    }

    public function test_successful_payment_callback_updates_order_status_to_paid(): void
    {
        Event::fake();

        // 1. Initiate payment first
        $initRes = $this->postJson("/api/v1/store/orders/{$this->order->order_number}/pay", [
            'gateway' => 'bkash',
        ]);
        $paymentRecordId = $initRes->json('data.payment_record_id');

        // 2. Fire callback
        $callbackRes = $this->postJson('/api/v1/payments/callback/bkash', [
            'payment_record_id' => $paymentRecordId,
            'transaction_id' => 'TRX_TEST_SUCCESS_01',
            'status' => 'success',
        ]);

        $callbackRes->assertStatus(200)
            ->assertJsonPath('status', 'successful')
            ->assertJsonPath('order_number', $this->order->order_number);

        // Verify database updates
        $this->assertEquals(Order::STATUS_PAID, $this->order->fresh()->status);
        $this->assertDatabaseHas('payments', [
            'id' => $paymentRecordId,
            'status' => 'successful',
            'transaction_id' => 'TRX_TEST_SUCCESS_01',
        ]);

        // Verify OrderPaid event was dispatched
        Event::assertDispatched(\App\Events\OrderPaid::class);
    }

    public function test_duplicate_payment_callback_is_idempotent_and_does_not_double_process(): void
    {
        // 1. Create a payment record already processed
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'gateway' => 'bkash',
            'payment_id' => 'BKASH_IDEMPOTENT_01',
            'transaction_id' => 'TRX_IDEMPOTENT_01',
            'amount' => $this->order->total_amount,
            'currency' => 'BDT',
            'status' => Payment::STATUS_SUCCESSFUL,
            'verified_at' => now(),
        ]);
        $this->order->update(['status' => Order::STATUS_PAID]);

        // 2. Fire second identical callback
        $callbackRes = $this->postJson('/api/v1/payments/callback/bkash', [
            'payment_record_id' => $payment->id,
            'transaction_id' => 'TRX_IDEMPOTENT_01',
            'status' => 'success',
        ]);

        $callbackRes->assertStatus(200)
            ->assertJsonPath('status', 'already_processed')
            ->assertJsonPath('message', 'Payment already processed successfully');

        // Verify order status remains paid
        $this->assertEquals(Order::STATUS_PAID, $this->order->fresh()->status);
    }

    public function test_failed_payment_callback_marks_payment_failed_without_dispatching_courier(): void
    {
        Event::fake();

        // 1. Initiate payment first
        $initRes = $this->postJson("/api/v1/store/orders/{$this->order->order_number}/pay", [
            'gateway' => 'bkash',
        ]);
        $paymentRecordId = $initRes->json('data.payment_record_id');

        // 2. Fire failure callback
        $callbackRes = $this->postJson('/api/v1/payments/callback/bkash', [
            'payment_record_id' => $paymentRecordId,
            'transaction_id' => 'TRX_FAILED_01',
            'status' => 'failed',
            'reason' => 'User cancelled payment on mobile wallet PIN prompt',
        ]);

        $callbackRes->assertStatus(200)
            ->assertJsonPath('status', 'failed');

        // Verify payment is marked failed and order remains pending_payment
        $this->assertDatabaseHas('payments', [
            'id' => $paymentRecordId,
            'status' => 'failed',
        ]);
        $this->assertEquals(Order::STATUS_PENDING_PAYMENT, $this->order->fresh()->status);

        // Verify NO OrderPaid event was dispatched
        Event::assertNotDispatched(\App\Events\OrderPaid::class);
    }

    public function test_admin_can_toggle_payment_gateway_and_disabled_gateway_is_rejected(): void
    {
        // 1. Admin disables bKash
        Setting::set('payment_methods', [
            'bkash_enabled' => false,
            'sslcommerz_enabled' => true,
            'cod_enabled' => true,
            'active_gateway' => 'sslcommerz',
            'sandbox_mode' => true,
        ]);

        // 2. Attempt to initiate payment with disabled bKash
        $response = $this->postJson("/api/v1/store/orders/{$this->order->order_number}/pay", [
            'gateway' => 'bkash',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => "Payment method 'bkash' is currently unavailable or disabled by administration.",
            ]);
    }
}
