"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { authClient } from "@/lib/auth";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setLoading(true);
    setError("");
    try {
      const result = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        // Do not reveal whether an email exists — always show success for security
        console.error("Forgot password error (hidden from user):", result.error);
      }

      // Always show success regardless of whether email exists (prevents user enumeration)
      setSuccess(true);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 px-4 py-12 select-none">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <img
              src="/images/logo.webp"
              alt="Mediyaz Art Bank"
              className="mx-auto h-16 w-auto object-contain"
            />
          </div>
          <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl border-t-4 border-t-green-500 bg-white dark:bg-slate-900 text-center">
            <CardHeader className="pt-8">
              <div className="mx-auto w-14 h-14 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center text-green-600 mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Password reset instructions sent
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              If an account with that email address exists, we have sent password reset instructions to your inbox.
              <p className="mt-2.5 font-semibold text-slate-700 dark:text-slate-300">
                Please check your spam folder if you do not see the email within a few minutes.
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-center pb-8 pt-4">
              <Link href="/login">
                <Button className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs px-5 py-2.5 h-10 gap-1.5 font-bold">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Reset Your Password</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your registered email address to receive a secure reset link
            </p>
          </div>
        </div>

        <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl border-t-4 border-t-secondary bg-white dark:bg-slate-900">
          <CardContent className="pt-6">
            {error && (
              <div className="p-3 mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                {error}
              </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-400">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="employee@mediyaz.org"
                    {...form.register("email")}
                    className="pl-9"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-[10px] font-medium text-rose-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl bg-primary hover:bg-teal-700 text-white font-bold text-xs h-10"
                disabled={loading}
              >
                {loading ? "Sending reset link..." : "Send Reset Link"}
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
      </div>
    </div>
  );
}
