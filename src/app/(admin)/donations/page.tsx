"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  RefreshCw, 
  Search, 
  Heart, 
  MapPin, 
  User, 
  CreditCard,
  CheckCircle,
  FileCheck,
  Edit,
  Activity,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Details Modal
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  async function loadDonations() {
    setLoading(true);
    try {
      const res = await fetch("/api/donations");
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations);
        setFiltered(data.donations);
      }
    } catch (err) {
      toast.error("Error fetching donations roster.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);

  // Filter and search
  useEffect(() => {
    let result = donations;
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(d => 
        d.referenceId.toLowerCase().includes(s) ||
        d.donorDetails.fullName.toLowerCase().includes(s) ||
        d.donorDetails.email.toLowerCase().includes(s) ||
        d.purpose.toLowerCase().includes(s)
      );
    }
    if (statusFilter) {
      result = result.filter(d => d.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, donations]);

  const handleOpenDetails = (donation: any) => {
    setSelectedDonation(donation);
    setAdminNotes(donation.adminNotes || "");
  };

  const handleUpdateStatusAndNotes = async (status: string) => {
    if (!selectedDonation) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/donations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDonation._id,
          status,
          adminNotes
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Donation status updated to ${status}!`);
        setSelectedDonation(null);
        loadDonations();
      } else {
        toast.error(data.error || "Failed to update donation.");
      }
    } catch (err) {
      toast.error("Network error while updating donation.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "VERIFIED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "CANCELLED":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500/10" /> Donations Ledger
          </h1>
          <p className="text-xs text-slate-500">Audit patient and corporate contribution receipts, check payment methods, and log internal transaction notes.</p>
        </div>
        <Button onClick={loadDonations} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Ledger
        </Button>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Search by Receipt ID, contributor name, email, or fund purpose..." 
            className="pl-9 text-xs h-9 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div className="text-right flex items-center justify-end text-xs font-semibold text-slate-500">
          {filtered.length} logs found
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs">Loading logs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No donations found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                <tr>
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Donor Name</th>
                  <th className="p-3">Purpose Fund</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-900">
                {filtered.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-rose-600 tracking-wider">{d.referenceId}</td>
                    <td className="p-3 font-semibold">
                      <div>{d.anonymous ? "Anonymous" : d.donorDetails.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{d.donorDetails.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{d.purpose}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      ₹{d.amount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
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
                              onClick={() => handleOpenDetails(d)}
                              className="cursor-pointer gap-2 text-xs font-semibold py-2"
                            >
                              <Edit className="w-4 h-4 text-rose-600" />
                              Audit Transaction
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* AUDIT DETAILS DIALOG */}
      <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogContent className="rounded-2xl max-w-lg bg-white dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600 fill-rose-600/10" /> Audit Transaction: {selectedDonation?.referenceId}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-500">Audit donor information, verify simulated transaction IDs, and log notes.</DialogDescription>
          </DialogHeader>

          {selectedDonation && (
            <div className="space-y-4 text-xs pt-2">
              
              {/* Donor Profile */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <User className="w-4 h-4 text-slate-400" /> Donor Profile
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Full Name:</span> {selectedDonation.donorDetails.fullName}</div>
                  <div><span className="text-slate-500">Phone:</span> {selectedDonation.donorDetails.phone || "N/A"}</div>
                  <div className="col-span-2"><span className="text-slate-500">Email:</span> {selectedDonation.donorDetails.email}</div>
                  <div className="col-span-2 flex items-start gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> <span>{selectedDonation.donorDetails.address}, {selectedDonation.donorDetails.city}, {selectedDonation.donorDetails.country}</span></div>
                  <div><span className="text-slate-500">Anonymity Flag:</span> <span className="font-bold text-rose-600">{selectedDonation.anonymous ? "ANONYMOUS ON SEARCH" : "PUBLICLY DISCLOSED"}</span></div>
                </div>
              </div>

              {/* Payment Receipt details */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Payment & Allocation Specs
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Fund Allocated:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDonation.purpose}</span></div>
                  <div><span className="text-slate-500">Contributed Amount:</span> <span className="font-bold text-rose-600">₹{selectedDonation.amount.toLocaleString()}</span></div>
                  <div><span className="text-slate-500">Payment Gateway:</span> {selectedDonation.paymentInfo.method}</div>
                  <div><span className="text-slate-500">Transaction ID:</span> {selectedDonation.paymentInfo.transactionId || "Pending Gateway Response"}</div>
                  {selectedDonation.message && <div className="col-span-2"><span className="text-slate-500">Donor Message:</span> <span className="italic">"{selectedDonation.message}"</span></div>}
                </div>
              </div>

              {/* Status and Notes updates */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Internal Audit Notes</label>
                <textarea 
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="Record banking verification, wire confirmation details, or receipt letters sent..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t justify-end">
                <Button 
                  onClick={() => handleUpdateStatusAndNotes("PENDING")} 
                  variant="outline" 
                  className="rounded-xl text-[10px] h-9 border-amber-200 text-amber-700 hover:bg-amber-50"
                  disabled={updating}
                >
                  Set Pending
                </Button>
                <Button 
                  onClick={() => handleUpdateStatusAndNotes("VERIFIED")} 
                  variant="outline" 
                  className="rounded-xl text-[10px] h-9 border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={updating}
                >
                  Verify Payment
                </Button>
                <Button 
                  onClick={() => handleUpdateStatusAndNotes("COMPLETED")} 
                  className="rounded-xl text-[10px] h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={updating}
                >
                  Mark Completed
                </Button>
                <Button 
                  onClick={() => handleUpdateStatusAndNotes("CANCELLED")} 
                  variant="outline" 
                  className="rounded-xl text-[10px] h-9 border-slate-200"
                  disabled={updating}
                >
                  Cancel
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
