<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'sku',
        'category',
        'description',
        'price',
        'stock',
        'status',
        'image_url',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'float',
            'stock' => 'integer',
        ];
    }

    /**
     * Scope a query to only include active products for the storefront.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to search by product name, SKU, or category.
     *
     * @param Builder $query
     * @param string|null $term
     * @return Builder
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (empty($term)) {
            return $query;
        }

        $cleanTerm = trim($term);

        return $query->where(function (Builder $q) use ($cleanTerm) {
            $q->where('name', 'ilike', "%{$cleanTerm}%")
              ->orWhere('sku', 'ilike', "%{$cleanTerm}%")
              ->orWhere('category', 'ilike', "%{$cleanTerm}%");
        });
    }

    /**
     * Determine if product has stock available.
     *
     * @return bool
     */
    public function isInStock(): bool
    {
        return $this->stock > 0;
    }

    /**
     * Get human-readable stock status badge tag.
     *
     * @return string
     */
    public function getStockStatusAttribute(): string
    {
        if ($this->stock <= 0) {
            return 'out_of_stock';
        }

        if ($this->stock <= 5) {
            return 'low_stock';
        }

        return 'in_stock';
    }
}
