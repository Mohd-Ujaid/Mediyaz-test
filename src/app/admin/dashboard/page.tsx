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
  Calendar,
  Gift,
  Award,
  Users
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
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { toast } from "sonner";
import Link from "next/link";

const COLORS = ["#2F4F57", "#E7AE08", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280"];

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
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
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
      case "booking":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "registration":
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />;
      case "inquiry":
        return <FileText className="w-4 h-4 text-orange-500" />;
      case "referral":
        return <Gift className="w-4 h-4 text-teal-500" />;
      case "audit":
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-teal-500" />;
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-brand-600 animate-pulse" /> Mediyaz Clinic Command Centre
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Real-time analytics and telemetry across donor pre-registrations, multi-channel referrals, and referral payout distributions.
          </p>
        </div>
      </div>

      {/* Core Analytic Cards */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-500">Loading telemetry data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Card 1: Total Inquiries */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Total Inquiries</span>
                  <div className="p-2 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">
                    {stats.totalInquiries}
                  </div>
                  <div className="text-xs text-muted-foreground">Donor Pre-Registrations</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 text-xs border-t text-muted-foreground">
                  <span>Consultations:</span>
                  <span className="font-semibold text-foreground">{stats.totalConsultations}</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Total Registrations */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Registrations</span>
                  <div className="p-2 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Heart className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">
                    {stats.totalRegistrations}
                  </div>
                  <div className="text-xs text-muted-foreground">Sperm & Egg Profiles</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 text-xs border-t text-muted-foreground">
                  <span>Pending Review:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">{stats.pendingRegistrations} New</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Active & Approved Donors */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Active Donors</span>
                  <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">
                    {stats.activeDonors}
                  </div>
                  <div className="text-xs text-muted-foreground">Approved Live Profiles</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 text-xs border-t text-muted-foreground">
                  <span>Sperm/Egg:</span>
                  <span className="font-semibold text-foreground">{stats.spermDonors} / {stats.eggDonors}</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Referral Registry */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Referrals</span>
                  <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Gift className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">
                    {stats.referralCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Multi-Channel Referrals</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 text-xs border-t text-muted-foreground">
                  <span>Paid Rewards:</span>
                  <span className="font-semibold text-foreground">₹{stats.totalRewardsPaid.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Payouts Telemetry */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Rewards</span>
                  <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold tracking-tight">
                    ₹{stats.totalRewardsPaid.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Paid Out</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 text-xs border-t text-muted-foreground">
                  <span>Awaiting Payout:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">₹{stats.pendingRewards.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphical Trends Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Monthly Trend: Inquiries vs Registrations */}
            <Card className="lg:col-span-8 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Inquiry & Registration Trends</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">Monthly breakdown tracking the conversion from initial inquiry logs to submitted donor registrations.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyAnalytics} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="inquiries" name="Pre-Registration Inquiries" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
                    <Line type="monotone" dataKey="registrations" name="Completed Registrations" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="bookings" name="Clinical Consultations" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Registration Status Breakdown */}
            <Card className="lg:col-span-4 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Registration Status</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">Breakdown of registration statuses for screening audit control.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Approved Donors", value: stats.approvedRegistrations || 1 },
                          { name: "Pending Screening", value: stats.pendingRegistrations || 0 },
                          { name: "Rejected Applicants", value: stats.rejectedRegistrations || 0 },
                          { name: "Suspended Donors", value: stats.suspendedRegistrations || 0 }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {[
                          { fill: "#3b82f6" }, // Approved: Blue
                          { fill: "#f59e0b" }, // Pending: Amber
                          { fill: "#ef4444" }, // Rejected: Red
                          { fill: "#6b7280" }  // Suspended: Gray
                        ].map((cell, index) => (
                          <Cell key={`cell-${index}`} fill={cell.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] font-medium text-muted-foreground">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-brand-500" /> Approved: {stats.approvedRegistrations}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> Pending: {stats.pendingRegistrations}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Rejected: {stats.rejectedRegistrations}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500" /> Suspended: {stats.suspendedRegistrations}</div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Referral Analytics distribution & Top Referrers */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Referral Source distribution chart */}
            <Card className="lg:col-span-7 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Referral Source Distribution</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">Tracking how candidates heard about the IVF clinic for strategic marketing analytics.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.referralDistribution || []} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }} cursor={{fill: 'hsl(var(--muted))'}} />
                    <Bar dataKey="value" name="Total Referrals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                      {(stats.referralDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Referrers list */}
            <Card className="lg:col-span-5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Top Referral Champions</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">Leading patient, donor, and staff referrer lists.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[320px] overflow-y-auto pr-2">
                {/* Patients */}
                {stats.topReferrers.patients.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block border-b pb-1">Patients</span>
                    {stats.topReferrers.patients.map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground">{r.name} {r.id ? `(${r.id.slice(-5)})` : ""}</span>
                        <span className="text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-1 rounded-md font-semibold text-xs">{r.count} ref</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Donors */}
                {stats.topReferrers.donors.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block border-b pb-1">Donors</span>
                    {stats.topReferrers.donors.map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground">{r.name} ({r.id})</span>
                        <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md font-semibold text-xs">{r.count} ref</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Staff */}
                {stats.topReferrers.staff.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block border-b pb-1">Staff</span>
                    {stats.topReferrers.staff.map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground">{r.name} ({r.id})</span>
                        <span className="text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-1 rounded-md font-semibold text-xs">{r.count} ref</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Doctors */}
                {stats.topReferrers.doctors.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block border-b pb-1">Doctors</span>
                    {stats.topReferrers.doctors.map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground">Dr. {r.name} ({r.id})</span>
                        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md font-semibold text-xs">{r.count} ref</span>
                      </div>
                    ))}
                  </div>
                )}
                {stats.topReferrers.patients.length === 0 && stats.topReferrers.donors.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground italic">No referral leaders recorded.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
              {/* Feed list */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="p-6 pb-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Submission Pipeline Activity Feed</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">Live operational trace of guest inquiries, donor screening applications, and referral reward adjustments.</CardDescription>
                </div>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                  SYSTEM OK
                </span>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {stats.recentActivities && stats.recentActivities.length > 0 ? (
                    stats.recentActivities.map((act: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-xl border bg-muted/30 items-start">
                        <div className="p-2 bg-background border rounded-lg shadow-sm">
                          {getStatusIcon(act.type)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">{act.title}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(act.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-muted-foreground text-xs truncate">{act.details}</p>
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mt-1 border ${
                            act.status === "PENDING" || act.status === "Pending" 
                              ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800" 
                              : act.type === "audit"
                              ? "bg-teal-105 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:border-teal-800"
                              : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800"
                          }`}>
                            {act.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">No recent operational logs.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-md font-bold">Administrative Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/inquiries">
                  <Button variant="outline" className="w-full justify-between h-12 px-4 shadow-sm">
                    <span>Manage Donor Inquiries</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
                <Link href="/admin/donor-registrations" className="block mt-3">
                  <Button variant="outline" className="w-full justify-between h-12 px-4 shadow-sm">
                    <span>Screen Donor Applications</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
                <Link href="/admin/referrals" className="block mt-3">
                  <Button variant="outline" className="w-full justify-between h-12 px-4 shadow-sm">
                    <span>Manage Referral Rewards</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
                <Link href="/admin/reports" className="block mt-3">
                  <Button variant="outline" className="w-full justify-between h-12 px-4 shadow-sm">
                    <span>Analytical Reports Center</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </>
      )}

    </div>
  );
}
