<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartValidationController extends Controller
{
    /**
     * Standard Free Shipping Threshold.
     */
    public const FREE_SHIPPING_THRESHOLD = 1000.00;

    /**
     * Standard Flat Shipping Rate.
     */
    public const STANDARD_SHIPPING_FEE = 60.00;

    /**
     * Standard VAT / Tax Rate (5%).
     */
    public const TAX_RATE = 0.05;

    /**
     * Validate client-side cart items against the authoritative database.
     * Re-calculates prices, checks stock availability, and computes accurate taxes & shipping.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function validateCart(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $requestedItems = collect($validated['items']);
        $productIds = $requestedItems->pluck('product_id')->unique()->all();

        // Batch query all products in a single operation to eliminate N+1 queries
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $isValid = true;
        $errors = [];
        $calculatedItems = [];
        $subtotal = 0.0;

        foreach ($requestedItems as $item) {
            $productId = $item['product_id'];
            $requestedQty = (int) $item['quantity'];

            /** @var Product|null $product */
            $product = $products->get($productId);

            if (! $product || $product->status !== 'active') {
                $isValid = false;
                $errors[] = "Product ID {$productId} is not currently available for purchase.";
                continue;
            }

            // Verify live stock availability
            $availableStock = (int) $product->stock;
            if ($requestedQty > $availableStock) {
                $isValid = false;
                $errors[] = "Only {$availableStock} units available for '{$product->name}' (Requested: {$requestedQty}).";
            }

            $unitPrice = (float) $product->price;
            $lineSubtotal = round($unitPrice * $requestedQty, 2);
            $subtotal += $lineSubtotal;

            $calculatedItems[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category,
                'image_url' => $product->image_url,
                'unit_price' => $unitPrice,
                'formatted_unit_price' => '$' . number_format($unitPrice, 2),
                'quantity' => $requestedQty,
                'subtotal' => $lineSubtotal,
                'formatted_subtotal' => '$' . number_format($lineSubtotal, 2),
                'available_stock' => $availableStock,
                'is_stock_sufficient' => $requestedQty <= $availableStock,
            ];
        }

        $subtotal = round($subtotal, 2);
        $tax = round($subtotal * self::TAX_RATE, 2);
        $shippingFee = ($subtotal >= self::FREE_SHIPPING_THRESHOLD || $subtotal === 0.0) ? 0.00 : self::STANDARD_SHIPPING_FEE;
        $totalAmount = round($subtotal + $tax + $shippingFee, 2);

        return response()->json([
            'valid' => $isValid,
            'errors' => $errors,
            'items' => $calculatedItems,
            'summary' => [
                'subtotal' => $subtotal,
                'tax' => $tax,
                'tax_rate_percent' => self::TAX_RATE * 100,
                'shipping_fee' => $shippingFee,
                'free_shipping_threshold' => self::FREE_SHIPPING_THRESHOLD,
                'is_free_shipping' => $shippingFee === 0.00,
                'amount_needed_for_free_shipping' => max(0.00, round(self::FREE_SHIPPING_THRESHOLD - $subtotal, 2)),
                'total_amount' => $totalAmount,
                'formatted_subtotal' => '$' . number_format($subtotal, 2),
                'formatted_tax' => '$' . number_format($tax, 2),
                'formatted_shipping_fee' => '$' . number_format($shippingFee, 2),
                'formatted_total_amount' => '$' . number_format($totalAmount, 2),
            ],
        ], $isValid ? 200 : 422);
    }
}
