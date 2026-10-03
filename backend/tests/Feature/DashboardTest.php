<?php

namespace Tests\Feature;

use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'name' => 'Store Executive',
            'email' => 'admin@apexstore.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $this->product = Product::create([
            'name' => 'Apex ANC Studio Monitor',
            'sku' => 'APEX-AUD-500',
            'category' => 'Audio',
            'price' => 200.00,
            'stock' => 4, // low stock <= 5
            'status' => 'active',
        ]);

        // Seed a paid order for today
        $order = Order::create([
            'order_number' => 'ORD-202610-DASH01',
            'customer_name' => 'Nasir Hossain',
            'customer_phone' => '01700112233',
            'customer_email' => 'nasir@example.com',
            'shipping_address' => 'Tejgaon, Dhaka',
            'subtotal' => 200.00,
            'tax' => 10.00,
            'shipping_fee' => 60.00,
            'total_amount' => 270.00,
            'status' => Order::STATUS_PAID,
            'payment_method' => 'bkash',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'product_sku' => $this->product->sku,
            'unit_price' => 200.00,
            'quantity' => 1,
            'subtotal' => 200.00,
        ]);
    }

    public function test_admin_can_retrieve_dashboard_business_analytics(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'kpis' => [
                    'today_revenue',
                    'formatted_today_revenue',
                    'last_7_days_revenue',
                    'last_30_days_revenue',
                    'average_order_value',
                    'attention_queue_count',
                    'low_stock_count',
                    'total_products',
                ],
                'order_counts',
                'low_stock_items',
                'delivery_pipeline',
                'sales_chart',
            ]);

        $data = $response->json();
        $this->assertEquals(270.00, $data['kpis']['today_revenue']);
        $this->assertEquals(1, $data['kpis']['low_stock_count']);
        $this->assertCount(14, $data['sales_chart']);
    }

    public function test_admin_can_adjust_product_inventory(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/admin/inventory/adjust', [
                'product_id' => $this->product->id,
                'quantity_change' => 10,
                'reason' => 'Warehouse Restock Shipment #104',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('product.stock', 14);

        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $this->product->id,
            'quantity_change' => 10,
            'balance_after' => 14,
            'reference_type' => 'manual_admin_adjustment',
        ]);
    }

    public function test_admin_cannot_reduce_inventory_below_zero(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/admin/inventory/adjust', [
                'product_id' => $this->product->id,
                'quantity_change' => -10, // Stock is only 4
                'reason' => 'Inventory Audit Write-Off',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->product->refresh();
        $this->assertEquals(4, $this->product->stock);
    }

    public function test_admin_can_retrieve_inventory_audit_logs(): void
    {
        InventoryLog::create([
            'product_id' => $this->product->id,
            'quantity_change' => 5,
            'balance_after' => 9,
            'reference_type' => 'manual_admin_adjustment',
            'reference_id' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/admin/inventory/logs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'product_id',
                        'quantity_change',
                        'balance_after',
                        'reference_type',
                        'product' => [
                            'id',
                            'name',
                            'sku',
                        ],
                    ],
                ],
            ]);
    }

    public function test_admin_can_update_order_status_and_cancellation_restores_stock(): void
    {
        $order = Order::where('order_number', 'ORD-202610-DASH01')->first();
        $initialStock = $this->product->stock; // 4

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/admin/orders/{$order->id}/status", [
                'status' => 'cancelled',
                'notes' => 'Customer requested cancellation via phone.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('order.status', 'cancelled');

        $this->product->refresh();
        $this->assertEquals($initialStock + 1, $this->product->stock); // 1 unit restored

        $this->assertDatabaseHas('inventory_logs', [
            'product_id' => $this->product->id,
            'quantity_change' => 1,
            'reference_type' => 'manual_admin_order_cancellation',
        ]);
    }
}
