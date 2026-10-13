"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const formatInr = (amount: number) => {
  return "₹" + (amount || 0).toLocaleString("en-IN");
};

const toInputDate = (dateVal?: string) => {
  if (!dateVal) return "";
  if (dateVal.includes("-") && dateVal.length >= 10) return dateVal.split("T")[0];
  const parts = dateVal.split(".");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
};

export function LedgerDirectory() {
  const [activeTab, setActiveTab] = useState<"clinic" | "donor">("clinic");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | RECEIVED/PAID | PENDING | PARTIAL
  const [donorTypeFilter, setDonorTypeFilter] = useState("all"); // all | egg | sperm

  // Modals state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<"clinic" | "donor">("clinic");
  const [updateForm, setUpdateForm] = useState({
    registrationId: "",
    donorType: "egg",
    totalAmount: 0,
    amount: 0,
    status: "PENDING",
    reference: "",
    method: "bank_transfer",
    notes: "",
    invoiceNumber: "",
    invoiceDate: "",
    receivedDate: "",
    tdsPercentage: 2,
    tdsAmount: 0,
  });

  // Fetch Ledger Records
  async function loadLedgerData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (donorTypeFilter) params.append("donorType", donorTypeFilter);

      const res = await fetch(`/api/ledger?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
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
    loadLedgerData();
  }, [selectedHospitalId, statusFilter, donorTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLedgerData();
  };

  // BUILD PDF URL
  const buildLedgerPdfUrl = (type: "clinic" | "donor", isPreview: boolean = true) => {
    const params = new URLSearchParams();
    params.append("type", type);
    if (isPreview) params.append("preview", "true");
    if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
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

  // Open Edit Modal for Clinic
  const handleOpenClinicEdit = (entry: any) => {
    setUpdateTarget("clinic");
    const tdsRate = entry.tdsPercentage !== undefined && entry.tdsPercentage !== null ? Number(entry.tdsPercentage) : 2;
    const tdsAmt = entry.tdsAmount !== undefined && entry.tdsAmount !== null ? Number(entry.tdsAmount) : Math.round((entry.dealPrice || 0) * (tdsRate / 100));
    setUpdateForm({
      registrationId: entry.registrationId,
      donorType: entry.donorType || "egg",
      totalAmount: entry.dealPrice,
      amount: entry.receivedAmount || 0,
      status: entry.paymentStatus,
      reference: entry.paymentRef || "",
      method: "bank_transfer",
      notes: "",
      invoiceNumber: entry.invoiceNumber || "",
      invoiceDate: toInputDate(entry.invoiceDate),
      receivedDate: toInputDate(entry.receivedDate),
      tdsPercentage: tdsRate,
      tdsAmount: tdsAmt,
    });
    setIsUpdateModalOpen(true);
  };

  // Open Edit Modal for Donor
  const handleOpenDonorEdit = (entry: any) => {
    setUpdateTarget("donor");
    setUpdateForm({
      registrationId: entry.registrationId,
      donorType: entry.donorType || "egg",
      totalAmount: entry.compensationAmount,
      amount: entry.paidAmount || 0,
      status: entry.paymentStatus,
      reference: entry.paymentRef || "",
      method: entry.paymentMethod || "bank_transfer",
      notes: "",
      invoiceNumber: "",
      invoiceDate: "",
      receivedDate: "",
      tdsPercentage: 0,
      tdsAmount: 0,
    });
    setIsUpdateModalOpen(true);
  };

  // Submit Update
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/ledger", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: updateForm.registrationId,
          donorType: updateForm.donorType,
          target: updateTarget,
          status: updateForm.status,
          amount: updateForm.amount,
          reference: updateForm.reference,
          method: updateForm.method,
          notes: updateForm.notes,
          invoiceNumber: updateForm.invoiceNumber,
          invoiceDate: updateForm.invoiceDate,
          receivedDate: updateForm.receivedDate,
          tdsPercentage: updateForm.tdsPercentage,
          tdsAmount: updateForm.tdsAmount,
          dealPrice: updateForm.totalAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Ledger updated successfully!");
        setIsUpdateModalOpen(false);
        loadLedgerData();
      } else {
        toast.error(data.error || "Failed to update ledger");
      }
    } catch {
      toast.error("Network error while updating");
    } finally {
      setActionLoading(false);
    }
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
                Laser System
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

          {/* DOWNLOAD PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadPdf(activeTab)}
            disabled={pdfGenerating || loading}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 gap-1.5 h-10"
            title="Download PDF statement file directly"
          >
            <Download className={`h-4 w-4 text-emerald-600 ${pdfGenerating ? "animate-bounce" : ""}`} />
            Download PDF
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Deal Payment (Billed)
              </p>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {formatInr(clinicTotals.totalDealPrice)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across {clinicTotals.totalRecords} Completed Deals</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Total Payment Received
              </p>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {formatInr(clinicTotals.totalReceived)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Realized Bank Collections</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Total Payment Pending
              </p>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                {formatInr(clinicTotals.totalPending)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total Outstanding Clinic Balance</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Collection Rate
              </p>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">
                {clinicTotals.collectionRate}%
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 mt-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${clinicTotals.collectionRate}%` }}
                />
              </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search Reg No, Clinic, or Donor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="ALL">All ART Clinics</option>
                  {clinicAccounts.map((a) => (
                    <option key={a.hospitalId} value={a.hospitalId}>
                      {a.hospitalName} ({a.totalCases})
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="ALL">All Payment Status</option>
                  <option value="RECEIVED">Received (Paid)</option>
                  <option value="PENDING">Pending (Due)</option>
                  <option value="PARTIAL">Partially Received</option>
                </select>

                <select
                  value={donorTypeFilter}
                  onChange={(e) => setDonorTypeFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="all">All Donor Types</option>
                  <option value="egg">Egg Donors</option>
                  <option value="sperm">Sperm Donors</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase font-bold text-[10px] whitespace-nowrap">
                    <th className="py-3 px-2.5 text-center w-8">#</th>
                    <th className="py-3 px-2.5">Donor Name</th>
                    <th className="py-3 px-2.5">Registration No.</th>
                    <th className="py-3 px-2.5">Clinic Name</th>
                    <th className="py-3 px-2.5">Location</th>
                    <th className="py-3 px-2.5">Donor OPU Location</th>
                    <th className="py-3 px-2.5">Donor OPU Date</th>
                    <th className="py-3 px-2.5">Invoice Date</th>
                    <th className="py-3 px-2.5">Invoice No.</th>
                    <th className="py-3 px-2.5 text-right">Amount</th>
                    <th className="py-3 px-2.5 text-right">TDS -</th>
                    <th className="py-3 px-2.5 text-right">GST +</th>
                    <th className="py-3 px-2.5 text-right">Net Amount</th>
                    <th className="py-3 px-2.5">Credit Date</th>
                    <th className="py-3 px-2.5 text-right">Credit Amount</th>
                    <th className="py-3 px-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-1.5" />
                        Loading clinic ledger...
                      </td>
                    </tr>
                  ) : clinicEntries.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-500">
                        <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300">No invoiced records found</div>
                        <div className="text-xs text-slate-400 mt-1">Donors will appear in the Clinic Ledger once their Tax Invoice is generated in Completed Files.</div>
                      </td>
                    </tr>
                  ) : (
                    clinicEntries.map((entry) => {
                      const isReceived = entry.paymentStatus === "RECEIVED";
                      const isPartial = entry.paymentStatus === "PARTIALLY_RECEIVED";
                      const grossAmt = entry.amount || entry.dealPrice || 0;
                      const tdsAmt = entry.tdsAmount || 0;
                      const gstAmt = entry.gstAmount || 0;
                      const netAmt = entry.netAmount || Math.max(0, grossAmt - tdsAmt + gstAmt);
                      const credAmt = entry.creditAmount !== undefined ? entry.creditAmount : entry.receivedAmount || 0;
                      const credDate = entry.creditDate && entry.creditDate !== "-" ? entry.creditDate : (entry.receivedDate || (isReceived ? "Cleared" : "Pending"));

                      return (
                        <tr
                          key={entry.registrationId}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors whitespace-nowrap text-xs"
                        >
                          <td className="py-2.5 px-2.5 text-center text-slate-400 font-mono">
                            {entry.sNo}
                          </td>
                          <td className="py-2.5 px-2.5 font-bold text-slate-900 dark:text-slate-100">
                            <div>{entry.donorName}</div>
                          </td>
                          <td className="py-2.5 px-2.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              {entry.registrationId}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {entry.donorType ? entry.donorType.toUpperCase() : "DONOR"}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            {entry.clinicName || entry.hospitalName || "N/A"}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-400">
                            {entry.location || entry.hospitalLocation || entry.hospitalCity || "-"}
                          </td>
                          <td className="py-2.5 px-2.5 font-medium text-slate-700 dark:text-slate-300">
                            {entry.donorOpuLocation || entry.opuLocation || "-"}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-700 dark:text-slate-300">
                            {entry.donorOpuDate || entry.opuDate || entry.pickupDate || "-"}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono text-slate-600 dark:text-slate-400">
                            {entry.invoiceDate || "-"}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {entry.invoiceNumber
                              ? entry.invoiceNumber.startsWith("#")
                                ? entry.invoiceNumber
                                : `#${entry.invoiceNumber}`
                              : "N/A"}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {formatInr(grossAmt)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-semibold text-orange-600 dark:text-orange-400">
                            <div>{tdsAmt > 0 ? `-${formatInr(tdsAmt)}` : "₹0"}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {entry.tdsPercentage ? `(${entry.tdsPercentage}%)` : "0%"}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            <div>{gstAmt > 0 ? `+${formatInr(gstAmt)}` : "₹0"}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {gstAmt > 0 ? "18% on SC" : "Exempt"}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-black text-teal-700 dark:text-teal-300">
                            {formatInr(netAmt)}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {credDate}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
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
                          <td className="py-2.5 px-2.5 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenClinicEdit(entry)}
                              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs"
                            >
                              Update
                            </Button>
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
                      <td colSpan={9} className="py-3 px-3 uppercase tracking-wider">
                        GRAND TOTAL ({clinicTotals.totalRecords} TRANSACTIONS)
                      </td>
                      <td className="py-3 px-2.5 text-right font-black">
                        {formatInr(clinicTotals.totalDealPrice)}
                      </td>
                      <td className="py-3 px-2.5 text-right font-semibold text-orange-600">
                        -{formatInr((clinicTotals as any).totalTdsAmount || 0)}
                      </td>
                      <td className="py-3 px-2.5 text-right font-semibold text-emerald-600">
                        +{formatInr((clinicTotals as any).totalGstAmount || 0)}
                      </td>
                      <td className="py-3 px-2.5 text-right font-black text-teal-700 dark:text-teal-300">
                        {formatInr((clinicTotals as any).totalNetAmount || (clinicTotals.totalDealPrice - ((clinicTotals as any).totalTdsAmount || 0) + ((clinicTotals as any).totalGstAmount || 0)))}
                      </td>
                      <td className="py-3 px-2.5 text-center text-[10px] text-muted-foreground font-mono">
                        {clinicTotals.collectionRate}% CLEARED
                      </td>
                      <td className="py-3 px-2.5 text-right text-emerald-600 dark:text-emerald-400 font-black">
                        {formatInr(clinicTotals.totalReceived)}
                      </td>
                      <td className="py-3 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleViewPdf("clinic")}
                            className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] gap-1 font-semibold px-2.5 rounded-lg shadow-xs"
                            title="View Clinic Ledger PDF statement"
                          >
                            <Eye className="h-3 w-3" />
                            View PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPdfNewTab("clinic")}
                            className="h-7 w-7 p-0 rounded-lg border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            title="Open in new browser tab"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DONOR LEDGER VIEW */}
      {activeTab === "donor" && (
        <div className="space-y-6">
          {/* Donor Ledger KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Agreed Compensation
              </p>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {formatInr(donorTotals.totalCompensation)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across {donorTotals.totalDonors} Donors Handled</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Total Disbursed to Donors
              </p>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {formatInr(donorTotals.totalPaid)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Bank Payouts Settled</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Pending Donor Payouts
              </p>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                {formatInr(donorTotals.totalPending)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Outstanding Reimbursements</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Disbursement Settlement
              </p>
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="ALL">All Payment Status</option>
                  <option value="PAID">Paid in Full</option>
                  <option value="PENDING">Pending Payout</option>
                  <option value="PARTIAL">Partially Paid</option>
                </select>

                <select
                  value={donorTypeFilter}
                  onChange={(e) => setDonorTypeFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                >
                  <option value="all">All Donor Types</option>
                  <option value="egg">Egg Donors</option>
                  <option value="sperm">Sperm Donors</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase font-bold text-[11px]">
                    <th className="py-3 px-3 text-center w-12">#</th>
                    <th className="py-3 px-3">Registration No.</th>
                    <th className="py-3 px-3">Donor Name & Details</th>
                    <th className="py-3 px-3">Assigned Clinic</th>
                    <th className="py-3 px-3 text-right">Agreed Compensation</th>
                    <th className="py-3 px-3 text-right">Paid to Donor</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-1.5" />
                        Loading donor ledger...
                      </td>
                    </tr>
                  ) : donorEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No donor payment records found.
                      </td>
                    </tr>
                  ) : (
                    donorEntries.map((entry) => {
                      const isPaid = entry.paymentStatus === "PAID";
                      const isPartial = entry.paymentStatus === "PARTIALLY_PAID";

                      return (
                        <tr
                          key={entry.registrationId}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3 text-center text-slate-400 font-mono">
                            {entry.sNo}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                              {entry.registrationId}
                            </span>
                            {entry.date && (
                              <div className="text-[10px] text-slate-400">{entry.date}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {entry.donorName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {entry.donorType.toUpperCase()}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {entry.hospitalName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Method: {entry.paymentMethod.replace("_", " ").toUpperCase()}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            {formatInr(entry.compensationAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">
                            {formatInr(entry.paidAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-rose-600">
                            {formatInr(entry.balancePending)}
                          </td>
                          <td className="py-3 px-3 text-center">
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
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDonorEdit(entry)}
                              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs"
                            >
                              Disburse
                            </Button>
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
                      <td className="py-4 px-3 text-center text-xs text-teal-700 dark:text-teal-400">
                        {donorTotals.settlementRate}% SETTLED
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleViewPdf("donor")}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold px-3 rounded-full shadow-xs"
                            title="View Donor Ledger PDF statement to check details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPdfNewTab("donor")}
                            className="h-8 w-8 p-0 rounded-full border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            title="Open in new browser tab"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL FOR CLINIC OR DONOR */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              {updateTarget === "clinic" ? "Update Clinic Payment" : "Update Donor Payout"}
            </DialogTitle>
            <DialogDescription>
              Record transaction update for Registration #{updateForm.registrationId}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitUpdate} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Total Deal / Agreed Amount
              </label>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatInr(updateForm.totalAmount)}
              </div>
            </div>

            {updateTarget === "clinic" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Invoice Number
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. INV-054"
                      value={updateForm.invoiceNumber}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                      Invoice Date
                    </label>
                    <Input
                      type="date"
                      value={updateForm.invoiceDate}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Payment Received Date
                  </label>
                  <Input
                    type="date"
                    value={updateForm.receivedDate}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, receivedDate: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Transaction Status
              </label>
              <select
                value={updateForm.status}
                onChange={(e) => {
                  const val = e.target.value;
                  setUpdateForm((prev) => ({
                    ...prev,
                    status: val,
                    amount:
                      val === "RECEIVED" || val === "PAID"
                        ? prev.totalAmount
                        : prev.amount,
                    receivedDate:
                      val === "RECEIVED" && !prev.receivedDate
                        ? new Date().toISOString().split("T")[0]
                        : prev.receivedDate,
                  }));
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option value="PENDING">PENDING (Unsettled)</option>
                <option value={updateTarget === "clinic" ? "PARTIALLY_RECEIVED" : "PARTIALLY_PAID"}>
                  PARTIAL
                </option>
                <option value={updateTarget === "clinic" ? "RECEIVED" : "PAID"}>
                  {updateTarget === "clinic" ? "RECEIVED (Full Settled)" : "PAID (Disbursed in Full)"}
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Amount {updateTarget === "clinic" ? "Received in Bank" : "Paid"} (INR)
              </label>
              <Input
                type="number"
                value={updateForm.amount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setUpdateForm((prev) => ({
                    ...prev,
                    amount: val,
                    status:
                      val >= prev.totalAmount
                        ? updateTarget === "clinic"
                          ? "RECEIVED"
                          : "PAID"
                        : val > 0
                        ? updateTarget === "clinic"
                          ? "PARTIALLY_RECEIVED"
                          : "PARTIALLY_PAID"
                        : "PENDING",
                  }));
                }}
                min={0}
                max={updateForm.totalAmount}
                className="h-10"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Remaining Balance:{" "}
                {formatInr(Math.max(0, updateForm.totalAmount - updateForm.amount))}
              </p>
            </div>

            {updateTarget === "donor" && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={updateForm.method}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, method: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="upi">UPI / Instant Transfer</option>
                  <option value="cheque">Bank Cheque</option>
                  <option value="cash">Cash Voucher</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Transaction Ref / UTR / Remarks
              </label>
              <Input
                type="text"
                placeholder="UTR number, cheque number, or bank reference"
                value={updateForm.reference}
                onChange={(e) => setUpdateForm((prev) => ({ ...prev, reference: e.target.value }))}
                className="h-10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {actionLoading ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
