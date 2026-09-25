"use client";

import { CompletedFilesDirectory } from "@/features/completed-files/components/CompletedFilesDirectory";

export default function CompletedSpermFilesPage() {
  return (
    <CompletedFilesDirectory
      initialDonorType="sperm"
      pageTitle="Completed Sperm Donor Files"
      badgeLabel="Sperm Donor Files"
      description="Clinical registry, hospital payments, verification documents, and official dossier generator for completed sperm donors."
    />
  );
}
