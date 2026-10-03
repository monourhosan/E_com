"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  LogOut,
  Store,
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  Bell,
  Menu,
  X,
  CreditCard,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Exclude login page from protection loop
  const isLoginPage = pathname === "/admin/login";

  React.useEffect(() => {
    if (!isLoading && !isLoginPage) {
      if (!isAuthenticated || !isAdmin) {
        router.replace("/admin/login");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show Skeleton loading while resolving auth state
  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 space-y-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-4xl space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48 bg-slate-800" />
            <Skeleton className="h-10 w-24 bg-slate-800" />
          </div>
          <Skeleton className="h-32 w-full bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 w-full bg-slate-800" />
            <Skeleton className="h-28 w-full bg-slate-800" />
            <Skeleton className="h-28 w-full bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 w-full overflow-x-hidden">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base leading-tight flex items-center gap-1.5">
                  Apex Admin
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary py-0">
                    Live
                  </Badge>
                </span>
                <span className="text-[10px] text-slate-400">Single-Vendor Control Plane</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3 text-xs font-medium text-slate-300">
              <Link
                href="/admin"
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  pathname === "/admin"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <Link
                href="/admin/settings/payment"
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  pathname === "/admin/settings/payment"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Payment Gateways
              </Link>
              <Link
                href="/"
                target="_blank"
                className="px-2.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Store className="h-3.5 w-3.5" />
                View Storefront
              </Link>
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-white">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">{user?.email}</span>
            </div>

            <Badge
              variant="outline"
              className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/30 uppercase text-[10px] font-bold"
            >
              {user?.role}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs border-slate-700 bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 gap-1.5 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900 px-4 py-3 space-y-2">
            <div className="pb-2 border-b border-slate-800">
              <div className="text-xs font-semibold text-white">{user?.name}</div>
              <div className="text-[10px] text-slate-400">{user?.email}</div>
            </div>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-xs font-medium hover:bg-slate-800"
            >
              Dashboard Overview
            </Link>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-xs font-medium hover:bg-slate-800"
            >
              Storefront Preview
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
