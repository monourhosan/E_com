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
import { toast } from "sonner";
import {
  Package,
  Truck,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  MoreVertical,
} from "lucide-react";

export default function AdminOrdersListPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [cancellingOrder, setCancellingOrder] = React.useState<Order | null>(null);
  const [cancellingLoading, setCancellingLoading] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<number | null>(null);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getOrders({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
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

  // Quick Dispatch Action
  const handleQuickDispatch = async (order: Order) => {
    setActionLoadingId(order.id);
    try {
      const res = await api.admin.dispatchDelivery(order.id, true);
      toast.success(res.message || `Order ${order.order_number} dispatched to CarryBee.`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to dispatch order.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Status Transition (e.g. Mark Completed)
  const handleStatusChange = async (order: Order, newStatus: string) => {
    setActionLoadingId(order.id);
    try {
      const res = await api.admin.updateOrderStatus(order.id, {
        status: newStatus,
        notes: `Admin manually transitioned status to ${newStatus}`,
      });
      toast.success(res.message || `Order ${order.order_number} updated to ${newStatus}.`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message || `Failed to update order status to ${newStatus}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirm Order Cancellation and Stock Restoration
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setCancellingLoading(true);
    try {
      const res = await api.admin.updateOrderStatus(cancellingOrder.id, {
        status: "cancelled",
        notes: "Admin cancelled order and automatically restored inventory stock ledger.",
      });
      toast.success(res.message || `Order ${cancellingOrder.order_number} cancelled. Items restored to stock.`);
      setCancellingOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order.");
    } finally {
      setCancellingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 uppercase font-bold">Paid</Badge>;
      case "dispatched":
        return <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/30 uppercase font-bold">Dispatched</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/50 uppercase font-bold">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/30 uppercase font-bold">Cancelled</Badge>;
      case "pending_payment":
      default:
        return <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30 uppercase font-bold">Pending Payment</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-amber-400" />
            Orders & CarryBee Logistics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor customer orders, verify payments, manage delivery consignments, and execute status changes.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders()}
          disabled={loading}
          className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
          {[
            { id: "all", label: "All Orders" },
            { id: "paid", label: "Paid" },
            { id: "dispatched", label: "Dispatched" },
            { id: "completed", label: "Completed" },
            { id: "pending_payment", label: "Pending Payment" },
            { id: "cancelled", label: "Cancelled" },
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

      {/* Desktop Table View (Hidden on mobile < 768px) */}
      <Card className="hidden md:block border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
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
                    <th className="py-3.5 px-4">Order</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4">Courier Consignment</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Link href={`/admin/orders/${o.id}`} className="font-mono font-bold text-white text-xs hover:text-primary transition-colors flex items-center gap-1">
                            {o.order_number}
                          </Link>
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
                        ${Number(o.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(o.status)}
                      </td>
                      <td className="py-3.5 px-4">
                        {o.delivery?.consignment_id ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-[11px] font-bold text-amber-300">
                              {o.delivery.consignment_id}
                            </span>
                            <div>
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase px-1.5 py-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                              >
                                {o.delivery.status}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Not dispatched
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.status === "paid" && (
                            <Button
                              size="sm"
                              onClick={() => handleQuickDispatch(o)}
                              disabled={actionLoadingId === o.id}
                              className="h-7 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 px-2 gap-1"
                            >
                              <Send className="h-3 w-3" />
                              Dispatch
                            </Button>
                          )}

                          {o.status === "dispatched" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(o, "completed")}
                              disabled={actionLoadingId === o.id}
                              className="h-7 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 px-2 gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Complete
                            </Button>
                          )}

                          {o.status !== "cancelled" && o.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancellingOrder(o)}
                              disabled={actionLoadingId === o.id}
                              className="h-7 text-[11px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 px-2"
                            >
                              Cancel
                            </Button>
                          )}

                          <Link href={`/admin/orders/${o.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 border-slate-700 bg-slate-900 hover:bg-slate-800 text-white text-[11px] px-2 gap-1"
                            >
                              <span>Manage</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Card Stack View (Rendered on screens < 768px, down to 375px) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full bg-slate-800" />
            <Skeleton className="h-28 w-full bg-slate-800" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <Package className="h-8 w-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Orders Found</h3>
            <p className="text-xs text-slate-400">Try adjusting your status filter or search query.</p>
          </div>
        ) : (
          orders.map((o) => (
            <Card key={o.id} className="border-slate-800 bg-slate-900/90 shadow-md">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono font-black text-sm text-white">{o.order_number}</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(o.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>{getStatusBadge(o.status)}</div>
                </div>

                <div className="border-t border-b border-slate-800/80 py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-semibold text-white">{o.customer_name}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-300">{o.customer_phone}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Amount:</span>
                    <strong className="text-emerald-400 font-bold">${Number(o.total_amount).toFixed(2)}</strong>
                  </div>
                  {o.delivery?.consignment_id && (
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-400">Consignment:</span>
                      <span className="text-amber-300 font-bold">{o.delivery.consignment_id}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {o.status === "paid" && (
                    <Button
                      size="sm"
                      onClick={() => handleQuickDispatch(o)}
                      disabled={actionLoadingId === o.id}
                      className="h-8 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 gap-1 flex-1"
                    >
                      <Send className="h-3 w-3" />
                      Dispatch
                    </Button>
                  )}

                  {o.status === "dispatched" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(o, "completed")}
                      disabled={actionLoadingId === o.id}
                      className="h-8 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 gap-1 flex-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Complete
                    </Button>
                  )}

                  {o.status !== "cancelled" && o.status !== "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCancellingOrder(o)}
                      className="h-8 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10 px-3"
                    >
                      Cancel
                    </Button>
                  )}

                  <Link href={`/admin/orders/${o.id}`} className={o.status === "paid" || o.status === "dispatched" ? "" : "flex-1"}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs border-slate-700 bg-slate-900 text-white gap-1"
                    >
                      <span>Manage</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Dialog for Destructive Order Cancellation */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Cancel Order & Restore Inventory?
                </h3>
                <p className="text-xs text-slate-400">
                  Destructive Order Lifecycle Action
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5 text-xs text-slate-300">
              <p>
                Are you sure you want to cancel order{" "}
                <strong className="text-white font-mono">{cancellingOrder.order_number}</strong>?
              </p>
              <p className="text-amber-400 text-[11px] font-medium">
                &bull; All items in this order will be automatically unlocked and credited back to the active inventory stock balance.
              </p>
              <p className="text-slate-400 text-[11px]">
                &bull; An immutable audit log entry will be created in <code className="font-mono text-slate-300">inventory_logs</code>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingOrder(null)}
                disabled={cancellingLoading}
                className="border-slate-800 text-slate-300 hover:text-white"
              >
                Go Back
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCancel}
                disabled={cancellingLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
              >
                {cancellingLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Restoring Stock...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
