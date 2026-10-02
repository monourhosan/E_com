"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    shippingFee,
    totalAmount,
    totalItems,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    isFreeShipping,
  } = useCart();

  // Handle escape key to close drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  const handleCheckoutRedirect = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-background border-l shadow-2xl transition-transform duration-300 ease-in-out flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Your Shopping Bag
              </h2>
              <Badge variant="secondary" className="text-xs">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={closeCart}
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="px-6 py-3 bg-muted/30 border-b space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Truck className="h-3.5 w-3.5 text-primary" />
                {isFreeShipping ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Free shipping unlocked!
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
              <span className="text-[11px] text-muted-foreground font-mono">
                {freeShippingProgress}%
              </span>
            </div>

            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFreeShipping ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Items List (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/60">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-[240px]">
                  <h3 className="font-semibold text-base text-foreground">
                    Your bag is empty
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Explore our curated flagship devices and add items to your cart.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeCart}
                  className="mt-2 text-xs"
                >
                  <Link href="/products">Browse Catalog</Link>
                </Button>
              </div>
            ) : (
              items.map((item) => {
                const isMaxStock = item.quantity >= item.stock;

                return (
                  <div key={item.product_id} className="py-4 flex gap-4 items-start">
                    {/* Thumbnail */}
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-muted/40 border shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.product_id}`}
                          onClick={closeCart}
                          className="font-medium text-xs text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.sku}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {item.formatted_price}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center border rounded-md bg-background">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={isMaxStock}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40"
                            aria-label="Increase quantity"
                            title={isMaxStock ? "Max stock available" : undefined}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Financial Breakdown */}
          {items.length > 0 && (
            <div className="border-t bg-card/60 backdrop-blur p-6 space-y-4">
              <div className="space-y-2 text-xs">
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

                <div className="border-t pt-2 flex items-center justify-between text-sm font-bold text-foreground">
                  <span>Total Amount</span>
                  <span className="text-lg text-primary font-extrabold">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleCheckoutRedirect}
                  className="w-full h-11 font-bold shadow-md gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    ACID Inventory Locking
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-muted-foreground hover:text-destructive transition-colors underline"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
