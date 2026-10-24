"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Receipt, CreditCard, CheckCircle2, Clock, Calendar, User } from "lucide-react";
import { formatDotDate } from "@/lib/invoice-utils";

interface DonorPaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  donor: any | null;
}

export function DonorPaymentHistoryModal({
  isOpen,
  onClose,
  donor,
}: DonorPaymentHistoryModalProps) {
  if (!donor) return null;

  const payments: any[] = Array.isArray(donor.payments) ? donor.payments : [];
  const dealPrice = donor.dealPrice || 65000;
  const receivedAmount = donor.receivedAmount || 0;
  const tdsAmount = donor.tdsAmount || 0;
  const pendingAmount = donor.pendingAmount || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 flex items-center justify-center font-bold">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Payment History & Audit Trail
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-0.5">
                {donor.donorName} ({donor.registrationId}) • {donor.assignedHospital?.name || "Clinic"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Financial Snapshot Cards */}
        <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Deal Price</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              ₹{dealPrice.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Net Cash Received</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ₹{receivedAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">TDS Deducted</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              ₹{tdsAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pending Due</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* History Table */}
        <div className="space-y-2 mt-4">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            All Recorded Payments ({payments.length})
          </h4>

          {payments.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-sm">
              No payments recorded yet for this donor. Outstanding balance: ₹{pendingAmount.toLocaleString("en-IN")}
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Payment No / Mode</th>
                    <th className="p-2.5">Reference / UTR</th>
                    <th className="p-2.5 text-right">Gross</th>
                    <th className="p-2.5 text-right">TDS</th>
                    <th className="p-2.5 text-right font-bold">Net Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 text-slate-600 dark:text-slate-300 font-medium">
                        {p.date ? formatDotDate(p.date) : "-"}
                      </td>
                      <td className="p-2.5">
                        <div className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {p.paymentNo || "MANUAL"}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {p.paymentMode?.replace("_", " ") || "Bank Transfer"}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {p.reference || "-"}
                        {p.notes && <div className="text-[10px] text-slate-400">{p.notes}</div>}
                      </td>
                      <td className="p-2.5 text-right text-slate-700 dark:text-slate-300 font-medium">
                        ₹{(p.grossAmount ?? p.amount ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-2.5 text-right text-amber-600 font-medium">
                        ₹{(p.tdsAmount ?? 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(p.netAmount ?? p.amount ?? 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
