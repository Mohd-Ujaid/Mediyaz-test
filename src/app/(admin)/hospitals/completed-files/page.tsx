"use client";

import { CompletedFilesDirectory } from "@/features/completed-files/components/CompletedFilesDirectory";

export default function CompletedFilesManagementPage() {
  return (
    <CompletedFilesDirectory
      initialDonorType="egg"
      pageTitle="Completed Files Directory"
      badgeLabel="ART Clinic Management"
      description="Financial and compliance status for completed donor files: update hospital payment collections, verify uploaded documents, and review agreed deals."
    />
  );
}
