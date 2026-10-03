<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_valid_credentials(): void
    {
        $admin = User::create([
            'name' => 'Store Administrator',
            'email' => 'admin@store.com',
            'password' => Hash::make('Password123!'),
            'role' => 'admin',
            'phone' => '+8801700000000',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@store.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'ok')
            ->assertJsonStructure([
                'status',
                'message',
                'access_token',
                'token_type',
                'user' => ['id', 'name', 'email', 'role', 'phone'],
            ]);

        $this->assertNotEmpty($response->json('access_token'));
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::create([
            'name' => 'Store Administrator',
            'email' => 'admin@store.com',
            'password' => Hash::make('Password123!'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@store.com',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_non_admin_user_cannot_access_admin_dashboard(): void
    {
        $customer = User::create([
            'name' => 'Regular Customer',
            'email' => 'customer@example.com',
            'password' => Hash::make('Password123!'),
            'role' => 'customer',
        ]);

        $token = $customer->createToken('auth-token', ['customer'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/admin/dashboard');

        // Customer role gets forbidden 403 by role.admin middleware
        $response->assertStatus(403);
    }
}
