"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  FileText, 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp, 
  Filter,
  Droplet,
  Users,
  Activity,
  Heart,
  FileSpreadsheet,
  Gift,
  Award,
  Share2,
  Building2,
  Receipt,
  Dna,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Search,
  X
} from "lucide-react";
import { toast } from "sonner";

type ReportCategory = 
  | "registrations"
  | "inquiries"
  | "hospitals"
  | "financial"
  | "donors"
  | "inventory"
  | "marketing";

const formatInr = (amount: number) => {
  return "₹" + (amount || 0).toLocaleString("en-IN");
};

export default function AdminReportsPage() {
  const [category, setCategory] = useState<ReportCategory>("registrations");
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter States
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [status, setStatus] = useState("");
  const [gameteType, setGameteType] = useState<"all" | "egg" | "sperm">("all");

  async function loadReportData() {
    setLoading(true);
    try {
      if (category === "registrations") {
        const [eggRes, spermRes] = await Promise.all([
          fetch("/api/donor-registrations/egg?limit=1000").then(r => r.json()).catch(() => ({ registrations: [] })),
          fetch("/api/donor-registrations/sperm?limit=1000").then(r => r.json()).catch(() => ({ registrations: [] }))
        ]);
        const eggList = (eggRes.registrations || []).map((r: any) => ({ ...r, donorType: "egg" }));
        const spermList = (spermRes.registrations || []).map((r: any) => ({ ...r, donorType: "sperm" }));
        setDataList([...eggList, ...spermList]);
      } else if (category === "inquiries") {
        const res = await fetch("/api/donor-queries?limit=1000");
        const data = await res.json();
        setDataList(data.inquiries || []);
      } else if (category === "hospitals") {
        const res = await fetch("/api/hospitals?limit=1000");
        const data = await res.json();
        setDataList(data.hospitals || []);
      } else if (category === "financial") {
        const res = await fetch("/api/invoices?limit=1000");
        const data = await res.json();
        setDataList(data.invoices || []);
      } else if (category === "donors") {
        const res = await fetch("/api/donors?limit=1000");
        const data = await res.json();
        setDataList(data.donors || []);
      } else if (category === "inventory") {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success && data.stats) {
          setDataList(data.stats.bloodGroupStats || []);
        } else {
          setDataList([]);
        }
      } else if (category === "marketing") {
        const res = await fetch("/api/referrals?limit=1000");
        const data = await res.json();
        const refs = data.referrals || [];
        const counts: Record<string, { count: number; totalRewards: number; paidCount: number }> = {};
        refs.forEach((r: any) => {
          const src = r.sourceReferralType || "Website";
          if (!counts[src]) {
            counts[src] = { count: 0, totalRewards: 0, paidCount: 0 };
          }
          counts[src].count += 1;
          counts[src].totalRewards += (r.rewardAmount || 0);
          if (r.rewardStatus === "Paid") {
            counts[src].paidCount += 1;
          }
        });
        const mapped = Object.entries(counts).map(([source, stats]) => ({
          source,
          count: stats.count,
          totalRewards: stats.totalRewards,
          paidCount: stats.paidCount
        }));
        setDataList(mapped);
      }
    } catch (err) {
      console.error("Report data load error:", err);
      toast.error("Failed to load reporting dataset.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setStatus("");
    setBloodGroup("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setGameteType("all");
    loadReportData();
  }, [category]);

  // Apply Multi-Parameter Filters
  const filteredReportData = useMemo(() => {
    let result = [...dataList];

    // 1. Text Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => {
        if (category === "registrations") {
          return (
            (item.registrationId || "").toLowerCase().includes(q) ||
            (item.personalInfo?.fullName || "").toLowerCase().includes(q) ||
            (item.contactInfo?.mobileNumber || "").toLowerCase().includes(q) ||
            (item.assignedHospital?.name || "").toLowerCase().includes(q)
          );
        }
        if (category === "inquiries") {
          return (
            (item.fullName || "").toLowerCase().includes(q) ||
            (item.mobileNumber || "").toLowerCase().includes(q) ||
            (item.city || "").toLowerCase().includes(q)
          );
        }
        if (category === "hospitals") {
          return (
            (item.name || "").toLowerCase().includes(q) ||
            (item.registrationNumber || "").toLowerCase().includes(q) ||
            (item.city || "").toLowerCase().includes(q) ||
            (item.contactPerson || "").toLowerCase().includes(q)
          );
        }
        if (category === "financial") {
          return (
            (item.invoiceNumber || "").toLowerCase().includes(q) ||
            (item.registrationId || "").toLowerCase().includes(q) ||
            (item.donorName || "").toLowerCase().includes(q) ||
            (item.hospitalName || "").toLowerCase().includes(q)
          );
        }
        if (category === "donors") {
          return (
            (item.donorCode || item.donorId || "").toLowerCase().includes(q) ||
            (item.personalInformation?.name || "").toLowerCase().includes(q)
          );
        }
        if (category === "marketing") {
          return (item.source || "").toLowerCase().includes(q);
        }
        return true;
      });
    }

    // 2. Gamete Type Filter
    if (gameteType !== "all") {
      if (category === "registrations") {
        result = result.filter(item => item.donorType === gameteType);
      } else if (category === "inquiries") {
        result = result.filter(item => item.donationInterest === gameteType);
      } else if (category === "donors") {
        result = result.filter(item => item.gameteType === gameteType);
      }
    }

    // 3. Blood Group Filter
    if (bloodGroup) {
      if (category === "registrations") {
        result = result.filter(item => (item.personalInfo?.bloodGroup || "").toUpperCase() === bloodGroup.toUpperCase());
      } else if (category === "donors") {
        result = result.filter(item => (item.bloodType || item.personalInformation?.bloodGroup || "").toUpperCase() === bloodGroup.toUpperCase());
      } else if (category === "inventory") {
        result = result.filter(item => (item.bloodGroup || "").toUpperCase() === bloodGroup.toUpperCase());
      }
    }

    // 4. Status Filter
    if (status) {
      if (category === "registrations" || category === "inquiries" || category === "hospitals") {
        result = result.filter(item => item.status === status);
      } else if (category === "financial") {
        result = result.filter(item => item.paymentStatus === status);
      } else if (category === "donors") {
        result = result.filter(item => item.availability === status || item.donationStatus === status);
      }
    }

    // 5. Date Range Filter
    if (startDate) {
      const start = new Date(startDate).getTime();
      result = result.filter(item => {
        const dateVal = item.createdAt || item.invoiceDate || item.date;
        return dateVal ? new Date(dateVal).getTime() >= start : true;
      });
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000;
      result = result.filter(item => {
        const dateVal = item.createdAt || item.invoiceDate || item.date;
        return dateVal ? new Date(dateVal).getTime() <= end : true;
      });
    }

    return result;
  }, [dataList, category, search, gameteType, bloodGroup, status, startDate, endDate]);

  // Summary Metrics Computation for Active Filtered Set
  const reportSummary = useMemo(() => {
    const totalRecords = filteredReportData.length;

    if (category === "financial") {
      let totalBilled = 0;
      let totalReceived = 0;
      let settledCount = 0;
      filteredReportData.forEach(item => {
        const billed = Number(item.totalAgreedAmount || item.amount || 0);
        const received = Number(item.receivedAmount || (item.paymentStatus === "RECEIVED" ? billed : 0));
        totalBilled += billed;
        totalReceived += received;
        if (item.paymentStatus === "RECEIVED") settledCount++;
      });
      return {
        totalRecords,
        metric1Label: "Total Invoiced Gross",
        metric1Value: formatInr(totalBilled),
        metric2Label: "Total Payments Received",
        metric2Value: formatInr(totalReceived),
        metric3Label: "Outstanding Receivables",
        metric3Value: formatInr(Math.max(0, totalBilled - totalReceived)),
        metric4Label: "Settled Invoices",
        metric4Value: `${settledCount} / ${totalRecords}`
      };
    }

    if (category === "registrations") {
      const approvedCount = filteredReportData.filter(r => r.status === "APPROVED" || r.status === "COMPLETED" || r.status === "FILE_COMPLETED").length;
      const eggCount = filteredReportData.filter(r => r.donorType === "egg").length;
      const spermCount = filteredReportData.filter(r => r.donorType === "sperm").length;
      return {
        totalRecords,
        metric1Label: "Approved & Completed",
        metric1Value: approvedCount,
        metric2Label: "Egg Donor Dossiers",
        metric2Value: eggCount,
        metric3Label: "Sperm Donor Files",
        metric3Value: spermCount,
        metric4Label: "Approval Rate",
        metric4Value: totalRecords > 0 ? `${Math.round((approvedCount / totalRecords) * 100)}%` : "0%"
      };
    }

    if (category === "hospitals") {
      const activeCount = filteredReportData.filter(h => h.status === "ACTIVE").length;
      const totalDoctors = filteredReportData.reduce((sum, h) => sum + (h.doctors?.length || 0), 0);
      return {
        totalRecords,
        metric1Label: "Active IVF Centers",
        metric1Value: activeCount,
        metric2Label: "Treating Specialists",
        metric2Value: totalDoctors,
        metric3Label: "Verified Centers",
        metric3Value: `${activeCount} / ${totalRecords}`,
        metric4Label: "Clinical Network",
        metric4Value: "Pan-India"
      };
    }

    if (category === "marketing") {
      const totalInquiries = filteredReportData.reduce((sum, item) => sum + item.count, 0);
      const totalRewards = filteredReportData.reduce((sum, item) => sum + (item.totalRewards || 0), 0);
      return {
        totalRecords,
        metric1Label: "Referral Inquiries",
        metric1Value: totalInquiries,
        metric2Label: "Rewards Accrued",
        metric2Value: formatInr(totalRewards),
        metric3Label: "Marketing Channels",
        metric3Value: totalRecords,
        metric4Label: "Top Channel",
        metric4Value: filteredReportData[0]?.source || "Direct"
      };
    }

    return {
      totalRecords,
      metric1Label: "Total Filtered Items",
      metric1Value: totalRecords,
      metric2Label: "Compliance Check",
      metric2Value: "Verified",
      metric3Label: "Audit State",
      metric3Value: "Active",
      metric4Label: "Export Ready",
      metric4Value: "Yes"
    };
  }, [filteredReportData, category]);

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (filteredReportData.length === 0) {
      toast.error("No report data available to export.");
      return;
    }

    let headers: string[] = [];
    let rows: any[][] = [];

    if (category === "registrations") {
      headers = ["Reg ID", "Full Name", "Gamete Type", "Blood Group", "Aadhaar", "Phone", "Email", "Assigned Clinic", "Status", "Date Submitted"];
      rows = filteredReportData.map(reg => [
        reg.registrationId || "",
        reg.personalInfo?.fullName || "Anonymous",
        (reg.donorType || "").toUpperCase(),
        reg.personalInfo?.bloodGroup || "",
        reg.personalInfo?.aadhaarNumber || "",
        reg.contactInfo?.mobileNumber || "",
        reg.contactInfo?.emailAddress || "",
        reg.assignedHospital?.name || "Unassigned",
        reg.status || "",
        new Date(reg.createdAt).toLocaleDateString("en-IN")
      ]);
    } else if (category === "financial") {
      headers = ["Invoice No", "Reg ID", "Donor Name", "Assigned Clinic", "Gross Billed (₹)", "Received (₹)", "Balance (₹)", "Status", "Invoice Date"];
      rows = filteredReportData.map(inv => {
        const billed = Number(inv.totalAgreedAmount || inv.amount || 0);
        const received = Number(inv.receivedAmount || (inv.paymentStatus === "RECEIVED" ? billed : 0));
        return [
          inv.invoiceNumber || "",
          inv.registrationId || "",
          inv.donorName || "",
          inv.hospitalName || "",
          billed,
          received,
          Math.max(0, billed - received),
          inv.paymentStatus || "",
          inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : ""
        ];
      });
    } else if (category === "inquiries") {
      headers = ["Candidate Name", "Gamete Interest", "Phone", "Email", "City", "State", "Status", "Date Inquired"];
      rows = filteredReportData.map(inq => [
        inq.fullName || "",
        (inq.donationInterest || "").toUpperCase(),
        inq.mobileNumber || "",
        inq.emailAddress || "",
        inq.city || "",
        inq.state || "",
        inq.status || "",
        new Date(inq.createdAt).toLocaleDateString("en-IN")
      ]);
    } else if (category === "hospitals") {
      headers = ["Clinic Name", "Reg Number", "City", "State", "Contact Person", "Phone", "Treating Doctors", "Status"];
      rows = filteredReportData.map(h => [
        h.name || "",
        h.registrationNumber || "",
        h.city || "",
        h.state || "",
        h.contactPerson || "",
        h.contactPhone || h.phone || "",
        (h.doctors || []).map((d: any) => d.name).join("; "),
        h.status || ""
      ]);
    } else if (category === "donors") {
      headers = ["Donor ID", "Gamete", "Blood Group", "Age", "Height", "Availability", "Status"];
      rows = filteredReportData.map(d => [
        d.donorCode || d.donorId || "",
        (d.gameteType || "").toUpperCase(),
        d.bloodType || d.personalInformation?.bloodGroup || "",
        d.age || "",
        d.heightFormatted || `${d.heightCm} cm` || "",
        d.availability || "",
        d.donationStatus || ""
      ]);
    } else if (category === "inventory") {
      headers = ["Blood Group", "Donor Specimens Count", "Stock Classification"];
      rows = filteredReportData.map(item => [
        item.bloodGroup,
        item.units,
        item.units > 10 ? "Adequate" : item.units > 3 ? "Moderate" : "Low Inventory"
      ]);
    } else if (category === "marketing") {
      headers = ["Attribution Source", "Inquiries Count", "Rewards Accrued (₹)", "Paid Count"];
      rows = filteredReportData.map(item => [
        item.source,
        item.count,
        item.totalRewards || 0,
        item.paidCount || 0
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${category}_analytical_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Successfully exported ${category.toUpperCase()} analytical report.`);
  };

  return (
    <div className="space-y-6 pb-12 print:bg-white print:p-0 animate-in fade-in duration-200">
      
      {/* Executive Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#285b63]" />
              Analytical Reporting &amp; Regulatory Console
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200">
              Statutory Audits
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate, filter, and export administrative audits for donor dossiers, Form 13/14 filings, billing ledgers, and clinic quotas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={loadReportData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="rounded-xl text-xs h-9 gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#285b63]" : "text-slate-500"}`} />
            <span>Sync</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9 gap-1.5 bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200 font-bold hover:bg-teal-100"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export Excel / CSV</span>
          </Button>

          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9 gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </Button>
        </div>
      </div>

      {/* Domain Switcher Ribbon (7 Categories) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 print:hidden">
        {[
          { id: "registrations", label: "Registrations", desc: "Form 13 / 14 dossiers", icon: Users, color: "text-[#285b63]" },
          { id: "financial", label: "Billing Ledger", desc: "Invoices & collections", icon: Receipt, color: "text-emerald-600" },
          { id: "hospitals", label: "Clinic Network", desc: "Partner quotas & doctors", icon: Building2, color: "text-blue-600" },
          { id: "inquiries", label: "Candidate Leads", desc: "Pre-screening logs", icon: FileText, color: "text-amber-600" },
          { id: "donors", label: "Approved Donors", desc: "Verified ART inventory", icon: Heart, color: "text-rose-600" },
          { id: "inventory", label: "Blood Census", desc: "Specimen stock breakdown", icon: Droplet, color: "text-rose-500" },
          { id: "marketing", label: "Attribution", desc: "Marketing source shares", icon: TrendingUp, color: "text-purple-600" }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as any)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              category === cat.id 
                ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 ring-1 ring-teal-500/30 shadow-xs" 
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <cat.icon className={`w-4 h-4 mb-2 ${cat.color}`} />
            <div className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">{cat.label}</div>
            <div className="text-[9px] text-slate-400 mt-0.5 leading-snug line-clamp-1">{cat.desc}</div>
          </button>
        ))}
      </div>

      {/* Real-time Summary Cards for Active Filtered Set */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{reportSummary.metric1Label}</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {reportSummary.metric1Value}
          </div>
        </Card>
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{reportSummary.metric2Label}</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {reportSummary.metric2Value}
          </div>
        </Card>
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{reportSummary.metric3Label}</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {reportSummary.metric3Value}
          </div>
        </Card>
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{reportSummary.metric4Label}</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {reportSummary.metric4Value}
          </div>
        </Card>
      </div>

      {/* Advanced Filter Studio */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-3 print:hidden shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search Box */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold uppercase text-slate-400">Search Filter</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, candidate name, phone, or clinic..."
                className="pl-9 h-9 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Gamete Type Filter */}
          {["registrations", "inquiries", "donors"].includes(category) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Gamete Stream</label>
              <select
                value={gameteType}
                onChange={(e) => setGameteType(e.target.value as any)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Gametes (Egg &amp; Sperm)</option>
                <option value="egg">Egg Donors Only</option>
                <option value="sperm">Sperm Donors Only</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          {["registrations", "financial", "inquiries", "hospitals", "donors"].includes(category) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Workflow Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="">All Statuses</option>
                {category === "registrations" && (
                  <>
                    <option value="APPROVED">APPROVED (In Management)</option>
                    <option value="WAITING_FORM13">WAITING_FORM13</option>
                    <option value="FILE_COMPLETED">FILE_COMPLETED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </>
                )}
                {category === "financial" && (
                  <>
                    <option value="RECEIVED">RECEIVED (Settled)</option>
                    <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="UNPAID">UNPAID</option>
                  </>
                )}
                {category === "inquiries" && (
                  <>
                    <option value="New Inquiry">New Inquiry</option>
                    <option value="Contact Attempted">Contact Attempted</option>
                    <option value="Consultation Scheduled">Consultation Scheduled</option>
                    <option value="Consultation Completed">Consultation Completed</option>
                  </>
                )}
                {category === "hospitals" && (
                  <>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </>
                )}
                {category === "donors" && (
                  <>
                    <option value="available">Available in Bank</option>
                    <option value="allocated">Allocated to Clinic</option>
                    <option value="quarantine">In Quarantine</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Blood Group Filter */}
          {["registrations", "donors", "inventory"].includes(category) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="">All Blood Groups</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Start */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">From Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Date Range End */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">To Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

        </div>

        {/* Clear Filters Reset Button */}
        {(search || startDate || endDate || bloodGroup || status || gameteType !== "all") && (
          <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-slate-900">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStartDate("");
                setEndDate("");
                setBloodGroup("");
                setStatus("");
                setGameteType("all");
              }}
              className="text-xs text-rose-600 hover:text-rose-700 h-7 px-2 font-semibold cursor-pointer"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Main Report Table Container */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-extrabold capitalize text-slate-900 dark:text-white flex items-center gap-2">
              <span>{category} Statutory Roster</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {filteredReportData.length} records
              </span>
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-400" suppressHydrationWarning>
              Audit snapshot compiled on {mounted ? new Date().toLocaleString("en-IN") : "statutory sync"}
            </CardDescription>
          </div>
          <div className="text-xs font-semibold text-slate-500 print:hidden">
            Scope: Pan-India ART Operations
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <DataTableSkeleton rows={8} />
          ) : filteredReportData.length === 0 ? (
            <div className="text-center py-20 text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <span>No matching records found for the applied reporting filters.</span>
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                
                {/* 1. REGISTRATIONS ROSTER */}
                {category === "registrations" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3.5">Registration ID</th>
                        <th className="p-3.5">Candidate Name</th>
                        <th className="p-3.5">Gamete Stream</th>
                        <th className="p-3.5">Blood Group</th>
                        <th className="p-3.5">Contact Details</th>
                        <th className="p-3.5">Assigned Clinic</th>
                        <th className="p-3.5">Regulatory Status</th>
                        <th className="p-3.5 text-right">Filing Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReportData.map((reg, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#285b63] dark:text-teal-400">
                            {reg.registrationId}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {reg.personalInfo?.fullName || "Altruistic Donor"}
                          </td>
                          <td className="p-3.5 font-semibold">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              reg.donorType === "egg"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300"
                            }`}>
                              {reg.donorType === "egg" ? "🥚 EGG" : "🧬 SPERM"}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-rose-600 font-mono">
                            {reg.personalInfo?.bloodGroup || "—"}
                          </td>
                          <td className="p-3.5 space-y-0.5 text-[11px]">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{reg.contactInfo?.mobileNumber || "—"}</div>
                            <div className="text-[10px] text-slate-400">{reg.contactInfo?.emailAddress || ""}</div>
                          </td>
                          <td className="p-3.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {reg.assignedHospital?.name || "Unassigned"}
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={reg.status} size="xs" />
                          </td>
                          <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">
                            {new Date(reg.createdAt).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 2. FINANCIAL / INVOICES ROSTER */}
                {category === "financial" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3.5">Invoice #</th>
                        <th className="p-3.5">Donor Dossier</th>
                        <th className="p-3.5">Affiliate Clinic</th>
                        <th className="p-3.5 text-right">Agreed Gross</th>
                        <th className="p-3.5 text-right">Received</th>
                        <th className="p-3.5 text-right">Balance Due</th>
                        <th className="p-3.5">Settlement Status</th>
                        <th className="p-3.5 text-right">Invoice Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReportData.map((inv, idx) => {
                        const billed = Number(inv.totalAgreedAmount || inv.amount || 0);
                        const received = Number(inv.receivedAmount || (inv.paymentStatus === "RECEIVED" ? billed : 0));
                        const due = Math.max(0, billed - received);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {inv.invoiceNumber}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900 dark:text-white">{inv.donorName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{inv.registrationId}</div>
                            </td>
                            <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                              {inv.hospitalName}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatInr(billed)}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatInr(received)}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                              {formatInr(due)}
                            </td>
                            <td className="p-3.5">
                              <StatusBadge status={inv.paymentStatus} size="xs" />
                            </td>
                            <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">
                              {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </>
                )}

                {/* 3. CANDIDATE INQUIRIES ROSTER */}
                {category === "inquiries" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3.5">Candidate Name</th>
                        <th className="p-3.5">Gamete Interest</th>
                        <th className="p-3.5">Phone &amp; Email</th>
                        <th className="p-3.5">Location</th>
                        <th className="p-3.5">Preferred Contact</th>
                        <th className="p-3.5">Lead Status</th>
                        <th className="p-3.5 text-right">Inquiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReportData.map((inq, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {inq.fullName}
                          </td>
                          <td className="p-3.5 font-bold uppercase text-[10px]">
                            {inq.donationInterest}
                          </td>
                          <td className="p-3.5 space-y-0.5 text-[11px]">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{inq.mobileNumber}</div>
                            <div className="text-[10px] text-slate-400">{inq.emailAddress}</div>
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400">
                            {inq.city ? `${inq.city}, ${inq.state}` : "—"}
                          </td>
                          <td className="p-3.5 text-slate-500 text-[11px]">
                            {inq.preferredContactTime || "Anytime"}
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={inq.status} size="xs" />
                          </td>
                          <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">
                            {new Date(inq.createdAt).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 4. CLINIC NETWORK ROSTER */}
                {category === "hospitals" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3.5">Clinic Name</th>
                        <th className="p-3.5">Reg Number</th>
                        <th className="p-3.5">Location</th>
                        <th className="p-3.5">Contact Person</th>
                        <th className="p-3.5">Treating Doctors</th>
                        <th className="p-3.5">Operational State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReportData.map((h, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {h.name}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">
                            {h.registrationNumber || "—"}
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300">
                            {h.city}, {h.state}
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{h.contactPerson || "Primary Admin"}</div>
                            <div className="text-[10px] text-slate-400">{h.contactPhone || h.phone || ""}</div>
                          </td>
                          <td className="p-3.5 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                            {(h.doctors || []).length} registered specialists
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={h.status || "ACTIVE"} size="xs" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 5. APPROVED ART DONORS ROSTER */}
                {category === "donors" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3.5">Donor Code</th>
                        <th className="p-3.5">Gamete Type</th>
                        <th className="p-3.5">Blood Group</th>
                        <th className="p-3.5">Age &amp; Height</th>
                        <th className="p-3.5">Availability</th>
                        <th className="p-3.5">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReportData.map((d, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                            {d.donorCode || d.donorId}
                          </td>
                          <td className="p-3.5 font-bold uppercase text-[10px]">
                            {d.gameteType}
                          </td>
                          <td className="p-3.5 font-bold text-rose-600 font-mono">
                            {d.bloodType || d.personalInformation?.bloodGroup}
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300">
                            {d.age} yrs • {d.heightFormatted || `${d.heightCm} cm`}
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={d.availability || "available"} size="xs" />
                          </td>
                          <td className="p-3.5">
                            <StatusBadge status={d.donationStatus || "ACTIVE"} size="xs" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 6. BLOOD GROUP CENSUS ROSTER */}
                {category === "inventory" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3.5">Blood Group</th>
                        <th className="p-3.5">Verified Donors Count</th>
                        <th className="p-3.5">Inventory Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReportData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-bold font-mono text-base text-rose-600">
                            {item.bloodGroup}
                          </td>
                          <td className="p-3.5 font-black font-mono text-slate-900 dark:text-white tabular-nums">
                            {item.units} profiles
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.units > 10
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.units > 3
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {item.units > 10 ? "Adequate Inventory" : item.units > 3 ? "Moderate Stock" : "Critical Demand"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 7. MARKETING & REFERRAL ATTRIBUTION */}
                {category === "marketing" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3.5">Acquisition Channel</th>
                        <th className="p-3.5">Inquiries Generated</th>
                        <th className="p-3.5">Rewards Accrued</th>
                        <th className="p-3.5">Disbursed Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReportData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {item.source}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {item.count} leads
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatInr(item.totalRewards || 0)}
                          </td>
                          <td className="p-3.5 font-medium text-slate-500">
                            {item.paidCount} payouts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
