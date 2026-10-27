"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building2,
  Users,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Receipt,
  PiggyBank,
  Percent,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  HelpCircle,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CashFlowReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "DONOR" | "MONTHLY" | "YEARLY" | "CLINIC" | "CASHBOOK"
  >("DONOR");

  // Filters
  const [basis, setBasis] = useState<"cash" | "accrual">("cash");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedFy, setSelectedFy] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedHospitalId, setSelectedHospitalId] = useState("ALL");
  const [selectedDonorType, setSelectedDonorType] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<
    "ALL" | "CLINIC_PENDING" | "DONOR_PENDING" | "SETTLED" | "PAID_ONLY" | "UNPAID_ONLY"
  >("ALL");
  const [showBasisGuideModal, setShowBasisGuideModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [donorSearchTerm, setDonorSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Quick preset helper
  const setQuickPreset = (preset: "ALL" | "THIS_MONTH" | "LAST_MONTH" | "CURRENT_FY") => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    setStartDate("");
    setEndDate("");

    if (preset === "ALL") {
      setSelectedYear("ALL");
      setSelectedFy("ALL");
      setSelectedMonth("ALL");
    } else if (preset === "THIS_MONTH") {
      setSelectedYear(String(currentYear));
      setSelectedFy("ALL");
      setSelectedMonth(String(currentMonth));
    } else if (preset === "LAST_MONTH") {
      const lastMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
      setSelectedYear(String(lastMonthDate.getFullYear()));
      setSelectedFy("ALL");
      setSelectedMonth(String(lastMonthDate.getMonth() + 1));
    } else if (preset === "CURRENT_FY") {
      const fyStart = currentMonth >= 4 ? currentYear : currentYear - 1;
      const fyEnd = String(fyStart + 1).slice(-2);
      setSelectedYear("ALL");
      setSelectedFy(`${fyStart}-${fyEnd}`);
      setSelectedMonth("ALL");
    }
  };

  const isPresetActive = (preset: "ALL" | "THIS_MONTH" | "LAST_MONTH" | "CURRENT_FY") => {
    if (startDate || endDate) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (preset === "ALL") {
      return selectedYear === "ALL" && selectedFy === "ALL" && selectedMonth === "ALL";
    }
    if (preset === "THIS_MONTH") {
      return selectedYear === String(currentYear) && selectedMonth === String(currentMonth) && selectedFy === "ALL";
    }
    if (preset === "LAST_MONTH") {
      const lastMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
      return (
        selectedYear === String(lastMonthDate.getFullYear()) &&
        selectedMonth === String(lastMonthDate.getMonth() + 1) &&
        selectedFy === "ALL"
      );
    }
    if (preset === "CURRENT_FY") {
      const fyStart = currentMonth >= 4 ? currentYear : currentYear - 1;
      const fyEnd = String(fyStart + 1).slice(-2);
      return selectedFy === `${fyStart}-${fyEnd}` && selectedYear === "ALL" && selectedMonth === "ALL";
    }
    return false;
  };

  // Data states
  const [summary, setSummary] = useState<any>({});
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<any[]>([]);
  const [fyBreakdown, setFyBreakdown] = useState<any[]>([]);
  const [yearlyBreakdown, setYearlyBreakdown] = useState<any[]>([]);
  const [clinicBreakdown, setClinicBreakdown] = useState<any[]>([]);
  const [donorBreakdown, setDonorBreakdown] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableFys, setAvailableFys] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("basis", basis);
      if (selectedYear !== "ALL") params.append("year", selectedYear);
      if (selectedFy !== "ALL") params.append("fy", selectedFy);
      if (selectedMonth !== "ALL") params.append("month", selectedMonth);
      if (selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
      if (selectedDonorType !== "all") params.append("donorType", selectedDonorType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/reports/cashflow?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary || {});
        setMonthlyBreakdown(data.monthlyBreakdown || []);
        setFyBreakdown(data.fyBreakdown || []);
        setYearlyBreakdown(data.yearlyBreakdown || []);
        setClinicBreakdown(data.clinicBreakdown || []);
        setDonorBreakdown(data.donorBreakdown || []);
        setTransactions(data.transactions || []);
        setHospitals(data.hospitals || []);
        if (data.meta) {
          setAvailableYears(data.meta.availableYears || []);
          setAvailableFys(data.meta.availableFys || []);
        }
      } else {
        toast.error(data.error || "Failed to load financial records");
      }
    } catch {
      toast.error("Network error while loading revenue details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [basis, selectedYear, selectedFy, selectedMonth, selectedHospitalId, selectedDonorType, startDate, endDate]);

  const handleExportExcel = () => {
    try {
      let exportRows: any[] = [];
      let filename = `Mediyaz_Revenue_Report_${activeTab}`;

      if (activeTab === "MONTHLY") {
        exportRows = monthlyBreakdown.map((m) => ({
          Period: m.periodKey,
          "Financial Year": m.financialYear,
          "Billed Amount (INR)": m.billed,
          "Cash In (Clinic Paid)": m.cashIn,
          "Cash Out (Donor Paid)": m.cashOut,
          "Net Cash Flow (INR)": m.netCash,
          "Operating Margin (INR)": m.serviceMargin,
          "Margin %": `${m.marginRate}%`,
          "Total Cases": m.caseCount,
        }));
        filename = `Monthly_CashFlow_Revenue_${basis}`;
      } else if (activeTab === "YEARLY") {
        exportRows = fyBreakdown.map((f) => ({
          "Financial Year": f.fy,
          "Total Billed (INR)": f.billed,
          "Cash In (Clinic Paid)": f.cashIn,
          "Cash Out (Donor Paid)": f.cashOut,
          "Net Cash Flow (INR)": f.netCash,
          "Operating Margin (INR)": f.serviceMargin,
          "Margin %": `${f.marginRate}%`,
          "Total Cases": f.caseCount,
        }));
        filename = `Yearly_FY_Revenue_Report_${basis}`;
      } else if (activeTab === "CLINIC") {
        exportRows = clinicBreakdown.map((c, idx) => ({
          "S.No": idx + 1,
          "Clinic Name": c.hospitalName,
          State: c.state,
          "Total Cases": c.casesCount,
          "Total Billed (INR)": c.totalBilled,
          "Cash Received (INR)": c.cashReceived,
          "Pending Amount (INR)": c.pendingAmount,
          "Service Margin (INR)": c.serviceMargin,
          "Recovery %": `${c.recoveryRate}%`,
        }));
        filename = `Clinic_Wise_Revenue_${basis}`;
      } else if (activeTab === "DONOR") {
        exportRows = donorBreakdown.map((d) => ({
          "S.No": d.sNo,
          "Reg ID": d.registrationId,
          "Donor Name": d.donorName,
          "Type": d.donorType.toUpperCase(),
          "Assigned Clinic": d.hospitalName,
          "Case Date": d.caseDate,
          "Clinic Deal Price (INR)": d.dealPrice,
          "Clinic Cash Paid (INR)": d.clinicReceivedAmount,
          "Clinic Due (INR)": d.clinicPendingAmount,
          "Clinic Payment Status": d.clinicPaymentStatus,
          "Donor Compensation (INR)": d.agreedCompensation,
          "Paid to Donor (INR)": d.paidAmount,
          "Donor Due (INR)": d.balancePending,
          "Donor Payment Status": d.paymentStatus,
          "Payment Date": d.paidAt,
          "Reference": d.reference,
          "Company Margin (INR)": d.serviceCharge,
          "Margin Rate %": `${d.marginRate}%`,
          "Realized In-Hand Profit (INR)": d.netRealizedMargin,
        }));
        filename = `Donor_Clinic_Deal_Financial_Audit`;
      } else if (activeTab === "CASHBOOK") {
        exportRows = transactions.map((tx) => ({
          "S.No": tx.sNo,
          Date: tx.dateStr,
          Type: tx.type === "IN" ? "INCOMING (+)" : "OUTGOING (-)",
          "Party / Description": tx.entityName,
          "Reg ID": tx.registrationId,
          "Amount (INR)": tx.amount,
          "Running Cash Balance": tx.runningBalance,
          Method: tx.method,
          Reference: tx.reference,
        }));
        filename = `Cash_Book_Ledger`;
      }

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Financial_Report");
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel report exported successfully!");
    } catch {
      toast.error("Failed to export Excel report");
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tx.entityName?.toLowerCase().includes(term) ||
      tx.registrationId?.toLowerCase().includes(term) ||
      tx.reference?.toLowerCase().includes(term)
    );
  });

  const filteredDonorBreakdown = donorBreakdown.filter((d) => {
    // Under Cash Basis: strictly only show cases where physical cash was received or paid
    // Under Accrual Basis: show all contracted deals (both paid and unpaid)
    if (basis === "cash") {
      const hasCashMovement = (d.clinicReceivedAmount || 0) > 0 || (d.paidAmount || 0) > 0;
      if (!hasCashMovement) return false;
    }

    const isUnpaid = (d.clinicReceivedAmount || 0) === 0 && (d.paidAmount || 0) === 0;

    // Payment Settlement Status Filter
    if (selectedPaymentStatus === "CLINIC_PENDING" && !(d.clinicPendingAmount > 0)) return false;
    if (selectedPaymentStatus === "DONOR_PENDING" && !(d.balancePending > 0)) return false;
    if (selectedPaymentStatus === "SETTLED" && (d.clinicPendingAmount > 0 || d.balancePending > 0)) return false;
    if (selectedPaymentStatus === "PAID_ONLY" && isUnpaid) return false;
    if (selectedPaymentStatus === "UNPAID_ONLY" && !isUnpaid) return false;

    if (!donorSearchTerm) return true;
    const term = donorSearchTerm.toLowerCase();
    return (
      d.donorName?.toLowerCase().includes(term) ||
      d.registrationId?.toLowerCase().includes(term) ||
      d.hospitalName?.toLowerCase().includes(term) ||
      d.reference?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <Link href="/ledger">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Full Revenue & Cash Flow Calculation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive audit of clinic inflows, donor compensation payouts, net operating margins, and liquidity balances across monthly and fiscal periods.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Accounting Basis Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => setBasis("cash")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                basis === "cash"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Cash Basis: Calculates strictly from physical money deposited into or paid from your bank account"
            >
              <Wallet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cash Basis</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                basis === "cash"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-200/60 dark:bg-slate-700 text-slate-400"
              }`}>
                Real Cash
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBasis("accrual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                basis === "accrual"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Accrual Basis: Calculates from all booked deals, contracts, and revenue regardless of collection date"
            >
              <Receipt className="h-3.5 w-3.5 text-indigo-600" />
              <span>Accrual Basis</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                basis === "accrual"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "bg-slate-200/60 dark:bg-slate-700 text-slate-400"
              }`}>
                Deals &amp; P&amp;L
              </span>
            </button>
          </div>

          {/* Quick Help Guide Button */}
          <button
            type="button"
            onClick={() => setShowBasisGuideModal(true)}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-all text-xs font-bold shadow-sm"
            title="Understanding Cash Basis vs Accrual Basis"
          >
            <HelpCircle className="h-4 w-4 text-indigo-500" />
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs h-9 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
      {/* 4 Key Revenue Cards (Reactive to Accounting Basis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cash In / Billed Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {basis === "cash" ? "Total Real Cash Inflow" : "Total Accrued Revenue"}
            </span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              basis === "cash"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
            }`}>
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-2 ${basis === "cash" ? "text-emerald-600" : "text-indigo-600"}`}>
            ₹{(basis === "cash" ? summary.cashIn || 0 : summary.totalBilled || 0).toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {basis === "cash" ? (
              <>
                <span>Total Invoiced: ₹{(summary.totalBilled || 0).toLocaleString("en-IN")}</span>
                <span className="font-semibold text-emerald-600">{summary.collectionRate || 0}% Cleared</span>
              </>
            ) : (
              <>
                <span>Collected: ₹{(summary.cashIn || 0).toLocaleString("en-IN")}</span>
                <span className="font-semibold text-indigo-600">Pending: ₹{(summary.clinicReceivable || 0).toLocaleString("en-IN")}</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Cash Out / Donor Liabilities */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {basis === "cash" ? "Donor Payouts Disbursed" : "Accrued Donor Obligations"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            ₹{(basis === "cash" ? summary.cashOut || 0 : summary.totalDonorCompensation || 0).toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {basis === "cash" ? (
              <>
                <span>Pending Payout:</span>
                <span className="font-semibold text-rose-600">
                  ₹{(summary.donorPayable || 0).toLocaleString("en-IN")}
                </span>
              </>
            ) : (
              <>
                <span>Disbursed: ₹{(summary.cashOut || 0).toLocaleString("en-IN")}</span>
                <span className="font-semibold text-rose-600">
                  Unpaid: ₹{(summary.donorPayable || 0).toLocaleString("en-IN")}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Net Cash / Net Margin */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {basis === "cash" ? "Net Operating Cash Balance" : "Net Recognized Spread"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-black mt-2 ${
              (basis === "cash" ? summary.netCashFlow || 0 : summary.serviceMargin || 0) >= 0 ? "text-indigo-600" : "text-rose-600"
            }`}
          >
            ₹{(basis === "cash" ? summary.netCashFlow || 0 : summary.serviceMargin || 0).toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {basis === "cash" ? (
              <>
                <span>Liquid Cash Movement:</span>
                <span className="font-semibold text-indigo-600">
                  {summary.totalTransactions || 0} Transactions
                </span>
              </>
            ) : (
              <>
                <span>Company Margin:</span>
                <span className="font-semibold text-indigo-600">
                  {summary.totalCases || 0} Closed Cases
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Operating Spread Margin / Pending Receivables */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {basis === "cash" ? "Operating Margin (Spread)" : "Pending Clinic Receivables"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            ₹{(basis === "cash" ? summary.serviceMargin || 0 : summary.clinicReceivable || 0).toLocaleString("en-IN")}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {basis === "cash" ? (
              <>
                <span>Receivable from Clinics:</span>
                <span className="font-semibold text-rose-600">
                  ₹{(summary.clinicReceivable || 0).toLocaleString("en-IN")}
                </span>
              </>
            ) : (
              <>
                <span>GST: ₹{(summary.gstPayable || 0).toLocaleString("en-IN")}</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">TDS: ₹{(summary.tdsCredit || 0).toLocaleString("en-IN")}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shared Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Quick Timeframe Presets Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            <span>Quick Timeframe:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickPreset("THIS_MONTH")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isPresetActive("THIS_MONTH")
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("LAST_MONTH")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isPresetActive("LAST_MONTH")
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("CURRENT_FY")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isPresetActive("CURRENT_FY")
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Current FY (2026-27)
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isPresetActive("ALL")
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {(startDate ||
            endDate ||
            selectedYear !== "ALL" ||
            selectedFy !== "ALL" ||
            selectedMonth !== "ALL" ||
            selectedHospitalId !== "ALL" ||
            selectedDonorType !== "all" ||
            selectedPaymentStatus !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedYear("ALL");
                setSelectedFy("ALL");
                setSelectedMonth("ALL");
                setSelectedHospitalId("ALL");
                setSelectedDonorType("all");
                setSelectedPaymentStatus("ALL");
                setStartDate("");
                setEndDate("");
              }}
              className="h-7 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Detailed Dropdowns Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Calendar Years</option>
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                Year {y}
              </option>
            ))}
          </select>

          {/* Financial Year Dropdown */}
          <select
            value={selectedFy}
            onChange={(e) => setSelectedFy(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Financial Years</option>
            {availableFys.map((fy) => (
              <option key={fy} value={fy}>
                FY {fy}
              </option>
            ))}
          </select>

          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Months</option>
            <option value="1">January (01)</option>
            <option value="2">February (02)</option>
            <option value="3">March (03)</option>
            <option value="4">April (04)</option>
            <option value="5">May (05)</option>
            <option value="6">June (06)</option>
            <option value="7">July (07)</option>
            <option value="8">August (08)</option>
            <option value="9">September (09)</option>
            <option value="10">October (10)</option>
            <option value="11">November (11)</option>
            <option value="12">December (12)</option>
          </select>

          {/* Clinic Dropdown */}
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[200px] truncate"
          >
            <option value="ALL">All Partner Clinics</option>
            {hospitals.map((h: any) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Donor Type */}
          <select
            value={selectedDonorType}
            onChange={(e) => setSelectedDonorType(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="all">Egg & Sperm Donors</option>
            <option value="egg">Egg Donors Only</option>
            <option value="sperm">Sperm Donors Only</option>
          </select>

          {/* Settlement Status Dropdown */}
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value as any)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Settlement Statuses</option>
            <option value="PAID_ONLY">💰 Paid Only (Exclude Unpaid)</option>
            <option value="UNPAID_ONLY">❌ Unpaid Deals Only (Zero Cash)</option>
            <option value="CLINIC_PENDING">⚠ Clinic Payment Due</option>
            <option value="DONOR_PENDING">⏳ Donor Payout Due</option>
            <option value="SETTLED">✓ Fully Settled (Both Cleared)</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs w-36"
            />
            <span>To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs w-36"
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("DONOR")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === "DONOR"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-rose-600" />
          Donor &amp; Clinic Deal Ledger
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MONTHLY")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === "MONTHLY"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          Monthly Ledger
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("YEARLY")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === "YEARLY"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
          Fiscal &amp; Annual Summary
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CLINIC")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === "CLINIC"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-teal-600" />
          Clinic Collections
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CASHBOOK")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === "CASHBOOK"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Receipt className="h-3.5 w-3.5 text-purple-600" />
          Cash Flow Journal
        </button>
      </div>

      {/* TAB 1: MONTH-WISE CALCULATION */}
      {activeTab === "MONTHLY" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Month-by-Month Full Revenue & Cash Ledger
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  basis === "cash"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                }`}>
                  {basis === "cash" ? "Cash Mode" : "Accrual Mode"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {basis === "cash"
                  ? "Real cash in vs donor payouts out based on transaction clearance dates."
                  : "Revenue recognized and donor costs incurred based on official case & deal dates."}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {monthlyBreakdown.length} Active Periods
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Month / Period</th>
                  <th className="p-3.5">FY</th>
                  <th className="p-3.5 text-center">Cases</th>
                  <th className="p-3.5 text-right">Total Billed</th>
                  <th className="p-3.5 text-right font-black text-emerald-600">
                    {basis === "cash" ? "Clinic Paid (Real In)" : "Collected (Deal Date)"}
                  </th>
                  <th className="p-3.5 text-right font-black text-rose-600">
                    {basis === "cash" ? "Donor Paid (Real Out)" : "Donor Paid (Deal Date)"}
                  </th>
                  <th className="p-3.5 text-right font-black text-indigo-600">
                    {basis === "cash" ? "Net Cash Flow" : "Net Margin (Spread)"}
                  </th>
                  <th className="p-3.5 text-right">
                    Operating Margin (Spread)
                  </th>
                  <th className="p-3.5 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthlyBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No records found for the selected period
                    </td>
                  </tr>
                ) : (
                  monthlyBreakdown.map((m) => (
                    <tr key={m.periodKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {m.periodKey}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">{m.financialYear}</td>
                      <td className="p-3.5 text-center font-semibold">{m.caseCount}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        ₹{m.billed.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20">
                        +₹{m.cashIn.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-rose-600 bg-rose-50/40 dark:bg-rose-950/20">
                        -₹{m.cashOut.toLocaleString("en-IN")}
                      </td>
                      <td
                        className={`p-3.5 text-right font-black ${
                          m.netCash >= 0 ? "text-indigo-600" : "text-rose-600"
                        }`}
                      >
                        ₹{m.netCash.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-amber-600 bg-amber-50/40 dark:bg-amber-950/20">
                        ₹{m.serviceMargin.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                        {m.marginRate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {monthlyBreakdown.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100">
                  <tr>
                    <td className="p-3.5 font-black">Total ({monthlyBreakdown.length} Periods)</td>
                    <td className="p-3.5 text-slate-400">-</td>
                    <td className="p-3.5 text-center font-black">
                      {monthlyBreakdown.reduce((a, m) => a + (m.caseCount || 0), 0)}
                    </td>
                    <td className="p-3.5 text-right font-black">
                      ₹{monthlyBreakdown.reduce((a, m) => a + (m.billed || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-600 bg-emerald-100/50 dark:bg-emerald-950/40">
                      +₹{monthlyBreakdown.reduce((a, m) => a + (m.cashIn || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-rose-600 bg-rose-100/50 dark:bg-rose-950/40">
                      -₹{monthlyBreakdown.reduce((a, m) => a + (m.cashOut || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className={`p-3.5 text-right font-black ${
                      monthlyBreakdown.reduce((a, m) => a + (m.netCash || 0), 0) >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600"
                    }`}>
                      ₹{monthlyBreakdown.reduce((a, m) => a + (m.netCash || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-600 bg-amber-100/50 dark:bg-amber-950/40">
                      ₹{monthlyBreakdown.reduce((a, m) => a + (m.serviceMargin || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-700 dark:text-slate-300">
                      {(() => {
                        const totalBilled = monthlyBreakdown.reduce((a, m) => a + (m.billed || 0), 0);
                        const totalMargin = monthlyBreakdown.reduce((a, m) => a + (m.serviceMargin || 0), 0);
                        return totalBilled > 0 ? ((totalMargin / totalBilled) * 100).toFixed(1) : "0.0";
                      })()}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: YEAR & FINANCIAL-YEAR WISE */}
      {activeTab === "YEARLY" && (
        <div className="space-y-6">
          {/* FY Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Indian Financial Year (Apr - Mar) Full Overview
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  basis === "cash"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                }`}>
                  {basis === "cash" ? "Cash Mode" : "Accrual Mode"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {basis === "cash"
                  ? "Official fiscal performance based on actual bank deposits received and donor payouts sent."
                  : "Fiscal performance aggregated strictly by case execution dates and contract commitments."}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Financial Year</th>
                    <th className="p-3.5 text-center">Cases</th>
                    <th className="p-3.5 text-right">Total Billed</th>
                    <th className="p-3.5 text-right font-black text-emerald-600">
                      {basis === "cash" ? "Total Clinic Paid (IN)" : "Case Collections (IN)"}
                    </th>
                    <th className="p-3.5 text-right font-black text-rose-600">
                      {basis === "cash" ? "Total Paid to Donor (OUT)" : "Donor Disbursed (OUT)"}
                    </th>
                    <th className="p-3.5 text-right font-black text-indigo-600">
                      {basis === "cash" ? "Net Fiscal Cash Flow" : "Net Deal Spread"}
                    </th>
                    <th className="p-3.5 text-right font-black text-amber-600">
                      Operating Margin (Spread)
                    </th>
                    <th className="p-3.5 text-right">Avg Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fyBreakdown.map((f) => (
                    <tr key={f.fy} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                        FY {f.fy}
                      </td>
                      <td className="p-3.5 text-center font-semibold">{f.caseCount}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        ₹{f.billed.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-600">
                        ₹{f.cashIn.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-rose-600">
                        ₹{f.cashOut.toLocaleString("en-IN")}
                      </td>
                      <td
                        className={`p-3.5 text-right font-black ${
                          f.netCash >= 0 ? "text-indigo-600" : "text-rose-600"
                        }`}
                      >
                        ₹{f.netCash.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-amber-600 bg-amber-50/30">
                        ₹{f.serviceMargin.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                        {f.marginRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                {fyBreakdown.length > 0 && (
                  <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100">
                    <tr>
                      <td className="p-3.5 font-black">All Fiscal Years ({fyBreakdown.length})</td>
                      <td className="p-3.5 text-center font-black">
                        {fyBreakdown.reduce((a, f) => a + (f.caseCount || 0), 0)}
                      </td>
                      <td className="p-3.5 text-right font-black">
                        ₹{fyBreakdown.reduce((a, f) => a + (f.billed || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-600">
                        ₹{fyBreakdown.reduce((a, f) => a + (f.cashIn || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-600">
                        ₹{fyBreakdown.reduce((a, f) => a + (f.cashOut || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className={`p-3.5 text-right font-black ${
                        fyBreakdown.reduce((a, f) => a + (f.netCash || 0), 0) >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600"
                      }`}>
                        ₹{fyBreakdown.reduce((a, f) => a + (f.netCash || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-amber-600 bg-amber-100/50 dark:bg-amber-950/40">
                        ₹{fyBreakdown.reduce((a, f) => a + (f.serviceMargin || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-700 dark:text-slate-300">
                        {(() => {
                          const totalBilled = fyBreakdown.reduce((a, f) => a + (f.billed || 0), 0);
                          const totalMargin = fyBreakdown.reduce((a, f) => a + (f.serviceMargin || 0), 0);
                          return totalBilled > 0 ? ((totalMargin / totalBilled) * 100).toFixed(1) : "0.0";
                        })()}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Calendar Year Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Calendar Year Breakdown (Jan - Dec)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Calendar Year</th>
                    <th className="p-3.5 text-center">Cases</th>
                    <th className="p-3.5 text-right">Total Billed</th>
                    <th className="p-3.5 text-right font-bold text-emerald-600">
                      Clinic Paid (IN)
                    </th>
                    <th className="p-3.5 text-right font-bold text-rose-600">
                      Paid to Donor (OUT)
                    </th>
                    <th className="p-3.5 text-right font-black text-indigo-600">Net Balance</th>
                    <th className="p-3.5 text-right font-bold text-amber-600">Operating Margin (Spread)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {yearlyBreakdown.map((y) => (
                    <tr key={y.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{y.year}</td>
                      <td className="p-3.5 text-center font-semibold">{y.caseCount}</td>
                      <td className="p-3.5 text-right font-bold">₹{y.billed.toLocaleString("en-IN")}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-600">₹{y.cashIn.toLocaleString("en-IN")}</td>
                      <td className="p-3.5 text-right font-bold text-rose-600">₹{y.cashOut.toLocaleString("en-IN")}</td>
                      <td className="p-3.5 text-right font-black text-indigo-600">₹{y.netCash.toLocaleString("en-IN")}</td>
                      <td className="p-3.5 text-right font-bold text-amber-600">₹{y.serviceMargin.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
                {yearlyBreakdown.length > 0 && (
                  <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100">
                    <tr>
                      <td className="p-3.5 font-black">Total ({yearlyBreakdown.length} Years)</td>
                      <td className="p-3.5 text-center font-black">
                        {yearlyBreakdown.reduce((a, y) => a + (y.caseCount || 0), 0)}
                      </td>
                      <td className="p-3.5 text-right font-black">
                        ₹{yearlyBreakdown.reduce((a, y) => a + (y.billed || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-600">
                        ₹{yearlyBreakdown.reduce((a, y) => a + (y.cashIn || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-600">
                        ₹{yearlyBreakdown.reduce((a, y) => a + (y.cashOut || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className={`p-3.5 text-right font-black ${
                        yearlyBreakdown.reduce((a, y) => a + (y.netCash || 0), 0) >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600"
                      }`}>
                        ₹{yearlyBreakdown.reduce((a, y) => a + (y.netCash || 0), 0).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-black text-amber-600">
                        ₹{yearlyBreakdown.reduce((a, y) => a + (y.serviceMargin || 0), 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLINIC BREAKDOWN */}
      {activeTab === "CLINIC" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Clinic Recovery & Settlement Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks how much each clinic was billed, how much has been received, and remaining outstanding dues.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">ART Clinic Name</th>
                  <th className="p-3.5">State</th>
                  <th className="p-3.5 text-center">Cases</th>
                  <th className="p-3.5 text-right">Total Deal Value</th>
                  <th className="p-3.5 text-right font-black text-emerald-600">
                    Cash Paid (IN)
                  </th>
                  <th className="p-3.5 text-right font-black text-rose-600">
                    Remaining Pending
                  </th>
                  <th className="p-3.5 text-right font-black text-amber-600">
                    Service Margin
                  </th>
                  <th className="p-3.5 text-right font-bold">Clearance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clinicBreakdown.map((c, idx) => (
                  <tr key={c.hospitalId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 text-slate-400">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {c.hospitalName}
                    </td>
                    <td className="p-3.5 text-slate-600">{c.state || "Delhi"}</td>
                    <td className="p-3.5 text-center font-semibold">{c.casesCount}</td>
                    <td className="p-3.5 text-right font-bold">₹{c.totalBilled.toLocaleString("en-IN")}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600">₹{c.cashReceived.toLocaleString("en-IN")}</td>
                    <td className="p-3.5 text-right font-bold text-rose-600">₹{c.pendingAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3.5 text-right font-bold text-amber-600">₹{c.serviceMargin.toLocaleString("en-IN")}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{c.recoveryRate}%</td>
                  </tr>
                ))}
              </tbody>
              {clinicBreakdown.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100">
                  <tr>
                    <td className="p-3.5 text-slate-400">Σ</td>
                    <td className="p-3.5 font-black">{clinicBreakdown.length} Partner Clinics</td>
                    <td className="p-3.5 text-slate-400">-</td>
                    <td className="p-3.5 text-center font-black">
                      {clinicBreakdown.reduce((a, c) => a + (c.casesCount || 0), 0)}
                    </td>
                    <td className="p-3.5 text-right font-black">
                      ₹{clinicBreakdown.reduce((a, c) => a + (c.totalBilled || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-600">
                      ₹{clinicBreakdown.reduce((a, c) => a + (c.cashReceived || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-rose-600">
                      ₹{clinicBreakdown.reduce((a, c) => a + (c.pendingAmount || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-600">
                      ₹{clinicBreakdown.reduce((a, c) => a + (c.serviceMargin || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 dark:text-slate-100">
                      {(() => {
                        const totalB = clinicBreakdown.reduce((a, c) => a + (c.totalBilled || 0), 0);
                        const totalR = clinicBreakdown.reduce((a, c) => a + (c.cashReceived || 0), 0);
                        return totalB > 0 ? ((totalR / totalB) * 100).toFixed(1) : "0.0";
                      })()}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 1: COMPLETE DONOR & CLINIC DEAL AUDIT */}
      {activeTab === "DONOR" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header & Search */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {basis === "cash"
                  ? "Case-by-Case Real Cash Movement & Liquid Profit Audit"
                  : "Case-by-Case Contracted Deal & Accrued P&L Audit"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {basis === "cash"
                  ? "Audit of physical bank receipts collected from clinics vs actual donor compensation disbursed vs liquid in-hand profit."
                  : "Audit of contracted deal agreements, total gross revenue billed, donor obligations, and recognized service spread margin."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search donor, reg ID or clinic..."
                  value={donorSearchTerm}
                  onChange={(e) => setDonorSearchTerm(e.target.value)}
                  className="h-8.5 pl-8 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Slim Financial Stats Ribbon (Adapts strictly to Cash Basis vs Accrual Basis) */}
          <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            {basis === "cash" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Real Cash Inflow (Clinic Paid):</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.clinicReceivedAmount || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Real Cash Outflow (Donor Disbursed):</span>
                  <span className="font-bold text-rose-600 text-sm">
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.paidAmount || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Realized In-Hand Cash Profit:</span>
                  <span
                    className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                      filteredDonorBreakdown.reduce((acc, d) => acc + (d.netRealizedMargin || 0), 0) >= 0
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.netRealizedMargin || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Total Billed Pipeline:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.dealPrice || 0), 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11px] text-rose-600 font-semibold">
                    (₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.clinicPendingAmount || 0), 0).toLocaleString("en-IN")} Uncollected)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Total Invoiced Deal Revenue:</span>
                  <span className="font-bold text-indigo-600 text-sm">
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.dealPrice || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Accrued Donor Obligations:</span>
                  <span className="font-bold text-rose-600 text-sm">
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.agreedCompensation || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Recognized Operating Margin:</span>
                  <span className="font-black text-amber-600 text-sm px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.serviceCharge || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Pending Clinic Dues:</span>
                  <span className="font-semibold text-rose-600">
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.clinicPendingAmount || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Collected In-Hand:</span>
                  <span className="font-semibold text-emerald-600">
                    ₹{filteredDonorBreakdown.reduce((acc, d) => acc + (d.clinicReceivedAmount || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Grouped Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                {/* Visual Category Groups Bar */}
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider">
                  <th colSpan={3} className="p-2 text-slate-400 bg-slate-100/50 dark:bg-slate-800/40">
                    Case &amp; Clinic Identity
                  </th>
                  <th
                    colSpan={4}
                    className={`p-2 text-center border-l ${
                      basis === "cash"
                        ? "text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                        : "text-indigo-800 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800"
                    }`}
                  >
                    {basis === "cash" ? "Clinic Inflow (Real Cash Received)" : "Clinic Inflow (Contracted Billed)"}
                  </th>
                  <th
                    colSpan={4}
                    className={`p-2 text-center border-l ${
                      basis === "cash"
                        ? "text-rose-800 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                        : "text-rose-800 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    {basis === "cash" ? "Donor Outflow (Real Payouts Sent)" : "Donor Outflow (Agreed Liability)"}
                  </th>
                  <th
                    colSpan={2}
                    className={`p-2 text-center border-l ${
                      basis === "cash"
                        ? "text-indigo-800 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800"
                        : "text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {basis === "cash" ? "Realized Cash Profit" : "Recognized Deal Margin"}
                  </th>
                </tr>

                {/* Individual Column Headers */}
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs">
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">Donor &amp; Reg ID</th>
                  <th className="p-3">Assigned ART Clinic</th>

                  {/* Clinic columns */}
                  <th
                    className={`p-3 text-right font-black border-l border-slate-200 dark:border-slate-800 ${
                      basis === "accrual"
                        ? "text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 font-black"
                        : "text-slate-500 font-medium"
                    }`}
                  >
                    {basis === "accrual" ? "★ Billed Deal" : "Deal Price"}
                  </th>
                  <th
                    className={`p-3 text-right font-black ${
                      basis === "cash"
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 font-black"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {basis === "cash" ? "★ Paid (IN)" : "Collected"}
                  </th>
                  <th className="p-3 text-right font-black text-rose-600">Pending Due</th>
                  <th className="p-3 text-center">Status</th>

                  {/* Donor columns */}
                  <th
                    className={`p-3 text-right font-black border-l border-slate-200 dark:border-slate-800 ${
                      basis === "accrual"
                        ? "text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/30 font-black"
                        : "text-slate-500 font-medium"
                    }`}
                  >
                    {basis === "accrual" ? "★ Agreed Pay" : "Agreed Pay"}
                  </th>
                  <th
                    className={`p-3 text-right font-black ${
                      basis === "cash"
                        ? "text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40 font-black"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {basis === "cash" ? "★ Paid (OUT)" : "Paid"}
                  </th>
                  <th className="p-3 text-right font-black text-amber-600">Pending Due</th>
                  <th className="p-3 text-center">Status</th>

                  {/* Profit columns */}
                  <th
                    className={`p-3 text-right border-l border-slate-200 dark:border-slate-800 ${
                      basis === "accrual"
                        ? "font-black text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {basis === "accrual" ? "★ Operating Spread" : "Contract Spread"}
                  </th>
                  <th
                    className={`p-3 text-right ${
                      basis === "cash"
                        ? "font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-950/40 text-sm"
                        : "text-slate-500 font-medium"
                    }`}
                  >
                    {basis === "cash" ? "★ Realized In-Hand" : "In-Hand Cash"}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDonorBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-12 text-slate-400">
                      No donor deal records match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDonorBreakdown.map((d) => {
                    const isExpanded = expandedRowId === d.registrationId;
                    const hasZeroCash = (d.clinicReceivedAmount || 0) === 0 && (d.paidAmount || 0) === 0;

                    return (
                      <React.Fragment key={d.registrationId}>
                        <tr
                          onClick={() => setExpandedRowId(isExpanded ? null : d.registrationId)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                            isExpanded ? "bg-slate-50/80 dark:bg-slate-800/60" : ""
                          } ${basis === "cash" && hasZeroCash ? "opacity-60 bg-slate-50/30" : ""}`}
                        >
                          <td className="p-3 text-center text-slate-400">
                            <div className="flex items-center justify-center gap-1">
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              )}
                              <span>{d.sNo}</span>
                            </div>
                          </td>

                          <td className="p-3">
                            <Link
                              href={
                                d.donorType === "egg"
                                  ? `/manage-registrations?registrationId=${encodeURIComponent(d.registrationId)}`
                                  : `/manage-sperm-registrations?registrationId=${encodeURIComponent(d.registrationId)}`
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline inline-flex items-center gap-1 group/link"
                              title="Click to open donor profile"
                            >
                              <span>{d.registrationId}</span>
                              <ArrowUpRight className="h-3 w-3 opacity-60 group-hover/link:opacity-100 transition-opacity" />
                            </Link>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{d.donorName}</div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                  d.donorType === "egg"
                                    ? "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                }`}
                              >
                                {d.donorType}
                              </span>
                              <span>{d.caseDate}</span>
                              {basis === "cash" && hasZeroCash && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-semibold">
                                  No Cash Movement
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200 max-w-[170px] truncate" title={d.hospitalName}>
                              {d.hospitalName}
                            </div>
                          </td>

                          {/* Clinic Inflow */}
                          <td
                            className={`p-3 text-right border-l border-slate-100 dark:border-slate-800 ${
                              basis === "accrual"
                                ? "font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/20"
                                : "text-slate-500 font-medium"
                            }`}
                          >
                            ₹{(d.dealPrice || 0).toLocaleString("en-IN")}
                          </td>
                          <td
                            className={`p-3 text-right ${
                              basis === "cash"
                                ? "font-black text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-sm"
                                : "font-bold text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            ₹{(d.clinicReceivedAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-3 text-right font-bold text-rose-600">
                            ₹{(d.clinicPendingAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.clinicPaymentStatus === "RECEIVED"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : d.clinicPaymentStatus === "PARTIALLY_RECEIVED"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {d.clinicPaymentStatus === "RECEIVED"
                                ? "✓ Cleared"
                                : d.clinicPaymentStatus === "PARTIALLY_RECEIVED"
                                ? "⏳ Partial"
                                : "⚠ Unpaid"}
                            </span>
                          </td>

                          {/* Donor Outflow */}
                          <td
                            className={`p-3 text-right border-l border-slate-100 dark:border-slate-800 ${
                              basis === "accrual"
                                ? "font-black text-rose-700 dark:text-rose-300 bg-rose-50/30 dark:bg-rose-950/20"
                                : "text-slate-500 font-medium"
                            }`}
                          >
                            ₹{(d.agreedCompensation || 0).toLocaleString("en-IN")}
                          </td>
                          <td
                            className={`p-3 text-right ${
                              basis === "cash"
                                ? "font-black text-rose-600 bg-rose-50/50 dark:bg-rose-950/30 text-sm"
                                : "font-bold text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            ₹{(d.paidAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-3 text-right font-bold text-amber-600">
                            ₹{(d.balancePending || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.paymentStatus === "PAID"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : d.paymentStatus === "PARTIALLY_PAID"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {d.paymentStatus === "PAID"
                                ? "✓ Paid"
                                : d.paymentStatus === "PARTIALLY_PAID"
                                ? "⏳ Partial"
                                : "⚠ Due"}
                            </span>
                          </td>

                          {/* Company Profit */}
                          <td
                            className={`p-3 text-right border-l border-slate-100 dark:border-slate-800 ${
                              basis === "accrual"
                                ? "font-black text-amber-600 bg-amber-100/40 dark:bg-amber-950/30"
                                : "text-slate-400 font-medium"
                            }`}
                          >
                            {basis === "cash" && hasZeroCash ? (
                              <div>
                                <span className="text-slate-400 italic">₹0</span>
                                <div className="text-[9px] text-slate-400">Deal: ₹{(d.serviceCharge || 0).toLocaleString("en-IN")}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold">₹{(d.serviceCharge || 0).toLocaleString("en-IN")}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{d.marginRate || 0}%</div>
                              </div>
                            )}
                          </td>
                          <td
                            className={`p-3 text-right ${
                              basis === "cash"
                                ? "font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100/40 dark:bg-indigo-950/30"
                                : "font-semibold text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {basis === "cash" && hasZeroCash ? (
                              <span className="text-slate-400 font-normal text-[11px] italic">₹0 (Pending)</span>
                            ) : (
                              <span
                                className={`font-black ${
                                  (d.netRealizedMargin || 0) >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600"
                                }`}
                              >
                                ₹{(d.netRealizedMargin || 0).toLocaleString("en-IN")}
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Case Audit Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-y border-indigo-100 dark:border-indigo-950">
                            <td colSpan={13} className="p-4 pl-12">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400">Payment Reference / UTR</span>
                                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                    {d.reference && d.reference !== "-" ? d.reference : "Direct Bank Settlement"}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Paid Timestamp: {d.paidAt || "Pending"}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400">Invoice &amp; Tax Audit</span>
                                  <div className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                                    GST (18%): ₹{(d.gstAmount || 0).toLocaleString("en-IN")}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    TDS Credit: ₹{(d.tdsAmount || 0).toLocaleString("en-IN")}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400">Deal Economics</span>
                                  <div className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                                    Gross Margin: ₹{(d.serviceCharge || 0).toLocaleString("en-IN")} ({d.marginRate}%)
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Net Liquid Margin: ₹{(d.netRealizedMargin || 0).toLocaleString("en-IN")}
                                  </div>
                                </div>

                                <div className="flex items-center justify-end">
                                  <Link
                                    href={
                                      d.donorType === "egg"
                                        ? `/manage-registrations?registrationId=${encodeURIComponent(d.registrationId)}`
                                        : `/manage-sperm-registrations?registrationId=${encodeURIComponent(d.registrationId)}`
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-3.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs shadow-sm transition-all inline-flex items-center gap-1.5"
                                  >
                                    <span>View Full Donor Profile</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {/* Authoritative Sticky Table Totals Footer (Adapts strictly to Cash Basis vs Accrual Basis) */}
              {filteredDonorBreakdown.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100">
                  <tr>
                    <td className="p-3 text-center text-slate-400">Σ</td>
                    <td className="p-3 font-black">
                      {filteredDonorBreakdown.length} Cases
                      {basis === "cash" && (
                        <div className="text-[10px] text-emerald-600 font-normal">
                          {filteredDonorBreakdown.filter((d) => (d.clinicReceivedAmount || 0) > 0 || (d.paidAmount || 0) > 0).length} with cashflow
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">-</td>

                    {/* Clinic Total */}
                    <td
                      className={`p-3 text-right border-l border-slate-200 dark:border-slate-700 ${
                        basis === "accrual"
                          ? "font-black text-indigo-700 dark:text-indigo-300 text-sm bg-indigo-100/40"
                          : "font-medium text-slate-500"
                      }`}
                    >
                      ₹{filteredDonorBreakdown.reduce((a, d) => a + (d.dealPrice || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`p-3 text-right ${
                        basis === "cash"
                          ? "font-black text-emerald-600 text-sm bg-emerald-100/60 dark:bg-emerald-950/40"
                          : "font-bold text-emerald-600"
                      }`}
                    >
                      ₹{filteredDonorBreakdown.reduce((a, d) => a + (d.clinicReceivedAmount || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right font-black text-rose-600">
                      ₹{filteredDonorBreakdown.reduce((a, d) => a + (d.clinicPendingAmount || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center text-slate-400">-</td>

                    {/* Donor Total */}
                    <td
                      className={`p-3 text-right border-l border-slate-200 dark:border-slate-700 ${
                        basis === "accrual"
                          ? "font-black text-rose-700 dark:text-rose-300 text-sm bg-rose-100/40"
                          : "font-medium text-slate-500"
                      }`}
                    >
                      ₹{filteredDonorBreakdown.reduce((a, d) => a + (d.agreedCompensation || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`p-3 text-right ${
                        basis === "cash"
                          ? "font-black text-rose-600 text-sm bg-rose-100/60 dark:bg-rose-950/40"
                          : "font-bold text-rose-600"
                      }`}
                    >
                      ₹{filteredDonorBreakdown.reduce((a, d) => a + (d.paidAmount || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right font-black text-amber-600">
                      ₹{filteredDonorBreakdown.reduce((a, d) => a + (d.balancePending || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center text-slate-400">-</td>

                    {/* Profit Total */}
                    <td
                      className={`p-3 text-right border-l border-slate-200 dark:border-slate-700 ${
                        basis === "accrual"
                          ? "font-black text-amber-700 dark:text-amber-300 text-sm bg-amber-100/70 dark:bg-amber-950/50"
                          : "font-normal text-slate-400"
                      }`}
                    >
                      ₹{filteredDonorBreakdown.reduce((a, d) => a + (d.serviceCharge || 0), 0).toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`p-3 text-right ${
                        basis === "cash"
                          ? "font-black text-indigo-700 dark:text-indigo-300 text-sm bg-indigo-100/70 dark:bg-indigo-950/50"
                          : "font-semibold text-slate-600"
                      }`}
                    >
                      ₹{filteredDonorBreakdown.reduce((a, d) => a + (d.netRealizedMargin || 0), 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE CASH BOOK (INCOMING & OUTGOING) */}
      {activeTab === "CASHBOOK" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cash Flow Log (Chronological Cash Book)
                </h2>
                {basis === "accrual" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Chronological Cash Journal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete journal of all cash coming in from clinics (+) and disbursements going out to donors (-).
              </p>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search party, UTR or reg ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Direction</th>
                  <th className="p-3.5">Party / Reference</th>
                  <th className="p-3.5">Reg ID</th>
                  <th className="p-3.5 text-right font-black">Amount (INR)</th>
                  <th className="p-3.5 text-right font-black text-indigo-600">
                    Running Balance
                  </th>
                  <th className="p-3.5">Method & UTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 text-slate-400">{tx.sNo}</td>
                    <td className="p-3.5 font-mono text-slate-600">{tx.dateStr}</td>
                    <td className="p-3.5">
                      {tx.type === "IN" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <ArrowDownLeft className="h-3 w-3" />
                          INCOMING (CLINIC)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <ArrowUpRight className="h-3 w-3" />
                          OUTGOING (DONOR)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {tx.entityName}
                    </td>
                    <td className="p-3.5 font-mono text-indigo-600 font-semibold">{tx.registrationId}</td>
                    <td
                      className={`p-3.5 text-right font-black ${
                        tx.type === "IN" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {tx.type === "IN" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 dark:text-slate-100">
                      ₹{tx.runningBalance.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-700 capitalize">{tx.method}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.reference}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredTransactions.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100">
                  <tr>
                    <td className="p-3.5 text-slate-400">Σ</td>
                    <td className="p-3.5 font-black">{filteredTransactions.length} Transactions</td>
                    <td className="p-3.5 text-slate-400">-</td>
                    <td className="p-3.5 text-slate-400">-</td>
                    <td className="p-3.5 text-slate-400">-</td>
                    <td className="p-3.5 text-right font-black">
                      <div className="text-emerald-600 font-bold">
                        +₹{filteredTransactions.filter(t => t.type === "IN").reduce((a, t) => a + (t.amount || 0), 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-rose-600 font-bold">
                        -₹{filteredTransactions.filter(t => t.type === "OUT").reduce((a, t) => a + (t.amount || 0), 0).toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td className={`p-3.5 text-right font-black ${
                      (filteredTransactions.filter(t => t.type === "IN").reduce((a, t) => a + (t.amount || 0), 0) -
                       filteredTransactions.filter(t => t.type === "OUT").reduce((a, t) => a + (t.amount || 0), 0)) >= 0
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-rose-600"
                    }`}>
                      ₹{(
                        filteredTransactions.filter(t => t.type === "IN").reduce((a, t) => a + (t.amount || 0), 0) -
                        filteredTransactions.filter(t => t.type === "OUT").reduce((a, t) => a + (t.amount || 0), 0)
                      ).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3.5 text-slate-400">-</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Accounting Basis Comparison Guide Modal */}
      {showBasisGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Understanding Accounting Methods
                  </h3>
                  <p className="text-xs text-slate-500">
                    How Cash Basis vs Accrual Basis calculates your revenue &amp; profits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBasisGuideModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Method 1: Cash Basis */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                      Cash Basis (Real Cash In/Out)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    Bank Clearance
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Calculates strictly based on <strong>physical bank credits and debits</strong>. Money is recognized only when a clinic pays into your account or when donor compensation is actually disbursed.
                </p>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  ✓ Best for: Daily bank balance reconciliation, cash flow liquidity, and seeing actual cash in hand.
                </div>
              </div>

              {/* Method 2: Accrual Basis */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                      Accrual Basis (Contracted Deals &amp; P&amp;L)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                    Contract Date
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Calculates based on <strong>deal booking and invoice dates</strong>. Total revenue is recognized the day a case is agreed upon, and donor obligations are recorded immediately as payable liabilities.
                </p>
                <div className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium">
                  ✓ Best for: Business profitability (P&amp;L), true operational spread margin, and tracking unpaid clinic dues.
                </div>
              </div>

              {/* Concrete Example */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-amber-500" />
                  Quick Example:
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  If an Egg Donor case for ₹70,000 is completed on Oct 10th with a donor payout of ₹45,000, but the clinic pays on Nov 5th:
                  <br />
                  • <strong>Accrual Basis</strong> records ₹70,000 billed and ₹25,000 margin in October.
                  <br />
                  • <strong>Cash Basis</strong> records ₹0 in October, and ₹70,000 inflow in November when the bank deposit clears.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBasis("cash");
                    setShowBasisGuideModal(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    basis === "cash"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Use Cash Basis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBasis("accrual");
                    setShowBasisGuideModal(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    basis === "accrual"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Use Accrual Basis
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBasisGuideModal(false)}
                className="text-xs h-8"
              >
                Got it, Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
