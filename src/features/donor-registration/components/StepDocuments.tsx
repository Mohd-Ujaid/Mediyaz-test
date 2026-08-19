/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useDonorFormStore } from "../store";
import { FileUploadField } from "@/features/file-upload/components/FileUploadField";
import type { FileRef } from "@/features/donor-registration/validations/donor-registration";
import { ShieldCheck } from "lucide-react";

const DOCUMENTS = [
  {
    key: "passportPhoto",
    label: "Photo",
    required: true,
    accept: ".png,.jpg,.jpeg,.webp",
    folder: "profile-images",
  },
  {
    key: "aadhaarFront",
    label: "Aadhaar Card (Front)",
    required: true,
    accept: ".png,.jpg,.jpeg,.webp",
    folder: "documents",
  },
  {
    key: "aadhaarBack",
    label: "Aadhaar Card (Back)",
    required: true,
    accept: ".png,.jpg,.jpeg,.webp",
    folder: "documents",
  },
  {
    key: "signature",
    label: "Signature",
    required: true,
    accept: ".png,.jpg,.jpeg,.webp",
    folder: "documents",
  },
  {
    key: "otherDocument",
    label: "Other Document",
    required: false,
    accept: ".png,.jpg,.jpeg,.webp",
    folder: "documents",
  },
];

export function StepDocuments({ errors }: { errors?: Record<string, string> }) {
  const { documents, updateDocuments } = useDonorFormStore();

  const aadhaarFrontUploaded = !!documents.aadhaarFront?.url;
  const aadhaarBackUploaded = !!documents.aadhaarBack?.url;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Document Upload
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Upload your photo, Aadhaar card, and signature. Accepted formats: JPG,
          PNG, WEBP (max 10MB each).
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Secure Document Storage
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
            Your identity documents and signature are uploaded once and securely
            stored.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENTS.map(({ key, label, required, accept, folder }) => {
          const isAadhaar = key === "aadhaarFront" || key === "aadhaarBack";
          const alreadyUploaded = isAadhaar && (documents as any)[key]?.url;

          return (
            <div key={key}>
              {alreadyUploaded && (
                <div className="mb-1 text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Already uploaded &
                  securely stored
                </div>
              )}
              <FileUploadField
                key={key}
                label={label}
                value={(documents as any)[key] as FileRef}
                onChange={(file) => updateDocuments({ [key]: file })}
                required={required}
                accept={accept}
                folder={folder}
                enableCrop={true}
                error={errors?.[`documents.${key}`]}
                cropMode={
                  key === "signature"
                    ? "signature"
                    : key === "passportPhoto"
                      ? "photo"
                      : "document"
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
