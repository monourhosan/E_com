"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart } from "@/context/cart-context";
import { api, ApiError, CheckoutPayload, PaymentMethodSettings } from "@/lib/api-client";
import {
  simulateOfflineCheckout,
  getSimulatedPaymentSettings,
} from "@/lib/order-storage";
import { PaymentSimulatorModal } from "@/components/payment-simulator-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  Lock,
  Loader2,
  AlertCircle,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// Bangladesh Phone Number regex: allows 013-019 (11 digits) or with +88/88 prefix
const BD_PHONE_REGEX = /^(\+?88)?01[3-9]\d{8}$/;

const checkoutSchema = z.object({
  customer_name: z
    .string()
    .min(2, "Full name must be at least 2 characters.")
    .max(150, "Full name cannot exceed 150 characters."),
  customer_phone: z
    .string()
    .min(11, "Phone number must be at least 11 digits.")
    .regex(BD_PHONE_REGEX, "Must be a valid Bangladeshi number (e.g., 01712345678 or +8801712345678)."),
  customer_email: z
    .string()
    .email("Please provide a valid email address.")
    .max(150, "Email cannot exceed 150 characters."),
  shipping_address: z
    .string()
    .min(8, "Please enter your complete street address (house, road, area, city).")
    .max(1000, "Address is too long."),
  payment_method: z.enum(["bkash", "sslcommerz", "cod"], {
    message: "Please select a payment method.",
  }),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    clearCart,
    subtotal,
    tax,
    shippingFee,
    totalAmount,
    totalItems,
    isFreeShipping,
    freeShippingThreshold,
    amountNeededForFreeShipping,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [stockError, setStockError] = React.useState<string | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Payment simulator modal state
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [activePaymentGateway, setActivePaymentGateway] = React.useState<"bkash" | "sslcommerz">("bkash");
  const [activeOrderNumber, setActiveOrderNumber] = React.useState("");
  const [activePaymentRecordId, setActivePaymentRecordId] = React.useState<number | undefined>();
  const [activePaymentId, setActivePaymentId] = React.useState<string | undefined>();
  const [activeCustomerPhone, setActiveCustomerPhone] = React.useState("");

  const [gatewaySettings, setGatewaySettings] = React.useState<{
    bkash_enabled: boolean;
    sslcommerz_enabled: boolean;
    cod_enabled: boolean;
    sandbox_mode: boolean;
  }>({
    bkash_enabled: true,
    sslcommerz_enabled: true,
    cod_enabled: true,
    sandbox_mode: true,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      shipping_address: "",
      payment_method: "bkash",
      notes: "",
    },
  });

  React.useEffect(() => {
    setIsHydrated(true);

    async function loadGatewaySettings() {
      try {
        const res = await api.store.getPaymentMethods();
        setGatewaySettings({
          bkash_enabled: res.methods.bkash,
          sslcommerz_enabled: res.methods.sslcommerz,
          cod_enabled: res.methods.cod,
          sandbox_mode: res.sandbox_mode,
        });

        // Set default payment method to the first enabled one
        if (!res.methods.bkash) {
          if (res.methods.sslcommerz) setValue("payment_method", "sslcommerz");
          else if (res.methods.cod) setValue("payment_method", "cod");
        }
      } catch {
        const sim = getSimulatedPaymentSettings();
        setGatewaySettings({
          bkash_enabled: sim.bkash_enabled,
          sslcommerz_enabled: sim.sslcommerz_enabled,
          cod_enabled: sim.cod_enabled,
          sandbox_mode: sim.sandbox_mode,
        });
      }
    }

    loadGatewaySettings();
  }, [setValue]);

  const selectedPaymentMethod = watch("payment_method");

  const handlePaymentSuccess = (transactionId: string) => {
    setPaymentModalOpen(false);
    clearCart();
    router.push(`/order-confirmation/${activeOrderNumber}?payment=success&trx=${transactionId}`);
  };

  const handlePaymentFailure = (reason: string) => {
    setPaymentModalOpen(false);
    setStockError(`Payment was cancelled or unsuccessful: ${reason}. Order #${activeOrderNumber} is saved in pending payment status.`);
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) {
      toast.error("Your cart is empty", {
        description: "Please add products before checking out.",
      });
      return;
    }

    setIsSubmitting(true);
    setStockError(null);

    const payload: CheckoutPayload = {
      customer_name: data.customer_name.trim(),
      customer_phone: data.customer_phone.trim(),
      customer_email: data.customer_email.trim(),
      shipping_address: data.shipping_address.trim(),
      payment_method: data.payment_method,
      notes: data.notes?.trim() || undefined,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    try {
      let orderNumber: string;

      try {
        // Attempt primary authoritative backend endpoint
        const response = await api.store.checkout(payload);
        orderNumber = response.data.order_number;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 422) {
          // Stock exhaustion or validation error from backend PostgreSQL transaction
          const errorDetails = err.details as { message?: string; error?: string } | undefined;
          const msg = errorDetails?.message || errorDetails?.error || err.message;
          setStockError(msg);
          toast.error("Inventory Check Failed", { description: msg });
          setIsSubmitting(false);
          return;
        }

        // If backend server is offline or unreachable, use resilient local simulation with row locking
        const offlineOrder = simulateOfflineCheckout(payload);
        orderNumber = offlineOrder.order_number;
      }

      // If Cash on Delivery, order is placed immediately
      if (data.payment_method === "cod") {
        toast.success("Order Placed Successfully!", {
          description: `Order #${orderNumber} confirmed with Cash on Delivery.`,
        });
        clearCart();
        router.push(`/order-confirmation/${orderNumber}`);
        return;
      }

      // Online Gateway: bKash or SSLCommerz
      try {
        const payRes = await api.store.initiatePayment(orderNumber, data.payment_method);
        const initData = payRes.data;

        if (initData.is_sandbox) {
          setActivePaymentGateway(data.payment_method as "bkash" | "sslcommerz");
          setActiveOrderNumber(orderNumber);
          setActivePaymentRecordId(initData.payment_record_id);
          setActivePaymentId(initData.payment_id);
          setActiveCustomerPhone(data.customer_phone);
          setPaymentModalOpen(true);
          setIsSubmitting(false);
          return;
        } else if (initData.redirect_url) {
          clearCart();
          window.location.href = initData.redirect_url;
          return;
        }
      } catch {
        // Offline / fallback simulator
        setActivePaymentGateway(data.payment_method as "bkash" | "sslcommerz");
        setActiveOrderNumber(orderNumber);
        setActiveCustomerPhone(data.customer_phone);
        setPaymentModalOpen(true);
        setIsSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${orderNumber}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to place order.";
      setStockError(errMsg);
      toast.error("Checkout Error", { description: errMsg });
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Initializing checkout...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-4">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Your Cart is Empty</h1>
        <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
          Looks like you haven't added any products to your cart yet. Explore our high-performance hardware and flagship gear.
        </p>
        <Link href="/products">
          <Button size="lg" className="font-semibold gap-2">
            <ArrowLeft className="h-4 w-4" />
            Explore Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb / Header */}
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Catalog
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Secure Checkout
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Complete your details below to finalize your order.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full shadow-sm text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>256-Bit Encrypted & ACID Row-Locked</span>
            </div>
          </div>
        </div>

        {/* Stock Exhaustion or Critical Error Banner */}
        {stockError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1 text-sm flex-1">
              <p className="font-bold">Inventory Validation Notice</p>
              <p className="text-xs leading-relaxed">{stockError}</p>
            </div>
          </div>
        )}

        {/* Main Two-Column Layout (single column on mobile 375px) */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Details & Payment Selector */}
            <div className="lg:col-span-7 space-y-6">
              {/* Customer Details Card */}
              <div className="bg-background rounded-2xl border p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      1
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Customer Information
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">* Required fields</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label
                      htmlFor="customer_name"
                      className="text-xs font-semibold text-foreground"
                    >
                      Full Name *
                    </label>
                    <input
                      id="customer_name"
                      type="text"
                      placeholder="e.g. Tanvir Ahmed"
                      className={`w-full h-11 px-3.5 rounded-xl border bg-background text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.customer_name ? "border-rose-500 focus:border-rose-500" : "border-input focus:border-primary"
                      }`}
                      {...register("customer_name")}
                    />
                    {errors.customer_name && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errors.customer_name.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="customer_phone"
                      className="text-xs font-semibold text-foreground flex items-center justify-between"
                    >
                      <span>Phone Number (BD) *</span>
                      <span className="text-[10px] text-muted-foreground">01XXXXXXXXX</span>
                    </label>
                    <input
                      id="customer_phone"
                      type="tel"
                      placeholder="01712345678"
                      className={`w-full h-11 px-3.5 rounded-xl border bg-background text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.customer_phone ? "border-rose-500 focus:border-rose-500" : "border-input focus:border-primary"
                      }`}
                      {...register("customer_phone")}
                    />
                    {errors.customer_phone && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errors.customer_phone.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="customer_email"
                      className="text-xs font-semibold text-foreground"
                    >
                      Email Address *
                    </label>
                    <input
                      id="customer_email"
                      type="email"
                      placeholder="tanvir@example.com"
                      className={`w-full h-11 px-3.5 rounded-xl border bg-background text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.customer_email ? "border-rose-500 focus:border-rose-500" : "border-input focus:border-primary"
                      }`}
                      {...register("customer_email")}
                    />
                    {errors.customer_email && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errors.customer_email.message}
                      </p>
                    )}
                  </div>

                  {/* Street Address */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label
                      htmlFor="shipping_address"
                      className="text-xs font-semibold text-foreground"
                    >
                      Delivery Street Address *
                    </label>
                    <textarea
                      id="shipping_address"
                      rows={3}
                      placeholder="House / Apartment #, Road #, Sector / Area, City (e.g., House 14, Road 5, Dhanmondi, Dhaka 1205)"
                      className={`w-full p-3.5 rounded-xl border bg-background text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none ${
                        errors.shipping_address ? "border-rose-500 focus:border-rose-500" : "border-input focus:border-primary"
                      }`}
                      {...register("shipping_address")}
                    />
                    {errors.shipping_address && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errors.shipping_address.message}
                      </p>
                    )}
                  </div>

                  {/* Delivery Notes */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label
                      htmlFor="notes"
                      className="text-xs font-semibold text-foreground flex items-center justify-between"
                    >
                      <span>Delivery Notes / Instructions</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
                    </label>
                    <input
                      id="notes"
                      type="text"
                      placeholder="e.g., Please ring bell twice or leave with concierge"
                      className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      {...register("notes")}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Card */}
              <div className="bg-background rounded-2xl border p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    2
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Select Payment Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* bKash Card */}
                  {gatewaySettings.bkash_enabled ? (
                    <label
                      onClick={() => setValue("payment_method", "bkash")}
                      className={`relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedPaymentMethod === "bkash"
                          ? "border-[#E2136E] bg-[#E2136E]/5 shadow-sm"
                          : "border-border hover:border-border/80 bg-background/50 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        value="bkash"
                        className="sr-only"
                        {...register("payment_method")}
                      />
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-[#E2136E]/10 text-[#E2136E] flex items-center justify-center font-bold">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        {selectedPaymentMethod === "bkash" && (
                          <CheckCircle2 className="h-4 w-4 text-[#E2136E]" />
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-foreground">bKash</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Instant mobile financial payment
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border/70 opacity-40 bg-muted/20 cursor-not-allowed">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-muted-foreground">bKash</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Currently Disabled</p>
                      </div>
                    </div>
                  )}

                  {/* SSLCommerz Card */}
                  {gatewaySettings.sslcommerz_enabled ? (
                    <label
                      onClick={() => setValue("payment_method", "sslcommerz")}
                      className={`relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedPaymentMethod === "sslcommerz"
                          ? "border-blue-600 bg-blue-600/5 shadow-sm"
                          : "border-border hover:border-border/80 bg-background/50 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        value="sslcommerz"
                        className="sr-only"
                        {...register("payment_method")}
                      />
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        {selectedPaymentMethod === "sslcommerz" && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-foreground">SSLCommerz</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Debit / Credit Cards & NetBanking
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border/70 opacity-40 bg-muted/20 cursor-not-allowed">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-muted-foreground">SSLCommerz</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Currently Disabled</p>
                      </div>
                    </div>
                  )}

                  {/* Cash on Delivery Card */}
                  {gatewaySettings.cod_enabled ? (
                    <label
                      onClick={() => setValue("payment_method", "cod")}
                      className={`relative flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedPaymentMethod === "cod"
                          ? "border-emerald-600 bg-emerald-600/5 shadow-sm"
                          : "border-border hover:border-border/80 bg-background/50 hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        value="cod"
                        className="sr-only"
                        {...register("payment_method")}
                      />
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                          <Banknote className="h-4 w-4" />
                        </div>
                        {selectedPaymentMethod === "cod" && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-foreground">Cash on Delivery</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Pay upon doorstep arrival
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border/70 opacity-40 bg-muted/20 cursor-not-allowed">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <div className="mt-3">
                        <p className="font-bold text-xs text-muted-foreground">Cash on Delivery</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Currently Disabled</p>
                      </div>
                    </div>
                  )}
                </div>
                {errors.payment_method && (
                  <p className="text-[11px] text-rose-500 font-medium">
                    {errors.payment_method.message}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Sticky Order Summary */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="bg-background rounded-2xl border p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Order Summary
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </Badge>
                </div>

                {/* Free Shipping Progress */}
                <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      {isFreeShipping ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Free Express Shipping Unlocked!
                        </span>
                      ) : (
                        <span>
                          Add{" "}
                          <span className="font-bold text-primary">
                            ${amountNeededForFreeShipping.toFixed(2)}
                          </span>{" "}
                          for Free Shipping
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isFreeShipping ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Itemized Line Items List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-border/60 pr-1">
                  {items.map((item) => (
                    <div key={item.product_id} className="py-3 flex items-center gap-3">
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden border bg-muted/40 shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {item.sku}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.quantity} × {item.formatted_price}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Computation Breakdown */}
                <div className="border-t pt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Estimated Tax (5% VAT)</span>
                    <span className="font-medium text-foreground">
                      ${tax.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Shipping Fee</span>
                    {shippingFee === 0 ? (
                      <Badge variant="success" className="text-[10px] py-0">
                        FREE
                      </Badge>
                    ) : (
                      <span className="font-medium text-foreground">
                        ${shippingFee.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between text-sm font-bold text-foreground">
                    <span>Total Amount</span>
                    <span className="text-xl text-primary font-black">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full h-12 text-sm font-bold shadow-lg gap-2 rounded-xl transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Securing Inventory & Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Place Order • ${totalAmount.toFixed(2)}</span>
                    </>
                  )}
                </Button>

                {/* Trust and Safety Badges */}
                <div className="space-y-2 pt-2 text-[11px] text-muted-foreground border-t">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>PostgreSQL row-level locking ensures atomic stock decrement.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>100% Genuine original equipment with manufacturer warranty.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Branded Interactive Payment Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={paymentModalOpen}
        gateway={activePaymentGateway}
        orderNumber={activeOrderNumber}
        totalAmount={totalAmount}
        paymentRecordId={activePaymentRecordId}
        paymentId={activePaymentId}
        customerPhone={activeCustomerPhone}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onClose={() => setPaymentModalOpen(false)}
      />
    </div>
  );
}
