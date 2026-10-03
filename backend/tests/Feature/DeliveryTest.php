<?php

namespace Tests\Feature;

use App\Events\OrderPaid;
use App\Jobs\DispatchCarryBeeOrderJob;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Delivery\CarryBeeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class DeliveryTest extends TestCase
{
    use RefreshDatabase;

    protected Order $order;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $product = Product::create([
            'name' => 'Apex Pro Soundbar',
            'sku' => 'APEX-SND-002',
            'price' => 450.00,
            'stock' => 5,
            'status' => 'active',
        ]);

        $this->order = Order::create([
            'order_number' => 'ORD-202610-DELIV01',
            'customer_name' => 'Rahim Chowdhury',
            'customer_phone' => '01811223344',
            'customer_email' => 'rahim@example.com',
            'shipping_address' => 'Plot 8, Gulshan-2, Dhaka',
            'subtotal' => 450.00,
            'tax' => 22.50,
            'shipping_fee' => 60.00,
            'total_amount' => 532.50,
            'status' => Order::STATUS_PAID,
            'payment_method' => 'bkash',
        ]);

        $this->order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'unit_price' => 450.00,
            'quantity' => 1,
            'subtotal' => 450.00,
        ]);

        $this->adminUser = User::create([
            'name' => 'Store Admin',
            'email' => 'admin@apexstore.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
    }

    public function test_order_paid_event_triggers_queued_carrybee_job(): void
    {
        Queue::fake();

        event(new OrderPaid($this->order));

        Queue::assertPushedOn('deliveries', DispatchCarryBeeOrderJob::class, function ($job) {
            return $job->order->id === $this->order->id;
        });
    }

    public function test_carrybee_service_creates_consignment_successfully(): void
    {
        $service = app(CarryBeeService::class);
        $result = $service->createConsignment($this->order);

        $this->assertTrue($result['success']);
        $this->assertNotEmpty($result['consignment_id']);
        $this->assertNotEmpty($result['tracking_code']);
        $this->assertStringStartsWith('CB-CN-', $result['consignment_id']);
    }

    public function test_dispatch_carrybee_job_updates_delivery_record_and_order_status(): void
    {
        $service = app(CarryBeeService::class);
        $job = new DispatchCarryBeeOrderJob($this->order);

        $job->handle($service);

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $this->order->id,
            'courier' => 'CarryBee',
            'status' => Delivery::STATUS_DISPATCHED,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => Order::STATUS_DISPATCHED,
        ]);

        $delivery = Delivery::where('order_id', $this->order->id)->first();
        $this->assertNotNull($delivery->consignment_id);
        $this->assertNotNull($delivery->tracking_code);
        $this->assertNotNull($delivery->dispatched_at);
    }

    public function test_admin_can_manually_dispatch_delivery_synchronously(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/orders/{$this->order->id}/dispatch-delivery?sync=true");

        $response->assertStatus(200)
            ->assertJsonPath('order_number', $this->order->order_number)
            ->assertJsonPath('delivery.courier', 'CarryBee')
            ->assertJsonPath('delivery.status', 'dispatched');

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $this->order->id,
            'status' => Delivery::STATUS_DISPATCHED,
        ]);
    }

    public function test_admin_can_retrieve_delivery_status_and_tracking_timeline(): void
    {
        Delivery::create([
            'order_id' => $this->order->id,
            'courier' => 'CarryBee',
            'consignment_id' => 'CB-CN-2026-112233',
            'tracking_code' => 'TRK-CB112233',
            'delivery_fee' => 60.00,
            'status' => Delivery::STATUS_DISPATCHED,
            'dispatched_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/orders/{$this->order->id}/delivery-status");

        $response->assertStatus(200)
            ->assertJsonPath('has_delivery', true)
            ->assertJsonPath('delivery.consignment_id', 'CB-CN-2026-112233')
            ->assertJsonStructure([
                'order_id',
                'order_number',
                'has_delivery',
                'delivery' => [
                    'id',
                    'order_id',
                    'courier',
                    'consignment_id',
                    'tracking_code',
                    'status',
                ],
                'tracking' => [
                    'consignment_id',
                    'status',
                    'events',
                ],
            ]);
    }

    public function test_job_failed_handler_marks_delivery_as_failed(): void
    {
        $job = new DispatchCarryBeeOrderJob($this->order);
        $exception = new \Exception('CarryBee API Gateway Timeout 504');

        $job->failed($exception);

        $this->assertDatabaseHas('deliveries', [
            'order_id' => $this->order->id,
            'status' => Delivery::STATUS_FAILED,
            'failure_reason' => 'CarryBee API Gateway Timeout 504',
        ]);
    }
}
