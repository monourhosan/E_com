<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Order extends Model
{
    use HasFactory;

    /**
     * Order status constants
     */
    public const STATUS_PENDING_PAYMENT = 'pending_payment';
    public const STATUS_PAID = 'paid';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_DISPATCHED = 'dispatched';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'order_number',
        'customer_name',
        'customer_phone',
        'customer_email',
        'shipping_address',
        'subtotal',
        'tax',
        'shipping_fee',
        'total_amount',
        'status',
        'payment_method',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'float',
            'tax' => 'float',
            'shipping_fee' => 'float',
            'total_amount' => 'float',
        ];
    }

    /**
     * An order has many order items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Products ordered in this order.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'order_items')
            ->withPivot(['product_name', 'product_sku', 'unit_price', 'quantity', 'subtotal'])
            ->withTimestamps();
    }

    /**
     * Formatted total amount string.
     */
    public function getFormattedTotalAmountAttribute(): string
    {
        return '$' . number_format($this->total_amount, 2);
    }

    /**
     * Formatted subtotal string.
     */
    public function getFormattedSubtotalAttribute(): string
    {
        return '$' . number_format($this->subtotal, 2);
    }

    /**
     * Formatted tax string.
     */
    public function getFormattedTaxAttribute(): string
    {
        return '$' . number_format($this->tax, 2);
    }

    /**
     * Formatted shipping fee string.
     */
    public function getFormattedShippingFeeAttribute(): string
    {
        return '$' . number_format($this->shipping_fee, 2);
    }
}
