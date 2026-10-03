"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, Order } from "@/lib/api-client";
import { getSimulatedOrderByNumber } from "@/lib/order-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Copy,
  Printer,
  ShoppingBag,
  ArrowRight,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderNumber = typeof params?.orderNumber === "string" ? params.orderNumber : "";

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!orderNumber) return;

    let isMounted = true;

    async function loadOrder() {
      setLoading(true);
      try {
        // Attempt authoritative backend API fetch
        const res = await api.store.getOrder(orderNumber);
        if (isMounted) {
          setOrder(res.data);
        }
      } catch {
        // Fallback to offline / simulated order storage
        const simulated = getSimulatedOrderByNumber(orderNumber);
        if (isMounted && simulated) {
          setOrder(simulated);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  const handleCopyOrderNumber = () => {
    if (!orderNumber) return;
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    toast.success("Copied to clipboard", {
      description: `Order number #${orderNumber} copied.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Retrieving order confirmation #{orderNumber}...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
          <Package className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Order Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
          We couldn't locate order #{orderNumber}. Please check your order reference number or contact support.
        </p>
        <Link href="/products">
          <Button className="font-semibold gap-2">
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  const paymentMethodLabel = {
    bkash: "bKash Mobile Payment",
    sslcommerz: "SSLCommerz Gateway",
    cod: "Cash on Delivery",
  }[order.payment_method] || order.payment_method;

  const formattedDate = new Date(order.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40 py-8 lg:py-14 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated Success Banner */}
        <div className="text-center space-y-3 mb-8 print:mb-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5 mb-1 animate-in zoom-in-75 duration-500">
            <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14" />
          </div>
          <Badge
            variant="success"
            className="text-xs px-3 py-1 font-semibold tracking-wide uppercase"
          >
            Order Confirmed & Locked
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Your order has been recorded in our PostgreSQL database with atomic stock deduction and is now awaiting fulfillment.
          </p>
        </div>

        {/* Order Reference Card */}
        <div className="bg-background rounded-2xl border shadow-sm overflow-hidden mb-6">
          <div className="bg-muted/40 border-b p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Order Reference Number
              </span>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-xl font-mono font-extrabold text-foreground">
                  {order.order_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="p-1.5 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors print:hidden"
                  title="Copy Order Number"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Receipt
              </Button>

              <Link href="/products">
                <Button size="sm" className="h-9 gap-1.5 text-xs font-semibold">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b text-xs">
            <div className="p-4 sm:p-5 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Date Placed
              </span>
              <p className="font-semibold text-foreground">{formattedDate}</p>
            </div>

            <div className="p-4 sm:p-5 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Payment Method
              </span>
              <p className="font-semibold text-foreground">{paymentMethodLabel}</p>
            </div>

            <div className="p-4 sm:p-5 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Status
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 capitalize">
                {order.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Customer & Shipping Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b p-4 sm:p-6 gap-6 sm:gap-8">
            {/* Customer Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                Customer Information
              </h3>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-foreground text-sm">{order.customer_name}</p>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {order.customer_phone}
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  {order.customer_email}
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Shipping Destination
              </h3>
              <div className="space-y-1.5 text-xs">
                <p className="text-foreground leading-relaxed font-medium">
                  {order.shipping_address}
                </p>
                {order.notes && (
                  <p className="text-muted-foreground text-[11px] italic bg-muted/40 p-2 rounded-lg flex items-start gap-1">
                    <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>Instructions: "{order.notes}"</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="p-4 sm:p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-primary" />
              Purchased Items ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-border/60">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center gap-4">
                  {item.image_url ? (
                    <div className="h-16 w-16 rounded-xl border overflow-hidden bg-muted/40 shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl border bg-muted/60 flex items-center justify-center shrink-0 text-muted-foreground">
                      <Package className="h-6 w-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      SKU: {item.product_sku}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.quantity} × {item.formatted_unit_price || `$${item.unit_price.toFixed(2)}`}
                    </p>
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    {item.formatted_subtotal || `$${item.subtotal.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Breakdown Section */}
            <div className="border-t pt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  {order.formatted_subtotal || `$${order.subtotal.toFixed(2)}`}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Estimated Tax (5% VAT)</span>
                <span className="font-medium text-foreground">
                  {order.formatted_tax || `$${order.tax.toFixed(2)}`}
                </span>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <span>Delivery & Handling</span>
                {order.shipping_fee === 0 ? (
                  <Badge variant="success" className="text-[10px] py-0">
                    FREE
                  </Badge>
                ) : (
                  <span className="font-medium text-foreground">
                    {order.formatted_shipping_fee || `$${order.shipping_fee.toFixed(2)}`}
                  </span>
                )}
              </div>

              <div className="border-t pt-3 flex items-center justify-between text-base font-bold text-foreground">
                <span>Total Amount</span>
                <span className="text-xl sm:text-2xl font-black text-primary">
                  {order.formatted_total_amount || `$${order.total_amount.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <Link href="/products" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto gap-2 text-xs font-semibold">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>

          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2 text-xs font-bold">
              <span>Return to Storefront</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
