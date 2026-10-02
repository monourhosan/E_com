"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useProduct } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ChevronLeft,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Minus,
  Plus,
  ArrowRight,
  Package,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const { data: product, isLoading, isError } = useProduct(productId);
  const [quantity, setQuantity] = React.useState(1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-background">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <Skeleton className="h-6 w-36" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-background">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The product you requested does not exist or has been archived.
          </p>
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Catalog
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const maxAvailable = Math.max(product.stock, 1);

  const handleAddToCart = () => {
    toast.success("Added to Cart!", {
      description: `${quantity} × ${product.name} prepared for checkout (Part 4 system)`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-background">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition-colors">
            Storefront
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Image Viewer */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-border/80 bg-muted/30 shadow-md">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur shadow-sm">
                  {product.category}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  SKU: {product.sku}
                </span>
                {isOutOfStock ? (
                  <Badge variant="destructive" className="text-xs">
                    Out of Stock
                  </Badge>
                ) : isLowStock ? (
                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs">
                    Only {product.stock} units left
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-xs">
                    In Stock ({product.stock} units)
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                {product.name}
              </h1>

              <div className="pt-2 text-3xl font-extrabold text-foreground">
                {product.formatted_price}
              </div>
            </div>

            {/* Description */}
            <div className="border-t pt-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description & Specifications
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity Stepper & Add to Cart */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-foreground">Quantity:</span>
                <div className="flex items-center border rounded-lg overflow-hidden bg-card">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 hover:bg-muted text-foreground disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-4 py-1 text-sm font-bold min-w-[40px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="p-2 hover:bg-muted text-foreground disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  (Max {product.stock} available)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="flex-1 shadow-md gap-2 font-bold"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isOutOfStock ? "Out of Stock" : "Add to Shopping Cart"}
                </Button>

                <Link href="/products">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View Catalog
                  </Button>
                </Link>
              </div>
            </div>

            {/* Delivery & Warranty Trust Signals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t">
              <div className="p-3 rounded-xl bg-muted/40 border flex items-start gap-2.5">
                <Truck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <div className="font-semibold text-foreground">CarryBee Express</div>
                  <div className="text-muted-foreground">Tracked shipping</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <div className="font-semibold text-foreground">Official Warranty</div>
                  <div className="text-muted-foreground">1-Year Coverage</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border flex items-start gap-2.5">
                <RotateCcw className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <div className="font-semibold text-foreground">Atomic Inventory</div>
                  <div className="text-muted-foreground">Zero overselling</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
