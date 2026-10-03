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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('gateway', 50)->index(); // 'bkash', 'sslcommerz', 'cod'
            $table->string('transaction_id', 150)->nullable();
            $table->string('payment_id', 150)->nullable()->index(); // gateway internal identifier
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('BDT');
            $table->string('status', 30)->default('initiated')->index(); // 'initiated', 'successful', 'failed', 'cancelled'
            $table->json('raw_payload')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            // Prevent duplicate transaction records for the same gateway
            $table->unique(['gateway', 'transaction_id']);
            $table->index(['order_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
