<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    /**
     * Display a paginated listing of active products for the public storefront.
     * High-speed caching for storefront product listings with tag-based invalidation.
     *
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $cacheKey = 'products_page_' . md5(json_encode($request->all()));

        $fetcher = function () use ($request) {
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
            return $query->paginate($perPage);
        };

        try {
            $products = Cache::tags(['products'])->remember($cacheKey, 300, $fetcher);
        } catch (\BadMethodCallException) {
            $products = Cache::remember($cacheKey, 300, $fetcher);
        }

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
        $cacheKey = 'product_item_' . $idOrSku;
        $fetcher = function () use ($idOrSku) {
            return is_numeric($idOrSku)
                ? Product::query()->active()->find($idOrSku)
                : Product::query()->active()->where('sku', $idOrSku)->first();
        };

        try {
            $product = Cache::tags(['products'])->remember($cacheKey, 300, $fetcher);
        } catch (\BadMethodCallException) {
            $product = Cache::remember($cacheKey, 300, $fetcher);
        }

        if (! $product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Product not found or currently unavailable.',
            ], 404);
        }

        return new ProductResource($product);
    }
}
