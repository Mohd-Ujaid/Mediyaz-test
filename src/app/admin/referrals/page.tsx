"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Gift, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  User, 
  Check, 
  Loader2, 
  CreditCard,
  Calendar,
  AlertCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";

const REFERRAL_TYPES = [
  "Existing Patient",
  "Existing Donor",
  "Friend / Family",
  "Doctor / Clinic",
  "Staff Member",
  "Website",
  "Google Search",
  "Facebook",
  "Instagram",
  "WhatsApp",
  "Advertisement",
  "Walk-in",
  "Other"
];

const REWARD_STATUSES = ["Pending", "Approved", "Paid", "Cancelled"];

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for updates
  const [rewardEligible, setRewardEligible] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardStatus, setRewardStatus] = useState("Pending");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [adminNotes, setAdminNotes] = useState("");

  async function loadReferrals() {
    setLoading(true);
    try {
      let query = `/api/referrals?page=${currentPage}&limit=10&search=${encodeURIComponent(search)}`;
      if (typeFilter) query += `&referralType=${encodeURIComponent(typeFilter)}`;
      if (statusFilter) query += `&rewardStatus=${statusFilter}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setReferrals(data.referrals || []);
        if (data.pagination) setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.error || "Failed to load referrals.");
      }
    } catch (err) {
      toast.error("Failed to load referrals from server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReferrals();
  }, [search, typeFilter, statusFilter, currentPage]);

  const handleUpdateReward = async () => {
    if (!selectedReferral) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralId: selectedReferral._id,
          rewardEligible,
          rewardAmount: Number(rewardAmount),
          rewardStatus,
          paymentMethod: rewardStatus === "Paid" ? paymentMethod : undefined,
          adminNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Referral reward updated successfully!");
        setIsUpdateModalOpen(false);
        loadReferrals();
      } else {
        toast.error(data.error || "Failed to update reward.");
      }
    } catch (err) {
      toast.error("Network error updating referral.");
    } finally {
      setActionLoading(false);
    }
  };

  const getRewardStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
      case "Approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      case "Paid":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Referral Rewards Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage referral sources, audit rewards eligibility, and record reward disbursement transactions.
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 p-4 shadow-sm bg-white dark:bg-slate-950">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search referrer/referred */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Referrer, Referred Donor, ID, Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs h-9 rounded-[10px] bg-white dark:bg-slate-950"
            />
          </div>

          {/* Referral type filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Referral Types</option>
              {REFERRAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Reward status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Reward Statuses</option>
              {REWARD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Referrals table */}
      <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
        <CardHeader className="py-4 px-6 border-b dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Referrals Registry</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" /> Fetching referrals...
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <span>No referrals recorded yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b dark:border-slate-800">
                    <th className="py-3 px-4">Referral Source Type</th>
                    <th className="py-3 px-4">Referrer Details</th>
                    <th className="py-3 px-4">Referred Donor</th>
                    <th className="py-3 px-4">Registration Status</th>
                    <th className="py-3 px-4">Reward Eligibility</th>
                    <th className="py-3 px-4">Reward Value</th>
                    <th className="py-3 px-4">Reward Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {referrals.map((ref) => (
                    <tr key={ref._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                      
                      {/* Source Type */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{ref.sourceReferralType}</span>
                      </td>

                      {/* Referrer Name & ID */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">{ref.referrerName}</div>
                        {ref.patientOrDonorId && (
                          <div className="text-[10px] font-mono text-slate-500">ID: {ref.patientOrDonorId}</div>
                        )}
                        {ref.mobileNumber && (
                          <div className="text-[10px] text-slate-400">Mob: {ref.mobileNumber}</div>
                        )}
                      </td>

                      {/* Referred Donor */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{ref.referredDonorName}</div>
                        <div className="text-[10px] font-mono text-slate-500">Reg: {ref.referredRegistrationId}</div>
                      </td>

                      {/* Referred Donor Reg Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ref.registrationStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                            : ref.registrationStatus === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-450"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                        }`}>
                          {ref.registrationStatus}
                        </span>
                      </td>

                      {/* Reward Eligibility */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ref.rewardEligible
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {ref.rewardEligible ? "Eligible" : "Not Eligible"}
                        </span>
                      </td>

                      {/* Reward Amount */}
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        ₹{(ref.rewardAmount || 0).toLocaleString()}
                      </td>

                      {/* Reward Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getRewardStatusBadge(ref.rewardStatus)}`}>
                          {ref.rewardStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedReferral(ref);
                            setRewardEligible(ref.rewardEligible);
                            setRewardAmount(ref.rewardAmount);
                            setRewardStatus(ref.rewardStatus);
                            setAdminNotes(ref.adminNotes || "");
                            setPaymentMethod(ref.paymentMethod || "Bank Transfer");
                            setIsUpdateModalOpen(true);
                          }}
                          className="h-8 rounded-lg border text-xs gap-1 hover:bg-slate-50"
                        >
                          <Gift className="w-3.5 h-3.5 text-teal-600" /> Manage Reward
                        </Button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && referrals.length > 0 && (
            <div className="pt-4 mt-4 border-t dark:border-slate-800">
              <CustomPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configure Reward Details Modal Dialog */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="max-w-md rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Configure Reward & Disburse</DialogTitle>
            <DialogDescription className="text-xs">Adjust reward amounts, verify referral eligibility, and write admin notes.</DialogDescription>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-4 text-xs mt-2">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-800 space-y-1">
                <div>Referrer: <strong>{selectedReferral.referrerName}</strong> ({selectedReferral.sourceReferralType})</div>
                <div>Referred Candidate: <strong>{selectedReferral.referredDonorName}</strong></div>
                <div>Referred Registration Status: <span className="font-bold">{selectedReferral.registrationStatus}</span></div>
              </div>

              {/* Reward Eligible */}
              <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reward Eligible?</label>
                <input
                  type="checkbox"
                  checked={rewardEligible}
                  onChange={(e) => setRewardEligible(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500"
                />
              </div>

              {/* Reward Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reward Value (₹)</label>
                <Input
                  type="number"
                  placeholder="Reward Amount"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(Number(e.target.value))}
                  className="rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950"
                  disabled={!rewardEligible}
                />
              </div>

              {/* Reward Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Disbursement Status</label>
                <select
                  value={rewardStatus}
                  onChange={(e) => setRewardStatus(e.target.value)}
                  className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  disabled={!rewardEligible}
                >
                  {REWARD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Payment Details (Visible if Paid) */}
              {rewardStatus === "Paid" && (
                <div className="space-y-3 p-3 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950 rounded-lg animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option>Bank Transfer</option>
                      <option>UPI / GPay / PhonePe</option>
                      <option>Cheque</option>
                      <option>Cash</option>
                    </select>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Date Paid will automatically save as today.
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Admin Payment Notes</label>
                <textarea
                  placeholder="Record reference transaction ID, banking logs, or remarks..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full min-h-[80px] p-2.5 border rounded-[10px] bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 border-t dark:border-slate-800 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="rounded-[10px] text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateReward}
                  disabled={actionLoading}
                  className="rounded-[10px] text-xs h-9 px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/10"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
