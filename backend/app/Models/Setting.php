<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    /**
     * Retrieve a setting value by key with optional default.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::find($key);
        return $setting ? $setting->value : $default;
    }

    /**
     * Store or update a setting value.
     *
     * @param string $key
     * @param mixed $value
     * @return static
     */
    public static function set(string $key, mixed $value): static
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    /**
     * Retrieve payment methods configuration with fallback defaults.
     *
     * @return array<string, mixed>
     */
    public static function getPaymentMethods(): array
    {
        $defaults = [
            'bkash_enabled' => true,
            'sslcommerz_enabled' => true,
            'cod_enabled' => true,
            'active_gateway' => 'bkash',
            'sandbox_mode' => true,
        ];

        $stored = static::get('payment_methods', []);
        return array_merge($defaults, is_array($stored) ? $stored : []);
    }

    /**
     * Check whether a specific gateway is enabled.
     *
     * @param string $gateway
     * @return bool
     */
    public static function isGatewayEnabled(string $gateway): bool
    {
        $settings = static::getPaymentMethods();
        return match ($gateway) {
            'bkash' => (bool) ($settings['bkash_enabled'] ?? false),
            'sslcommerz' => (bool) ($settings['sslcommerz_enabled'] ?? false),
            'cod' => (bool) ($settings['cod_enabled'] ?? false),
            default => false,
        };
    }
}
