"use client";

import { CompletedFilesDirectory } from "@/features/completed-files/components/CompletedFilesDirectory";

export default function CompletedEggFilesPage() {
  return (
    <CompletedFilesDirectory
      initialDonorType="egg"
      pageTitle="Completed Egg Donor Files"
      badgeLabel="Egg Donor Files"
      description="Clinical registry, hospital payments, verification documents, and official dossier generator for completed egg donors."
    />
  );
}
