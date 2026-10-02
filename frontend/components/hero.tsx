import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  CreditCard,
  Flame,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-24">
      {/* Decorative background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 bg-background/80 backdrop-blur shadow-sm border-primary/20 text-primary">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-primary animate-pulse" />
                Single-Vendor Flagship Store 2026
              </Badge>
              <Badge variant="secondary" className="hidden sm:inline-flex gap-1 text-xs">
                <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                Instant Delivery
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Engineered for <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Scale & Speed.</span> Built for Trust.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Experience ultra-responsive shopping powered by modern architecture:
              PostgreSQL row-locking, Redis caching, CarryBee courier automation, and instant checkout.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link href="#featured">
                <Button size="lg" className="w-full sm:w-auto shadow-md gap-2 font-semibold">
                  Explore Catalog
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#architecture">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium">
                  Architecture Overview
                </Button>
              </Link>
            </div>

            {/* Micro value tags */}
            <div className="pt-6 grid grid-cols-3 gap-3 border-t border-border/60 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">100%</div>
                <div className="text-xs text-muted-foreground">Atomic Stock</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">&lt; 50ms</div>
                <div className="text-xs text-muted-foreground">Redis Cached</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">24/7</div>
                <div className="text-xs text-muted-foreground">Courier Sync</div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Card Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-2xl border bg-card/60 backdrop-blur-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  v1.0.0 Architecture
                </Badge>
              </div>

              {/* Stack Features List */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-blue-500/10 text-blue-600">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">CarryBee Express</div>
                      <div className="text-[11px] text-muted-foreground">Automated courier dispatch</div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">Active</Badge>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">bKash & SSLCommerz</div>
                      <div className="text-[11px] text-muted-foreground">Instant payment webhooks</div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">Verified</Badge>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-purple-500/10 text-purple-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">PostgreSQL Concurrency</div>
                      <div className="text-[11px] text-muted-foreground">SELECT ... FOR UPDATE row-locking</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">ACID</Badge>
                </div>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-muted-foreground">
                  Ready for high-concurrency flash sales and automated fulfillment.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
