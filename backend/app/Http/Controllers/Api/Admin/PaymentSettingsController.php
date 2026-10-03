<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentSettingsController extends Controller
{
    /**
     * Retrieve current payment settings and credentials status for administrator.
     *
     * @return JsonResponse
     */
    public function show(): JsonResponse
    {
        $settings = Setting::getPaymentMethods();

        return response()->json([
            'status' => 'ok',
            'data' => [
                'bkash_enabled' => (bool) ($settings['bkash_enabled'] ?? true),
                'sslcommerz_enabled' => (bool) ($settings['sslcommerz_enabled'] ?? true),
                'cod_enabled' => (bool) ($settings['cod_enabled'] ?? true),
                'active_gateway' => $settings['active_gateway'] ?? 'bkash',
                'sandbox_mode' => (bool) ($settings['sandbox_mode'] ?? true),
                'credentials_status' => [
                    'bkash_configured' => ! empty(env('BKASH_APP_KEY')),
                    'sslcommerz_configured' => ! empty(env('SSLCZ_STORE_ID')),
                ],
            ],
        ]);
    }

    /**
     * Update payment gateway toggles and sandbox mode.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bkash_enabled' => ['required', 'boolean'],
            'sslcommerz_enabled' => ['required', 'boolean'],
            'cod_enabled' => ['required', 'boolean'],
            'sandbox_mode' => ['required', 'boolean'],
            'active_gateway' => ['nullable', 'string', 'in:bkash,sslcommerz,cod'],
        ]);

        $current = Setting::getPaymentMethods();
        $updated = array_merge($current, $validated);

        Setting::set('payment_methods', $updated);

        return response()->json([
            'status' => 'ok',
            'message' => 'Payment gateway settings updated successfully.',
            'data' => $updated,
        ]);
    }
}
