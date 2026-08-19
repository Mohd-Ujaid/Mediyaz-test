"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, this is where you would log the error to an external service like Sentry
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Oops! Something went wrong.
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
          We apologize for the inconvenience. An unexpected error occurred while loading this page. Our engineering team has been notified.
        </p>

        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-left overflow-hidden">
          <p className="text-xs text-slate-500 font-mono truncate">
            Error: {error.message || "Unknown Application Error"}
          </p>
          {error.digest && (
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button onClick={() => reset()} variant="outline" className="w-full sm:w-auto rounded-xl">
            <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
              <Home className="w-4 h-4 mr-2" /> Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
