<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of all products for administrators.
     *
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $products = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return ProductResource::collection($products);
    }

    /**
     * Store a newly created product in storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['active', 'draft', 'archived'])],
            'image_url' => ['nullable', 'string', 'max:500'],
        ]);

        $product = Product::create($validated);

        return response()->json([
            'status' => 'ok',
            'message' => 'Product successfully created.',
            'data' => new ProductResource($product),
        ], 201);
    }

    /**
     * Display the specified product.
     *
     * @param Product $product
     * @return ProductResource
     */
    public function show(Product $product): ProductResource
    {
        return new ProductResource($product);
    }

    /**
     * Update the specified product in storage.
     *
     * @param Request $request
     * @param Product $product
     * @return JsonResponse
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($product->id),
            ],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'status' => ['sometimes', 'required', Rule::in(['active', 'draft', 'archived'])],
            'image_url' => ['nullable', 'string', 'max:500'],
        ]);

        $product->update($validated);

        return response()->json([
            'status' => 'ok',
            'message' => 'Product successfully updated.',
            'data' => new ProductResource($product->fresh()),
        ], 200);
    }

    /**
     * Remove the specified product or mark as archived.
     *
     * @param Product $product
     * @return JsonResponse
     */
    public function destroy(Product $product): JsonResponse
    {
        // Soft archive instead of hard delete to maintain foreign key integrity
        $product->update(['status' => 'archived']);

        return response()->json([
            'status' => 'ok',
            'message' => "Product '{$product->name}' marked as archived.",
        ], 200);
    }
}
