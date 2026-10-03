<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLog extends Model
{
    use HasFactory;

    /**
     * Disable updated_at timestamp since logs are append-only.
     */
    public const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'quantity_change',
        'balance_after',
        'reference_type',
        'reference_id',
        'created_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_change' => 'integer',
            'balance_after' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    /**
     * An inventory log belongs to a product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
