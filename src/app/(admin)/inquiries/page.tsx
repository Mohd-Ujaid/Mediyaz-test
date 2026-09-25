"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  Check, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  Eye,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const STATUS_FLOW = [
  "New Inquiry",
  "Contact Attempted",
  "Consultation Scheduled",
  "Consultation Completed",
  "Registration Pending",
  "Registered",
  "Rejected"
];

export default function AdminInquiriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryIdParam = searchParams.get("inquiryId");
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & search
  const [search, setSearch] = useState("");
  const [interestFilter, setInterestFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Status update details
  const [newStatus, setNewStatus] = useState("New Inquiry");
  const [adminNotes, setAdminNotes] = useState("");
  const [consultationTime, setConsultationTime] = useState("");

  // Read-only history dialog
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyInquiry, setHistoryInquiry] = useState<any | null>(null);

  async function loadInquiries() {
    setLoading(true);
    try {
      let query = `/api/donor-queries?page=${currentPage}&limit=10&search=${encodeURIComponent(search)}`;
      if (interestFilter) query += `&donationInterest=${interestFilter}`;
      if (statusFilter) query += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setInquiries(data.inquiries || []);
        if (data.pagination) setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.error || "Failed to fetch inquiries.");
      }
    } catch (err) {
      toast.error("Failed to load inquiries from server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInquiries();
  }, [search, interestFilter, statusFilter, currentPage]);

  useEffect(() => {
    if (inquiryIdParam) {
      const fetchSingleInquiry = async () => {
        try {
          const res = await fetch(`/api/donor-queries/${inquiryIdParam}`);
          const data = await res.json();
          if (data.success && data.inquiry) {
            setSelectedInquiry(data.inquiry);
            setIsDetailOpen(true);
          }
        } catch (err) {
          console.error("Failed to load inquiry from query parameter:", err);
        }
      };
      fetchSingleInquiry();
    }
  }, [inquiryIdParam]);

  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/donor-queries/${selectedInquiry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
          consultationDateTime: newStatus === "Consultation Scheduled" ? consultationTime : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Inquiry status updated to ${newStatus}`);
        setIsStatusModalOpen(false);
        setIsDetailOpen(false);
        setAdminNotes("");
        setConsultationTime("");
        loadInquiries();
      } else {
        toast.error(data.error || "Update failed.");
      }
    } catch (err) {
      toast.error("Network error during status update.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async (inquiry: any) => {
    if (!confirm(`Are you sure you want to convert ${inquiry.fullName}'s inquiry into a full donor registration profile?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/donor-queries/${inquiry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Successfully converted inquiry to donor registration draft!");
        loadInquiries();
      } else {
        toast.error(data.error || "Conversion failed.");
      }
    } catch (err) {
      toast.error("Network error converting inquiry.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this donor inquiry?")) return;
    try {
      const res = await fetch(`/api/donor-queries/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Inquiry deleted successfully.");
        loadInquiries();
      } else {
        toast.error(data.error || "Failed to delete inquiry.");
      }
    } catch (err) {
      toast.error("Network error deleting inquiry.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New Inquiry":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      case "Contact Attempted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
      case "Consultation Scheduled":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300";
      case "Consultation Completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
      case "Registration Pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
      case "Registered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
      case "Rejected":
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
            Donor Inquiry Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review initial queries, track contact outcomes, schedule consultations, and convert inquiries to full donor registrations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 p-4 shadow-sm bg-white dark:bg-slate-950">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Name, Phone, Email, City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs h-9 rounded-[10px] bg-white dark:bg-slate-950"
            />
          </div>

          {/* Donation Interest filter */}
          <div>
            <select
              value={interestFilter}
              onChange={(e) => setInterestFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Interests</option>
              <option value="sperm">Sperm Donors</option>
              <option value="egg">Egg Donors</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Inquiries List */}
      <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
        <CardHeader className="py-4 px-6 border-b dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">Inquiry Telemetry</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-xs text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" /> Fetching inquiries...
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <span>No inquiries found matching criteria.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b dark:border-slate-800">
                    <th className="py-3 px-4">Name & Contact</th>
                    <th className="py-3 px-4">Donation Interest</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Contact Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registration Link</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                  {inquiries.map((inq) => (
                    <tr key={inq._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                      
                      {/* Name & Contact */}
                      <td className="py-3 px-4 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">{inq.fullName}</div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {inq.mobileNumber}</span>
                          <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" /> {inq.emailAddress}</span>
                        </div>
                      </td>

                      {/* Donation Interest */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                          inq.donationInterest === "egg"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                            : "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                        }`}>
                          {inq.donationInterest === "egg" ? "Egg Donor" : "Sperm Donor"}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {inq.city}, {inq.state}</span>
                      </td>

                      {/* Contact Time */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {inq.preferredContactTime}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 space-y-1">
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(inq.status)}`}>
                            {inq.status}
                          </span>
                        </div>
                        {inq.statusHistory && inq.statusHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryInquiry(inq);
                              setIsHistoryOpen(true);
                            }}
                            className="text-[9px] text-slate-500 hover:text-teal-650 block text-left font-semibold cursor-pointer"
                            title="Click to view history chain"
                          >
                            Changed by: <span className="font-bold">{inq.statusHistory[inq.statusHistory.length - 1].updatedBy || "System"}</span>
                          </button>
                        )}
                      </td>

                      {/* Registration ID Link */}
                      <td className="py-3 px-4">
                        {inq.registrationId ? (
                          <Link href={`/donor/register?id=${inq.registrationId}`} className="text-teal-600 hover:text-teal-500 font-mono font-bold flex items-center gap-0.5">
                            {inq.registrationId} <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Unconverted</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
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
                                  setSelectedInquiry(inq);
                                  setIsDetailOpen(true);
                                }}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2"
                              >
                                <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedInquiry(inq);
                                  setNewStatus(inq.status);
                                  setAdminNotes(inq.adminNotes || "");
                                  setIsStatusModalOpen(true);
                                }}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2"
                              >
                                <Clock className="w-4 h-4 text-blue-600" />
                                Manage Status
                              </DropdownMenuItem>
                              {!inq.registrationId && inq.status !== "Rejected" && (
                                <DropdownMenuItem
                                  disabled={actionLoading}
                                  onClick={() => handleConvert(inq)}
                                  className="cursor-pointer gap-2 text-xs font-semibold py-2 text-emerald-600 focus:text-emerald-700"
                                >
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  Convert to Registration
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(inq._id)}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" />
                                Delete Inquiry
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
          {!loading && inquiries.length > 0 && (
            <CustomPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          )}
        </CardContent>
      </Card>

      {/* Inquiry Detail Sheet Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Inquiry Detailed Summary</DialogTitle>
            <DialogDescription className="text-xs">Comprehensive log details for the selected donor candidate.</DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b pb-4 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Full Name</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedInquiry.fullName}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Interest Choice</span>
                  <div className="font-bold capitalize text-slate-800 dark:text-slate-200">{selectedInquiry.donationInterest} Donor</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Age / DOB</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedInquiry.dateOfBirth} ({selectedInquiry.age || "N/A"} yrs)</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Gender</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{selectedInquiry.gender}</div>
                </div>
              </div>

              {/* Physical Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b pb-4 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Height</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedInquiry.height ? `${selectedInquiry.height} cm` : "N/A"}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Weight</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedInquiry.weight ? `${selectedInquiry.weight} kg` : "N/A"}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Hair Color</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedInquiry.hairColor || "N/A"}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Eye Color</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedInquiry.eyeColor || "N/A"}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Skin Tone</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedInquiry.skinTone || "N/A"}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Contact & Preferred Time</span>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                  <div>Mobile: <strong>{selectedInquiry.mobileNumber}</strong></div>
                  <div>Email: <strong>{selectedInquiry.emailAddress}</strong></div>
                  <div>Preferred Contact Time: <strong>{selectedInquiry.preferredContactTime}</strong></div>
                </div>
              </div>

              {selectedInquiry.message && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Candidate Message</span>
                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 italic text-slate-600 dark:text-slate-400">
                    &quot;{selectedInquiry.message}&quot;
                  </div>
                </div>
              )}

              {selectedInquiry.adminNotes && (
                <div className="space-y-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-2.5 rounded text-amber-800 dark:text-amber-350">
                  <span className="font-bold uppercase tracking-wider text-[9px]">Admin Notes:</span>
                  <div>{selectedInquiry.adminNotes}</div>
                </div>
              )}

              <div className="space-y-1 border-t dark:border-slate-800 pt-3">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-1 block">Workflow Status History Logs</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pl-1 border-l-2 border-slate-200 dark:border-slate-800">
                  {selectedInquiry.statusHistory?.map((hist: any, index: number) => (
                    <div key={index} className="text-[10px] pl-3 relative">
                      <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <div className="font-bold text-slate-700 dark:text-slate-300">{hist.status}</div>
                      <div className="text-[9px] text-slate-400">{new Date(hist.updatedAt).toLocaleString()} {hist.updatedBy ? `by ${hist.updatedBy}` : ""}</div>
                      {hist.notes && <div className="text-slate-500 italic mt-0.5">{hist.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Modal Dialog */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-md rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">Track Workflow & Status Action</DialogTitle>
            <DialogDescription className="text-xs">Adjust the workflow progression and write logs for counseling/consultation audit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-xs mt-2">
            
            {/* Status selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Workflow Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Consultation DateTime picker (Visible if Consultation Scheduled) */}
            {newStatus === "Consultation Scheduled" && (
              <div className="space-y-1 animate-in fade-in duration-200">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scheduled Date & Time <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={consultationTime}
                    onChange={(e) => setConsultationTime(e.target.value)}
                    className="w-full h-9 pl-10 pr-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Admin Notes / Discussion Details</label>
              <textarea
                placeholder="Log discussion points, candidate fitness, or reason for status update..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full min-h-[90px] p-2.5 border rounded-[10px] bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
              />
            </div>

            {/* Status History Logs (Chain of changes) */}
            {selectedInquiry && selectedInquiry.statusHistory && selectedInquiry.statusHistory.length > 0 && (
              <div className="space-y-1.5 border-t dark:border-slate-800 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Workflow Status History Chain</span>
                <div className="space-y-3 max-h-36 overflow-y-auto pl-1 border-l-2 border-slate-200 dark:border-slate-800">
                  {selectedInquiry.statusHistory.map((hist: any, index: number) => (
                    <div key={index} className="text-[10px] pl-3 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500" />
                      <div className="font-bold text-slate-800 dark:text-slate-200">{hist.status}</div>
                      <div className="text-[9px] text-slate-500">
                        {new Date(hist.updatedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })} by <span className="font-semibold text-slate-700 dark:text-slate-350">{hist.updatedBy || "System"}</span>
                      </div>
                      {hist.notes && <div className="text-slate-500 italic mt-0.5 leading-relaxed">{hist.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 border-t dark:border-slate-800 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="rounded-[10px] text-xs h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                className="rounded-[10px] text-xs h-9 px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/10"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Updates"}
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Read-Only Status History Chain Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 p-6 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-teal-650" />
              Inquiry Status History Chain
            </DialogTitle>
            <DialogDescription className="text-xs">
              Audit log chain of status changes and employee updates for &quot;{historyInquiry?.fullName}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3 text-xs">
            {historyInquiry?.statusHistory && historyInquiry.statusHistory.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pl-1 border-l-2 border-slate-200 dark:border-slate-800">
                {historyInquiry.statusHistory.map((hist: any, index: number) => (
                  <div key={index} className="text-xs pl-4 relative">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500" />
                    <div className="font-bold text-slate-850 dark:text-slate-200">{hist.status}</div>
                    {hist.notes && (
                      <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-0.5 leading-relaxed italic">
                        &quot;{hist.notes}&quot;
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Changed by: <strong>{hist.updatedBy || "System"}</strong></span>
                      <span>{new Date(hist.updatedAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 italic">
                No workflow status history records found.
              </div>
            )}

            <div className="flex justify-end pt-2 border-t dark:border-slate-850">
              <Button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-xl text-xs h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350 cursor-pointer border dark:border-slate-800"
              >
                Close History
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
