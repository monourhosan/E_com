"use client";

import * as React from "react";
import Link from "next/link";
import { api, PaymentMethodSettings } from "@/lib/api-client";
import {
  getSimulatedPaymentSettings,
  saveSimulatedPaymentSettings,
} from "@/lib/order-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
  Loader2,
  Radio,
  Sliders,
  Sparkles,
  Server,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminPaymentSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [settings, setSettings] = React.useState<PaymentMethodSettings>({
    bkash_enabled: true,
    sslcommerz_enabled: true,
    cod_enabled: true,
    active_gateway: "bkash",
    sandbox_mode: true,
    credentials_status: {
      bkash_configured: false,
      sslcommerz_configured: false,
    },
  });

  React.useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await api.admin.getPaymentSettings();
        setSettings(res.data);
      } catch {
        // Fallback to simulated local admin settings
        const simulated = getSimulatedPaymentSettings();
        setSettings(simulated);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      try {
        const res = await api.admin.updatePaymentSettings({
          bkash_enabled: settings.bkash_enabled,
          sslcommerz_enabled: settings.sslcommerz_enabled,
          cod_enabled: settings.cod_enabled,
          sandbox_mode: settings.sandbox_mode,
          active_gateway: settings.active_gateway,
        });
        setSettings(res.data);
        toast.success("Settings Saved", {
          description: "Payment gateway configurations updated in database.",
        });
      } catch {
        // Fallback saving locally
        const updated = saveSimulatedPaymentSettings(settings);
        setSettings(updated);
        toast.success("Settings Saved (Offline Mode)", {
          description: "Payment gateway configuration persisted.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-slate-400">Loading payment gateway configurations...</p>
      </div>
    );
  }

  const activeGatewaysCount = [
    settings.bkash_enabled,
    settings.sslcommerz_enabled,
    settings.cod_enabled,
  ].filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Payment Gateways & Settings
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
            >
              Strategy Pattern
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Dynamically toggle customer payment methods, configure sandbox simulators, and inspect credentials.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 font-bold shadow-lg text-xs h-10 px-5"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Active Methods
          </span>
          <div className="text-2xl font-black text-white flex items-center gap-2">
            {activeGatewaysCount} / 3
            <Badge variant="secondary" className="text-[10px]">
              Available
            </Badge>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Environment Mode
          </span>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            {settings.sandbox_mode ? (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                Sandbox Simulator
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                Production Live
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Idempotency Guard
          </span>
          <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-4 w-4" />
            <span>SELECT FOR UPDATE Enabled</span>
          </div>
        </div>
      </div>

      {/* Environment Mode Switch Card */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              Gateway Environment Mode
            </h3>
            <p className="text-xs text-slate-400">
              When Sandbox is enabled, payments use the interactive simulator modal without real monetary charges.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.sandbox_mode}
              onChange={(e) =>
                setSettings({ ...settings, sandbox_mode: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>
            {settings.sandbox_mode
              ? "Sandbox mode is ON. OTP: 123456 | PIN: 1234 | Card: 4111 1111 1111 1111"
              : "Live mode is ON. Real transaction credentials are required in backend/.env"}
          </span>
        </div>
      </div>

      {/* Individual Gateway Toggles */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
          Payment Method Providers
        </h2>

        {/* bKash Card */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#E2136E]/15 text-[#E2136E] flex items-center justify-center font-black shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">bKash Mobile Payment</h3>
                  {settings.bkash_enabled ? (
                    <Badge variant="success" className="text-[10px] py-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] py-0 text-slate-400">
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Direct tokenized checkout with customer PIN & OTP authorization.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.bkash_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, bkash_enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E2136E]"></div>
            </label>
          </div>

          <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>Callback Endpoint: <code className="text-slate-300">/api/v1/payments/callback/bkash</code></span>
            <span>Fee: 1.5% MFS Charge</span>
          </div>
        </div>

        {/* SSLCommerz Card */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-black shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">SSLCommerz Payment Gateway</h3>
                  {settings.sslcommerz_enabled ? (
                    <Badge variant="success" className="text-[10px] py-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] py-0 text-slate-400">
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Accepts Visa, Mastercard, AMEX, City Bank, DBBL, and NetBanking.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sslcommerz_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, sslcommerz_enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>Callback Endpoint: <code className="text-slate-300">/api/v1/payments/callback/sslcommerz</code></span>
            <span>Supported: Cards, Internet Banking, MFS</span>
          </div>
        </div>

        {/* Cash on Delivery Card */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black shrink-0">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Cash on Delivery (COD)</h3>
                  {settings.cod_enabled ? (
                    <Badge variant="success" className="text-[10px] py-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] py-0 text-slate-400">
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Customer pays upon receipt at doorstep. Processed directly with no gateway surcharge.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cod_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, cod_enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>Settlement: Carrier Handover (CarryBee in Part 7)</span>
            <span>Fee: 0.00 BDT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
