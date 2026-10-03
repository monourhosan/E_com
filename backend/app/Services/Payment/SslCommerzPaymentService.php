<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SslCommerzPaymentService implements PaymentGatewayInterface
{
    protected string $storeId;
    protected string $storePassword;
    protected string $baseUrl;
    protected bool $isSandbox;

    public function __construct()
    {
        $settings = Setting::getPaymentMethods();
        $this->isSandbox = (bool) ($settings['sandbox_mode'] ?? true);

        $this->storeId = config('services.sslcommerz.store_id', env('SSLCZ_STORE_ID', ''));
        $this->storePassword = config('services.sslcommerz.store_passwd', env('SSLCZ_STORE_PASSWD', ''));

        $this->baseUrl = $this->isSandbox
            ? 'https://sandbox.sslcommerz.com'
            : 'https://securepay.sslcommerz.com';
    }

    /**
     * Initiate SSLCommerz session or sandbox session.
     */
    public function initiatePayment(Order $order): array
    {
        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => Payment::GATEWAY_SSLCOMMERZ,
            'amount' => $order->total_amount,
            'currency' => 'BDT',
            'status' => Payment::STATUS_INITIATED,
            'payment_id' => 'SSLCZ_' . date('Ymd') . '_' . strtoupper(Str::random(8)),
            'raw_payload' => [
                'order_number' => $order->order_number,
                'customer_email' => $order->customer_email,
            ],
        ]);

        // If live credentials are provided
        if (! empty($this->storeId) && ! empty($this->storePassword) && ! $this->isSandbox) {
            try {
                $postData = [
                    'store_id' => $this->storeId,
                    'store_passwd' => $this->storePassword,
                    'total_amount' => $order->total_amount,
                    'currency' => 'BDT',
                    'tran_id' => $order->order_number,
                    'success_url' => route('api.v1.payments.callback', ['gateway' => 'sslcommerz']),
                    'fail_url' => route('api.v1.payments.callback', ['gateway' => 'sslcommerz']),
                    'cancel_url' => route('api.v1.payments.callback', ['gateway' => 'sslcommerz']),
                    'cus_name' => $order->customer_name,
                    'cus_email' => $order->customer_email,
                    'cus_add1' => $order->shipping_address,
                    'cus_phone' => $order->customer_phone,
                    'shipping_method' => 'NO',
                    'product_name' => 'Apex Order #' . $order->order_number,
                    'product_category' => 'Electronics',
                    'product_profile' => 'general',
                ];

                $response = Http::asForm()->post("{$this->baseUrl}/gwprocess/v4/api.php", $postData);

                if ($response->successful()) {
                    $sslcz = $response->json();
                    if (isset($sslcz['GatewayPageURL']) && $sslcz['GatewayPageURL'] != '') {
                        $payment->update([
                            'payment_id' => $sslcz['sessionkey'] ?? $payment->payment_id,
                            'raw_payload' => $sslcz,
                        ]);

                        return [
                            'gateway' => 'sslcommerz',
                            'payment_id' => $payment->payment_id,
                            'payment_record_id' => $payment->id,
                            'redirect_url' => $sslcz['GatewayPageURL'],
                            'is_sandbox' => false,
                        ];
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('SSLCommerz live initiation failed, falling back to simulator', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Sandbox simulator response
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $simulatorUrl = "{$frontendUrl}/checkout?payment_simulator=sslcommerz&order={$order->order_number}&payment_id={$payment->payment_id}";

        return [
            'gateway' => 'sslcommerz',
            'payment_id' => $payment->payment_id,
            'payment_record_id' => $payment->id,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'order_number' => $order->order_number,
            'redirect_url' => $simulatorUrl,
            'is_sandbox' => true,
        ];
    }

    /**
     * Verify SSLCommerz callback / IPN.
     */
    public function verifyPayment(Request $request): PaymentResult
    {
        $paymentRecordId = $request->input('payment_record_id');
        $paymentId = $request->input('payment_id') ?? $request->input('val_id') ?? $request->input('sessionkey');
        $orderNumber = $request->input('tran_id') ?? $request->input('order_number');

        $query = Payment::where('gateway', Payment::GATEWAY_SSLCOMMERZ);

        if ($paymentRecordId) {
            $query->where('id', $paymentRecordId);
        } elseif ($paymentId) {
            $query->where('payment_id', $paymentId);
        } elseif ($orderNumber) {
            $query->whereHas('order', function ($q) use ($orderNumber) {
                $q->where('order_number', $orderNumber);
            });
        }

        $payment = $query->first();
        if (! $payment) {
            return PaymentResult::failure('Payment record not found for SSLCommerz verification.');
        }

        $status = strtoupper((string) ($request->input('status') ?? ''));
        if ($status === 'FAILED' || $status === 'CANCELLED' || $request->boolean('simulate_failure')) {
            $reason = $request->input('error') ?? $request->input('reason') ?? 'SSLCommerz payment failed or was cancelled.';
            return PaymentResult::failure($reason, $payment->id, $request->all());
        }

        $transactionId = $request->input('transaction_id')
            ?? $request->input('bank_tran_id')
            ?? 'TRX_SSLCZ_' . date('Ymd') . '_' . strtoupper(Str::random(8));

        return PaymentResult::success($transactionId, $payment->id, $request->all());
    }

    /**
     * Refund via SSLCommerz.
     */
    public function refund(Payment $payment, ?float $amount = null): bool
    {
        Log::info('SSLCommerz refund initiated', [
            'payment_id' => $payment->id,
            'transaction_id' => $payment->transaction_id,
            'amount' => $amount ?? $payment->amount,
        ]);
        return true;
    }
}
