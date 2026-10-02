"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Store,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const cartItemCount = 0; // Will be connected to cart state in Part 4

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight flex items-center gap-1.5">
                ApexStore
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Single-Vendor
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link
              href="/"
              className="text-foreground transition-colors hover:text-primary font-semibold"
            >
              Storefront
            </Link>
            <Link
              href="#categories"
              className="transition-colors hover:text-primary"
            >
              Categories
            </Link>
            <Link
              href="#featured"
              className="transition-colors hover:text-primary"
            >
              Featured
            </Link>
            <Link
              href="#about"
              className="transition-colors hover:text-primary"
            >
              About
            </Link>
          </nav>
        </div>

        {/* Search Bar Placeholder (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-sm mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search premium catalog..."
              className="h-9 w-full rounded-full border border-input bg-muted/40 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin link placeholder */}
          <Link href="/admin/login" className="hidden sm:inline-block">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Button>
          </Link>

          {/* Cart Icon Button */}
          <Button
            variant="outline"
            size="icon"
            className="relative rounded-full h-10 w-10 border-input hover:bg-accent"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                {cartItemCount}
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground">
                0
              </span>
            )}
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background px-4 py-4 space-y-3">
          <div className="relative w-full mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search catalog..."
              className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-4 text-sm"
            />
          </div>
          <nav className="flex flex-col space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
            >
              Storefront
            </Link>
            <Link
              href="#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
            >
              Categories
            </Link>
            <Link
              href="#featured"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
            >
              Featured
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent flex items-center justify-between"
            >
              <span>Admin Portal</span>
              <Badge variant="outline">Part 2</Badge>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
