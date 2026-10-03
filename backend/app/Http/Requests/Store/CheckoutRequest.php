<?php

namespace App\Http\Requests\Store;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:150'],
            'customer_phone' => [
                'required',
                'string',
                'regex:/^(\+?88)?01[3-9]\d{8}$/',
            ],
            'customer_email' => ['required', 'string', 'email:rfc,dns', 'max:150'],
            'shipping_address' => ['required', 'string', 'min:5', 'max:1000'],
            'payment_method' => ['required', 'string', 'in:bkash,sslcommerz,cod'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Custom validation error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_phone.regex' => 'Please provide a valid Bangladeshi phone number (e.g. 01712345678 or +8801712345678).',
            'payment_method.in' => 'Selected payment method must be one of: bkash, sslcommerz, or cod.',
            'items.required' => 'At least one product item is required to place an order.',
            'items.*.quantity.min' => 'Item quantity must be at least 1.',
        ];
    }
}
