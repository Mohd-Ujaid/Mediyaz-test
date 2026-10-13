import React from "react";
import { InvoiceTrackerDirectory } from "@/features/invoices/components/InvoiceTrackerDirectory";

export const metadata = {
  title: "Invoice Tracker | Mediyaz ART Bank Admin",
  description: "Track all invoices, clinic billing, and payment statuses in real-time.",
};

export default function InvoicesPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <InvoiceTrackerDirectory />
    </div>
  );
}
