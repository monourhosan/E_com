"use client";

import * as React from "react";
import { api, Product } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  ArrowRight,
  X,
  RefreshCw,
  Boxes,
} from "lucide-react";

interface RestockDialogProps {
  product: {
    id: number;
    name: string;
    sku: string;
    stock: number;
    price?: number | string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RestockDialog({
  product,
  isOpen,
  onClose,
  onSuccess,
}: RestockDialogProps) {
  const [quantity, setQuantity] = React.useState<number>(10);
  const [actionType, setActionType] = React.useState<"add" | "subtract">("add");
  const [reason, setReason] = React.useState<string>("Supplier Restock Batch");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(10);
      setActionType("add");
      setReason("Supplier Restock Batch");
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const quantityChange = actionType === "add" ? Math.abs(quantity) : -Math.abs(quantity);
  const newBalance = product.stock + quantityChange;
  const isInvalid = newBalance < 0 || quantity === 0 || isNaN(quantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) {
      setErrorMessage(`Cannot apply adjustment. New stock balance would be negative (${newBalance}).`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.admin.adjustInventory({
        product_id: product.id,
        quantity_change: quantityChange,
        reason: reason.trim() || "Manual Admin Stock Adjustment",
      });

      toast.success(res.message || `Stock for ${product.name} updated to ${res.product?.stock ?? newBalance} units.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.message || "Failed to adjust inventory stock.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Adjust Inventory Stock
              </h3>
              <p className="text-xs text-slate-400">
                Atomic stock adjustment with automatic audit logging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product Details Header */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-200 line-clamp-1">
              {product.name}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] uppercase font-bold ${
                product.stock <= 0
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : product.stock <= 5
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {product.stock <= 0 ? "Out of Stock" : product.stock <= 5 ? "Low Stock" : "In Stock"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SKU: {product.sku}</span>
            <span>Current: <strong className="text-white">{product.stock}</strong> units</span>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Action Mode Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType("add")}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-semibold transition-all ${
                  actionType === "add"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Stock (+)
              </button>
              <button
                type="button"
                onClick={() => setActionType("subtract")}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 font-semibold transition-all ${
                  actionType === "subtract"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800"
                }`}
              >
                <MinusCircle className="h-3.5 w-3.5" />
                Deduct Stock (-)
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Quantity Units</label>
            <Input
              type="number"
              min="1"
              max="10000"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="bg-slate-950/80 border-slate-800 text-white font-mono h-10"
              required
            />
          </div>

          {/* Reason preset / selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Adjustment Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Supplier Restock Batch">Supplier Restock Batch</option>
              <option value="Manual Warehouse Audit Count">Manual Warehouse Audit Count</option>
              <option value="Damaged / Broken Goods Write-off">Damaged / Broken Goods Write-off</option>
              <option value="Customer Return Restock">Customer Return Restock</option>
              <option value="Promotional Sample Allocation">Promotional Sample Allocation</option>
            </select>
          </div>

          {/* Stock Balance Live Preview */}
          <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 flex items-center justify-between font-mono">
            <div className="text-slate-400">
              <span>Before: </span>
              <span className="text-white font-bold">{product.stock}</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
            <div className="text-slate-400">
              <span>Change: </span>
              <span className={`font-bold ${quantityChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {quantityChange >= 0 ? `+${quantityChange}` : quantityChange}
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
            <div>
              <span className="text-slate-400">After: </span>
              <span
                className={`font-black text-sm ${
                  newBalance < 0
                    ? "text-rose-400"
                    : newBalance <= 5
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {newBalance}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="border-slate-800 text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || isInvalid}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm Adjustment"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
