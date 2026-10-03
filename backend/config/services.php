<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'carrybee' => [
        'api_url' => env('CARRYBEE_API_URL', 'https://api.carrybee.com/v1'),
        'client_id' => env('CARRYBEE_CLIENT_ID'),
        'client_secret' => env('CARRYBEE_CLIENT_SECRET'),
        'store_id' => env('CARRYBEE_STORE_ID', 'CB-STORE-001'),
        'sandbox' => env('CARRYBEE_SANDBOX', true),
    ],

    'bkash' => [
        'app_key' => env('BKASH_APP_KEY'),
        'app_secret' => env('BKASH_APP_SECRET'),
        'username' => env('BKASH_USERNAME'),
        'password' => env('BKASH_PASSWORD'),
        'base_url' => env('BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v2.0.0-mock'),
        'sandbox' => env('BKASH_SANDBOX', true),
    ],

    'sslcommerz' => [
        'store_id' => env('SSLCOMMERZ_STORE_ID'),
        'store_password' => env('SSLCOMMERZ_STORE_PASSWORD'),
        'sandbox' => env('SSLCOMMERZ_SANDBOX', true),
    ],

];
