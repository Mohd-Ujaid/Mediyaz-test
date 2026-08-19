"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Dna
} from "lucide-react";
import { toast } from "sonner";

export default function AdminRequirementsDashboard() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    todaysRequests: 0,
    pendingRequests: 0,
    matchedRequests: 0,
  });

  // Query Params
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch requirements list with params
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (status) q.set("status", status);
      if (priority) q.set("priority", priority);
      if (lookingFor) q.set("lookingFor", lookingFor);
      if (assignedStaff) q.set("assignedStaff", assignedStaff);
      if (bloodGroup) q.set("bloodGroup", bloodGroup);

      const reqRes = await fetch(`/api/donor-requirements?${q.toString()}`);
      const reqData = await reqRes.json();

      if (reqData.success) {
        setRequirements(reqData.requirements || []);
      }

      // 2. Fetch statistics
      const statsRes = await fetch("/api/donor-requirements/stats");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats({
          totalRequests: statsData.stats.totalRequests,
          todaysRequests: statsData.stats.todaysRequests,
          pendingRequests: statsData.stats.pendingRequests,
          matchedRequests: statsData.stats.matchedRequests,
        });
      }

      // 3. Populate staff list for dropdowns (using standard employee API if exists, or fetch unique from requirements)
      const empRes = await fetch("/api/employees");
      const empData = await empRes.json();
      if (empData.success) {
        setCoordinators(empData.employees.filter((e: any) => e.role === "ADMIN" || e.role === "STAFF"));
      }
    } catch (err) {
      toast.error("Failed to load requirements data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [status, priority, lookingFor, assignedStaff, bloodGroup]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setLookingFor("");
    setAssignedStaff("");
    setBloodGroup("");
    toast.success("Filters cleared.");
  };

  return (
    <div className="space-y-6 select-none pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Donor Matching Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Securely manage, match, and log communication history for intended parent requirements.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/admin/donor-requirements/reports">
            <Button variant="outline" className="rounded-xl text-xs gap-1.5 border-primary text-primary">
              <TrendingUp className="w-4 h-4" /> Analytical Reports
            </Button>
          </Link>
          <Button onClick={loadData} variant="outline" className="rounded-xl text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Requirement Files", value: stats.totalRequests, icon: Users, color: "text-primary bg-primary/10" },
          { label: "Submissions Today", value: stats.todaysRequests, icon: Clock, color: "text-secondary bg-secondary/10" },
          { label: "Pending Coordination", value: stats.pendingRequests, icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
          { label: "Successfully Matched", value: stats.matchedRequests, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" }
        ].map((item, idx) => (
          <Card key={idx} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs flex items-center gap-4">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{item.label}</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{item.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters Drawer */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search patient requests by Name, Email, or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
              />
            </div>
            <Button type="submit" className="rounded-xl h-10 px-4 bg-primary text-white hover:bg-teal-700 text-xs font-bold gap-1 cursor-pointer">
              Search
            </Button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Looking For</label>
              <select 
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px]"
              >
                <option value="">All Types</option>
                <option value="sperm">Sperm Donor</option>
                <option value="egg">Egg Donor</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Status Workflow</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px]"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Under Review">Under Review</option>
                <option value="Contacted">Contacted</option>
                <option value="Consultation Scheduled">Consultation Scheduled</option>
                <option value="Matching Process">Matching Process</option>
                <option value="Matched">Matched</option>
                <option value="Treatment Started">Treatment Started</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px]"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Blood Group</label>
              <select 
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px]"
              >
                <option value="">All Groups</option>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Coordinator</label>
              <select 
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px]"
              >
                <option value="">All Staff</option>
                <option value="unassigned">Unassigned</option>
                {coordinators.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleClearFilters} 
                variant="ghost" 
                className="w-full h-9 text-[11px] rounded-lg text-slate-550 border border-slate-200/60 dark:border-slate-800 hover:bg-slate-50"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Data Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Patient details</th>
                <th className="py-3.5 px-4">Requirement</th>
                <th className="py-3.5 px-4">Date submitted</th>
                <th className="py-3.5 px-4">Staff coordinator</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Workflow status</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    Connecting to MongoDB secure datastore...
                  </td>
                </tr>
              ) : requirements.length > 0 ? (
                requirements.map((req, idx) => (
                  <tr 
                    key={req._id} 
                    className={`border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all ${
                      idx % 2 === 1 ? "bg-slate-50/20" : ""
                    }`}
                  >
                    <td className="py-4 px-6 space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white">{req.personalDetails.fullName}</div>
                      <div className="text-[10px] text-slate-500">{req.personalDetails.email} | {req.personalDetails.phone}</div>
                      <div className="text-[9px] font-mono text-slate-400">ID: {req._id}</div>
                    </td>
                    <td className="py-4 px-4 space-y-1">
                      <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {req.treatmentRequirement.lookingFor} Donor
                      </span>
                      <div className="text-[10px] text-slate-500 font-semibold">{req.treatmentRequirement.purpose.toUpperCase()} Cycle</div>
                    </td>
                    <td className="py-4 px-4 text-slate-650">
                      {new Date(req.createdAt).toLocaleDateString()}
                      <span className="block text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-350">
                      {req.assignedStaff?.name || (
                        <span className="text-amber-600 text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded-md">UNASSIGNED</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.priority === "Urgent" 
                          ? "bg-red-100 text-red-700" 
                          : req.priority === "High" 
                            ? "bg-amber-100 text-amber-700" 
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        req.status === "Matched" || req.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : req.status === "Rejected" || req.status === "Closed"
                            ? "bg-red-100 text-red-750"
                            : "bg-secondary/15 text-secondary-foreground"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link href={`/admin/donor-requirements/${req._id}`}>
                        <Button size="sm" className="rounded-lg text-xs gap-1 bg-primary text-white hover:bg-teal-700 cursor-pointer shadow-xs">
                          <Eye className="w-3.5 h-3.5" /> Manage Match
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>No patient matching requests found in the MongoDB datastore.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

// Simple Loader component definition inline
function Loader2({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin ${className}`}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
