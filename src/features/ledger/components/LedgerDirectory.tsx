"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const ReactPdfViewer = dynamic(
  () => import("@/features/pdf-preview/components/ReactPdfViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-screen w-screen justify-center items-center font-sans gap-3.5 bg-slate-50 select-none">
        <div className="w-11 h-11 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <div className="text-slate-800 font-semibold text-sm">Preparing Document</div>
          <div className="text-slate-500 text-xs mt-1">Loading PDF Statement...</div>
        </div>
      </div>
    ),
  }
);
import JSZip from "jszip";
import { pdf } from "@react-pdf/renderer";
import CompletedFileInvoicePdfDocument, {
  CompletedFileInvoiceData,
} from "@/features/pdf-generator/invoice/CompletedFileInvoicePdfDocument";
import { formatDotDate, numberToWordsIndian } from "@/lib/invoice-utils";
import {
  BookOpen,
  Building2,
  Users,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  Heart,
  Dna,
  FileSpreadsheet,
  Check,
  AlertCircle,
  FileText,
  BadgeCheck,
  Percent,
  Eye,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  GitBranch,
  CalendarRange,
  Calendar,
  FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableSkeletonRows } from "@/components/ui/data-table-skeleton";

const formatInr = (amount: number) => {
  return "₹" + (amount || 0).toLocaleString("en-IN");
};

const MONTH_OPTIONS = [
  { value: "ALL", label: "All Months" },
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

function convertLedgerEntryToInvoicePdfData(entry: any): CompletedFileInvoiceData {
  const isEgg = entry.donorType !== "sperm";
  const hosp = entry.assignedHospital || {};
  const isInterState = hosp?.state && !hosp.state.toLowerCase().includes("delhi");
  const dealPrice = entry.dealPrice || entry.amount || 65000;
  const serviceCharge = entry.serviceCharge || 5000;
  const donorReimbursement = entry.donorReimbursement || Math.max(0, dealPrice - serviceCharge);

  const cgstRate = isInterState ? 0 : 9;
  const cgstAmount = isInterState ? 0 : (serviceCharge * 9) / 100;
  const sgstRate = isInterState ? 0 : 9;
  const sgstAmount = isInterState ? 0 : (serviceCharge * 9) / 100;
  const igstRate = isInterState ? 18 : 0;
  const igstAmount = isInterState ? (serviceCharge * 18) / 100 : 0;

  const totalBeforeTax = serviceCharge + donorReimbursement;
  const totalAmountAfterTax = serviceCharge + cgstAmount + sgstAmount + igstAmount + donorReimbursement;

  const hospitalAddress = hosp
    ? [
        hosp.addressLine1 || hosp.address,
        hosp.city,
        hosp.state ? `${hosp.state}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : entry.location || entry.hospitalLocation || "";

  return {
    invoiceNumber: entry.invoiceNumber || entry.registrationId?.replace(/^[A-Z]+-/, "") || "INV",
    invoiceDate: entry.invoiceDate || formatDotDate(new Date()),
    sacCode: "999317",
    gstin: "07FJBPS6601G1Z7",
    donorType: isEgg ? "egg" : "sperm",
    donorName: entry.donorName || "Donor",
    huidNo: entry.donorId || entry.registrationId || "N/A",
    hospitalName: entry.clinicName || entry.hospitalName || hosp?.name || "Partner ART Clinic",
    hospitalGstin: hosp?.gstNumber || "07AANCM1124F1ZQ",
    hospitalAddress,
    pickupDate: entry.donorOpuDate || entry.opuDate || entry.pickupDate || entry.invoiceDate || formatDotDate(new Date()),
    pickupLocation: entry.donorOpuLocation || entry.opuLocation || hospitalAddress,
    saleType: isInterState ? "INTER-STATE" : "STATE",
    serviceCharge,
    serviceChargeSac: "999321",
    donorReimbursement,
    reimbursementSac: "999317",
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalAmountBeforeTax: totalBeforeTax,
    totalAmountAfterTax,
    amountInWords: numberToWordsIndian(totalAmountAfterTax),
    beforeTaxAmountInWords: numberToWordsIndian(totalBeforeTax),
  };
}

export function LedgerDirectory() {
  const [activeTab, setActiveTab] = useState<"clinic" | "donor">("clinic");
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // ReactPdfViewer State (Identical to registration form viewer - works on both mobile and desktop)
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [pdfViewerData, setPdfViewerData] = useState<{
    title: string;
    fileName: string;
    pdfUrl: string | null;
    pdfBlob: Blob | null;
  }>({
    title: "",
    fileName: "",
    pdfUrl: null,
    pdfBlob: null,
  });
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Clinic Ledger State
  const [clinicEntries, setClinicEntries] = useState<any[]>([]);
  const [clinicTotals, setClinicTotals] = useState({
    totalRecords: 0,
    totalDealPrice: 0,
    totalReceived: 0,
    totalPending: 0,
    collectionRate: 0,
  });
  const [clinicAccounts, setClinicAccounts] = useState<any[]>([]);

  // Donor Ledger State
  const [donorEntries, setDonorEntries] = useState<any[]>([]);
  const [donorTotals, setDonorTotals] = useState({
    totalDonors: 0,
    totalCompensation: 0,
    totalPaid: 0,
    totalPending: 0,
    settlementRate: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [availableYears, setAvailableYears] = useState<number[]>([2027, 2026, 2025, 2024]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | RECEIVED/PAID | PENDING | PARTIAL
  const [donorTypeFilter, setDonorTypeFilter] = useState("all"); // all | egg | sperm
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);

  // Row selection & Bulk Invoice Download State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  // Table Density and Columns
  const [tableDensity, setTableDensity] = useState<"compact" | "comfortable">("comfortable");
  const [visibleClinicCols, setVisibleClinicCols] = useState({
    clinicName: true,
    location: true,
    opuLocation: true,
    opuDate: true,
    invoiceDate: true,
    invoiceNo: true,
    tdsGst: true,
    creditDate: true,
  });

  // Pagination State
  const [clinicPage, setClinicPage] = useState(1);
  const [clinicPageSize, setClinicPageSize] = useState(25);
  const [donorPage, setDonorPage] = useState(1);
  const [donorPageSize, setDonorPageSize] = useState(25);

  // Memoized Pagination Slices
  const totalClinicPages = Math.max(1, Math.ceil(clinicEntries.length / clinicPageSize));
  const paginatedClinicEntries = useMemo(() => {
    const start = (clinicPage - 1) * clinicPageSize;
    return clinicEntries.slice(start, start + clinicPageSize);
  }, [clinicEntries, clinicPage, clinicPageSize]);

  const totalDonorPages = Math.max(1, Math.ceil(donorEntries.length / donorPageSize));
  const paginatedDonorEntries = useMemo(() => {
    const start = (donorPage - 1) * donorPageSize;
    return donorEntries.slice(start, start + donorPageSize);
  }, [donorEntries, donorPage, donorPageSize]);

  // Page Numbers Helper
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // Computed Available Branches for cascade
  const availableBranches = useMemo(() => {
    const branchesSet = new Set<string>();
    if (selectedHospitalId && selectedHospitalId !== "ALL") {
      const selectedHosp = hospitalsList.find((h: any) => h._id === selectedHospitalId);
      if (selectedHosp?.branches && Array.isArray(selectedHosp.branches)) {
        selectedHosp.branches.forEach((b: any) => {
          const name = typeof b === "string" ? b : b.branchName || b.name;
          if (name) branchesSet.add(name);
        });
      }
    } else {
      hospitalsList.forEach((h: any) => {
        if (h?.branches && Array.isArray(h.branches)) {
          h.branches.forEach((b: any) => {
            const name = typeof b === "string" ? b : b.branchName || b.name;
            if (name) branchesSet.add(name);
          });
        }
      });
    }

    // Also include branches/locations already found in entries
    clinicEntries.forEach((entry: any) => {
      if (entry.donorOpuLocation && entry.donorOpuLocation !== "-") branchesSet.add(entry.donorOpuLocation);
      if (entry.opuLocation && entry.opuLocation !== "-") branchesSet.add(entry.opuLocation);
    });

    return Array.from(branchesSet).filter(Boolean).sort();
  }, [selectedHospitalId, hospitalsList, clinicEntries]);

  // Fetch Ledger Records
  async function loadLedgerData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
      if (selectedBranch && selectedBranch !== "ALL") params.append("branch", selectedBranch);
      if (selectedYear && selectedYear !== "ALL") params.append("year", selectedYear);
      if (selectedMonth && selectedMonth !== "ALL") params.append("month", selectedMonth);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (donorTypeFilter) params.append("donorType", donorTypeFilter);

      const res = await fetch(`/api/ledger?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (data.hospitals) {
          setHospitalsList(data.hospitals);
        }
        if (data.availableYears && data.availableYears.length > 0) {
          setAvailableYears(data.availableYears);
        }
        if (data.clinicLedger) {
          setClinicEntries(data.clinicLedger.entries || []);
          setClinicTotals(data.clinicLedger.totals || {});
          setClinicAccounts(data.clinicLedger.clinicAccounts || []);
        }
        if (data.donorLedger) {
          setDonorEntries(data.donorLedger.entries || []);
          setDonorTotals(data.donorLedger.totals || {});
        }
      } else {
        toast.error(data.error || "Failed to load ledger records");
      }
    } catch (err: any) {
      console.error("Error loading ledger:", err);
      toast.error("Network error while loading ledger data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setClinicPage(1);
    setDonorPage(1);
    loadLedgerData();
  }, [selectedHospitalId, selectedBranch, selectedYear, selectedMonth, startDate, endDate, statusFilter, donorTypeFilter]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedHospitalId, selectedBranch, selectedYear, selectedMonth, startDate, endDate, statusFilter, donorTypeFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = clinicEntries.map((i) => i._id || i.registrationId);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSelectedHospitalId("ALL");
    setSelectedBranch("ALL");
    setSelectedYear("ALL");
    setSelectedMonth("ALL");
    setStartDate("");
    setEndDate("");
    setStatusFilter("ALL");
    setDonorTypeFilter("all");
    setSearch("");
    setClinicPage(1);
    setDonorPage(1);
    setSelectedIds([]);
  };

  const hasActiveFilters = Boolean(
    selectedHospitalId !== "ALL" ||
    selectedBranch !== "ALL" ||
    selectedYear !== "ALL" ||
    selectedMonth !== "ALL" ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    statusFilter !== "ALL" ||
    donorTypeFilter !== "all" ||
    search.trim() !== ""
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClinicPage(1);
    setDonorPage(1);
    loadLedgerData();
  };

  // Bulk PDF Download Handler for Invoices in Ledger
  const handleDownloadAllPdfs = async (targetEntries?: any[]) => {
    const listToDownload = targetEntries && targetEntries.length > 0
      ? targetEntries
      : selectedIds.length > 0
      ? clinicEntries.filter((e) => selectedIds.includes(e._id || e.registrationId))
      : clinicEntries;

    if (listToDownload.length === 0) {
      toast.error("No invoices matching the current ledger filter selection to download.");
      return;
    }

    setIsDownloadingZip(true);
    setDownloadProgress({ current: 0, total: listToDownload.length });

    try {
      if (listToDownload.length === 1) {
        const inv = listToDownload[0];
        const pdfData = convertLedgerEntryToInvoicePdfData(inv);
        const blob = await pdf(<CompletedFileInvoicePdfDocument invoice={pdfData} />).toBlob();
        const safeDonor = (inv.donorName || "Donor").replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `Invoice_${inv.invoiceNumber || inv.registrationId}_${safeDonor}.pdf`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${fileName}`);
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder("Ledger_Invoices") || zip;

      for (let i = 0; i < listToDownload.length; i++) {
        const inv = listToDownload[i];
        setDownloadProgress({ current: i + 1, total: listToDownload.length });

        const pdfData = convertLedgerEntryToInvoicePdfData(inv);
        const blob = await pdf(<CompletedFileInvoicePdfDocument invoice={pdfData} />).toBlob();
        const safeDonor = (inv.donorName || "Donor").replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `Invoice_${inv.invoiceNumber || inv.registrationId}_${safeDonor}.pdf`;
        folder.file(fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const selectedHosp = clinicAccounts.find((c) => c.hospitalId === selectedHospitalId);
      const clinicName = selectedHospitalId !== "ALL"
        ? (selectedHosp?.hospitalName || "Clinic").replace(/[^a-zA-Z0-9]/g, "_")
        : "All_Clinics";
      const branchName = selectedBranch !== "ALL" ? selectedBranch.replace(/[^a-zA-Z0-9]/g, "_") : "";
      const monthName = selectedMonth !== "ALL" ? (MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label.split(" ")[0] || "Month") : "All_Months";
      const yearName = selectedYear !== "ALL" ? selectedYear : "All_Years";

      const zipFileName = `Ledger_Invoices_${clinicName}${branchName ? `_${branchName}` : ""}_${monthName}_${yearName}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success(`Downloaded all ${listToDownload.length} invoice PDFs in ${zipFileName}!`);
    } catch (err: any) {
      console.error("Bulk PDF download error:", err);
      toast.error(err.message || "Failed to download invoice PDFs");
    } finally {
      setIsDownloadingZip(false);
      setDownloadProgress(null);
    }
  };

  // BUILD PDF URL
  const buildLedgerPdfUrl = (type: "clinic" | "donor", isPreview: boolean = true) => {
    const params = new URLSearchParams();
    params.append("type", type);
    if (isPreview) params.append("preview", "true");
    if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
    if (selectedBranch && selectedBranch !== "ALL") params.append("branch", selectedBranch);
    if (selectedYear && selectedYear !== "ALL") params.append("year", selectedYear);
    if (selectedMonth && selectedMonth !== "ALL") params.append("month", selectedMonth);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
    if (donorTypeFilter) params.append("donorType", donorTypeFilter);
    if (search) params.append("search", search);
    return `/api/ledger/pdf?${params.toString()}`;
  };

  // 1. VIEW PDF USING REACTPDFVIEWER (EXACT REGISTRATION VIEWER)
  const handleViewPdf = async (type: "clinic" | "donor") => {
    const previewUrl = buildLedgerPdfUrl(type, true);
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `Mediyaz_${type === "clinic" ? "Clinic" : "Donor"}_Ledger_${dateStr}.pdf`;
    const selectedHosp = clinicAccounts.find((c) => c.hospitalId === selectedHospitalId);
    const clinicName = selectedHosp?.hospitalName || "";
    const title =
      type === "clinic"
        ? clinicName
          ? `Mediyaz ART Bank Ledger - ${clinicName}`
          : "Mediyaz ART Bank Ledger"
        : "Mediyaz ART Bank Ledger - Donor Disbursements";

    setIsPdfLoading(true);
    setIsPdfViewerOpen(true);
    setPdfViewerData({
      title,
      fileName,
      pdfUrl: previewUrl,
      pdfBlob: null,
    });

    try {
      const res = await fetch(previewUrl);
      if (res.ok) {
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        setPdfViewerData({
          title,
          fileName,
          pdfUrl: objUrl,
          pdfBlob: blob,
        });
      }
    } catch (err) {
      console.warn("Direct blob fetch failed, falling back to direct URL", err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  // 2. OPEN PDF IN NEW TAB (STANDALONE PRINT PAGE)
  const handleOpenPdfNewTab = (type?: "clinic" | "donor") => {
    const t = type || activeTab;
    const params = new URLSearchParams();
    params.append("type", t);
    if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
    if (selectedBranch && selectedBranch !== "ALL") params.append("branch", selectedBranch);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
    if (donorTypeFilter) params.append("donorType", donorTypeFilter);
    if (search) params.append("search", search);
    window.open(`/admin/ledger/print?${params.toString()}`, "_blank");
  };

  // 3. DOWNLOAD PDF (IF USER EXPLICITLY WANTS TO SAVE FILE)
  const handleDownloadPdf = (type: "clinic" | "donor") => {
    setPdfGenerating(true);
    const downloadUrl = buildLedgerPdfUrl(type, false);
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `Mediyaz_${type === "clinic" ? "Clinic" : "Donor"}_Ledger_${dateStr}.pdf`;

    toast.info(`Downloading ${type === "clinic" ? "Clinic" : "Donor"} Ledger PDF statement...`);
    try {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF statement downloaded successfully!");
    } catch {
      toast.error("Failed to download PDF statement");
    } finally {
      setPdfGenerating(false);
    }
  };

  // Backwards compatibility alias
  const handleGeneratePdf = (type: "clinic" | "donor") => {
    handleViewPdf(type);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const isClinic = activeTab === "clinic";
      const dataToExport = isClinic
        ? clinicEntries.map((e) => ({
            "Donor Name": e.donorName,
            "Registration No.": e.registrationId,
            "Clinic Name": e.clinicName || e.hospitalName,
            "Loction": e.location || e.hospitalLocation || e.hospitalCity || "",
            "Donor OPU Loction": e.donorOpuLocation || e.opuLocation || "",
            "Donor OPU Date": e.donorOpuDate || e.opuDate || e.pickupDate || "",
            "Invoce Date": e.invoiceDate || "",
            "Invoce NO.": e.invoiceNumber || "",
            "Amount": e.amount || e.dealPrice || 0,
            "TDS -": e.tdsAmount ? -e.tdsAmount : 0,
            "GST +": e.gstAmount || 0,
            "Net Amount": e.netAmount || ((e.amount || e.dealPrice || 0) - (e.tdsAmount || 0) + (e.gstAmount || 0)),
            "Credit date": e.creditDate || e.receivedDate || "",
            "Credit Amount": e.creditAmount !== undefined ? e.creditAmount : e.receivedAmount || 0,
          }))
        : donorEntries.map((e) => ({
            "S.No": e.sNo,
            "Registration No": e.registrationId,
            "Donor Name": e.donorName,
            "Donor ID": e.donorId || "",
            "Donor Type": (e.donorType || "").toUpperCase(),
            "Assigned Clinic": e.hospitalName,
            "Agreed Compensation (INR)": e.compensationAmount,
            "Paid to Donor (INR)": e.paidAmount,
            "Balance Due (INR)": e.balancePending,
            "Payment Method": e.paymentMethod,
            "Payment Status": e.paymentStatus,
            "Pickup Date": e.date || "",
          }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, isClinic ? "Clinic_Ledger" : "Donor_Ledger");
      XLSX.writeFile(
        wb,
        `Mediyaz_${isClinic ? "Clinic" : "Donor"}_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Excel exported successfully!");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Clinic & Donor Accounts Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                General Ledger
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive ledger tracking: received vs pending payments per clinic, and individual donor compensation.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* VIEW FULL PDF LIST */}
          <Button
            onClick={() => handleViewPdf(activeTab)}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 gap-2 font-semibold h-10 px-4"
          >
            <Eye className="h-4 w-4" />
            {activeTab === "clinic"
              ? "View Clinic PDF Statement"
              : "View Donor PDF Statement"}
          </Button>

          {/* DOWNLOAD ALL INVOICE PDFS (.ZIP) */}
          {activeTab === "clinic" && (
            <Button
              onClick={() => handleDownloadAllPdfs()}
              disabled={isDownloadingZip || loading || clinicEntries.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 gap-2 font-semibold h-10 px-4 cursor-pointer"
              title="Download all matching invoice PDFs in a single click"
            >
              {isDownloadingZip ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>
                    {downloadProgress ? `Generating (${downloadProgress.current}/${downloadProgress.total})...` : "Packaging ZIP..."}
                  </span>
                </>
              ) : (
                <>
                  <FileArchive className="h-4 w-4" />
                  <span>Download All Invoices (.ZIP)</span>
                </>
              )}
            </Button>
          )}

          {/* DOWNLOAD PDF STATEMENT */}
          <Link href="/reports/cashflow">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 h-10 shadow-sm"
              title="View full month-wise & year-wise cash in/out and revenue profit"
            >
              <TrendingUp className="h-4 w-4" />
              Full Revenue & Cash Flow
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadPdf(activeTab)}
            disabled={pdfGenerating || loading}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 gap-1.5 h-10"
            title="Download PDF statement file directly"
          >
            <Download className={`h-4 w-4 text-emerald-600 ${pdfGenerating ? "animate-bounce" : ""}`} />
            Download Statement
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadLedgerData}
            disabled={loading}
            className="border-slate-200 dark:border-slate-700 gap-1.5 h-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 gap-1.5 h-10"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("clinic")}
          className={`flex items-center gap-2.5 px-6 py-3.5 font-bold text-sm border-b-2 transition-all ${
            activeTab === "clinic"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Clinic Ledger (According to Clinic)
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {clinicEntries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("donor")}
          className={`flex items-center gap-2.5 px-6 py-3.5 font-bold text-sm border-b-2 transition-all ${
            activeTab === "donor"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          Donor Ledger (According to Donor)
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {donorEntries.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CLINIC LEDGER VIEW */}
      {activeTab === "clinic" && (
        <div className="space-y-6">
          {/* Clinic Ledger KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "border-slate-800 dark:border-slate-200 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-slate-400/20"
                  : "border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Deal Billed
                </p>
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                {formatInr(clinicTotals.totalDealPrice)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{clinicTotals.totalRecords} Completed Deals</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("RECEIVED")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilter === "RECEIVED"
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-500/20"
                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Realized Inflow
                </p>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {formatInr(clinicTotals.totalReceived)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Received Bank Inflow</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilter === "PENDING"
                  ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 shadow-sm ring-2 ring-rose-500/20"
                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Outstanding Due
                </p>
                <Clock className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {formatInr(clinicTotals.totalPending)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Pending Clinic Balance</p>
            </button>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Collection Rate
                </p>
                <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
              </div>
              <div className="text-xl font-black text-teal-600 dark:text-teal-400 mt-2">
                {clinicTotals.collectionRate}%
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 mt-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-500 rounded-full"
                  style={{ width: `${clinicTotals.collectionRate}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Net Realized Margin
                </p>
                <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-2">
                {formatInr(Math.max(0, clinicTotals.totalReceived - donorTotals.totalPaid))}
              </div>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-400 mt-1">
                Inflow minus Donor Outflow
              </p>
            </div>
          </div>

          {/* Clinic Breakdown Summary Cards */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Clinic Account Ledgers ({clinicAccounts.length} Clinics)
              </h3>
              {selectedHospitalId !== "ALL" && (
                <button
                  onClick={() => setSelectedHospitalId("ALL")}
                  className="text-xs font-medium text-emerald-600 hover:underline"
                >
                  Show All Clinics
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {clinicAccounts.map((account) => {
                const isSelected = selectedHospitalId === account.hospitalId;
                return (
                  <button
                    key={account.hospitalId}
                    onClick={() =>
                      setSelectedHospitalId(isSelected ? "ALL" : account.hospitalId)
                    }
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                      {account.hospitalName}
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Total Deals:</span>
                        <span className="font-semibold">{account.totalCases}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>Received:</span>
                        <span className="font-bold">{formatInr(account.totalReceived)}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Pending:</span>
                        <span className="font-bold">{formatInr(account.totalPending)}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Cleared: {account.collectionRate}%</span>
                      <span className="text-emerald-600 font-semibold">
                        {isSelected ? "Filtered ✓" : "Filter →"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinic Ledger Full Transactions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-3.5 bg-slate-50/40 dark:bg-slate-900/40">
              {/* Row 1: Search, Donor Type, and Payment Status */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search Reg No, Clinic, or Donor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-9 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                  />
                </form>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Donor Type */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => {
                        setDonorTypeFilter("all");
                        setClinicPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        donorTypeFilter === "all"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      All Types
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDonorTypeFilter("egg");
                        setClinicPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                        donorTypeFilter === "egg"
                          ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <Heart className="h-3 w-3" />
                      Egg
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDonorTypeFilter("sperm");
                        setClinicPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                        donorTypeFilter === "sperm"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <Dna className="h-3 w-3" />
                      Sperm
                    </button>
                  </div>

                  {/* Payment Status Tabs */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setClinicPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        statusFilter === "ALL"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("RECEIVED");
                        setClinicPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        statusFilter === "RECEIVED"
                          ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      Received (Paid)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("PENDING");
                        setClinicPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        statusFilter === "PENDING"
                          ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("PARTIAL");
                        setClinicPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        statusFilter === "PARTIAL"
                          ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      Partial
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Clinic, Branch, Year, Month Pickers & Instant Bulk Download */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
                  {/* ART Clinic Filter */}
                  <div className="flex items-center gap-1.5 min-w-[190px] flex-1">
                    <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <select
                      value={selectedHospitalId}
                      onChange={(e) => {
                        setSelectedHospitalId(e.target.value);
                        setSelectedBranch("ALL");
                        setClinicPage(1);
                      }}
                      className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      title="Filter by ART Clinic"
                    >
                      <option value="ALL">All ART Clinics</option>
                      {hospitalsList.length > 0
                        ? hospitalsList.map((h: any) => (
                            <option key={h._id} value={h._id}>
                              {h.name}
                            </option>
                          ))
                        : clinicAccounts.map((a) => (
                            <option key={a.hospitalId} value={a.hospitalId}>
                              {a.hospitalName} ({a.totalCases})
                            </option>
                          ))}
                    </select>
                  </div>

                  {/* Branch Filter */}
                  <div className="flex items-center gap-1.5 min-w-[170px] flex-1">
                    <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <GitBranch className="h-4 w-4" />
                    </div>
                    <select
                      value={selectedBranch}
                      onChange={(e) => {
                        setSelectedBranch(e.target.value);
                        setClinicPage(1);
                      }}
                      disabled={availableBranches.length === 0}
                      className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 disabled:opacity-50 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      title="Filter by Clinic Branch"
                    >
                      <option value="ALL">
                        {availableBranches.length === 0 ? "All Branches (None)" : `All Branches (${availableBranches.length})`}
                      </option>
                      {availableBranches.map((b) => (
                        <option key={b} value={b}>
                          Branch: {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div className="flex items-center gap-1.5 min-w-[130px]">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <CalendarRange className="h-4 w-4" />
                    </div>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setClinicPage(1);
                      }}
                      className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      title="Filter by Year"
                    >
                      <option value="ALL">All Years</option>
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr.toString()}>
                          Year {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div className="flex items-center gap-1.5 min-w-[155px]">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setClinicPage(1);
                      }}
                      className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                      title="Filter by Month"
                    >
                      {MONTH_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 h-8.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setClinicPage(1);
                      }}
                      className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                    />
                    <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setClinicPage(1);
                      }}
                      className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                    />
                    {(startDate || endDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                          setClinicPage(1);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                        title="Clear Dates"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Bulk Download Button for Current Filters */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleDownloadAllPdfs()}
                    disabled={isDownloadingZip || loading || clinicEntries.length === 0}
                    className="h-8.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs gap-1.5 cursor-pointer whitespace-nowrap"
                    title="Download all matching invoice PDFs in a single click"
                  >
                    {isDownloadingZip ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>
                          {downloadProgress ? `${downloadProgress.current}/${downloadProgress.total}` : "Zipping..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="h-3.5 w-3.5" />
                        <span>Download Invoices ({clinicEntries.length})</span>
                      </>
                    )}
                  </Button>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-8.5 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 cursor-pointer shrink-0"
                      title="Reset all active filters"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Active Filter Summary Banner */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 rounded-xl text-xs">
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-teal-700 dark:text-teal-400">Active Filters:</span>
                    {selectedHospitalId !== "ALL" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                        Clinic: {clinicAccounts.find((c) => c.hospitalId === selectedHospitalId)?.hospitalName || hospitalsList.find((h: any) => h._id === selectedHospitalId)?.name || selectedHospitalId}
                      </span>
                    )}
                    {selectedBranch !== "ALL" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                        Branch: {selectedBranch}
                      </span>
                    )}
                    {selectedYear !== "ALL" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                        Year: {selectedYear}
                      </span>
                    )}
                    {selectedMonth !== "ALL" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                        Month: {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label}
                      </span>
                    )}
                    {statusFilter !== "ALL" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                        Status: {statusFilter}
                      </span>
                    )}
                    {donorTypeFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium capitalize text-slate-800 dark:text-slate-200 shadow-2xs">
                        Type: {donorTypeFilter}
                      </span>
                    )}
                    {search && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                        Search: "{search}"
                      </span>
                    )}
                    {(startDate || endDate) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                        Dates: {startDate || "Start"} to {endDate || "End"}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Table Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
                <span>Showing <strong className="text-slate-900 dark:text-slate-100">{paginatedClinicEntries.length}</strong> of {clinicEntries.length} ledger transactions</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Density Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTableDensity("compact")}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tableDensity === "compact"
                        ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                    title="Compact view - fit more rows"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableDensity("comfortable")}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tableDensity === "comfortable"
                        ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                    title="Comfortable view - default spacing"
                  >
                    Comfortable
                  </button>
                </div>

                {/* Column Visibility Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[11px] rounded-lg gap-1.5 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                        <span>Columns</span>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-[10px] text-slate-400 uppercase px-2 py-1">Visible Columns</div>
                    {[
                      { key: "clinicName", label: "Clinic Name" },
                      { key: "location", label: "Clinic Location" },
                      { key: "opuLocation", label: "Donor OPU Location" },
                      { key: "opuDate", label: "Donor OPU Date" },
                      { key: "invoiceDate", label: "Invoice Date" },
                      { key: "invoiceNo", label: "Invoice Number" },
                      { key: "tdsGst", label: "TDS / GST Details" },
                      { key: "creditDate", label: "Credit Date" },
                    ].map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none text-[11px] font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={(visibleClinicCols as any)[col.key]}
                          onChange={(e) =>
                            setVisibleClinicCols((prev) => ({ ...prev, [col.key]: e.target.checked }))
                          }
                          className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1360px] text-left border-collapse text-xs">
                <thead className="sticky top-0 z-20 backdrop-blur-md bg-slate-100/95 dark:bg-slate-800/95 shadow-2xs">
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase font-bold text-[10px] whitespace-nowrap">
                    <th className={`${tableDensity === "compact" ? "py-2 px-2 text-center w-8" : "py-3 px-2.5 text-center w-8"}`}>
                      <input
                        type="checkbox"
                        checked={clinicEntries.length > 0 && selectedIds.length === clinicEntries.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        title="Select All Invoices"
                      />
                    </th>
                    <th className={`${tableDensity === "compact" ? "py-2 px-2 text-center w-8" : "py-3 px-2.5 text-center w-8"}`}>#</th>
                    <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Donor Name</th>
                    <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Registration No.</th>
                    {visibleClinicCols.clinicName && <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Clinic Name</th>}
                    {visibleClinicCols.location && <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Location</th>}
                    {visibleClinicCols.opuLocation && <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Donor OPU Location</th>}
                    {visibleClinicCols.opuDate && <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Donor OPU Date</th>}
                    {visibleClinicCols.invoiceDate && <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Invoice Date</th>}
                    {visibleClinicCols.invoiceNo && <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Invoice No.</th>}
                    <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"} text-right min-w-[110px]`}>Amount</th>
                    {visibleClinicCols.tdsGst && (
                      <>
                        <th className={`${tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"} text-right min-w-[90px]`}>TDS -</th>
                        <th className={`${tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"} text-right min-w-[90px]`}>GST +</th>
                      </>
                    )}
                    <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"} text-right min-w-[115px]`}>Net Amount</th>
                    {visibleClinicCols.creditDate && <th className={tableDensity === "compact" ? "py-2 px-2" : "py-3 px-2.5"}>Credit Date</th>}
                    <th className={`${tableDensity === "compact" ? "py-2 px-3" : "py-3 px-4"} text-right sticky right-0 bg-slate-100/95 dark:bg-slate-800/95 z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] min-w-[130px]`}>Credit Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {loading ? (
                    <TableSkeletonRows
                      columns={16}
                      rows={6}
                      density={tableDensity}
                    />
                  ) : clinicEntries.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-500">
                        <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300">No invoiced records found</div>
                        <div className="text-xs text-slate-400 mt-1">Donors will appear in the Clinic Ledger once their Tax Invoice is generated in Completed Files.</div>
                      </td>
                    </tr>
                  ) : (
                    paginatedClinicEntries.map((entry) => {
                      const isReceived = entry.paymentStatus === "RECEIVED";
                      const isPartial = entry.paymentStatus === "PARTIALLY_RECEIVED";
                      const grossAmt = entry.amount || entry.dealPrice || 0;
                      const tdsAmt = entry.tdsAmount || 0;
                      const gstAmt = entry.gstAmount || 0;
                      const netAmt = entry.netAmount || Math.max(0, grossAmt - tdsAmt + gstAmt);
                      const credAmt = entry.creditAmount !== undefined ? entry.creditAmount : entry.receivedAmount || 0;
                      const credDate = entry.creditDate && entry.creditDate !== "-" ? entry.creditDate : (entry.receivedDate || (isReceived ? "Cleared" : "Pending"));
                      const cellPad = tableDensity === "compact" ? "py-1.5 px-2 text-[11px]" : "py-2.5 px-2.5 text-xs";
                      const rowId = entry._id || entry.registrationId;
                      const isRowSelected = selectedIds.includes(rowId);

                      return (
                        <tr
                          key={entry.registrationId}
                          className={`group/row transition-colors whitespace-nowrap ${
                            isRowSelected
                              ? "bg-teal-50/60 dark:bg-teal-950/30"
                              : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className={`${cellPad} text-center`}>
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() => handleToggleRow(rowId)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                            />
                          </td>
                          <td className={`${cellPad} text-center text-slate-400 font-mono`}>
                            {entry.sNo}
                          </td>
                          <td className={`${cellPad} font-bold text-slate-900 dark:text-slate-100`}>
                            <div>{entry.donorName}</div>
                          </td>
                          <td className={cellPad}>
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              {entry.registrationId}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {entry.donorType ? entry.donorType.toUpperCase() : "DONOR"}
                            </div>
                          </td>
                          {visibleClinicCols.clinicName && (
                            <td className={`${cellPad} font-semibold text-slate-800 dark:text-slate-200`}>
                              {entry.clinicName || entry.hospitalName || "N/A"}
                            </td>
                          )}
                          {visibleClinicCols.location && (
                            <td className={`${cellPad} text-slate-600 dark:text-slate-400`}>
                              {entry.location || entry.hospitalLocation || entry.hospitalCity || "-"}
                            </td>
                          )}
                          {visibleClinicCols.opuLocation && (
                            <td className={`${cellPad} font-medium text-slate-700 dark:text-slate-300`}>
                              {entry.donorOpuLocation || entry.opuLocation || "-"}
                            </td>
                          )}
                          {visibleClinicCols.opuDate && (
                            <td className={`${cellPad} font-mono text-slate-700 dark:text-slate-300`}>
                              {entry.donorOpuDate || entry.opuDate || entry.pickupDate || "-"}
                            </td>
                          )}
                          {visibleClinicCols.invoiceDate && (
                            <td className={`${cellPad} font-mono text-slate-600 dark:text-slate-400`}>
                              {entry.invoiceDate || "-"}
                            </td>
                          )}
                          {visibleClinicCols.invoiceNo && (
                            <td className={`${cellPad} font-mono font-bold text-slate-900 dark:text-slate-100`}>
                              {entry.invoiceNumber
                                ? entry.invoiceNumber.startsWith("#")
                                  ? entry.invoiceNumber
                                  : `#${entry.invoiceNumber}`
                                : "N/A"}
                            </td>
                          )}
                          <td className={`${cellPad} text-right font-bold text-slate-900 dark:text-slate-100 min-w-[110px]`}>
                            {formatInr(grossAmt)}
                          </td>
                          {visibleClinicCols.tdsGst && (
                            <>
                              <td className={`${cellPad} text-right font-semibold text-orange-600 dark:text-orange-400 min-w-[90px]`}>
                                <div>{tdsAmt > 0 ? `-${formatInr(tdsAmt)}` : "₹0"}</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {entry.tdsPercentage ? `(${entry.tdsPercentage}%)` : "0%"}
                                </div>
                              </td>
                              <td className={`${cellPad} text-right font-semibold text-emerald-600 dark:text-emerald-400 min-w-[90px]`}>
                                <div>{gstAmt > 0 ? `+${formatInr(gstAmt)}` : "₹0"}</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {gstAmt > 0 ? "18% on SC" : "Exempt"}
                                </div>
                              </td>
                            </>
                          )}
                          <td className={`${cellPad} text-right font-black text-teal-700 dark:text-teal-300 min-w-[115px]`}>
                            {formatInr(netAmt)}
                          </td>
                          {visibleClinicCols.creditDate && (
                            <td className={`${cellPad} text-slate-600 dark:text-slate-400 font-mono text-[11px]`}>
                              {credDate}
                            </td>
                          )}
                          <td className={`${cellPad} text-right font-bold text-emerald-600 dark:text-emerald-400 sticky right-0 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] bg-white group-hover/row:bg-slate-50 dark:bg-slate-900 dark:group-hover/row:bg-slate-800 min-w-[130px]`}>
                            <div>{formatInr(credAmt)}</div>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                isReceived
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                  : isPartial
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                              }`}
                            >
                              {isReceived ? "PAID" : isPartial ? "PARTIAL" : "PENDING"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* TOTAL IN THE END */}
                {clinicEntries.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-200/90 dark:bg-slate-800 border-t-2 border-slate-900 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs whitespace-nowrap">
                      <td colSpan={4 + (visibleClinicCols.clinicName ? 1 : 0) + (visibleClinicCols.location ? 1 : 0) + (visibleClinicCols.opuLocation ? 1 : 0) + (visibleClinicCols.opuDate ? 1 : 0) + (visibleClinicCols.invoiceDate ? 1 : 0) + (visibleClinicCols.invoiceNo ? 1 : 0)} className="py-3 px-3 uppercase tracking-wider">
                        GRAND TOTAL ({clinicTotals.totalRecords} TRANSACTIONS)
                      </td>
                      <td className="py-3 px-2.5 text-right font-black min-w-[110px]">
                        {formatInr(clinicTotals.totalDealPrice)}
                      </td>
                      {visibleClinicCols.tdsGst && (
                        <>
                          <td className="py-3 px-2.5 text-right font-semibold text-orange-600 min-w-[90px]">
                            -{formatInr((clinicTotals as any).totalTdsAmount || 0)}
                          </td>
                          <td className="py-3 px-2.5 text-right font-semibold text-emerald-600 min-w-[90px]">
                            +{formatInr((clinicTotals as any).totalGstAmount || 0)}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-2.5 text-right font-black text-teal-700 dark:text-teal-300 min-w-[115px]">
                        {formatInr((clinicTotals as any).totalNetAmount || (clinicTotals.totalDealPrice - ((clinicTotals as any).totalTdsAmount || 0) + ((clinicTotals as any).totalGstAmount || 0)))}
                      </td>
                      {visibleClinicCols.creditDate && (
                        <td className="py-3 px-2.5 text-center text-[10px] text-muted-foreground font-mono">
                          {clinicTotals.collectionRate}% CLEARED
                        </td>
                      )}
                      <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-black sticky right-0 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] bg-slate-200/90 dark:bg-slate-800 min-w-[130px]">
                        {formatInr(clinicTotals.totalReceived)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination Controls for Clinic Ledger */}
            {clinicEntries.length > 0 && (
              <CustomPagination
                currentPage={clinicPage}
                totalPages={totalClinicPages}
                totalCount={clinicEntries.length}
                pageSize={clinicPageSize}
                onPageChange={setClinicPage}
                onPageSizeChange={(newSize) => {
                  setClinicPageSize(newSize);
                  setClinicPage(1);
                }}
                itemName="transactions"
              />
            )}
          </div>

          {/* Floating Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className="h-6 w-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[11px]">
                  {selectedIds.length}
                </div>
                <span>Selected Invoices</span>
              </div>

              <div className="h-4 w-px bg-slate-700" />

              <Button
                size="sm"
                onClick={() => handleDownloadAllPdfs()}
                disabled={isDownloadingZip}
                className="h-8 px-3.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-sm gap-1.5 cursor-pointer"
              >
                {isDownloadingZip ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      {downloadProgress ? `${downloadProgress.current}/${downloadProgress.total}` : "Zipping..."}
                    </span>
                  </>
                ) : (
                  <>
                    <FileArchive className="h-3.5 w-3.5" />
                    <span>Download {selectedIds.length} Invoice PDFs (.ZIP)</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-1.5 py-1"
              >
                Deselect All
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DONOR LEDGER VIEW */}
      {activeTab === "donor" && (
        <div className="space-y-6">
          {/* Donor Ledger KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "border-slate-800 dark:border-slate-200 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-slate-400/20"
                  : "border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Agreed Compensation
                </p>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {formatInr(donorTotals.totalCompensation)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across {donorTotals.totalDonors} Donors Handled</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("PAID")}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilter === "PAID"
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-500/20"
                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Total Disbursed to Donors
                </p>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {formatInr(donorTotals.totalPaid)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Bank Payouts Settled</p>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                statusFilter === "PENDING"
                  ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/30 shadow-sm ring-2 ring-rose-500/20"
                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Pending Donor Payouts
                </p>
                <Clock className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                {formatInr(donorTotals.totalPending)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Outstanding Reimbursements</p>
            </button>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Disbursement Settlement
                </p>
                <TrendingUp className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">
                {donorTotals.settlementRate}%
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 mt-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${donorTotals.settlementRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Donor Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search Donor Name, Reg ID, or Clinic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </form>

              <div className="flex flex-wrap items-center gap-2">
                {/* ART Clinic Filter */}
                <select
                  value={selectedHospitalId}
                  onChange={(e) => {
                    setSelectedHospitalId(e.target.value);
                    setSelectedBranch("ALL");
                  }}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="ALL">All ART Clinics</option>
                  {hospitalsList.length > 0
                    ? hospitalsList.map((h: any) => (
                        <option key={h._id} value={h._id}>
                          {h.name}
                        </option>
                      ))
                    : clinicAccounts.map((a) => (
                        <option key={a.hospitalId} value={a.hospitalId}>
                          {a.hospitalName} ({a.totalCases})
                        </option>
                      ))}
                </select>

                {/* Branch Filter */}
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setDonorPage(1);
                  }}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="ALL">All Branches</option>
                  {availableBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                {/* Year Filter */}
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setDonorPage(1);
                  }}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                  title="Filter by Year"
                >
                  <option value="ALL">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr.toString()}>
                      Year {yr}
                    </option>
                  ))}
                </select>

                {/* Month Filter */}
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setDonorPage(1);
                  }}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                  title="Filter by Month"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                {/* Date Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 h-9">
                  <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDonorPage(1);
                    }}
                    className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                  />
                  <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDonorPage(1);
                    }}
                    className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden"
                  />
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setDonorPage(1);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                      title="Clear Dates"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setDonorPage(1);
                  }}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="ALL">All Payment Status</option>
                  <option value="PAID">Paid in Full</option>
                  <option value="PENDING">Pending Payout</option>
                  <option value="PARTIAL">Partially Paid</option>
                </select>

                <select
                  value={donorTypeFilter}
                  onChange={(e) => {
                    setDonorTypeFilter(e.target.value);
                    setDonorPage(1);
                  }}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="all">All Donor Types</option>
                  <option value="egg">Egg Donors</option>
                  <option value="sperm">Sperm Donors</option>
                </select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-9 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 cursor-pointer"
                    title="Reset filters"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Table Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
                <span>Showing <strong className="text-slate-900 dark:text-slate-100">{paginatedDonorEntries.length}</strong> of {donorEntries.length} donor disbursement records</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Density Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTableDensity("compact")}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tableDensity === "compact"
                        ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                    title="Compact view - fit more rows"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableDensity("comfortable")}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tableDensity === "comfortable"
                        ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                    title="Comfortable view - default spacing"
                  >
                    Comfortable
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
                <thead className="sticky top-0 z-20 backdrop-blur-md bg-slate-100/95 dark:bg-slate-800/95 shadow-2xs">
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase font-bold text-[11px]">
                    <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"} text-center w-12`}>#</th>
                    <th className={tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"}>Registration No.</th>
                    <th className={tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"}>Donor Name & Details</th>
                    <th className={tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"}>Assigned Clinic</th>
                    <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"} text-right`}>Agreed Compensation</th>
                    <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"} text-right`}>Paid to Donor</th>
                    <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"} text-right`}>Balance Due</th>
                    <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "py-3 px-3"} text-center sticky right-0 bg-slate-100/95 dark:bg-slate-800/95 z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]`}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {loading ? (
                    <TableSkeletonRows
                      columns={8}
                      rows={6}
                      density={tableDensity}
                    />
                  ) : donorEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No donor payment records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedDonorEntries.map((entry) => {
                      const isPaid = entry.paymentStatus === "PAID";
                      const isPartial = entry.paymentStatus === "PARTIALLY_PAID";
                      const cellPad = tableDensity === "compact" ? "py-2 px-2.5 text-[11px]" : "py-3 px-3 text-xs";

                      return (
                        <tr
                          key={entry.registrationId}
                          className="group/row hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className={`${cellPad} text-center text-slate-400 font-mono`}>
                            {entry.sNo}
                          </td>
                          <td className={cellPad}>
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              {entry.registrationId}
                            </span>
                            {entry.date && (
                              <div className="text-[10px] text-slate-400">{entry.date}</div>
                            )}
                          </td>
                          <td className={cellPad}>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {entry.donorName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {entry.donorType.toUpperCase()}
                            </div>
                          </td>
                          <td className={cellPad}>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {entry.hospitalName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Method: {entry.paymentMethod.replace("_", " ").toUpperCase()}
                            </div>
                          </td>
                          <td className={`${cellPad} text-right font-bold text-slate-900 dark:text-slate-100`}>
                            {formatInr(entry.compensationAmount)}
                          </td>
                          <td className={`${cellPad} text-right font-bold text-emerald-600`}>
                            {formatInr(entry.paidAmount)}
                          </td>
                          <td className={`${cellPad} text-right font-bold text-rose-600`}>
                            {formatInr(entry.balancePending)}
                          </td>
                          <td className={`${cellPad} text-center sticky right-0 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] bg-white group-hover/row:bg-slate-50 dark:bg-slate-900 dark:group-hover/row:bg-slate-800`}>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                  : isPartial
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                              }`}
                            >
                              {isPaid ? "PAID" : isPartial ? "PARTIAL" : "PENDING"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* TOTAL IN THE END */}
                {donorEntries.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-200/90 dark:bg-slate-800 border-t-2 border-slate-900 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs">
                      <td colSpan={4} className="py-4 px-4 uppercase tracking-wider">
                        GRAND TOTAL ({donorTotals.totalDonors} DONORS)
                      </td>
                      <td className="py-4 px-3 text-right text-sm">
                        {formatInr(donorTotals.totalCompensation)}
                      </td>
                      <td className="py-4 px-3 text-right text-sm text-emerald-600 dark:text-emerald-400">
                        {formatInr(donorTotals.totalPaid)}
                      </td>
                      <td className="py-4 px-3 text-right text-sm text-rose-600 dark:text-rose-400">
                        {formatInr(donorTotals.totalPending)}
                      </td>
                      <td className="py-4 px-3 text-center text-xs text-teal-700 dark:text-teal-400 sticky right-0 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] bg-slate-200/90 dark:bg-slate-800">
                        {donorTotals.settlementRate}% SETTLED
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination Controls for Donor Ledger */}
            {donorEntries.length > 0 && (
              <CustomPagination
                currentPage={donorPage}
                totalPages={totalDonorPages}
                totalCount={donorEntries.length}
                pageSize={donorPageSize}
                onPageChange={setDonorPage}
                onPageSizeChange={(newSize) => {
                  setDonorPageSize(newSize);
                  setDonorPage(1);
                }}
                itemName="disbursements"
              />
            )}
          </div>
        </div>
      )}

      {/* IN-APP PDF PREVIEW MODAL */}
      {/* REACTPDFVIEWER (EXACT SAME AS REGISTRATION FORM VIEWER, WORKS ON MOBILE AND DESKTOP) */}
      {isPdfViewerOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-100 flex flex-col overflow-hidden">
          {isPdfLoading ? (
            <div className="flex flex-col h-screen w-screen justify-center items-center font-sans gap-3.5 bg-slate-50 select-none">
              <div className="w-11 h-11 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <div className="text-slate-800 font-semibold text-sm">Preparing Document</div>
                <div className="text-slate-500 text-xs mt-1">Generating {pdfViewerData.title}...</div>
              </div>
            </div>
          ) : (
            <ReactPdfViewer
              pdfBlob={pdfViewerData.pdfBlob}
              pdfUrl={pdfViewerData.pdfUrl}
              title={pdfViewerData.title}
              fileName={pdfViewerData.fileName}
              onBack={() => {
                if (pdfViewerData.pdfUrl && pdfViewerData.pdfUrl.startsWith("blob:")) {
                  URL.revokeObjectURL(pdfViewerData.pdfUrl);
                }
                setIsPdfViewerOpen(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
