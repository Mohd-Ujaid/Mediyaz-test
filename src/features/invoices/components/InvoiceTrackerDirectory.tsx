"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { pdf } from "@react-pdf/renderer";
import CompletedFileInvoicePdfDocument, {
  CompletedFileInvoiceData,
} from "@/features/pdf-generator/invoice/CompletedFileInvoicePdfDocument";
import { formatDotDate, numberToWordsIndian } from "@/lib/invoice-utils";
import {
  Receipt,
  Building2,
  Calendar,
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Check,
  TrendingUp,
  Percent,
  Wallet,
  Heart,
  Dna,
  SlidersHorizontal,
  GitBranch,
  X,
  FileArchive,
  CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { confirmAction } from "@/components/ui/custom-confirm-modal";
import { CompletedFileInvoiceModal } from "@/features/completed-files/components/CompletedFileInvoiceModal";
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

function convertInvoiceToPdfData(inv: any): CompletedFileInvoiceData {
  const isEgg = inv.donorType !== "sperm";
  const hosp = inv.assignedHospital;
  const isInterState = hosp?.state && !hosp.state.toLowerCase().includes("delhi");
  const dealPrice = inv.dealPrice || 65000;
  const serviceCharge = inv.serviceCharge || 5000;
  const donorReimbursement = inv.donorReimbursement || Math.max(0, dealPrice - serviceCharge);

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
        hosp.addressLine1,
        hosp.city,
        hosp.state ? `${hosp.state}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return {
    invoiceNumber: inv.invoiceNumber || inv.registrationId?.replace(/^[A-Z]+-/, "") || "INV",
    invoiceDate: inv.invoiceDate || formatDotDate(new Date()),
    sacCode: "999317",
    gstin: "07FJBPS6601G1Z7",
    donorType: isEgg ? "egg" : "sperm",
    donorName: inv.donorName || "Donor",
    huidNo: inv.donorId || inv.registrationId || "N/A",
    hospitalName: hosp?.name || "Partner ART Clinic",
    hospitalGstin: hosp?.gstNumber || "07AANCM1124F1ZQ",
    hospitalAddress,
    branchName: inv.assignedBranch || inv.opuLocation || hosp?.branches?.[0]?.branchName || "",
    pickupDate: inv.pickupDate || inv.invoiceDate || formatDotDate(new Date()),
    pickupLocation: inv.opuLocation || hospitalAddress,
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

export function InvoiceTrackerDirectory() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [clinicBreakdown, setClinicBreakdown] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paidInvoicesCount: 0,
    pendingInvoicesCount: 0,
    partialInvoicesCount: 0,
    totalBilledAmount: 0,
    totalReceivedAmount: 0,
    totalPendingAmount: 0,
    paidPercentage: 0,
  });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [availableYears, setAvailableYears] = useState<number[]>([2027, 2026, 2025, 2024]);
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PAID | PENDING | PARTIALLY_RECEIVED
  const [donorTypeFilter, setDonorTypeFilter] = useState("all"); // all | egg | sperm
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Row selection & Bulk Download State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  // Available branches for currently selected clinic
  const activeHospitalBranches: string[] = useMemo(() => {
    const branchSet = new Set<string>();

    if (selectedHospitalId === "ALL") {
      availableBranches.forEach((b) => branchSet.add(b));
      invoices.forEach((inv) => {
        if (inv.assignedBranch) branchSet.add(inv.assignedBranch);
      });
      allInvoices.forEach((inv) => {
        if (inv.assignedBranch) branchSet.add(inv.assignedBranch);
      });
    } else {
      const found = clinicBreakdown.find((c) => c.hospitalId === selectedHospitalId);
      if (found?.branches && Array.isArray(found.branches)) {
        found.branches.forEach((b: any) => {
          const name = typeof b === "string" ? b : b.branchName || b.name;
          if (name) branchSet.add(name);
        });
      }
      invoices.forEach((inv) => {
        if (inv.assignedHospital?._id === selectedHospitalId || inv.assignedHospital?.name === found?.hospitalName) {
          if (inv.assignedBranch) branchSet.add(inv.assignedBranch);
        }
      });
      allInvoices.forEach((inv) => {
        if (inv.assignedHospital?._id === selectedHospitalId || inv.assignedHospital?.name === found?.hospitalName) {
          if (inv.assignedBranch) branchSet.add(inv.assignedBranch);
        }
      });
    }

    return Array.from(branchSet).filter(Boolean).sort();
  }, [selectedHospitalId, clinicBreakdown, availableBranches, invoices, allInvoices]);

  // Table UX & Density controls
  const [tableDensity, setTableDensity] = useState<"compact" | "comfortable">("comfortable");
  const [visibleColumns, setVisibleColumns] = useState({
    clinic: true,
    pickup: true,
    deal: true,
    received: true,
    pending: true,
    status: true,
  });

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    registrationId: "",
    donorType: "egg",
    dealPrice: 0,
    receivedAmount: 0,
    paymentStatus: "PENDING",
    paymentReference: "",
    notes: "",
  });

  // Load Invoices
  async function loadInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
      if (selectedBranch && selectedBranch !== "ALL") params.append("branch", selectedBranch);
      if (selectedYear && selectedYear !== "ALL") params.append("year", selectedYear);
      if (selectedMonth && selectedMonth !== "ALL") params.append("month", selectedMonth);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (donorTypeFilter) params.append("donorType", donorTypeFilter);
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setInvoices(data.invoices || []);
        setAllInvoices(data.allMatchingInvoices || []);
        setStats(data.stats);
        setClinicBreakdown(data.clinicBreakdown || []);
        if (data.availableYears && data.availableYears.length > 0) {
          setAvailableYears(data.availableYears);
        }
        if (data.availableBranches) {
          setAvailableBranches(data.availableBranches);
        }
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        toast.error(data.error || "Failed to load invoices");
      }
    } catch (err: any) {
      console.error("Error loading invoices:", err);
      toast.error("Network error while loading invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, [
    currentPage,
    itemsPerPage,
    selectedHospitalId,
    selectedBranch,
    selectedYear,
    selectedMonth,
    statusFilter,
    donorTypeFilter,
  ]);

  useEffect(() => {
    setSelectedIds([]);
  }, [
    selectedHospitalId,
    selectedBranch,
    selectedYear,
    selectedMonth,
    statusFilter,
    donorTypeFilter,
  ]);

  // Bulk PDF Download Handler
  const handleDownloadAllPdfs = async (targetInvoices?: any[]) => {
    const listToDownload = targetInvoices && targetInvoices.length > 0
      ? targetInvoices
      : selectedIds.length > 0
      ? (allInvoices.length > 0 ? allInvoices : invoices).filter((inv) =>
          selectedIds.includes(inv._id || inv.registrationId)
        )
      : (allInvoices.length > 0 ? allInvoices : invoices);

    if (listToDownload.length === 0) {
      toast.error("No invoices matching the current filter selection to download.");
      return;
    }

    setIsDownloadingZip(true);
    setDownloadProgress({ current: 0, total: listToDownload.length });

    try {
      // If exactly 1 invoice, download as single PDF file directly
      if (listToDownload.length === 1) {
        const inv = listToDownload[0];
        const pdfData = convertInvoiceToPdfData(inv);
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

      // If multiple, build ZIP archive
      const zip = new JSZip();
      toast.info(`Preparing ${listToDownload.length} invoice PDFs...`);

      for (let i = 0; i < listToDownload.length; i++) {
        const inv = listToDownload[i];
        setDownloadProgress({ current: i + 1, total: listToDownload.length });
        const pdfData = convertInvoiceToPdfData(inv);
        const blob = await pdf(<CompletedFileInvoicePdfDocument invoice={pdfData} />).toBlob();
        const safeDonor = (inv.donorName || "Donor").replace(/[^a-zA-Z0-9]/g, "_");
        const safeHosp = (inv.assignedHospital?.shortName || inv.assignedHospital?.name || "Clinic").replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `Invoice_${inv.invoiceNumber || inv.registrationId}_${safeHosp}_${safeDonor}.pdf`;
        zip.file(fileName, blob);
      }

      toast.info("Packaging PDFs into ZIP archive...");
      const zipBlob = await zip.generateAsync({ type: "blob" });

      const clinicName = selectedHospitalId !== "ALL"
        ? (clinicBreakdown.find((c) => c.hospitalId === selectedHospitalId)?.hospitalName || "Clinic").replace(/[^a-zA-Z0-9]/g, "_")
        : "All_Clinics";
      const branchName = selectedBranch !== "ALL" ? selectedBranch.replace(/[^a-zA-Z0-9]/g, "_") : "";
      const monthName = selectedMonth !== "ALL" ? (MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label.split(" ")[0] || "Month") : "All_Months";
      const yearName = selectedYear !== "ALL" ? selectedYear : "All_Years";

      const zipFileName = `Invoices_${clinicName}${branchName ? `_${branchName}` : ""}_${monthName}_${yearName}.zip`;

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = invoices.map((i) => i._id || i.registrationId);
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
    setStatusFilter("ALL");
    setDonorTypeFilter("all");
    setSearch("");
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const hasActiveFilters = Boolean(
    selectedHospitalId !== "ALL" ||
    selectedBranch !== "ALL" ||
    selectedYear !== "ALL" ||
    selectedMonth !== "ALL" ||
    statusFilter !== "ALL" ||
    donorTypeFilter !== "all" ||
    search.trim() !== ""
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadInvoices();
  };

  // Open Payment Update Modal
  const handleOpenPayment = (inv: any) => {
    setPaymentForm({
      registrationId: inv.registrationId,
      donorType: inv.donorType || "egg",
      dealPrice: inv.dealPrice,
      receivedAmount: inv.receivedAmount || 0,
      paymentStatus: inv.paymentStatus,
      paymentReference: inv.paymentReference || "",
      notes: "",
    });
    setIsPaymentModalOpen(true);
  };

  // Submit Payment Update
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: paymentForm.registrationId,
          donorType: paymentForm.donorType,
          paymentStatus: paymentForm.paymentStatus,
          receivedAmount: paymentForm.receivedAmount,
          paymentReference: paymentForm.paymentReference,
          notes: paymentForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment details updated successfully!");
        setIsPaymentModalOpen(false);
        loadInvoices();
      } else {
        toast.error(data.error || "Failed to update payment");
      }
    } catch (err) {
      toast.error("Network error updating payment");
    } finally {
      setActionLoading(false);
    }
  };

  // Mark full payment received in one click
  const handleQuickMarkPaid = async (inv: any) => {
    const confirmed = await confirmAction({
      title: "Confirm Payment Receipt",
      message: `Mark invoice #${inv.invoiceNumber} (${inv.registrationId}) as FULLY RECEIVED?`,
      confirmText: "Yes, Mark Received",
      variant: "default",
    });
    if (!confirmed) return;
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: inv.registrationId,
          donorType: inv.donorType || "egg",
          paymentStatus: "RECEIVED",
          receivedAmount: inv.dealPrice,
          paymentReference: `AUTO-SETTLED-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice marked as FULLY PAID!");
        loadInvoices();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Open Invoice Preview Modal
  const handleViewInvoice = (inv: any) => {
    setSelectedInvoice({
      ...inv,
      personalInfo: { fullName: inv.donorName },
    });
    setIsInvoiceModalOpen(true);
  };

  // Export Invoices to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = (allInvoices.length > 0 ? allInvoices : invoices).map((inv, idx) => ({
        "S.No": idx + 1,
        "Invoice No": inv.invoiceNumber,
        "Invoice Date": inv.invoiceDate,
        "Reg ID": inv.registrationId,
        "Donor Name": inv.donorName,
        "Donor Type": (inv.donorType || "").toUpperCase(),
        "ART Clinic Name": inv.assignedHospital?.name || "N/A",
        "Clinic Branch": inv.assignedBranch || inv.opuLocation || inv.pickupLocation || inv.assignedHospital?.city || "Main Branch",
        "Clinic Code": inv.assignedHospital?.code || "",
        "Deal Price (INR)": inv.dealPrice,
        "Received Amount (INR)": inv.receivedAmount,
        "Pending Balance (INR)": inv.pendingAmount,
        "Payment Status": inv.paymentStatus,
        "Payment Ref": inv.paymentReference || "",
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Invoices_Tracker");
      XLSX.writeFile(wb, `Mediyaz_Invoices_Tracker_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exported successfully!");
    } catch (err) {
      toast.error("Failed to export Excel");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Invoice Tracker
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Live Audited
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive tracker for ART clinic invoices, payment settlements, and collections.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            disabled={loading}
            className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>

          <Button
            size="sm"
            onClick={() => handleDownloadAllPdfs()}
            disabled={isDownloadingZip || loading || totalCount === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm gap-2"
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
                <span>Download All PDFs (.ZIP)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Invoices
            </p>
            <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalInvoices} Invoices
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
              <span>Billed Value:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatInr(stats.totalBilledAmount)}
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 mt-3 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 w-full" />
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fully Paid
            </p>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.paidInvoicesCount} Invoices
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
              <span>Received Amount:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatInr(stats.totalReceivedAmount)}
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 mt-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${stats.paidPercentage}%` }}
            />
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending / Due
            </p>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.pendingInvoicesCount} Invoices
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
              <span>Outstanding:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {formatInr(stats.totalPendingAmount)}
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 mt-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{
                width: `${stats.totalInvoices > 0 ? (stats.pendingInvoicesCount / stats.totalInvoices) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Collection Clearance
            </p>
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.paidPercentage}%
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
              <span>Partial Settlements:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {stats.partialInvoicesCount} Files
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 mt-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${stats.paidPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION: ALL INVOICES ACCORDING TO CLINIC */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              All Invoices According to ART Clinic
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clinic-wise billing summary, collection rates, and quick filter access.
            </p>
          </div>
          {selectedHospitalId !== "ALL" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedHospitalId("ALL");
                setCurrentPage(1);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              Reset to All Clinics
            </Button>
          )}
        </div>

        {/* Clinic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {clinicBreakdown.map((clinic) => {
            const isSelected = selectedHospitalId === clinic.hospitalId;
            return (
              <button
                key={clinic.hospitalId}
                onClick={() => {
                  setSelectedHospitalId(isSelected ? "ALL" : clinic.hospitalId);
                  setCurrentPage(1);
                }}
                className={`text-left p-4 rounded-xl border transition-all duration-200 relative ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                    {clinic.hospitalName}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {clinic.invoiceCount} {clinic.invoiceCount === 1 ? "Inv" : "Invs"}
                  </span>
                </div>

                {clinic.city && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {clinic.city} {clinic.state ? `, ${clinic.state}` : ""}
                  </p>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Billed:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatInr(clinic.totalBilled)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span>Received:</span>
                    <span className="font-semibold">{formatInr(clinic.totalReceived)}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                    <span>Pending:</span>
                    <span className="font-semibold">{formatInr(clinic.totalPending)}</span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>Cleared: {clinic.collectionRate}%</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {isSelected ? "Filter Applied ✓" : "Click to Filter →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN INVOICE DIRECTORY TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Filters Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-3.5 bg-slate-50/40 dark:bg-slate-900/40">
          {/* Row 1: Search, Donor Type, and Payment Status */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by Invoice No, Reg ID, Donor, or Clinic..."
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
                    setCurrentPage(1);
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
                    setCurrentPage(1);
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
                    setCurrentPage(1);
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

              {/* Status Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setCurrentPage(1);
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
                    setStatusFilter("PAID");
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    statusFilter === "PAID"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("PENDING");
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    statusFilter === "PENDING"
                      ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Clinic, Branch, Year, Month Pickers & Instant Bulk Download */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
              {/* Clinic Filter Dropdown */}
              <div className="flex items-center gap-1.5 min-w-[190px] flex-1">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => {
                    setSelectedHospitalId(e.target.value);
                    setSelectedBranch("ALL");
                    setCurrentPage(1);
                  }}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="Filter by ART Clinic"
                >
                  <option value="ALL">All Clinics ({clinicBreakdown.length})</option>
                  {clinicBreakdown.map((c) => (
                    <option key={c.hospitalId} value={c.hospitalId}>
                      {c.hospitalName} ({c.invoiceCount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Filter Dropdown */}
              <div className="flex items-center gap-1.5 min-w-[170px] flex-1">
                <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <GitBranch className="h-4 w-4" />
                </div>
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={activeHospitalBranches.length === 0 && selectedHospitalId !== "ALL"}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="Filter by Clinic Branch"
                >
                  <option value="ALL">
                    {activeHospitalBranches.length === 0 ? "All Branches" : `All Branches (${activeHospitalBranches.length})`}
                  </option>
                  {activeHospitalBranches.map((br: string) => (
                    <option key={br} value={br}>
                      Branch: {br}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter Dropdown */}
              <div className="flex items-center gap-1.5 min-w-[130px]">
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <CalendarRange className="h-4 w-4" />
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

              {/* Month Filter Dropdown */}
              <div className="flex items-center gap-1.5 min-w-[155px]">
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="Filter by Month"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Bulk Download Button for Current Filters */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleDownloadAllPdfs()}
                disabled={isDownloadingZip || loading || totalCount === 0}
                className="h-8.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs gap-1.5 cursor-pointer whitespace-nowrap"
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
                    <span>Download All PDFs ({totalCount})</span>
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
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs">
              <div className="flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-indigo-700 dark:text-indigo-400">Active Filters:</span>
                {selectedHospitalId !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>Clinic: {clinicBreakdown.find((c) => c.hospitalId === selectedHospitalId)?.hospitalName || invoices.find((i) => i.assignedHospital?._id === selectedHospitalId)?.assignedHospital?.name || "Clinic"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHospitalId("ALL");
                        setCurrentPage(1);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear Clinic filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedBranch !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>Branch: {selectedBranch}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBranch("ALL");
                        setCurrentPage(1);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear Branch filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedYear !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>Year: {selectedYear}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYear("ALL");
                        setCurrentPage(1);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear Year filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedMonth !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>Month: {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonth("ALL");
                        setCurrentPage(1);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear Month filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>Status: {statusFilter}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setCurrentPage(1);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear Status filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {donorTypeFilter !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium capitalize text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>Type: {donorTypeFilter}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDonorTypeFilter("all");
                        setCurrentPage(1);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear Type filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
                    <span>Search: "{search}"</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setCurrentPage(1);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Clear Search"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <span className="text-slate-400">• Found {totalCount} {totalCount === 1 ? "invoice" : "invoices"}</span>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Table UX & Density Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1 text-xs">
          <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
            <span>Showing <strong className="text-slate-900 dark:text-slate-100">{invoices.length}</strong> of {totalCount || invoices.length} invoices</span>
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
                  { key: "clinic", label: "ART Clinic Name" },
                  { key: "pickup", label: "Pickup Date" },
                  { key: "deal", label: "Deal Price" },
                  { key: "received", label: "Received Amount" },
                  { key: "pending", label: "Pending Balance" },
                  { key: "status", label: "Payment Status" },
                ].map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none text-[11px] font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={(visibleColumns as any)[col.key]}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({ ...prev, [col.key]: e.target.checked }))
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

        {/* Table Content */}
        <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl relative shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 backdrop-blur-md bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
              <tr className="text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider whitespace-nowrap">
                {/* Select All Checkbox */}
                <th className={`${tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"} w-10 text-center`}>
                  <input
                    type="checkbox"
                    checked={invoices.length > 0 && invoices.every((i) => selectedIds.includes(i._id || i.registrationId))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Select all invoices on this page"
                  />
                </th>
                <th className={tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"}>Invoice #</th>
                <th className={tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"}>Registration & Donor</th>
                {visibleColumns.clinic && <th className={tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"}>ART Clinic Name</th>}
                {visibleColumns.pickup && <th className={tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"}>Pickup Date</th>}
                {visibleColumns.deal && <th className={`${tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"} text-right`}>Deal Price</th>}
                {visibleColumns.received && <th className={`${tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"} text-right`}>Received</th>}
                {visibleColumns.pending && <th className={`${tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"} text-right`}>Pending</th>}
                {visibleColumns.status && <th className={`${tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"} text-center`}>Status</th>}
                <th className={`${tableDensity === "compact" ? "py-2.5 px-3" : "py-3.5 px-4"} text-right sticky right-0 z-20 bg-slate-50/95 dark:bg-slate-900/95 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <TableSkeletonRows
                  columns={11}
                  rows={6}
                  density={tableDensity}
                />
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <Receipt className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    No invoices match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isReceived = inv.paymentStatus === "RECEIVED";
                  const isPartial = inv.paymentStatus === "PARTIALLY_RECEIVED";
                  const cellPad = tableDensity === "compact" ? "py-2 px-3 text-[11px]" : "py-3.5 px-4 text-xs";
                  const isSelected = selectedIds.includes(inv._id || inv.registrationId);

                  return (
                    <tr
                      key={inv.registrationId}
                      className={`group/row transition-colors ${
                        isSelected
                          ? "bg-indigo-50/50 dark:bg-indigo-950/30"
                          : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className={`${cellPad} w-10 text-center`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(inv._id || inv.registrationId)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="Select invoice"
                        />
                      </td>

                      {/* Invoice No */}
                      <td className={cellPad}>
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
                          <Receipt className="h-3.5 w-3.5 text-teal-600" />
                          #{inv.invoiceNumber}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.invoiceDate}</span>
                      </td>

                      {/* Reg ID & Donor */}
                      <td className={cellPad}>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {inv.donorName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 whitespace-nowrap">
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                            {inv.registrationId}
                          </span>
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                              inv.donorType === "egg"
                                ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300"
                                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                            }`}
                          >
                            {(inv.donorType || "EGG").toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* ART Clinic */}
                      {visibleColumns.clinic && (
                        <td className={cellPad}>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {inv.assignedHospital?.name || "Unassigned ART Clinic"}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {inv.assignedHospital?.code && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Code: {inv.assignedHospital.code}
                              </span>
                            )}
                            {inv.assignedBranch && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-900/50">
                                <GitBranch className="h-2.5 w-2.5" />
                                {inv.assignedBranch}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Pickup Date */}
                      {visibleColumns.pickup && (
                        <td className={`${cellPad} text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono`}>
                          {inv.pickupDate || "N/A"}
                        </td>
                      )}

                      {/* Deal Price */}
                      {visibleColumns.deal && (
                        <td className={`${cellPad} text-right font-bold text-slate-900 dark:text-slate-100 font-mono whitespace-nowrap`}>
                          {formatInr(inv.dealPrice)}
                        </td>
                      )}

                      {/* Received */}
                      {visibleColumns.received && (
                        <td className={`${cellPad} text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap`}>
                          {formatInr(inv.receivedAmount)}
                        </td>
                      )}

                      {/* Pending */}
                      {visibleColumns.pending && (
                        <td className={`${cellPad} text-right font-bold text-rose-600 dark:text-rose-400 font-mono whitespace-nowrap`}>
                          {formatInr(inv.pendingAmount)}
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className={`${cellPad} text-center whitespace-nowrap`}>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                      )}

                      {/* Actions: Strictly one View PDF button and one Update Payment pathway */}
                      <td className={`${cellPad} text-right whitespace-nowrap sticky right-0 z-10 bg-white group-hover/row:bg-slate-50 dark:bg-slate-950 dark:group-hover/row:bg-slate-900 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]`}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Only One View PDF Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(inv)}
                            className="h-7 px-2 text-sky-600 hover:text-sky-800 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg font-semibold text-xs gap-1 cursor-pointer"
                            title="View Official Invoice PDF"
                          >
                            <Eye className="h-3.5 w-3.5 text-sky-600" />
                            View PDF
                          </Button>

                          {/* 2. Only One Way to Fill/Update Payment */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPayment(inv)}
                            className="h-7 px-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg font-semibold text-xs gap-1 cursor-pointer"
                            title="Record / Update Payment Details"
                          >
                            <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                            Update Payment
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setItemsPerPage}
            itemName="invoices"
            loading={loading}
          />
        )}
      </div>

      {/* Floating Bulk Action Bar for Selected Invoices */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </div>
            <span className="text-xs font-semibold text-slate-200">
              {selectedIds.length === 1 ? "1 Invoice Selected" : `${selectedIds.length} Invoices Selected`}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700" />

          <Button
            size="sm"
            onClick={() => handleDownloadAllPdfs()}
            disabled={isDownloadingZip}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-sm cursor-pointer"
          >
            {isDownloadingZip ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>
                  {downloadProgress ? `Generating (${downloadProgress.current}/${downloadProgress.total})...` : "Downloading..."}
                </span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download Selected PDFs (.ZIP)</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-2 cursor-pointer"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* PAYMENT UPDATE MODAL */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Record Clinic Payment
            </DialogTitle>
            <DialogDescription>
              Update payment receipt details for registration {paymentForm.registrationId}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Agreed Deal Price
              </label>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatInr(paymentForm.dealPrice)}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Payment Status
              </label>
              <select
                value={paymentForm.paymentStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentForm((prev) => ({
                    ...prev,
                    paymentStatus: val,
                    receivedAmount: val === "RECEIVED" ? prev.dealPrice : prev.receivedAmount,
                  }));
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="PENDING">PENDING (Unpaid)</option>
                <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
                <option value="RECEIVED">RECEIVED (Fully Paid)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Amount Received (INR)
              </label>
              <Input
                type="number"
                value={paymentForm.receivedAmount}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    receivedAmount: Number(e.target.value),
                    paymentStatus:
                      Number(e.target.value) >= prev.dealPrice
                        ? "RECEIVED"
                        : Number(e.target.value) > 0
                        ? "PARTIALLY_RECEIVED"
                        : "PENDING",
                  }))
                }
                min={0}
                max={paymentForm.dealPrice}
                className="h-10"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pending Balance: {formatInr(Math.max(0, paymentForm.dealPrice - paymentForm.receivedAmount))}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Payment Reference / UTR No.
              </label>
              <Input
                type="text"
                placeholder="e.g. UTR123456789, Cheque #0912"
                value={paymentForm.paymentReference}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, paymentReference: e.target.value }))
                }
                className="h-10"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Internal Account Notes
              </label>
              <Input
                type="text"
                placeholder="Bank name, receipt details or remarks..."
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="h-10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {actionLoading ? "Saving..." : "Save Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* COMPLETED FILE INVOICE MODAL PREVIEW & DOWNLOAD (STRICTLY VIEW-ONLY) */}
      {selectedInvoice && (
        <CompletedFileInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          readOnly={true}
          registration={selectedInvoice}
          donorType={selectedInvoice.donorType === "sperm" ? "sperm" : "egg"}
        />
      )}
    </div>
  );
}
