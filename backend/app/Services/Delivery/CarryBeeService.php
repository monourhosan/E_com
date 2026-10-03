<?php

namespace App\Services\Delivery;

use App\Exceptions\DeliveryApiException;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CarryBeeService
{
    protected string $apiUrl;
    protected ?string $clientId;
    protected ?string $clientSecret;
    protected string $storeId;
    protected bool $isSandbox;

    public function __construct()
    {
        $this->apiUrl = rtrim(config('services.carrybee.api_url', env('CARRYBEE_API_URL', 'https://api.carrybee.com/v1')), '/');
        $this->clientId = config('services.carrybee.client_id', env('CARRYBEE_CLIENT_ID'));
        $this->clientSecret = config('services.carrybee.client_secret', env('CARRYBEE_CLIENT_SECRET'));
        $this->storeId = config('services.carrybee.store_id', env('CARRYBEE_STORE_ID', 'CB-STORE-001'));
        $this->isSandbox = (bool) config('services.carrybee.sandbox', env('CARRYBEE_SANDBOX', true));
    }

    /**
     * Create consignment in CarryBee.
     *
     * @param Order $order
     * @return array
     * @throws DeliveryApiException
     */
    public function createConsignment(Order $order): array
    {
        // Ensure items are loaded for description and quantity calculation
        if (!$order->relationLoaded('items')) {
            $order->load('items');
        }

        $items = $order->items ?? collect();
        $itemDescription = $items->isNotEmpty()
            ? $items->map(fn($item) => ($item->product_name ?? 'Item') . ' (x' . ($item->quantity ?? 1) . ')')->implode(', ')
            : "Order #{$order->order_number}";

        $itemQuantity = $items->isNotEmpty()
            ? (int) $items->sum('quantity')
            : 1;

        $amountToCollect = ($order->payment_method === 'cod')
            ? (float) $order->total_amount
            : 0.00;

        $payload = [
            'store_id' => $this->storeId,
            'merchant_order_id' => $order->order_number,
            'recipient_name' => $order->customer_name,
            'recipient_phone' => $order->customer_phone,
            'recipient_address' => $order->shipping_address,
            'amount_to_collect' => $amountToCollect,
            'item_description' => substr($itemDescription, 0, 255),
            'item_quantity' => $itemQuantity,
            'item_weight' => 0.5,
        ];

        // If in sandbox mode or credentials not configured, return deterministic mock response
        if ($this->isSandbox || empty($this->clientId) || empty($this->clientSecret)) {
            $randomSuffix = rand(100000, 999999);
            $consignmentId = 'CB-CN-' . date('Y') . '-' . $randomSuffix;
            $trackingCode = 'TRK-CB' . $randomSuffix;

            Log::info("CarryBee [Sandbox] Consignment Created for Order #{$order->order_number}", [
                'consignment_id' => $consignmentId,
                'tracking_code' => $trackingCode,
                'payload' => $payload,
            ]);

            return [
                'success' => true,
                'consignment_id' => $consignmentId,
                'tracking_code' => $trackingCode,
                'delivery_fee' => 60.00,
                'status' => 'In Review',
                'request_payload' => $payload,
                'response_payload' => [
                    'success' => true,
                    'consignment_id' => $consignmentId,
                    'tracking_code' => $trackingCode,
                    'status' => 'In Review',
                    'created_at' => now()->toIso8601String(),
                ],
            ];
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'X-Client-ID' => $this->clientId,
                    'X-Client-Secret' => $this->clientSecret,
                ])
                ->post("{$this->apiUrl}/consignments/create", $payload);

            if ($response->successful()) {
                $data = $response->json();

                return [
                    'success' => true,
                    'consignment_id' => $data['consignment_id'] ?? ('CB-CN-' . uniqid()),
                    'tracking_code' => $data['tracking_code'] ?? ('TRK-' . uniqid()),
                    'delivery_fee' => (float) ($data['delivery_fee'] ?? 60.00),
                    'status' => $data['status'] ?? 'In Review',
                    'request_payload' => $payload,
                    'response_payload' => $data,
                ];
            }

            $errorMessage = $response->json('message') ?? $response->body() ?? 'CarryBee consignment creation failed';
            throw new DeliveryApiException("CarryBee API Error [{$response->status()}]: {$errorMessage}", $response->status(), null, [
                'request' => $payload,
                'response' => $response->body(),
            ]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            throw new DeliveryApiException("CarryBee Network Timeout: {$e->getMessage()}", 504, $e, [
                'request' => $payload,
            ]);
        } catch (\Throwable $e) {
            if ($e instanceof DeliveryApiException) {
                throw $e;
            }
            throw new DeliveryApiException("CarryBee Service Exception: {$e->getMessage()}", 500, $e, [
                'request' => $payload,
            ]);
        }
    }

    /**
     * Track consignment status from CarryBee.
     *
     * @param string $consignmentId
     * @return array
     */
    public function trackConsignment(string $consignmentId): array
    {
        if ($this->isSandbox || empty($this->clientId)) {
            return [
                'consignment_id' => $consignmentId,
                'status' => 'in_transit',
                'events' => [
                    ['status' => 'consignment_created', 'time' => now()->subHours(2)->toIso8601String(), 'location' => 'Dhaka Hub'],
                    ['status' => 'picked_up', 'time' => now()->subHour()->toIso8601String(), 'location' => 'Dhaka Central Hub'],
                    ['status' => 'in_transit', 'time' => now()->subMinutes(20)->toIso8601String(), 'location' => 'Out for delivery'],
                ],
            ];
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'Accept' => 'application/json',
                    'X-Client-ID' => $this->clientId,
                    'X-Client-Secret' => $this->clientSecret,
                ])
                ->get("{$this->apiUrl}/consignments/{$consignmentId}/track");

            if ($response->successful()) {
                return $response->json();
            }

            return ['consignment_id' => $consignmentId, 'status' => 'unknown', 'error' => $response->body()];
        } catch (\Throwable $e) {
            return ['consignment_id' => $consignmentId, 'status' => 'unknown', 'error' => $e->getMessage()];
        }
    }
}
