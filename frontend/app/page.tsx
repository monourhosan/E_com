import { Navbar } from "@/components/navbar";
import { HealthBanner } from "@/components/health-banner";
import { Hero } from "@/components/hero";
import { FeaturedCategories } from "@/components/featured-categories";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Sparkles } from "lucide-react";

// Placeholder catalog items for Part 1 layout verification
const previewProducts = [
  {
    id: "p1",
    name: "Apex Pulse Wireless ANC Headphones",
    category: "Flagship Audio",
    price: "$299.00",
    rating: "4.9",
    stock: 24,
    badge: "Bestseller",
    description: "Active noise cancellation with 40-hour high-fidelity battery life.",
  },
  {
    id: "p2",
    name: "Apex Chrono Ultra Smartwatch",
    category: "Smart Wearables",
    price: "$349.00",
    rating: "4.8",
    stock: 15,
    badge: "Titanium",
    description: "Aerospace-grade titanium casing with dual-frequency GPS sensor.",
  },
  {
    id: "p3",
    name: "Apex Studio Mechanical Keyboard",
    category: "Workstations",
    price: "$179.00",
    rating: "5.0",
    stock: 8,
    badge: "Low Stock",
    description: "Gasket-mounted hot-swappable switches with CNC aluminum frame.",
  },
];

export default function HomePage() {
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

        {/* Catalog Preview Section (Target for Part 3 Integration) */}
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
                  Precision engineered devices ready for rapid delivery nationwide.
                </p>
              </div>
              <Badge variant="secondary" className="self-start sm:self-auto text-xs">
                Part 3 Dynamic Feed Target
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {previewProducts.map((product) => (
                <Card
                  key={product.id}
                  className="flex flex-col justify-between overflow-hidden border transition-all duration-200 hover:shadow-lg"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {product.category}
                      </span>
                      <Badge
                        variant={product.badge === "Low Stock" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {product.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg text-foreground leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />
                      <span>{product.rating}</span>
                      <span className="text-muted-foreground font-normal">(128 reviews)</span>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Unit Price</div>
                        <div className="text-xl font-bold text-foreground">
                          {product.price}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="gap-2 shadow-sm"
                        disabled
                        title="Cart system will be enabled in Part 4"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
