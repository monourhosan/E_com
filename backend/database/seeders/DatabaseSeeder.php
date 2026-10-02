<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Default System Administrator Account
        User::firstOrCreate(
            ['email' => 'admin@store.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('Password123!'),
                'role' => 'admin',
                'phone' => '+8801700000000',
                'email_verified_at' => now(),
            ]
        );

        // Default Demo Customer Account for testing role restrictions
        User::firstOrCreate(
            ['email' => 'customer@store.com'],
            [
                'name' => 'John Customer',
                'password' => Hash::make('Password123!'),
                'role' => 'customer',
                'phone' => '+8801800000000',
                'email_verified_at' => now(),
            ]
        );
    }
}
