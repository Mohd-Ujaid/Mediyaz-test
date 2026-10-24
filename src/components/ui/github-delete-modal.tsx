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
  AlertTriangle,
  Trash2,
  Loader2,
  Crown,
  ShieldAlert,
  Send,
  Info,
} from "lucide-react";

interface GitHubDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expectedId: string;
  itemType?: string;
  itemName?: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function GitHubDeleteModal({
  open,
  onOpenChange,
  expectedId,
  itemType = "registration",
  itemName,
  onConfirm,
  loading = false,
}: GitHubDeleteModalProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [inputText, setInputText] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [requestLoading, setRequestLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Reset input whenever dialog opens or expectedId changes
  React.useEffect(() => {
    if (open) {
      setInputText("");
      setReason("");
      setErrorMsg("");
      setRequestLoading(false);
    }
  }, [open, expectedId]);

  const isMatched = inputText.trim().toLowerCase() === expectedId.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isMatched || loading) return;
    await onConfirm();
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg("Please provide an operational justification (at least 5 characters).");
      return;
    }

    setRequestLoading(true);
    setErrorMsg("");

    try {
      const normalizedType = itemType.toLowerCase().includes("egg")
        ? "EGG_REGISTRATION"
        : itemType.toLowerCase().includes("sperm")
        ? "SPERM_REGISTRATION"
        : "REGISTRATION";

      const res = await fetch("/api/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType: normalizedType,
          resourceId: expectedId,
          resourceTitle: `${itemType}: ${expectedId}${itemName ? ` (${itemName})` : ""}`,
          reason: reason.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to submit deletion request.");
        setRequestLoading(false);
        return;
      }

      toast.success("Deletion request submitted for Super Administrator review.", {
        description: "The Super Admin will review and execute this request.",
      });
      onOpenChange(false);
    } catch {
      setErrorMsg("Network error submitting deletion request.");
      setRequestLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!loading && !requestLoading) onOpenChange(val); }}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <DialogHeader className="space-y-2">
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
              {itemType}
            </span>
          </div>

          <div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {isSuperAdmin ? (
                <>
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <span>Delete {itemType} permanently?</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-amber-600" />
                  <span>Request Deletion for {itemType}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Target Record: <strong className="text-slate-800 dark:text-slate-200 font-mono">{expectedId}</strong>
              {itemName && <span> ({itemName})</span>}
            </DialogDescription>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span className="flex-1 font-medium">{errorMsg}</span>
          </div>
        )}

        {isSuperAdmin ? (
          /* ================= SUPER ADMIN DIRECT DELETION VIEW ================= */
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Irreversible Destructive Action
              </p>
              <p>
                As Super Administrator, this action <strong className="font-semibold">CANNOT</strong> be undone. This will permanently delete the{" "}
                {itemType} record for <span className="font-mono font-bold bg-white/70 dark:bg-black/30 px-1 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">{expectedId}</span>
                {itemName && (
                  <span> (<strong className="font-medium">{itemName}</strong>)</span>
                )}
                , along with all associated clinical documents, audit trails, and file links.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-600 dark:text-slate-400 font-medium block">
                To confirm deletion, please enter the registration ID{" "}
                <span className="font-mono font-bold text-slate-900 dark:text-white select-all bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  {expectedId}
                </span>{" "}
                below:
              </label>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Enter "${expectedId}" to verify`}
                disabled={loading}
                className="font-mono text-xs h-10 border-rose-200 focus-visible:ring-rose-500 rounded-xl"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isMatched && !loading) {
                    handleDelete();
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDelete}
                disabled={!isMatched || loading}
                className={`h-9 px-4 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                  isMatched
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-rose-600/20"
                    : "bg-rose-200 dark:bg-rose-950/40 text-rose-400 dark:text-rose-600 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>I understand, permanently delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* ================= STANDARD ADMIN DELETION REQUEST VIEW ================= */
          <form onSubmit={handleRequestDeletion} className="space-y-4">
            <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1.5">
              <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Administrative Policy
              </p>
              <p>
                In accordance with strict clinical governance, standard Administrators cannot delete donor registrations directly.
              </p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                Please enter the operational justification below. The Super Administrator will review this ticket in the Deletion Requests queue.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">
                Operational Reason / Justification <span className="text-rose-500">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                placeholder="e.g. Duplicate registration submitted by error, donor retracted consent..."
                rows={3}
                disabled={requestLoading}
                className="text-xs resize-none rounded-xl border-slate-300 dark:border-slate-700 focus-visible:ring-amber-500"
                required
                autoFocus
              />
              <p className="text-[11px] text-slate-400 text-right">
                {reason.length} characters (min 5)
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={requestLoading}
                className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={requestLoading || reason.trim().length < 5}
                className="h-9 px-4 text-xs font-bold rounded-xl flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-900/10 cursor-pointer disabled:opacity-50 transition-all"
              >
                {requestLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
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
