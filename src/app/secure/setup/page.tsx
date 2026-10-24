"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";
import {
  Crown,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Database,
  ArrowLeft,
} from "lucide-react";

const setupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Valid email required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SetupFormValues = z.infer<typeof setupSchema>;

export default function SuperAdminSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSuperAdmin, setHasSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/auth/setup-super-admin");
        const data = await res.json();
        if (data.hasSuperAdmin) {
          setHasSuperAdmin(true);
        }
      } catch (err) {
        console.error("Failed to check Super Admin status:", err);
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, []);

  async function onSubmit(values: SetupFormValues) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/setup-super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to initialize Super Administrator.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Auto sign-in so user has active session
      try {
        await signIn.email({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });
      } catch (e) {
        console.warn("Auto sign-in fallback:", e);
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#285b63]" />
          <p className="text-xs text-slate-500 font-medium">Verifying Database Authority State...</p>
        </div>
      </div>
    );
  }

  if (hasSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-amber-50/20 dark:bg-slate-950 text-slate-900 dark:text-white p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-8 rounded-3xl text-center space-y-5 shadow-xl shadow-slate-900/5">
          <div className="flex justify-center">
            <img src="/logo.webp" alt="Mediyaz ART Bank" className="h-20 w-auto object-contain" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Super Administrator Configured</h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This database already has an active Super Administrator. Direct initialization is permanently locked to prevent unauthorized privilege escalation.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/secure/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#285b63] hover:bg-[#1d464d] text-white transition-all shadow-md"
            >
              <span>Go to Super Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-amber-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-8 relative overflow-hidden select-none">
      <div className="w-full max-w-md space-y-6 relative z-10 my-auto">
        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-none space-y-5">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img src="/logo.webp" alt="Mediyaz ART Bank" className="h-24 w-auto object-contain" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Database Initialization Wizard</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-amber-500" />
                <span>Create Super Admin</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                No Super Administrator detected in this database. Establish root authority.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="flex-1">Root Authority Established! Redirecting to Dashboard...</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name / Title</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <Input
                  placeholder="e.g. Dr. Super Admin / Executive Director"
                  {...form.register("name")}
                  className="pl-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-11 text-xs focus-visible:ring-2 focus-visible:ring-[#285b63]"
                  disabled={loading || success}
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-[11px] text-rose-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Root Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  type="email"
                  placeholder="superadmin@mediyaz.org"
                  {...form.register("email")}
                  className="pl-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-11 text-xs focus-visible:ring-2 focus-visible:ring-[#285b63]"
                  disabled={loading || success}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-[11px] text-rose-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Master Passphrase (min 8 chars)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  {...form.register("password")}
                  className="pl-10 pr-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-11 text-xs focus-visible:ring-2 focus-visible:ring-[#285b63]"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-[11px] text-rose-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm Passphrase</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  {...form.register("confirmPassword")}
                  className="pl-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-11 text-xs focus-visible:ring-2 focus-visible:ring-[#285b63]"
                  disabled={loading || success}
                />
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-[11px] text-rose-600">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl font-bold text-xs h-11 bg-[#285b63] hover:bg-[#1d464d] text-white shadow-md transition-all mt-4 cursor-pointer"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Configuring Database & Root Authority...</span>
                </>
              ) : success ? (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  <span>Success! Redirecting...</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  <span>Initialize Super Administrator</span>
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 px-3 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Operations Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
