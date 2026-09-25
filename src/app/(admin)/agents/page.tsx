"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Users,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  Copy,
  Check,
  Eye,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  Loader2,
  Info,
  ShieldCheck,
  Save,
  MapPin,
  Calendar,
  BadgeCheck,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Selected agent for viewing donors
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [agentDonors, setAgentDonors] = useState<any[]>([]);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [isViewDonorsOpen, setIsViewDonorsOpen] = useState(false);

  // Payout processing modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutDonor, setPayoutDonor] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutStatus, setPayoutStatus] = useState("PAID");
  const [paymentRef, setPaymentRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  // Add agent modal
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAgency, setNewAgency] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newEggComm, setNewEggComm] = useState(5000);
  const [newSpermComm, setNewSpermComm] = useState(2000);
  const [newBankName, setNewBankName] = useState("");
  const [newAccNum, setNewAccNum] = useState("");
  const [newIfsc, setNewIfsc] = useState("");
  const [newUpi, setNewUpi] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Agent More Details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsAgent, setDetailsAgent] = useState<any | null>(null);
  const [detailsEditNotes, setDetailsEditNotes] = useState("");
  const [detailsStatus, setDetailsStatus] = useState("ACTIVE");
  const [detailsEggComm, setDetailsEggComm] = useState(5000);
  const [detailsSpermComm, setDetailsSpermComm] = useState(2000);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsCopied, setDetailsCopied] = useState<string | null>(null);
  const [togglingDonorId, setTogglingDonorId] = useState<string | null>(null);

  async function loadAgents() {
    setLoading(true);
    try {
      let query = `/api/admin/agents?page=${currentPage}&limit=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
        if (data.pagination) setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.error || "Failed to load agents.");
      }
    } catch (err) {
      toast.error("Network error loading agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, [search, statusFilter, currentPage]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Agent Code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenViewDonors = async (agent: any) => {
    setSelectedAgent(agent);
    setIsViewDonorsOpen(true);
    setDonorsLoading(true);
    try {
      const res = await fetch(`/api/admin/agents?code=${encodeURIComponent(agent.agentCode)}`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setAgentDonors(data.donors || []);
        if (data.agent) {
          setSelectedAgent(data.agent);
        }
      } else {
        toast.error("Failed to load referred donors.");
      }
    } catch {
      toast.error("Network error loading referred donors.");
    } finally {
      setDonorsLoading(false);
    }
  };

  const copyDetailText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setDetailsCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setDetailsCopied(null), 2000);
  };

  const handleOpenDetails = (agent: any) => {
    setDetailsAgent(agent);
    setDetailsEditNotes(agent.notes || "");
    setDetailsStatus(agent.status || "ACTIVE");
    setDetailsEggComm(agent.commissionRates?.eggDonorCommission || 5000);
    setDetailsSpermComm(agent.commissionRates?.spermDonorCommission || 2000);
    setIsDetailsModalOpen(true);
  };

  const handleSaveAgentDetails = async () => {
    if (!detailsAgent) return;
    setDetailsSaving(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_agent",
          agentId: detailsAgent._id,
          status: detailsStatus,
          commissionRates: {
            eggDonorCommission: Number(detailsEggComm) || 5000,
            spermDonorCommission: Number(detailsSpermComm) || 2000,
          },
          notes: detailsEditNotes,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Agent details updated successfully!");
        setDetailsAgent((prev: any) => ({
          ...prev,
          status: detailsStatus,
          notes: detailsEditNotes,
          commissionRates: {
            eggDonorCommission: Number(detailsEggComm) || 5000,
            spermDonorCommission: Number(detailsSpermComm) || 2000,
          }
        }));
        loadAgents();
      } else {
        toast.error(data.error || "Failed to update agent details.");
      }
    } catch {
      toast.error("Network error updating agent details.");
    } finally {
      setDetailsSaving(false);
    }
  };

  const handleQuickTogglePayout = async (donor: any, newStatus: "PAID" | "UNPAID") => {
    const donorKey = donor.registrationId || donor._id;
    if (!donorKey) return;
    setTogglingDonorId(donorKey);

    const isEgg = donor.donorType === "egg";
    const defaultAmt = isEgg ? (selectedAgent?.commissionRates?.eggDonorCommission || 5000) : (selectedAgent?.commissionRates?.spermDonorCommission || 2000);
    const currentAmt = Number(donor.agentPayout?.amount) > 0 ? Number(donor.agentPayout.amount) : defaultAmt;

    const prevDonors = [...agentDonors];
    const prevSelectedAgent = selectedAgent ? { ...selectedAgent } : null;
    const prevAgents = [...agents];

    // 1. Optimistically update local agentDonors immediately so button and badge flip instantly
    setAgentDonors((prev: any[]) =>
      prev.map((item: any) => {
        const isMatch = (item.registrationId && item.registrationId === donor.registrationId) ||
                        (item._id && donor._id && String(item._id) === String(donor._id));
        if (isMatch) {
          return {
            ...item,
            agentPayout: {
              ...(item.agentPayout || {}),
              amount: currentAmt,
              status: newStatus,
              paidAt: newStatus === "PAID" ? new Date().toISOString() : null,
              paymentReference: newStatus === "PAID" ? (donor.agentPayout?.paymentReference || "ADMIN-DIRECT-PAYOUT") : "",
              notes: newStatus === "PAID" ? "Marked as Paid by Admin" : "Marked as Unpaid by Admin",
            }
          };
        }
        return item;
      })
    );

    // 2. Helper to compute new live commission totals: Due goes to Paid when marked PAID
    const updateStats = (target: any) => {
      if (!target) return target;
      const curPending = target.liveStats?.pendingPayout ?? target.stats?.pendingPayout ?? 0;
      const curPaid = target.liveStats?.paidPayout ?? target.stats?.paidPayout ?? 0;
      const newPending = newStatus === "PAID" ? Math.max(0, curPending - currentAmt) : curPending + currentAmt;
      const newPaid = newStatus === "PAID" ? curPaid + currentAmt : Math.max(0, curPaid - currentAmt);
      return {
        ...target,
        stats: { ...(target.stats || {}), pendingPayout: newPending, paidPayout: newPaid },
        liveStats: { ...(target.liveStats || {}), pendingPayout: newPending, paidPayout: newPaid },
      };
    };

    // Optimistically update selectedAgent and agents list in the main table immediately
    setSelectedAgent((prev: any) => updateStats(prev));
    setAgents((prev: any[]) =>
      prev.map((ag: any) => {
        const isMatch = ag._id === selectedAgent?._id || ag.agentCode === selectedAgent?.agentCode;
        return isMatch ? updateStats(ag) : ag;
      })
    );

    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_payout",
          donorRegistrationId: donor.registrationId || donor._id,
          agentCode: selectedAgent?.agentCode || donor.agentCode,
          agentId: selectedAgent?._id || donor.agentId,
          payoutAmount: currentAmt,
          payoutStatus: newStatus,
          paymentReference: newStatus === "PAID" ? (donor.agentPayout?.paymentReference || "ADMIN-DIRECT-PAYOUT") : "",
          notes: newStatus === "PAID" ? "Marked as Paid by Admin" : "Marked as Unpaid by Admin",
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Commission marked as ${newStatus} successfully!`);
        // If server returned recalculated stats, apply them cleanly
        if (data.stats) {
          setSelectedAgent((prev: any) => prev ? { ...prev, liveStats: data.stats, stats: { ...(prev.stats || {}), ...data.stats } } : prev);
          setAgents((prev: any[]) =>
            prev.map((ag: any) => {
              const isMatch = ag._id === selectedAgent?._id || ag.agentCode === selectedAgent?.agentCode;
              return isMatch ? { ...ag, liveStats: data.stats, stats: { ...(ag.stats || {}), ...data.stats } } : ag;
            })
          );
        }
        loadAgents();
      } else {
        // Rollback state if server returns error
        setAgentDonors(prevDonors);
        if (prevSelectedAgent) setSelectedAgent(prevSelectedAgent);
        setAgents(prevAgents);
        toast.error(data.error || "Failed to update payout status.");
      }
    } catch (err: any) {
      setAgentDonors(prevDonors);
      if (prevSelectedAgent) setSelectedAgent(prevSelectedAgent);
      setAgents(prevAgents);
      toast.error(err?.message || "Network error updating payout status.");
    } finally {
      setTogglingDonorId(null);
    }
  };

  const handleOpenPayout = (donor: any) => {
    setPayoutDonor(donor);
    setPayoutAmount(donor.agentPayout?.amount || (donor.donorType === "egg" ? 5000 : 2000));
    setPayoutStatus(donor.agentPayout?.status || "PAID");
    setPaymentRef(donor.agentPayout?.paymentReference || "");
    setPayoutNotes(donor.agentPayout?.notes || "");
    setIsPayoutModalOpen(true);
  };

  const handleProcessPayout = async () => {
    if (!payoutDonor) return;
    setPayoutSubmitting(true);
    const prevDonors = [...agentDonors];
    const prevSelectedAgent = selectedAgent ? { ...selectedAgent } : null;
    const prevAgents = [...agents];

    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_payout",
          donorRegistrationId: payoutDonor.registrationId || payoutDonor._id,
          agentCode: selectedAgent?.agentCode || payoutDonor.agentCode,
          agentId: selectedAgent?._id || payoutDonor.agentId,
          payoutAmount,
          payoutStatus,
          paymentReference: paymentRef,
          notes: payoutNotes,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Payout recorded successfully!");
        setIsPayoutModalOpen(false);

        // Update local state immediately
        setAgentDonors((prev: any[]) =>
          prev.map((item: any) => {
            const isMatch = (item.registrationId && item.registrationId === payoutDonor.registrationId) ||
                            (item._id && payoutDonor._id && String(item._id) === String(payoutDonor._id));
            if (isMatch) {
              return {
                ...item,
                agentPayout: {
                  ...(item.agentPayout || {}),
                  amount: payoutAmount,
                  status: payoutStatus,
                  paidAt: payoutStatus === "PAID" ? new Date().toISOString() : null,
                  paymentReference: paymentRef,
                  notes: payoutNotes
                }
              };
            }
            return item;
          })
        );

        if (data.stats) {
          setSelectedAgent((prev: any) => prev ? { ...prev, liveStats: data.stats, stats: { ...(prev.stats || {}), ...data.stats } } : prev);
          setAgents((prev: any[]) =>
            prev.map((ag: any) => {
              const isMatch = ag._id === selectedAgent?._id || ag.agentCode === selectedAgent?.agentCode;
              return isMatch ? { ...ag, liveStats: data.stats, stats: { ...(ag.stats || {}), ...data.stats } } : ag;
            })
          );
        }

        loadAgents();
      } else {
        setAgentDonors(prevDonors);
        if (prevSelectedAgent) setSelectedAgent(prevSelectedAgent);
        setAgents(prevAgents);
        toast.error(data.error || "Failed to process payout.");
      }
    } catch (err: any) {
      setAgentDonors(prevDonors);
      if (prevSelectedAgent) setSelectedAgent(prevSelectedAgent);
      setAgents(prevAgents);
      toast.error(err?.message || "Network error processing payout.");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newMobile.trim()) {
      toast.error("Name and Mobile are required.");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          mobileNumber: newMobile.trim(),
          email: newEmail.trim(),
          agencyName: newAgency.trim(),
          city: newCity.trim(),
          commissionRates: {
            eggDonorCommission: Number(newEggComm) || 5000,
            spermDonorCommission: Number(newSpermComm) || 2000,
          },
          bankDetails: {
            accountHolderName: newFullName.trim(),
            bankName: newBankName.trim(),
            accountNumber: newAccNum.trim(),
            ifscCode: newIfsc.trim().toUpperCase(),
            upiId: newUpi.trim(),
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Agent created successfully!");
        setIsAddAgentOpen(false);
        // Reset form
        setNewFullName("");
        setNewMobile("");
        setNewEmail("");
        setNewAgency("");
        setNewCity("");
        setNewBankName("");
        setNewAccNum("");
        setNewIfsc("");
        setNewUpi("");
        loadAgents();
      } else {
        toast.error(data.error || "Failed to create agent.");
      }
    } catch {
      toast.error("Network error creating agent.");
    } finally {
      setAddLoading(false);
    }
  };

  // Compute aggregate stats across agents
  const totalAgents = agents.length;
  let totalSourced = 0;
  let totalPayable = 0;
  let totalPaid = 0;

  agents.forEach((ag) => {
    const st = ag.liveStats || {};
    totalSourced += st.totalDonors || 0;
    totalPayable += st.pendingPayout || 0;
    totalPaid += st.paidPayout || 0;
  });

  return (
    <div className="space-y-6 p-6">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" /> Sourcing Agents & Affiliates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track donor coordinators, monitor referred candidates, and administer commission payouts.
          </p>
        </div>

        <Button
          onClick={() => setIsAddAgentOpen(true)}
          className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs h-10 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Agent
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Partners</p>
            <p className="text-2xl font-black text-slate-900">{totalAgents}</p>
            <p className="text-[11px] text-slate-500">Registered Sourcing Agents</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Donors Sourced</p>
            <p className="text-2xl font-black text-teal-700">{totalSourced}</p>
            <p className="text-[11px] text-slate-500">Egg & Sperm candidacies</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Commission Due</p>
            <p className="text-2xl font-black text-amber-600">₹{totalPayable.toLocaleString()}</p>
            <p className="text-[11px] text-amber-700/80 font-medium">Pending payout disbursement</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Commission Settled</p>
            <p className="text-2xl font-black text-emerald-600">₹{totalPaid.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-700/80 font-medium">Completed payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search by name, code, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Agent Code</th>
                <th className="py-3.5 px-4">Coordinator / Agency</th>
                <th className="py-3.5 px-4">Contact & City</th>
                <th className="py-3.5 px-4">Donors Sourced</th>
                <th className="py-3.5 px-4">Approved</th>
                <th className="py-3.5 px-4">Commissions (Due / Paid)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading agents...
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No agents found matching your query.
                  </td>
                </tr>
              ) : (
                agents.map((ag) => {
                  const st = ag.liveStats || {};
                  return (
                    <tr key={ag._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                            {ag.agentCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(ag.agentCode)}
                            className="text-slate-400 hover:text-teal-600 p-1"
                          >
                            {copiedCode === ag.agentCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{ag.fullName}</p>
                        <p className="text-[10px] text-slate-400">{ag.agencyName || "Independent"}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-mono text-slate-800">+91 {ag.mobileNumber}</p>
                        <p className="text-[10px] text-slate-400">{ag.city || "—"}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-slate-900">{st.totalDonors || 0}</span>
                          <span className="text-[10px] font-normal text-slate-400">
                            ({st.totalEggDonors || 0}E / {st.totalSpermDonors || 0}S)
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-teal-600">
                        {st.approvedDonors || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-amber-600">Due: ₹{(st.pendingPayout || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Paid: ₹{(st.paidPayout || 0).toLocaleString()}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ag.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ag.status === "SUSPENDED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {ag.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
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
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleOpenDetails(ag)}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2"
                              >
                                <Info className="w-4 h-4 text-teal-600" />
                                More Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenViewDonors(ag)}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2"
                              >
                                <Eye className="w-4 h-4 text-teal-600" />
                                View Donors
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Dialog: View Donors by Agent */}
      <Dialog open={isViewDonorsOpen} onOpenChange={setIsViewDonorsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Donors Attributed to Agent: {selectedAgent?.fullName} ({selectedAgent?.agentCode})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review candidates registered with this agent&apos;s referral code and administer commissions.
            </DialogDescription>
          </DialogHeader>

          {/* Dynamic Summary Cards: Total Donors, Due Payment (Pending), Paid Payment (Settled) */}
          {agentDonors.length > 0 && (() => {
            const totals = agentDonors.reduce((acc: any, d: any) => {
              const isEgg = d.donorType === "egg";
              const defaultAmt = isEgg ? (selectedAgent?.commissionRates?.eggDonorCommission || 5000) : (selectedAgent?.commissionRates?.spermDonorCommission || 2000);
              const amt = Number(d.agentPayout?.amount) > 0 ? Number(d.agentPayout.amount) : defaultAmt;
              const st = (d.agentPayout?.status || "UNPAID").toUpperCase();
              acc.total += amt;
              if (st === "PAID") {
                acc.paid += amt;
              } else if (st !== "CANCELLED") {
                acc.due += amt;
              }
              return acc;
            }, { total: 0, due: 0, paid: 0 });

            return (
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 my-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 font-bold shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Donors</p>
                    <p className="text-sm font-black text-slate-900">{agentDonors.length} <span className="text-[10px] font-medium text-slate-400">₹{totals.total.toLocaleString()}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 font-bold shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Due Payment</p>
                    <p className="text-sm font-black text-amber-700">₹{totals.due.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Paid Payment</p>
                    <p className="text-sm font-black text-emerald-700">₹{totals.paid.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {donorsLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading referred candidates...
            </div>
          ) : agentDonors.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No donors have registered with this Agent Code yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Registration ID</th>
                    <th className="py-3 px-3">Candidate Name</th>
                    <th className="py-3 px-3">Program</th>
                    <th className="py-3 px-3">Clinical Stage</th>
                    <th className="py-3 px-3">Commission</th>
                    <th className="py-3 px-3">Payout Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {agentDonors.map((d: any) => {
                    const isEgg = d.donorType === "egg";
                    const payout = d.agentPayout || {};
                    const amount = payout.amount || (isEgg ? 5000 : 2000);
                    const status = payout.status || "PENDING";

                    return (
                      <tr key={d.registrationId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {d.registrationId}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-800">{d.personalInfo?.fullName || "Candidate"}</p>
                          <p className="text-[10px] text-slate-400">{d.contactInfo?.mobileNumber || "—"}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEgg ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}>
                            {isEgg ? "Egg Donor" : "Sperm Donor"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : d.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          ₹{amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : status === "APPROVED"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {status === "PAID" ? "PAID" : status === "APPROVED" ? "APPROVED" : status === "CANCELLED" ? "CANCELLED" : "UNPAID"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {status === "PAID" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={togglingDonorId === (d.registrationId || d._id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickTogglePayout(d, "UNPAID");
                                }}
                                className="rounded-xl text-[11px] h-7 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold disabled:opacity-60"
                                title="Revert to unpaid / pending status"
                              >
                                {togglingDonorId === (d.registrationId || d._id) ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : null}
                                Mark Unpaid
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={togglingDonorId === (d.registrationId || d._id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickTogglePayout(d, "PAID");
                                }}
                                className="rounded-xl text-[11px] h-7 bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-60"
                                title="Quickly record commission as paid"
                              >
                                {togglingDonorId === (d.registrationId || d._id) ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                )}
                                Mark Paid
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPayout(d)}
                              className="rounded-xl text-xs h-7 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                              title="Update commission amount or transaction reference"
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDonorsOpen(false)} className="rounded-xl text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Process Payout */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              Admin Payout Settlement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update payout disbursement status for registration {payoutDonor?.registrationId}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Commission Amount (₹)</label>
              <Input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                className="rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Payout Status</label>
              <select
                value={payoutStatus}
                onChange={(e) => setPayoutStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="PAID">PAID (Disbursed to agent)</option>
                <option value="UNPAID">UNPAID (Pending disbursement)</option>
                <option value="PENDING">PENDING (Under evaluation)</option>
                <option value="APPROVED">APPROVED (Eligible for payout)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Transaction / UTR Reference</label>
              <Input
                placeholder="e.g. UTR-9821739123 or IMPS-4821"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Internal Admin Notes</label>
              <Input
                placeholder="e.g. Paid via NEFT from Mediyaz Main A/C"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayoutModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayout}
              disabled={payoutSubmitting}
              className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
            >
              {payoutSubmitting ? "Saving..." : "Save Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add New Agent */}
      <Dialog open={isAddAgentOpen} onOpenChange={setIsAddAgentOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-600" />
              Onboard Sourcing Agent / Partner
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create an official agent record. A unique sequential Agent Code (e.g. AGT-100X) will be generated.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAgent} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Dr. A. K. Sharma"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mobile Phone *</label>
                <Input
                  required
                  placeholder="e.g. 9876543210"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value.replace(/[^0-9]/g, ""))}
                  className="rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <Input
                  type="email"
                  placeholder="partner@clinic.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-slate-700">Agency / Organization Name</label>
                <Input
                  placeholder="e.g. Care Fertility Agency"
                  value={newAgency}
                  onChange={(e) => setNewAgency(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-slate-700">City / District</label>
                <Input
                  placeholder="e.g. Lucknow, UP"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Egg Donor Comm. (₹)</label>
                <Input
                  type="number"
                  value={newEggComm}
                  onChange={(e) => setNewEggComm(Number(e.target.value))}
                  className="rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Sperm Donor Comm. (₹)</label>
                <Input
                  type="number"
                  value={newSpermComm}
                  onChange={(e) => setNewSpermComm(Number(e.target.value))}
                  className="rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bank Details (Optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Bank Name"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="rounded-xl text-xs"
                />
                <Input
                  placeholder="Account Number"
                  value={newAccNum}
                  onChange={(e) => setNewAccNum(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                />
                <Input
                  placeholder="IFSC Code"
                  value={newIfsc}
                  onChange={(e) => setNewIfsc(e.target.value.toUpperCase())}
                  className="rounded-xl text-xs font-mono"
                />
                <Input
                  placeholder="UPI ID"
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddAgentOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={addLoading} className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs">
                {addLoading ? "Saving..." : "Create Agent"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Agent Full Details & Profile */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-600" />
                  Agent Profile & Partner Details
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Comprehensive profile, clinical milestones, disbursement configuration, and agreed commissions.
                </DialogDescription>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                detailsStatus === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : detailsStatus === "SUSPENDED"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {detailsStatus}
              </span>
            </div>
          </DialogHeader>

          {detailsAgent && (
            <div className="space-y-5 py-2">
              {/* Agent Hero Banner Card */}
              <div className="bg-gradient-to-br from-teal-50/70 via-slate-50 to-white p-4 rounded-2xl border border-teal-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-teal-600/20">
                    {detailsAgent.fullName?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{detailsAgent.fullName}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {detailsAgent.agencyName ? `${detailsAgent.agencyName} • ` : ""}Sourcing Coordinator
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Code:</span>
                    <span className="font-mono font-black text-teal-700 text-xs">{detailsAgent.agentCode}</span>
                    <button
                      type="button"
                      onClick={() => copyDetailText(detailsAgent.agentCode, "Agent Code")}
                      className="text-slate-400 hover:text-teal-600 p-0.5 ml-1"
                      title="Copy Agent Code"
                    >
                      {detailsCopied === "Agent Code" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      handleOpenViewDonors(detailsAgent);
                    }}
                    className="rounded-xl text-xs h-8 bg-teal-600 text-white hover:bg-teal-500 border-none font-bold"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" /> View Donors
                  </Button>
                </div>
              </div>

              {/* Performance Milestone KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sourced</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {detailsAgent.liveStats?.totalDonors ?? ((detailsAgent.stats?.totalEggDonors || 0) + (detailsAgent.stats?.totalSpermDonors || 0))}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {detailsAgent.liveStats?.totalEggDonors ?? detailsAgent.stats?.totalEggDonors ?? 0} Egg / {detailsAgent.liveStats?.totalSpermDonors ?? detailsAgent.stats?.totalSpermDonors ?? 0} Sperm
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Donors</p>
                  <p className="text-xl font-black text-teal-700 mt-0.5">
                    {detailsAgent.liveStats?.approvedDonors ?? detailsAgent.stats?.approvedDonors ?? 0}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Clinical clear</p>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Commission Due</p>
                  <p className="text-xl font-black text-amber-700 mt-0.5">
                    ₹{(detailsAgent.liveStats?.pendingPayout ?? detailsAgent.stats?.pendingPayout ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-amber-600/80 font-medium mt-0.5">Pending payout</p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Commission Paid</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">
                    ₹{(detailsAgent.liveStats?.paidPayout ?? detailsAgent.stats?.paidPayout ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 font-medium mt-0.5">Settled to date</p>
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Section 1: Contact & Communication */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Phone className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact & Territory</h4>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mobile Phone:</span>
                      <div className="flex items-center gap-1.5">
                        <a href={`tel:${detailsAgent.mobileNumber}`} className="font-mono font-bold text-slate-800 hover:text-teal-600">
                          +91 {detailsAgent.mobileNumber}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyDetailText(detailsAgent.mobileNumber, "Phone")}
                          className="text-slate-400 hover:text-teal-600 p-0.5"
                        >
                          {detailsCopied === "Phone" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email Address:</span>
                      <div className="flex items-center gap-1.5">
                        {detailsAgent.email ? (
                          <>
                            <a href={`mailto:${detailsAgent.email}`} className="font-bold text-slate-800 hover:text-teal-600 truncate max-w-[180px]">
                              {detailsAgent.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyDetailText(detailsAgent.email, "Email")}
                              className="text-slate-400 hover:text-teal-600 p-0.5"
                            >
                              {detailsCopied === "Email" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Not provided</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Agency / Org:</span>
                      <span className="font-bold text-slate-800">{detailsAgent.agencyName || "Independent"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">City & State:</span>
                      <span className="font-bold text-slate-800">
                        {[detailsAgent.city, detailsAgent.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Onboarded:</span>
                      <span className="text-slate-700 font-medium">
                        {detailsAgent.createdAt ? new Date(detailsAgent.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Bank & Disbursement Information */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Disbursement & Banking</h4>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">A/C Holder:</span>
                      <span className="font-bold text-slate-800">{detailsAgent.bankDetails?.accountHolderName || detailsAgent.fullName || "—"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Bank Name:</span>
                      <span className="font-bold text-slate-800">{detailsAgent.bankDetails?.bankName || "Not configured"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Account No:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{detailsAgent.bankDetails?.accountNumber || "—"}</span>
                        {detailsAgent.bankDetails?.accountNumber && (
                          <button
                            type="button"
                            onClick={() => copyDetailText(detailsAgent.bankDetails.accountNumber, "Account Number")}
                            className="text-slate-400 hover:text-teal-600 p-0.5"
                          >
                            {detailsCopied === "Account Number" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">IFSC Code:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{detailsAgent.bankDetails?.ifscCode || "—"}</span>
                        {detailsAgent.bankDetails?.ifscCode && (
                          <button
                            type="button"
                            onClick={() => copyDetailText(detailsAgent.bankDetails.ifscCode, "IFSC Code")}
                            className="text-slate-400 hover:text-teal-600 p-0.5"
                          >
                            {detailsCopied === "IFSC Code" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">UPI / VPA:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-teal-700">{detailsAgent.bankDetails?.upiId || "—"}</span>
                        {detailsAgent.bankDetails?.upiId && (
                          <button
                            type="button"
                            onClick={() => copyDetailText(detailsAgent.bankDetails.upiId, "UPI ID")}
                            className="text-slate-400 hover:text-teal-600 p-0.5"
                          >
                            {detailsCopied === "UPI ID" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Commission Terms (Editable) */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <DollarSign className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Agreed Commission Structure</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Egg Donor Payout (₹)</label>
                      <Input
                        type="number"
                        value={detailsEggComm}
                        onChange={(e) => setDetailsEggComm(Number(e.target.value))}
                        className="rounded-xl text-xs font-bold text-slate-900 h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Sperm Donor Payout (₹)</label>
                      <Input
                        type="number"
                        value={detailsSpermComm}
                        onChange={(e) => setDetailsSpermComm(Number(e.target.value))}
                        className="rounded-xl text-xs font-bold text-slate-900 h-9"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Default payout rates applied when candidates register with this agent&apos;s code.
                  </p>
                </div>

                {/* Section 4: Account Status & Notes */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Account Status & Notes</h4>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Partner Status</label>
                      <select
                        value={detailsStatus}
                        onChange={(e) => setDetailsStatus(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="ACTIVE">ACTIVE (Receiving referrals)</option>
                        <option value="PENDING_APPROVAL">PENDING_APPROVAL (Under verification)</option>
                        <option value="SUSPENDED">SUSPENDED (Temporarily disabled)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Internal Admin Notes</label>
                      <Input
                        placeholder="e.g. Reliable coordinator based in Delhi NCR"
                        value={detailsEditNotes}
                        onChange={(e) => setDetailsEditNotes(e.target.value)}
                        className="rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
              className="rounded-xl text-xs w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handleSaveAgentDetails}
              disabled={detailsSaving}
              className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs w-full sm:w-auto flex items-center gap-1.5"
            >
              {detailsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {detailsSaving ? "Saving..." : "Save Agent Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
