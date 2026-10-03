<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'order_id' => $this->order_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_sku' => $this->product_sku,
            'unit_price' => (float) $this->unit_price,
            'formatted_unit_price' => '$' . number_format($this->unit_price, 2),
            'quantity' => (int) $this->quantity,
            'subtotal' => (float) $this->subtotal,
            'formatted_subtotal' => '$' . number_format($this->subtotal, 2),
            'image_url' => $this->product?->image_url ?? null,
        ];
    }
}
