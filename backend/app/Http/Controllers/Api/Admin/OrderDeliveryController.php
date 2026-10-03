<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Jobs\DispatchCarryBeeOrderJob;
use App\Models\Delivery;
use App\Models\Order;
use App\Services\Delivery\CarryBeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderDeliveryController extends Controller
{
    /**
     * List all orders for administrative management.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['items.product', 'delivery', 'latestPayment'])
            ->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'ilike', "%{$search}%")
                    ->orWhere('customer_name', 'ilike', "%{$search}%")
                    ->orWhere('customer_phone', 'ilike', "%{$search}%")
                    ->orWhere('customer_email', 'ilike', "%{$search}%");
            });
        }

        $orders = $query->paginate($request->integer('per_page', 15));

        return response()->json($orders);
    }

    /**
     * Show detailed order information.
     *
     * @param string|int $id
     * @return JsonResponse
     */
    public function show(string|int $id): JsonResponse
    {
        $order = Order::with(['items', 'items.product', 'delivery', 'payments', 'latestPayment'])
            ->where(function ($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id)->orWhere('order_number', (string) $id);
                } else {
                    $q->where('order_number', $id);
                }
            })
            ->firstOrFail();

        return response()->json([
            'order' => $order,
            'delivery' => $order->delivery,
        ]);
    }

    /**
     * Manually dispatch or retry CarryBee delivery job for an order.
     *
     * @param Request $request
     * @param string|int $id
     * @param CarryBeeService $carryBeeService
     * @return JsonResponse
     */
    public function dispatchDelivery(Request $request, string|int $id, CarryBeeService $carryBeeService): JsonResponse
    {
        $order = Order::with(['delivery', 'items'])
            ->where(function ($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id)->orWhere('order_number', (string) $id);
                } else {
                    $q->where('order_number', $id);
                }
            })
            ->firstOrFail();

        if ($order->status === Order::STATUS_CANCELLED) {
            return response()->json([
                'message' => 'Cannot dispatch cancelled orders to delivery.',
            ], 422);
        }

        // If requested synchronously (e.g., immediate test or dev override)
        if ($request->boolean('sync', false)) {
            try {
                $delivery = Delivery::firstOrCreate(
                    ['order_id' => $order->id],
                    [
                        'courier' => 'CarryBee',
                        'status' => Delivery::STATUS_PENDING,
                    ]
                );

                $result = $carryBeeService->createConsignment($order);

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

                $order->update(['status' => Order::STATUS_DISPATCHED]);

                return response()->json([
                    'message' => 'Order successfully dispatched to CarryBee synchronously.',
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'delivery' => $delivery->fresh(),
                ]);
            } catch (\Throwable $e) {
                Delivery::updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'courier' => 'CarryBee',
                        'status' => Delivery::STATUS_FAILED,
                        'failure_reason' => $e->getMessage(),
                    ]
                );

                return response()->json([
                    'message' => 'CarryBee delivery dispatch failed: ' . $e->getMessage(),
                ], 500);
            }
        }

        // Asynchronous queue dispatch (Strict Architecture Requirement)
        DispatchCarryBeeOrderJob::dispatch($order)->onQueue('deliveries');

        return response()->json([
            'message' => "CarryBee delivery job queued for order #{$order->order_number}.",
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'status' => 'queued',
            'delivery' => $order->delivery,
        ]);
    }

    /**
     * Retrieve delivery details and CarryBee tracking log for an order.
     *
     * @param Request $request
     * @param string|int $id
     * @param CarryBeeService $carryBeeService
     * @return JsonResponse
     */
    public function deliveryStatus(Request $request, string|int $id, CarryBeeService $carryBeeService): JsonResponse
    {
        $order = Order::with(['delivery'])
            ->where(function ($q) use ($id) {
                if (is_numeric($id)) {
                    $q->where('id', $id)->orWhere('order_number', (string) $id);
                } else {
                    $q->where('order_number', $id);
                }
            })
            ->firstOrFail();

        $delivery = $order->delivery;

        if (! $delivery) {
            return response()->json([
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'has_delivery' => false,
                'delivery' => null,
                'tracking' => null,
                'message' => 'No delivery record found for this order.',
            ]);
        }

        $tracking = null;
        if ($delivery->consignment_id) {
            $tracking = $carryBeeService->trackConsignment($delivery->consignment_id);
        }

        return response()->json([
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'has_delivery' => true,
            'delivery' => $delivery,
            'tracking' => $tracking,
        ]);
    }

    /**
     * Update order status with stock adjustment if cancelling.
     *
     * @param Request $request
     * @param string|int $id
     * @return JsonResponse
     */
    public function updateStatus(Request $request, string|int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending_payment,paid,dispatched,completed,cancelled'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($id, $validated) {
            $order = Order::with('items')
                ->where(function ($q) use ($id) {
                    if (is_numeric($id)) {
                        $q->where('id', $id)->orWhere('order_number', (string) $id);
                    } else {
                        $q->where('order_number', $id);
                    }
                })
                ->lockForUpdate()
                ->firstOrFail();

            $oldStatus = $order->status;
            $newStatus = $validated['status'];

            // If cancelling an order that was NOT already cancelled, restore inventory stock
            if ($newStatus === Order::STATUS_CANCELLED && $oldStatus !== Order::STATUS_CANCELLED) {
                foreach ($order->items as $item) {
                    $product = \App\Models\Product::where('id', $item->product_id)
                        ->lockForUpdate()
                        ->first();

                    if ($product) {
                        $product->increment('stock', $item->quantity);

                        \App\Models\InventoryLog::create([
                            'product_id' => $product->id,
                            'quantity_change' => $item->quantity,
                            'balance_after' => $product->fresh()->stock,
                            'reference_type' => 'manual_admin_order_cancellation',
                            'reference_id' => $order->id,
                        ]);
                    }
                }
            }

            $orderNotes = $order->notes;
            if (! empty($validated['notes'])) {
                $orderNotes = ($orderNotes ? $orderNotes . ' | ' : '') . $validated['notes'];
            }

            $order->update([
                'status' => $newStatus,
                'notes' => $orderNotes,
            ]);

            return response()->json([
                'status' => 'ok',
                'message' => "Order #{$order->order_number} status updated to {$newStatus}.",
                'order' => $order->fresh(['items', 'delivery']),
            ]);
        });
    }
}
