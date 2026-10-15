/* eslint-disable jsx-a11y/alt-text */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { pdf } from "@react-pdf/renderer";
import PrintableRegistrationDocument from "@/features/pdf-generator/components/PrintableRegistration";
import { AlertCircle, RefreshCw, Download, FileText } from "lucide-react";

const ReactPdfViewer = dynamic(() => import("./ReactPdfViewer"), {
  ssr: false,
});

interface PrintViewerProps {
  registration: any;
  withHeader: boolean;
  attachments: string[];
  sections?: string[];
  extraDocUrl?: string;
  overrides?: Record<string, any>;
  affidavitType?: string;
}

/**
 * Checks whether an image URL is accessible and is a real image.
 * Prevents @react-pdf/renderer from hanging or throwing "Not valid image extension"
 * when ImageKit/S3 returns a 404 HTML error page or broken URL.
 */
async function isImageAccessible(url: string): Promise<boolean> {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("data:image/")) return true;
  // If it's a PDF, it's not a valid image format for @react-pdf Image
  if (url.toLowerCase().includes(".pdf")) return false;

  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(true);
      return;
    }
    const img = new window.Image();
    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      resolve(false);
    }, 2500);

    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    try {
      img.crossOrigin = "anonymous";
      img.src = url;
    } catch {
      clearTimeout(timer);
      resolve(false);
    }
  });
}

/**
 * Clones the registration object and strips broken / 404 images
 * so @react-pdf/renderer renders text fallbacks cleanly without hanging.
 */
async function sanitizeRegistrationImages(reg: any): Promise<any> {
  if (!reg) return reg;
  const cloned = JSON.parse(JSON.stringify(reg));
  if (!cloned.documents) return cloned;

  const checkKeys = ["passportPhoto", "aadhaarFront", "aadhaarBack", "signature"];
  await Promise.all(
    checkKeys.map(async (key) => {
      const doc = cloned.documents[key];
      if (doc?.url) {
        const isOk = await isImageAccessible(doc.url);
        if (!isOk) {
          console.warn(`[PrintViewer] Image for "${key}" is unreachable or invalid (404/CORS). Using fallback text in PDF.`);
          cloned.documents[key] = null;
        }
      }
    })
  );

  return cloned;
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
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);

  const isOnlyAffidavit =
    sections &&
    sections.length === 1 &&
    (sections[0] === "affidavit" || sections[0] === "egg_affidavit");

  const isEgg =
    registration?.donorType === "egg" ||
    registration?.registrationId?.startsWith("MED-ED") ||
    registration?.registrationId?.startsWith("EGG-");

  const docTitle = isOnlyAffidavit
    ? isEgg
      ? "Affidavit of Oocyte Donor"
      : "Affidavit of Sperm Donor"
    : isEgg
    ? "Egg Donor Registration Form"
    : "Sperm Donor Registration Form";

  const filePrefix = isOnlyAffidavit ? "Affidavit" : "Registration";
  const regId = registration?.registrationId || registration?.fileNumber || registration?._id || "Donor";
  const fileName = `${regId}_${filePrefix}.pdf`;

  // Memoize stable signature to avoid re-triggering on object prop reference changes
  const serializedKey = useMemo(
    () =>
      JSON.stringify({
        id: registration?._id || registration?.registrationId,
        withHeader,
        attachments: (attachments || []).slice().sort(),
        sections: (sections || []).slice().sort(),
        extraDocUrl,
        affidavitType,
        retryCount,
      }),
    [registration?._id, registration?.registrationId, withHeader, attachments, sections, extraDocUrl, affidavitType, retryCount]
  );

  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    async function generatePdf() {
      setIsGenerating(true);
      setError(null);

      try {
        const uploadedAffidavitUrl =
          registration?.documents?.affidavit?.url ||
          registration?.documents?.affidavitDoc?.url ||
          registration?.affidavit?.url;

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

        const isOnlyAffidavitLocal =
          sections &&
          sections.length === 1 &&
          (sections[0] === "affidavit" || sections[0] === "egg_affidavit");

        // Fast path: if ONLY affidavit is selected, and it's an uploaded PDF, and user chose uploaded
        if (
          isOnlyAffidavitLocal &&
          shouldPrintUploadedAffidavit &&
          isAffidavitPdf &&
          affidavitType === "uploaded"
        ) {
          try {
            const externalRes = await fetch(uploadedAffidavitUrl);
            if (externalRes.ok) {
              const externalBlob = await externalRes.blob();
              const finalPdfBlob = new Blob([externalBlob], { type: "application/pdf" });
              createdBlobUrl = URL.createObjectURL(finalPdfBlob);
              if (active) {
                setPdfBlob(finalPdfBlob);
                setPdfUrl(createdBlobUrl);
                setIsGenerating(false);
              }
              return;
            }
          } catch (directErr) {
            console.warn("Direct fetch of affidavit PDF failed, falling back to generator:", directErr);
          }
        }

        // 1. Sanitize images in registration so broken/404 images do NOT freeze @react-pdf/renderer
        const safeRegistration = await sanitizeRegistrationImages(registration);

        if (!active) return;

        // 2. Wrap react-pdf toBlob with a 15-second safety timeout
        const pdfGenerationPromise = pdf(
          <PrintableRegistrationDocument
            registration={safeRegistration}
            qrCodeUrl=""
            withHeader={withHeader}
            attachments={attachments}
            sections={sections}
            extraDocUrl={extraDocUrl}
            overrides={overrides}
            affidavitType={affidavitType}
          />
        ).toBlob();

        const timeoutPromise = new Promise<Blob>((_, reject) =>
          setTimeout(
            () => reject(new Error("Document generation timed out. Click Retry or use Direct Download.")),
            15000
          )
        );

        const reactPdfBlob = await Promise.race([pdfGenerationPromise, timeoutPromise]);
        let finalBlob = reactPdfBlob;

        // 3. If affidavit was selected, is an uploaded PDF, and not purely template:
        // merge the uploaded affidavit PDF into the document stream
        if (shouldIncludeAffidavit && shouldPrintUploadedAffidavit && isAffidavitPdf) {
          try {
            const affRes = await fetch(uploadedAffidavitUrl);
            if (affRes.ok) {
              const { PDFDocument } = await import("pdf-lib");
              const basePdfBuf = await finalBlob.arrayBuffer();
              const pdfDoc = await PDFDocument.load(basePdfBuf);

              const affBuf = await affRes.arrayBuffer();
              const affDoc = await PDFDocument.load(affBuf);

              const copiedPages = await pdfDoc.copyPages(affDoc, affDoc.getPageIndices());
              copiedPages.forEach((page) => pdfDoc.addPage(page));

              const mergedPdfBytes = await pdfDoc.save();
              finalBlob = new Blob([mergedPdfBytes as unknown as BlobPart], {
                type: "application/pdf",
              });
            } else {
              console.warn("Uploaded affidavit returned non-200 response:", affRes.status);
            }
          } catch (mergeAffErr) {
            console.error("Failed to merge uploaded affidavit PDF:", mergeAffErr);
          }
        }

        // 4. If the extra document is a PDF, merge it using pdf-lib
        if (extraDocUrl && extraDocUrl.toLowerCase().endsWith(".pdf")) {
          try {
            const externalRes = await fetch(extraDocUrl);
            if (externalRes.ok) {
              const { PDFDocument } = await import("pdf-lib");
              const basePdfBuf = await finalBlob.arrayBuffer();
              const pdfDoc = await PDFDocument.load(basePdfBuf);

              const externalBuf = await externalRes.arrayBuffer();
              const externalDoc = await PDFDocument.load(externalBuf);

              const copiedPages = await pdfDoc.copyPages(externalDoc, externalDoc.getPageIndices());
              copiedPages.forEach((page) => pdfDoc.addPage(page));

              const mergedPdfBytes = await pdfDoc.save();
              finalBlob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: "application/pdf" });
            }
          } catch (mergeErr) {
            console.error("Failed to merge external PDF:", mergeErr);
          }
        }

        if (!active) return;

        createdBlobUrl = URL.createObjectURL(finalBlob);
        setPdfBlob(finalBlob);
        setPdfUrl(createdBlobUrl);
        setIsGenerating(false);
      } catch (err: any) {
        console.error("Failed to generate PDF:", err);
        if (active) {
          setError(err?.message || "Unknown error generating document");
          setIsGenerating(false);
        }
      }
    }

    generatePdf();

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [serializedKey]);

  if (error) {
    const serverPdfUrl = `/api/donor-registration/${registration?.registrationId || registration?._id}/pdf/initial`;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">PDF Generation Issue</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error}
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry Document Generation
            </button>
            <a
              href={serverPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors"
            >
              <FileText className="w-4 h-4" /> Open via Server Engine
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (pdfUrl && !isGenerating) {
    return (
      <ReactPdfViewer
        pdfBlob={pdfBlob}
        pdfUrl={pdfUrl}
        title={docTitle}
        fileName={fileName}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen justify-center items-center font-sans gap-3.5 bg-slate-50">
      <div className="w-11 h-11 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
        <div className="text-slate-800 font-semibold text-sm">Preparing Document</div>
        <div className="text-slate-500 text-xs mt-1">Generating {docTitle}...</div>
      </div>
    </div>
  );
}
