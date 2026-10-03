"use client";

import * as React from "react";
import Link from "next/link";
import { api, Order } from "@/lib/api-client";
import { getSimulatedOrders } from "@/lib/order-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Truck,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function AdminOrdersListPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getOrders({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
      });
      setOrders(res.data);
    } catch {
      // Offline fallback
      let simOrders = getSimulatedOrders();
      if (statusFilter !== "all") {
        simOrders = simOrders.filter((o) => o.status === statusFilter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        simOrders = simOrders.filter(
          (o) =>
            o.order_number.toLowerCase().includes(q) ||
            o.customer_name.toLowerCase().includes(q) ||
            o.customer_phone.includes(q)
        );
      }
      setOrders(simOrders);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-amber-400" />
            Orders & CarryBee Logistics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor customer orders, verify payments, and manage automated CarryBee courier dispatching.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders()}
          className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Orders
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer, or phone..."
            className="pl-9 h-9 text-xs bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Status filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: "all", label: "All Orders" },
            { id: "paid", label: "Paid" },
            { id: "dispatched", label: "Dispatched" },
            { id: "pending_payment", label: "Pending Payment" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table / Cards */}
      <Card className="border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full bg-slate-800" />
              <Skeleton className="h-12 w-full bg-slate-800" />
              <Skeleton className="h-12 w-full bg-slate-800" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <Package className="h-10 w-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Orders Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No orders match your current search query or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-4">CarryBee Consignment</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-white text-xs">
                            {o.order_number}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {new Date(o.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-200">{o.customer_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{o.customer_phone}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        ${o.total_amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold ${
                            o.status === "paid" || o.status === "dispatched"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {o.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {o.delivery?.consignment_id ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-[11px] font-bold text-amber-300">
                              {o.delivery.consignment_id}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] uppercase px-1.5 py-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            >
                              {o.delivery.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Not dispatched
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/orders/${o.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-slate-700 bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5"
                          >
                            <span>Manage</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
