<?php

namespace App\Services;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    /**
     * Standard VAT / Tax rate (5%).
     */
    public const TAX_RATE = '0.05';

    /**
     * Free Shipping Threshold ($1000.00).
     */
    public const FREE_SHIPPING_THRESHOLD = '1000.00';

    /**
     * Standard Flat Rate Shipping Fee ($60.00).
     */
    public const STANDARD_SHIPPING_FEE = '60.00';

    /**
     * Atomically create an order with PostgreSQL pessimistic row-level locking (SELECT ... FOR UPDATE).
     * Guarantees stock NEVER drops below 0 even under heavy concurrent traffic.
     *
     * @param array $validatedData
     * @return Order
     * @throws DomainException
     */
    public function createOrder(array $validatedData): Order
    {
        return DB::transaction(function () use ($validatedData) {
            $subtotal = '0.00';
            $orderItemsData = [];

            // 1. Sort product IDs to prevent deadlocks across concurrent transactions
            $itemQuantities = collect($validatedData['items'])->keyBy('product_id');
            $productIds = $itemQuantities->keys()->sort()->values();

            // 2. Lock rows in PostgreSQL: SELECT * FROM products WHERE id IN (...) FOR UPDATE
            $products = Product::whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $pendingLogs = [];

            foreach ($itemQuantities as $productId => $itemData) {
                /** @var Product|null $product */
                $product = $products->get($productId);

                if (! $product || $product->status !== 'active') {
                    throw new DomainException("Product is unavailable or deactivated.");
                }

                if ($product->stock < $itemData['quantity']) {
                    throw new DomainException("Insufficient stock for product: {$product->name}. Remaining: {$product->stock}");
                }

                // Deduct stock atomically
                $product->decrement('stock', $itemData['quantity']);

                $freshStock = $product->fresh()->stock;

                $pendingLogs[] = [
                    'product_id' => $product->id,
                    'quantity_change' => -$itemData['quantity'],
                    'balance_after' => $freshStock,
                    'reference_type' => 'order_creation',
                ];

                $itemSubtotal = bcmul((string) $product->price, (string) $itemData['quantity'], 2);
                $subtotal = bcadd($subtotal, $itemSubtotal, 2);

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'unit_price' => (float) $product->price,
                    'quantity' => (int) $itemData['quantity'],
                    'subtotal' => (float) $itemSubtotal,
                ];
            }

            $tax = bcmul($subtotal, self::TAX_RATE, 2);
            $shippingFee = bccomp($subtotal, self::FREE_SHIPPING_THRESHOLD, 2) >= 0 ? '0.00' : self::STANDARD_SHIPPING_FEE;
            $total = bcadd(bcadd($subtotal, $tax, 2), $shippingFee, 2);

            // Generate unique human-readable order number: ORD-YYYYMMDD-XXXXXX
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_name' => $validatedData['customer_name'],
                'customer_phone' => $validatedData['customer_phone'],
                'customer_email' => $validatedData['customer_email'],
                'shipping_address' => $validatedData['shipping_address'],
                'subtotal' => (float) $subtotal,
                'tax' => (float) $tax,
                'shipping_fee' => (float) $shippingFee,
                'total_amount' => (float) $total,
                'status' => Order::STATUS_PENDING_PAYMENT,
                'payment_method' => $validatedData['payment_method'],
                'notes' => $validatedData['notes'] ?? null,
            ]);

            foreach ($orderItemsData as $item) {
                $order->items()->create($item);
            }

            // Create inventory audit logs with order number reference
            foreach ($pendingLogs as $log) {
                InventoryLog::create([
                    'product_id' => $log['product_id'],
                    'quantity_change' => $log['quantity_change'],
                    'balance_after' => $log['balance_after'],
                    'reference_type' => $log['reference_type'],
                    'reference_id' => $order->order_number,
                ]);
            }

            return $order->load(['items', 'items.product']);
        }, attempts: 3);
    }
}
