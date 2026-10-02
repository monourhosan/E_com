<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('sku', 100)->unique();
            $table->string('category', 100)->default('General')->index();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('stock')->default(0);
            $table->string('status', 20)->default('active')->index(); // 'active', 'draft', 'archived'
            $table->string('image_url', 500)->nullable();
            $table->timestamps();

            // Composite index for ultra-fast storefront catalog queries
            $table->index(['status', 'created_at']);
            $table->index(['status', 'category']);
        });

        // Crucial Database Integrity Constraint: PostgreSQL CHECK constraint
        // Ensures stock can never be reduced below zero, preventing race conditions and overselling
        DB::statement('ALTER TABLE products ADD CONSTRAINT check_stock_non_negative CHECK (stock >= 0);');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
