<?php

namespace App\Exceptions;

use Exception;

class DeliveryApiException extends Exception
{
    /**
     * Additional error context.
     *
     * @var array<string, mixed>
     */
    protected array $context = [];

    public function __construct(string $message = "", int $code = 0, ?\Throwable $previous = null, array $context = [])
    {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
    }

    /**
     * Get error context.
     *
     * @return array<string, mixed>
     */
    public function getContext(): array
    {
        return $this->context;
    }
}
