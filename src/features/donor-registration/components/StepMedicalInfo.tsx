/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useDonorFormStore } from "../store";
import { useState } from "react";

const RADIO_OPTIONS = {
  diabetes: ["Yes", "No", "Pre-Diabetic"],
  hypertension: ["Yes", "No", "Borderline"],
  smokingStatus: ["Never", "Former", "Current"],
  alcoholConsumption: ["Never", "Occasional", "Regular"],
  drugUse: ["Never", "Former", "Current"],
};

export function StepMedicalInfo({ errors }: { errors?: Record<string, string> }) {
  const { medicalInfo, updateMedicalInfo } = useDonorFormStore();
  const [showTextarea, setShowTextarea] = useState<Record<string, boolean>>(() => {
    return {
      medicalHistory: !!medicalInfo.medicalHistory,
      familyMedicalHistory: !!medicalInfo.familyMedicalHistory,
      previousSurgeries: !!medicalInfo.previousSurgeries,
      allergies: !!medicalInfo.allergies,
      currentMedications: !!medicalInfo.currentMedications,
      geneticDisorders: !!medicalInfo.geneticDisorders,
      psychologicalHistory: !!medicalInfo.psychologicalHistory,
      infectiousDiseases: !!medicalInfo.infectiousDiseases,
      fertilityHistory: !!medicalInfo.fertilityHistory,
    };
  });

  const handleToggle = (key: string, show: boolean) => {
    setShowTextarea((prev) => ({ ...prev, [key]: show }));
    if (!show) {
      updateMedicalInfo({ [key]: "" });
    }
  };

  const getTextAreaClassName = (fieldKey: string, baseStyle = "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500") => {
    const hasError = errors?.[`medicalInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-700`;
  };

  const getSelectClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500") => {
    const hasError = errors?.[`medicalInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800`;
  };

  const renderError = (fieldKey: string) => {
    const errorMsg = errors?.[`medicalInfo.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Medical Information</h3>
        <p className="text-xs text-slate-500 mt-1">All medical information is kept strictly confidential and is used only for screening purposes.</p>
      </div>

      {/* Text Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { key: "medicalHistory", label: "Medical History", placeholder: "Any chronic conditions, past illnesses..." },
          { key: "familyMedicalHistory", label: "Family Medical History", placeholder: "Hereditary conditions in family..." },
          { key: "previousSurgeries", label: "Previous Surgeries", placeholder: "Any surgeries undergone..." },
          { key: "allergies", label: "Allergies", placeholder: "Food, drug, environmental allergies..." },
          { key: "currentMedications", label: "Current Medications", placeholder: "List any ongoing medications..." },
          { key: "geneticDisorders", label: "Genetic Disorders", placeholder: "Any known genetic conditions..." },
          { key: "psychologicalHistory", label: "Psychological History", placeholder: "Any mental health conditions..." },
          { key: "infectiousDiseases", label: "Infectious Diseases", placeholder: "HIV, Hepatitis, TB, STDs..." },
          { key: "fertilityHistory", label: "Fertility History", placeholder: "Previous fertility treatments, pregnancies..." },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
              <select
                value={showTextarea[key] ? "Yes" : "No"}
                onChange={(e) => handleToggle(key, e.target.value === "Yes")}
                className="w-24 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {showTextarea[key] && (
              <div className="pt-1.5 animate-fadeIn">
                <textarea
                  placeholder={placeholder}
                  value={(medicalInfo as any)[key] || ""}
                  onChange={(e) => updateMedicalInfo({ [key]: e.target.value })}
                  rows={2}
                  className={getTextAreaClassName(key)}
                />
                {renderError(key)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Select Dropdowns */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Lifestyle & Health Screening</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Diabetes <span className="text-red-500">*</span></label>
            <select value={medicalInfo.diabetes} onChange={(e) => updateMedicalInfo({ diabetes: e.target.value as any })} className={getSelectClassName("diabetes")}>
              {RADIO_OPTIONS.diabetes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {errors?.["medicalInfo.diabetes"] && <p className="text-[10px] text-red-500 mt-0.5">{errors["medicalInfo.diabetes"]}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hypertension <span className="text-red-500">*</span></label>
            <select value={medicalInfo.hypertension} onChange={(e) => updateMedicalInfo({ hypertension: e.target.value as any })} className={getSelectClassName("hypertension")}>
              {RADIO_OPTIONS.hypertension.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {errors?.["medicalInfo.hypertension"] && <p className="text-[10px] text-red-500 mt-0.5">{errors["medicalInfo.hypertension"]}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Smoking Status <span className="text-red-500">*</span></label>
            <select value={medicalInfo.smokingStatus} onChange={(e) => updateMedicalInfo({ smokingStatus: e.target.value as any })} className={getSelectClassName("smokingStatus")}>
              {RADIO_OPTIONS.smokingStatus.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {errors?.["medicalInfo.smokingStatus"] && <p className="text-[10px] text-red-500 mt-0.5">{errors["medicalInfo.smokingStatus"]}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alcohol Consumption <span className="text-red-500">*</span></label>
            <select value={medicalInfo.alcoholConsumption} onChange={(e) => updateMedicalInfo({ alcoholConsumption: e.target.value as any })} className={getSelectClassName("alcoholConsumption")}>
              {RADIO_OPTIONS.alcoholConsumption.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {errors?.["medicalInfo.alcoholConsumption"] && <p className="text-[10px] text-red-500 mt-0.5">{errors["medicalInfo.alcoholConsumption"]}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drug Use <span className="text-red-500">*</span></label>
            <select value={medicalInfo.drugUse} onChange={(e) => updateMedicalInfo({ drugUse: e.target.value as any })} className={getSelectClassName("drugUse")}>
              {RADIO_OPTIONS.drugUse.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {errors?.["medicalInfo.drugUse"] && <p className="text-[10px] text-red-500 mt-0.5">{errors["medicalInfo.drugUse"]}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
