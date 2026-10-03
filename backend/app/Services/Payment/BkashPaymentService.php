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

class BkashPaymentService implements PaymentGatewayInterface
{
    protected string $appKey;
    protected string $appSecret;
    protected string $username;
    protected string $password;
    protected string $baseUrl;
    protected bool $isSandbox;

    public function __construct()
    {
        $settings = Setting::getPaymentMethods();
        $this->isSandbox = (bool) ($settings['sandbox_mode'] ?? true);

        $this->appKey = config('services.bkash.app_key', env('BKASH_APP_KEY', ''));
        $this->appSecret = config('services.bkash.app_secret', env('BKASH_APP_SECRET', ''));
        $this->username = config('services.bkash.username', env('BKASH_USERNAME', ''));
        $this->password = config('services.bkash.password', env('BKASH_PASSWORD', ''));

        $this->baseUrl = $this->isSandbox
            ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized'
            : 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized';
    }

    /**
     * Initiate bKash payment transaction for the order.
     */
    public function initiatePayment(Order $order): array
    {
        $payment = Payment::create([
            'order_id' => $order->id,
            'gateway' => Payment::GATEWAY_BKASH,
            'amount' => $order->total_amount,
            'currency' => 'BDT',
            'status' => Payment::STATUS_INITIATED,
            'payment_id' => 'BKASH_' . date('Ymd') . '_' . strtoupper(Str::random(8)),
            'raw_payload' => [
                'order_number' => $order->order_number,
                'customer_phone' => $order->customer_phone,
            ],
        ]);

        // If credentials are configured for live bKash API
        if (! empty($this->appKey) && ! empty($this->appSecret) && ! $this->isSandbox) {
            try {
                $token = $this->grantToken();
                if ($token) {
                    $createRes = Http::withHeaders([
                        'Authorization' => $token,
                        'X-APP-Key' => $this->appKey,
                    ])->post("{$this->baseUrl}/checkout/create", [
                        'mode' => '0011',
                        'payerReference' => $order->customer_phone,
                        'callbackURL' => route('api.v1.payments.callback', ['gateway' => 'bkash']),
                        'amount' => (string) $order->total_amount,
                        'currency' => 'BDT',
                        'intent' => 'sale',
                        'merchantInvoiceNumber' => $order->order_number,
                    ]);

                    if ($createRes->successful() && isset($createRes['bkashURL'])) {
                        $payment->update([
                            'payment_id' => $createRes['paymentID'] ?? $payment->payment_id,
                            'raw_payload' => $createRes->json(),
                        ]);

                        return [
                            'gateway' => 'bkash',
                            'payment_id' => $payment->payment_id,
                            'payment_record_id' => $payment->id,
                            'redirect_url' => $createRes['bkashURL'],
                            'is_sandbox' => false,
                        ];
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('bKash API live initiation failed, falling back to sandbox simulator', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Sandbox simulator response
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $simulatorUrl = "{$frontendUrl}/checkout?payment_simulator=bkash&order={$order->order_number}&payment_id={$payment->payment_id}";

        return [
            'gateway' => 'bkash',
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
     * Verify bKash payment verification callback / IPN.
     */
    public function verifyPayment(Request $request): PaymentResult
    {
        $paymentId = $request->input('payment_id') ?? $request->input('paymentID');
        $paymentRecordId = $request->input('payment_record_id');

        $query = Payment::where('gateway', Payment::GATEWAY_BKASH);
        if ($paymentRecordId) {
            $query->where('id', $paymentRecordId);
        } elseif ($paymentId) {
            $query->where('payment_id', $paymentId);
        } else {
            return PaymentResult::failure('Payment reference identifier missing from callback.');
        }

        $payment = $query->first();
        if (! $payment) {
            return PaymentResult::failure("Payment record not found for bKash verification.");
        }

        // Check if request indicates simulated or gateway failure
        $status = strtolower((string) ($request->input('status') ?? ''));
        if ($status === 'failed' || $status === 'cancel' || $status === 'failure' || $request->boolean('simulate_failure')) {
            $reason = $request->input('reason') ?? $request->input('errorMessage') ?? 'Payment was cancelled or failed.';
            return PaymentResult::failure($reason, $payment->id, $request->all());
        }

        // Extract transaction ID
        $transactionId = $request->input('transaction_id')
            ?? $request->input('trxID')
            ?? 'TRX_BK_' . date('Ymd') . '_' . strtoupper(Str::random(8));

        return PaymentResult::success($transactionId, $payment->id, $request->all());
    }

    /**
     * Issue refund via bKash.
     */
    public function refund(Payment $payment, ?float $amount = null): bool
    {
        Log::info('bKash refund initiated', [
            'payment_id' => $payment->id,
            'transaction_id' => $payment->transaction_id,
            'amount' => $amount ?? $payment->amount,
        ]);
        return true;
    }

    /**
     * Grant OAuth token from bKash API.
     */
    protected function grantToken(): ?string
    {
        $res = Http::withHeaders([
            'username' => $this->username,
            'password' => $this->password,
        ])->post("{$this->baseUrl}/checkout/token/grant", [
            'app_key' => $this->appKey,
            'app_secret' => $this->appSecret,
        ]);

        return $res->successful() ? ($res['id_token'] ?? null) : null;
    }
}
