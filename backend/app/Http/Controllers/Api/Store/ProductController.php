<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * Display a paginated listing of active products for the public storefront.
     *
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query()->active();

        // Keyword Search (Name, SKU, Category)
        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        // Category Filter
        if ($request->filled('category') && $request->input('category') !== 'All') {
            $query->where('category', $request->input('category'));
        }

        // Price Range Filtering
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->input('min_price'));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->input('max_price'));
        }

        // Sorting
        $sort = $request->input('sort', 'latest');
        match ($sort) {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $perPage = min((int) $request->input('per_page', 12), 50);
        $products = $query->paginate($perPage);

        return ProductResource::collection($products);
    }

    /**
     * Display the specified product by ID or SKU.
     *
     * @param string $idOrSku
     * @return JsonResponse|ProductResource
     */
    public function show(string $idOrSku): JsonResponse|ProductResource
    {
        $product = is_numeric($idOrSku)
            ? Product::query()->active()->find($idOrSku)
            : Product::query()->active()->where('sku', $idOrSku)->first();

        if (! $product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Product not found or currently unavailable.',
            ], 404);
        }

        return new ProductResource($product);
    }
}
