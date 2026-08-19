"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, authClient, signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { siteConfig } from "@/config/site.config";

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid administrator email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof adminLoginSchema>) {
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      // 1. Authenticate with Better Auth
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      // 2. Read role directly from sign-in response data to avoid concurrent stream locks
      const user = result.data?.user;
      if (user) {
        const role = (user as any).role;
        if (role === "ADMIN" || role === "SUPER_ADMIN") {
          setSuccess(true);
          setTimeout(() => {
            window.location.replace("/admin/dashboard");
          }, 800);
        } else {
          // Access Denied: Sign them out immediately
          await signOut();
          setError("Access Denied: This console is restricted to administrators only.");
          setLoading(false);
        }
      } else {
        setError("Unable to establish secure administration session.");
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected authentication error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 select-none">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-4">
          <img
            src="/images/logo.webp"
            alt="Mediyaz Art Bank"
            className="mx-auto h-16 w-auto object-contain"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{siteConfig.shortName} Staff Console</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Authorized clinical and administrative personnel only</p>
          </div>
        </div>

        {/* Form Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl border-t-4 border-t-secondary">
          {error && (
            <div className="p-3 mb-5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 mb-5 text-xs font-semibold text-teal-650 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
              <span>Session verified. Access granted.</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">Admin Email</label>
              <Input 
                placeholder="admin@mediyaz.org" 
                type="email"
                {...form.register("email")} 
                className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-10 px-3 py-2 text-xs focus-visible:ring-primary"
                disabled={loading || success}
              />
              {form.formState.errors.email && (
                <p className="text-[10px] font-medium text-rose-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">Security Password</label>
              <Input 
                type="password" 
                {...form.register("password")} 
                className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl h-10 px-3 py-2 text-xs focus-visible:ring-primary"
                disabled={loading || success}
              />
              {form.formState.errors.password && (
                <p className="text-[10px] font-medium text-rose-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className={`w-full rounded-xl mt-6 font-bold text-xs h-10 flex items-center justify-center gap-1.5 transition-colors duration-200 ${
                success 
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white" 
                  : "bg-primary hover:bg-teal-700 text-white shadow-sm shadow-primary/10"
              }`} 
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Access...
                </>
              ) : success ? (
                "Verified Successfully"
              ) : (
                "Authorize Access"
              )}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
