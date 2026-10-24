"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
  FileText,
  History,
  FileCheck,
  BarChart3,
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
import { RecordClinicPaymentModal } from "./RecordClinicPaymentModal";
import { DonorPaymentHistoryModal } from "./DonorPaymentHistoryModal";
import { ClinicTransactionsTab } from "./ClinicTransactionsTab";

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
    ? [hosp.addressLine1, hosp.city, hosp.state ? `${hosp.state}` : ""].filter(Boolean).join(", ")
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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [clinicBreakdown, setClinicBreakdown] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    awaitingCount: 0,
    invoicedCount: 0,
    noInvoiceCount: 0,
    paidInvoicesCount: 0,
    pendingInvoicesCount: 0,
    partialInvoicesCount: 0,
    totalBilledAmount: 0,
    totalReceivedAmount: 0,
    totalTdsAmount: 0,
    totalGstAmount: 0,
    totalPendingAmount: 0,
    paidPercentage: 0,
  });

  // Main Active Tab: "BILLING" | "TRANSACTIONS"
  const [mainTab, setMainTab] = useState<"BILLING" | "TRANSACTIONS">("BILLING");

  // Billing Mode Sub-Tab: "ALL" | "AWAITING" | "INVOICED" | "NO_INVOICE"
  const [modeTab, setModeTab] = useState<"ALL" | "AWAITING" | "INVOICED" | "NO_INVOICE">("ALL");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedFy, setSelectedFy] = useState("ALL");
  const [selectedQuarter, setSelectedQuarter] = useState("ALL");
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

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [selectedGeneratingDonor, setSelectedGeneratingDonor] = useState<any | null>(null);

  // Multi-donor Record Payment Modal state
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [paymentModalHospId, setPaymentModalHospId] = useState<string | undefined>(undefined);
  const [paymentModalRegId, setPaymentModalRegId] = useState<string | undefined>(undefined);

  // Donor Payment History Modal state
  const [historyModalDonor, setHistoryModalDonor] = useState<any | null>(null);

  // Table UX & Density controls
  const [tableDensity, setTableDensity] = useState<"compact" | "comfortable">("comfortable");
  const [visibleColumns, setVisibleColumns] = useState({
    clinic: true,
    pickup: true,
    mode: true,
    deal: true,
    received: true,
    pending: true,
    status: true,
  });

  // Active branches for selected clinic
  const activeHospitalBranches: string[] = useMemo(() => {
    const branchSet = new Set<string>();

    if (selectedHospitalId === "ALL") {
      availableBranches.forEach((b) => branchSet.add(b));
    } else {
      const found = clinicBreakdown.find((c) => c.hospitalId === selectedHospitalId);
      if (found?.branches && Array.isArray(found.branches)) {
        found.branches.forEach((b: any) => {
          const name = typeof b === "string" ? b : b.branchName || b.name;
          if (name) branchSet.add(name);
        });
      }
    }
    return Array.from(branchSet).filter(Boolean).sort();
  }, [selectedHospitalId, clinicBreakdown, availableBranches]);

  // Load Invoices / Billable Records
  async function loadInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
      if (selectedBranch && selectedBranch !== "ALL") params.append("branch", selectedBranch);
      if (selectedYear && selectedYear !== "ALL") params.append("year", selectedYear);
      if (selectedMonth && selectedMonth !== "ALL") params.append("month", selectedMonth);
      if (selectedFy && selectedFy !== "ALL") params.append("fy", selectedFy);
      if (selectedQuarter && selectedQuarter !== "ALL") params.append("quarter", selectedQuarter);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (donorTypeFilter) params.append("donorType", donorTypeFilter);
      if (modeTab !== "ALL") params.append("mode", modeTab);
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setInvoices(data.invoices || []);
        setAllInvoices(data.allMatchingInvoices || []);
        setClinicBreakdown(data.clinicBreakdown || []);
        setStats(data.stats || {});
        setAvailableYears(data.availableYears || [2027, 2026, 2025, 2024]);
        setAvailableBranches(data.availableBranches || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        toast.error(data.error || "Failed to load billing records");
      }
    } catch {
      toast.error("Network error loading invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mainTab === "BILLING") {
      loadInvoices();
    }
  }, [
    selectedHospitalId,
    selectedBranch,
    selectedYear,
    selectedMonth,
    selectedFy,
    selectedQuarter,
    statusFilter,
    donorTypeFilter,
    modeTab,
    currentPage,
    itemsPerPage,
    mainTab,
  ]);

  // Bulk Download Zip
  const handleDownloadAllPdfs = async () => {
    const listToDownload = invoices.filter((i) => i.hasInvoice);
    if (listToDownload.length === 0) {
      toast.error("No invoiced records available to download in current view");
      return;
    }

    setIsDownloadingZip(true);
    setDownloadProgress({ current: 0, total: listToDownload.length });
    try {
      const zip = new JSZip();
      for (let i = 0; i < listToDownload.length; i++) {
        const item = listToDownload[i];
        setDownloadProgress({ current: i + 1, total: listToDownload.length });
        const pdfData = convertInvoiceToPdfData(item);
        const blob = await pdf(<CompletedFileInvoicePdfDocument data={pdfData} />).toBlob();
        const safeName = `${item.invoiceNumber || item.registrationId}_${item.donorName}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        zip.file(`Invoice_${safeName}.pdf`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Mediyaz_Invoices_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${listToDownload.length} invoice PDFs!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to download invoice PDFs");
    } finally {
      setIsDownloadingZip(false);
      setDownloadProgress(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(invoices.map((i) => i._id || i.registrationId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Change Billing Mode (Single or Bulk)
  const handleChangeBillingMode = async (
    registrationIds: string[],
    newMode: "NO_INVOICE" | "AWAITING" | "INVOICED"
  ) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-billing-mode",
          registrationIds,
          billingMode: newMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Marked as ${newMode}`);
        setSelectedIds([]);
        loadInvoices();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Open Payment Modal for specific donor
  const handleOpenRecordPaymentForDonor = (inv: any) => {
    setPaymentModalHospId(inv.assignedHospital?._id);
    setPaymentModalRegId(inv.registrationId);
    setIsRecordPaymentModalOpen(true);
  };

  // Open Invoice Preview Modal
  const handleViewInvoice = (inv: any) => {
    setSelectedInvoice({
      ...inv,
      personalInfo: { fullName: inv.donorName },
    });
    setIsInvoiceModalOpen(true);
  };

  // Generate Invoice on the fly
  const handleGenerateInvoice = (inv: any) => {
    setSelectedGeneratingDonor({
      ...inv,
      personalInfo: { fullName: inv.donorName },
    });
    setIsGeneratingInvoice(true);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = (allInvoices.length > 0 ? allInvoices : invoices).map((inv, idx) => ({
        "S.No": idx + 1,
        "Billing Mode": inv.billingMode,
        "Invoice / Bill Ref": inv.invoiceNumber || inv.billRef || "Awaiting",
        "Pickup Date": inv.pickupDate,
        "Reg ID": inv.registrationId,
        "Donor Name": inv.donorName,
        "Donor Type": (inv.donorType || "").toUpperCase(),
        "ART Clinic Name": inv.assignedHospital?.name || "N/A",
        "Clinic Branch": inv.assignedBranch || "Main Branch",
        "Deal Price (INR)": inv.dealPrice,
        "Service Charge (INR)": inv.serviceCharge,
        "GST Amount (INR)": inv.gstAmount,
        "TDS Amount (INR)": inv.tdsAmount,
        "Received Amount (INR)": inv.receivedAmount,
        "Pending Due (INR)": inv.pendingAmount,
        "Payment Status": inv.paymentStatus,
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Billing_Tracker");
      XLSX.writeFile(wb, `Mediyaz_Billing_Tracker_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exported successfully!");
    } catch {
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
                Invoice & Billing Manager
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                TDS & GST Audited
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Pickup date billing queue, invoice generator, clinic multi-donor transactions, and tax tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => {
              setPaymentModalHospId(undefined);
              setPaymentModalRegId(undefined);
              setIsRecordPaymentModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            + Record Clinic Payment
          </Button>

          <Link href="/reports/finance">
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs h-9 gap-1.5 font-semibold"
            >
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Tax & Finance Reports
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            disabled={loading}
            className="text-xs h-9 gap-1.5 border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs h-9 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainTab("BILLING")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mainTab === "BILLING"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Receipt className="h-4 w-4" />
            Billing Queue & Invoices
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                mainTab === "BILLING" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {stats.totalInvoices}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("TRANSACTIONS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mainTab === "TRANSACTIONS"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Clinic Payments & Advance Credits
          </button>
        </div>
      </div>

      {mainTab === "TRANSACTIONS" ? (
        <ClinicTransactionsTab
          hospitals={clinicBreakdown}
          onOpenRecordPayment={() => {
            setPaymentModalHospId(undefined);
            setPaymentModalRegId(undefined);
            setIsRecordPaymentModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* KPI Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Billed */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Billed
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {formatInr(stats.totalBilledAmount)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats.totalInvoices} Total Billable Donors</p>
            </div>

            {/* Total Received */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Net Cash Received
              </span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatInr(stats.totalReceivedAmount)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats.paidInvoicesCount} Fully Settled</p>
            </div>

            {/* Total TDS */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                TDS Deducted
              </span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatInr(stats.totalTdsAmount)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Form 16A Deductions</p>
            </div>

            {/* Total GST */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                GST Output
              </span>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {formatInr(stats.totalGstAmount)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">18% On Service Charges</p>
            </div>

            {/* Outstanding Due */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {formatInr(stats.totalPendingAmount)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats.pendingInvoicesCount} Due Cases</p>
            </div>
          </div>

          {/* Billing Mode Sub-Tabs (Awaiting / Invoiced / No-Invoice) */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => {
                setModeTab("ALL");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                modeTab === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All Billable ({stats.totalInvoices})
            </button>

            <button
              type="button"
              onClick={() => {
                setModeTab("AWAITING");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                modeTab === "AWAITING"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-sky-700 dark:text-sky-400 hover:bg-sky-100/50"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Awaiting Invoice ({stats.awaitingCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setModeTab("INVOICED");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                modeTab === "INVOICED"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50"
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              Invoiced ({stats.invoicedCount})
            </button>

            <button
              type="button"
              onClick={() => {
                setModeTab("NO_INVOICE");
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                modeTab === "NO_INVOICE"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-purple-700 dark:text-purple-400 hover:bg-purple-100/50"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Without Invoice ({stats.noInvoiceCount})
            </button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-[260px] flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by Donor, Reg ID, Invoice #, Bill Ref, Clinic..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-9 rounded-xl text-xs bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Clinic Select */}
                  <select
                    value={selectedHospitalId}
                    onChange={(e) => {
                      setSelectedHospitalId(e.target.value);
                      setSelectedBranch("ALL");
                      setCurrentPage(1);
                    }}
                    className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Partner Clinics ({clinicBreakdown.length})</option>
                    {clinicBreakdown.map((c) => (
                      <option key={c.hospitalId} value={c.hospitalId}>
                        {c.hospitalName}
                      </option>
                    ))}
                  </select>

                  {/* Financial Year */}
                  <select
                    value={selectedFy}
                    onChange={(e) => {
                      setSelectedFy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Financial Years</option>
                    <option value="2027-28">FY 2027-28</option>
                    <option value="2026-27">FY 2026-27</option>
                    <option value="2025-26">FY 2025-26</option>
                    <option value="2024-25">FY 2024-25</option>
                  </select>

                  {/* Quarter */}
                  <select
                    value={selectedQuarter}
                    onChange={(e) => {
                      setSelectedQuarter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Quarters</option>
                    <option value="Q1">Q1 (Apr - Jun)</option>
                    <option value="Q2">Q2 (Jul - Sep)</option>
                    <option value="Q3">Q3 (Oct - Dec)</option>
                    <option value="Q4">Q4 (Jan - Mar)</option>
                  </select>

                  {/* Payment Status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="PAID">Fully Received</option>
                    <option value="PARTIALLY_RECEIVED">Partially Received</option>
                    <option value="PENDING">Pending / Due</option>
                  </select>

                  {/* Donor Type */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDonorTypeFilter("all")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        donorTypeFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonorTypeFilter("egg")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        donorTypeFilter === "egg" ? "bg-white text-pink-600 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Egg
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonorTypeFilter("sperm")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        donorTypeFilter === "sperm" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Sperm
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          invoices.length > 0 &&
                          invoices.every((i) => selectedIds.includes(i._id || i.registrationId))
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                      />
                    </th>
                    <th className="py-3 px-3">Billing Status / Ref</th>
                    <th className="py-3 px-3">Donor & Reg ID</th>
                    <th className="py-3 px-3">ART Clinic & Branch</th>
                    <th className="py-3 px-3">Pickup Date</th>
                    <th className="py-3 px-3 text-right">Deal Price</th>
                    <th className="py-3 px-3 text-right">TDS</th>
                    <th className="py-3 px-3 text-right">Cash Received</th>
                    <th className="py-3 px-3 text-right">Pending Due</th>
                    <th className="py-3 px-3 text-center">Payment Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <TableSkeletonRows columns={11} rows={6} density={tableDensity} />
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-500">
                        <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                        No donors or invoices found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => {
                      const isSelected = selectedIds.includes(inv._id || inv.registrationId);
                      const isAwaiting = inv.billingMode === "AWAITING";
                      const isNoInvoice = inv.billingMode === "NO_INVOICE";
                      const isInvoiced = inv.billingMode === "INVOICED" || inv.hasInvoice;

                      return (
                        <tr
                          key={inv.registrationId}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(inv._id || inv.registrationId)}
                              className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                            />
                          </td>

                          {/* Billing Status & Ref */}
                          <td className="py-3 px-3">
                            {isInvoiced ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                                  #{inv.invoiceNumber}
                                </span>
                              </div>
                            ) : isNoInvoice ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                                  Direct Bill
                                </span>
                                {inv.billRef && (
                                  <div className="text-[10px] font-mono text-purple-700 dark:text-purple-400">
                                    {inv.billRef}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200">
                                Awaiting Invoice
                              </span>
                            )}
                          </td>

                          {/* Donor & Reg */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {inv.donorName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {inv.registrationId} ({inv.donorType})
                            </div>
                          </td>

                          {/* Clinic & Branch */}
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {inv.assignedHospital?.name || "Unassigned Clinic"}
                            </div>
                            <div className="text-[10px] text-slate-500">{inv.assignedBranch}</div>
                          </td>

                          {/* Pickup Date */}
                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {inv.pickupDate || "-"}
                          </td>

                          {/* Deal Price */}
                          <td className="py-3 px-3 text-right font-medium text-slate-900 dark:text-slate-100">
                            ₹{inv.dealPrice?.toLocaleString("en-IN")}
                          </td>

                          {/* TDS */}
                          <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 font-medium">
                            ₹{(inv.tdsAmount || 0).toLocaleString("en-IN")}
                          </td>

                          {/* Received */}
                          <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            ₹{(inv.receivedAmount || 0).toLocaleString("en-IN")}
                          </td>

                          {/* Pending */}
                          <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                            ₹{(inv.pendingAmount || 0).toLocaleString("en-IN")}
                          </td>

                          {/* Payment Status */}
                          <td className="py-3 px-3 text-center">
                            {inv.paymentStatus === "RECEIVED" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                FULLY PAID
                              </span>
                            ) : inv.paymentStatus === "PARTIALLY_RECEIVED" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                PARTIAL
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                PENDING
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* If Awaiting or No Invoice: Generate Invoice */}
                              {!isInvoiced && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleGenerateInvoice(inv)}
                                  className="h-7 px-2 text-indigo-600 hover:text-indigo-800 text-xs font-semibold gap-1"
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                  Generate Inv
                                </Button>
                              )}

                              {/* Toggle No-Invoice Needed */}
                              {isAwaiting && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleChangeBillingMode([inv.registrationId], "NO_INVOICE")
                                  }
                                  className="h-7 px-2 text-purple-600 hover:text-purple-800 text-xs font-medium gap-1"
                                >
                                  No Inv
                                </Button>
                              )}

                              {/* If Invoiced: View PDF */}
                              {isInvoiced && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewInvoice(inv)}
                                  className="h-7 px-2 text-sky-600 hover:text-sky-800 text-xs font-semibold gap-1"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View PDF
                                </Button>
                              )}

                              {/* Record Payment */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRecordPaymentForDonor(inv)}
                                className="h-7 px-2 text-emerald-600 hover:text-emerald-800 text-xs font-semibold gap-1"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                Pay
                              </Button>

                              {/* Payment History */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHistoryModalDonor(inv)}
                                className="h-7 px-2 text-slate-500 hover:text-slate-800 text-xs font-medium gap-1"
                                title="View Payment History"
                              >
                                <History className="h-3.5 w-3.5" />
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <CustomPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold">{selectedIds.length} Cases Selected</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700" />

          <Button
            size="sm"
            onClick={() => handleChangeBillingMode(selectedIds, "NO_INVOICE")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8 gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Mark &quot;No Invoice Needed&quot;
          </Button>

          <Button
            size="sm"
            onClick={() => handleDownloadAllPdfs()}
            disabled={isDownloadingZip}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Download Invoices (.ZIP)
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-400 hover:text-white h-8 px-2"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Multi-Donor Record Payment Modal */}
      {isRecordPaymentModalOpen && (
        <RecordClinicPaymentModal
          isOpen={isRecordPaymentModalOpen}
          onClose={() => {
            setIsRecordPaymentModalOpen(false);
            setPaymentModalHospId(undefined);
            setPaymentModalRegId(undefined);
          }}
          onSuccess={() => {
            loadInvoices();
          }}
          hospitals={clinicBreakdown}
          preselectedHospitalId={paymentModalHospId}
          preselectedRegistrationId={paymentModalRegId}
        />
      )}

      {/* Donor Payment History Modal */}
      {historyModalDonor && (
        <DonorPaymentHistoryModal
          isOpen={Boolean(historyModalDonor)}
          onClose={() => setHistoryModalDonor(null)}
          donor={historyModalDonor}
        />
      )}

      {/* Invoice PDF Preview Modal */}
      {isInvoiceModalOpen && selectedInvoice && (
        <CompletedFileInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          registration={selectedInvoice}
          donorType={selectedInvoice.donorType === "sperm" ? "sperm" : "egg"}
          readOnly={true}
        />
      )}

      {/* On-the-fly Invoice Generator Modal */}
      {isGeneratingInvoice && selectedGeneratingDonor && (
        <CompletedFileInvoiceModal
          isOpen={isGeneratingInvoice}
          onClose={() => {
            setIsGeneratingInvoice(false);
            setSelectedGeneratingDonor(null);
          }}
          registration={selectedGeneratingDonor}
          donorType={selectedGeneratingDonor.donorType === "sperm" ? "sperm" : "egg"}
          readOnly={false}
          onInvoiceSaved={() => {
            loadInvoices();
          }}
        />
      )}
    </div>
  );
}
