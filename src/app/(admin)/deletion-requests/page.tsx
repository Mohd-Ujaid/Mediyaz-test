"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

interface ReviewDialogState {
  open: boolean;
  id: string;
  action: "APPROVE" | "REJECT";
  resourceTitle: string;
  resourceType: string;
}

export default function DeletionRequestsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState | null>(null);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/deletion-requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch {
      toast.error("Failed to load deletion requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function executeReview(id: string, action: "APPROVE" | "REJECT") {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/deletion-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Request ${action.toLowerCase()}d.`);
        setReviewDialog(null);
        fetchRequests();
      } else {
        toast.error(data.error || "Action failed.");
      }
    } catch {
      toast.error("Network error processing request.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-2">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Governance Audit Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Deletion Requests Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isSuperAdmin
              ? "Super Administrator Authorization Console: Review and approve or reject record deletions."
              : "Review the real-time status of record deletion requests you have submitted for Super Admin approval."}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchRequests}
          disabled={loading}
          className="rounded-xl text-xs font-semibold h-10 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {/* Info Notice */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <strong>Security Protocol:</strong> In accordance with strict RBAC standards, standard Administrators cannot delete records directly. All deletions must be audited and authorized by the Super Administrator to maintain data integrity and regulatory compliance.
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#285b63] mx-auto" />
            <p className="text-xs text-slate-500">Loading deletion queue...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Queue is Clear</h3>
            <p className="text-xs text-slate-500">There are no pending deletion requests at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map((req) => (
              <div
                key={req._id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {req.resourceType}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {req.resourceTitle}
                    </h4>

                    {req.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Pending Review
                      </span>
                    )}
                    {req.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved & Deleted
                      </span>
                    )}
                    {req.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-700 dark:text-slate-200">Reason:</strong> {req.reason}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      Requested by: <strong>{req.requestedBy?.name || "Staff"}</strong> ({req.requestedBy?.role})
                    </span>
                    <span>•</span>
                    <span>{new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions for Super Admin */}
                {isSuperAdmin && req.status === "PENDING" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === req._id}
                      onClick={() =>
                        setReviewDialog({
                          open: true,
                          id: req._id,
                          action: "REJECT",
                          resourceTitle: req.resourceTitle,
                          resourceType: req.resourceType,
                        })
                      }
                      className="rounded-xl text-xs font-semibold h-9 text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Reject
                    </Button>

                    <Button
                      size="sm"
                      disabled={processingId === req._id}
                      onClick={() =>
                        setReviewDialog({
                          open: true,
                          id: req._id,
                          action: "APPROVE",
                          resourceTitle: req.resourceTitle,
                          resourceType: req.resourceType,
                        })
                      }
                      className="rounded-xl text-xs font-bold h-9 bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
                    >
                      {processingId === req._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span>Approve & Delete</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Review Actions */}
      {reviewDialog && (
        <Dialog open={reviewDialog.open} onOpenChange={(val) => { if (!val) setReviewDialog(null); }}>
          <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  <Crown className="w-3.5 h-3.5" />
                  Super Admin Decision
                </span>
              </div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                {reviewDialog.action === "APPROVE" ? "Authorize Permanent Deletion?" : "Reject Deletion Request?"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                Target Record: <strong className="text-slate-800 dark:text-slate-200">{reviewDialog.resourceTitle}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
              reviewDialog.action === "APPROVE"
                ? "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200"
                : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}>
              {reviewDialog.action === "APPROVE" ? (
                <p>
                  Approving will <strong>permanently erase this record</strong> from the MongoDB Atlas database. This destructive operation cannot be undone.
                </p>
              ) : (
                <p>
                  Rejecting will decline this request and preserve the record safely in the database.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewDialog(null)}
                disabled={!!processingId}
                className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!!processingId}
                onClick={() => executeReview(reviewDialog.id, reviewDialog.action)}
                className={`h-9 px-5 text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all ${
                  reviewDialog.action === "APPROVE"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                }`}
              >
                {processingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Processing...</span>
                  </>
                ) : reviewDialog.action === "APPROVE" ? (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Execute Deletion</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
