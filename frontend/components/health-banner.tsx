"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, HealthCheckResponse, API_BASE_URL } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Server,
  HelpCircle,
  ExternalLink,
  X,
  Terminal,
  Cloud,
} from "lucide-react";

export function HealthBanner() {
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLiveSite =
    isMounted &&
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  const isLocalhostTarget = API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<HealthCheckResponse>({
    queryKey: ["healthCheck"],
    queryFn: api.health.check,
    retry: 1,
    staleTime: 10 * 1000,
  });

  return (
    <>
      <div className="w-full bg-slate-900 text-white border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Status Label */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-2 w-2 relative">
                {isLoading ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                ) : isError ? (
                  <span className={`inline-flex h-2 w-2 rounded-full ${isLiveSite ? "bg-amber-400" : "bg-red-500"}`} />
                ) : (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isLoading
                      ? "bg-amber-400"
                      : isError
                      ? isLiveSite
                        ? "bg-amber-400"
                        : "bg-red-500"
                      : "bg-emerald-500"
                  }`}
                />
              </span>

              <span className="font-semibold text-slate-300">
                Backend Status:
              </span>

              {isLoading ? (
                <span className="text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Pinging Laravel 13 API...
                </span>
              ) : isLiveSite && isLocalhostTarget ? (
                <div className="flex items-center gap-2 flex-wrap text-slate-300">
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] py-0">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                    Storefront Online
                  </Badge>
                  <span className="text-slate-300">
                    Interactive Showcase Mode (Catalog, Cart & Checkout Active)
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsGuideOpen(true)}
                    className="h-auto p-0 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 flex items-center gap-1"
                  >
                    <HelpCircle className="h-3 w-3" />
                    Cloud Backend Setup
                  </Button>
                </div>
              ) : isError ? (
                <div className="flex items-center gap-2 flex-wrap text-slate-300">
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>API Disconnected (<code className="text-rose-300">{API_BASE_URL}</code>)</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsGuideOpen(true)}
                    className="h-auto p-0 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 flex items-center gap-1"
                  >
                    <HelpCircle className="h-3 w-3" />
                    How to fix & connect backend
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] py-0">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                    Online: {data?.status}
                  </Badge>
                  <span className="hidden sm:inline text-slate-400">|</span>
                  <span className="text-slate-300 hidden sm:inline-flex items-center gap-1">
                    <Server className="h-3 w-3 text-blue-400" />
                    {data?.service}
                  </span>
                  <span className="hidden md:inline text-slate-400">|</span>
                  <span className="text-slate-300 hidden md:inline-flex items-center gap-1">
                    <Database className="h-3 w-3 text-emerald-400" />
                    DB: {data?.database}
                  </span>
                </div>
              )}
            </div>

            {/* Action / Refresh */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-6 px-2 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${isFetching ? "animate-spin" : ""}`}
                />
                Test Ping
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting & Connection Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Connecting Your Laravel API to Vercel
                  </h3>
                  <p className="text-xs text-slate-400">
                    Why the backend appears disconnected and how to resolve it
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsGuideOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="py-4 space-y-4 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              {/* Diagnosis Box */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Why is this showing on the live website?
                </div>
                <p className="text-[11px] text-amber-200/90">
                  Your Next.js frontend is deployed on <strong>Vercel (HTTPS)</strong>, but the environment variable <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-100 font-mono">NEXT_PUBLIC_API_URL</code> is currently targeting <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-100 font-mono">{API_BASE_URL}</code>.
                </p>
                <p className="text-[11px] text-amber-200/90">
                  Modern browsers <strong>block HTTPS websites from requesting insecure HTTP localhost endpoints</strong> (Mixed Content Security Policy). Additionally, <code className="font-mono">localhost</code> on visitors&apos; browsers points to their own machine, not your computer!
                </p>
              </div>

              {/* Solution 1: Cloud Deployment */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Cloud className="h-4 w-4 text-cyan-400" />
                  Option 1: Deploy Backend to Cloud (Production)
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                  <li>Deploy the <code className="font-mono text-cyan-300">backend/</code> directory to Railway, Render, Fly.io, or your VPS with PostgreSQL & Redis.</li>
                  <li>In your <strong>Vercel Dashboard</strong> → <strong>Project Settings</strong> → <strong>Environment Variables</strong>:</li>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-slate-200">
                    NEXT_PUBLIC_API_URL = https://your-backend-api.railway.app/api/v1
                  </div>
                  <li>Redeploy on Vercel so the frontend queries your live cloud API.</li>
                </ol>
              </div>

              {/* Solution 2: Localhost Tunnel */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  Option 2: Instant HTTPS Tunnel (Quick Local Demo)
                </div>
                <p className="text-[11px] text-slate-300">
                  If you want your live Vercel site to connect to your local computer&apos;s Laravel server right now:
                </p>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-emerald-300">
                  npx localtunnel --port 8000
                </div>
                <p className="text-[11px] text-slate-400">
                  This generates a temporary public HTTPS URL (e.g. <code className="font-mono text-slate-300">https://xyz.loca.lt</code>). Add <code className="font-mono text-slate-300">/api/v1</code> and set it in Vercel as <code className="font-mono text-slate-300">NEXT_PUBLIC_API_URL</code>.
                </p>
              </div>

              {/* Offline Demo Status */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1 text-[11px]">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Interactive Storefront Is Active
                </div>
                <p className="text-emerald-300/80">
                  The frontend includes built-in client-side resilience. You can browse all products, filter by categories, add items to cart, test quantity limits, and complete checkout.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGuideOpen(false)}
                className="text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
              >
                Close Guide
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
