<?php

namespace Database\Seeders;

use App\Models\Delivery;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RealisticEcommerceSeeder extends Seeder
{
    /**
     * Run the realistic e-commerce database seeds.
     */
    public function run(): void
    {
        // -------------------------------------------------------------
        // STEP 1: Create Admin & Customer Accounts
        // -------------------------------------------------------------
        $admin = User::firstOrCreate(
            ['email' => 'admin@store.com'],
            [
                'name' => 'Apex Store Administrator',
                'password' => Hash::make('Password123!'),
                'role' => 'admin',
                'phone' => '+8801700000000',
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'customer@store.com'],
            [
                'name' => 'Demo Customer',
                'password' => Hash::make('Password123!'),
                'role' => 'customer',
                'phone' => '+8801800000000',
                'email_verified_at' => now(),
            ]
        );

        // -------------------------------------------------------------
        // STEP 2: Seed 35 Diverse Products & Log Initial Stock Inflow
        // -------------------------------------------------------------
        $catalogDefinitions = [
            // Category 1: Flagship Audio (7 products)
            ['name' => 'Apex Pulse ANC Wireless Headphones', 'sku' => 'AUD-PULSE-01', 'category' => 'Audio', 'price' => 299.00, 'stock' => 85, 'img' => 'photo-1505740420928-5e560c06d30e'],
            ['name' => 'Apex Studio Pro In-Ear Monitors', 'sku' => 'AUD-STUDIO-02', 'category' => 'Audio', 'price' => 199.00, 'stock' => 70, 'img' => 'photo-1590658268037-6bf12165a8df'],
            ['name' => 'Apex SoundStage Spatial Earbuds', 'sku' => 'AUD-STAGE-03', 'category' => 'Audio', 'price' => 149.50, 'stock' => 95, 'img' => 'photo-1572536147248-ac59a8abfa4b'],
            ['name' => 'Apex BoomBox Portable Hi-Fi Speaker', 'sku' => 'AUD-BOOM-04', 'category' => 'Audio', 'price' => 179.00, 'stock' => 60, 'img' => 'photo-1545454675-3531b543be5d'],
            ['name' => 'Apex Clarity USB-C Studio Microphone', 'sku' => 'AUD-MIC-05', 'category' => 'Audio', 'price' => 129.00, 'stock' => 50, 'img' => 'photo-1590658268037-6bf12165a8df'],
            ['name' => 'Apex Surround 7.1 Gaming Headset', 'sku' => 'AUD-GAME-06', 'category' => 'Audio', 'price' => 119.00, 'stock' => 80, 'img' => 'photo-1546435770-a3e426bf472b'],
            ['name' => 'Apex Acoustic Noise-Cancelling Buds Mini', 'sku' => 'AUD-MINI-07', 'category' => 'Audio', 'price' => 89.00, 'stock' => 110, 'img' => 'photo-1505740420928-5e560c06d30e'],

            // Category 2: Smart Wearables (7 products)
            ['name' => 'Apex Chrono Ultra Titanium Smartwatch', 'sku' => 'WR-CHRONO-01', 'category' => 'Wearables', 'price' => 349.00, 'stock' => 65, 'img' => 'photo-1523275335684-37898b6baf30'],
            ['name' => 'Apex Band Pro Fitness Tracker HR', 'sku' => 'WR-BAND-02', 'category' => 'Wearables', 'price' => 79.00, 'stock' => 140, 'img' => 'photo-1575311373937-040b8e1fd5b6'],
            ['name' => 'Apex Halo Bio-Tracking Smart Ring', 'sku' => 'WR-RING-03', 'category' => 'Wearables', 'price' => 249.00, 'stock' => 55, 'img' => 'photo-1605100804763-247f67b3557e'],
            ['name' => 'Apex Vigor Rugged Outdoor Expedition GPS', 'sku' => 'WR-VIGOR-04', 'category' => 'Wearables', 'price' => 399.00, 'stock' => 50, 'img' => 'photo-1523275335684-37898b6baf30'],
            ['name' => 'Apex Pulse Pace ECG Strap Pro', 'sku' => 'WR-PACE-05', 'category' => 'Wearables', 'price' => 69.00, 'stock' => 90, 'img' => 'photo-1575311373937-040b8e1fd5b6'],
            ['name' => 'Apex Chrono Lite Sports Watch', 'sku' => 'WR-LITE-06', 'category' => 'Wearables', 'price' => 159.00, 'stock' => 100, 'img' => 'photo-1523275335684-37898b6baf30'],
            ['name' => 'Apex Aero Smart Eyewear Audio Frames', 'sku' => 'WR-AERO-07', 'category' => 'Wearables', 'price' => 189.00, 'stock' => 60, 'img' => 'photo-1508296695146-257a814070b4'],

            // Category 3: Workstations & Computing (7 products)
            ['name' => 'Apex MechStrike TKL Mechanical Keyboard', 'sku' => 'PC-KEY-01', 'category' => 'Computing', 'price' => 129.50, 'stock' => 95, 'img' => 'photo-1587829741301-dc798b83add3'],
            ['name' => 'Apex Glide Wireless Precision Ergonomic Mouse', 'sku' => 'PC-MOUSE-02', 'category' => 'Computing', 'price' => 79.00, 'stock' => 120, 'img' => 'photo-1615663245857-ac93bb7c39e7'],
            ['name' => 'Apex Quantum 12-in-1 Thunderbolt Hub', 'sku' => 'PC-HUB-03', 'category' => 'Computing', 'price' => 149.00, 'stock' => 75, 'img' => 'photo-1544716278-ca5e3f4abd8c'],
            ['name' => 'Apex DeskMat Micro-Weave Extended Pad', 'sku' => 'PC-MAT-04', 'category' => 'Computing', 'price' => 29.00, 'stock' => 180, 'img' => 'photo-1618005182384-a83a8bd57fbe'],
            ['name' => 'Apex Armor Dual Monitor Gas Spring Arm', 'sku' => 'PC-ARM-05', 'category' => 'Computing', 'price' => 109.00, 'stock' => 65, 'img' => 'photo-1527443224154-c4a3942d3acf'],
            ['name' => 'Apex Blizzard High-Flow Laptop Cooling Pad', 'sku' => 'PC-COOL-06', 'category' => 'Computing', 'price' => 49.00, 'stock' => 130, 'img' => 'photo-1588872657578-7efd1f1555ed'],
            ['name' => 'Apex HD 4K 60FPS Streaming Webcam', 'sku' => 'PC-CAM-07', 'category' => 'Computing', 'price' => 139.00, 'stock' => 80, 'img' => 'photo-1587829741301-dc798b83add3'],

            // Category 4: Everyday Carry & Gear (7 products)
            ['name' => 'Apex Nomad Waterproof Commuter Backpack 24L', 'sku' => 'EDC-NOMAD-01', 'category' => 'Gear & Bags', 'price' => 119.00, 'stock' => 90, 'img' => 'photo-1553062407-98eeb64c6a62'],
            ['name' => 'Apex Aero Sling Crossbody Tech Bag 6L', 'sku' => 'EDC-SLING-02', 'category' => 'Gear & Bags', 'price' => 59.00, 'stock' => 125, 'img' => 'photo-1622560480605-d83c853bc5c3'],
            ['name' => 'Apex Heritage Full-Grain Leather Briefcase', 'sku' => 'EDC-BRIEF-03', 'category' => 'Gear & Bags', 'price' => 219.00, 'stock' => 45, 'img' => 'photo-1548036328-c9fa89d128fa'],
            ['name' => 'Apex CableFolio Tech Organizer Pouch', 'sku' => 'EDC-POUCH-04', 'category' => 'Gear & Bags', 'price' => 34.00, 'stock' => 160, 'img' => 'photo-1553062407-98eeb64c6a62'],
            ['name' => 'Apex Defender RFID-Blocking Slim Cardholder', 'sku' => 'EDC-WALLET-05', 'category' => 'Gear & Bags', 'price' => 39.00, 'stock' => 150, 'img' => 'photo-1627123424574-724758594e93'],
            ['name' => 'Apex Voyager Expandable Weekender Duffel 45L', 'sku' => 'EDC-DUFFEL-06', 'category' => 'Gear & Bags', 'price' => 149.00, 'stock' => 55, 'img' => 'photo-1553062407-98eeb64c6a62'],
            ['name' => 'Apex HydroShield Magnetic Umbrella Auto-Open', 'sku' => 'EDC-UMB-07', 'category' => 'Gear & Bags', 'price' => 28.00, 'stock' => 110, 'img' => 'photo-1517487881594-2787fef5ebf7'],

            // Category 5: Smart Home & Power (7 products)
            ['name' => 'Apex MagCharge 3-in-1 Fast Wireless Stand', 'sku' => 'PWR-MAG-01', 'category' => 'Power & Home', 'price' => 69.00, 'stock' => 105, 'img' => 'photo-1586816879360-004f5b0c51e3'],
            ['name' => 'Apex PowerCore 25,000mAh 100W PD Power Bank', 'sku' => 'PWR-CORE-02', 'category' => 'Power & Home', 'price' => 89.00, 'stock' => 80, 'img' => 'photo-1609592426868-2435e2365a11'],
            ['name' => 'Apex GaN Ultra 65W Dual USB-C Fast Charger', 'sku' => 'PWR-GAN-03', 'category' => 'Power & Home', 'price' => 39.00, 'stock' => 140, 'img' => 'photo-1583863788434-e58a36330cf0'],
            ['name' => 'Apex Glow Ambient Smart RGB Light Bar', 'sku' => 'PWR-GLOW-04', 'category' => 'Power & Home', 'price' => 59.00, 'stock' => 95, 'img' => 'photo-1507473885765-e6ed057f782c'],
            ['name' => 'Apex Smart Thermos Digital Temp Display 500ml', 'sku' => 'PWR-THERM-05', 'category' => 'Power & Home', 'price' => 32.00, 'stock' => 135, 'img' => 'photo-1602143407151-7111542de6e8'],
            ['name' => 'Apex PureAir Desktop True HEPA Purifier', 'sku' => 'PWR-AIR-06', 'category' => 'Power & Home', 'price' => 89.00, 'stock' => 70, 'img' => 'photo-1585771724684-38269d6639fd'],
            ['name' => 'Apex CablePro Braided Kevlar USB-C 2m (2-Pack)', 'sku' => 'PWR-CABLE-07', 'category' => 'Power & Home', 'price' => 22.00, 'stock' => 200, 'img' => 'photo-1583863788434-e58a36330cf0'],
        ];

        $seededProducts = [];

        foreach ($catalogDefinitions as $def) {
            $product = Product::updateOrCreate(
                ['sku' => $def['sku']],
                [
                    'name' => $def['name'],
                    'category' => $def['category'],
                    'description' => "Engineered for uncompromising performance and longevity. Features aerospace materials, low power consumption, and elegant minimalist aesthetic.",
                    'price' => $def['price'],
                    'stock' => $def['stock'],
                    'status' => 'active',
                    'image_url' => "https://images.unsplash.com/{$def['img']}?w=800&auto=format&fit=crop&q=80",
                ]
            );

            // Log initial inventory inflow
            InventoryLog::firstOrCreate(
                [
                    'product_id' => $product->id,
                    'reference_type' => 'initial_inventory_seed',
                ],
                [
                    'quantity_change' => $def['stock'],
                    'balance_after' => $def['stock'],
                    'reference_id' => $admin->id,
                    'created_at' => now()->subDays(22),
                    'updated_at' => now()->subDays(22),
                ]
            );

            $seededProducts[] = $product;
        }

        // -------------------------------------------------------------
        // STEP 3: Generate 100 Sequentially Consistent Orders
        // -------------------------------------------------------------
        $cities = [
            ['city' => 'Dhaka', 'address' => 'House 14, Road 7, Dhanmondi, Dhaka 1205'],
            ['city' => 'Dhaka', 'address' => 'Flat 5A, Plot 32, Gulshan 1, Dhaka 1212'],
            ['city' => 'Dhaka', 'address' => 'House 19, Road 11, Block D, Banani, Dhaka 1213'],
            ['city' => 'Dhaka', 'address' => 'Sector 4, Road 18, Uttara Model Town, Dhaka 1230'],
            ['city' => 'Chittagong', 'address' => 'Holding 112, Nasirabad Housing Society, Chittagong 4000'],
            ['city' => 'Chittagong', 'address' => 'Road 2, O.R. Nizam Road R/A, Chittagong 4203'],
            ['city' => 'Sylhet', 'address' => 'House 9, Block B, Shahjalal Upashahar, Sylhet 3100'],
            ['city' => 'Rajshahi', 'address' => 'Holding 45, Kazihata Main Road, Rajshahi 6000'],
        ];

        $customerNames = [
            'Rafiqul Islam', 'Tanvir Ahmed', 'Nusrat Jahan', 'Shahidul Alam', 'Farhana Yasmin',
            'Mahmudul Hasan', 'Sadia Afrin', 'Arifur Rahman', 'Shamim Hossain', 'Rumana Akter',
            'Zubair Karim', 'Tahmina Begum', 'Asif Chowdhury', 'Mehedi Hasan', 'Jannatul Ferdous',
            'Kamrul Islam', 'Ishrat Jahan', 'Saiful Islam', 'Nazmul Huda', 'Anika Tabassum',
        ];

        $paymentMethods = ['bkash', 'sslcommerz', 'cod'];

        // Order count: exactly 100 orders
        $totalOrdersToGenerate = 100;

        for ($i = 1; $i <= $totalOrdersToGenerate; $i++) {
            // Distribute dates across last 21 days
            // $i 1 to 40: 14 to 21 days ago (older)
            // $i 41 to 80: 3 to 13 days ago (mid)
            // $i 81 to 100: 0 to 2 days ago (recent)
            if ($i <= 40) {
                $daysAgo = rand(14, 21);
                $rand = rand(1, 100);
                if ($rand <= 80) {
                    $status = Order::STATUS_COMPLETED;
                } elseif ($rand <= 90) {
                    $status = Order::STATUS_DISPATCHED;
                } else {
                    $status = Order::STATUS_CANCELLED;
                }
            } elseif ($i <= 80) {
                $daysAgo = rand(3, 13);
                $rand = rand(1, 100);
                if ($rand <= 60) {
                    $status = Order::STATUS_DISPATCHED;
                } elseif ($rand <= 85) {
                    $status = Order::STATUS_COMPLETED;
                } else {
                    $status = Order::STATUS_CANCELLED;
                }
            } else {
                $daysAgo = rand(0, 2);
                $rand = rand(1, 100);
                if ($rand <= 40) {
                    $status = Order::STATUS_PAID;
                } elseif ($rand <= 70) {
                    $status = Order::STATUS_PENDING_PAYMENT;
                } elseif ($rand <= 90) {
                    $status = Order::STATUS_DISPATCHED;
                } else {
                    $status = Order::STATUS_CANCELLED;
                }
            }

            $orderDate = Carbon::now()->subDays($daysAgo)->subHours(rand(1, 23))->subMinutes(rand(1, 59));
            $customerName = $customerNames[array_rand($customerNames)];
            $loc = $cities[array_rand($cities)];
            $payMethod = $paymentMethods[array_rand($paymentMethods)];

            // Pick 1 to 3 distinct products for this order
            $orderItemCount = rand(1, 3);
            $selectedKeys = (array) array_rand($seededProducts, $orderItemCount);

            $isStockDeductible = in_array($status, [Order::STATUS_PAID, Order::STATUS_DISPATCHED, Order::STATUS_COMPLETED]);

            $subtotal = 0.00;
            $itemsData = [];

            foreach ($selectedKeys as $key) {
                /** @var Product $product */
                $product = $seededProducts[$key];
                $desiredQty = rand(1, 2);

                // If stock deductible, enforce mathematical consistency
                if ($isStockDeductible) {
                    // Refresh product stock from DB
                    $product = $product->fresh();
                    if ($product->stock <= 0) {
                        // Skip or pick another with stock > 0
                        continue;
                    }
                    $qty = min($desiredQty, $product->stock);
                } else {
                    $qty = $desiredQty;
                }

                $itemSubtotal = round($product->price * $qty, 2);
                $subtotal += $itemSubtotal;

                $itemsData[] = [
                    'product' => $product,
                    'quantity' => $qty,
                    'unit_price' => $product->price,
                    'subtotal' => $itemSubtotal,
                ];
            }

            // If no items were eligible, pick at least one product with guaranteed stock
            if (empty($itemsData)) {
                $fallbackProduct = Product::where('stock', '>', 5)->inRandomOrder()->first();
                if ($fallbackProduct) {
                    $qty = 1;
                    $itemSubtotal = round($fallbackProduct->price * $qty, 2);
                    $subtotal += $itemSubtotal;
                    $itemsData[] = [
                        'product' => $fallbackProduct,
                        'quantity' => $qty,
                        'unit_price' => $fallbackProduct->price,
                        'subtotal' => $itemSubtotal,
                    ];
                }
            }

            $tax = round($subtotal * 0.05, 2); // 5% tax
            $shippingFee = 60.00; // Flat ৳60 / $60 shipping
            $totalAmount = round($subtotal + $tax + $shippingFee, 2);

            $orderNumber = 'ORD-' . strtoupper(Str::random(8));

            // Create Order record
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_name' => $customerName,
                'customer_phone' => '+8801' . rand(3, 9) . sprintf('%07d', rand(1000000, 9999999)),
                'customer_email' => strtolower(str_replace(' ', '.', $customerName)) . rand(10, 99) . '@example.com',
                'shipping_address' => $loc['address'],
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping_fee' => $shippingFee,
                'total_amount' => $totalAmount,
                'status' => $status,
                'payment_method' => $payMethod,
                'notes' => rand(0, 1) ? 'Please call before arrival at location.' : null,
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);

            // Create Order Items and apply atomic stock deduction if paid/dispatched/completed
            foreach ($itemsData as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product']->id,
                    'product_name' => $item['product']->name,
                    'product_sku' => $item['product']->sku,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $item['subtotal'],
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);

                if ($isStockDeductible) {
                    $prod = Product::where('id', $item['product']->id)->lockForUpdate()->first();
                    $prod->decrement('stock', $item['quantity']);

                    InventoryLog::create([
                        'product_id' => $prod->id,
                        'quantity_change' => -$item['quantity'],
                        'balance_after' => $prod->fresh()->stock,
                        'reference_type' => 'order_checkout_reserve',
                        'reference_id' => $order->id,
                        'created_at' => $orderDate,
                        'updated_at' => $orderDate,
                    ]);
                }
            }

            // Create matching Payment record if paid/dispatched/completed
            if ($isStockDeductible) {
                Payment::create([
                    'order_id' => $order->id,
                    'gateway' => $payMethod,
                    'transaction_id' => 'TXN-' . strtoupper(Str::random(10)),
                    'payment_id' => 'PAY-' . strtoupper(Str::random(10)),
                    'amount' => $totalAmount,
                    'currency' => 'BDT',
                    'status' => Payment::STATUS_SUCCESSFUL,
                    'verified_at' => $orderDate,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            }

            // Create matching Delivery record if dispatched or completed
            if (in_array($status, [Order::STATUS_DISPATCHED, Order::STATUS_COMPLETED])) {
                $consignmentId = 'CB-CN-' . $orderDate->format('Ymd') . '-' . sprintf('%04d', $i);
                $trackingCode = 'TRK-' . strtoupper(Str::random(8));

                Delivery::create([
                    'order_id' => $order->id,
                    'courier' => 'CarryBee',
                    'consignment_id' => $consignmentId,
                    'tracking_code' => $trackingCode,
                    'delivery_fee' => 60.00,
                    'status' => $status === Order::STATUS_COMPLETED ? Delivery::STATUS_DELIVERED : Delivery::STATUS_DISPATCHED,
                    'dispatched_at' => $orderDate,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            }
        }

        // -------------------------------------------------------------
        // STEP 4: Mathematical Consistency Assertion
        // -------------------------------------------------------------
        $negativeProducts = Product::where('stock', '<', 0)->count();
        if ($negativeProducts > 0) {
            throw new \RuntimeException("Seed consistency failure: {$negativeProducts} products have negative stock balance!");
        }
    }
}
