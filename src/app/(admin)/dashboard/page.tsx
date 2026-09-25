"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ClipboardList
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
  Cell 
} from "recharts";
import { toast } from "sonner";
import Link from "next/link";

const BRAND_COLORS = {
  teal: "#285b63",
  coral: "#ff7468",
  emerald: "#10b981",
  blue: "#0284c7",
  amber: "#f59e0b",
  slate: "#64748b",
  red: "#ef4444"
};

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalBookings: 0,
    pendingBookings: 0,
    totalRegistrations: 0,
    pendingRegistrations: 0,
    approvedRegistrations: 0,
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
          recentActivities: data.stats.recentActivities || []
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Clinical Operations Overview
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="rounded-xl text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#285b63]" : "text-slate-500"}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/donor-registrations/egg">
            <Button
              size="sm"
              className="rounded-xl text-xs h-9 bg-[#285b63] hover:bg-[#204b52] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Egg Registrations</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Link href="/donor-registrations/sperm">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Dna className="w-3.5 h-3.5 text-[#285b63]" />
              <span>Sperm Registrations</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Core Analytic Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Total Registrations */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Registrations
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#285b63] flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {stats.totalRegistrations}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sperm &amp; Egg donor profiles</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Pending Screening:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                    {stats.pendingRegistrations} Under Review
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 2: Active ART Donors */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active &amp; Approved Donors
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {stats.activeDonors || stats.approvedRegistrations || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Cleared clinical &amp; lab testing</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Breakdown:</span>
                  <span className="font-semibold text-slate-800">
                    <span className="text-[#285b63]">{stats.spermDonors || 0} Sperm</span> • <span className="text-[#ff7468]">{stats.eggDonors || 0} Egg</span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 3: Pre-Registration Inquiries */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pre-Screening Inquiries
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {stats.totalInquiries}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Initial candidate screenings</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Consultations Booked:</span>
                  <span className="font-bold text-slate-900">
                    {stats.totalConsultations} Consults
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 4: Referral Partners & Network */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Partner Sourcing
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {stats.referralCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Active referral partner accounts</p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Rewards Disbursed:</span>
                  <span className="font-bold text-emerald-700">
                    ₹{(stats.totalRewardsPaid || 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Graphical Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Monthly Telemetry Line Chart */}
            <Card className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Inquiry &amp; Registration Trajectory
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Monthly conversion rate from pre-screening inquiry logs into submitted donor registrations.
                    </CardDescription>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Rolling 6-Month
                  </span>
                </div>
              </CardHeader>
              <CardContent className="h-[280px] p-5 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyAnalytics} margin={{ left: -15, right: 10, top: 15, bottom: 0 }}>
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
                      name="Inquiries"
                      stroke={BRAND_COLORS.coral}
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="registrations"
                      name="Completed Registrations"
                      stroke={BRAND_COLORS.teal}
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      name="Consultations"
                      stroke={BRAND_COLORS.emerald}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Registration Status Donut Chart */}
            <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  Screening Status Distribution
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Real-time status breakdown for clinical screening audit control.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-center">
                <div className="h-[180px] flex items-center justify-center">
                  {(() => {
                    const pieData = [
                      { name: "Approved", value: stats.approvedRegistrations || 0, fill: BRAND_COLORS.teal },
                      { name: "Pending Screening", value: stats.pendingRegistrations || 0, fill: BRAND_COLORS.amber },
                      { name: "Rejected", value: stats.rejectedRegistrations || 0, fill: BRAND_COLORS.red },
                      { name: "Suspended", value: stats.suspendedRegistrations || 0, fill: BRAND_COLORS.slate }
                    ].filter(item => item.value > 0);

                    if (pieData.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
                          <UserCheck className="w-8 h-8 opacity-25" />
                          <span>No registration records found</span>
                        </div>
                      );
                    }

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((cell, index) => (
                              <Cell key={`cell-${index}`} fill={cell.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              borderRadius: 10,
                              border: "1px solid #e2e8f0",
                              backgroundColor: "#ffffff",
                              color: "#0f172a",
                              fontSize: 11
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#285b63]" />
                    <span>Approved: {stats.approvedRegistrations || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Pending: {stats.pendingRegistrations || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>Rejected: {stats.rejectedRegistrations || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Suspended: {stats.suspendedRegistrations || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Operational Logs & Quick Shortcuts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Operational Trace */}
            <Card className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <CardHeader className="p-5 pb-4 flex flex-row items-center justify-between border-b border-slate-100">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Live Operational Activity Feed
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Recent clinical screening events, donor uploads, and administrative actions.
                  </CardDescription>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  ● PIPELINE ACTIVE
                </span>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {stats.recentActivities && stats.recentActivities.length > 0 ? (
                    stats.recentActivities.map((act: any, idx: number) => {
                      const displayTitle = typeof act.title === "object"
                        ? (act.title?.name || "Activity")
                        : String(act.title || "Activity");
                      const displayDetails = typeof act.details === "object"
                        ? (act.details?.name || act.details?.address || JSON.stringify(act.details))
                        : String(act.details || "");
                      const displayStatus = typeof act.status === "object"
                        ? (act.status?.name || act.status?.status || "Updated")
                        : String(act.status || "Updated");

                      return (
                        <div key={idx} className="flex gap-3.5 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors items-start text-xs">
                          <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0">
                            {getStatusIcon(act.type)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900 truncate">{displayTitle}</span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                              </span>
                            </div>
                            <p className="text-slate-500 truncate">{displayDetails}</p>
                            <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                              displayStatus === "PENDING" || displayStatus === "Pending" 
                                ? "bg-amber-50 text-amber-700 border-amber-200" 
                                : act.type === "audit"
                                ? "bg-teal-50 text-[#285b63] border-teal-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {displayStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs">No recent operational logs.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Administrative Shortcuts */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900">
                  Administrative Shortcuts
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Fast access to high-frequency clinical modules.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-2.5">
                <Link href="/donor-registrations/egg" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-[#285b63] hover:bg-teal-50/20 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#285b63] flex items-center justify-center">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 group-hover:text-[#285b63] transition-colors">Egg Registrations</p>
                        <p className="text-[10px] text-slate-400">Review egg donor profiles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#285b63] transition-colors" />
                  </div>
                </Link>

                <Link href="/donor-registrations/sperm" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-[#285b63] hover:bg-teal-50/20 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                        <Dna className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 group-hover:text-[#285b63] transition-colors">Sperm Registrations</p>
                        <p className="text-[10px] text-slate-400">Review sperm donor profiles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#285b63] transition-colors" />
                  </div>
                </Link>

                <Link href="/agents" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-[#285b63] hover:bg-teal-50/20 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 group-hover:text-[#285b63] transition-colors">Referral Partners</p>
                        <p className="text-[10px] text-slate-400">Manage agents &amp; payouts</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#285b63] transition-colors" />
                  </div>
                </Link>

                <Link href="/hospitals" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-[#285b63] hover:bg-teal-50/20 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 group-hover:text-[#285b63] transition-colors">ART Clinics</p>
                        <p className="text-[10px] text-slate-400">Manage clinic agreements</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#285b63] transition-colors" />
                  </div>
                </Link>

                <Link href="/reports" className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-[#285b63] hover:bg-teal-50/20 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900 group-hover:text-[#285b63] transition-colors">Clinical Reports</p>
                        <p className="text-[10px] text-slate-400">Regulatory compliance logs</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#285b63] transition-colors" />
                  </div>
                </Link>
              </CardContent>
            </Card>

          </div>
        </>
      )}

    </div>
  );
}
