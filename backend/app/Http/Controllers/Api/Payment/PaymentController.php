<?php

namespace App\Http\Controllers\Api\Payment;

use App\Events\OrderPaid;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\Payment\PaymentGatewayFactory;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Initiate payment transaction for a pending order.
     *
     * @param string $orderNumber
     * @param Request $request
     * @param PaymentGatewayFactory $factory
     * @return JsonResponse
     */
    public function initiate(string $orderNumber, Request $request, PaymentGatewayFactory $factory): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)->first();

        if (! $order) {
            return response()->json(['message' => "Order #{$orderNumber} not found."], 404);
        }

        if ($order->status !== Order::STATUS_PENDING_PAYMENT) {
            return response()->json([
                'message' => "Order #{$orderNumber} is not in pending payment status (Current: {$order->status}).",
                'current_status' => $order->status,
            ], 422);
        }

        $gateway = $request->input('gateway', $order->payment_method);

        try {
            $service = $factory->make($gateway, checkEnabled: true);
            $initData = $service->initiatePayment($order);

            return response()->json([
                'status' => 'ok',
                'message' => 'Payment initiated successfully.',
                'data' => $initData,
            ], 200);
        } catch (DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Payment initiation error', [
                'order_number' => $orderNumber,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to initiate payment transaction.',
                'error' => config('app.debug') ? $e->getMessage() : 'Gateway communication failure',
            ], 500);
        }
    }

    /**
     * Handle payment verification callback with strict idempotency and row-level locking.
     *
     * @param string $gateway
     * @param Request $request
     * @param PaymentGatewayFactory $factory
     * @return JsonResponse
     */
    public function callback(string $gateway, Request $request, PaymentGatewayFactory $factory): JsonResponse
    {
        try {
            return DB::transaction(function () use ($gateway, $request, $factory) {
                $service = $factory->make($gateway, checkEnabled: false);
                $result = $service->verifyPayment($request);

                if (! $result->paymentRecordId) {
                    return response()->json([
                        'message' => 'Payment record identifier not found in callback payload.',
                        'reason' => $result->errorMessage,
                    ], 400);
                }

                /** @var Payment $payment */
                $payment = Payment::where('id', $result->paymentRecordId)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Idempotency: If already marked successful, return 200 OK without duplicate side-effects
                if ($payment->status === Payment::STATUS_SUCCESSFUL) {
                    return response()->json([
                        'message' => 'Payment already processed successfully',
                        'status' => 'already_processed',
                        'order_number' => $payment->order?->order_number,
                    ], 200);
                }

                if ($result->isSuccessful) {
                    $payment->update([
                        'status' => Payment::STATUS_SUCCESSFUL,
                        'transaction_id' => $result->transactionId,
                        'raw_payload' => $request->all(),
                        'verified_at' => now(),
                    ]);

                    $order = $payment->order;
                    $order->update(['status' => Order::STATUS_PAID]);

                    // Fire OrderPaid event for downstream processing (CarryBee delivery in Part 7)
                    event(new OrderPaid($order));

                    return response()->json([
                        'message' => 'Payment verified successfully',
                        'status' => 'successful',
                        'order_number' => $order->order_number,
                        'transaction_id' => $result->transactionId,
                    ], 200);
                } else {
                    $payment->update([
                        'status' => Payment::STATUS_FAILED,
                        'raw_payload' => $request->all(),
                    ]);

                    $payment->order->update(['status' => Order::STATUS_PENDING_PAYMENT]);

                    return response()->json([
                        'message' => 'Payment failed',
                        'status' => 'failed',
                        'reason' => $result->errorMessage,
                    ], 400);
                }
            }, attempts: 3);
        } catch (\Throwable $e) {
            Log::error('Payment callback verification error', [
                'gateway' => $gateway,
                'payload' => $request->all(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'An error occurred during payment verification.',
                'error' => config('app.debug') ? $e->getMessage() : 'Verification processing error',
            ], 500);
        }
    }

    /**
     * Public storefront endpoint to retrieve currently enabled payment methods.
     *
     * @return JsonResponse
     */
    public function getPaymentMethods(): JsonResponse
    {
        $settings = Setting::getPaymentMethods();

        return response()->json([
            'status' => 'ok',
            'methods' => [
                'bkash' => (bool) ($settings['bkash_enabled'] ?? true),
                'sslcommerz' => (bool) ($settings['sslcommerz_enabled'] ?? true),
                'cod' => (bool) ($settings['cod_enabled'] ?? true),
            ],
            'active_gateway' => $settings['active_gateway'] ?? 'bkash',
            'sandbox_mode' => (bool) ($settings['sandbox_mode'] ?? true),
        ]);
    }
}
