<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Apex Pulse ANC Wireless Headphones',
                'sku' => 'APEX-AUD-001',
                'category' => 'Flagship Audio',
                'description' => 'Flagship noise-cancelling headphones featuring 45mm custom dynamic drivers, 40-hour battery life, and spatial audio with dynamic head tracking.',
                'price' => 299.00,
                'stock' => 24,
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex Studio Pro In-Ear Monitors',
                'sku' => 'APEX-AUD-002',
                'category' => 'Flagship Audio',
                'description' => 'Quad-balanced armature drivers with precision-machined acoustic chambers for audiophiles and audio engineers.',
                'price' => 199.00,
                'stock' => 4, // Low stock <= 5
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex Chrono Ultra Smartwatch',
                'sku' => 'APEX-WR-001',
                'category' => 'Smart Wearables',
                'description' => 'Aerospace titanium casing, sapphire crystal display, dual-frequency GPS, and ECG heart monitoring with 100m water resistance.',
                'price' => 349.00,
                'stock' => 15,
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex Band Pro Fitness Tracker',
                'sku' => 'APEX-WR-002',
                'category' => 'Smart Wearables',
                'description' => 'Continuous SpO2 and VO2 max sensors with 14-day ultra battery reserve and personalized sleep staging analytics.',
                'price' => 89.00,
                'stock' => 38,
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex Horizon 16 Ultra Laptop',
                'sku' => 'APEX-PC-001',
                'category' => 'Workstations & Laptops',
                'description' => 'Liquid-cooled magnesium chassis, 3.2K 165Hz mini-LED panel, 32GB LPDDR5X RAM, and high-efficiency tensor compute engine.',
                'price' => 1899.00,
                'stock' => 7,
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex Studio Mechanical Keyboard',
                'sku' => 'APEX-PC-002',
                'category' => 'Workstations & Laptops',
                'description' => 'CNC-milled aluminum chassis with gasket mounting, pre-lubed linear switches, sound dampening silicon foam, and hot-swap sockets.',
                'price' => 179.00,
                'stock' => 2, // Low stock <= 5
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex Precision Ergo Wireless Mouse',
                'sku' => 'APEX-PC-003',
                'category' => 'Workstations & Laptops',
                'description' => 'MagSpeed electromagnetic scroll wheel with 8K DPI Darkfield sensor capable of tracking on glass surfaces.',
                'price' => 119.00,
                'stock' => 0, // Out of stock (0 stock)
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex Prime 5G Flagship Smartphone',
                'sku' => 'APEX-MOB-001',
                'category' => 'Mobile Devices',
                'description' => 'Ceramic back panel, 200MP periscope zoom camera system, LTPO 120Hz display, and 100W supercharge capability.',
                'price' => 999.00,
                'stock' => 12,
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex MagPower Wireless Fast Charger',
                'sku' => 'APEX-MOB-002',
                'category' => 'Mobile Devices',
                'description' => '3-in-1 foldable Qi2 charging station for phone, watch, and earbuds with active thermoregulation cooling.',
                'price' => 69.00,
                'stock' => 45,
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
            ],
            [
                'name' => 'Apex Vision 4K Gaming Monitor',
                'sku' => 'APEX-DISP-001',
                'category' => 'Workstations & Laptops',
                'description' => '32-inch 4K OLED gaming display with 240Hz refresh rate, 0.03ms response time, and 99% DCI-P3 color gamut.',
                'price' => 1099.00,
                'stock' => 5, // Low stock <= 5
                'status' => 'active',
                'image_url' => 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
            ],
        ];

        foreach ($products as $item) {
            Product::updateOrCreate(
                ['sku' => $item['sku']],
                $item
            );
        }
    }
}
