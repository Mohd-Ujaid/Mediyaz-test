/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Input } from "@/components/ui/input";
import { useDonorFormStore } from "../store";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function StepContactInfo({ errors }: { errors?: Record<string, string> }) {
  const searchParams = useSearchParams();
  const isPrefilled = searchParams.get("prefilled") === "true";
  const { contactInfo, updateContactInfo } = useDonorFormStore();
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);

  const handleSameAddress = (checked: boolean) => {
    setSameAsCurrentAddress(checked);
    if (checked) {
      updateContactInfo({ permanentAddress: contactInfo.currentAddress });
    }
  };

  const getFieldClassName = (fieldKey: string, baseStyle = "rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950", isFieldPrefilled = false) => {
    const hasError = errors?.[`contactInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500/20`;
    }
    if (isFieldPrefilled) {
      return `${baseStyle} border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20 focus-visible:ring-emerald-500`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500`;
  };

  const getTextAreaClassName = (fieldKey: string, baseStyle = "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500") => {
    const hasError = errors?.[`contactInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-700`;
  };

  const renderError = (fieldKey: string) => {
    const errorMsg = errors?.[`contactInfo.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contact Information</h3>
        <p className="text-xs text-slate-500 mt-1">Please provide your contact details for communication.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Mobile Number <span className="text-red-500">*</span></span>
            {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled from Inquiry</span>}
          </label>
          <Input 
            placeholder="+91 XXXXX XXXXX" 
            value={contactInfo.mobileNumber} 
            onChange={(e) => updateContactInfo({ mobileNumber: e.target.value })} 
            className={getFieldClassName("mobileNumber", undefined, isPrefilled)} 
          />
          {renderError("mobileNumber")}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alternate Mobile</label>
          <Input placeholder="Optional" value={contactInfo.alternateMobile || ""} onChange={(e) => updateContactInfo({ alternateMobile: e.target.value })} className={getFieldClassName("alternateMobile")} />
          {renderError("alternateMobile")}
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Email Address <span className="text-red-500">*</span></span>
            {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled from Inquiry</span>}
          </label>
          <Input 
            type="email" 
            placeholder="your@email.com" 
            value={contactInfo.emailAddress} 
            onChange={(e) => updateContactInfo({ emailAddress: e.target.value })} 
            className={getFieldClassName("emailAddress", undefined, isPrefilled)} 
          />
          {renderError("emailAddress")}
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Address Details</h4>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Address <span className="text-red-500">*</span></label>
            <textarea
              placeholder="Full current address with house number, street, landmark..."
              value={contactInfo.currentAddress}
              onChange={(e) => updateContactInfo({ currentAddress: e.target.value })}
              rows={2}
              className={getTextAreaClassName("currentAddress")}
            />
            {renderError("currentAddress")}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sameAddress"
              checked={sameAsCurrentAddress}
              onChange={(e) => handleSameAddress(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <label htmlFor="sameAddress" className="text-xs text-slate-600 dark:text-slate-400">
              Same as current address
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Permanent Address <span className="text-red-500">*</span></label>
            <textarea
              placeholder="Full permanent address..."
              value={contactInfo.permanentAddress}
              onChange={(e) => updateContactInfo({ permanentAddress: e.target.value })}
              rows={2}
              disabled={sameAsCurrentAddress}
              className={getTextAreaClassName("permanentAddress", "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60")}
            />
            {renderError("permanentAddress")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>State <span className="text-red-500">*</span></span>
              {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled</span>}
            </label>
            <Input 
              placeholder="State" 
              value={contactInfo.state} 
              onChange={(e) => updateContactInfo({ state: e.target.value })} 
              className={getFieldClassName("state", undefined, isPrefilled)} 
            />
            {renderError("state")}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">District <span className="text-red-500">*</span></label>
            <Input placeholder="District" value={contactInfo.district} onChange={(e) => updateContactInfo({ district: e.target.value })} className={getFieldClassName("district")} />
            {renderError("district")}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>City <span className="text-red-500">*</span></span>
              {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prfilled</span>}
            </label>
            <Input 
              placeholder="City" 
              value={contactInfo.city} 
              onChange={(e) => updateContactInfo({ city: e.target.value })} 
              className={getFieldClassName("city", undefined, isPrefilled)} 
            />
            {renderError("city")}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pincode <span className="text-red-500">*</span></label>
            <Input placeholder="6-digit" maxLength={6} value={contactInfo.pincode} onChange={(e) => updateContactInfo({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className={getFieldClassName("pincode")} />
            {renderError("pincode")}
          </div>
        </div>
      </div>
    </div>
  );
}
