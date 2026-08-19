"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { authClient } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, ShieldAlert } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await authClient.resetPassword({
        newPassword: values.password,
        token: token ?? undefined,
      });
      if (result.error) {
        setError(result.error.message || "Failed to reset password. The link may have expired.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl border-t-4 border-t-green-500 bg-white dark:bg-slate-900 text-center">
        <CardHeader className="pt-8">
          <div className="mx-auto w-14 h-14 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center text-green-600 mb-3">
            <CheckCircle className="w-7 h-7" />
          </div>
          <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Password Reset Successful
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Redirecting you to the login portal...
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Your password has been updated. You will be redirected to the login page in a moment.
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl border-t-4 border-t-rose-500 bg-white dark:bg-slate-900 text-center">
        <CardHeader className="pt-8">
          <div className="mx-auto w-14 h-14 bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center text-rose-600 mb-3">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Invalid Reset Link
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          This password reset link is invalid or has expired. Please request a new one.
        </CardContent>
        <CardFooter className="flex items-center justify-center pb-8">
          <Link href="/forgot-password">
            <Button className="rounded-xl bg-primary hover:bg-teal-700 text-white font-bold text-xs h-10 px-6">
              Request New Reset Link
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl border-t-4 border-t-secondary bg-white dark:bg-slate-900">
      <CardContent className="pt-6">
        {error && (
          <div className="p-3 mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
            {error}
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-400">New Password</label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-[10px] font-medium text-rose-600">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-650 dark:text-slate-400">Confirm New Password</label>
            <Input
              type="password"
              placeholder="Repeat your new password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-[10px] font-medium text-rose-600">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl bg-primary hover:bg-teal-700 text-white font-bold text-xs h-10"
            disabled={loading || !token}
          >
            {loading ? "Updating password..." : "Set New Password"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex items-center justify-center pb-6 pt-2">
        <Link
          href="/login"
          className="text-xs text-slate-500 hover:text-primary dark:text-slate-400 flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login Portal
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 px-4 py-12 select-none">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <img
            src="/images/logo.webp"
            alt="Mediyaz Art Bank"
            className="mx-auto h-16 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Set New Password</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose a strong, unique password for your clinical portal account
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="text-center text-xs text-slate-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
