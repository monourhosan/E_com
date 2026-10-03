<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryLog;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * List all products with stock indicators and filter options.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->latest();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('sku', 'ilike', "%{$search}%");
            });
        }

        if ($stockStatus = $request->query('stock_status')) {
            match ($stockStatus) {
                'out_of_stock' => $query->where('stock', '<=', 0),
                'low_stock' => $query->where('stock', '>', 0)->where('stock', '<=', 5),
                'in_stock' => $query->where('stock', '>', 5),
                default => null,
            };
        }

        $products = $query->paginate($request->integer('per_page', 15));

        return response()->json($products);
    }

    /**
     * Atomically adjust product inventory stock with audit logging.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function adjust(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity_change' => ['required', 'integer', 'not_in:0'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $product = Product::where('id', $validated['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $newStock = $product->stock + $validated['quantity_change'];

            if ($newStock < 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Adjustment rejected: would cause negative stock ({$newStock}). Current available stock is {$product->stock}.",
                ], 422);
            }

            $product->stock = $newStock;
            $product->save();

            $log = InventoryLog::create([
                'product_id' => $product->id,
                'quantity_change' => $validated['quantity_change'],
                'balance_after' => $product->stock,
                'reference_type' => 'manual_admin_adjustment',
                'reference_id' => $request->user()?->id ?? 1,
            ]);

            return response()->json([
                'status' => 'ok',
                'message' => "Inventory updated successfully for {$product->name}.",
                'product' => $product->fresh(),
                'log' => $log,
            ]);
        });
    }

    /**
     * Retrieve paginated inventory audit trail.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logs(Request $request): JsonResponse
    {
        $query = InventoryLog::with('product')
            ->latest('id');

        if ($productId = $request->query('product_id')) {
            $query->where('product_id', $productId);
        }

        $logs = $query->paginate($request->integer('per_page', 15));

        return response()->json($logs);
    }
}
