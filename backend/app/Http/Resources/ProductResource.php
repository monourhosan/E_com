<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'category' => $this->category ?? 'General',
            'description' => $this->description,
            'price' => (float) $this->price,
            'formatted_price' => '$' . number_format($this->price, 2),
            'stock' => (int) $this->stock,
            'status' => $this->status,
            'image_url' => $this->image_url ?? '/images/products/placeholder.webp',
            'is_in_stock' => $this->stock > 0,
            'stock_badge' => $this->stock_status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
