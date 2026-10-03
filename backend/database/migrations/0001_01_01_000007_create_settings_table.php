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
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->json('value');
            $table->timestamps();
        });

        // Seed default payment gateway configuration
        DB::table('settings')->insert([
            'key' => 'payment_methods',
            'value' => json_encode([
                'bkash_enabled' => true,
                'sslcommerz_enabled' => true,
                'cod_enabled' => true,
                'active_gateway' => 'bkash',
                'sandbox_mode' => true,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
