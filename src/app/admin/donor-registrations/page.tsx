"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Edit3, 
  Check, 
  X, 
  Eye, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  User, 
  Activity, 
  Trash2,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  Dna,
  Egg,
  ExternalLink,
  Ban
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { FileUploadField } from "@/features/file-upload/components/FileUploadField";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  getAdminRegistrationsAction,
  updateAdminRegistrationStatusAction,
} from "@/features/donor-registration/actions/donor-registration.actions";

const DOCUMENTS_CONFIG = [
  { key: "passportPhoto", label: "Photo", accept: ".png,.jpg,.jpeg,.webp", folder: "profile-images" },
  { key: "aadhaarFront", label: "Aadhaar Card (Front)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "aadhaarBack", label: "Aadhaar Card (Back)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "signature", label: "Signature", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "otherDocument", label: "Other Document", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
];

export default function AdminDonorRegistrationsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Detail view
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Edit fields modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editTab, setEditTab] = useState<"details" | "documents" | "labReports">("details");

  const exportToExcel = () => {
    if (registrations.length === 0) {
      toast.error("No registrations data available to export.");
      return;
    }

    const headers = [
      "Registration ID",
      "Donor Type",
      "Full Name",
      "Father's Name",
      "Mother's Name",
      "Gender",
      "Date of Birth",
      "Marital Status",
      "Blood Group",
      "Education",
      "Occupation",
      "Height",
      "Weight",
      "Aadhaar Number",
      "PAN Number",
      "Mobile Number",
      "Email Address",
      "Current Address",
      "Permanent Address",
      "City",
      "State",
      "Pincode",
      "Status",
      "Admin Notes",
      "Created At"
    ];

    const rows = registrations.map(reg => [
      reg.registrationId || "",
      reg.donorType || "",
      reg.personalInfo?.fullName || "",
      reg.personalInfo?.fatherName || "",
      reg.personalInfo?.motherName || "",
      reg.personalInfo?.gender || "",
      reg.personalInfo?.dateOfBirth || "",
      reg.personalInfo?.maritalStatus || "",
      reg.personalInfo?.bloodGroup || "",
      reg.personalInfo?.education || "",
      reg.personalInfo?.occupation || "",
      reg.personalInfo?.height || "",
      reg.personalInfo?.weight || "",
      reg.personalInfo?.aadhaarNumber || "",
      reg.personalInfo?.panNumber || "",
      reg.contactInfo?.mobileNumber || "",
      reg.contactInfo?.emailAddress || "",
      reg.contactInfo?.currentAddress || "",
      reg.contactInfo?.permanentAddress || "",
      reg.contactInfo?.city || "",
      reg.contactInfo?.state || "",
      reg.contactInfo?.pincode || "",
      reg.status || "",
      reg.adminNotes || "",
      reg.createdAt ? new Date(reg.createdAt).toLocaleString() : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `donor_registrations_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Successfully exported donor registrations to CSV/Excel format!");
  };

  async function loadRegistrations() {
    setLoading(true);
    try {
      const data = (await getAdminRegistrationsAction({
        page: currentPage,
        limit: 10,
        search,
        donorType: typeFilter || undefined,
        status: statusFilter || undefined,
        bloodGroup: bloodGroupFilter || undefined,
      })) as any;
      if (data.success && data.registrations) {
        setRegistrations(data.registrations);
        if (data.pagination) setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.error || "Failed to load registrations.");
      }
    } catch (error) {
      toast.error("Failed to fetch registrations from server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, [search, typeFilter, statusFilter, bloodGroupFilter, currentPage]);

  const handleUpdateStatus = async (regId: string, status: string) => {
    setActionLoading(true);
    try {
      const data = await updateAdminRegistrationStatusAction({
        registrationId: regId,
        status,
        adminNotes,
      });
      if (data.success) {
        toast.success(`Application updated to ${status}`);
        setIsDetailOpen(false);
        setAdminNotes("");
        loadRegistrations();
      } else {
        toast.error(data.error || "Update failed.");
      }
    } catch (error) {
      toast.error("Network error during status update.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReg = async (regId: string) => {
    if (!confirm("Are you sure you want to permanently delete this registration?")) return;
    try {
      const res = await fetch(`/api/donor-registration/${regId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Registration draft/profile deleted.");
        loadRegistrations();
      } else {
        toast.error(data.error || "Deletion failed.");
      }
    } catch (err) {
      toast.error("Failed to delete registration.");
    }
  };

  const handleOpenEdit = (reg: any) => {
    setEditTab("details");
    setEditForm({
      registrationId: reg.registrationId,
      fullName: reg.personalInfo?.fullName || "",
      fatherName: reg.personalInfo?.fatherName || "",
      motherName: reg.personalInfo?.motherName || "",
      email: reg.contactInfo?.emailAddress || "",
      phone: reg.contactInfo?.mobileNumber || "",
      bloodGroup: reg.personalInfo?.bloodGroup || "O+",
      maritalStatus: reg.personalInfo?.maritalStatus || "Single",
      education: reg.personalInfo?.education || "",
      occupation: reg.personalInfo?.occupation || "",
      currentAddress: reg.contactInfo?.currentAddress || "",
      permanentAddress: reg.contactInfo?.permanentAddress || "",
      city: reg.contactInfo?.city || "",
      state: reg.contactInfo?.state || "",
      pincode: reg.contactInfo?.pincode || "",
      documents: reg.documents || {},
      labReports: reg.labReports || {},
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/donor-registration/${editForm.registrationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo: {
            fullName: editForm.fullName,
            fatherName: editForm.fatherName,
            motherName: editForm.motherName,
            bloodGroup: editForm.bloodGroup,
            maritalStatus: editForm.maritalStatus,
            education: editForm.education,
            occupation: editForm.occupation,
          },
          contactInfo: {
            emailAddress: editForm.email,
            mobileNumber: editForm.phone,
            currentAddress: editForm.currentAddress,
            permanentAddress: editForm.permanentAddress,
            city: editForm.city,
            state: editForm.state,
            pincode: editForm.pincode,
          },
          documents: editForm.documents,
          labReports: editForm.labReports,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Donor details saved successfully.");
        setIsEditOpen(false);
        loadRegistrations();
      } else {
        toast.error(data.error || "Failed to save details.");
      }
    } catch (error) {
      toast.error("Network error saving donor details.");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadAllDocuments = (reg: any) => {
    const urls: string[] = [];
    if (reg.documents) {
      Object.entries(reg.documents).forEach(([_, val]: [string, any]) => {
        if (val?.url) urls.push(val.url);
      });
    }
    if (reg.labReports) {
      Object.entries(reg.labReports).forEach(([_, val]: [string, any]) => {
        if (val?.url) urls.push(val.url);
      });
    }

    if (urls.length === 0) {
      toast.error("No uploaded documents found to download.");
      return;
    }

    // Open each document in a new tab for easy viewing/downloading
    urls.forEach((url) => {
      window.open(url, "_blank");
    });
    toast.success(`Opening ${urls.length} document links for download.`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" /> IVF / ART Donor Registrations
          </h1>
          <p className="text-xs text-slate-500">
            Administrative workflow console for screening sperm & egg donor registration files.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40">
            <Download className="w-3.5 h-3.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, name, email, Aadhaar, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none"
            >
              <option value="">Donor Type (All)</option>
              <option value="sperm">Sperm Donor</option>
              <option value="egg">Egg Donor</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none"
            >
              <option value="">Status (All)</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            Fetching donor files...
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No matching registration entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Registration ID</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Blood</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Submitted Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">{reg.registrationId}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {reg.personalInfo?.fullName || "Awaiting Details"}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        reg.donorType === "egg" 
                          ? "bg-rose-50 text-rose-600 border border-rose-100" 
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}>
                        {reg.donorType}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-red-500">{reg.personalInfo?.bloodGroup || "—"}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{reg.contactInfo?.mobileNumber || "—"}</div>
                        <div className="text-[10px] text-slate-400">{reg.contactInfo?.emailAddress || "—"}</div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-500">{new Date(reg.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        reg.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        reg.status === "SUBMITTED" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                        reg.status === "UNDER_REVIEW" ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" :
                        reg.status === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" :
                        reg.status === "SUSPENDED" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right flex justify-end gap-1.5">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { setSelectedReg(reg); setAdminNotes(reg.adminNotes || ""); setIsDetailOpen(true); }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-blue-500"
                        title="Review Files"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleOpenEdit(reg)}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-emerald-500"
                        title="Edit Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteReg(reg.registrationId)}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-red-600"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && registrations.length > 0 && (
          <div className="p-4 border-t dark:border-slate-800">
            <CustomPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-2xl max-w-4xl bg-white dark:bg-slate-950 border dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto">
          {selectedReg && (
            <div className="space-y-6">
              
              {/* Header inside detail */}
              <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-5 justify-between">
                <div className="flex items-center gap-4">
                  {selectedReg.documents?.passportPhoto?.url ? (
                    <img loading="lazy" alt="Passport Photo" src={selectedReg.documents.passportPhoto.url} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-xs font-bold text-slate-400">No Photo</div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedReg.personalInfo?.fullName}
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">{selectedReg.personalInfo?.bloodGroup}</span>
                    </h2>
                    <p className="text-xs text-slate-500">ID: <span className="font-mono font-bold">{selectedReg.registrationId}</span> • Registered: {new Date(selectedReg.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs font-semibold mt-1">Status: <span className="text-blue-500">{selectedReg.status}</span></p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link href={`/donor/register/${selectedReg.registrationId}/print`} target="_blank">
                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1">
                      <Printer className="w-3.5 h-3.5" /> Print Files
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => downloadAllDocuments(selectedReg)} className="h-8 rounded-lg text-xs gap-1">
                    <Download className="w-3.5 h-3.5" /> Download Docs
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { handleOpenEdit(selectedReg); setIsDetailOpen(false); }} className="h-8 rounded-lg text-xs gap-1 text-emerald-600 border-emerald-250 hover:bg-emerald-50">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </Button>
                </div>
              </div>

              {/* Basic grid overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Profile Details</h3>
                  <div className="text-xs space-y-1.5">
                    <div><span className="font-semibold text-slate-500">Father / Mother:</span> {selectedReg.personalInfo?.fatherName} / {selectedReg.personalInfo?.motherName}</div>
                    <div><span className="font-semibold text-slate-500">Gender / Age:</span> {selectedReg.personalInfo?.gender} | {selectedReg.personalInfo?.age || "—"} Years</div>
                    <div><span className="font-semibold text-slate-500">Aadhaar (Masked):</span> {selectedReg.personalInfo?.aadhaarNumber ? `XXXX-XXXX-${selectedReg.personalInfo.aadhaarNumber.slice(-4)}` : "—"}</div>
                    <div><span className="font-semibold text-slate-500">Education / Job:</span> {selectedReg.personalInfo?.education} | {selectedReg.personalInfo?.occupation}</div>
                    <div><span className="font-semibold text-slate-500">Weight / Height:</span> {selectedReg.personalInfo?.weight} | {selectedReg.personalInfo?.height}</div>
                  </div>
                </div>

                {/* Contacts & Emergency details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Emergency Contact</h3>
                  <div className="text-xs space-y-1.5">
                    <div><span className="font-semibold text-slate-500">Phone / Email:</span> {selectedReg.contactInfo?.mobileNumber} | {selectedReg.contactInfo?.emailAddress}</div>
                    <div><span className="font-semibold text-slate-500">Current Address:</span> {selectedReg.contactInfo?.currentAddress}</div>
                    <div><span className="font-semibold text-slate-500">Emergency Person:</span> {selectedReg.emergencyContact?.contactPersonName} ({selectedReg.emergencyContact?.relationship})</div>
                    <div><span className="font-semibold text-slate-500">Emergency Phone:</span> {selectedReg.emergencyContact?.phoneNumber}</div>
                  </div>
                </div>
              </div>

              {/* Lab Reports & Documents Status */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Checklist</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const checklistItems = [
                      { label: "Photo", url: selectedReg.documents?.passportPhoto?.url },
                      { label: "Aadhaar Front", url: selectedReg.documents?.aadhaarFront?.url },
                      { label: "Aadhaar Back", url: selectedReg.documents?.aadhaarBack?.url },
                      { label: "Signature", url: selectedReg.documents?.signature?.url },
                      { label: "Other Document", url: selectedReg.documents?.otherDocument?.url },
                      { label: "Blood Report", url: selectedReg.labReports?.bloodReport?.url },
                    ];

                    const viralMarkers = selectedReg.labReports?.viralMarkers || [];
                    viralMarkers.forEach((file: any, i: number) => {
                      checklistItems.push({
                        label: `Viral Marker #${i + 1}`,
                        url: file.url
                      });
                    });

                    const otherReports = selectedReg.labReports?.otherReports || [];
                    otherReports.forEach((file: any, i: number) => {
                      checklistItems.push({
                        label: `Other Report #${i + 1}`,
                        url: file.url
                      });
                    });

                    return (
                      <>
                        {checklistItems.map((doc, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{doc.label}</p>
                              <p className={doc.url ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                                {doc.url ? "Uploaded ✓" : "Missing ✗"}
                              </p>
                            </div>
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Mapped Action Workflow & Admin Notes */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider">Administrative Approval Center</h3>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Admin Review Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter verification notes, check comments, embryologist annotations..."
                    rows={3}
                    className="w-full p-3 text-xs bg-white dark:bg-slate-950 border rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2 justify-end">
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedReg.registrationId, "UNDER_REVIEW")}
                    variant="outline"
                    className="h-8.5 text-xs text-purple-600 border-purple-200"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" /> Mark Under Review
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedReg.registrationId, "REJECTED")}
                    variant="outline"
                    className="h-8.5 text-xs text-red-600 border-red-200"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Reject Application
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedReg.registrationId, "SUSPENDED")}
                    variant="outline"
                    className="h-8.5 text-xs text-amber-600 border-amber-250"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" /> Suspend Account
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedReg.registrationId, "APPROVED")}
                    className="h-8.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Verify & Approve
                  </Button>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl max-w-4xl bg-white dark:bg-slate-950 border dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Donor Registration Profile</DialogTitle>
            <DialogDescription className="text-xs">Adjust registry particulars manually below.</DialogDescription>
          </DialogHeader>

          {/* Tab selectors */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold mb-4 mt-2">
            <button
              type="button"
              onClick={() => setEditTab("details")}
              className={`pb-2 px-4 border-b-2 transition-all ${editTab === "details" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              General Details
            </button>
            <button
              type="button"
              onClick={() => setEditTab("documents")}
              className={`pb-2 px-4 border-b-2 transition-all ${editTab === "documents" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              KYC Documents
            </button>
            <button
              type="button"
              onClick={() => setEditTab("labReports")}
              className={`pb-2 px-4 border-b-2 transition-all ${editTab === "labReports" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Clinical Lab Reports
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold">Full Legal Name</label>
                    <Input value={editForm.fullName || ""} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold">Mobile Number</label>
                    <Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold">Email Address</label>
                    <Input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold">Father Name</label>
                    <Input value={editForm.fatherName || ""} onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold">Mother Name</label>
                    <Input value={editForm.motherName || ""} onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold">Blood Group</label>
                    <Input value={editForm.bloodGroup || ""} onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold">Current Address</label>
                  <textarea value={editForm.currentAddress || ""} onChange={(e) => setEditForm({ ...editForm, currentAddress: e.target.value })} rows={2} className="w-full text-xs p-2.5 border rounded-xl" />
                </div>
              </div>
            )}

            {editTab === "documents" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                {DOCUMENTS_CONFIG.map(({ key, label, accept, folder }) => (
                  <FileUploadField
                    key={key}
                    label={label}
                    value={editForm.documents?.[key] || null}
                    onChange={(file) => {
                      setEditForm((prev: any) => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          [key]: file || null
                        }
                      }));
                    }}
                    accept={accept}
                    folder={folder}
                    enableCrop={true}
                    cropMode={
                      key === "signature"
                        ? "signature"
                        : key === "passportPhoto"
                          ? "photo"
                          : "document"
                    }
                  />
                ))}
              </div>
            )}

            {editTab === "labReports" && (
              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 text-left">
                {/* Viral Markers (multiple upload) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Viral Markers (PDF only)</h4>
                  <FileUploadField
                    label="Add Viral Marker PDF"
                    value={null}
                    accept=".pdf"
                    folder="documents"
                    onChange={(file) => {
                      if (file) {
                        const current = editForm.labReports?.viralMarkers || [];
                        setEditForm((prev: any) => ({
                          ...prev,
                          labReports: {
                            ...prev.labReports,
                            viralMarkers: [...current, file]
                          }
                        }));
                      }
                    }}
                  />
                  {editForm.labReports?.viralMarkers && editForm.labReports.viralMarkers.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {editForm.labReports.viralMarkers.map((report: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">{report.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(editForm.labReports.viralMarkers || [])];
                              updated.splice(idx, 1);
                              setEditForm((prev: any) => ({
                                ...prev,
                                labReports: {
                                  ...prev.labReports,
                                  viralMarkers: updated
                                }
                              }));
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blood Report (single upload) */}
                <FileUploadField
                  label="Blood Report (PDF only)"
                  value={editForm.labReports?.bloodReport || null}
                  accept=".pdf"
                  onChange={(file) => {
                    setEditForm((prev: any) => ({
                      ...prev,
                      labReports: {
                        ...prev.labReports,
                        bloodReport: file || null
                      }
                    }));
                  }}
                  folder="documents"
                />

                {/* Other Reports (multiple upload) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Other Reports (PDF only)</h4>
                  <FileUploadField
                    label="Add Other Report PDF"
                    value={null}
                    accept=".pdf"
                    folder="documents"
                    onChange={(file) => {
                      if (file) {
                        const current = editForm.labReports?.otherReports || [];
                        setEditForm((prev: any) => ({
                          ...prev,
                          labReports: {
                            ...prev.labReports,
                            otherReports: [...current, file]
                          }
                        }));
                      }
                    }}
                  />
                  {editForm.labReports?.otherReports && editForm.labReports.otherReports.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {editForm.labReports.otherReports.map((report: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">{report.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(editForm.labReports.otherReports || [])];
                              updated.splice(idx, 1);
                              setEditForm((prev: any) => ({
                                ...prev,
                                labReports: {
                                  ...prev.labReports,
                                  otherReports: updated
                                }
                              }));
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl text-xs h-9">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="rounded-xl text-xs h-9 bg-blue-600 text-white font-bold">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
