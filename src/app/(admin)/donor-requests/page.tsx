"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Dna,
  User,
  Check,
  X,
  MessageSquare,
  Eye,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DonorRequest {
  _id: string;
  recipient: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  } | null;
  donor: {
    _id: string;
    donorId: string;
    age: number;
    gender: string;
    bloodGroup: string;
  };
  fullName: string;
  email?: string;
  age: number;
  bloodGroup: string;
  contactNumber: string;
  medicalCondition?: string;
  message?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export default function AdminDonorRequestsPage() {
  const [requests, setRequests] = useState<DonorRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog State
  const [selectedRequest, setSelectedRequest] = useState<DonorRequest | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  // Fetch all requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recipient/donor-requests?page=${currentPage}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
        if (data.pagination) setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.error || "Failed to load matching requests.");
      }
    } catch {
      toast.error("Network error while loading requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage]);

  // Update Status API
  const handleUpdateStatus = async (
    requestId: string,
    status: "APPROVED" | "REJECTED" | "CANCELLED",
  ) => {
    setActionPending(true);
    try {
      const res = await fetch("/api/recipient/donor-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Request status updated to ${status}.`);
        setIsDetailOpen(false);
        fetchRequests(); // reload list
      } else {
        toast.error(data.error || "Status update failed.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionPending(false);
    }
  };

  // Compute Statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "PENDING").length;
  const approvedRequests = requests.filter(
    (r) => r.status === "APPROVED",
  ).length;
  const rejectedRequests = requests.filter(
    (r) => r.status === "REJECTED" || r.status === "CANCELLED",
  ).length;

  // Filter & Search matching
  const filteredRequests = requests.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPatientName =
        r.recipient?.name?.toLowerCase().includes(q) || false;
      const matchPatientEmail =
        r.recipient?.email?.toLowerCase().includes(q) || false;
      const matchDonorId = r.donor?.donorId?.toLowerCase().includes(q) || false;
      return matchPatientName || matchPatientEmail || matchDonorId;
    }

    return true;
  });

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Donor Matching Requests
          </h1>
          <p className="text-xs text-slate-500">
            Manage patient requests for specific anonymous cryobank donor
            profile allocations.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={fetchRequests}
            variant="outline"
            className="rounded-xl text-xs gap-1.5 h-9 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Requests",
            value: totalRequests,
            icon: Users,
            color: "text-primary bg-primary/10",
          },
          {
            label: "Pending Review",
            value: pendingRequests,
            icon: Clock,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Allocated / Approved",
            value: approvedRequests,
            icon: CheckCircle,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Rejected / Cancelled",
            value: rejectedRequests,
            icon: AlertCircle,
            color: "text-rose-600 bg-rose-50",
          },
        ].map((item, idx) => (
          <Card
            key={idx}
            className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {item.label}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {item.value}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Options */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by Patient Name, Email, or Requested Donor ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50 w-full focus:outline-none"
            />
          </div>

          <div className="w-full sm:w-48 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none"
            >
              <option value="">All Workflow Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved / Allocated</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Data Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No requests found
            </h3>
            <p className="text-xs text-slate-500">
              There are no matching requests in the system matching your
              criteria.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-4 pl-6">Patient (Recipient)</th>
                  <th className="p-4">Requested Donor</th>
                  <th className="p-4">Message / Notes</th>
                  <th className="p-4">Request Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {filteredRequests.map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-slate-55/50 dark:hover:bg-slate-900/40"
                  >
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 shrink-0 font-bold">
                        {req.fullName?.slice(0, 2).toUpperCase() || (
                          <User className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {req.fullName || "Anonymous Patient"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {req.email || "N/A"} • Phone: {req.contactNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Age: {req.age} • BG: {req.bloodGroup}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-teal-600 flex items-center gap-1">
                        <Dna className="w-4 h-4" />{" "}
                        {req.donor?.donorId || "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {req.donor?.gender} • Blood Group{" "}
                        {req.donor?.bloodGroup}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {req.message || (
                        <span className="italic text-slate-400">
                          No custom message
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          req.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40"
                            : req.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            req.status === "PENDING"
                              ? "bg-amber-500"
                              : req.status === "APPROVED"
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                          }`}
                        />
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
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
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsDetailOpen(true);
                              }}
                              className="cursor-pointer gap-2 text-xs font-semibold py-2"
                            >
                              <Eye className="w-4 h-4 text-teal-600" />
                              View Request Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {req.status !== "APPROVED" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(req._id, "APPROVED")}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/40"
                              >
                                <Check className="w-4 h-4 text-emerald-600" />
                                Approve Request
                              </DropdownMenuItem>
                            )}
                            {req.status !== "REJECTED" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(req._id, "REJECTED")}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                              >
                                <X className="w-4 h-4 text-rose-600" />
                                Reject Request
                              </DropdownMenuItem>
                            )}
                            {req.status !== "CANCELLED" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(req._id, "CANCELLED")}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2 text-slate-500"
                              >
                                <X className="w-4 h-4 text-slate-500" />
                                Cancel Request
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t dark:border-slate-800">
            <CustomPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </Card>
      )}

      {/* DETAIL MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white dark:bg-slate-950 border dark:border-slate-900 p-0 overflow-hidden">
          {selectedRequest && (
            <>
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Allocation Request
                    Detail
                  </DialogTitle>
                  <DialogDescription className="text-[11px] text-teal-100 mt-0.5 flex items-center gap-2">
                    Ref: {selectedRequest._id.slice(-8).toUpperCase()}
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        selectedRequest.status === "PENDING"
                          ? "bg-amber-400/20 text-amber-100"
                          : selectedRequest.status === "APPROVED"
                            ? "bg-emerald-400/20 text-emerald-100"
                            : "bg-rose-400/20 text-rose-100"
                      }`}
                    >
                      {selectedRequest.status}
                    </span>
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Two-Column Layout: 3/5 left, 2/5 right */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* LEFT COLUMN (3/5): Patient + Donor */}
                  <div className="md:col-span-3 space-y-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2.5 border border-slate-100 dark:border-slate-800/60">
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Patient Details
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Name
                          </span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedRequest.fullName}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Email
                          </span>
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {selectedRequest.email || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Phone
                          </span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedRequest.contactNumber}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Age
                          </span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedRequest.age} Years
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Blood Group
                          </span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedRequest.bloodGroup}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Requested On
                          </span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {new Date(
                              selectedRequest.createdAt,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2.5 border border-slate-100 dark:border-slate-800/60">
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Dna className="w-3 h-3" /> Requested Donor
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Donor ID
                          </span>
                          <div className="font-bold text-teal-600">
                            {selectedRequest.donor?.donorId}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Blood Group
                          </span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedRequest.donor?.bloodGroup}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">
                            Gender
                          </span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedRequest.donor?.gender}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN (2/5): Medical + Message */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800/60">
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">
                        Medical Condition
                      </h4>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[56px]">
                        {selectedRequest.medicalCondition || (
                          <span className="italic text-slate-400">
                            Not provided.
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800/60">
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">
                        Patient Message
                      </h4>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[56px]">
                        {selectedRequest.message || (
                          <span className="italic text-slate-400">
                            No message provided.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                {selectedRequest.status === "PENDING" ? (
                  <div className="flex gap-2.5 w-full">
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedRequest._id, "REJECTED")
                      }
                      variant="outline"
                      className="w-1/2 rounded-xl text-xs cursor-pointer text-rose-600 border-rose-250 hover:bg-rose-50"
                      disabled={actionPending}
                    >
                      Reject Allocation
                    </Button>
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedRequest._id, "APPROVED")
                      }
                      className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs cursor-pointer font-bold"
                      disabled={actionPending}
                    >
                      Approve Match
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailOpen(false)}
                    className="w-full rounded-xl text-xs cursor-pointer"
                  >
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
