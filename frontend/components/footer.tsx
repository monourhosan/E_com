import Link from "next/link";
import { Store, Github, Shield, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">ApexStore</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Single-vendor e-commerce platform built with Laravel 13, Next.js 15, PostgreSQL, and Redis.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="outline" className="text-[10px]">
                PHP 8.4
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Next.js 15
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                PostgreSQL 16
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Redis 7
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Catalog</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="#featured" className="hover:text-primary transition-colors">
                  Featured Products
                </Link>
              </li>
              <li>
                <Link href="#categories" className="hover:text-primary transition-colors">
                  Product Categories
                </Link>
              </li>
              <li>
                <Link href="#deals" className="hover:text-primary transition-colors">
                  Special Promotions
                </Link>
              </li>
              <li>
                <Link href="#stock" className="hover:text-primary transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture Roadmap Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Milestones</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Part 1: Monorepo Foundation & Health</li>
              <li>Part 2: Sanctum Auth & Admin Guards</li>
              <li>Part 3: Storefront & Catalog CRUD</li>
              <li>Part 4: Cart & Boundary Validation</li>
              <li>Part 5: Atomic Orders & Row-Locking</li>
              <li>Part 6: bKash & SSLCommerz Payments</li>
            </ul>
          </div>

          {/* Compliance & Admin */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Administration</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Role-protected administrative portal for real-time order processing, stock audits, and sales metrics.
            </p>
            <div>
              <Link href="/admin/login">
                <span className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Access Admin Login &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ApexStore E-Commerce. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Built with precision and ACID reliability
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
