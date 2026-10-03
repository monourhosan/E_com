<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'customer_email' => $this->customer_email,
            'shipping_address' => $this->shipping_address,
            'subtotal' => (float) $this->subtotal,
            'formatted_subtotal' => '$' . number_format($this->subtotal, 2),
            'tax' => (float) $this->tax,
            'formatted_tax' => '$' . number_format($this->tax, 2),
            'shipping_fee' => (float) $this->shipping_fee,
            'formatted_shipping_fee' => '$' . number_format($this->shipping_fee, 2),
            'total_amount' => (float) $this->total_amount,
            'formatted_total_amount' => '$' . number_format($this->total_amount, 2),
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->items?->count() ?? 0,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
