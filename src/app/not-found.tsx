import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-6">
          <Search className="w-12 h-12 text-teal-600 dark:text-teal-500" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          404
        </h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Page Not Found
        </h2>
        
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base px-4">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="pt-6">
          <Link href="/">
            <Button className="w-full sm:w-auto rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg">
              <Home className="w-5 h-5 mr-3" /> Back to Mediyaz Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
