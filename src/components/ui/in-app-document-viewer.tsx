"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Printer,
  X,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import dynamic from "next/dynamic";

const ReactPdfViewer = dynamic(
  () => import("@/features/pdf-preview/components/ReactPdfViewer"),
  { ssr: false }
);

interface InAppDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string | null;
  fileName?: string;
  donorName?: string;
  donorId?: string;
}

export function InAppDocumentViewer({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileName,
  donorName,
  donorId,
}: InAppDocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      setIsMobile(
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) ||
        window.innerWidth < 768
      );
    }
  }, []);

  // Reset state on open or URL change
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setHasError(false);
      setZoomLevel(1);
      setRotation(0);
    }
  }, [isOpen, fileUrl]);

  if (!fileUrl) return null;

  // Accurate file type determination
  const cleanUrl = fileUrl.split("?")[0].toLowerCase();
  const rawFileName = (fileName || "").toLowerCase();

  const isImage =
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg") ||
    cleanUrl.endsWith(".png") ||
    cleanUrl.endsWith(".webp") ||
    cleanUrl.endsWith(".gif") ||
    cleanUrl.endsWith(".svg") ||
    rawFileName.endsWith(".jpg") ||
    rawFileName.endsWith(".jpeg") ||
    rawFileName.endsWith(".png") ||
    rawFileName.endsWith(".webp");

  const isPdf = !isImage;

  const defaultExt = isImage ? ".jpg" : ".pdf";
  const resolvedName = fileName || (title.toLowerCase().replace(/[^a-z0-9]/g, "-") + defaultExt);

  // Use internal website proxy so the user never visits external ImageKit CDN
  const internalProxyUrl = `/api/view-file?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(resolvedName)}`;
  const downloadUrl = `/api/view-file?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(resolvedName)}&download=1`;

  const handlePrint = () => {
    if (isImage) {
      const printWin = window.open("", "_blank", "width=800,height=900");
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
                img { max-width: 95%; max-height: 95vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${internalProxyUrl}" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        printWin.document.close();
      }
      return;
    }

    // PDF Print: print iframe content directly
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      } catch (err) {
        console.warn("Direct iframe print failed, falling back:", err);
      }
    }

    // Fallback: open clean internal proxy window
    const printWin = window.open(internalProxyUrl, "_blank");
    if (printWin) {
      printWin.onload = () => {
        printWin.focus();
        printWin.print();
      };
    }
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-6xl w-[96vw] h-[92vh] p-0 flex flex-col rounded-3xl overflow-hidden border shadow-2xl bg-background"
      >
        {/* Header Bar */}
        <div className="p-3.5 px-6 border-b flex flex-wrap items-center justify-between gap-3 bg-muted/25 shrink-0 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-100 dark:border-rose-900 shrink-0">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 truncate">
                <span className="truncate">{title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border uppercase shrink-0">
                  {isPdf ? "PDF Document" : "Image Preview"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                {donorName ? `Donor: ${donorName}` : "Clinical & Legal Document File"}
                {donorId ? ` • ID: ${donorId}` : ""} • In-Website Secure Viewer
              </DialogDescription>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {isImage && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 mr-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomIn}
                  className="h-7 w-7 p-0 rounded-lg text-slate-600 dark:text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleZoomOut}
                  className="h-7 w-7 p-0 rounded-lg text-slate-600 dark:text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRotate}
                  className="h-7 w-7 p-0 rounded-lg text-slate-600 dark:text-slate-300"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
                {(zoomLevel !== 1 || rotation !== 0) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResetZoom}
                    className="h-7 px-2 text-[10px] font-semibold text-rose-600"
                    title="Reset Zoom"
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="h-8 rounded-xl text-xs gap-1.5 shadow-xs text-slate-700 dark:text-slate-200 border-slate-200 hover:bg-slate-100 cursor-pointer"
              title="Print document directly"
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <a href={downloadUrl} download={resolvedName} className="no-underline">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-xl text-xs gap-1.5 shadow-xs text-slate-700 dark:text-slate-200 border-slate-200 hover:bg-slate-100 cursor-pointer"
                title="Download document to device"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </a>

            <a
              href={internalProxyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
              title="Open full page in website"
            >
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-xl text-xs gap-1.5 shadow-xs text-slate-700 dark:text-slate-200 border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Full Tab</span>
              </Button>
            </a>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ml-1"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 w-full h-full bg-slate-100/60 dark:bg-slate-950/60 overflow-hidden relative flex items-center justify-center p-2 sm:p-4">
          {loading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-background/85 backdrop-blur-xs z-20">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
              <p className="text-xs font-semibold text-muted-foreground">Loading document securely...</p>
            </div>
          )}

          {hasError && (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-red-200 shadow-sm z-10">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unable to display document</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  The document stream could not be displayed directly. You can download it or open it via website tab.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setHasError(false);
                    setLoading(true);
                    if (iframeRef.current) {
                      iframeRef.current.src = internalProxyUrl;
                    }
                  }}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
                <a href={downloadUrl} download={resolvedName}>
                  <Button size="sm" className="rounded-xl text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white">
                    <Download className="w-3.5 h-3.5" /> Download File
                  </Button>
                </a>
              </div>
            </div>
          )}

          {isPdf ? (
            <div className="w-full h-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <ReactPdfViewer
                pdfUrl={internalProxyUrl}
                title={title}
                fileName={resolvedName}
                embedded={true}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4 select-none">
              <img
                src={internalProxyUrl}
                alt={title}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease-in-out",
                }}
                className="max-w-full max-h-full object-contain rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 pointer-events-auto"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
