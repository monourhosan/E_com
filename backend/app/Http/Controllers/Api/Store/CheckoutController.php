<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Http\Requests\Store\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class CheckoutController extends Controller
{
    /**
     * Process customer checkout atomically.
     * Recalculates prices, verifies inventory with row-locking, deducts stock, and creates order records.
     *
     * @param CheckoutRequest $request
     * @param OrderService $orderService
     * @return JsonResponse
     */
    public function checkout(CheckoutRequest $request, OrderService $orderService): JsonResponse
    {
        try {
            $order = $orderService->createOrder($request->validated());

            return (new OrderResource($order))
                ->response()
                ->setStatusCode(201);
        } catch (DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], 422);
        } catch (Throwable $e) {
            Log::error('Order checkout processing failed', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred while placing your order. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Order processing failed.',
            ], 500);
        }
    }

    /**
     * Retrieve order details by unique order number for confirmation and tracking.
     *
     * @param string $orderNumber
     * @return JsonResponse
     */
    public function show(string $orderNumber): JsonResponse
    {
        $order = Order::with(['items', 'items.product', 'delivery', 'latestPayment'])
            ->where('order_number', $orderNumber)
            ->first();

        if (! $order) {
            return response()->json([
                'message' => "Order '{$orderNumber}' not found.",
            ], 404);
        }

        return (new OrderResource($order))->response();
    }
}
