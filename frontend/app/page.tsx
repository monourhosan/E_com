"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { HealthBanner } from "@/components/health-banner";
import { Hero } from "@/components/hero";
import { FeaturedCategories } from "@/components/featured-categories";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { useProducts } from "@/hooks/use-products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data, isLoading } = useProducts({ per_page: 6 });
  const featuredProducts = data?.data?.slice(0, 6) || [];

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-background">
      {/* Live Backend Connection Test Banner */}
      <HealthBanner />

      {/* Navigation Bar */}
      <Navbar />

      <main className="flex-1 w-full overflow-x-hidden">
        {/* Hero Section */}
        <Hero />

        {/* Featured Categories */}
        <FeaturedCategories />

        {/* Dynamic Catalog Section (Part 3 Storefront Feed) */}
        <section id="featured" className="py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  <Sparkles className="h-3 w-3 mr-1 text-primary inline" />
                  Featured Hardware
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Signature Collection
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Precision engineered devices backed by database row-level locking and atomic inventory.
                </p>
              </div>

              <Link href="/products">
                <Button variant="outline" className="gap-2 text-xs font-semibold">
                  Browse Full Catalog
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Product Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3 p-4 rounded-xl border bg-card">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <div className="pt-4 flex items-center justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Architecture Principles */}
        <Features />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
