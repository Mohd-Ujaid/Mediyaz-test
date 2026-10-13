"use client";

import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
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
  Sparkles,
  Heart,
  Dna,
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
import { CompletedFileInvoiceModal } from "@/features/completed-files/components/CompletedFileInvoiceModal";

const formatInr = (amount: number) => {
  return "₹" + (amount || 0).toLocaleString("en-IN");
};

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
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PAID | PENDING | PARTIALLY_RECEIVED
  const [donorTypeFilter, setDonorTypeFilter] = useState("all"); // all | egg | sperm
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
  }, [currentPage, selectedHospitalId, statusFilter, donorTypeFilter]);

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
    if (!confirm(`Mark invoice #${inv.invoiceNumber} (${inv.registrationId}) as FULLY RECEIVED?`)) return;
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
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by Invoice No, Reg ID, Donor, or Clinic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-sm"
              />
            </form>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Clinic Filter Dropdown */}
              <select
                value={selectedHospitalId}
                onChange={(e) => {
                  setSelectedHospitalId(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Clinics ({clinicBreakdown.length})</option>
                {clinicBreakdown.map((c) => (
                  <option key={c.hospitalId} value={c.hospitalId}>
                    {c.hospitalName} ({c.invoiceCount})
                  </option>
                ))}
              </select>

              {/* Donor Type */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setDonorTypeFilter("all");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    donorTypeFilter === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    donorTypeFilter === "egg"
                      ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    donorTypeFilter === "sperm"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Dna className="h-3 w-3" />
                  Sperm
                </button>
              </div>

              {/* Status Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "ALL"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "PAID"
                      ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "PENDING"
                      ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px]">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Registration & Donor</th>
                <th className="py-3.5 px-4">ART Clinic Name</th>
                <th className="py-3.5 px-4">Pickup Date</th>
                <th className="py-3.5 px-4 text-right">Deal Price</th>
                <th className="py-3.5 px-4 text-right">Received</th>
                <th className="py-3.5 px-4 text-right">Pending</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-sky-600 mb-2" />
                    Loading invoices & clinic deals...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <Receipt className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    No invoices match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isReceived = inv.paymentStatus === "RECEIVED";
                  const isPartial = inv.paymentStatus === "PARTIALLY_RECEIVED";

                  return (
                    <tr
                      key={inv.registrationId}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Invoice No */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Receipt className="h-3.5 w-3.5 text-sky-600" />
                          #{inv.invoiceNumber}
                        </div>
                        <span className="text-[10px] text-slate-400">{inv.invoiceDate}</span>
                      </td>

                      {/* Reg ID & Donor */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {inv.donorName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">
                            {inv.registrationId}
                          </span>
                          <span
                            className={`px-1 rounded text-[9px] font-bold ${
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
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {inv.assignedHospital?.name || "Unassigned ART Clinic"}
                        </div>
                        {inv.assignedHospital?.code && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Code: {inv.assignedHospital.code}
                          </div>
                        )}
                      </td>

                      {/* Pickup Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {inv.pickupDate || "N/A"}
                      </td>

                      {/* Deal Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatInr(inv.dealPrice)}
                      </td>

                      {/* Received */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatInr(inv.receivedAmount)}
                      </td>

                      {/* Pending */}
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatInr(inv.pendingAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
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

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Invoice Modal */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(inv)}
                            className="h-8 px-2 text-sky-600 hover:text-sky-800 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                            title="View / Print Official Invoice"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Invoice
                          </Button>

                          {/* Quick Settle / Edit Payment */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPayment(inv)}
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Record Payment Receipt"
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            Settle
                          </Button>

                          {/* One-click mark as paid if pending */}
                          {!isReceived && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickMarkPaid(inv)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600"
                              title="Mark Full Paid in One Click"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
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
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {currentPage} of {totalPages} ({totalCount} total invoices)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="h-8 px-2.5"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

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

      {/* COMPLETED FILE INVOICE MODAL PREVIEW & DOWNLOAD */}
      {selectedInvoice && (
        <CompletedFileInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          registration={selectedInvoice}
          donorType={selectedInvoice.donorType === "sperm" ? "sperm" : "egg"}
        />
      )}
    </div>
  );
}
