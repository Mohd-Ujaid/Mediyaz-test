"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Award,
  Building2,
  DollarSign,
  TrendingUp,
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Dna,
  Users,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  X,
  FileCheck,
  Percent,
  Calendar,
  Layers,
  ArrowUpDown,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HospitalLeaderboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user && ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR"].includes((session.user as any).role);

  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalHospitals: 0,
    activeHospitalsCount: 0,
    globalTotalDonors: 0,
    globalTotalDealValue: 0,
    globalTotalReceived: 0,
    globalTotalPending: 0,
    overallCollectionRate: 0,
    topHospital: null,
  });

  // Search & Sorting Controls
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("donors");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Drilldown Modal
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState("");

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("sortBy", sortBy);
      params.append("order", sortOrder);

      const res = await fetch(`/api/hospitals/leaderboard?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setHospitals(data.hospitals || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error(data.error || "Failed to load hospital leaderboard");
      }
    } catch (err: any) {
      console.error("Error loading hospital leaderboard:", err);
      toast.error("Network error while loading leaderboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeaderboard();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSortBy("donors");
    setSortOrder("desc");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDisplayDate = (str?: string) => {
    if (!str) return "N/A";
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, day] = str.split("-").map(Number);
        const dt = new Date(y, m - 1, day);
        return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      }
      const dt = new Date(str);
      if (isNaN(dt.getTime())) return str;
      return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return str;
    }
  };

  // Export Leaderboard to Excel
  const handleExportExcel = () => {
    if (!hospitals || hospitals.length === 0) {
      toast.error("No leaderboard data available to export");
      return;
    }

    const exportRows = hospitals.map((h) => ({
      "Rank": h.rank,
      "Hospital / Clinic Name": h.name,
      "Short Name": h.shortName || "N/A",
      "Registration Number": h.registrationNumber || "N/A",
      "Contact Person": h.contactPerson || "N/A",
      "Mobile Number": h.mobileNumber || "N/A",
      "Email": h.email || "N/A",
      "City": h.city || "N/A",
      "State": h.state || "N/A",
      "Total Donors Sent": h.totalDonorsSent,
      "Egg Donors Sent": h.eggDonorsCount,
      "Sperm Donors Sent": h.spermDonorsCount,
      "Completed Files Count": h.completedFilesCount,
      "Active Pipeline Count": h.activePipelineCount,
      "Total Deals Value (INR)": h.totalDealValue,
      "Payment Received (INR)": h.totalPaymentReceived,
      "Pending Balance (INR)": h.pendingBalance,
      "Collection Rate (%)": `${h.collectionRate}%`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clinic Leaderboard");
    XLSX.writeFile(workbook, `ART_Clinic_Leaderboard_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Leaderboard exported to Excel successfully!");
  };

  // Top 3 Hospitals for Podium
  const topThree = useMemo(() => {
    return hospitals.slice(0, 3);
  }, [hospitals]);

  // Filtered donors in drilldown
  const filteredDrilldownDonors = useMemo(() => {
    if (!selectedHospital?.allDonors) return [];
    if (!drilldownSearch.trim()) return selectedHospital.allDonors;
    const q = drilldownSearch.toLowerCase();
    return selectedHospital.allDonors.filter(
      (d: any) =>
        d.registrationId?.toLowerCase().includes(q) ||
        d.donorId?.toLowerCase().includes(q) ||
        d.donorName?.toLowerCase().includes(q) ||
        d.paymentStatus?.toLowerCase().includes(q)
    );
  }, [selectedHospital, drilldownSearch]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-indigo-950 to-slate-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-12">
          <Award className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>ART Clinic Management</span>
              <span>•</span>
              <span className="bg-teal-500/30 px-2 py-0.5 rounded-full text-white">Performance Standing</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              ART Clinics Leaderboard
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {hospitals.length} Clinics
              </span>
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Track and rank partner hospitals by volume of donors dispatched, total clinical deals value, payments collected, and outstanding receivables.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={loadLeaderboard}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold rounded-xl gap-1.5 h-10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExportExcel}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs gap-1.5 h-10 shadow-lg shadow-emerald-950/30"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Showcase */}
      {topThree.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank #2: Silver */}
          {topThree[1] && (
            <div className="bg-card rounded-2xl p-5 border shadow-sm relative overflow-hidden flex flex-col justify-between order-2 md:order-1 border-slate-300/80 dark:border-slate-700 bg-gradient-to-b from-slate-100/50 to-transparent dark:from-slate-900/40">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center shadow-inner">
                    #2
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Silver Standing
                    </span>
                    <h3 className="font-bold text-foreground text-base truncate max-w-[180px]">
                      {topThree[1].name}
                    </h3>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{topThree[1].city || "India"}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Donors Dispatched</span>
                  <div className="text-lg font-black text-foreground">{topThree[1].totalDonorsSent} Donors</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Payment Received</span>
                  <div className="text-lg font-black text-teal-600 dark:text-teal-400">
                    ₹{(topThree[1].totalPaymentReceived || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedHospital(topThree[1]);
                  setDrilldownSearch("");
                  setIsDrilldownOpen(true);
                }}
                className="w-full text-xs rounded-xl h-8 gap-1"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600" /> View Donors Sent
              </Button>
            </div>
          )}

          {/* Rank #1: Gold */}
          {topThree[0] && (
            <div className="bg-card rounded-2xl p-6 border-2 shadow-lg relative overflow-hidden flex flex-col justify-between order-1 md:order-2 border-amber-400 dark:border-amber-500/80 bg-gradient-to-b from-amber-500/10 to-transparent dark:from-amber-950/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 font-black text-base flex items-center justify-center shadow-md">
                    #1
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <Award className="w-3 h-3" /> Gold Leader
                    </span>
                    <h3 className="font-black text-foreground text-lg truncate max-w-[200px]">
                      {topThree[0].name}
                    </h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  {topThree[0].collectionRate}% Collection
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-4 pt-3 border-t border-amber-500/20 text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Total Donors Sent</span>
                  <div className="text-2xl font-black text-foreground">{topThree[0].totalDonorsSent} Donors</div>
                  <div className="text-[10px] text-muted-foreground">
                    {topThree[0].eggDonorsCount} Egg • {topThree[0].spermDonorsCount} Sperm
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Payment Collected</span>
                  <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    ₹{(topThree[0].totalPaymentReceived || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Deal Vol: ₹{(topThree[0].totalDealValue || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setSelectedHospital(topThree[0]);
                  setDrilldownSearch("");
                  setIsDrilldownOpen(true);
                }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-xl h-9 gap-1 font-semibold shadow-md"
              >
                <Eye className="w-3.5 h-3.5" /> View Dispatched Donors ({topThree[0].totalDonorsSent})
              </Button>
            </div>
          )}

          {/* Rank #3: Bronze */}
          {topThree[2] && (
            <div className="bg-card rounded-2xl p-5 border shadow-sm relative overflow-hidden flex flex-col justify-between order-3 md:order-3 border-amber-700/40 dark:border-amber-700/60 bg-gradient-to-b from-amber-700/5 to-transparent dark:from-amber-950/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-inner">
                    #3
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      Bronze Standing
                    </span>
                    <h3 className="font-bold text-foreground text-base truncate max-w-[180px]">
                      {topThree[2].name}
                    </h3>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{topThree[2].city || "India"}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Donors Dispatched</span>
                  <div className="text-lg font-black text-foreground">{topThree[2].totalDonorsSent} Donors</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Payment Received</span>
                  <div className="text-lg font-black text-teal-600 dark:text-teal-400">
                    ₹{(topThree[2].totalPaymentReceived || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedHospital(topThree[2]);
                  setDrilldownSearch("");
                  setIsDrilldownOpen(true);
                }}
                className="w-full text-xs rounded-xl h-8 gap-1"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600" /> View Donors Sent
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Global Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Donors Dispatched */}
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Donors Dispatched</span>
            <div className="text-2xl font-black mt-1 text-foreground">
              {stats.globalTotalDonors || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Across {stats.activeHospitalsCount || 0} active partner clinics
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Deal Volume */}
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Deals Committed</span>
            <div className="text-2xl font-black mt-1 text-indigo-600 dark:text-indigo-400">
              ₹{(stats.globalTotalDealValue || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Agreed clinical contract value
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Payment Received */}
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payments Collected</span>
            <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
              ₹{(stats.globalTotalReceived || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <span className="font-bold text-emerald-600">{stats.overallCollectionRate || 0}%</span>
              <span>overall recovery rate</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Pending Balance */}
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Receivables</span>
            <div className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">
              ₹{(stats.globalTotalPending || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Due payments from clinics
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Sorting Controls */}
      <div className="bg-card rounded-2xl p-4 border shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clinic name, city, contact person..."
              className="pl-9 h-10 rounded-xl text-xs"
            />
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="donors">Rank by: Most Donors Sent</option>
              <option value="received">Rank by: Highest Payment Received</option>
              <option value="deals">Rank by: Highest Deals Value</option>
              <option value="pending">Rank by: Highest Pending Due</option>
              <option value="rate">Rank by: Collection Rate (%)</option>
              <option value="name">Rank by: Hospital Name (A-Z)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="desc">Order: High to Low (Descending)</option>
              <option value="asc">Order: Low to High (Ascending)</option>
            </select>
          </div>

          {/* Search Action */}
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold h-10"
            >
              Filter Leaderboard
            </Button>
            {search && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="h-10 px-2.5 rounded-xl text-xs"
                title="Reset Search"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4 w-16 text-center">Rank</th>
                <th className="p-4">ART Clinic / Hospital</th>
                <th className="p-4 text-center">Donors Sent</th>
                <th className="p-4">File Progress</th>
                <th className="p-4">Total Deals Value</th>
                <th className="p-4">Payment Received</th>
                <th className="p-4">Pending Due</th>
                <th className="p-4 text-center">Recovery Rate</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                      <span className="font-semibold text-sm">Computing clinic standings...</span>
                    </div>
                  </td>
                </tr>
              ) : hospitals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Award className="w-12 h-12 text-muted-foreground/40" />
                      <span className="font-bold text-base text-foreground">No Clinics Found</span>
                      <p className="text-xs max-w-sm">
                        No hospital records matched your search query. Try clearing filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                hospitals.map((hosp) => {
                  const isTopOne = hosp.rank === 1;
                  const isTopTwo = hosp.rank === 2;
                  const isTopThree = hosp.rank === 3;

                  return (
                    <tr
                      key={hosp._id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isTopOne ? "bg-amber-500/5 dark:bg-amber-950/10" : ""
                      }`}
                    >
                      {/* 1. Rank */}
                      <td className="p-4 align-middle text-center">
                        {isTopOne ? (
                          <div className="w-8 h-8 mx-auto rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow">
                            #1
                          </div>
                        ) : isTopTwo ? (
                          <div className="w-8 h-8 mx-auto rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-xs flex items-center justify-center shadow">
                            #2
                          </div>
                        ) : isTopThree ? (
                          <div className="w-8 h-8 mx-auto rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
                            #3
                          </div>
                        ) : (
                          <span className="font-bold text-muted-foreground text-xs">#{hosp.rank}</span>
                        )}
                      </td>

                      {/* 2. Hospital & Contact */}
                      <td className="p-4 align-middle">
                        <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{hosp.name}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                          {hosp.city && <span>{hosp.city}, {hosp.state || "India"}</span>}
                          {hosp.registrationNumber && <span>• Reg: {hosp.registrationNumber}</span>}
                        </div>
                        {hosp.contactPerson && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Contact: <span className="font-medium text-foreground">{hosp.contactPerson}</span> {hosp.mobileNumber ? `(${hosp.mobileNumber})` : ""}
                          </div>
                        )}
                      </td>

                      {/* 3. Donors Sent */}
                      <td className="p-4 align-middle text-center">
                        <div className="text-base font-black text-foreground">
                          {hosp.totalDonorsSent}
                        </div>
                        <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold">
                            {hosp.eggDonorsCount} Egg
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-500/10 text-slate-700 dark:text-slate-300 font-semibold">
                            {hosp.spermDonorsCount} Sperm
                          </span>
                        </div>
                      </td>

                      {/* 4. File Progress */}
                      <td className="p-4 align-middle">
                        <div className="space-y-1">
                          <div className="text-[11px] flex items-center justify-between">
                            <span className="text-muted-foreground">Completed Files:</span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">{hosp.completedFilesCount}</span>
                          </div>
                          <div className="text-[11px] flex items-center justify-between">
                            <span className="text-muted-foreground">In Pipeline:</span>
                            <span className="font-bold text-blue-700 dark:text-blue-300">{hosp.activePipelineCount}</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Total Deals Value */}
                      <td className="p-4 align-middle">
                        <div className="font-black text-sm text-foreground">
                          ₹{(hosp.totalDealValue || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Avg: ₹{hosp.totalDonorsSent > 0 ? Math.round(hosp.totalDealValue / hosp.totalDonorsSent).toLocaleString("en-IN") : 0}/donor
                        </div>
                      </td>

                      {/* 6. Payment Received */}
                      <td className="p-4 align-middle">
                        <div className="font-black text-sm text-teal-700 dark:text-teal-300">
                          ₹{(hosp.totalPaymentReceived || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                          {hosp.fullyPaidDonorsCount} donor deals settled
                        </div>
                      </td>

                      {/* 7. Pending Due */}
                      <td className="p-4 align-middle">
                        {hosp.pendingBalance > 0 ? (
                          <div className="font-black text-sm text-amber-600 dark:text-amber-400">
                            ₹{hosp.pendingBalance.toLocaleString("en-IN")}
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All Cleared
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Outstanding balance
                        </div>
                      </td>

                      {/* 8. Recovery Rate (%) */}
                      <td className="p-4 align-middle text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                            hosp.collectionRate >= 80
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                              : hosp.collectionRate >= 50
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                          }`}>
                            {hosp.collectionRate}%
                          </span>
                          <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                hosp.collectionRate >= 80 ? "bg-emerald-500" : hosp.collectionRate >= 50 ? "bg-blue-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, hosp.collectionRate)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 9. Actions */}
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedHospital(hosp);
                                  setDrilldownSearch("");
                                  setIsDrilldownOpen(true);
                                }}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2"
                              >
                                <Users className="w-4 h-4 text-teal-600" />
                                View Donors ({hosp.totalDonorsSent})
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Modal: All Donors Dispatched to Hospital */}
      <Dialog open={isDrilldownOpen} onOpenChange={setIsDrilldownOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  Donors Dispatched to {selectedHospital?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Detailed roster of all {selectedHospital?.totalDonorsSent || 0} donors assigned to this clinic, clinical deals, and payments.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedHospital && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Executive Summary Bar for this Hospital */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-teal-950/40 dark:to-indigo-950/40 border border-teal-200 dark:border-teal-800">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Total Donors</span>
                  <div className="text-lg font-black text-foreground">{selectedHospital.totalDonorsSent} Donors</div>
                  <div className="text-[10px] text-muted-foreground">
                    {selectedHospital.eggDonorsCount} Egg • {selectedHospital.spermDonorsCount} Sperm
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Total Deals Value</span>
                  <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                    ₹{(selectedHospital.totalDealValue || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Contract volume</div>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Payment Received</span>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    ₹{(selectedHospital.totalPaymentReceived || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold">{selectedHospital.collectionRate}% Recovered</div>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Pending Due</span>
                  <div className="text-lg font-black text-amber-700 dark:text-amber-300">
                    ₹{(selectedHospital.pendingBalance || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Outstanding balance</div>
                </div>
              </div>

              {/* Search Inside Drilldown */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  placeholder="Search donor by name, registration ID, donor ID..."
                  className="pl-9 h-9 rounded-xl text-xs"
                />
              </div>

              {/* Donors Roster Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-muted z-10 border-b">
                      <tr className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Registration ID</th>
                        <th className="p-3">Donor ID</th>
                        <th className="p-3">Donor Profile</th>
                        <th className="p-3">Type / Tier</th>
                        <th className="p-3">Agreed Deal</th>
                        <th className="p-3">Payment Status</th>
                        <th className="p-3">Schedule Dates</th>
                        <th className="p-3">File Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredDrilldownDonors.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            No matching donors found in this hospital's records.
                          </td>
                        </tr>
                      ) : (
                        filteredDrilldownDonors.map((d: any) => {
                          const isReceived = d.paymentStatus === "RECEIVED";
                          return (
                            <tr key={d.registrationId} className="hover:bg-muted/30">
                              <td className="p-3 font-bold text-foreground">
                                <div className="flex items-center gap-1">
                                  <span>{d.registrationId}</span>
                                  <button
                                    onClick={() => copyToClipboard(d.registrationId, "Registration ID")}
                                    className="text-muted-foreground hover:text-teal-600"
                                    title="Copy ID"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              <td className="p-3 font-mono font-bold text-teal-600">
                                {d.donorId || "Pending"}
                              </td>

                              <td className="p-3 font-semibold text-foreground">
                                {d.donorName}
                                <div className="text-[10px] text-muted-foreground font-normal">
                                  {d.bloodGroup} {d.age ? `• ${d.age} yrs` : ""}
                                </div>
                              </td>

                              <td className="p-3">
                                <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-muted">
                                  {d.donorType} • {d.category}
                                </span>
                              </td>

                              <td className="p-3 font-bold text-foreground">
                                ₹{d.dealPrice.toLocaleString("en-IN")}
                              </td>

                              <td className="p-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isReceived
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                                  }`}
                                >
                                  {isReceived ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                  {isReceived ? "Received" : "Pending"}
                                </span>
                                {d.paymentReference && (
                                  <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                                    Ref: {d.paymentReference}
                                  </div>
                                )}
                              </td>

                              <td className="p-3 text-[10px] text-muted-foreground">
                                <div>Pickup: <span className="font-medium text-foreground">{formatDisplayDate(d.pickupDate)}</span></div>
                                <div>Supply: <span className="font-medium text-foreground">{formatDisplayDate(d.supplyDate)}</span></div>
                              </td>

                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  d.status === "COMPLETED"
                                    ? "bg-purple-100 text-purple-700"
                                    : d.status === "FILE_COMPLETED"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {d.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDrilldownOpen(false)}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
