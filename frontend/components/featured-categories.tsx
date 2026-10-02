import {
  Laptop,
  Smartphone,
  Watch,
  Headphones,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categories = [
  {
    name: "Flagship Audio",
    count: "12 Products",
    description: "Lossless acoustic headphones and earbuds",
    icon: Headphones,
    color: "from-blue-500/20 to-indigo-500/10",
    badge: "Hot",
  },
  {
    name: "Smart Wearables",
    count: "8 Products",
    description: "Titanium smartwatches with fitness tracking",
    icon: Watch,
    color: "from-purple-500/20 to-pink-500/10",
    badge: "New",
  },
  {
    name: "Mobile Devices",
    count: "15 Products",
    description: "Latest 5G smartphones and accessories",
    icon: Smartphone,
    color: "from-emerald-500/20 to-teal-500/10",
    badge: "Popular",
  },
  {
    name: "Workstations & Laptops",
    count: "9 Products",
    description: "High-performance creative machines",
    icon: Laptop,
    color: "from-amber-500/20 to-orange-500/10",
    badge: "Featured",
  },
];

export function FeaturedCategories() {
  return (
    <section id="categories" className="py-16 bg-muted/30 border-y">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <Badge variant="outline" className="mb-2">
              Browse Collections
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Featured Categories
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Curated premium hardware backed by official manufacturer warranty.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Dynamic catalog hydration powered by TanStack Query (Part 3)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card
                key={cat.name}
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-border/80"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-50 group-hover:opacity-100 transition-opacity`}
                />
                <CardContent className="p-6 relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-background shadow-sm border group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {cat.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      {cat.name}
                      <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-2 text-xs font-medium text-primary">
                    {cat.count}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
