"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, HealthCheckResponse } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Server,
  Zap,
} from "lucide-react";

export function HealthBanner() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<HealthCheckResponse>({
    queryKey: ["healthCheck"],
    queryFn: api.health.check,
    retry: 1,
    staleTime: 10 * 1000,
  });

  return (
    <div className="w-full bg-slate-900 text-white border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Label */}
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              {isLoading ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              ) : isError ? (
                <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
              ) : (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLoading
                    ? "bg-amber-400"
                    : isError
                    ? "bg-red-500"
                    : "bg-emerald-500"
                }`}
              />
            </span>

            <span className="font-semibold text-slate-300">
              Backend Health:
            </span>

            {isLoading ? (
              <span className="text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Connecting to Laravel 13 API...
              </span>
            ) : isError ? (
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>API Endpoint Disconnected (http://localhost:8000/api/v1/health)</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] py-0">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  Status: {data?.status}
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
            <span className="hidden lg:inline text-[11px] text-slate-400">
              Milestone 1 • Foundation & Architecture
            </span>
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
  );
}
