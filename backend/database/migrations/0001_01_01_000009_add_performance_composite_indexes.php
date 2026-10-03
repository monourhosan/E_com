<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Products: Fast status + price sorting and range filtering
        Schema::table('products', function (Blueprint $table) {
            $table->index(['status', 'price'], 'products_status_price_idx');
        });

        // 2. Payments: Fast gateway + status lookup for callbacks and reports
        Schema::table('payments', function (Blueprint $table) {
            $table->index(['gateway', 'status'], 'payments_gateway_status_idx');
        });

        // 3. Orders: Ensure status + created_at and customer_email indexes
        Schema::table('orders', function (Blueprint $table) {
            // Check if composite index already created, otherwise add it
            if (! $this->hasIndex('orders', 'orders_status_created_at_idx') && ! $this->hasIndex('orders', 'orders_status_created_at_index')) {
                // If created by previous migration without custom name, ignore or add unique name
                try {
                    $table->index(['status', 'created_at'], 'orders_perf_status_created_at_idx');
                } catch (\Throwable) {
                    // Index already exists
                }
            }

            if (! $this->hasIndex('orders', 'orders_customer_email_index') && ! $this->hasIndex('orders', 'orders_customer_email_idx')) {
                try {
                    $table->index('customer_email', 'orders_perf_customer_email_idx');
                } catch (\Throwable) {
                    // Index already exists
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_status_price_idx');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_gateway_status_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            try {
                $table->dropIndex('orders_perf_status_created_at_idx');
            } catch (\Throwable) {}

            try {
                $table->dropIndex('orders_perf_customer_email_idx');
            } catch (\Throwable) {}
        });
    }

    /**
     * Check if table has a specific index.
     */
    protected function hasIndex(string $table, string $index): bool
    {
        try {
            $conn = Schema::getConnection();
            $dbSchema = $conn->getDoctrineSchemaManager();
            $indexes = $dbSchema->listTableIndexes($table);
            return array_key_exists(strtolower($index), array_change_key_case($indexes));
        } catch (\Throwable) {
            return false;
        }
    }
};
