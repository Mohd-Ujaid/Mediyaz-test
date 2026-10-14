"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReactPdfViewer = dynamic(
  () => import("@/features/pdf-preview/components/ReactPdfViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-screen w-screen justify-center items-center font-sans gap-3.5 bg-slate-50">
        <div className="w-11 h-11 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <div className="text-slate-800 font-semibold text-sm">Preparing Document</div>
          <div className="text-slate-500 text-xs mt-1">Loading PDF Statement...</div>
        </div>
      </div>
    ),
  }
);

interface LedgerPrintViewerProps {
  type: "clinic" | "donor";
  hospitalId?: string;
  status?: string;
  donorType?: string;
  search?: string;
  branch?: string;
  startDate?: string;
  endDate?: string;
}

export default function LedgerPrintViewer({
  type,
  hospitalId,
  status,
  donorType,
  search,
  branch,
  startDate,
  endDate,
}: LedgerPrintViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docTitle =
    type === "clinic"
      ? "Mediyaz ART Bank Ledger"
      : "Mediyaz ART Bank Ledger - Donor Disbursements";

  const fileName = `Mediyaz_${type === "clinic" ? "Clinic" : "Donor"}_Ledger_${
    new Date().toISOString().split("T")[0]
  }.pdf`;

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadPdf() {
      try {
        const params = new URLSearchParams();
        params.append("type", type);
        params.append("preview", "true");
        if (hospitalId && hospitalId !== "ALL") params.append("hospitalId", hospitalId);
        if (status && status !== "ALL") params.append("status", status);
        if (donorType) params.append("donorType", donorType);
        if (search) params.append("search", search);
        if (branch && branch !== "ALL") params.append("branch", branch);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const url = `/api/ledger/pdf?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to generate PDF statement (Status ${res.status})`);
        }
        const blob = await res.blob();
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setPdfBlob(blob);
        setPdfUrl(createdUrl);
      } catch (err: any) {
        if (!active) return;
        console.error("Ledger PDF fetch error:", err);
        setError(err.message || "Failed to load PDF statement");
      }
    }

    loadPdf();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [type, hospitalId, status, donorType, search]);

  if (error) {
    return (
      <div className="flex flex-col h-screen w-screen justify-center items-center font-sans gap-3 p-6 bg-slate-50 text-center">
        <div className="text-rose-600 font-bold text-base">PDF Generation Failed</div>
        <p className="text-slate-600 text-xs max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex flex-col h-screen w-screen justify-center items-center font-sans gap-3.5 bg-slate-50 select-none">
        <div className="w-11 h-11 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <div className="text-slate-800 font-semibold text-sm">Preparing Document</div>
          <div className="text-slate-500 text-xs mt-1">Generating {docTitle}...</div>
        </div>
      </div>
    );
  }

  return (
    <ReactPdfViewer
      pdfBlob={pdfBlob}
      pdfUrl={pdfUrl}
      title={docTitle}
      fileName={fileName}
    />
  );
}
