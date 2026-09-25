/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Input } from "@/components/ui/input";
import { useDonorFormStore } from "../store";
import { ShieldCheck } from "lucide-react";

export function StepConsent({ errors }: { errors?: Record<string, string> }) {
  const { consent, updateConsent, documents, donorType } = useDonorFormStore();

  const CONSENT_ITEMS = [
    {
      key: "confirmTruth",
      label:
        "I confirm that all the information provided in this registration form is true, accurate, and complete to the best of my knowledge.",
    },
    {
      key: "agreeVoluntary",
      label: `I agree that my participation in the ${donorType === "egg" ? "egg" : "sperm"} donation program is entirely voluntary and I have not been coerced in any way.`,
    },
    {
      key: "consentScreening",
      label:
        "I consent to undergo all necessary medical screenings, blood tests, genetic evaluations, and psychological assessments as required by the clinic.",
    },
    {
      key: "allowStorage",
      label:
        "I authorize Mediyaz Art Bank to securely store my personal information, medical records, and identity documents in compliance with applicable data protection regulations.",
    },
  ];

  const getFieldClassName = (fieldKey: string, baseStyle = "rounded-xl") => {
    const hasError = errors?.[`consent.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500`;
  };

  const renderError = (fieldKey: string) => {
    const errorMsg = errors?.[`consent.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Consent & Declaration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Please read each declaration carefully and provide your consent.
          </p>
        </div>
      </div>

      {/* Consent Checkboxes */}
      <div className="space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {CONSENT_ITEMS.map(({ key, label }) => {
          const hasError = !!errors?.[`consent.${key}`];
          return (
            <div key={key} className="space-y-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(consent as any)[key]}
                  onChange={(e) => updateConsent({ [key]: e.target.checked })}
                  className={`mt-1 accent-emerald-600 rounded w-4 h-4 ${hasError ? "ring-2 ring-red-500/30 border-red-500" : ""}`}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                  {label}
                </span>
              </label>
              {renderError(key)}
            </div>
          );
        })}
      </div>

      {/* Signature Picture & Date */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Signature Picture</label>
          <div className="h-16 flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            {documents.signature?.url ? (
              <img
                src={documents.signature.url}
                alt="Signature"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-slate-400">No signature uploaded in previous step</span>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date <span className="text-red-500">*</span></label>
          <Input
            type="date"
            value={consent.signatureDate}
            onChange={(e) => updateConsent({ signatureDate: e.target.value })}
            className={getFieldClassName("signatureDate")}
          />
          {renderError("signatureDate")}
        </div>
      </div> */}

      <div className="p-4 rounded-xl bg-accent border border-border">
        <p className="text-[10px] text-accent-foreground leading-relaxed">
          <strong>Legal Notice:</strong> By submitting this registration form,
          you acknowledge that all information provided is subject to
          verification. Any false or misleading information may result in
          disqualification from the donor program. Your personal data will be
          handled in accordance with our Privacy Policy and applicable
          healthcare data protection laws. Mediyaz Art Bank reserves the
          right to accept or reject any donor application at its sole discretion
          based on medical and genetic screening results.
        </p>
      </div>
    </div>
  );
}
