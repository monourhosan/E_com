<?php

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\OrderDeliveryController;
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
        Route::get('/orders/{orderNumber}/delivery-status', [OrderDeliveryController::class, 'deliveryStatus'])->name('api.v1.store.orders.delivery_status');

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

            // Executive Business Dashboard Stats & Chart Velocity
            Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->name('api.v1.admin.dashboard.stats');

            // Product Catalog Management CRUD
            Route::apiResource('products', AdminProductController::class)->names('api.v1.admin.products');

            // Inventory Management & Stock Adjustments
            Route::get('/inventory', [InventoryController::class, 'index'])->name('api.v1.admin.inventory.index');
            Route::post('/inventory/adjust', [InventoryController::class, 'adjust'])->name('api.v1.admin.inventory.adjust');
            Route::get('/inventory/logs', [InventoryController::class, 'logs'])->name('api.v1.admin.inventory.logs');

            // Order Management & CarryBee Courier Dispatch
            Route::get('/orders', [OrderDeliveryController::class, 'index'])->name('api.v1.admin.orders.index');
            Route::get('/orders/{id}', [OrderDeliveryController::class, 'show'])->name('api.v1.admin.orders.show');
            Route::put('/orders/{id}/status', [OrderDeliveryController::class, 'updateStatus'])->name('api.v1.admin.orders.update_status');
            Route::post('/orders/{id}/dispatch-delivery', [OrderDeliveryController::class, 'dispatchDelivery'])->name('api.v1.admin.orders.dispatch_delivery');
            Route::get('/orders/{id}/delivery-status', [OrderDeliveryController::class, 'deliveryStatus'])->name('api.v1.admin.orders.delivery_status');

            // Payment Configuration Toggles & Sandbox Mode
            Route::get('/settings/payment', [PaymentSettingsController::class, 'show'])->name('api.v1.admin.settings.payment.show');
            Route::put('/settings/payment', [PaymentSettingsController::class, 'update'])->name('api.v1.admin.settings.payment.update');
        });
    });
});
