<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = [
            'Flagship Audio' => [
                'prefix' => 'AUD',
                'names' => ['Wireless ANC Headphones', 'Spatial Audio Earbuds', 'Hi-Fi Studio Monitors', 'Portable Bass Bluetooth Speaker', 'Gaming Headset Surround 7.1'],
            ],
            'Smart Wearables' => [
                'prefix' => 'WEAR',
                'names' => ['Titanium GPS Smartwatch', 'Fitness Health Tracker', 'Sleep Monitoring Smart Ring', 'Heart Rate Chest Strap', 'Rugged Adventure Watch'],
            ],
            'Computing & Workspace' => [
                'prefix' => 'TECH',
                'names' => ['Mechanical RGB Keyboard', 'Ergonomic Precision Mouse', 'USB-C Thunderbolt Docking Station', 'Ultrawide 4K Monitor Stand', 'Dual-Fan Aluminum Laptop Cooler'],
            ],
            'Apparel & Gear' => [
                'prefix' => 'APPR',
                'names' => ['Waterproof Commuter Backpack', 'Thermal Merino Wool Hoodie', 'Anti-Theft Tech Sling Bag', 'Breathable Performance Cap', 'Reinforced Canvas Messenger Bag'],
            ],
            'Lifestyle & Smart Home' => [
                'prefix' => 'LIFE',
                'names' => ['Smart Ambient Desk Lamp', 'Fast Wireless Charging Pad 15W', 'Insulated Smart Thermos Bottle', 'Air Purifier Mini HEPA', 'Acoustic Soundproofing Panels'],
            ],
        ];

        $categoryName = fake()->randomElement(array_keys($categories));
        $categoryData = $categories[$categoryName];
        $itemName = fake()->randomElement($categoryData['names']);
        $uniqueNum = fake()->unique()->numberBetween(1000, 9999);
        $sku = "{$categoryData['prefix']}-{$uniqueNum}";

        return [
            'name' => "Apex {$itemName}",
            'sku' => $sku,
            'category' => $categoryName,
            'description' => fake()->paragraph(2),
            'price' => fake()->randomFloat(2, 25, 450), // Realistic prices
            'stock' => fake()->numberBetween(10, 150),
            'status' => 'active',
            'image_url' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        ];
    }

    /**
     * Indicate that the product is low in stock.
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => fake()->numberBetween(1, 5),
        ]);
    }

    /**
     * Indicate that the product is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
        ]);
    }
}
