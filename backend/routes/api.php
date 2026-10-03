<?php

use App\Http\Controllers\Api\Admin\PaymentSettingsController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Payment\PaymentController;
use App\Http\Controllers\Api\Store\CartValidationController;
use App\Http\Controllers\Api\Store\CheckoutController;
use App\Http\Controllers\Api\Store\ProductController as StoreProductController;
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

    // Public Gateway Callbacks & IPN Webhooks (Idempotent)
    Route::match(['GET', 'POST'], '/payments/callback/{gateway}', [PaymentController::class, 'callback'])
        ->name('api.v1.payments.callback');

    // Public Storefront Catalog, Cart & Checkout
    Route::prefix('store')->group(function () {
        // Products Catalog
        Route::get('/products', [StoreProductController::class, 'index'])->name('api.v1.store.products.index');
        Route::get('/products/{idOrSku}', [StoreProductController::class, 'show'])->name('api.v1.store.products.show');

        // Cart Calculation & Stock Validation
        Route::post('/cart/validate', [CartValidationController::class, 'validateCart'])->name('api.v1.store.cart.validate');

        // Atomic Checkout & Order Confirmation
        Route::post('/checkout', [CheckoutController::class, 'checkout'])->name('api.v1.store.checkout');
        Route::get('/orders/{orderNumber}', [CheckoutController::class, 'show'])->name('api.v1.store.orders.show');

        // Payment Initiation & Gateway Discovery
        Route::post('/orders/{orderNumber}/pay', [PaymentController::class, 'initiate'])->name('api.v1.store.orders.pay');
        Route::get('/settings/payment-methods', [PaymentController::class, 'getPaymentMethods'])->name('api.v1.store.settings.payment_methods');
    });

    // Protected Authenticated Routes (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
            Route::get('/me', [AuthController::class, 'me'])->name('api.v1.auth.me');
        });

        // Administrator Protected Routes (Role: admin)
        Route::middleware('role.admin')->prefix('admin')->group(function () {
            // Dashboard verification endpoint
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

            // Product Catalog Management CRUD
            Route::apiResource('products', AdminProductController::class)->names('api.v1.admin.products');

            // Payment Configuration Toggles & Sandbox Mode
            Route::get('/settings/payment', [PaymentSettingsController::class, 'show'])->name('api.v1.admin.settings.payment.show');
            Route::put('/settings/payment', [PaymentSettingsController::class, 'update'])->name('api.v1.admin.settings.payment.update');
        });
    });
});
