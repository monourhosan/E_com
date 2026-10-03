"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ShoppingCart, DollarSign, Calendar } from "lucide-react";

export interface SalesDataPoint {
  date: string;
  label: string;
  sales: number;
  orders: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  title?: string;
  subtitle?: string;
}

// Custom executive dark-themed tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (active && payload && payload.length) {
    const currentSales = payload[0]?.value ?? 0;
    const currentOrders = payload.length > 1 ? payload[1]?.value ?? 0 : payload[0]?.payload?.orders ?? 0;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[160px]">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300 border-b border-slate-800 pb-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <DollarSign className="h-3 w-3 text-emerald-400" />
              Net Revenue:
            </span>
            <span className="font-bold text-emerald-400 font-mono">
              ${Number(currentSales).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <ShoppingCart className="h-3 w-3 text-indigo-400" />
              Orders Placed:
            </span>
            <span className="font-bold text-indigo-300 font-mono">
              {currentOrders}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function SalesChart({
  data,
  title = "14-Day Sales Velocity",
  subtitle = "Daily net revenue & order volume trend",
}: SalesChartProps) {
  const [mounted, setMounted] = React.useState(false);
  const [metricView, setMetricView] = React.useState<"sales" | "orders">("sales");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const total14DaySales = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  }, [data]);

  const total14DayOrders = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + (curr.orders || 0), 0);
  }, [data]);

  if (!mounted) {
    return (
      <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 bg-slate-800" />
            <Skeleton className="h-6 w-20 bg-slate-800" />
          </div>
          <Skeleton className="h-4 w-72 bg-slate-800" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full bg-slate-800/80 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-lg backdrop-blur">
      <CardHeader className="pb-3 border-b border-slate-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
                {title}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-400 mt-1">
              {subtitle}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setMetricView("sales")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                metricView === "sales"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200 bg-slate-800/50"
              }`}
            >
              Revenue (${total14DaySales.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
            </button>
            <button
              onClick={() => setMetricView("orders")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                metricView === "orders"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200 bg-slate-800/50"
              }`}
            >
              Orders ({total14DayOrders})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#334155"
                opacity={0.4}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(value) =>
                  metricView === "sales" ? `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}` : `${value}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              {metricView === "sales" ? (
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGradient)"
                  activeDot={{ r: 6, fill: "#10b981", stroke: "#0f172a", strokeWidth: 2 }}
                />
              ) : (
                <Area
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#ordersGradient)"
                  activeDot={{ r: 6, fill: "#6366f1", stroke: "#0f172a", strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
