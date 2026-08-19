"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  ClipboardList, 
  MapPin, 
  User, 
  Calendar,
  PhoneCall,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { useSearchParams } from "next/navigation";

export default function AdminAppointmentsPage() {
  const searchParams = useSearchParams();
  const appointmentIdParam = searchParams.get("appointmentId");
  const [bookings, setBookings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Details Modal
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const exportToExcel = () => {
    if (filtered.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    const headers = [
      "Reference ID",
      "Patient Name",
      "Email",
      "Phone",
      "Age",
      "Country",
      "City",
      "Fertility Concern",
      "Previous Treatments",
      "Preferred Treatment / Consultation Type",
      "Preferred Date",
      "Preferred Time",
      "Status",
      "Admin Notes",
      "Created At"
    ];

    const rows = filtered.map(b => [
      b.referenceId || "",
      b.personalDetails?.fullName || "",
      b.personalDetails?.email || "",
      b.personalDetails?.phone || "",
      b.personalDetails?.age || "",
      b.personalDetails?.country || "",
      b.personalDetails?.city || "",
      b.medicalInfo?.fertilityConcern || "",
      b.medicalInfo?.previousTreatments || "",
      b.medicalInfo?.preferredTreatment || b.appointmentDetails?.consultationType || "",
      b.appointmentDetails?.preferredDate ? new Date(b.appointmentDetails.preferredDate).toLocaleDateString() : "",
      b.appointmentDetails?.preferredTime || "",
      b.status || "",
      b.adminNotes || "",
      b.createdAt ? new Date(b.createdAt).toLocaleString() : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Successfully exported bookings data to CSV/Excel format!");
  };

  async function loadBookings() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?page=${currentPage}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.consultations || []);
        setFiltered(data.consultations || []);
        if (data.pagination) setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      toast.error("Error fetching bookings pipeline.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [currentPage]);

  useEffect(() => {
    if (appointmentIdParam) {
      const fetchSingleBooking = async () => {
        try {
          const res = await fetch(`/api/bookings?referenceId=${appointmentIdParam}`);
          const data = await res.json();
          if (data.success && data.consultation) {
            setSelectedBooking(data.consultation);
            setAdminNotes(data.consultation.adminNotes || "");
          }
        } catch (err) {
          console.error("Failed to load booking from query parameter:", err);
        }
      };
      fetchSingleBooking();
    }
  }, [appointmentIdParam]);

  // Filter and search
  useEffect(() => {
    let result = bookings || [];
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(b => 
        (b.referenceId || "").toLowerCase().includes(s) ||
        (b.personalDetails?.fullName || "").toLowerCase().includes(s) ||
        (b.personalDetails?.email || "").toLowerCase().includes(s) ||
        (b.medicalInfo?.preferredTreatment || "").toLowerCase().includes(s)
      );
    }
    if (statusFilter) {
      result = result.filter(b => b.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, bookings]);

  const handleOpenDetails = (booking: any) => {
    setSelectedBooking(booking);
    setAdminNotes(booking.adminNotes || "");
  };

  const handleUpdateStatusAndNotes = async (status: string) => {
    if (!selectedBooking) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking._id,
          status,
          adminNotes
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Booking status updated to ${status}!`);
        setSelectedBooking(null);
        loadBookings();
      } else {
        toast.error(data.error || "Failed to update booking.");
      }
    } catch (err) {
      toast.error("Network error while updating booking.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "CONTACTED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "SCHEDULED":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "CANCELLED":
        return "bg-slate-200 text-slate-700 border-slate-350";
      default:
        return "bg-slate-50 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-500" /> Bookings Pipeline
          </h1>
          <p className="text-xs text-slate-500">Manage patient service bookings, update clinic appointment statuses, and log consultation notes.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40">
            <Download className="w-3.5 h-3.5" /> Export Excel
          </Button>
          <Button onClick={loadBookings} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Pipeline
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Search by Reference ID, patient name, email, or service..." 
            className="pl-9 text-xs h-9 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div className="text-right flex items-center justify-end text-xs font-semibold text-slate-500">
          {(filtered || []).length} matches found
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs">Loading live bookings...</div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No booking records match the filters.</div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                <tr>
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Service Booked</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-900">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-blue-600 tracking-wider">{b.referenceId}</td>
                    <td className="p-3 font-semibold">
                      <div>{b.personalDetails?.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{b.personalDetails?.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{b.medicalInfo?.preferredTreatment || "Clinical Consultation"}</span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {b.appointmentDetails?.preferredDate ? new Date(b.appointmentDetails.preferredDate).toLocaleDateString() : "N/A"} at {b.appointmentDetails?.preferredTime || "N/A"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleOpenDetails(b)}
                        className="h-7 text-[11px] rounded-lg border-slate-200 gap-1.5"
                      >
                        <Edit className="w-3 h-3" /> Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="p-4 border-t dark:border-slate-800">
            <CustomPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </Card>

      {/* DETAILS & STATUS MODAL */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="rounded-2xl max-w-lg bg-white dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" /> Manage Booking: {selectedBooking?.referenceId}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-slate-500">Inspect patient files and update workflow timeline.</DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 text-xs pt-2">
              
              {/* Customer info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <User className="w-4 h-4 text-slate-400" /> Customer Information
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500">Name:</span> {selectedBooking.personalDetails?.fullName}</div>
                  <div><span className="text-slate-500">Phone:</span> {selectedBooking.personalDetails?.phone}</div>
                  <div className="col-span-2"><span className="text-slate-500">Email:</span> {selectedBooking.personalDetails?.email}</div>
                  <div className="col-span-2 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> 
                    <span>{selectedBooking.personalDetails?.city || "N/A"}{selectedBooking.personalDetails?.country ? `, ${selectedBooking.personalDetails.country}` : ""}</span>
                  </div>
                </div>
              </div>

              {/* Service info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400" /> Service Reservation
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="col-span-2"><span className="text-slate-500">Service:</span> {selectedBooking.medicalInfo?.preferredTreatment || "Clinical Consultation"}</div>
                  <div><span className="text-slate-500">Date:</span> {selectedBooking.appointmentDetails?.preferredDate ? new Date(selectedBooking.appointmentDetails.preferredDate).toLocaleDateString() : "N/A"}</div>
                  <div><span className="text-slate-500">Time Slot:</span> {selectedBooking.appointmentDetails?.preferredTime || "N/A"}</div>
                  {selectedBooking.medicalInfo?.fertilityConcern && <div className="col-span-2"><span className="text-slate-500">Fertility Concern:</span> {selectedBooking.medicalInfo.fertilityConcern}</div>}
                  {selectedBooking.medicalInfo?.previousTreatments && <div className="col-span-2"><span className="text-slate-500">Previous Treatments:</span> {selectedBooking.medicalInfo.previousTreatments}</div>}
                  {selectedBooking.medicalInfo?.additionalNotes && <div className="col-span-2"><span className="text-slate-500">Additional Notes:</span> {selectedBooking.medicalInfo.additionalNotes}</div>}
                </div>
              </div>

              {/* Status and Notes updates */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Administrative Progress Notes</label>
                <textarea 
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Add notes about clinical schedules, technician handovers, etc..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t justify-end">
                <Button 
                  onClick={() => handleUpdateStatusAndNotes("NEW")} 
                  variant="outline" 
                  className="rounded-xl text-[10px] h-9 border-amber-200 text-amber-700 hover:bg-amber-50"
                  disabled={updating}
                >
                  Set New / Pending
                </Button>
                <Button 
                  onClick={() => handleUpdateStatusAndNotes("CONTACTED")} 
                  variant="outline" 
                  className="rounded-xl text-[10px] h-9 border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={updating}
                >
                  <PhoneCall className="w-3 h-3 mr-1" /> Contacted
                </Button>
                <Button 
                  onClick={() => handleUpdateStatusAndNotes("SCHEDULED")} 
                  variant="outline" 
                  className="rounded-xl text-[10px] h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  disabled={updating}
                >
                  Schedule Appointment
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
                  className="rounded-xl text-[10px] h-9 border-red-200 text-red-750 hover:bg-red-50"
                  disabled={updating}
                >
                  Cancel Request
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
