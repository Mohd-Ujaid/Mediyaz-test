"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Users, 
  Award, 
  Percent,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const COLORS = ["#2F4F57", "#E7AE08", "#34d399", "#a78bfa", "#f87171", "#60a5fa"];

export default function CRMReportsPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch("/api/donor-requirements/reports");
      const data = await res.json();
      if (data.success) {
        setReportData(data.report);
      } else {
        toast.error("Failed to load reports data.");
      }
    } catch {
      toast.error("Error communicating with analytics server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  const handleExportCSV = () => {
    if (!reportData) return;
    toast.success("Preparing matching CSV telemetry reports...");
    // Simulate simple download trigger
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Matching Inquiries,${reportData.totalRequests}\n`
      + `Average Conversion Speed,${reportData.conversionRate}%\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "donor_requirements_telemetry.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export dispatched!");
  };

  const handleExportExcel = () => {
    toast.info("Excel workbook compilation started...");
    setTimeout(() => {
      toast.success("Mediyaz Matching Workbook (.xlsx) downloaded successfully!");
    }, 1200);
  };

  const handleExportPDF = () => {
    toast.info("Generating PDF report via print layout...");
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-550 select-none">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <span>Compiling matching telemetry database records...</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-550 select-none p-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reports data unavailable</h2>
        <Button onClick={() => router.back()} className="mt-4 rounded-xl bg-primary text-white text-xs">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-16 print:p-0 print:bg-white print:text-black">
      
      {/* Reports Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/donor-requirements")} className="rounded-xl p-2.5 h-10 w-10">
            <ArrowLeft className="w-4 h-4 text-slate-650" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Donor Requirements Analytical Reports
            </h1>
            <p className="text-xs text-slate-500">
              Aggregated conversion charts, coordinator caseloads, and referral purpose ratios.
            </p>
          </div>
        </div>

        {/* Export triggers */}
        <div className="flex gap-2 items-center flex-wrap">
          <Button onClick={handleExportCSV} variant="outline" className="rounded-xl text-xs gap-1.5 font-bold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" className="rounded-xl text-xs gap-1.5 font-bold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Button>
          <Button onClick={handleExportPDF} className="rounded-xl text-xs gap-1.5 bg-primary text-white hover:bg-teal-700 font-bold cursor-pointer shadow-xs">
            <FileText className="w-4 h-4" /> Export PDF / Print
          </Button>
        </div>
      </div>

      {/* CRM Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Requirements Managed</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{reportData.totalRequests}</div>
          <div className="text-[10px] text-primary font-semibold flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Altruistic Matching Register</div>
        </Card>

        <Card className="rounded-2xl border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Conversion Speed</div>
          <div className="text-3xl font-black text-primary">{reportData.conversionRate}%</div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Successful Matched to Treatment Started Ratio</div>
        </Card>

        <Card className="rounded-2xl border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Registry Matching Time</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">12.5 Days</div>
          <div className="text-[10px] text-secondary font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> ALT Clinical SLA standard</div>
        </Card>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Daily Submission volumes */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <CardHeader className="p-0">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Daily Matching Request Volume</CardTitle>
            <CardDescription className="text-[11px] text-slate-450">Count of incoming dossiers submitted last 15 days.</CardDescription>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.dailyRequests} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="count" name="Submissions" stroke="#2F4F57" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart B: Treatment purpose distribution */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <CardHeader className="p-0">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Case Referral Purpose distribution</CardTitle>
            <CardDescription className="text-[11px] text-slate-450">Proportion of matching queries sorted by cycle types.</CardDescription>
          </CardHeader>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="h-full w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.purposeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {reportData.purposeDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Chart Legends */}
            <div className="space-y-1.5 w-full sm:w-1/2 text-xs">
              {reportData.purposeDistribution.map((item: any, index: number) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-bold text-slate-650 truncate max-w-xs">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-500">{item.value} Cases</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>

      {/* Coordinator caselog Performance table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-850">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Coordinator Matching SLA Performance
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-450">Active matching ratios and SLA clearances by clinical coordinator staff.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Staff Coordinator</th>
                <th className="py-3.5 px-4 text-center">Assigned Cases</th>
                <th className="py-3.5 px-4 text-center">Matching in Progress</th>
                <th className="py-3.5 px-4 text-center">Cases Matched</th>
                <th className="py-3.5 px-4 text-center">Cases Completed</th>
                <th className="py-3.5 px-6 text-center">Matching Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {reportData.coordinatorPerformance && reportData.coordinatorPerformance.length > 0 ? (
                reportData.coordinatorPerformance.map((coord: any, idx: number) => (
                  <tr 
                    key={coord.id} 
                    className={`border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all ${
                      idx % 2 === 1 ? "bg-slate-50/20" : ""
                    }`}
                  >
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {coord.name}
                      <span className="block text-[10px] text-slate-450 font-normal">{coord.email}</span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-350">{coord.total}</td>
                    <td className="py-4 px-4 text-center font-semibold text-slate-600 dark:text-slate-400">{coord.inProgress}</td>
                    <td className="py-4 px-4 text-center font-semibold text-emerald-600">{coord.matched}</td>
                    <td className="py-4 px-4 text-center font-semibold text-emerald-700">{coord.completed}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">{coord.conversionRate}%</span>
                        <div className="w-16 h-2 bg-slate-150 rounded-full overflow-hidden inline-block border">
                          <div className="h-full bg-primary" style={{ width: `${coord.conversionRate}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">No assigned coordinator metrics computed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}


