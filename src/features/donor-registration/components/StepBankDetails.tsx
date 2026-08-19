/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Input } from "@/components/ui/input";
import { useDonorFormStore } from "../store";
import { Landmark } from "lucide-react";

export function StepBankDetails() {
  const { bankDetails, updateBankDetails } = useDonorFormStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bank Details</h3>
          <p className="text-xs text-slate-500 mt-0.5">Provide your bank account details for compensation payments.</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
          ⚠️ Please ensure your bank details are accurate. Compensation will be credited directly to this account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Holder Name <span className="text-red-500">*</span></label>
          <Input placeholder="Name as per bank records" value={bankDetails.accountHolderName} onChange={(e) => updateBankDetails({ accountHolderName: e.target.value })} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bank Name <span className="text-red-500">*</span></label>
          <Input placeholder="e.g. State Bank of India" value={bankDetails.bankName} onChange={(e) => updateBankDetails({ bankName: e.target.value })} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Branch <span className="text-red-500">*</span></label>
          <Input placeholder="Branch name" value={bankDetails.branch} onChange={(e) => updateBankDetails({ branch: e.target.value })} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">IFSC Code <span className="text-red-500">*</span></label>
          <Input placeholder="e.g. SBIN0001234" maxLength={11} value={bankDetails.ifscCode} onChange={(e) => updateBankDetails({ ifscCode: e.target.value.toUpperCase() })} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Number <span className="text-red-500">*</span></label>
          <Input placeholder="Bank account number" value={bankDetails.accountNumber} onChange={(e) => updateBankDetails({ accountNumber: e.target.value })} className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">UPI ID <span className="text-[10px] text-slate-400">(Optional)</span></label>
          <Input placeholder="e.g. yourname@upi" value={bankDetails.upiId || ""} onChange={(e) => updateBankDetails({ upiId: e.target.value })} className="rounded-xl" />
        </div>
      </div>
    </div>
  );
}
