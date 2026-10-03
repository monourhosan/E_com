<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentResult;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Initiate payment transaction for the given order.
     * Returns an array with redirect_url, payment_id, or token.
     *
     * @param Order $order
     * @return array<string, mixed>
     */
    public function initiatePayment(Order $order): array;

    /**
     * Verify payment callback / webhook payload from gateway.
     * Returns a normalized PaymentResult DTO.
     *
     * @param Request $request
     * @return PaymentResult
     */
    public function verifyPayment(Request $request): PaymentResult;

    /**
     * Issue full or partial refund for a processed payment.
     *
     * @param Payment $payment
     * @param float|null $amount
     * @return bool
     */
    public function refund(Payment $payment, ?float $amount = null): bool;
}
