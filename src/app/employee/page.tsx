"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { signIn, authClient } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionCheck, setSessionCheck] = useState(true);

  // Check if session already exists
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session-permissions");
        const data = await res.json();
        if (data.success) {
          const isAllowedRole = ["ADMIN", "SUPER_ADMIN", "DOCTOR", "STAFF", "RECEPTIONIST"].includes(data.role);
          if (isAllowedRole) {
            router.push("/employee/dashboard");
            return;
          }
        }
      } catch {}
      setSessionCheck(false);
    }
    checkSession();
  }, [router]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    setError("");
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid credentials.");
      } else {
        const user = result.data?.user;
        if (user) {
          const role = (user as any).role;
          const isEmployee = ["ADMIN", "SUPER_ADMIN", "DOCTOR", "STAFF", "RECEPTIONIST"].includes(role);
          if (isEmployee) {
            toast.success("Welcome to the clinical dashboard!");
            window.location.replace("/employee/dashboard");
          } else {
            await authClient.signOut();
            setError("Access denied: Authorized clinical employee credentials required.");
          }
        } else {
          setError("An authentication issue occurred.");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sessionCheck) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-teal-650" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 select-none">
      <div className="w-full max-w-md space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-4">
          <img
            src="/images/logo.webp"
            alt="Mediyaz Art Bank"
            className="mx-auto h-14 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" /> Employee Login Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Authorized Clinical & Administrative Logins Only</p>
          </div>
        </div>

        <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl border-t-4 border-t-teal-600 bg-white dark:bg-slate-900">
          <CardContent className="pt-6">
            {error && (
              <div className="p-3 mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-250 rounded-xl">
                {error}
              </div>
            )}
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-650 dark:text-slate-400">Employee Email Address</label>
                <Input 
                  placeholder="name@mediyaz.org" 
                  {...form.register("email")} 
                />
                {form.formState.errors.email && (
                  <p className="text-[10px] font-medium text-rose-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-650 dark:text-slate-400">Portal Password</label>
                <Input 
                  type="password" 
                  {...form.register("password")} 
                />
                {form.formState.errors.password && (
                  <p className="text-[10px] font-medium text-rose-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full rounded-xl bg-primary hover:bg-teal-700 text-white font-bold h-10 cursor-pointer transition-colors" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4.5 h-4.5 animate-spin" /> Signing in...
                  </span>
                ) : (
                  "Access Portal"
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col items-center justify-center text-[10px] pb-6 pt-2 px-6 text-center">
            <span className="text-slate-400 dark:text-slate-500 leading-normal">
              System access is tracked for compliance. To request credentials, contact your clinical operations lead.
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
