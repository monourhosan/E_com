<?php

namespace App\Jobs;

use App\Models\Delivery;
use App\Models\Order;
use App\Services\Delivery\CarryBeeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DispatchCarryBeeOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     *
     * @var int
     */
    public int $tries = 5;

    /**
     * Number of seconds to wait before retrying the job.
     *
     * @var array<int>
     */
    public array $backoff = [10, 60, 300, 900, 3600]; // 10s, 1m, 5m, 15m, 1hr

    /**
     * Number of seconds the job can run before timing out.
     *
     * @var int
     */
    public int $timeout = 30;

    /**
     * Create a new job instance.
     *
     * @param Order $order
     */
    public function __construct(public Order $order) {}

    /**
     * Execute the job.
     *
     * @param CarryBeeService $service
     * @return void
     */
    public function handle(CarryBeeService $service): void
    {
        Log::info("Processing CarryBee dispatch for Order #{$this->order->order_number} (Attempt: {$this->attempts()})");

        $delivery = Delivery::firstOrCreate(
            ['order_id' => $this->order->id],
            [
                'courier' => 'CarryBee',
                'status' => Delivery::STATUS_PENDING,
            ]
        );

        $result = $service->createConsignment($this->order);

        $delivery->update([
            'courier' => 'CarryBee',
            'consignment_id' => $result['consignment_id'] ?? null,
            'tracking_code' => $result['tracking_code'] ?? null,
            'delivery_fee' => $result['delivery_fee'] ?? 60.00,
            'status' => Delivery::STATUS_DISPATCHED,
            'request_payload' => $result['request_payload'] ?? null,
            'response_payload' => $result['response_payload'] ?? null,
            'failure_reason' => null,
            'dispatched_at' => now(),
        ]);

        $this->order->update(['status' => Order::STATUS_DISPATCHED]);

        Log::info("Order #{$this->order->order_number} successfully dispatched to CarryBee. Consignment: {$result['consignment_id']}");
    }

    /**
     * Handle a job failure.
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("CarryBee dispatch permanently failed for Order #{$this->order->order_number}: {$exception->getMessage()}", [
            'order_id' => $this->order->id,
            'exception' => $exception->getTraceAsString(),
        ]);

        Delivery::updateOrCreate(
            ['order_id' => $this->order->id],
            [
                'courier' => 'CarryBee',
                'status' => Delivery::STATUS_FAILED,
                'failure_reason' => $exception->getMessage(),
            ]
        );
    }
}
