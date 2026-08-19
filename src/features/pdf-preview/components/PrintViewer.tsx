/* eslint-disable jsx-a11y/alt-text */
"use client";

import React, { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import PrintableRegistrationDocument from "@/features/pdf-generator/components/PrintableRegistration";

interface PrintViewerProps {
  registration: any;
  withHeader: boolean;
  attachments: string[];
  sections?: string[];
  extraDocUrl?: string;
  overrides?: Record<string, any>;
}

export default function PrintViewer({
  registration,
  withHeader,
  attachments,
  sections,
  extraDocUrl,
  overrides,
}: PrintViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generatePdf() {
      try {
        const reactPdfBlob = await pdf(
          <PrintableRegistrationDocument
            registration={registration}
            qrCodeUrl=""
            withHeader={withHeader}
            attachments={attachments}
            sections={sections}
            extraDocUrl={extraDocUrl}
            overrides={overrides}
          />
        ).toBlob();

        let finalBlob = reactPdfBlob;

        // If the extra document is a PDF, we must merge it using pdf-lib
        if (extraDocUrl && extraDocUrl.toLowerCase().endsWith(".pdf")) {
          const { PDFDocument } = await import("pdf-lib");
          
          const basePdfBuf = await reactPdfBlob.arrayBuffer();
          const pdfDoc = await PDFDocument.load(basePdfBuf);
          
          try {
            const externalRes = await fetch(extraDocUrl);
            const externalBuf = await externalRes.arrayBuffer();
            const externalDoc = await PDFDocument.load(externalBuf);
            
            const copiedPages = await pdfDoc.copyPages(externalDoc, externalDoc.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
            
            const mergedPdfBytes = await pdfDoc.save();
            finalBlob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: "application/pdf" });
          } catch (mergeErr) {
            console.error("Failed to merge external PDF", mergeErr);
            // Fall back to unmerged blob if there's a CORS issue fetching external PDF
          }
        }

        const url = URL.createObjectURL(finalBlob);
        setPdfUrl(url);
      } catch (err: any) {
        console.error("Failed to generate PDF:", err);
        setError(err?.message || "Unknown error");
      }
    }

    generatePdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [registration, withHeader, attachments, sections, extraDocUrl, overrides]);

  if (error) {
    return (
      <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center", fontFamily: "sans-serif", color: "red", padding: 40, flexDirection: "column" }}>
        <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>PDF Generation Failed</div>
        <div style={{ fontSize: 14, color: "#555" }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          title="Registration PDF"
          style={{ border: "none" }}
        />
      ) : (
        <div style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center", fontFamily: "sans-serif", flexDirection: "column", gap: 12 }}>
          <div style={{ width: 48, height: 48, border: "4px solid #006666", borderTop: "4px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ color: "#555" }}>Generating Registration PDF...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
