/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useDonorFormStore } from "../store";

const RADIO_OPTIONS = {
  diabetes: ["Yes", "No", "Pre-Diabetic"],
  hypertension: ["Yes", "No", "Borderline"],
  smokingStatus: ["Never", "Former", "Current"],
  alcoholConsumption: ["Never", "Occasional", "Regular"],
  drugUse: ["Never", "Former", "Current"],
};

function RadioGroup({ label, name, value, options, error, onChange }: {
  label: string; name: string; value: string; options: string[];
  error?: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label} <span className="text-red-500">*</span></label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              value === opt
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : error
                  ? "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-red-500 hover:border-red-600 ring-1 ring-red-500/10"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export function StepMedicalInfo({ errors }: { errors?: Record<string, string> }) {
  const { medicalInfo, updateMedicalInfo } = useDonorFormStore();

  const getTextAreaClassName = (fieldKey: string, baseStyle = "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500") => {
    const hasError = errors?.[`medicalInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-700`;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div key={key} className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
            <textarea
              placeholder={placeholder}
              value={(medicalInfo as any)[key] || ""}
              onChange={(e) => updateMedicalInfo({ [key]: e.target.value })}
              rows={2}
              className={getTextAreaClassName(key)}
            />
            {renderError(key)}
          </div>
        ))}
      </div>

      {/* Radio Groups */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Lifestyle & Health Screening</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <RadioGroup label="Diabetes" name="diabetes" value={medicalInfo.diabetes} options={RADIO_OPTIONS.diabetes} error={errors?.["medicalInfo.diabetes"]} onChange={(v) => updateMedicalInfo({ diabetes: v as any })} />
          <RadioGroup label="Hypertension" name="hypertension" value={medicalInfo.hypertension} options={RADIO_OPTIONS.hypertension} error={errors?.["medicalInfo.hypertension"]} onChange={(v) => updateMedicalInfo({ hypertension: v as any })} />
          <RadioGroup label="Smoking Status" name="smokingStatus" value={medicalInfo.smokingStatus} options={RADIO_OPTIONS.smokingStatus} error={errors?.["medicalInfo.smokingStatus"]} onChange={(v) => updateMedicalInfo({ smokingStatus: v as any })} />
          <RadioGroup label="Alcohol Consumption" name="alcoholConsumption" value={medicalInfo.alcoholConsumption} options={RADIO_OPTIONS.alcoholConsumption} error={errors?.["medicalInfo.alcoholConsumption"]} onChange={(v) => updateMedicalInfo({ alcoholConsumption: v as any })} />
          <RadioGroup label="Drug Use" name="drugUse" value={medicalInfo.drugUse} options={RADIO_OPTIONS.drugUse} error={errors?.["medicalInfo.drugUse"]} onChange={(v) => updateMedicalInfo({ drugUse: v as any })} />
        </div>
      </div>
    </div>
  );
}
