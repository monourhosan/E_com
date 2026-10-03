<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CodPaymentService implements PaymentGatewayInterface
{
    /**
     * Initiate Cash on Delivery payment.
     */
    public function initiatePayment(Order $order): array
    {
        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => Payment::GATEWAY_COD,
            'amount' => $order->total_amount,
            'currency' => 'BDT',
            'status' => Payment::STATUS_SUCCESSFUL,
            'payment_id' => 'COD_' . date('Ymd') . '_' . strtoupper(Str::random(8)),
            'transaction_id' => 'COD_TRX_' . date('Ymd') . '_' . strtoupper(Str::random(8)),
            'raw_payload' => ['method' => 'cash_on_delivery'],
            'verified_at' => now(),
        ]);

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));

        return [
            'gateway' => 'cod',
            'payment_id' => $payment->payment_id,
            'payment_record_id' => $payment->id,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'order_number' => $order->order_number,
            'redirect_url' => "{$frontendUrl}/order-confirmation/{$order->order_number}",
            'is_sandbox' => false,
        ];
    }

    /**
     * Verify Cash on Delivery.
     */
    public function verifyPayment(Request $request): PaymentResult
    {
        $paymentId = $request->input('payment_id');
        $payment = Payment::where('gateway', Payment::GATEWAY_COD)
            ->where('payment_id', $paymentId)
            ->first();

        if (! $payment) {
            return PaymentResult::failure('Cash on Delivery payment record not found.');
        }

        return PaymentResult::success(
            $payment->transaction_id ?? ('COD_' . date('Ymd')),
            $payment->id,
            $request->all()
        );
    }

    /**
     * Refund Cash on Delivery.
     */
    public function refund(Payment $payment, ?float $amount = null): bool
    {
        return true;
    }
}
