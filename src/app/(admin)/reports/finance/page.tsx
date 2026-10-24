"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Plus,
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

export default function TaxAndFinanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "GST_INVOICES" | "TDS_SUMMARY" | "TDS_ENTRIES" | "CLINIC_SUMMARY">("OVERVIEW");

  // Filter States
  const [selectedFy, setSelectedFy] = useState("ALL");
  const [selectedQuarter, setSelectedQuarter] = useState("ALL");
  const [selectedHospitalId, setSelectedHospitalId] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Data States
  const [overviewData, setOverviewData] = useState<any>({ summary: {}, monthlyTrends: [] });
  const [gstData, setGstData] = useState<any>({ totals: {}, invoices: [] });
  const [tdsSummaryData, setTdsSummaryData] = useState<any[]>([]);
  const [tdsEntriesData, setTdsEntriesData] = useState<any[]>([]);
  const [clinicSummaryData, setClinicSummaryData] = useState<any[]>([]);

  // Form 16A Modal
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    hospitalId: "",
    financialYear: "2026-27",
    quarter: "Q1",
    certificateNo: "",
    tdsAmountAsPerCert: "",
    notes: "",
  });

  const loadReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFy && selectedFy !== "ALL") params.append("fy", selectedFy);
      if (selectedQuarter && selectedQuarter !== "ALL") params.append("quarter", selectedQuarter);
      if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      // Fetch active tab view
      let viewParam = "overview";
      if (activeTab === "GST_INVOICES") viewParam = "gst-invoices";
      else if (activeTab === "TDS_SUMMARY") viewParam = "tds-summary";
      else if (activeTab === "TDS_ENTRIES") viewParam = "tds-entries";
      else if (activeTab === "CLINIC_SUMMARY") viewParam = "clinic-summary";

      params.append("view", viewParam);

      const res = await fetch(`/api/reports/tax?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (activeTab === "OVERVIEW") {
          setOverviewData(data);
        } else if (activeTab === "GST_INVOICES") {
          setGstData(data);
        } else if (activeTab === "TDS_SUMMARY") {
          setTdsSummaryData(data.tdsSummary || []);
        } else if (activeTab === "TDS_ENTRIES") {
          setTdsEntriesData(data.entries || []);
        } else if (activeTab === "CLINIC_SUMMARY") {
          setClinicSummaryData(data.clinicSummary || []);
        }
      } else {
        toast.error(data.error || "Failed to load report data");
      }
    } catch {
      toast.error("Network error while loading reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, selectedFy, selectedQuarter, selectedHospitalId, startDate, endDate]);

  // Export to Excel for active view
  const handleExportExcel = () => {
    try {
      let exportRows: any[] = [];
      let filename = `Mediyaz_Finance_Report_${activeTab}`;

      if (activeTab === "GST_INVOICES") {
        exportRows = (gstData.invoices || []).map((i: any) => ({
          "S.No": i.sNo,
          "Invoice No": i.invoiceNumber,
          "Invoice Date": i.invoiceDate,
          "Registration ID": i.registrationId,
          "Donor Name": i.donorName,
          "ART Clinic": i.hospitalName,
          "Clinic GSTIN": i.hospitalGstin,
          "Place of Supply": i.placeOfSupply,
          "Supply Type": i.supplyType,
          "SAC Code": i.sacCode,
          "Taxable Value (INR)": i.taxableValue,
          "CGST Rate (%)": i.cgstRate,
          "CGST Amount (INR)": i.cgstAmount,
          "SGST Rate (%)": i.sgstRate,
          "SGST Amount (INR)": i.sgstAmount,
          "IGST Rate (%)": i.igstRate,
          "IGST Amount (INR)": i.igstAmount,
          "Total GST (INR)": i.totalGst,
          "Donor Reimbursement (INR)": i.donorReimbursement,
          "Total Invoice Value (INR)": i.totalInvoiceValue,
        }));
        filename = `GSTR1_Register_${selectedFy}_${selectedQuarter}`;
      } else if (activeTab === "TDS_SUMMARY") {
        exportRows = tdsSummaryData.map((t: any, idx: number) => ({
          "S.No": idx + 1,
          "ART Clinic": t.hospitalName,
          "Financial Year": t.financialYear,
          "Q1 TDS (INR)": t.Q1,
          "Q1 Form 16A": t.certificates?.Q1?.certificateNo || "Pending",
          "Q2 TDS (INR)": t.Q2,
          "Q2 Form 16A": t.certificates?.Q2?.certificateNo || "Pending",
          "Q3 TDS (INR)": t.Q3,
          "Q3 Form 16A": t.certificates?.Q3?.certificateNo || "Pending",
          "Q4 TDS (INR)": t.Q4,
          "Q4 Form 16A": t.certificates?.Q4?.certificateNo || "Pending",
          "Total TDS Deducted (INR)": t.totalTds,
        }));
        filename = `TDS_Summary_Reconciliation_${selectedFy}`;
      } else if (activeTab === "TDS_ENTRIES") {
        exportRows = tdsEntriesData.map((e: any, idx: number) => ({
          "S.No": idx + 1,
          "Payment No": e.paymentNo,
          "Payment Date": e.paymentDate,
          "Reference UTR": e.reference,
          "Clinic Name": e.hospitalName,
          "Reg ID": e.registrationId,
          "Donor Name": e.donorName,
          "Invoice / Bill Ref": e.invoiceNumber,
          "Gross Amount (INR)": e.grossAmount,
          "TDS Amount (INR)": e.tdsAmount,
          "Net Cash Received (INR)": e.netAmount,
          "TDS Section": e.tdsSection,
          "Financial Year": e.financialYear,
          "Quarter": e.quarter,
        }));
        filename = `TDS_Deduction_Entries_${selectedFy}`;
      } else if (activeTab === "CLINIC_SUMMARY") {
        exportRows = clinicSummaryData.map((c: any, idx: number) => ({
          "S.No": idx + 1,
          "Clinic Name": c.hospitalName,
          "State": c.state,
          "Total Cases": c.totalCases,
          "Total Billed (INR)": c.totalBilled,
          "Net Received (INR)": c.totalReceived,
          "TDS Deducted (INR)": c.totalTds,
          "GST Output (INR)": c.totalGst,
          "Pending Balance (INR)": c.totalPending,
          "Collection Rate (%)": `${c.collectionRate}%`,
        }));
        filename = `Clinic_Revenue_Summary_${selectedFy}`;
      }

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel report exported successfully!");
    } catch {
      toast.error("Failed to export Excel report");
    }
  };

  // Submit Form 16A
  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tds-certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: certForm.hospitalId,
          financialYear: certForm.financialYear,
          quarter: certForm.quarter,
          certificateNo: certForm.certificateNo,
          tdsAmountAsPerCert: Number(certForm.tdsAmountAsPerCert),
          notes: certForm.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Form 16A Certificate recorded successfully!");
        setIsCertModalOpen(false);
        loadReportData();
      } else {
        toast.error(data.error || "Failed to save certificate");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <Link href="/invoices">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Tax & Financial Audits
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
                GSTR-1 & Form 16A
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Financial Year, Quarter, and Clinic breakdown for GST returns, TDS deductions, and revenue clearance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setIsCertModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            + Record Form 16A Certificate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs h-9 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export GSTR / TDS Excel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadReportData}
            disabled={loading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("OVERVIEW")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
            activeTab === "OVERVIEW"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Overview & Monthly Trends
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("GST_INVOICES")}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            activeTab === "GST_INVOICES"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/50"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          GSTR-1 Invoice Register
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TDS_SUMMARY")}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            activeTab === "TDS_SUMMARY"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-amber-700 dark:text-amber-400 hover:bg-amber-100/50"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Form 16A Reconciliation
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TDS_ENTRIES")}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            activeTab === "TDS_ENTRIES"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-purple-700 dark:text-purple-400 hover:bg-purple-100/50"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          All TDS Deductions
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CLINIC_SUMMARY")}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            activeTab === "CLINIC_SUMMARY"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Clinic Revenue Matrix
        </button>
      </div>

      {/* Shared Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={selectedFy}
          onChange={(e) => setSelectedFy(e.target.value)}
          className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
        >
          <option value="ALL">All Financial Years</option>
          <option value="2027-28">FY 2027-28</option>
          <option value="2026-27">FY 2026-27</option>
          <option value="2025-26">FY 2025-26</option>
          <option value="2024-25">FY 2024-25</option>
        </select>

        <select
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(e.target.value)}
          className="h-8.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
        >
          <option value="ALL">All Quarters</option>
          <option value="Q1">Q1 (Apr - Jun)</option>
          <option value="Q2">Q2 (Jul - Sep)</option>
          <option value="Q3">Q3 (Oct - Dec)</option>
          <option value="Q4">Q4 (Jan - Mar)</option>
        </select>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>From:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8.5 text-xs w-36"
          />
          <span>To:</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8.5 text-xs w-36"
          />
        </div>

        {(startDate || endDate || selectedFy !== "ALL" || selectedQuarter !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFy("ALL");
              setSelectedQuarter("ALL");
              setStartDate("");
              setEndDate("");
            }}
            className="h-8.5 text-xs text-rose-600 hover:text-rose-700"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Invoiced & Billed</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                ₹{(overviewData.summary?.totalBilled || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-400 mt-1">{overviewData.summary?.totalRecords || 0} Total Records</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-emerald-600 font-semibold uppercase">Net Cash Realized</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ₹{(overviewData.summary?.totalReceived || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Clearance Rate: {overviewData.summary?.collectionRate || 0}%
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-amber-600 font-semibold uppercase">TDS Withheld by Clinics</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                ₹{(overviewData.summary?.totalTds || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-400 mt-1">To reconcile with Form 16A</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-indigo-600 font-semibold uppercase">Total GST Output (18%)</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">
                ₹{(overviewData.summary?.totalGst || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-400 mt-1">CGST + SGST + IGST</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-rose-600 font-semibold uppercase">Pending Liability</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">
                ₹{(overviewData.summary?.totalPending || 0).toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-400 mt-1">Outstanding collections</p>
            </div>
          </div>

          {/* Monthly Trends Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Month-by-Month Financial Trend</span>
              <span className="text-xs text-slate-500 font-normal">Audited Billing & Collection Data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Period</th>
                    <th className="p-3 text-center">Cases</th>
                    <th className="p-3 text-right">Billed Amount</th>
                    <th className="p-3 text-right">Cash Received</th>
                    <th className="p-3 text-right">TDS Deducted</th>
                    <th className="p-3 text-right">GST Output</th>
                    <th className="p-3 text-right font-bold">Clearance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(overviewData.monthlyTrends || []).map((m: any) => (
                    <tr key={m.monthKey} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{m.monthKey}</td>
                      <td className="p-3 text-center">{m.count}</td>
                      <td className="p-3 text-right font-bold text-slate-900">₹{m.billed.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600">₹{m.received.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-semibold text-amber-600">₹{m.tds.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-semibold text-indigo-600">₹{m.gst.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {m.billed > 0 ? Math.round((m.received / m.billed) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. GSTR-1 INVOICE REGISTER */}
      {activeTab === "GST_INVOICES" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-indigo-600" />
              <span>GSTR-1 Compliant Tax Invoice Register</span>
            </div>
            <div className="text-xs text-slate-500 font-normal">
              Total Taxable: ₹{(gstData.totals?.taxableValue || 0).toLocaleString("en-IN")} • Total GST: ₹
              {(gstData.totals?.totalGst || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Clinic & GSTIN</th>
                  <th className="p-3">Supply Type</th>
                  <th className="p-3 text-right">Taxable (SAC 999321)</th>
                  <th className="p-3 text-right">CGST (9%)</th>
                  <th className="p-3 text-right">SGST (9%)</th>
                  <th className="p-3 text-right">IGST (18%)</th>
                  <th className="p-3 text-right">Total GST</th>
                  <th className="p-3 text-right">Reimbursement</th>
                  <th className="p-3 text-right font-bold">Total Invoice Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(gstData.invoices || []).map((i: any) => (
                  <tr key={i.invoiceNumber} className="hover:bg-slate-50">
                    <td className="p-3">{i.sNo}</td>
                    <td className="p-3 font-mono font-bold text-indigo-600">#{i.invoiceNumber}</td>
                    <td className="p-3 text-slate-600">{i.invoiceDate}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{i.hospitalName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{i.hospitalGstin}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {i.supplyType} ({i.placeOfSupply})
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-900">₹{i.taxableValue.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-slate-600">₹{i.cgstAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-slate-600">₹{i.sgstAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-slate-600">₹{i.igstAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-bold text-indigo-600">₹{i.totalGst.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-slate-600">₹{i.donorReimbursement.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{i.totalInvoiceValue.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. TDS RECONCILIATION & FORM 16A */}
      {activeTab === "TDS_SUMMARY" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Clinic TDS Deductions vs Form 16A Certificate Matrix</span>
            </div>
            <Button size="sm" onClick={() => setIsCertModalOpen(true)} className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white">
              + Upload / Record Form 16A
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Clinic Name</th>
                  <th className="p-3">FY</th>
                  <th className="p-3 text-center">Q1 (Apr-Jun)</th>
                  <th className="p-3 text-center">Q2 (Jul-Sep)</th>
                  <th className="p-3 text-center">Q3 (Oct-Dec)</th>
                  <th className="p-3 text-center">Q4 (Jan-Mar)</th>
                  <th className="p-3 text-right font-bold">Total TDS Deducted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tdsSummaryData.map((t: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{t.hospitalName}</td>
                    <td className="p-3 font-mono">{t.financialYear}</td>
                    {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                      const amount = t[q] || 0;
                      const cert = t.certificates?.[q];
                      return (
                        <td key={q} className="p-3 text-center">
                          <div className="font-semibold text-slate-900">₹{amount.toLocaleString("en-IN")}</div>
                          {cert ? (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              Form 16A: {cert.certificateNo || "Matched"}
                            </span>
                          ) : amount > 0 ? (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                              Cert Pending
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-right font-bold text-amber-600">
                      ₹{t.totalTds.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. ALL TDS DEDUCTIONS */}
      {activeTab === "TDS_ENTRIES" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
            Individual TDS Deductions per Transaction Allocation
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Payment No & Date</th>
                  <th className="p-3">Reference UTR</th>
                  <th className="p-3">ART Clinic</th>
                  <th className="p-3">Donor / Bill Ref</th>
                  <th className="p-3 text-right">Gross Settled</th>
                  <th className="p-3 text-right">TDS Deducted</th>
                  <th className="p-3 text-right">Net Received</th>
                  <th className="p-3 text-center">TDS Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tdsEntriesData.map((e: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-mono font-bold text-indigo-600">{e.paymentNo}</div>
                      <div className="text-[10px] text-slate-500">{e.paymentDate}</div>
                    </td>
                    <td className="p-3 font-mono">{e.reference || "-"}</td>
                    <td className="p-3 font-semibold text-slate-900">{e.hospitalName}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{e.donorName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{e.invoiceNumber}</div>
                    </td>
                    <td className="p-3 text-right text-slate-900">₹{e.grossAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-bold text-amber-600">₹{e.tdsAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">₹{e.netAmount.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {e.tdsSection}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. CLINIC REVENUE MATRIX */}
      {activeTab === "CLINIC_SUMMARY" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
            ART Clinic Revenue, Tax & Collection Efficiency Leaderboard
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Clinic Name</th>
                  <th className="p-3">State</th>
                  <th className="p-3 text-center">Cases</th>
                  <th className="p-3 text-right">Total Billed</th>
                  <th className="p-3 text-right">Net Received</th>
                  <th className="p-3 text-right">TDS Deducted</th>
                  <th className="p-3 text-right">GST Output</th>
                  <th className="p-3 text-right">Pending Balance</th>
                  <th className="p-3 text-right font-bold">Clearance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clinicSummaryData.map((c: any) => (
                  <tr key={c.hospitalId} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{c.hospitalName}</td>
                    <td className="p-3 text-slate-600">{c.state}</td>
                    <td className="p-3 text-center">{c.totalCases}</td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{c.totalBilled.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-semibold text-emerald-600">₹{c.totalReceived.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-amber-600">₹{c.totalTds.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-indigo-600">₹{c.totalGst.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-bold text-rose-600">₹{c.totalPending.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{c.collectionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM 16A MODAL */}
      {isCertModalOpen && (
        <Dialog open={isCertModalOpen} onOpenChange={setIsCertModalOpen}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Record Form 16A Certificate</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Enter the Form 16A certificate details received from the clinic to reconcile deducted TDS.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveCert} className="space-y-4 mt-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">ART Clinic *</label>
                <select
                  value={certForm.hospitalId}
                  onChange={(e) => setCertForm({ ...certForm, hospitalId: e.target.value })}
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                >
                  <option value="">Select Clinic...</option>
                  {clinicSummaryData.map((c: any) => (
                    <option key={c.hospitalId} value={c.hospitalId}>
                      {c.hospitalName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Financial Year</label>
                  <select
                    value={certForm.financialYear}
                    onChange={(e) => setCertForm({ ...certForm, financialYear: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  >
                    <option value="2027-28">2027-28</option>
                    <option value="2026-27">2026-27</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Quarter</label>
                  <select
                    value={certForm.quarter}
                    onChange={(e) => setCertForm({ ...certForm, quarter: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  >
                    <option value="Q1">Q1 (Apr - Jun)</option>
                    <option value="Q2">Q2 (Jul - Sep)</option>
                    <option value="Q3">Q3 (Oct - Dec)</option>
                    <option value="Q4">Q4 (Jan - Mar)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Certificate No *</label>
                <Input
                  placeholder="e.g. AA12345678"
                  value={certForm.certificateNo}
                  onChange={(e) => setCertForm({ ...certForm, certificateNo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">TDS Amount in Certificate (₹) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 15000"
                  value={certForm.tdsAmountAsPerCert}
                  onChange={(e) => setCertForm({ ...certForm, tdsAmountAsPerCert: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Notes / Remarks</label>
                <Input
                  placeholder="Optional remarks"
                  value={certForm.notes}
                  onChange={(e) => setCertForm({ ...certForm, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCertModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Save Certificate
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
