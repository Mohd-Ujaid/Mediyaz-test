/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Input } from "@/components/ui/input";
import { useDonorFormStore } from "../store";
import { Dna, Egg } from "lucide-react";

export function StepDonorInfo({ errors }: { errors?: Record<string, string> }) {
  const { donorType, spermDonorInfo, eggDonorInfo, updateSpermDonorInfo, updateEggDonorInfo } = useDonorFormStore();
  const prefix = donorType === "sperm" ? "spermDonorInfo" : "eggDonorInfo";

  const getFieldClassName = (fieldKey: string, baseStyle = "rounded-xl") => {
    const hasError = errors?.[`${prefix}.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500`;
  };

  const getTextAreaClassName = (fieldKey: string, baseStyle = "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500") => {
    const hasError = errors?.[`${prefix}.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    const ringFocus = donorType === "egg" ? "focus:ring-rose-500" : "focus:ring-blue-500";
    return `${baseStyle} border-slate-200 dark:border-slate-700 ${ringFocus}`;
  };

  const getButtonClassName = (fieldKey: string, opt: string, value: string, activeClass: string) => {
    const hasError = errors?.[`${prefix}.${fieldKey}`];
    if (value === opt) {
      return activeClass;
    }
    if (hasError) {
      return "bg-white dark:bg-slate-900 text-slate-600 border-red-500 hover:border-red-600 ring-1 ring-red-500/10";
    }
    return "bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-700";
  };

  const renderError = (fieldKey: string) => {
    const errorMsg = errors?.[`${prefix}.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  if (donorType === "sperm") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sperm Donor Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">Specific information related to sperm donation.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Semen Analysis Results</label>
            <textarea
              placeholder="Sperm count, motility, morphology details..."
              value={spermDonorInfo.semenAnalysis || ""}
              onChange={(e) => updateSpermDonorInfo({ semenAnalysis: e.target.value })}
              rows={3}
              className={getTextAreaClassName("semenAnalysis")}
            />
            {renderError("semenAnalysis")}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Previous Donation History <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {["Yes", "No"].map((opt) => (
                <button key={opt} type="button" onClick={() => updateSpermDonorInfo({ previousDonationHistory: opt as any })}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all ${getButtonClassName("previousDonationHistory", opt, spermDonorInfo.previousDonationHistory, "bg-blue-600 text-white border-blue-600")}`}>
                  {opt}
                </button>
              ))}
            </div>
            {renderError("previousDonationHistory")}
          </div>

          {spermDonorInfo.previousDonationHistory === "Yes" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Number of Previous Donations</label>
                <Input type="number" placeholder="0" value={spermDonorInfo.numberOfDonations || ""} onChange={(e) => updateSpermDonorInfo({ numberOfDonations: e.target.value })} className={getFieldClassName("numberOfDonations")} />
                {renderError("numberOfDonations")}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Donation Date</label>
                <Input type="date" value={spermDonorInfo.lastDonationDate || ""} onChange={(e) => updateSpermDonorInfo({ lastDonationDate: e.target.value })} className={getFieldClassName("lastDonationDate")} />
                {renderError("lastDonationDate")}
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Abstinence Period</label>
            <Input placeholder="e.g. 3 days" value={spermDonorInfo.abstinencePeriod || ""} onChange={(e) => updateSpermDonorInfo({ abstinencePeriod: e.target.value })} className={getFieldClassName("abstinencePeriod")} />
            {renderError("abstinencePeriod")}
          </div>
        </div>
      </div>
    );
  }

  // Egg Donor
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
          <Egg className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Egg Donor Information</h3>
          <p className="text-xs text-slate-500 mt-0.5">Specific information related to egg donation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Menstrual Cycle Details</label>
          <textarea
            placeholder="Regularity, cycle length, any irregularities..."
            value={eggDonorInfo.menstrualCycleDetails || ""}
            onChange={(e) => updateEggDonorInfo({ menstrualCycleDetails: e.target.value })}
            rows={3}
            className={getTextAreaClassName("menstrualCycleDetails")}
          />
          {renderError("menstrualCycleDetails")}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pregnancy History</label>
          <textarea
            placeholder="Previous pregnancies, outcomes..."
            value={eggDonorInfo.pregnancyHistory || ""}
            onChange={(e) => updateEggDonorInfo({ pregnancyHistory: e.target.value })}
            rows={2}
            className={getTextAreaClassName("pregnancyHistory")}
          />
          {renderError("pregnancyHistory")}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Previous Egg Donation <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            {["Yes", "No"].map((opt) => (
              <button key={opt} type="button" onClick={() => updateEggDonorInfo({ previousEggDonation: opt as any })}
                className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all ${getButtonClassName("previousEggDonation", opt, eggDonorInfo.previousEggDonation, "bg-rose-600 text-white border-rose-600")}`}>
                {opt}
              </button>
            ))}
          </div>
          {renderError("previousEggDonation")}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">IVF History</label>
          <textarea
            placeholder="Any previous IVF cycles, outcomes..."
            value={eggDonorInfo.ivfHistory || ""}
            onChange={(e) => updateEggDonorInfo({ ivfHistory: e.target.value })}
            rows={2}
            className={getTextAreaClassName("ivfHistory")}
          />
          {renderError("ivfHistory")}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ovarian Reserve</label>
          <Input placeholder="AMH levels, antral follicle count..." value={eggDonorInfo.ovarianReserve || ""} onChange={(e) => updateEggDonorInfo({ ovarianReserve: e.target.value })} className={getFieldClassName("ovarianReserve")} />
          {renderError("ovarianReserve")}
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hormonal Test Details</label>
          <textarea
            placeholder="FSH, LH, Estradiol, AMH levels..."
            value={eggDonorInfo.hormonalTestDetails || ""}
            onChange={(e) => updateEggDonorInfo({ hormonalTestDetails: e.target.value })}
            rows={2}
            className={getTextAreaClassName("hormonalTestDetails")}
          />
          {renderError("hormonalTestDetails")}
        </div>
      </div>
    </div>
  );
}
