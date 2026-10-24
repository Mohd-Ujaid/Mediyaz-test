"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, HelpCircle, CheckCircle2 } from "lucide-react";

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
}

type Resolver = (confirmed: boolean) => void;

let globalShowConfirm: ((options: ConfirmDialogOptions) => Promise<boolean>) | null = null;

/**
 * Universal imperative promise-based confirm function.
 * Use anywhere: `const confirmed = await confirmAction({ message: "Are you sure?" });`
 */
export function confirmAction(options: ConfirmDialogOptions | string): Promise<boolean> {
  const opts: ConfirmDialogOptions =
    typeof options === "string" ? { message: options } : options;

  if (globalShowConfirm) {
    return globalShowConfirm(opts);
  }

  // Safe fallback if component is not yet mounted
  console.warn("[confirmAction] CustomConfirmModal is not mounted yet.");
  return Promise.resolve(false);
}

export function CustomConfirmModal() {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmDialogOptions>({
    message: "",
    variant: "destructive",
  });
  const resolverRef = React.useRef<Resolver | null>(null);

  React.useEffect(() => {
    globalShowConfirm = (opts: ConfirmDialogOptions) => {
      setOptions(opts);
      setOpen(true);
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    };

    return () => {
      globalShowConfirm = null;
    };
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const variant = options.variant || "destructive";
  const title = options.title || (variant === "destructive" ? "Confirm Action" : "Please Confirm");
  const confirmText = options.confirmText || (variant === "destructive" ? "Yes, Proceed" : "Confirm");
  const cancelText = options.cancelText || "Cancel";

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleCancel(); }}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                variant === "destructive"
                  ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-400"
                  : variant === "warning"
                  ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:border-amber-900 dark:text-amber-400"
                  : "bg-teal-50 text-[#285b63] border-teal-200 dark:bg-teal-950/60 dark:border-teal-900 dark:text-teal-300"
              }`}
            >
              {variant === "destructive" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : variant === "warning" ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                {title}
              </DialogTitle>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Action Confirmation
              </span>
            </div>
          </div>

          <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {options.message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="rounded-xl h-10 px-5 text-xs font-semibold cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className={`rounded-xl h-10 px-6 text-xs font-bold text-white shadow-md cursor-pointer transition-all active:scale-[0.98] ${
              variant === "destructive"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-900/10"
                : variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-900/10 text-slate-950"
                : "bg-[#285b63] hover:bg-[#1d464d] shadow-teal-900/10"
            }`}
            autoFocus
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
