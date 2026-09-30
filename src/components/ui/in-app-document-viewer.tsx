"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Dialog, DialogPortal, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Move,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Check,
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ReactPdfViewer = dynamic(
  () => import("@/features/pdf-preview/components/ReactPdfViewer"),
  { ssr: false }
);

export interface VerificationData {
  fullName?: string;
  husbandName?: string;
  aadhaarNumber?: string;
  dateOfBirth?: string;
  age?: string | number;
  address?: string;
  mobile?: string;
}

interface InAppDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string | null;
  fileName?: string;
  donorName?: string;
  donorId?: string;
  verificationData?: VerificationData;
}

export function InAppDocumentViewer({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileName,
  donorName,
  donorId,
  verificationData,
}: InAppDocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Movable / Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

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

  // Reset state and window position on open or URL change
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setHasError(false);
      setZoomLevel(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsMaximized(false);
    }
  }, [isOpen, fileUrl]);

  // Window drag handlers (desktop mouse + touch screen)
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, select")) return;
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, select")) return;
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragStartRef.current.mouseX;
      const dy = e.touches[0].clientY - dragStartRef.current.mouseY;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    };

    const handleDragEnd = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging]);

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
      <DialogPortal>
        {/* Completely transparent, zero-blur, non-blocking backdrop so underlying detail view is 100% crisp & legible */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 isolate z-50 bg-transparent pointer-events-none"
        />

        {/* Movable floating dialog popup */}
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          style={{
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
          }}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex flex-col rounded-3xl bg-background border border-slate-200 dark:border-slate-800 shadow-2xl outline-none duration-75 overflow-hidden pointer-events-auto",
            isMaximized
              ? "w-[96vw] max-w-6xl h-[92vh]"
              : isImage
              ? "w-[94vw] sm:w-[560px] max-h-[84vh] h-auto"
              : "w-[94vw] sm:w-[860px] h-[86vh]"
          )}
        >
          {/* Header Bar - Draggable handle */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={cn(
              "p-3 sm:p-3.5 px-4 sm:px-5 border-b flex flex-wrap items-center justify-between gap-2.5 bg-muted/30 shrink-0 select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            title="Click and drag to move window anywhere on screen"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0" title="Draggable window">
                <Move className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 truncate">
                  <span className="truncate">{title}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border uppercase shrink-0">
                    {isPdf ? "PDF" : "Image"}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.2 truncate">
                  {donorName ? `Donor: ${donorName}` : "Clinical & Legal Document"}
                  {donorId ? ` • ID: ${donorId}` : ""}
                </DialogDescription>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {isImage && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 mr-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleZoomIn}
                    className="h-6 w-6 p-0 rounded text-slate-600 dark:text-slate-300"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleZoomOut}
                    className="h-6 w-6 p-0 rounded text-slate-600 dark:text-slate-300"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRotate}
                    className="h-6 w-6 p-0 rounded text-slate-600 dark:text-slate-300"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3 h-3" />
                  </Button>
                  {(zoomLevel !== 1 || rotation !== 0) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleResetZoom}
                      className="h-6 px-1.5 text-[9px] font-semibold text-rose-600"
                      title="Reset Zoom"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              )}

              {/* Maximize / Restore Toggle */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMaximized(!isMaximized)}
                className="h-7 w-7 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={isMaximized ? "Restore compact size" : "Maximize view"}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="h-7 px-2 rounded-lg text-[11px] gap-1 shadow-2xs text-slate-700 dark:text-slate-200 border-slate-200 hover:bg-slate-100"
                title="Print document"
              >
                <Printer className="w-3 h-3 text-rose-600" />
                <span className="hidden sm:inline">Print</span>
              </Button>

              <a href={downloadUrl} download={resolvedName} className="no-underline">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 rounded-lg text-[11px] gap-1 shadow-2xs text-slate-700 dark:text-slate-200 border-slate-200 hover:bg-slate-100"
                  title="Download file"
                >
                  <Download className="w-3 h-3 text-teal-600" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </a>

              <a
                href={internalProxyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
                title="Open full page"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 rounded-lg text-[11px] gap-1 shadow-2xs text-slate-700 dark:text-slate-200 border-slate-200 hover:bg-slate-100"
                >
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                </Button>
              </a>

              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ml-0.5"
                title="Close viewer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Viewport */}
          <div
            className={cn(
              "w-full bg-slate-100/60 dark:bg-slate-950/60 overflow-hidden relative flex items-center justify-center p-2 sm:p-3",
              isMaximized
                ? "flex-1 h-full min-h-[500px]"
                : isImage
                ? "max-h-[55vh] min-h-[260px] sm:min-h-[300px]"
                : "flex-1 h-full min-h-[450px]"
            )}
          >
            {loading && !hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 backdrop-blur-2xs z-20">
                <Loader2 className="w-7 h-7 animate-spin text-rose-600" />
                <p className="text-xs font-semibold text-muted-foreground">Loading preview...</p>
              </div>
            )}

            {hasError && (
              <div className="flex flex-col items-center justify-center gap-3 p-5 text-center max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-red-200 shadow-xs z-10">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Unable to display document</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    The file can still be downloaded or opened directly in a new tab.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
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
                    className="rounded-lg text-xs gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </Button>
                  <a href={downloadUrl} download={resolvedName}>
                    <Button size="sm" className="rounded-lg text-xs gap-1 bg-rose-600 hover:bg-rose-700 text-white">
                      <Download className="w-3 h-3" /> Download
                    </Button>
                  </a>
                </div>
              </div>
            )}

            {isPdf ? (
              <div className="w-full h-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <ReactPdfViewer
                  pdfUrl={internalProxyUrl}
                  title={title}
                  fileName={resolvedName}
                  embedded={true}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2 select-none">
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
                    transition: "transform 0.15s ease-in-out",
                  }}
                  className="max-w-full max-h-[50vh] object-contain rounded-xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 pointer-events-auto"
                />
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
