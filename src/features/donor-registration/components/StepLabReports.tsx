/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useDonorFormStore } from "../store";
import { FileUploadField } from "@/features/file-upload/components/FileUploadField";

export function StepLabReports({ errors }: { errors?: Record<string, string> }) {
  const { labReports, updateLabReports } = useDonorFormStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laboratory Reports</h3>
        <p className="text-xs text-slate-500 mt-1">
          Upload your recent laboratory test reports. All files must be in PDF format.
        </p>
      </div>

      {/* Viral Markers (multiple upload) */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Viral Markers <span className="text-red-500">*</span>
        </h4>
        <p className="text-[10px] text-slate-400">
          Upload PDF reports for HIV, Hepatitis B, Hepatitis C, and VDRL.
        </p>
        <FileUploadField
          label="Viral Marker PDF"
          value={null}
          accept=".pdf"
          folder="documents"
          error={errors?.["labReports.viralMarkers"]}
          onChange={(file) => {
            if (file) {
              const current = labReports.viralMarkers || [];
              updateLabReports({ viralMarkers: [...current, file] });
            }
          }}
        />
        {labReports.viralMarkers && labReports.viralMarkers.length > 0 && (
          <div className="space-y-2 mt-2">
            {labReports.viralMarkers.map((report: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-600 truncate">{report.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...(labReports.viralMarkers || [])];
                    updated.splice(idx, 1);
                    updateLabReports({ viralMarkers: updated });
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blood Report (single upload) */}
      <FileUploadField
        label="Blood Report"
        value={labReports.bloodReport}
        accept=".pdf"
        onChange={(file) => updateLabReports({ bloodReport: file })}
        required={true}
        folder="documents"
        error={errors?.["labReports.bloodReport"]}
        description="Upload your blood grouping and CBC report (PDF format only)."
      />

      {/* Other Reports (multiple upload) */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-[#1E293B] space-y-3">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Other Reports</h4>
        <p className="text-[10px] text-slate-400">Upload any additional medical reports (PDF format only).</p>
        <FileUploadField
          label="Additional Report PDF"
          value={null}
          accept=".pdf"
          folder="documents"
          onChange={(file) => {
            if (file) {
              const current = labReports.otherReports || [];
              updateLabReports({ otherReports: [...current, file] });
            }
          }}
        />
        {labReports.otherReports && labReports.otherReports.length > 0 && (
          <div className="space-y-2 mt-2">
            {labReports.otherReports.map((report: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-600 truncate">{report.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...(labReports.otherReports || [])];
                    updated.splice(idx, 1);
                    updateLabReports({ otherReports: updated });
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
