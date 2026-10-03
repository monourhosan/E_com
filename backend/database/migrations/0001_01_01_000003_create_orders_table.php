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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 32)->unique();
            $table->string('customer_name', 150);
            $table->string('customer_phone', 30);
            $table->string('customer_email', 150)->index();
            $table->text('shipping_address');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax', 12, 2);
            $table->decimal('shipping_fee', 12, 2);
            $table->decimal('total_amount', 12, 2);
            $table->string('status', 30)->default('pending_payment')->index();
            $table->string('payment_method', 50); // e.g. bkash, sslcommerz, cod
            $table->text('notes')->nullable();
            $table->timestamps();

            // Additional composite index for performance
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
