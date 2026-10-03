"use client";

import * as React from "react";
import Link from "next/link";
import { api, Product, InventoryLog, PaginatedResponse } from "@/lib/api-client";
import { RestockDialog } from "@/components/admin/restock-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Boxes,
  Search,
  RefreshCw,
  Plus,
  History,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Filter,
  ArrowLeft,
} from "lucide-react";

export default function AdminInventoryPage() {
  const [activeTab, setActiveTab] = React.useState<"inventory" | "logs">("inventory");
  
  // Inventory state
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [stockStatus, setStockStatus] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [totalProducts, setTotalProducts] = React.useState(0);

  // Audit Logs state
  const [logs, setLogs] = React.useState<InventoryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [logsPage, setLogsPage] = React.useState(1);
  const [logsLastPage, setLogsLastPage] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);

  // Restock modal state
  const [restockProduct, setRestockProduct] = React.useState<Product | null>(null);

  // Fetch Inventory Products
  const fetchInventory = React.useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await api.admin.getInventory({
        page: currentPage,
        search: search.trim() || undefined,
        stock_status: stockStatus === "all" ? undefined : stockStatus,
      });

      setProducts(res.data || []);
      if (res.meta) {
        setLastPage(res.meta.last_page);
        setTotalProducts(res.meta.total || 0);
      } else {
        setTotalProducts(res.data?.length || 0);
      }
    } catch {
      // Fallback fallback products if backend is starting up
      try {
        const prodRes = await api.store.getProducts({ page: currentPage, search });
        let list = prodRes.data || [];
        if (stockStatus === "low_stock") {
          list = list.filter((p) => p.stock > 0 && p.stock <= 5);
        } else if (stockStatus === "out_of_stock") {
          list = list.filter((p) => p.stock <= 0);
        } else if (stockStatus === "in_stock") {
          list = list.filter((p) => p.stock > 5);
        }
        setProducts(list);
        setTotalProducts(prodRes.meta?.total || list.length);
      } catch {
        setProducts([]);
      }
    } finally {
      setLoadingProducts(false);
    }
  }, [currentPage, search, stockStatus]);

  // Fetch Inventory Audit Logs
  const fetchLogs = React.useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await api.admin.getInventoryLogs({ page: logsPage });
      setLogs(res.data || []);
      if (res.meta) {
        setLogsLastPage(res.meta.last_page);
        setTotalLogs(res.meta.total || 0);
      } else {
        setTotalLogs(res.data?.length || 0);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [logsPage]);

  React.useEffect(() => {
    if (activeTab === "inventory") {
      fetchInventory();
    } else {
      fetchLogs();
    }
  }, [activeTab, fetchInventory, fetchLogs]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Boxes className="h-6 w-6 text-indigo-400" />
              Inventory & Stock Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock ledger, atomic quantity adjustments, and historical balance audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (activeTab === "inventory" ? fetchInventory() : fetchLogs())}
            disabled={loadingProducts || loadingLogs}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingProducts || loadingLogs ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "inventory"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Active Stock Ledger</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
            {totalProducts}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "logs"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <History className="h-4 w-4" />
          <span>Inventory Audit Trail</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
            {totalLogs}
          </span>
        </button>
      </div>

      {activeTab === "inventory" ? (
        <div className="space-y-4">
          {/* Search & Stock Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products by SKU or name..."
                className="pl-9 h-9 text-xs bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              {[
                { id: "all", label: "All Items" },
                { id: "low_stock", label: "Low Stock (≤5)" },
                { id: "out_of_stock", label: "Out of Stock (0)" },
                { id: "in_stock", label: "Healthy (>5)" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => {
                    setStockStatus(chip.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    stockStatus === chip.id
                      ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Stock Table */}
          <Card className="border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              {loadingProducts ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full bg-slate-800" />
                  <Skeleton className="h-12 w-full bg-slate-800" />
                  <Skeleton className="h-12 w-full bg-slate-800" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <Package className="h-10 w-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No Products Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No products match your current search query or stock filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Product Info</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Available Units</th>
                        <th className="py-3 px-4">Health Status</th>
                        <th className="py-3 px-4 text-right">Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {products.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-white text-xs line-clamp-1">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-400 capitalize">
                                {item.category || "General Catalog"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                            {item.sku}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                            ${Number(item.price).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-sm text-white">
                              {item.stock}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1">units</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-bold ${
                                item.stock <= 0
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  : item.stock <= 5
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              }`}
                            >
                              {item.stock <= 0
                                ? "Out of Stock"
                                : item.stock <= 5
                                ? "Depleted"
                                : "Optimal"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              onClick={() => setRestockProduct(item)}
                              className="h-8 border-slate-700 bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white text-xs gap-1.5"
                              variant="outline"
                            >
                              <Boxes className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Adjust</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>
                Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{lastPage}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs border-slate-800 bg-slate-900"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= lastPage}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-8 text-xs border-slate-800 bg-slate-900"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Audit Logs Tab */
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-slate-800/80">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-400" />
                Immutable Inventory Audit Ledger
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Every stock delta triggered by customer orders, admin restocks, or cancellations is immutably recorded.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLogs ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full bg-slate-800" />
                  <Skeleton className="h-12 w-full bg-slate-800" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <History className="h-10 w-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No Audit Logs Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Inventory adjustments and order reservations will appear here as they occur.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Log ID</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Delta Units</th>
                        <th className="py-3 px-4">Balance After</th>
                        <th className="py-3 px-4">Event Type</th>
                        <th className="py-3 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500">
                            #{log.id}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-white line-clamp-1">
                              {log.product?.name || `Product #${log.product_id}`}
                            </span>
                            {log.product?.sku && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {log.product.sku}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            <div className="flex items-center gap-1">
                              {log.quantity_change > 0 ? (
                                <>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">+{log.quantity_change}</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                                  <span className="text-rose-400">{log.quantity_change}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-200">
                            {log.balance_after}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-mono font-medium border-slate-700 text-slate-300"
                            >
                              {log.reference_type?.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(log.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Logs Pagination */}
          {logsLastPage > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>
                Page <strong className="text-white">{logsPage}</strong> of <strong className="text-white">{logsLastPage}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsPage <= 1}
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs border-slate-800 bg-slate-900"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsPage >= logsLastPage}
                  onClick={() => setLogsPage((p) => p + 1)}
                  className="h-8 text-xs border-slate-800 bg-slate-900"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restock Dialog Modal */}
      <RestockDialog
        product={restockProduct}
        isOpen={!!restockProduct}
        onClose={() => setRestockProduct(null)}
        onSuccess={() => {
          fetchInventory();
          if (activeTab === "logs") fetchLogs();
        }}
      />
    </div>
  );
}
