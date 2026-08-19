"use client";

import { useSearchParams } from "next/navigation";
import { RegistrationWizard } from "@/features/donor-registration/components/RegistrationWizard";
import { Suspense } from "react";

function RegisterContent() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type");
  const donorType = rawType === "egg" ? "egg" : "sperm";
  const draftId = searchParams.get("id") || undefined;

  return <RegistrationWizard donorType={donorType} draftId={draftId} />;
}

export default function DonorRegisterPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-6">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
