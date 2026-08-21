/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Input } from "@/components/ui/input";
import { useDonorFormStore } from "../store";
import { Dna, Egg, Activity, Stethoscope } from "lucide-react";
import { useState } from "react";

export function StepDonorInfo({ errors }: { errors?: Record<string, string> }) {
  const { 
    donorType, 
    spermDonorInfo, 
    eggDonorInfo, 
    updateSpermDonorInfo, 
    updateEggDonorInfo,
    investigations,
    updateInvestigations,
    physicalExamination,
    updatePhysicalExamination
  } = useDonorFormStore();

  const [showInvestigations, setShowInvestigations] = useState(false);
  const [showPhysicalExam, setShowPhysicalExam] = useState(false);

  const getClinicalFieldClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-950 text-xs focus-visible:ring-teal-500") => {
    const hasError = errors?.[`investigations.${fieldKey}`] || errors?.[`physicalExamination.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800`;
  };

  const getClinicalSelectClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500") => {
    const hasError = errors?.[`investigations.${fieldKey}`] || errors?.[`physicalExamination.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800`;
  };

  const prefix = donorType === "sperm" ? "spermDonorInfo" : "eggDonorInfo";

  const [showSpermTextarea, setShowSpermTextarea] = useState<Record<string, boolean>>(() => {
    return {
      semenAnalysis: !!spermDonorInfo.semenAnalysis,
    };
  });

  const [showEggTextarea, setShowEggTextarea] = useState<Record<string, boolean>>(() => {
    return {
      menstrualCycleDetails: !!eggDonorInfo.menstrualCycleDetails,
      pregnancyHistory: !!eggDonorInfo.pregnancyHistory,
      ivfHistory: !!eggDonorInfo.ivfHistory,
      hormonalTestDetails: !!eggDonorInfo.hormonalTestDetails,
    };
  });

  const handleSpermToggle = (key: string, show: boolean) => {
    setShowSpermTextarea((prev) => ({ ...prev, [key]: show }));
    if (!show) {
      updateSpermDonorInfo({ [key]: "" });
    }
  };

  const handleEggToggle = (key: string, show: boolean) => {
    setShowEggTextarea((prev) => ({ ...prev, [key]: show }));
    if (!show) {
      updateEggDonorInfo({ [key]: "" });
    }
  };

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

  const getSelectClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500") => {
    const hasError = errors?.[`${prefix}.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    const ringFocus = donorType === "egg" ? "focus:ring-rose-500 focus:border-rose-500" : "focus:ring-blue-500 focus:border-blue-500";
    return `${baseStyle} border-slate-200 dark:border-slate-800 ${ringFocus}`;
  };

  const renderError = (fieldKey: string) => {
    const errorMsg = errors?.[`${prefix}.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  const renderClinicalPanels = () => {
    return (
      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        {/* Investigations Accordion Card */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowInvestigations(!showInvestigations)}
            className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600 animate-pulse" />
              Laboratory Investigations (Clinical Diagnostics - Investigator Use)
            </span>
            <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full font-semibold">
              {showInvestigations ? "Hide Fields ▲" : "Show Fields ▼"}
            </span>
          </button>
          
          {showInvestigations && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Hb (Hemoglobin)</label>
                <Input placeholder="e.g. 12.5 g/dl" value={investigations?.hb || ""} onChange={(e) => updateInvestigations({ hb: e.target.value })} className={getClinicalFieldClassName("hb")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total RBC Count</label>
                <Input placeholder="e.g. 4.5 million" value={investigations?.totalRbc || ""} onChange={(e) => updateInvestigations({ totalRbc: e.target.value })} className={getClinicalFieldClassName("totalRbc")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total WBC Count</label>
                <Input placeholder="e.g. 7500 /cumm" value={investigations?.totalWbc || ""} onChange={(e) => updateInvestigations({ totalWbc: e.target.value })} className={getClinicalFieldClassName("totalWbc")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Differential WBC Count</label>
                <Input placeholder="e.g. N-65, L-28..." value={investigations?.differentialWbc || ""} onChange={(e) => updateInvestigations({ differentialWbc: e.target.value })} className={getClinicalFieldClassName("differentialWbc")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Platelet Count</label>
                <Input placeholder="e.g. 2.5 Lakhs" value={investigations?.plateletCount || ""} onChange={(e) => updateInvestigations({ plateletCount: e.target.value })} className={getClinicalFieldClassName("plateletCount")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Peripheral Smear</label>
                <Input placeholder="e.g. Normocytic" value={investigations?.peripheralSmear || ""} onChange={(e) => updateInvestigations({ peripheralSmear: e.target.value })} className={getClinicalFieldClassName("peripheralSmear")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Random Blood Sugar</label>
                <Input placeholder="e.g. 98 mg/dl" value={investigations?.randomBloodSugar || ""} onChange={(e) => updateInvestigations({ randomBloodSugar: e.target.value })} className={getClinicalFieldClassName("randomBloodSugar")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Blood Urea / Creatinine</label>
                <Input placeholder="e.g. 24 / 0.8" value={investigations?.bloodUreaSerumCreatinine || ""} onChange={(e) => updateInvestigations({ bloodUreaSerumCreatinine: e.target.value })} className={getClinicalFieldClassName("bloodUreaSerumCreatinine")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">SGPT</label>
                <Input placeholder="e.g. 35 U/L" value={investigations?.sgpt || ""} onChange={(e) => updateInvestigations({ sgpt: e.target.value })} className={getClinicalFieldClassName("sgpt")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Routine Urine Exam</label>
                <Input placeholder="e.g. Normal" value={investigations?.routineUrine || ""} onChange={(e) => updateInvestigations({ routineUrine: e.target.value })} className={getClinicalFieldClassName("routineUrine")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">HBsAg Status</label>
                <select value={investigations?.hbsagStatus || ""} onChange={(e) => updateInvestigations({ hbsagStatus: e.target.value })} className={getClinicalSelectClassName("hbsagStatus")}>
                  <option value="">Select Option</option>
                  <option value="Negative">Negative</option>
                  <option value="Positive">Positive</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Hepatitis C Virus Status</label>
                <select value={investigations?.hepatitisCStatus || ""} onChange={(e) => updateInvestigations({ hepatitisCStatus: e.target.value })} className={getClinicalSelectClassName("hepatitisCStatus")}>
                  <option value="">Select Option</option>
                  <option value="Negative">Negative</option>
                  <option value="Positive">Positive</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">HIV Status (with Date)</label>
                <Input placeholder="e.g. Negative (20/08/2026)" value={investigations?.hivStatus || ""} onChange={(e) => updateInvestigations({ hivStatus: e.target.value })} className={getClinicalFieldClassName("hivStatus")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Hemoglobin A2 Status</label>
                <Input placeholder="e.g. Normal (<3%)" value={investigations?.hemoglobinA2 || ""} onChange={(e) => updateInvestigations({ hemoglobinA2: e.target.value })} className={getClinicalFieldClassName("hemoglobinA2")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">VDRL Status</label>
                <select value={investigations?.vdrl || ""} onChange={(e) => updateInvestigations({ vdrl: e.target.value })} className={getClinicalSelectClassName("vdrl")}>
                  <option value="">Select Option</option>
                  <option value="Negative">Negative</option>
                  <option value="Positive">Positive</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Any Other Specific Test</label>
                <Input placeholder="Enter details..." value={investigations?.otherSpecificTest || ""} onChange={(e) => updateInvestigations({ otherSpecificTest: e.target.value })} className={getClinicalFieldClassName("otherSpecificTest")} />
              </div>
            </div>
          )}
        </div>

        {/* Physical Examination Accordion Card */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setShowPhysicalExam(!showPhysicalExam)}
            className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-slate-850 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600 animate-pulse" />
              Detailed Physical Examination (Clinic Diagnostics - Investigator Use)
            </span>
            <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full font-semibold">
              {showPhysicalExam ? "Hide Fields ▲" : "Show Fields ▼"}
            </span>
          </button>
          
          {showPhysicalExam && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pulse Rate</label>
                <Input placeholder="e.g. 72 /min" value={physicalExamination?.pulse || ""} onChange={(e) => updatePhysicalExamination({ pulse: e.target.value })} className={getClinicalFieldClassName("pulse")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Blood Pressure</label>
                <Input placeholder="e.g. 120/80 mmHg" value={physicalExamination?.bloodPressure || ""} onChange={(e) => updatePhysicalExamination({ bloodPressure: e.target.value })} className={getClinicalFieldClassName("bloodPressure")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Body Temperature</label>
                <Input placeholder="e.g. 98.6 °F" value={physicalExamination?.temperature || ""} onChange={(e) => updatePhysicalExamination({ temperature: e.target.value })} className={getClinicalFieldClassName("temperature")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Respiratory System</label>
                <Input placeholder="e.g. NAD (No abnormality detected)" value={physicalExamination?.respiratorySystem || ""} onChange={(e) => updatePhysicalExamination({ respiratorySystem: e.target.value })} className={getClinicalFieldClassName("respiratorySystem")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cardiovascular System</label>
                <Input placeholder="e.g. S1 S2 heard" value={physicalExamination?.cardiovascularSystem || ""} onChange={(e) => updatePhysicalExamination({ cardiovascularSystem: e.target.value })} className={getClinicalFieldClassName("cardiovascularSystem")} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Per Abdominal Examination</label>
                <Input placeholder="e.g. Soft, Non-tender" value={physicalExamination?.perAbdominal || ""} onChange={(e) => updatePhysicalExamination({ perAbdominal: e.target.value })} className={getClinicalFieldClassName("perAbdominal")} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
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
          {/* Semen Analysis conditional textarea */}
          <div className="md:col-span-2 space-y-2 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Semen Analysis Results Available? (Optional)</label>
              <select
                value={showSpermTextarea.semenAnalysis ? "Yes" : "No"}
                onChange={(e) => handleSpermToggle("semenAnalysis", e.target.value === "Yes")}
                className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {showSpermTextarea.semenAnalysis && (
              <div className="pt-2 animate-fadeIn">
                <textarea
                  placeholder="Sperm count, motility, morphology details..."
                  value={spermDonorInfo.semenAnalysis || ""}
                  onChange={(e) => updateSpermDonorInfo({ semenAnalysis: e.target.value })}
                  rows={3}
                  className={getTextAreaClassName("semenAnalysis")}
                />
                {renderError("semenAnalysis")}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Previous Donation History <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
            <select
              value={spermDonorInfo.previousDonationHistory || ""}
              onChange={(e) => updateSpermDonorInfo({ previousDonationHistory: e.target.value as any })}
              className={getSelectClassName("previousDonationHistory")}
            >
              <option value="">Select Options (Optional)</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
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
        {renderClinicalPanels()}
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
        {/* Menstrual Cycle Details */}
        <div className="md:col-span-2 space-y-2 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Menstrual Cycle Details Available? (Optional)</label>
            <select
              value={showEggTextarea.menstrualCycleDetails ? "Yes" : "No"}
              onChange={(e) => handleEggToggle("menstrualCycleDetails", e.target.value === "Yes")}
              className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {showEggTextarea.menstrualCycleDetails && (
            <div className="pt-2 animate-fadeIn">
              <textarea
                placeholder="Regularity, cycle length, any irregularities..."
                value={eggDonorInfo.menstrualCycleDetails || ""}
                onChange={(e) => updateEggDonorInfo({ menstrualCycleDetails: e.target.value })}
                rows={3}
                className={getTextAreaClassName("menstrualCycleDetails")}
              />
              {renderError("menstrualCycleDetails")}
            </div>
          )}
        </div>

        {/* Pregnancy History */}
        <div className="md:col-span-2 space-y-2 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pregnancy History Available? (Optional)</label>
            <select
              value={showEggTextarea.pregnancyHistory ? "Yes" : "No"}
              onChange={(e) => handleEggToggle("pregnancyHistory", e.target.value === "Yes")}
              className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {showEggTextarea.pregnancyHistory && (
            <div className="pt-2 animate-fadeIn">
              <textarea
                placeholder="Previous pregnancies, outcomes..."
                value={eggDonorInfo.pregnancyHistory || ""}
                onChange={(e) => updateEggDonorInfo({ pregnancyHistory: e.target.value })}
                rows={2}
                className={getTextAreaClassName("pregnancyHistory")}
              />
              {renderError("pregnancyHistory")}
            </div>
          )}
        </div>

        {/* Previous Egg Donation */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Previous Egg Donation <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <select
            value={eggDonorInfo.previousEggDonation || ""}
            onChange={(e) => updateEggDonorInfo({ previousEggDonation: e.target.value as any })}
            className={getSelectClassName("previousEggDonation")}
          >
            <option value="">Select Options (Optional)</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {renderError("previousEggDonation")}
        </div>

        {/* IVF History */}
        <div className="md:col-span-2 space-y-2 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">IVF History Available? (Optional)</label>
            <select
              value={showEggTextarea.ivfHistory ? "Yes" : "No"}
              onChange={(e) => handleEggToggle("ivfHistory", e.target.value === "Yes")}
              className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {showEggTextarea.ivfHistory && (
            <div className="pt-2 animate-fadeIn">
              <textarea
                placeholder="Any previous IVF cycles, outcomes..."
                value={eggDonorInfo.ivfHistory || ""}
                onChange={(e) => updateEggDonorInfo({ ivfHistory: e.target.value })}
                rows={2}
                className={getTextAreaClassName("ivfHistory")}
              />
              {renderError("ivfHistory")}
            </div>
          )}
        </div>

        {/* Ovarian Reserve */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ovarian Reserve (Optional)</label>
          <Input placeholder="AMH levels, antral follicle count..." value={eggDonorInfo.ovarianReserve || ""} onChange={(e) => updateEggDonorInfo({ ovarianReserve: e.target.value })} className={getFieldClassName("ovarianReserve")} />
          {renderError("ovarianReserve")}
        </div>

        {/* Hormonal Test Details */}
        <div className="md:col-span-2 space-y-2 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hormonal Test Details Available? (Optional)</label>
            <select
              value={showEggTextarea.hormonalTestDetails ? "Yes" : "No"}
              onChange={(e) => handleEggToggle("hormonalTestDetails", e.target.value === "Yes")}
              className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {showEggTextarea.hormonalTestDetails && (
            <div className="pt-2 animate-fadeIn">
              <textarea
                placeholder="FSH, LH, Estradiol, AMH levels..."
                value={eggDonorInfo.hormonalTestDetails || ""}
                onChange={(e) => updateEggDonorInfo({ hormonalTestDetails: e.target.value })}
                rows={2}
                className={getTextAreaClassName("hormonalTestDetails")}
              />
              {renderError("hormonalTestDetails")}
            </div>
          )}
        </div>

        {/* Number of Deliveries */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Number of Deliveries <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <Input type="number" placeholder="e.g. 0 or 1" value={eggDonorInfo.numberOfDeliveries || ""} onChange={(e) => updateEggDonorInfo({ numberOfDeliveries: e.target.value })} className={getFieldClassName("numberOfDeliveries")} />
          {renderError("numberOfDeliveries")}
        </div>

        {/* Number of Abortions */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Number of Abortions <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <Input type="number" placeholder="e.g. 0 or 1" value={eggDonorInfo.numberOfAbortions || ""} onChange={(e) => updateEggDonorInfo({ numberOfAbortions: e.target.value })} className={getFieldClassName("numberOfAbortions")} />
          {renderError("numberOfAbortions")}
        </div>

        {/* Obstetric History */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Obstetric History <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <select value={eggDonorInfo.obstetricHistory || ""} onChange={(e) => updateEggDonorInfo({ obstetricHistory: e.target.value })} className={getSelectClassName("obstetricHistory")}>
            <option value="">Select (Optional)</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {renderError("obstetricHistory")}
        </div>

        {/* Contraceptive History */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">History of Contraceptives <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <select value={eggDonorInfo.contraceptiveHistory || ""} onChange={(e) => updateEggDonorInfo({ contraceptiveHistory: e.target.value })} className={getSelectClassName("contraceptiveHistory")}>
            <option value="">Select (Optional)</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {renderError("contraceptiveHistory")}
        </div>

        {/* Blood Transfusion History */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">History of Blood Transfusion <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <select value={eggDonorInfo.bloodTransfusionHistory || ""} onChange={(e) => updateEggDonorInfo({ bloodTransfusionHistory: e.target.value })} className={getSelectClassName("bloodTransfusionHistory")}>
            <option value="">Select (Optional)</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {renderError("bloodTransfusionHistory")}
        </div>

        {/* Substance Abuse History */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">History of Substance Abuse <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <select value={eggDonorInfo.substanceAbuseHistory || ""} onChange={(e) => updateEggDonorInfo({ substanceAbuseHistory: e.target.value })} className={getSelectClassName("substanceAbuseHistory")}>
            <option value="">Select (Optional)</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {renderError("substanceAbuseHistory")}
        </div>

        {/* Other Points of Note */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Other Points of Note <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
          <Input placeholder="Any other obstetric/medical points..." value={eggDonorInfo.otherPointsOfNote || ""} onChange={(e) => updateEggDonorInfo({ otherPointsOfNote: e.target.value })} className={getFieldClassName("otherPointsOfNote")} />
          {renderError("otherPointsOfNote")}
        </div>
      </div>
      {renderClinicalPanels()}
    </div>
  );
}
