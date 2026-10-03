<?php

namespace App\Services\Payment;

class PaymentResult
{
    /**
     * @param bool $isSuccessful
     * @param string|null $transactionId
     * @param int|null $paymentRecordId
     * @param string|null $errorMessage
     * @param array<string, mixed>|null $rawData
     */
    public function __construct(
        public readonly bool $isSuccessful,
        public readonly ?string $transactionId = null,
        public readonly ?int $paymentRecordId = null,
        public readonly ?string $errorMessage = null,
        public readonly ?array $rawData = null
    ) {}

    /**
     * Factory for successful payment results.
     */
    public static function success(
        string $transactionId,
        int $paymentRecordId,
        ?array $rawData = null
    ): self {
        return new self(
            isSuccessful: true,
            transactionId: $transactionId,
            paymentRecordId: $paymentRecordId,
            errorMessage: null,
            rawData: $rawData
        );
    }

    /**
     * Factory for failed payment results.
     */
    public static function failure(
        string $errorMessage,
        ?int $paymentRecordId = null,
        ?array $rawData = null
    ): self {
        return new self(
            isSuccessful: false,
            transactionId: null,
            paymentRecordId: $paymentRecordId,
            errorMessage: $errorMessage,
            rawData: $rawData
        );
    }
}
