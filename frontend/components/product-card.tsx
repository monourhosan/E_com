import Link from "next/link";
import { Product } from "@/lib/api-client";
import { useCart } from "@/context/cart-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, AlertCircle, CheckCircle2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Card className="group flex flex-col justify-between overflow-hidden border border-border/80 bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div>
        {/* Product Image Container */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Category & Status Overlay Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur text-[11px] font-medium shadow-sm">
              {product.category}
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            {isOutOfStock ? (
              <Badge variant="destructive" className="text-[10px] font-semibold">
                Out of Stock
              </Badge>
            ) : isLowStock ? (
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                Only {product.stock} left
              </Badge>
            ) : (
              <Badge variant="success" className="text-[10px] font-semibold">
                In Stock ({product.stock})
              </Badge>
            )}
          </div>
        </div>

        {/* Content Details */}
        <CardContent className="p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
              {product.sku}
            </span>
          </div>

          <Link href={`/products/${product.id}`} className="block">
            <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description || "Precision engineered hardware ready for instant dispatch."}
          </p>
        </CardContent>
      </div>

      {/* Footer Actions */}
      <div className="p-5 pt-0 border-t border-border/50 flex items-center justify-between gap-3 mt-auto">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Price
          </div>
          <div className="text-lg font-bold text-foreground">
            {product.formatted_price}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/products/${product.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              title="View product specifications"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Details</span>
            </Button>
          </Link>

          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={() => addItem(product, 1)}
            className="h-8 px-3 text-xs gap-1.5 shadow-sm font-semibold"
            title={isOutOfStock ? "Product is currently out of stock" : "Add to cart"}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
