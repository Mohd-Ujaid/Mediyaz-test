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
  affidavitType?: string;
}

export default function PrintViewer({
  registration,
  withHeader,
  attachments,
  sections,
  extraDocUrl,
  overrides,
  affidavitType,
}: PrintViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generatePdf() {
      try {
        const uploadedAffidavitUrl =
          registration?.documents?.affidavit?.url || registration?.affidavit?.url;
        const isAffidavitPdf = Boolean(
          uploadedAffidavitUrl &&
            (uploadedAffidavitUrl.toLowerCase().includes(".pdf") ||
              uploadedAffidavitUrl.toLowerCase().startsWith("data:application/pdf"))
        );
        const shouldIncludeAffidavit =
          !sections ||
          sections.length === 0 ||
          sections.includes("affidavit") ||
          sections.includes("egg_affidavit");
        const shouldPrintUploadedAffidavit =
          Boolean(uploadedAffidavitUrl) && affidavitType !== "template";

        const isOnlyAffidavit =
          sections &&
          sections.length === 1 &&
          (sections[0] === "affidavit" || sections[0] === "egg_affidavit");

        // Fast path: if ONLY affidavit is selected, and it's an uploaded PDF, and user chose uploaded
        if (
          isOnlyAffidavit &&
          shouldPrintUploadedAffidavit &&
          isAffidavitPdf &&
          affidavitType === "uploaded"
        ) {
          try {
            const externalRes = await fetch(uploadedAffidavitUrl);
            const externalBlob = await externalRes.blob();
            const finalPdfBlob = new Blob([externalBlob], { type: "application/pdf" });
            const url = URL.createObjectURL(finalPdfBlob);
            setPdfUrl(url);
            return;
          } catch (directErr) {
            console.warn("Direct fetch of affidavit PDF failed, falling back to generator:", directErr);
          }
        }

        const reactPdfBlob = await pdf(
          <PrintableRegistrationDocument
            registration={registration}
            qrCodeUrl=""
            withHeader={withHeader}
            attachments={attachments}
            sections={sections}
            extraDocUrl={extraDocUrl}
            overrides={overrides}
            affidavitType={affidavitType}
          />
        ).toBlob();

        let finalBlob = reactPdfBlob;

        // If affidavit was selected, is an uploaded PDF, and not purely template:
        // merge the uploaded affidavit PDF into the document stream
        if (shouldIncludeAffidavit && shouldPrintUploadedAffidavit && isAffidavitPdf) {
          try {
            const { PDFDocument } = await import("pdf-lib");
            const basePdfBuf = await finalBlob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(basePdfBuf);

            const affRes = await fetch(uploadedAffidavitUrl);
            const affBuf = await affRes.arrayBuffer();
            const affDoc = await PDFDocument.load(affBuf);

            const copiedPages = await pdfDoc.copyPages(affDoc, affDoc.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));

            const mergedPdfBytes = await pdfDoc.save();
            finalBlob = new Blob([mergedPdfBytes as unknown as BlobPart], {
              type: "application/pdf",
            });
          } catch (mergeAffErr) {
            console.error("Failed to merge uploaded affidavit PDF:", mergeAffErr);
          }
        }

        // If the extra document is a PDF, we must merge it using pdf-lib
        if (extraDocUrl && extraDocUrl.toLowerCase().endsWith(".pdf")) {
          const { PDFDocument } = await import("pdf-lib");
          
          const basePdfBuf = await finalBlob.arrayBuffer();
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
  }, [registration, withHeader, attachments, sections, extraDocUrl, overrides, affidavitType]);

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
