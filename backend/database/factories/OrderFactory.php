<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $createdAt = fake()->dateTimeBetween('-21 days', 'now');
        $cities = [
            'House 12, Road 4, Dhanmondi, Dhaka 1205',
            'Flat 4B, Plot 18, Block D, Banani, Dhaka 1213',
            'House 88, Park Road, Baridhara Diplomatic Zone, Dhaka 1212',
            'Holding 204, CDA Avenue, Nasirabad, Chittagong 4000',
            'House 5, Shahjalal Upashahar, Sylhet 3100',
            'Sector 7, Road 11, Uttara, Dhaka 1230',
            'House 42, Road 27, Gulshan 1, Dhaka 1212',
        ];

        $paymentMethods = ['bkash', 'sslcommerz', 'cod'];

        return [
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'customer_name' => fake()->name(),
            'customer_phone' => '+8801' . fake()->numberBetween(3, 9) . fake()->numerify('#######'),
            'customer_email' => fake()->safeEmail(),
            'shipping_address' => fake()->randomElement($cities),
            'subtotal' => 0.00,
            'tax' => 0.00,
            'shipping_fee' => 60.00,
            'total_amount' => 0.00,
            'status' => Order::STATUS_PAID,
            'payment_method' => fake()->randomElement($paymentMethods),
            'notes' => fake()->optional(0.3)->sentence(),
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }

    /**
     * Set status to paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_PAID,
        ]);
    }

    /**
     * Set status to dispatched.
     */
    public function dispatched(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_DISPATCHED,
        ]);
    }

    /**
     * Set status to completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_COMPLETED,
        ]);
    }

    /**
     * Set status to pending payment.
     */
    public function pendingPayment(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_PENDING_PAYMENT,
        ]);
    }

    /**
     * Set status to cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Order::STATUS_CANCELLED,
        ]);
    }
}
