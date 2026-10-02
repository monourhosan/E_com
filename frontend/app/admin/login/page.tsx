"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  Lock,
  Mail,
  Loader2,
  Store,
  KeyRound,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If already authenticated as admin, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated && isAdmin) {
      router.replace("/admin");
    }
  }, [isAuthenticated, isAdmin, router]);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login({ email, password });

      if (user.role !== "admin") {
        toast.error("Access Denied", {
          description: "This portal is restricted to system administrators.",
        });
        return;
      }

      toast.success("Welcome back!", {
        description: `Authenticated as ${user.name}`,
      });

      router.push("/admin");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to authenticate with provided credentials.";
      toast.error("Authentication Failed", {
        description: errorMessage,
      });
      setErrors((prev) => ({
        ...prev,
        password: "Authentication failed. Verify your email and password.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDefaultAdmin = () => {
    setEmail("admin@store.com");
    setPassword("Password123!");
    setErrors({});
    toast.info("Demo Credentials Populated", {
      description: "admin@store.com with preconfigured seeder password.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white w-full overflow-x-hidden">
      {/* Back to store navigation */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Storefront
        </Link>
        <Badge variant="outline" className="text-slate-400 border-slate-700 text-[11px]">
          Part 2 • Sanctum Auth
        </Badge>
      </div>

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Admin Portal
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Authenticate to access store administration, order fulfillment, and metrics.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-200">
                Administrator Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-9 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-primary ${
                    errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-slate-200">
                  Password
                </Label>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-9 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-primary ${
                    errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Quick Demo Credentials Helper */}
            <div className="pt-2">
              <button
                type="button"
                onClick={fillDefaultAdmin}
                className="w-full text-left p-2.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 transition-colors flex items-center justify-between group"
              >
                <div className="text-[11px]">
                  <span className="text-slate-400">Quick Fill: </span>
                  <span className="font-mono text-primary font-medium">admin@store.com</span>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">
                  Fill Demo
                </Badge>
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              className="w-full font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                "Sign In to Admin Dashboard"
              )}
            </Button>

            <p className="text-center text-[11px] text-slate-500">
              Role-restricted to <span className="font-semibold text-slate-400">admin</span>. Customer accounts will receive a 403 Forbidden response.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
