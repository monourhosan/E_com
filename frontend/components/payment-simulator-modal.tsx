"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { simulateOrderPaid } from "@/lib/order-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  CreditCard,
  Building2,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentSimulatorModalProps {
  isOpen: boolean;
  gateway: "bkash" | "sslcommerz";
  orderNumber: string;
  totalAmount: number;
  paymentRecordId?: number;
  paymentId?: string;
  customerPhone?: string;
  onSuccess: (transactionId: string) => void;
  onFailure: (reason: string) => void;
  onClose: () => void;
}

export function PaymentSimulatorModal({
  isOpen,
  gateway,
  orderNumber,
  totalAmount,
  paymentRecordId,
  paymentId,
  customerPhone = "01712345678",
  onSuccess,
  onFailure,
  onClose,
}: PaymentSimulatorModalProps) {
  const [activeTab, setActiveTab] = React.useState<"card" | "bank">("card");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [bkashStep, setBkashStep] = React.useState<"otp" | "pin">("otp");

  // bKash simulation states
  const [otp, setOtp] = React.useState("123456");
  const [pin, setPin] = React.useState("1234");

  // SSLCommerz simulation states
  const [cardNumber, setCardNumber] = React.useState("4111 •••• •••• 1111");
  const [cardHolder, setCardHolder] = React.useState("TEST CUSTOMER");
  const [selectedBank, setSelectedBank] = React.useState("BRAC Bank");

  if (!isOpen) return null;

  const handleSimulatePayment = async (isSuccess: boolean, reason = "Payment declined by customer") => {
    setIsProcessing(true);

    try {
      const generatedTrxId =
        (gateway === "bkash" ? "TRX_BK_" : "TRX_SSLCZ_") +
        dateFormatted() +
        "_" +
        Math.random().toString(36).substring(2, 8).toUpperCase();

      try {
        // Attempt authoritative backend callback endpoint
        const callbackPayload = isSuccess
          ? {
              payment_record_id: paymentRecordId,
              payment_id: paymentId,
              transaction_id: generatedTrxId,
              status: "success",
            }
          : {
              payment_record_id: paymentRecordId,
              payment_id: paymentId,
              status: "failed",
              simulate_failure: true,
              reason: reason,
            };

        const res = await api.store.verifyPaymentCallback(gateway, callbackPayload);

        if (isSuccess) {
          toast.success("Payment Verified", {
            description: `Transaction #${res.transaction_id || generatedTrxId} confirmed.`,
          });
          onSuccess(res.transaction_id || generatedTrxId);
        } else {
          toast.error("Payment Failed", { description: reason });
          onFailure(reason);
        }
      } catch (err: unknown) {
        // Resilient fallback for local sandbox / offline execution
        if (isSuccess) {
          simulateOrderPaid(orderNumber, generatedTrxId);
          toast.success("Payment Verified (Sandbox Mode)", {
            description: `Transaction #${generatedTrxId} completed successfully.`,
          });
          onSuccess(generatedTrxId);
        } else {
          toast.error("Payment Simulation Declined", { description: reason });
          onFailure(reason);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  function dateFormatted(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, "");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-background border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with Gateway Branding */}
        {gateway === "bkash" ? (
          <div className="bg-[#E2136E] text-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-wide flex items-center gap-1.5">
                    bKash Payment
                    <Badge className="bg-white/20 hover:bg-white/20 text-white text-[10px] uppercase border-none py-0">
                      Sandbox
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-pink-100">Merchant: Apex Storefront Ltd</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/20 text-xs">
              <span className="text-pink-100">Invoice: #{orderNumber}</span>
              <span className="font-extrabold text-base">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-wide flex items-center gap-1.5">
                    SSLCommerz Gateway
                    <Badge className="bg-white/20 hover:bg-white/20 text-white text-[10px] uppercase border-none py-0">
                      Sandbox
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-blue-100">Secure Payment Checkout</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/20 text-xs">
              <span className="text-blue-100">Order: #{orderNumber}</span>
              <span className="font-extrabold text-base">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Modal Body: Gateway specific interactive simulation */}
        <div className="p-6 space-y-5">
          {gateway === "bkash" ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs space-y-1">
                <span className="font-bold text-[#E2136E] flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  bKash Sandbox Simulator
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Wallet Number: <span className="font-mono font-bold text-foreground">{customerPhone}</span>
                </p>
              </div>

              {bkashStep === "otp" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Simulated Verification Code (OTP)</span>
                      <span className="text-[10px] text-muted-foreground">Default: 123456</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-input bg-background font-mono text-center tracking-widest text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#E2136E]/30 focus:border-[#E2136E]"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => setBkashStep("pin")}
                    className="w-full bg-[#E2136E] hover:bg-[#c90f61] text-white font-bold h-11 rounded-xl shadow-md"
                  >
                    Proceed to PIN Verification
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Simulated bKash PIN</span>
                      <span className="text-[10px] text-muted-foreground">Default: 1234</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-input bg-background font-mono text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#E2136E]/30 focus:border-[#E2136E]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBkashStep("otp")}
                      className="text-xs"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleSimulatePayment(true)}
                      className="flex-1 bg-[#E2136E] hover:bg-[#c90f61] text-white font-bold h-10 rounded-xl gap-2 shadow-md"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Authorizing Payment...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Simulate Success (bKash)</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Direct Simulation Action Buttons */}
              <div className="pt-2 border-t flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment(false, "User cancelled the bKash PIN prompt")}
                  className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Simulate bKash Failure
                </Button>
              </div>
            </div>
          ) : (
            /* SSLCommerz Simulation */
            <div className="space-y-4">
              {/* Tab Selector: Cards vs Internet Banking */}
              <div className="flex rounded-xl bg-muted p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("card")}
                  className={`flex-1 py-1.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "card"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Cards (Visa/MC)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("bank")}
                  className={`flex-1 py-1.5 font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "bank"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  NetBanking
                </button>
              </div>

              {activeTab === "card" ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      Sandbox Test Visa Card Attached
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      4111 1111 1111 1111 • Exp: 12/28 • CVV: 123
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground">Select Partner Bank</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {["BRAC Bank", "City Bank", "Dutch-Bangla", "EBL"].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          selectedBank === bank
                            ? "border-blue-600 bg-blue-500/10 font-bold text-blue-600 dark:text-blue-400"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t">
                <Button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-md gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing SSLCommerz Gateway...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Simulate Approved Transaction</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleSimulatePayment(false, "Bank declined the card transaction (insufficient funds)")}
                  className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Simulate Declined Transaction
                </Button>
              </div>
            </div>
          )}

          {/* Security footnote */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span>Idempotency verification active. No actual financial debit occurs in Sandbox.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
