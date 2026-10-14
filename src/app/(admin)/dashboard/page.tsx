"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Activity, 
  ChevronRight, 
  Heart, 
  FileText, 
  TrendingUp, 
  UserCheck, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  DollarSign, 
  Award,
  Users,
  Dna,
  Building2,
  ShieldCheck,
  ArrowUpRight,
  ClipboardList,
  Sparkles,
  Receipt,
  FileCheck2,
  Calendar,
  Layers
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from "recharts";
import { toast } from "sonner";
import Link from "next/link";

const BRAND_COLORS = {
  teal: "#285b63",
  coral: "#ff7468",
  emerald: "#10b981",
  blue: "#0284c7",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  slate: "#64748b",
  red: "#ef4444"
};

const formatInr = (amount: number) => {
  return "₹" + (amount || 0).toLocaleString("en-IN");
};

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<"clinical" | "financial">("clinical");
  const [stats, setStats] = useState<any>({
    totalBookings: 0,
    pendingBookings: 0,
    totalRegistrations: 0,
    pendingRegistrations: 0,
    approvedRegistrations: 0,
    draftRegistrations: 0,
    rejectedRegistrations: 0,
    suspendedRegistrations: 0,
    totalServices: 0,
    totalMessages: 0,
    totalReviews: 0,
    pendingReviews: 0,
    totalInquiries: 0,
    totalConsultations: 0,
    activeDonors: 0,
    spermDonors: 0,
    eggDonors: 0,
    totalHospitals: 0,
    activeHospitals: 0,
    totalInvoicedAmount: 0,
    totalReceivedAmount: 0,
    totalPendingReceivables: 0,
    paidInvoicesCount: 0,
    pendingInvoicesCount: 0,
    bloodGroupStats: [],
    conversionRate: "0.0",
    referralCount: 0,
    totalRewardsPaid: 0,
    pendingRewards: 0,
    referralDistribution: [],
    topReferrers: { patients: [], donors: [], staff: [], doctors: [] },
    monthlyAnalytics: [],
    recentActivities: []
  });

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          toast.error("Administrative session expired. Please log in.");
        } else {
          toast.error(data.error || "Failed to load clinical analytics.");
        }
        return;
      }
      if (data.stats) {
        setStats((prev: any) => ({
          ...prev,
          ...data.stats,
          topReferrers: {
            patients: data.stats.topReferrers?.patients || [],
            donors: data.stats.topReferrers?.donors || [],
            staff: data.stats.topReferrers?.staff || [],
            doctors: data.stats.topReferrers?.doctors || []
          },
          referralDistribution: data.stats.referralDistribution || [],
          monthlyAnalytics: data.stats.monthlyAnalytics || [],
          recentActivities: data.stats.recentActivities || [],
          bloodGroupStats: data.stats.bloodGroupStats || []
        }));
      }
    } catch (err) {
      console.error("Failed to fetch clinical analytics:", err);
      toast.error("Failed to load clinical analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    loadStats();
  }, []);

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <Dna className="w-4 h-4 text-[#285b63]" />;
      case "inquiry":
        return <FileText className="w-4 h-4 text-[#ff7468]" />;
      case "referral":
        return <Award className="w-4 h-4 text-purple-600" />;
      case "audit":
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Clinical &amp; Regulatory Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-[#285b63] dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time ART bank donor screening, affiliate clinic quotas, billing ledger, and regulatory audits
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="rounded-xl text-xs h-9 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#285b63]" : "text-slate-500"}`} />
            <span>Sync Stats</span>
          </Button>

          <Link href="/reports">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs h-9 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Reporting Console</span>
            </Button>
          </Link>

          <Link href="/donor-registrations/egg">
            <Button
              size="sm"
              className="rounded-xl text-xs h-9 bg-[#285b63] hover:bg-[#204b52] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <span>Intake Pipeline</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Executive KPI Ribbon (5 Tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* KPI 1: Active Donors */}
            <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Active ART Donors
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#285b63] dark:text-teal-300 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {stats.activeDonors}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Approved &amp; verified gametes</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                  <span className="text-teal-600 dark:text-teal-400">🥚 {stats.eggDonors} Eggs</span>
                  <span className="text-cyan-600 dark:text-cyan-400">🧬 {stats.spermDonors} Sperm</span>
                </div>
              </CardContent>
            </Card>

            {/* KPI 2: Pipeline Registrations */}
            <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Intake Applications
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {stats.totalRegistrations}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sperm &amp; Egg donor profiles</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900 text-[10px]">
                  <span className="font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200/60">
                    {stats.pendingRegistrations} Under Review
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono">
                    {stats.conversionRate}% Conv.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* KPI 3: Affiliate Clinic Network */}
            <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Affiliate Clinics
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {stats.totalHospitals}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">IVF partner network</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900 text-[10px]">
                  <span className="font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    {stats.activeHospitals || stats.totalHospitals} Active Partners
                  </span>
                  <Link href="/hospitals" className="text-blue-600 hover:underline text-[10px] font-semibold">
                    View
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* KPI 4: Invoiced Gross Billing */}
            <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Invoiced Billing
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {formatInr(stats.totalInvoicedAmount)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Generated tax invoices</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900 text-[10px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Rec: {formatInr(stats.totalReceivedAmount)}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Due: {formatInr(stats.totalPendingReceivables)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* KPI 5: Inquiries & Pre-Screening */}
            <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Candidate Queries
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {stats.totalInquiries}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pre-screening consultations</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900 text-[10px]">
                  <span className="font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200/60">
                    {stats.totalConsultations} Consulted
                  </span>
                  <Link href="/inquiries" className="text-purple-600 hover:underline text-[10px] font-semibold">
                    View
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Quick Operations Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Quick Administrative Actions:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/manage-registrations">
                <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border-slate-200 bg-white dark:bg-slate-950">
                  <Dna className="w-3 h-3 text-teal-600 mr-1" /> Manage Eggs
                </Button>
              </Link>
              <Link href="/manage-sperm-registrations">
                <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border-slate-200 bg-white dark:bg-slate-950">
                  <Dna className="w-3 h-3 text-cyan-600 mr-1" /> Manage Sperm
                </Button>
              </Link>
              <Link href="/completed-files">
                <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border-slate-200 bg-white dark:bg-slate-950">
                  <FileCheck2 className="w-3 h-3 text-emerald-600 mr-1" /> Completed Files
                </Button>
              </Link>
              <Link href="/invoices">
                <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border-slate-200 bg-white dark:bg-slate-950">
                  <Receipt className="w-3 h-3 text-blue-600 mr-1" /> Invoices
                </Button>
              </Link>
              <Link href="/ledger">
                <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border-slate-200 bg-white dark:bg-slate-950">
                  <DollarSign className="w-3 h-3 text-amber-600 mr-1" /> Clinic Ledger
                </Button>
              </Link>
            </div>
          </div>

          {/* Graphical Analytics Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
            
            {/* Monthly Telemetry Line / Bar Chart */}
            <Card className="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs min-w-0 overflow-hidden">
              <CardHeader className="p-5 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#285b63]" />
                      Clinical &amp; Operational Trajectory
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      {chartView === "clinical" 
                        ? "Monthly progression of pre-screening inquiries, completed registrations, and consultations" 
                        : "Gross invoiced clinic billing vs payments received and disbursed referral rewards"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setChartView("clinical")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        chartView === "clinical"
                          ? "bg-white dark:bg-slate-800 text-[#285b63] dark:text-teal-300 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Clinical Flow
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartView("financial")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        chartView === "financial"
                          ? "bg-white dark:bg-slate-800 text-[#285b63] dark:text-teal-300 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      Billing &amp; Revenue
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="w-full h-[280px] min-w-0 relative">
                  <ResponsiveContainer width="100%" height={280} minWidth={0}>
                    {chartView === "clinical" ? (
                      <LineChart 
                        data={stats.monthlyAnalytics && stats.monthlyAnalytics.length > 0 ? stats.monthlyAnalytics : [
                          { month: "May", inquiries: 0, registrations: 0, bookings: 0 },
                          { month: "Jun", inquiries: 0, registrations: 0, bookings: 0 },
                          { month: "Jul", inquiries: 3, registrations: 0, bookings: 2 },
                          { month: "Aug", inquiries: 8, registrations: 0, bookings: 6 },
                          { month: "Sep", inquiries: 1, registrations: 10, bookings: 1 },
                          { month: "Oct", inquiries: 0, registrations: 4, bookings: 0 }
                        ]} 
                        margin={{ left: -15, right: 10, top: 15, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          style={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          style={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#ffffff",
                            color: "#0f172a",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            fontSize: 12,
                          }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="inquiries"
                          name="Pre-screening Queries"
                          stroke={BRAND_COLORS.coral}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, fill: BRAND_COLORS.coral }}
                        />
                        <Line
                          type="monotone"
                          dataKey="registrations"
                          name="Completed Registrations"
                          stroke={BRAND_COLORS.teal}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, fill: BRAND_COLORS.teal }}
                        />
                        <Line
                          type="monotone"
                          dataKey="bookings"
                          name="Consultations / Intakes"
                          stroke={BRAND_COLORS.emerald}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 2.5, fill: BRAND_COLORS.emerald }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart 
                        data={stats.monthlyAnalytics && stats.monthlyAnalytics.length > 0 ? stats.monthlyAnalytics : [
                          { month: "May", invoicedAmount: 0, receivedAmount: 0, rewardsPaid: 0 },
                          { month: "Jun", invoicedAmount: 0, receivedAmount: 0, rewardsPaid: 0 },
                          { month: "Jul", invoicedAmount: 0, receivedAmount: 0, rewardsPaid: 0 },
                          { month: "Aug", invoicedAmount: 0, receivedAmount: 0, rewardsPaid: 0 },
                          { month: "Sep", invoicedAmount: 585290, receivedAmount: 257400, rewardsPaid: 0 },
                          { month: "Oct", invoicedAmount: 147000, receivedAmount: 92800, rewardsPaid: 0 }
                        ]} 
                        margin={{ left: -5, right: 10, top: 15, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          style={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val: number) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                          style={{ fontSize: 10, fill: "#64748b" }}
                        />
                        <Tooltip
                          formatter={(val: any, name: any) => [`₹${Number(val || 0).toLocaleString("en-IN")}`, name]}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            fontSize: 12,
                          }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="invoicedAmount" name="Gross Invoiced (₹)" fill={BRAND_COLORS.teal} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="receivedAmount" name="Collections Received (₹)" fill={BRAND_COLORS.emerald} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="rewardsPaid" name="Referral Disbursals (₹)" fill={BRAND_COLORS.purple} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Registration Status Donut Chart */}
            <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs flex flex-col justify-between min-w-0 overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Screening Pipeline Health
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Real-time status breakdown for clinical screening audit control
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-center">
                <div className="relative w-full h-[210px] min-w-0 flex items-center justify-center">
                  {(() => {
                    const rawSlices = [
                      { name: "Approved & Verified", value: Number(stats.approvedRegistrations || 0), fill: BRAND_COLORS.teal },
                      { name: "In Screening", value: Number(stats.pendingRegistrations || 0), fill: BRAND_COLORS.amber },
                      { name: "Intake Drafts", value: Number(stats.draftRegistrations || 0), fill: BRAND_COLORS.blue },
                      { name: "Rejected", value: Number(stats.rejectedRegistrations || 0), fill: BRAND_COLORS.red },
                      { name: "Suspended", value: Number(stats.suspendedRegistrations || 0), fill: BRAND_COLORS.slate }
                    ].filter(item => item.value > 0);

                    const chartSlices = rawSlices.length > 0 
                      ? rawSlices 
                      : [{ name: "Awaiting Intake Data", value: 1, fill: "#e2e8f0" }];

                    return (
                      <>
                        <ResponsiveContainer width="100%" height={210} minWidth={0}>
                          <PieChart>
                            <Pie
                              data={chartSlices}
                              cx="50%"
                              cy="50%"
                              innerRadius={56}
                              outerRadius={80}
                              paddingAngle={rawSlices.length > 1 ? 3 : 0}
                              dataKey="value"
                            >
                              {chartSlices.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(val: any, name: any) => [
                                rawSlices.length > 0 ? `${val} candidates` : "No records",
                                name
                              ]}
                              contentStyle={{
                                borderRadius: 12,
                                border: "1px solid #e2e8f0",
                                backgroundColor: "#ffffff",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                fontSize: 12,
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">
                            {stats.totalRegistrations || 0}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                            Candidates
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Pipeline Legend */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#285b63]" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Approved:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">{stats.approvedRegistrations}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Screening:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">{stats.pendingRegistrations}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Drafts:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">{stats.draftRegistrations || 0}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Rejected:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">{stats.rejectedRegistrations}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Specimen Blood Group Census */}
          {stats.bloodGroupStats && stats.bloodGroupStats.length > 0 && (
            <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-500" />
                    Specimen Blood Group Census
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live distribution of donor candidates across ABO &amp; Rh blood groups
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  ART Bank Registry
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                {stats.bloodGroupStats.map((item: any) => (
                  <div
                    key={item.bloodGroup}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      item.units > 0
                        ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 hover:border-teal-400"
                        : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60"
                    }`}
                  >
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 block font-mono">
                      {item.bloodGroup}
                    </span>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1 tabular-nums">
                      {item.units}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {item.units === 1 ? "donor" : "donors"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Operational Feeds & Audit Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Live Clinical Telemetry Feed */}
            <Card className="lg:col-span-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#285b63]" />
                      Live Clinical &amp; Regulatory Feed
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Real-time stream of incoming donor intakes, affidavit filings, and system audits
                    </CardDescription>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Audit Logging
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {stats.recentActivities.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 font-medium">
                    No recent clinical telemetry records registered.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.recentActivities.map((act: any, idx: number) => (
                      <div key={idx} className="py-3 flex items-start justify-between gap-3 group">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                            {getStatusIcon(act.type)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#285b63] transition-colors">
                              {act.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {act.details}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusBadge status={act.status} size="xs" />
                          <span className="text-[10px] text-slate-400">
                            {new Date(act.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referral & Marketing Channels */}
            <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  Marketing &amp; Referral Sources
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Candidate acquisition share by origin channel
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex-1">
                {stats.referralDistribution.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 font-medium">
                    No referral channels recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.referralDistribution.slice(0, 5).map((item: any, idx: number) => {
                      const totalRefs = stats.referralCount || 1;
                      const percent = Math.round((item.value / totalRefs) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{item.value} ({percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#285b63] h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Total Rewards Paid:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatInr(stats.totalRewardsPaid)}
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>
        </>
      )}

    </div>
  );
}
