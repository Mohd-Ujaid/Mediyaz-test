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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import {
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Crown,
  ShieldCheck,
  Send,
  Loader2,
  Info,
} from "lucide-react";

export interface UnifiedDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: string; // e.g. "USER", "DONOR", "REGISTRATION", "EMPLOYEE", "INQUIRY", "HOSPITAL"
  resourceTitle: string; // e.g. "John Doe" or "Donor #SP-1049"
  resourceId: string; // MongoDB _id or string ID
  deleteEndpoint?: string; // e.g. `/api/users?userId=${id}` for Super Admin direct DELETE
  onSuccess?: () => void | Promise<void>;
  requireIdConfirmation?: boolean; // If true, requires typing resourceId or title to delete
}

export function UnifiedDeleteModal({
  open,
  onOpenChange,
  resourceType,
  resourceTitle,
  resourceId,
  deleteEndpoint,
  onSuccess,
  requireIdConfirmation = false,
}: UnifiedDeleteModalProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [loading, setLoading] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [confirmInput, setConfirmInput] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReason("");
      setConfirmInput("");
      setErrorMsg("");
      setLoading(false);
    }
  }, [open]);

  const targetConfirmText = resourceId || resourceTitle;
  const isConfirmMatched = !requireIdConfirmation || confirmInput.trim().toLowerCase() === targetConfirmText.trim().toLowerCase();

  // Super Admin: Direct execution
  const handleDirectDelete = async () => {
    if (!isSuperAdmin) return;
    if (requireIdConfirmation && !isConfirmMatched) {
      setErrorMsg("Please match the confirmation text exactly.");
      return;
    }

    if (!deleteEndpoint) {
      toast.error("Delete endpoint not configured.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(deleteEndpoint, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || (data.success !== undefined && !data.success)) {
        setErrorMsg(data.error || "Failed to execute permanent deletion.");
        setLoading(false);
        return;
      }

      toast.success(`${resourceTitle} permanently deleted.`);
      onOpenChange(false);
      if (onSuccess) await onSuccess();
    } catch {
      setErrorMsg("Network error executing deletion.");
      setLoading(false);
    }
  };

  // Standard Admin: Submit Deletion Request
  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuperAdmin) return;

    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg("Please provide a valid reason (at least 5 characters).");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType: resourceType.toUpperCase(),
          resourceId,
          resourceTitle,
          reason: reason.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to submit deletion request.");
        setLoading(false);
        return;
      }

      toast.success("Deletion request submitted for Super Administrator review.", {
        description: "You can track its status in Deletion Requests.",
      });
      onOpenChange(false);
      if (onSuccess) await onSuccess();
    } catch {
      setErrorMsg("Network error submitting deletion request.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!loading) onOpenChange(val); }}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                <Crown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Root Authority Direct Action
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Admin Governance Protocol
              </span>
            )}

            <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase">
              {resourceType}
            </span>
          </div>

          <div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {isSuperAdmin ? (
                <>
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <span>Permanent Record Deletion</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-amber-600" />
                  <span>Request Record Deletion</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Target Item: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{resourceTitle}</strong>
            </DialogDescription>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span className="flex-1 font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Content based on Role */}
        {isSuperAdmin ? (
          /* ================= SUPER ADMIN DIRECT DELETION VIEW ================= */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs space-y-2 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                Irreversible Action
              </p>
              <p>
                As Super Administrator, confirming this action will{" "}
                <strong className="underline">immediately and permanently erase</strong> this {resourceType.toLowerCase()} record from the MongoDB database, along with all associated logs and relational links.
              </p>
            </div>

            {requireIdConfirmation && (
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-600 dark:text-slate-400 font-semibold block">
                  To confirm, type <span className="font-mono font-bold select-all bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">{targetConfirmText}</span> below:
                </label>
                <Input
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={`Type "${targetConfirmText}"`}
                  disabled={loading}
                  className="font-mono text-xs h-10 border-rose-200 focus-visible:ring-rose-500 rounded-xl"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-10 px-4 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDirectDelete}
                disabled={loading || (requireIdConfirmation && !isConfirmMatched)}
                className={`h-10 px-5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all ${
                  !requireIdConfirmation || isConfirmMatched
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 active:scale-[0.98]"
                    : "bg-rose-200 dark:bg-rose-950/40 text-rose-400 dark:text-rose-600 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Deletion...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* ================= STANDARD ADMIN DELETION REQUEST VIEW ================= */
          <form onSubmit={handleRequestDeletion} className="space-y-4">
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Info className="w-4 h-4" />
                Administrative Policy
              </p>
              <p>
                In accordance with medical record safety and RBAC standards, standard Administrators do not have direct deletion privileges.
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                Please submit this deletion request with operational justification. The Super Administrator will review and authorize it.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">
                Operational Reason / Justification <span className="text-rose-500">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                placeholder="e.g. Duplicate donor registration, donor requested withdrawal, erroneous entry recorded..."
                rows={3}
                disabled={loading}
                className="text-xs resize-none rounded-xl border-slate-300 dark:border-slate-700 focus-visible:ring-amber-500"
                required
                autoFocus
              />
              <p className="text-[11px] text-slate-400 text-right">
                {reason.length} characters (min 5)
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-10 px-4 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || reason.trim().length < 5}
                className="h-10 px-5 text-xs font-bold rounded-xl flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-900/10 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Deletion Request</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
