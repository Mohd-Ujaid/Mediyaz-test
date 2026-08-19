"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function RegisterPage() {
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
        </div>

        <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl border-t-4 border-t-amber-500 bg-white dark:bg-slate-900 text-center">
          <CardHeader className="pt-8">
            <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center text-amber-600 mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Public Registration Disabled
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Regulatory Security & Compliance Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Mediyaz Art Bank requires all donor, recipient, and staff portal logins to be provisioned and authorized by the clinical administration. Self-registration is restricted. 
            <p className="mt-2.5 font-semibold text-slate-700 dark:text-slate-300">
              Please contact your clinical coordinator or department supervisor to request system credentials.
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-center pb-8">
            <Link href="/login">
              <Button className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs px-5 py-2.5 h-10 gap-1.5 cursor-pointer font-bold">
                <ArrowLeft className="w-4 h-4" /> Go to Login Portal
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
