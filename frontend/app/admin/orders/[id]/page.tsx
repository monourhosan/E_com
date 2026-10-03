"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, Order, Delivery, DeliveryTracking } from "@/lib/api-client";
import { getSimulatedOrderByNumber, getSimulatedOrders, simulateDispatchCarryBee } from "@/lib/order-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Truck,
  Package,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ExternalLink,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [order, setOrder] = React.useState<Order | null>(null);
  const [delivery, setDelivery] = React.useState<Delivery | null>(null);
  const [tracking, setTracking] = React.useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dispatching, setDispatching] = React.useState(false);
  const [copiedConsignment, setCopiedConsignment] = React.useState(false);
  const [copiedTracking, setCopiedTracking] = React.useState(false);

  const fetchOrderData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      // 1. Try authoritative backend admin API
      const res = await api.admin.getOrder(id);
      setOrder(res.order);
      setDelivery(res.delivery || res.order.delivery || null);

      // Fetch live tracking if delivery consignment exists
      if (res.delivery?.consignment_id || res.order.delivery?.consignment_id) {
        try {
          const statusRes = await api.admin.getDeliveryStatus(id);
          setTracking(statusRes.tracking || null);
        } catch {
          // Non-blocking tracking failure
        }
      }
    } catch {
      // 2. Fallback to offline / simulated order storage
      const allOrders = getSimulatedOrders();
      const found = allOrders.find(
        (o) => String(o.id) === id || o.order_number.toLowerCase() === id.toLowerCase()
      ) || getSimulatedOrderByNumber(id);

      if (found) {
        setOrder(found);
        setDelivery(found.delivery || null);
        if (found.delivery?.consignment_id) {
          setTracking({
            consignment_id: found.delivery.consignment_id,
            status: found.delivery.status,
            events: [
              { status: "Consignment Created", time: found.delivery.dispatched_at || found.created_at, location: "Dhaka Central Sorting Hub" },
              { status: "Picked Up by Courier", time: found.delivery.dispatched_at || found.created_at, location: "CarryBee Logistics Station" },
              { status: "In Transit", time: new Date().toISOString(), location: "Out for Last-Mile Delivery" },
            ],
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  const handleCopy = (text: string, type: "consignment" | "tracking") => {
    navigator.clipboard.writeText(text);
    if (type === "consignment") {
      setCopiedConsignment(true);
      setTimeout(() => setCopiedConsignment(false), 2000);
      toast.success("Consignment ID copied to clipboard");
    } else {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
      toast.success("Tracking Code copied to clipboard");
    }
  };

  const handleDispatchDelivery = async (sync = true) => {
    if (!order) return;
    setDispatching(true);

    try {
      // Call backend API
      const res = await api.admin.dispatchDelivery(order.id, sync);
      toast.success("CarryBee Dispatch Initiated", {
        description: res.message,
      });
      await fetchOrderData();
    } catch (err: unknown) {
      // Offline fallback simulation
      const simResult = simulateDispatchCarryBee(order.order_number, false);
      if (simResult) {
        setOrder(simResult.order);
        setDelivery(simResult.delivery);
        setTracking({
          consignment_id: simResult.delivery.consignment_id || "",
          status: simResult.delivery.status,
          events: [
            { status: "Consignment Created", time: simResult.delivery.dispatched_at || new Date().toISOString(), location: "Dhaka Hub" },
            { status: "Picked Up by Courier", time: simResult.delivery.dispatched_at || new Date().toISOString(), location: "CarryBee Station" },
          ],
        });
        toast.success("CarryBee Dispatch Simulated", {
          description: `Consignment ID: ${simResult.delivery.consignment_id}`,
        });
      } else {
        const errorMsg = err instanceof Error ? err.message : "Failed to dispatch delivery";
        toast.error("Dispatch Failed", { description: errorMsg });
      }
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 bg-slate-800" />
          <Skeleton className="h-6 w-48 bg-slate-800" />
        </div>
        <Skeleton className="h-44 w-full bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2 bg-slate-800" />
          <Skeleton className="h-64 bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md">
          Unable to locate order reference #{id} in the database or storage.
        </p>
        <Link href="/admin">
          <Button variant="outline" className="border-slate-700 bg-slate-900 text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isEligibleForDispatch =
    order.status === "paid" ||
    order.payment_method === "cod" ||
    delivery?.status === "failed" ||
    !delivery;

  const isAlreadyDispatched =
    delivery?.status === "dispatched" ||
    delivery?.status === "in_transit" ||
    delivery?.status === "delivered";

  const deliveryStatusBadgeStyle = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dispatched: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    in_transit: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    failed: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  }[delivery?.status || "pending"] || "bg-slate-800 text-slate-300";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin
            </Link>
            <span>/</span>
            <span className="text-slate-300">Orders</span>
            <span>/</span>
            <span className="font-mono text-primary">{order.order_number}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Order #{order.order_number}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs uppercase font-bold px-2.5 py-0.5 ${
                order.status === "paid" || order.status === "dispatched"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {order.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrderData()}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Courier & CarryBee Delivery Management Section */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/80 bg-slate-950/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base sm:text-lg font-bold text-white">
                    CarryBee Courier Dispatch
                  </CardTitle>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono uppercase tracking-wider">
                    Official Partner
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-400">
                  Automated asynchronous logistics integration with Redis Queues & backoff retry
                </CardDescription>
              </div>
            </div>

            {/* Re-dispatch / Retry Button */}
            {isEligibleForDispatch && (
              <Button
                size="sm"
                onClick={() => handleDispatchDelivery(true)}
                disabled={dispatching}
                className={`gap-2 font-semibold text-xs transition-all shadow-md ${
                  delivery?.status === "failed"
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : isAlreadyDispatched
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    : "bg-amber-600 hover:bg-amber-500 text-white"
                }`}
              >
                {dispatching ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : delivery?.status === "failed" ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry CarryBee Dispatch</span>
                  </>
                ) : isAlreadyDispatched ? (
                  <>
                    <SendHorizontal className="h-3.5 w-3.5" />
                    <span>Re-dispatch Consignment</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-3.5 w-3.5" />
                    <span>Dispatch to CarryBee</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {delivery ? (
            <div className="space-y-6">
              {/* Delivery Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Consignment ID */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Consignment ID
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-white truncate">
                      {delivery.consignment_id || "Awaiting Assignment"}
                    </span>
                    {delivery.consignment_id && (
                      <button
                        type="button"
                        onClick={() => handleCopy(delivery.consignment_id!, "consignment")}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Copy Consignment ID"
                      >
                        {copiedConsignment ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tracking Code */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Tracking Code
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-amber-400 truncate">
                      {delivery.tracking_code || "Pending Code"}
                    </span>
                    {delivery.tracking_code && (
                      <button
                        type="button"
                        onClick={() => handleCopy(delivery.tracking_code!, "tracking")}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Copy Tracking Code"
                      >
                        {copiedTracking ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Delivery Status Badge */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Courier Status
                  </span>
                  <div>
                    <Badge variant="outline" className={`text-xs font-bold uppercase ${deliveryStatusBadgeStyle}`}>
                      {delivery.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Dispatched At */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Dispatched At
                  </span>
                  <p className="text-xs font-semibold text-slate-300">
                    {delivery.dispatched_at
                      ? new Date(delivery.dispatched_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Not yet dispatched"}
                  </p>
                </div>
              </div>

              {/* Failure Alert (If Failed) */}
              {delivery.status === "failed" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Courier Dispatch Failure Detected</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed font-mono">
                    {delivery.failure_reason || "CarryBee external API connection timeout or rejected payload."}
                  </p>
                  <p className="text-[11px] text-rose-300/80">
                    Laravel queue worker will retry automatically based on backoff policy [10s, 1m, 5m, 15m, 1h], or click "Retry CarryBee Dispatch" above to trigger manual immediate dispatch.
                  </p>
                </div>
              )}

              {/* Delivery Timeline Tracker */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  CarryBee Delivery Timeline Tracker
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Step 1 */}
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 relative">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <span className="text-xs font-bold text-white">Order Confirmed</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Recorded in DB with locked stock</p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 relative">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <span className="text-xs font-bold text-white">Payment Verified</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {order.payment_method === "cod" ? "COD Pre-approved" : "Settled via Gateway"}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`p-3 rounded-lg border relative ${
                      isAlreadyDispatched
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                        : delivery.status === "failed"
                        ? "border-rose-500/30 bg-rose-500/5 text-rose-300"
                        : "border-slate-800 bg-slate-950/40 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          isAlreadyDispatched
                            ? "bg-emerald-500/20 text-emerald-400"
                            : delivery.status === "failed"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isAlreadyDispatched ? "✓" : delivery.status === "failed" ? "✕" : "3"}
                      </div>
                      <span className="text-xs font-bold text-white">CarryBee Dispatched</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {delivery.consignment_id ? delivery.consignment_id : "Awaiting transmission"}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`p-3 rounded-lg border relative ${
                      delivery.status === "delivered"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-slate-800 bg-slate-950/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          delivery.status === "delivered"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {delivery.status === "delivered" ? "✓" : "4"}
                      </div>
                      <span className="text-xs font-bold text-white">Delivered</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {delivery.status === "delivered" ? "Successfully Handed to Customer" : "In Transit to Destination"}
                    </p>
                  </div>
                </div>

                {/* Live Events log if available */}
                {tracking?.events && tracking.events.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 mt-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Live Courier Checkpoints
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {tracking.events.map((evt, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-900 last:border-0">
                          <span className="font-semibold text-white">{evt.status} ({evt.location})</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(evt.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-slate-400">
                This order has not been dispatched to CarryBee yet.
              </p>
              {isEligibleForDispatch && (
                <Button
                  size="sm"
                  onClick={() => handleDispatchDelivery(true)}
                  disabled={dispatching}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs gap-2"
                >
                  <Truck className="h-4 w-4" />
                  Dispatch Order Now
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Shipping Info */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-lg md:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Customer & Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400">Recipient Name</span>
                <p className="font-bold text-white text-sm">{order.customer_name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Contact Number</span>
                <p className="font-mono text-white flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {order.customer_phone}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Email Address</span>
                <p className="font-mono text-white flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 text-slate-400" />
                  {order.customer_email}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">Payment Channel</span>
                <p className="font-bold text-white uppercase flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3 text-slate-400" />
                  {order.payment_method}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-primary" />
                Shipping Destination (CarryBee Pickup Point)
              </span>
              <p className="text-slate-200 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {order.shipping_address}
              </p>
              {order.notes && (
                <p className="text-slate-400 italic text-[11px] bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/60">
                  Note: "{order.notes}"
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Financials & Items Breakdown */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
            {/* Items List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                  <div className="space-y-0.5 truncate pr-2">
                    <p className="font-semibold text-white truncate">{item.product_name}</p>
                    <p className="text-[10px] text-slate-400">
                      Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-mono text-slate-200 shrink-0">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-300">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax (5%)</span>
                <span className="font-mono text-slate-300">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CarryBee Courier Fee</span>
                <span className="font-mono text-slate-300">
                  {order.shipping_fee > 0 ? `$${order.shipping_fee.toFixed(2)}` : "Free"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="font-mono text-emerald-400">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
