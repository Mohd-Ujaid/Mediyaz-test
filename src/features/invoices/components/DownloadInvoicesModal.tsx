"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Calendar,
  Building2,
  Receipt,
  FileCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileArchive,
} from "lucide-react";
import JSZip from "jszip";
import { pdf } from "@react-pdf/renderer";
import CompletedFileInvoicePdfDocument, {
  CompletedFileInvoiceData,
} from "@/features/pdf-generator/invoice/CompletedFileInvoicePdfDocument";
import { formatDotDate } from "@/lib/invoice-utils";
import { toast } from "sonner";

export const MONTH_NAMES = [
  { value: "ALL", label: "All Months (Entire Year)" },
  { value: "1", label: "January (01)" },
  { value: "2", label: "February (02)" },
  { value: "3", label: "March (03)" },
  { value: "4", label: "April (04)" },
  { value: "5", label: "May (05)" },
  { value: "6", label: "June (06)" },
  { value: "7", label: "July (07)" },
  { value: "8", label: "August (08)" },
  { value: "9", label: "September (09)" },
  { value: "10", label: "October (10)" },
  { value: "11", label: "November (11)" },
  { value: "12", label: "December (12)" },
];

interface DownloadInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableYears: number[];
  clinicBreakdown: any[];
  convertInvoiceToPdfData: (inv: any) => CompletedFileInvoiceData;
  initialYear?: string;
  initialMonth?: string;
}

export function DownloadInvoicesModal({
  isOpen,
  onClose,
  availableYears,
  clinicBreakdown,
  convertInvoiceToPdfData,
  initialYear = "2026",
  initialMonth = "ALL",
}: DownloadInvoicesModalProps) {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(
    initialYear !== "ALL" ? initialYear : currentYear
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("ALL");

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [matchingInvoices, setMatchingInvoices] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentName?: string;
  } | null>(null);

  // Filter clinics with invoice only
  const withInvoiceClinics = useMemo(
    () => clinicBreakdown.filter((c) => c.wantInvoice !== false),
    [clinicBreakdown]
  );

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialYear && initialYear !== "ALL") {
        setSelectedYear(initialYear);
      } else {
        setSelectedYear(availableYears[0]?.toString() || currentYear);
      }
      setSelectedMonth(initialMonth || "ALL");
      setDownloadProgress(null);
      setIsDownloading(false);
    }
  }, [isOpen, initialYear, initialMonth, availableYears, currentYear]);

  // Fetch matching invoiced records whenever year, month or clinic changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchMatching() {
      setIsLoadingList(true);
      try {
        const params = new URLSearchParams();
        if (selectedYear && selectedYear !== "ALL") params.append("year", selectedYear);
        if (selectedMonth && selectedMonth !== "ALL") params.append("month", selectedMonth);
        if (selectedHospitalId && selectedHospitalId !== "ALL") {
          params.append("hospitalId", selectedHospitalId);
        }
        params.append("clinicInvoiceType", "WITH_INVOICE");
        params.append("mode", "INVOICED"); // only invoiced items
        params.append("limit", "500"); // fetch up to 500 items

        const res = await fetch(`/api/invoices?${params.toString()}`);
        const data = await res.json();
        if (isMounted && data.success) {
          const list = (data.allMatchingInvoices || data.invoices || []).filter(
            (i: any) => i.hasInvoice || Boolean(i.invoiceNumber)
          );
          setMatchingInvoices(list);
        }
      } catch (err) {
        console.error("Failed to fetch matching invoices:", err);
      } finally {
        if (isMounted) setIsLoadingList(false);
      }
    }

    fetchMatching();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedYear, selectedMonth, selectedHospitalId]);

  // Summary statistics
  const totalAmount = useMemo(() => {
    return matchingInvoices.reduce((sum, i) => sum + (Number(i.dealPrice) || 0), 0);
  }, [matchingInvoices]);

  const monthLabel = useMemo(() => {
    const found = MONTH_NAMES.find((m) => m.value === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [selectedMonth]);

  // Execute bulk download as ZIP
  const handleStartDownload = async () => {
    if (matchingInvoices.length === 0) {
      toast.error("No generated invoices found for the selected period.");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: matchingInvoices.length, currentName: "Starting..." });

    try {
      const zip = new JSZip();

      for (let i = 0; i < matchingInvoices.length; i++) {
        const item = matchingInvoices[i];
        const donorName = item.donorName || "Donor";
        const invNo = item.invoiceNumber || item.registrationId || `INV-${i + 1}`;

        setDownloadProgress({
          current: i + 1,
          total: matchingInvoices.length,
          currentName: `Invoice #${invNo} (${donorName})`,
        });

        const pdfData = convertInvoiceToPdfData(item);
        const blob = await pdf(<CompletedFileInvoicePdfDocument invoice={pdfData} />).toBlob();

        const safeClinicName = (item.assignedHospital?.shortName || item.assignedHospital?.name || "Clinic")
          .replace(/[^a-zA-Z0-9]/g, "_")
          .slice(0, 20);
        const safeDonorName = donorName.replace(/[^a-zA-Z0-9]/g, "_");
        const safeInvNum = String(invNo).replace(/[^a-zA-Z0-9_-]/g, "_");

        const fileName = `Invoice_${safeInvNum}_${safeDonorName}_${safeClinicName}.pdf`;
        zip.file(fileName, blob);
      }

      setDownloadProgress({
        current: matchingInvoices.length,
        total: matchingInvoices.length,
        currentName: "Generating ZIP file...",
      });

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const monthPart = selectedMonth === "ALL" ? "AllMonths" : `Month_${selectedMonth}`;
      const yearPart = selectedYear === "ALL" ? "AllYears" : `Year_${selectedYear}`;
      const downloadFilename = `Mediyaz_Invoices_${yearPart}_${monthPart}.zip`;

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `Successfully downloaded ${matchingInvoices.length} invoices in ${downloadFilename}!`
      );
      onClose();
    } catch (err: any) {
      console.error("Bulk invoice download error:", err);
      toast.error(err.message || "Failed to download invoices. Please try again.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isDownloading && !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FileArchive className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Download Invoices by Period (.ZIP)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Select Year and Month to download all generated tax invoices as high-quality PDFs in a single compressed ZIP archive.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Period Selection Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            {/* Year Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                Select Year
              </label>
              <select
                id="select-download-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={isDownloading}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr.toString()}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                Select Month
              </label>
              <select
                id="select-download-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={isDownloading}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clinic Filter (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                Clinic Scope
              </label>
              <select
                id="select-download-clinic"
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                disabled={isDownloading}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 truncate"
              >
                <option value="ALL">All With-Invoice Clinics ({withInvoiceClinics.length})</option>
                {withInvoiceClinics.map((c) => (
                  <option key={c.hospitalId} value={c.hospitalId}>
                    {c.hospitalName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Matching Summary Card */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-r from-indigo-50/50 to-sky-50/30 dark:from-indigo-950/20 dark:to-sky-950/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 shadow-xs">
                  {isLoadingList ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Receipt className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {isLoadingList ? "Searching records..." : `${matchingInvoices.length} Invoices Found`}
                    </span>
                    {!isLoadingList && matchingInvoices.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Ready to Export
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Period: <span className="font-semibold text-slate-700 dark:text-slate-300">{monthLabel} {selectedYear !== "ALL" ? selectedYear : ""}</span>
                    {!isLoadingList && matchingInvoices.length > 0 && (
                      <> • Total Deal Value: <span className="font-semibold text-emerald-600">₹{totalAmount.toLocaleString("en-IN")}</span></>
                    )}
                  </div>
                </div>
              </div>

              {!isLoadingList && matchingInvoices.length > 0 && (
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Output File</div>
                  <div className="text-xs font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
                    .ZIP Package
                  </div>
                </div>
              )}
            </div>

            {/* Invoices List Preview */}
            <div className="mt-3.5 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
              {isLoadingList ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-indigo-500 mb-2" />
                  Checking invoiced records for {monthLabel} {selectedYear}...
                </div>
              ) : matchingInvoices.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-1.5" />
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No generated tax invoices found for this selection
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Invoices can only be downloaded after they are generated. Pick another year/month or generate invoices for awaiting donors first.
                  </div>
                </div>
              ) : (
                matchingInvoices.map((inv, idx) => (
                  <div
                    key={inv.registrationId || idx}
                    className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                        #{inv.invoiceNumber}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inv.donorName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({inv.registrationId})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {inv.assignedHospital?.shortName || inv.assignedHospital?.name || "Clinic"}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        ₹{(inv.dealPrice || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Download Progress Bar */}
          {isDownloading && downloadProgress && (
            <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  {downloadProgress.currentName}
                </span>
                <span className="font-bold text-indigo-600">
                  {downloadProgress.current} / {downloadProgress.total} PDFs (
                  {Math.round((downloadProgress.current / downloadProgress.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-indigo-100 dark:bg-indigo-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 transition-all duration-200 rounded-full"
                  style={{
                    width: `${Math.round((downloadProgress.current / downloadProgress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isDownloading}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Button>

          <Button
            id="btn-confirm-download-zip"
            onClick={handleStartDownload}
            disabled={isDownloading || matchingInvoices.length === 0 || isLoadingList}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-sm"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Compiling Invoices (.ZIP)...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download {matchingInvoices.length > 0 ? `${matchingInvoices.length} Invoices (.ZIP)` : "Invoices (.ZIP)"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
