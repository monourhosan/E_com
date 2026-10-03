<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Retrieve executive business metrics, KPI summaries, and trend data.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        $now = now();
        $startOfToday = $now->copy()->startOfDay();
        $sevenDaysAgo = $now->copy()->subDays(7)->startOfDay();
        $thirtyDaysAgo = $now->copy()->subDays(30)->startOfDay();
        $fourteenDaysAgo = $now->copy()->subDays(14)->startOfDay();

        $paidStatuses = [Order::STATUS_PAID, Order::STATUS_DISPATCHED, Order::STATUS_COMPLETED];

        // 1. Revenue Metrics
        $todayRevenue = (float) Order::whereIn('status', $paidStatuses)
            ->where('created_at', '>=', $startOfToday)
            ->sum('total_amount');

        $last7DaysRevenue = (float) Order::whereIn('status', $paidStatuses)
            ->where('created_at', '>=', $sevenDaysAgo)
            ->sum('total_amount');

        $last30DaysRevenue = (float) Order::whereIn('status', $paidStatuses)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->sum('total_amount');

        $totalRevenue = (float) Order::whereIn('status', $paidStatuses)
            ->sum('total_amount');

        $totalPaidOrders = Order::whereIn('status', $paidStatuses)->count();

        $averageOrderValue = $totalPaidOrders > 0
            ? round($totalRevenue / $totalPaidOrders, 2)
            : 0.00;

        // 2. Order Status Breakdown
        $orderCounts = [
            'pending_payment' => Order::where('status', Order::STATUS_PENDING_PAYMENT)->count(),
            'paid' => Order::where('status', Order::STATUS_PAID)->count(),
            'dispatched' => Order::where('status', Order::STATUS_DISPATCHED)->count(),
            'completed' => Order::where('status', Order::STATUS_COMPLETED)->count(),
            'cancelled' => Order::where('status', Order::STATUS_CANCELLED)->count(),
            'total' => Order::count(),
        ];

        // 3. Operational Attention Queue (Paid orders requiring CarryBee dispatch)
        $attentionOrders = Order::with(['items', 'delivery'])
            ->where('status', Order::STATUS_PAID)
            ->where(function ($q) {
                $q->whereDoesntHave('delivery')
                    ->orWhereHas('delivery', function ($dq) {
                        $dq->where('status', Delivery::STATUS_FAILED)
                            ->orWhere('status', Delivery::STATUS_PENDING);
                    });
            })
            ->latest()
            ->take(5)
            ->get();

        $attentionQueueCount = Order::where('status', Order::STATUS_PAID)
            ->where(function ($q) {
                $q->whereDoesntHave('delivery')
                    ->orWhereHas('delivery', function ($dq) {
                        $dq->where('status', Delivery::STATUS_FAILED)
                            ->orWhere('status', Delivery::STATUS_PENDING);
                    });
            })
            ->count();

        // 4. Inventory Health
        $totalProducts = Product::where('status', 'active')->count();
        $lowStockCount = Product::where('status', 'active')->where('stock', '<=', 5)->count();
        $outOfStockCount = Product::where('status', 'active')->where('stock', '<=', 0)->count();

        $lowStockItems = Product::where('status', 'active')
            ->where('stock', '<=', 5)
            ->orderBy('stock', 'asc')
            ->take(5)
            ->get(['id', 'name', 'sku', 'price', 'stock', 'status']);

        // 5. Delivery Pipeline Breakdown
        $deliveryCounts = [
            'pending' => Delivery::where('status', Delivery::STATUS_PENDING)->count(),
            'dispatched' => Delivery::where('status', Delivery::STATUS_DISPATCHED)->count(),
            'in_transit' => Delivery::where('status', Delivery::STATUS_IN_TRANSIT)->count(),
            'delivered' => Delivery::where('status', Delivery::STATUS_DELIVERED)->count(),
            'failed' => Delivery::where('status', Delivery::STATUS_FAILED)->count(),
            'total' => Delivery::count(),
        ];

        // 6. Sales Velocity Chart Data (Last 14 Days)
        // Group orders by date and fill in missing days for smooth chart rendering
        $rawChartData = Order::whereIn('status', $paidStatuses)
            ->where('created_at', '>=', $fourteenDaysAgo)
            ->selectRaw('DATE(created_at) as order_date, SUM(total_amount) as sales, COUNT(*) as orders_count')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('order_date', 'asc')
            ->get()
            ->keyBy('order_date');

        $salesChart = [];
        for ($i = 13; $i >= 0; $i--) {
            $dateObj = $now->copy()->subDays($i);
            $dateKey = $dateObj->toDateString(); // YYYY-MM-DD
            $formattedLabel = $dateObj->format('M j'); // e.g. Oct 3

            $entry = $rawChartData->get($dateKey);

            $salesChart[] = [
                'date' => $dateKey,
                'label' => $formattedLabel,
                'sales' => $entry ? round((float) $entry->sales, 2) : 0.00,
                'orders' => $entry ? (int) $entry->orders_count : 0,
            ];
        }

        return response()->json([
            'status' => 'ok',
            'timestamp' => $now->toIso8601String(),
            'kpis' => [
                'today_revenue' => $todayRevenue,
                'formatted_today_revenue' => '$' . number_format($todayRevenue, 2),
                'last_7_days_revenue' => $last7DaysRevenue,
                'formatted_last_7_days_revenue' => '$' . number_format($last7DaysRevenue, 2),
                'last_30_days_revenue' => $last30DaysRevenue,
                'formatted_last_30_days_revenue' => '$' . number_format($last30DaysRevenue, 2),
                'total_revenue' => $totalRevenue,
                'formatted_total_revenue' => '$' . number_format($totalRevenue, 2),
                'average_order_value' => $averageOrderValue,
                'formatted_average_order_value' => '$' . number_format($averageOrderValue, 2),
                'attention_queue_count' => $attentionQueueCount,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'total_products' => $totalProducts,
            ],
            'order_counts' => $orderCounts,
            'attention_orders' => $attentionOrders,
            'low_stock_items' => $lowStockItems,
            'delivery_pipeline' => $deliveryCounts,
            'sales_chart' => $salesChart,
        ]);
    }
}
