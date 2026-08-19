"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { signIn, authClient } from "@/lib/auth";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setError(result.error.message || "Failed to login");
      } else {
        const user = result.data?.user;
        if (user) {
          const role = (user as any).role;
          const isEmployee = ["ADMIN", "SUPER_ADMIN", "DOCTOR", "STAFF", "RECEPTIONIST"].includes(role);
          if (isEmployee) {
            window.location.replace("/admin/dashboard");
          } else {
            await authClient.signOut();
            setError("Access denied: Authorized clinical employee credentials required.");
          }
        } else {
          setError("An authentication issue occurred.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 px-4 py-12 select-none">
      <div className="w-full max-w-md space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-4">
          <img
            src="/images/logo.webp"
            alt="Mediyaz Art Bank"
            className="mx-auto h-16 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Clinical Employee Portal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Access medical records, donor registry, and administrative settings</p>
          </div>
        </div>

        <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl border-t-4 border-t-secondary bg-white dark:bg-slate-900">
          <CardContent className="pt-6">
            {error && <div className="p-3 mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">{error}</div>}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-400">Email Address</label>
                <Input placeholder="patient@mediyaz.org" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-[10px] font-medium text-rose-600">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-650 dark:text-slate-400">Security Password</label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline font-semibold">
                    Forgot password?
                  </Link>
                </div>
                <Input type="password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-[10px] font-medium text-rose-600">{form.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-teal-700 text-white font-bold text-xs h-10" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center space-y-2 text-[11px] pb-6 pt-2 px-6 text-center">
            <div className="text-slate-400 dark:text-slate-500 leading-normal font-medium">
              Employee portal accounts are provisioned exclusively by clinic administration. Contact your clinical supervisor to set up your access credentials.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
