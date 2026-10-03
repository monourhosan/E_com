<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    protected function createAdmin(): User
    {
        return User::create([
            'name' => 'Store Administrator',
            'email' => 'admin@store.com',
            'password' => bcrypt('Password123!'),
            'role' => 'admin',
        ]);
    }

    public function test_admin_can_create_product_with_valid_data(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('auth-token', ['admin'])->plainTextToken;

        $payload = [
            'name' => 'Apex Pro Soundbar',
            'sku' => 'APEX-SND-1001',
            'category' => 'Audio',
            'description' => 'Dolby Atmos surround soundbar with wireless subwoofer.',
            'price' => 399.00,
            'stock' => 50,
            'status' => 'active',
            'image_url' => 'https://images.unsplash.com/photo-1545454675-3531b543be5d',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/admin/products', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('data.sku', 'APEX-SND-1001')
            ->assertJsonPath('data.stock', 50);

        $this->assertDatabaseHas('products', [
            'sku' => 'APEX-SND-1001',
            'stock' => 50,
        ]);
    }

    public function test_cannot_create_product_with_duplicate_sku(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('auth-token', ['admin'])->plainTextToken;

        Product::create([
            'name' => 'Original Product',
            'sku' => 'DUP-SKU-99',
            'price' => 50.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        $payload = [
            'name' => 'Duplicate SKU Attempt',
            'sku' => 'DUP-SKU-99',
            'price' => 75.00,
            'stock' => 20,
            'status' => 'active',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/admin/products', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_storefront_only_lists_active_products(): void
    {
        Cache::flush();

        Product::create([
            'name' => 'Active Item',
            'sku' => 'ACT-001',
            'price' => 100.00,
            'stock' => 10,
            'status' => 'active',
        ]);

        Product::create([
            'name' => 'Draft Item',
            'sku' => 'DRF-002',
            'price' => 150.00,
            'stock' => 5,
            'status' => 'draft',
        ]);

        Product::create([
            'name' => 'Archived Item',
            'sku' => 'ARC-003',
            'price' => 200.00,
            'stock' => 0,
            'status' => 'archived',
        ]);

        $response = $this->getJson('/api/v1/store/products');

        $response->assertStatus(200);

        $names = collect($response->json('data'))->pluck('name')->all();

        $this->assertContains('Active Item', $names);
        $this->assertNotContains('Draft Item', $names);
        $this->assertNotContains('Archived Item', $names);
    }

    public function test_cannot_set_negative_stock_directly(): void
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('auth-token', ['admin'])->plainTextToken;

        $payload = [
            'name' => 'Negative Stock Test',
            'sku' => 'NEG-STK-01',
            'price' => 50.00,
            'stock' => -5,
            'status' => 'active',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/admin/products', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['stock']);
    }
}
