<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Setting;
use DomainException;
use InvalidArgumentException;

class PaymentGatewayFactory
{
    /**
     * Resolve the payment gateway implementation based on gateway identifier.
     *
     * @param string $gateway
     * @param bool $checkEnabled Whether to verify if the gateway is enabled in admin settings
     * @return PaymentGatewayInterface
     * @throws DomainException|InvalidArgumentException
     */
    public function make(string $gateway, bool $checkEnabled = true): PaymentGatewayInterface
    {
        $gateway = strtolower(trim($gateway));

        if ($checkEnabled && ! Setting::isGatewayEnabled($gateway)) {
            throw new DomainException("Payment method '{$gateway}' is currently unavailable or disabled by administration.");
        }

        return match ($gateway) {
            'bkash' => app(BkashPaymentService::class),
            'sslcommerz' => app(SslCommerzPaymentService::class),
            'cod' => app(CodPaymentService::class),
            default => throw new InvalidArgumentException("Unsupported payment gateway: '{$gateway}'."),
        };
    }
}
