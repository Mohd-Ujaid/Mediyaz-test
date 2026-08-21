/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Input } from "@/components/ui/input";
import { useDonorFormStore } from "../store";
import { Phone } from "lucide-react";

export function StepEmergencyContact({ errors }: { errors?: Record<string, string> }) {
  const { emergencyContact, updateEmergencyContact } = useDonorFormStore();

  const getFieldClassName = (fieldKey: string, baseStyle = "rounded-xl") => {
    const hasError = errors?.[`emergencyContact.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500`;
  };

  const getSelectClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-xl border bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500") => {
    const hasError = errors?.[`emergencyContact.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-700`;
  };

  const getTextAreaClassName = (fieldKey: string, baseStyle = "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500") => {
    const hasError = errors?.[`emergencyContact.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-700`;
  };

  const renderError = (fieldKey: string) => {
    const errorMsg = errors?.[`emergencyContact.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
          <Phone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emergency Contact</h3>
          <p className="text-xs text-slate-500 mt-0.5">Provide details of a person to contact in case of emergency.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Person Name <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <Input placeholder="Full name of emergency contact" value={emergencyContact.contactPersonName} onChange={(e) => updateEmergencyContact({ contactPersonName: e.target.value })} className={getFieldClassName("contactPersonName")} />
          {renderError("contactPersonName")}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Relationship <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <select value={emergencyContact.relationship} onChange={(e) => updateEmergencyContact({ relationship: e.target.value })}
            className={getSelectClassName("relationship")}>
            <option value="">Select Relationship (Optional)</option>
            {["Father", "Mother", "Spouse", "Sibling", "Friend", "Relative", "Guardian", "Other"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {renderError("relationship")}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <Input placeholder="+91 XXXXX XXXXX" value={emergencyContact.phoneNumber} onChange={(e) => updateEmergencyContact({ phoneNumber: e.target.value })} className={getFieldClassName("phoneNumber")} />
          {renderError("phoneNumber")}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Address <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <textarea
            placeholder="Full address of emergency contact"
            value={emergencyContact.address}
            onChange={(e) => updateEmergencyContact({ address: e.target.value })}
            rows={2}
            className={getTextAreaClassName("address")}
          />
          {renderError("address")}
        </div>
      </div>
    </div>
  );
}
