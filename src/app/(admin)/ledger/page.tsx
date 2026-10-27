import React from "react";
import { LedgerDirectory } from "@/features/ledger/components/LedgerDirectory";

export const metadata = {
  title: "Accounts Ledger | Mediyaz ART Bank Admin",
  description: "Official Clinic and Donor payment accounts ledger with one-click PDF generation.",
};

export default function LedgerPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <LedgerDirectory />
    </div>
  );
}
