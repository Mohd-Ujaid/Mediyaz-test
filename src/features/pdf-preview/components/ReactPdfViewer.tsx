"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// Configure pdfjs worker with local worker file and robust fallback
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface ReactPdfViewerProps {
  pdfBlob?: Blob | null;
  pdfUrl?: string | null;
  title?: string;
  fileName?: string;
  onBack?: () => void;
  embedded?: boolean;
}

export default function ReactPdfViewer({
  pdfBlob,
  pdfUrl,
  title = "PDF Document",
  fileName = "document.pdf",
  onBack,
  embedded = false,
}: ReactPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [canShare, setCanShare] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set mounted and measure container width safely on client
  useEffect(() => {
    setMounted(true);

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || window.innerWidth);
      } else if (typeof window !== "undefined") {
        setContainerWidth(window.innerWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    if (navigator.canShare && pdfBlob) {
      try {
        const testFile = new File([pdfBlob], fileName, {
          type: "application/pdf",
        });
        setCanShare(navigator.canShare({ files: [testFile] }));
      } catch {
        setCanShare(false);
      }
    }

    return () => window.removeEventListener("resize", updateWidth);
  }, [pdfBlob, fileName]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setErrorMsg(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("react-pdf Document load error:", err);
    setErrorMsg(err.message || "Failed to load PDF document");
  };

  const handleDownload = useCallback(() => {
    if (!pdfUrl && !pdfBlob) return;
    const downloadUrl = pdfUrl || (pdfBlob ? URL.createObjectURL(pdfBlob) : null);
    if (!downloadUrl) return;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfUrl, pdfBlob, fileName]);

  const handlePrint = useCallback(() => {
    const isMobile =
      typeof window !== "undefined" &&
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      window.print();
      return;
    }

    if (!pdfUrl && !pdfBlob) {
      window.print();
      return;
    }

    const printUrl = pdfUrl || (pdfBlob ? URL.createObjectURL(pdfBlob) : null);
    if (!printUrl) {
      window.print();
      return;
    }

    try {
      const existingIframe = document.getElementById("print-pdf-hidden-iframe");
      if (existingIframe) {
        existingIframe.remove();
      }
      const iframe = document.createElement("iframe");
      iframe.id = "print-pdf-hidden-iframe";
      iframe.style.position = "fixed";
      iframe.style.top = "-9999px";
      iframe.style.left = "-9999px";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.border = "none";
      iframe.style.opacity = "0";
      iframe.src = printUrl;

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
      };

      document.body.appendChild(iframe);
    } catch {
      window.print();
    }
  }, [pdfUrl, pdfBlob]);

  const handleShare = useCallback(async () => {
    if (!pdfBlob) {
      handleDownload();
      return;
    }
    try {
      const file = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `Viewing ${title}`,
        });
      } else {
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        handleDownload();
      }
    }
  }, [pdfBlob, fileName, title, handleDownload]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.close();
      }
    }
  }, [onBack]);

  // Source to pass to react-pdf Document (prefer URL string for stability and performance)
  const documentSource = pdfUrl || (pdfBlob ? URL.createObjectURL(pdfBlob) : null);

  // Calculate width to fit screen with padding, max 840px for comfortable reading
  const pageWidth = Math.min(Math.max(containerWidth - 32, 280), 840);

  // Guard against SSR hydration mismatches
  if (!mounted) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${
          embedded
            ? "w-full h-full min-h-[300px] bg-slate-50 dark:bg-slate-900 rounded-xl"
            : "w-screen h-screen bg-slate-50"
        } gap-3 select-none`}
      >
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Preparing PDF viewer...</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden select-none ${
        embedded
          ? "w-full h-full bg-slate-50 dark:bg-slate-900 rounded-xl"
          : "w-screen h-screen bg-slate-100"
      }`}
    >
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
          }
          .no-print, header, nav, button, .page-indicator {
            display: none !important;
          }
          /* Reset ancestor containers so print doesn't clip */
          div, main, section {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .pdf-page-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: white !important;
          }
          .react-pdf__Page {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: white !important;
            width: 100% !important;
          }
          .react-pdf__Page__canvas {
            display: block !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* Top Application Bar - hidden when embedded inside an existing modal/dialog */}
      {!embedded && (
        <header className="no-print flex items-center justify-between px-3 sm:px-4 py-2 bg-white border-b border-slate-200 shadow-xs z-20 shrink-0 gap-2">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleBack}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 shrink-0"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Back</span>
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              <FileText className="w-4 h-4 text-teal-600 shrink-0" />
              <h1 className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                {title}
              </h1>
              {numPages > 0 && (
                <span className="hidden xs:inline-flex text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
                  {numPages} {numPages === 1 ? "page" : "pages"}
                </span>
              )}
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-slate-700">
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
                disabled={zoom <= 0.5}
                className="p-1 hover:bg-white rounded transition-colors disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-medium px-1 min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
                disabled={zoom >= 2.5}
                className="p-1 hover:bg-white rounded transition-colors disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1 hover:bg-white rounded transition-colors text-[10px] font-medium px-1.5"
                title="Fit to Screen"
              >
                Fit
              </button>
            </div>

            {/* Share Button (Mobile/Supported) */}
            {canShare && (
              <button
                onClick={handleShare}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1 transition-colors"
                title="Share PDF"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              title="Download PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-900 active:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              title="Print PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Print</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area - Scrollable PDF Pages */}
      <main
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden relative"
      >
        <div className="w-full min-h-full flex flex-col items-center py-4 px-2 sm:px-4">
          {documentSource ? (
            <Document
              file={documentSource}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center my-auto py-20 gap-3">
                  <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-600">
                    Loading PDF pages...
                  </p>
                </div>
              }
              error={
                <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center my-auto">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Failed to Preview PDF
                  </h3>
                  <p className="text-xs text-slate-500 mb-5">
                    {errorMsg || "The document could not be rendered directly. Tap below to download or open."}
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleDownload}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download {fileName}
                    </button>
                    {pdfUrl && (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" /> Open in New Tab
                      </a>
                    )}
                  </div>
                </div>
              }
              className="flex flex-col items-center"
            >
              {Array.from({ length: numPages }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <div
                    key={`page_container_${pageNumber}`}
                    className="pdf-page-card flex flex-col items-center my-3 sm:my-4 transition-all"
                  >
                    <div className="relative rounded-none shadow-md overflow-hidden bg-white border border-slate-300">
                      <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        scale={zoom}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="rounded-none"
                        loading={
                          <div
                            style={{
                              width: `${pageWidth * zoom}px`,
                              height: `${pageWidth * 1.414 * zoom}px`,
                            }}
                            className="flex items-center justify-center bg-white rounded-none"
                          >
                            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                          </div>
                        }
                      />
                    </div>
                    <div className="no-print page-indicator mt-1.5 text-[11px] font-medium text-slate-500 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs">
                      Page {pageNumber} of {numPages}
                    </div>
                  </div>
                );
              })}
            </Document>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              No document provided.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
