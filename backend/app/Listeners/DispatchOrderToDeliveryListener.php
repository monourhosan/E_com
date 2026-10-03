<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Jobs\DispatchCarryBeeOrderJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class DispatchOrderToDeliveryListener
{
    /**
     * Create the event listener.
     */
    public function __construct() {}

    /**
     * Handle the event.
     *
     * @param OrderPaid $event
     * @return void
     */
    public function handle(OrderPaid $event): void
    {
        Log::info("DispatchOrderToDeliveryListener triggered for Order #{$event->order->order_number}");

        // Dispatch queued job on 'deliveries' queue
        DispatchCarryBeeOrderJob::dispatch($event->order)->onQueue('deliveries');
    }
}
