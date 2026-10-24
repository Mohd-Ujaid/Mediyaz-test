"use client";

import { useState } from "react";
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
  ArrowRight,
  KeyRound,
} from "lucide-react";

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid administrator email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values: z.infer<typeof adminLoginSchema>) {
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
        setError(result.error.message || "Invalid email or password.");
        setLoading(false);
        return;
      }


      // 2. Read user & role
      const user = result.data?.user;
      if (user) {
        const role = (user as any).role;

        // Super Admin ISOLATION: Super Admin MUST authenticate via /secure/login
        if (role === "SUPER_ADMIN") {
          await signOut();
          setError(
            "Security Notice: Super Administrator credentials detected. Top-level authority must sign in through the Dedicated Super Admin Secure Console."
          );
          setLoading(false);
          return;
        }

        const allowedStaffRoles = [
          "ADMIN",
          "MANAGER",
          "EMPLOYEE",
          "DOCTOR",
          "STAFF",
          "RECEPTIONIST",
        ];

        if (allowedStaffRoles.includes(role)) {
          setSuccess(true);
          setTimeout(() => {
            window.location.replace("/dashboard");
          }, 600);
        } else {
          await signOut();
          setError("Access Denied: You do not have active staff privileges for this portal.");
          setLoading(false);
        }
      } else {
        // Fallback: If session established without user in response
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/30 dark:bg-slate-950 font-sans select-none p-4 sm:p-8 relative overflow-hidden">
    
      <div className="w-full max-w-md space-y-6 relative z-10 my-auto">
        

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-none space-y-5">


<div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center ">
              <img
                src="/logo.webp"
                alt="Mediyaz ART Bank"
                className="h-24 w-auto object-contain"
              />
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Operations Portal Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Administrator, Manager & Clinical Staff Authentication
            </p>
          </div>
        </div>


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
                <span>Administrative Email</span>
                
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  placeholder="admin@mediyaz.org"
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
                  Security Password
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
                  placeholder="••••••••••••"
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : success ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Granted</span>
                </>
              ) : (
                <>
                  <span>Sign In to Operations Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>

            <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                Need an Administrator or Staff account?{" "}
                <Link href="/signup" className="font-semibold text-[#285b63] hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/secure/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Dedicated Super Admin Secure Console</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
