"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Crown,
  ArrowLeft,
  ArrowRight,
  KeyRound,
} from "lucide-react";

const superAdminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid administrator email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [noSuperAdminYet, setNoSuperAdminYet] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/auth/setup-super-admin");
        const data = await res.json();
        if (data.success && !data.hasSuperAdmin) {
          setNoSuperAdminYet(true);
        }
      } catch {
        // silent fail
      }
    }
    checkStatus();
  }, []);

  const form = useForm<z.infer<typeof superAdminLoginSchema>>({
    resolver: zodResolver(superAdminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values: z.infer<typeof superAdminLoginSchema>) {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. Authenticate with Better Auth
      const result = await signIn.email({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid Super Administrator credentials.");
        setLoading(false);
        return;
      }


      // 2. Validate that the user is strictly SUPER_ADMIN
      const user = result.data?.user;
      if (user) {
        const role = (user as any).role;
        if (role === "SUPER_ADMIN") {
          setSuccess(true);
          setTimeout(() => {
            window.location.replace("/dashboard");
          }, 600);
        } else {
          // Reject non-Super Admin users immediately
          await signOut();
          setError(
            "Access Denied: This console is strictly restricted to the Super Administrator. Standard administrators, managers, and clinical staff must sign in through the Operations Portal."
          );
          setLoading(false);
        }
      } else {
        // Fallback
        setSuccess(true);
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 600);
      }
    } catch {
      setError("An unexpected network error occurred. Please verify your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-amber-50/20 dark:bg-slate-950 font-sans select-none p-4 sm:p-8 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 relative z-10 my-auto">
        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-none space-y-5">
          {/* Brand Header with Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img
                src="/logo.webp"
                alt="Mediyaz ART Bank"
                className="h-24 w-auto object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Root Authority Console</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Super Admin Sign In
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Top-Level System Governance & Cryptographic Control
              </p>
            </div>
          </div>

          {/* First-Time Setup Prompt */}
          {noSuperAdminYet && (
            <div className="p-4 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-2xl flex flex-col gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                <Crown className="w-4 h-4 shrink-0" />
                <span>First-Time Setup Required</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-normal leading-relaxed">
                No Super Administrator was detected in this database. Complete the root authority setup wizard to begin.
              </p>
              <Link
                href="/secure/setup"
                className="mt-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <span>Initialize Super Admin Account Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Super Admin Identifier / Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  placeholder="Enter Super Admin Email"
                  type="email"
                  autoComplete="email"
                  {...form.register("email")}
                  className="pl-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-11 text-xs focus-visible:ring-2 focus-visible:ring-[#285b63] transition-all"
                  disabled={loading || success}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-[11px] font-medium text-rose-600 pt-0.5">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Master Security Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-[#285b63] hover:text-teal-700 hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Master Password"
                  autoComplete="current-password"
                  {...form.register("password")}
                  className="pl-10 pr-10 bg-slate-50/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-11 text-xs focus-visible:ring-2 focus-visible:ring-[#285b63] transition-all"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-[11px] font-medium text-rose-600 pt-0.5">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Session Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  {...form.register("rememberMe")}
                  className="w-4 h-4 rounded border-slate-300 text-[#285b63] focus:ring-[#285b63]"
                />
                <span>Keep session signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full rounded-xl font-bold text-xs h-11 flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer mt-2 ${
                success
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-[#285b63] hover:bg-[#1d464d] text-white shadow-teal-900/20 active:scale-[0.99]"
              }`}
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Cryptographic Credentials...</span>
                </>
              ) : success ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Super Admin Verified</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-white" />
                  <span>Authorize Super Administrator Access</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Back Link to Operations Portal */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1.5 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Staff & Operations Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
