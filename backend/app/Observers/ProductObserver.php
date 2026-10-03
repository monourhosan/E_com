<?php

namespace App\Observers;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductObserver
{
    /**
     * Invalidate product catalog cache upon any mutation.
     */
    protected function clearProductCache(): void
    {
        try {
            Cache::tags(['products'])->flush();
            Log::info('Product cache flushed via tags.');
        } catch (\BadMethodCallException) {
            Cache::flush();
            Log::info('Product cache cleared globally.');
        }
    }

    /**
     * Handle the Product "created" event.
     */
    public function created(Product $product): void
    {
        $this->clearProductCache();
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        $this->clearProductCache();
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        $this->clearProductCache();
    }

    /**
     * Handle the Product "restored" event.
     */
    public function restored(Product $product): void
    {
        $this->clearProductCache();
    }
}
