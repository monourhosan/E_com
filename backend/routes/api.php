<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Single-Vendor E-Commerce
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public Health Check
    Route::get('/health', HealthController::class)->name('api.v1.health');

    // Public Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])->name('api.v1.auth.login');
    });

    // Protected Authenticated Routes (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
            Route::get('/me', [AuthController::class, 'me'])->name('api.v1.auth.me');
        });

        // Administrator Protected Routes
        Route::middleware('role.admin')->prefix('admin')->group(function () {
            Route::get('/dashboard', function (Request $request) {
                return response()->json([
                    'status' => 'ok',
                    'message' => 'Admin dashboard authorized access granted.',
                    'admin' => [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                        'role' => $request->user()->role,
                    ],
                    'timestamp' => now()->toIso8601String(),
                ]);
            })->name('api.v1.admin.dashboard');
        });
    });
});
