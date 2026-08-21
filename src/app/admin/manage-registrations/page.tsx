"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Printer,
  Check,
  X,
  Eye,
  Loader2,
  Calendar,
  MapPin,
  User,
  Activity,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  Dna,
  Building2,
  FileText,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ListTodo,
  FileSpreadsheet,
  Trash2,
  SlidersHorizontal,
  History,
  ShieldAlert,
  Edit3,
  Upload,
  PenLine,
  ChevronDown,
  ChevronUp,
  FileCheck2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getAdminRegistrationsAction,
  updateAdminRegistrationStatusAction,
  patchAdminRegistrationFieldsAction,
} from "@/features/donor-registration/actions/donor-registration.actions";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/features/file-upload/components/FileUploadField";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { SPERM_SECTIONS } from "@/features/pdf-generator/components/PrintableDonorRegistration";

const EGG_SECTIONS = [
  { key: "registration", label: "Registration Form" },
  { key: "contract", label: "Contract" },
  { key: "certificate", label: "Certificate (Rule 10)" },
  { key: "consent", label: "Consent Form" },
  { key: "profile", label: "Egg Profile & Report" },
  { key: "affidavit", label: "Affidavit" },
];

const COMMON_ANNEXURES = [
  { id: "stamp", label: "Official Stamp & Seal" },
  { id: "certificate", label: "Registry Certificate" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "notes", label: "Additional Clinical Notes" },
];

const DOCUMENTS_CONFIG = [
  { key: "passportPhoto", label: "Photo", accept: ".png,.jpg,.jpeg,.webp", folder: "profile-images" },
  { key: "aadhaarFront", label: "Aadhaar Card (Front)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "aadhaarBack", label: "Aadhaar Card (Back)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "signature", label: "Signature", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "otherDocument", label: "Other Document", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
];

export default function ManageRegistrationsPage() {
  const searchParams = useSearchParams();
  const registrationIdParam = searchParams.get("registrationId");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("APPROVED");
  const [dateFilter, setDateFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection state for Bulk Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal / Detail view
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "medical" | "history" | "audits">("info");
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);

  // Assign Hospital Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [tempSelectedHospitalId, setTempSelectedHospitalId] = useState<string | null>(null);

  // Edit Form Dialog State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editTab, setEditTab] = useState<"details" | "documents" | "labReports">("details");

  // Print Configuration Modal State
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printWithHeader, setPrintWithHeader] = useState(true);
  const [printAttachments, setPrintAttachments] = useState<string[]>(["stamp", "certificate"]);
  const [printSections, setPrintSections] = useState<string[]>([]); // empty = all
  const [printOverrides, setPrintOverrides] = useState<any>({});
  const [printExtraDocUrl, setPrintExtraDocUrl] = useState("");
  const [uploadingExtraDoc, setUploadingExtraDoc] = useState(false);
  const [showEditFields, setShowEditFields] = useState(false);

  // Audit history chain state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTargetName, setHistoryTargetName] = useState("");

  // Bulk Operations Modals
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkHospitalSearch, setBulkHospitalSearch] = useState("");

  // Fetch Approved Registrations
  async function loadRegistrations() {
    setLoading(true);
    try {
      const data = (await getAdminRegistrationsAction({
        page: currentPage,
        limit: 10,
        search,
        status: statusFilter || undefined,
        hospital: hospitalFilter || undefined,
      })) as any;
      if (data.success && data.registrations) {
        setRegistrations(data.registrations || []);
        if (data.pagination) setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.error || "Failed to load registrations.");
      }
    } catch (error) {
      toast.error("Failed to fetch registrations.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch Active Hospitals for Assignment dropdown
  async function loadHospitals() {
    setHospitalsLoading(true);
    try {
      const res = await fetch("/api/hospitals?status=ACTIVE");
      const data = await res.json();
      if (data.success) {
        setHospitals(data.hospitals || []);
      }
    } catch (error) {
      console.error("Failed to load hospitals list");
    } finally {
      setHospitalsLoading(false);
    }
  }

  // Fetch Audits for selected dossier
  async function loadAudits(entityId: string) {
    setAuditsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?entityId=${entityId}`);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to load audit logs");
    } finally {
      setAuditsLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, [search, hospitalFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    if (registrationIdParam) {
      const fetchSingleReg = async () => {
        try {
          const res = await fetch(`/api/donor-registration/${registrationIdParam}`);
          const data = await res.json();
          if (data.success && data.registration) {
            setSelectedReg(data.registration);
            setIsDetailOpen(true);
          }
        } catch (err) {
          console.error("Failed to load registration from query parameter:", err);
        }
      };
      fetchSingleReg();
    }
  }, [registrationIdParam]);

  useEffect(() => {
    if (selectedReg && detailTab === "audits") {
      loadAudits(selectedReg._id);
    }
  }, [selectedReg, detailTab]);

  // Update Hospital Assignment
  const handleAssignHospital = async (hospitalId: string | null) => {
    if (!selectedReg) return;

    setActionLoading(true);
    try {
      const data = await updateAdminRegistrationStatusAction({
        registrationId: selectedReg.registrationId,
        assignedHospitalId: hospitalId,
      });
      if (data.success) {
        toast.success(hospitalId ? "Hospital mapped successfully!" : "Hospital mapping cleared.");
        setIsAssignOpen(false);
        setSelectedReg(null);
        loadRegistrations();
      } else {
        toast.error(data.error || "Failed to update hospital assignment.");
      }
    } catch (error) {
      toast.error("Network error during assignment update.");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Assignment
  const handleBulkAssign = async (hospitalId: string) => {
    if (selectedIds.length === 0) return;

    setActionLoading(true);
    let successCount = 0;
    try {
      for (const regId of selectedIds) {
        const reg = registrations.find(r => r.registrationId === regId);
        if (!reg) continue;

        const data = await updateAdminRegistrationStatusAction({
          registrationId: reg.registrationId,
          assignedHospitalId: hospitalId,
        });
        if (data.success) {
          successCount++;
        }
      }
      
      toast.success(`Bulk assignment complete! Mapped ${successCount} registrations.`);
      setIsBulkAssignOpen(false);
      setSelectedIds([]);
      loadRegistrations();
    } catch (error) {
      toast.error("Network error during bulk assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to change the status of ${selectedIds.length} selected applications to ${newStatus}?`)) return;

    setActionLoading(true);
    let successCount = 0;
    try {
      for (const regId of selectedIds) {
        const reg = registrations.find(r => r.registrationId === regId);
        if (!reg) continue;

        const data = await updateAdminRegistrationStatusAction({
          registrationId: reg.registrationId,
          status: newStatus
        });
        if (data.success) {
          successCount++;
        }
      }
      toast.success(`Status updated for ${successCount} registrations.`);
      setSelectedIds([]);
      loadRegistrations();
    } catch (error) {
      toast.error("Failed to update status bulk.");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk print selected
  const handleBulkPrint = async () => {
    if (selectedIds.length === 0) return;
    toast.info(`Opening printable PDF tabs for ${selectedIds.length} registries...`);
    
    // Log prints to audit trail
    for (const regId of selectedIds) {
      const reg = registrations.find(r => r.registrationId === regId);
      if (!reg) continue;

      // Log print
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PDF Printed",
          entityType: "DonorRegistration",
          entityId: reg._id,
          details: `Bulk PDF dossier printed (Branded header: true)`
        })
      });

      window.open(`/admin/manage-registrations/${regId}/print?withHeader=true&attachments=stamp,certificate`, "_blank");
    }
    setSelectedIds([]);
  };

  // Export Selected rows as CSV
  const exportSelectedCsv = () => {
    const activeList = selectedIds.length > 0
      ? registrations.filter(r => selectedIds.includes(r.registrationId))
      : registrations;

    if (activeList.length === 0) {
      toast.error("No data matching selection to export.");
      return;
    }

    const headers = [
      "Registration ID", "Donor Type", "Full Name", "Age", "Gender", "Blood Group", "Contact Number", "Email", "Assigned Hospital", "Date Approved"
    ];
    const rows = activeList.map((reg: any) => [
      reg.registrationId,
      reg.donorType,
      reg.personalInfo?.fullName || "",
      reg.personalInfo?.age || "",
      reg.personalInfo?.gender || "",
      reg.personalInfo?.bloodGroup || "",
      reg.contactInfo?.mobileNumber || "",
      reg.contactInfo?.emailAddress || "",
      reg.assignedHospital ? reg.assignedHospital.name : "Unassigned",
      new Date(reg.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any[]) => r.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registrations_export_${selectedIds.length > 0 ? "selected" : "filtered"}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();

    // Log export audit
    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Export Downloaded",
        entityType: "DonorRegistration",
        entityId: "Bulk",
        details: `Exported CSV table data (Rows count: ${activeList.length})`
      })
    });

    toast.success("Registrations CSV downloaded.");
    setSelectedIds([]);
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

  // Checkboxes change handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedRegs.map(r => r.registrationId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (checked: boolean, regId: string) => {
    if (checked) {
      setSelectedIds([...selectedIds, regId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== regId));
    }
  };

  // Toggle Print Sections
  const handleToggleSection = (sectionKey: string) => {
    if (printSections.includes(sectionKey)) {
      setPrintSections(printSections.filter(s => s !== sectionKey));
    } else {
      setPrintSections([...printSections, sectionKey]);
    }
  };

  // Toggle Print Attachments
  const handleToggleAttachment = (attachment: string) => {
    if (printAttachments.includes(attachment)) {
      setPrintAttachments(printAttachments.filter(a => a !== attachment));
    } else {
      setPrintAttachments([...printAttachments, attachment]);
    }
  };

  // Upload extra document
  const handleUploadExtraDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingExtraDoc(true);
    try {
      // Convert file to base64 to bypass Next.js FormData boundary bug
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileData: base64Data,
          folder: "extra-docs"
        }),
      });
      const data = await res.json();
      if (data.url) {
        setPrintExtraDocUrl(data.url);
        // If this is a permanent save: also update registration docs
        if (selectedReg?._id) {
          await patchAdminRegistrationFieldsAction(selectedReg.registrationId, {
            "documents.extraAttachment": { name: file.name, url: data.url, uploadedAt: new Date().toISOString() }
          });
        }
        toast.success("Document uploaded and saved to registration.");
      } else {
        toast.error("Upload failed.");
      }
    } catch {
      toast.error("Upload error.");
    } finally {
      setUploadingExtraDoc(false);
    }
  };

  // Trigger Print tab
  const handlePrintSubmit = async () => {
    if (!selectedReg) return;
    const attachmentsQuery = printAttachments.length > 0 ? `&attachments=${printAttachments.join(",")}` : "";
    const sectionsQuery = printSections.length > 0 ? `&sections=${printSections.join(",")}` : "";
    const extraDocQuery = printExtraDocUrl ? `&extraDocUrl=${encodeURIComponent(printExtraDocUrl)}` : "";
    const overridesQuery = Object.keys(printOverrides).length > 0 ? `&overrides=${encodeURIComponent(JSON.stringify(printOverrides))}` : "";

    // Save overrides to DB if any
    if (Object.keys(printOverrides).length > 0 && selectedReg?._id) {
      try {
        const flatOverrides: any = {};
        if (printOverrides.personalInfo) {
          Object.entries(printOverrides.personalInfo).forEach(([k, v]) => { flatOverrides[`personalInfo.${k}`] = v; });
        }
        if (printOverrides.contactInfo) {
          Object.entries(printOverrides.contactInfo).forEach(([k, v]) => { flatOverrides[`contactInfo.${k}`] = v; });
        }
        if (Object.keys(flatOverrides).length > 0) {
          await patchAdminRegistrationFieldsAction(selectedReg.registrationId, flatOverrides);
          toast.success("Registration fields updated.");
          loadRegistrations();
        }
      } catch { /* ignore */ }
    }

    // Write audit log entry
    await fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "PDF Printed",
        entityType: "DonorRegistration",
        entityId: selectedReg._id,
        details: `PDF dossier printed (Header: ${printWithHeader}, Sections: ${printSections.join(",") || "all"}, Annexures: ${printAttachments.join(",")})`
      })
    });

    window.open(`/admin/manage-registrations/${selectedReg.registrationId}/print?withHeader=${printWithHeader}${attachmentsQuery}${sectionsQuery}${extraDocQuery}${overridesQuery}`, "_blank");
    setIsPrintOpen(false);
  };

  // Pagination Logic (handled on server now)
  const paginatedRegs = registrations;  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, hospitalFilter, dateFilter, statusFilter]);

  // Filtered hospitals lists
  const filteredHospitals = hospitals.filter(h =>
    h.status === "ACTIVE" &&
    (h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
     h.address.toLowerCase().includes(hospitalSearch.toLowerCase()))
  );

  const bulkFilteredHospitals = hospitals.filter(h =>
    h.status === "ACTIVE" &&
    (h.name.toLowerCase().includes(bulkHospitalSearch.toLowerCase()) ||
     h.address.toLowerCase().includes(bulkHospitalSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 text-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-teal-600" /> Manage Registrations
          </h1>
          <p className="text-xs text-slate-500">
            Map approved donor applications, analyze assignment histories, issues prints, and track audit logs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadRegistrations} 
            variant="outline" 
            className="rounded-xl text-xs gap-1 border-slate-200"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name, Registration ID, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Hospital Filter */}
          <div>
            <select
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">All Affiliated Hospitals</option>
              {hospitals.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="APPROVED">Status: Approved Only</option>
              <option value="SUSPENDED">Status: Suspended Only</option>
              <option value="">Status: All Approved Pipeline</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Sorting options */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100 dark:border-slate-900">
          <span className="font-semibold text-slate-500">Sort by:</span>
          <button 
            onClick={() => { setSortField("createdAt"); setSortOrder(sortOrder === "desc" ? "asc" : "desc"); }}
            className={`px-3 py-1 rounded-lg ${sortField === "createdAt" ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-bold" : "text-slate-600"}`}
          >
            Approved Date {sortField === "createdAt" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button 
            onClick={() => { setSortField("fullName"); setSortOrder(sortOrder === "desc" ? "asc" : "desc"); }}
            className={`px-3 py-1 rounded-lg ${sortField === "fullName" ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-bold" : "text-slate-600"}`}
          >
            Patient Name {sortField === "fullName" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
        </div>
      </Card>

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 px-4 py-3 rounded-2xl animate-fade-in">
          <div className="font-semibold text-teal-800 dark:text-teal-400">
            Selected <span className="font-bold">{selectedIds.length}</span> registries
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsBulkAssignOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1 py-1 px-3 h-8"
            >
              <Building2 className="w-3.5 h-3.5" /> Assign Hospital
            </Button>
            <Button
              onClick={handleBulkPrint}
              variant="outline"
              className="rounded-xl text-xs gap-1 py-1 px-3 h-8 border-teal-200 text-teal-700 hover:bg-teal-100"
            >
              <Printer className="w-3.5 h-3.5" /> Print PDFs
            </Button>
            <Button
              onClick={exportSelectedCsv}
              variant="outline"
              className="rounded-xl text-xs gap-1 py-1 px-3 h-8 border-teal-200 text-teal-700 hover:bg-teal-100"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Selected
            </Button>
            <Button
              onClick={() => handleBulkStatusChange("SUSPENDED")}
              variant="outline"
              className="rounded-xl text-xs gap-1 py-1 px-3 h-8 border-red-200 text-red-700 hover:bg-red-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Suspend
            </Button>
            <Button
              onClick={() => setSelectedIds([])}
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-slate-500"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            Loading records...
          </div>
        ) : paginatedRegs.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No approved dossiers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedRegs.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  </th>
                  <th className="p-3.5">Registration ID</th>
                  <th className="p-3.5">Patient Name</th>
                  <th className="p-3.5">Age/Gender</th>
                  <th className="p-3.5">Blood</th>
                  <th className="p-3.5">Assigned Hospital</th>
                  <th className="p-3.5">Approved By</th>
                  <th className="p-3.5">Date Approved</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {paginatedRegs.map((reg) => (
                  <tr key={reg._id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/50 ${selectedIds.includes(reg.registrationId) ? "bg-teal-50/20" : ""}`}>
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(reg.registrationId)}
                        onChange={(e) => handleSelectRow(e.target.checked, reg.registrationId)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">{reg.registrationId}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {reg.personalInfo?.fullName}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {reg.personalInfo?.age} Yrs / <span className="capitalize">{reg.personalInfo?.gender}</span>
                    </td>
                    <td className="p-3.5 font-bold text-red-500">{reg.personalInfo?.bloodGroup || "—"}</td>
                    <td className="p-3.5">
                      {reg.assignedHospital ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded-md inline-block">
                            {reg.assignedHospital.name}
                          </span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedReg(reg); setTempSelectedHospitalId(null); setIsAssignOpen(true); }}
                          className="h-6 text-[10px] text-teal-600 border-teal-200 hover:bg-teal-50 rounded-lg py-0.5 px-2"
                        >
                          + Assign Hospital
                        </Button>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">{reg.reviewedBy?.split("@")[0] || "—"}</td>
                    <td className="p-3.5 text-slate-500">{new Date(reg.reviewedAt || reg.updatedAt).toLocaleDateString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        reg.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}>
                        {reg.status}
                      </span>
                      {reg.updatedBy && (
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryTargetName(reg.personalInfo?.fullName || reg.registrationId);
                            loadAudits(reg._id);
                            setIsHistoryOpen(true);
                          }}
                          className="text-[9px] text-slate-500 hover:text-teal-650 block text-left font-semibold cursor-pointer mt-1"
                          title="Click to view history chain"
                        >
                          Changed by: <span className="font-bold">{reg.updatedBy}</span>
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 text-right flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelectedReg(reg); setTempSelectedHospitalId(reg.assignedHospital?._id || null); setIsAssignOpen(true); }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-900"
                        title="Map Affiliated Clinic"
                      >
                        <Building2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelectedReg(reg); setDetailTab("info"); setIsDetailOpen(true); }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                        title="Detailed Dossier View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(reg)}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                        title="Edit Details & Documents"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { 
                          setSelectedReg(reg); 
                          setPrintSections([]); 
                          setPrintOverrides({}); 
                          setPrintExtraDocUrl(""); 
                          setShowEditFields(false);
                          setIsPrintOpen(true); 
                        }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                        title="Print / Generate PDF Docs"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer controls */}
        {!loading && registrations.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-900">
            <CustomPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </Card>

      {/* DIALOG 1: MAP HOSPITAL */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Building2 className="w-5 h-5 text-teal-600" /> Map Partner Clinic
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign registration: <span className="font-mono font-bold">{selectedReg?.registrationId}</span> to an active hospital.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Show Current Hospital */}
            {selectedReg?.assignedHospital && (
              <div className="p-3.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900 rounded-xl space-y-1">
                <div className="text-[10px] text-teal-700 font-bold uppercase">Currently Assigned to:</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedReg.assignedHospital.name}</div>
                <div className="text-xs text-slate-500">{selectedReg.assignedHospital.address}</div>
                <Button
                  onClick={() => handleAssignHospital(null)}
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 bg-white text-red-600 hover:text-red-700 text-[10px] rounded-lg border-slate-200 hover:bg-red-50"
                  disabled={actionLoading}
                >
                  Unassign Hospital mapping
                </Button>
              </div>
            )}



            {/* Search Clinics */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700">Select Partner Hospital:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter active clinics by name or city..."
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Clinic list */}
              <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-900 rounded-xl divide-y divide-slate-50 dark:divide-slate-900">
                {hospitalsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading clinics...</div>
                ) : filteredHospitals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No active clinics available.</div>
                ) : (
                  filteredHospitals.map(h => (
                    <button
                      key={h._id}
                      type="button"
                      onClick={() => setTempSelectedHospitalId(h._id)}
                      className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex justify-between items-center group text-xs ${tempSelectedHospitalId === h._id ? "bg-teal-50/50 dark:bg-teal-950/20" : ""}`}
                      disabled={actionLoading}
                    >
                      <div className="space-y-0.5">
                        <div className={`font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 ${tempSelectedHospitalId === h._id ? "text-teal-600 font-bold" : ""}`}>{h.name}</div>
                        <div className="text-[10px] text-slate-500">{h.city}, {h.state}</div>
                      </div>
                      {tempSelectedHospitalId === h._id && (
                        <Check className="w-4 h-4 text-teal-600 shrink-0 font-bold" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignOpen(false)}
                className="rounded-xl text-xs"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleAssignHospital(tempSelectedHospitalId)}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1"
                disabled={actionLoading}
              >
                Confirm Mapping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: VIEW REGISTRATION DETAILS (Tabbed) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl rounded-2xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <BookmarkCheck className="w-5 h-5 text-teal-600" /> Registry Dossier
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Audit applicant profile, documents, hospital mapping logs, and audit trails.
            </DialogDescription>
          </DialogHeader>

          {selectedReg && (
            <div className="space-y-4 py-2">
              {/* Tab menu */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 text-xs font-semibold mb-2">
                <div className="flex">
                  <button
                    onClick={() => setDetailTab("info")}
                    className={`pb-2 px-3 border-b-2 transition-all ${detailTab === "info" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500"}`}
                  >
                    Personal & Contacts
                  </button>
                  <button
                    onClick={() => setDetailTab("medical")}
                    className={`pb-2 px-3 border-b-2 transition-all ${detailTab === "medical" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500"}`}
                  >
                    Medical Records
                  </button>
                  <button
                    onClick={() => setDetailTab("history")}
                    className={`pb-2 px-3 border-b-2 transition-all ${detailTab === "history" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500"}`}
                  >
                    Assignment History
                  </button>
                  <button
                    onClick={() => setDetailTab("audits")}
                    className={`pb-2 px-3 border-b-2 transition-all ${detailTab === "audits" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500"}`}
                  >
                    Audit Trail Logs
                  </button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { handleOpenEdit(selectedReg); setIsDetailOpen(false); }}
                  className="h-7 text-xs text-emerald-600 border-emerald-250 hover:bg-emerald-50 mb-1 rounded-lg gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              </div>

              {/* Tab Content */}
              <div className="space-y-4 pt-2">
                {/* 1. INFO TAB */}
                {detailTab === "info" && (
                  <div className="space-y-4">
                    {/* Basic Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                      <div><span className="text-slate-400">FullName:</span> <span className="font-bold">{selectedReg.personalInfo?.fullName}</span></div>
                      <div><span className="text-slate-400">Reg ID:</span> <span className="font-mono font-bold">{selectedReg.registrationId}</span></div>
                      <div><span className="text-slate-400">Blood Group:</span> <span className="font-bold text-red-500">{selectedReg.personalInfo?.bloodGroup || "—"}</span></div>
                      <div><span className="text-slate-400">Age / Gender:</span> <span>{selectedReg.personalInfo?.age} Yrs / {selectedReg.personalInfo?.gender}</span></div>
                      <div><span className="text-slate-400">Aadhaar:</span> <span>{selectedReg.personalInfo?.aadhaarNumber || "—"}</span></div>
                      <div><span className="text-slate-400">PAN:</span> <span>{selectedReg.personalInfo?.panNumber || "—"}</span></div>
                    </div>

                    {/* Contact & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-700">Contact Details:</div>
                        <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> <span>{selectedReg.contactInfo?.mobileNumber}</span></div>
                        <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> <span>{selectedReg.contactInfo?.emailAddress}</span></div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-700">Residential Address:</div>
                        <div className="flex gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <div>{selectedReg.contactInfo?.currentAddress}</div>
                            <div>{selectedReg.contactInfo?.city}, {selectedReg.contactInfo?.state} - {selectedReg.contactInfo?.pincode}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Files Section */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="font-bold text-slate-700">Verifiable Uploads:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedReg.documents && Object.entries(selectedReg.documents).map(([key, val]: [string, any]) => {
                          if (val?.url) {
                            return (
                              <Link key={key} href={val.url} target="_blank" className="bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 font-semibold capitalize">
                                <FileText className="w-3.5 h-3.5 text-teal-600" /> {key.replace(/([A-Z])/g, ' $1')}
                              </Link>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MEDICAL RECORDS TAB */}
                {detailTab === "medical" && (
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-400">Allergies:</div>
                      <div>{selectedReg.medicalInfo?.allergies || "None"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-slate-400">Current Medications:</div>
                      <div>{selectedReg.medicalInfo?.currentMedications || "None"}</div>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <div className="font-bold text-slate-400">Clinical History & Notes:</div>
                      <div className="italic">{selectedReg.medicalInfo?.medicalHistory || "No notes registered."}</div>
                    </div>
                    <div className="space-y-1 col-span-2 border-t pt-2 grid grid-cols-2 gap-2">
                      <div><span className="font-bold text-slate-400">Diabetes:</span> {selectedReg.medicalInfo?.diabetes || "No"}</div>
                      <div><span className="font-bold text-slate-400">Hypertension:</span> {selectedReg.medicalInfo?.hypertension || "No"}</div>
                    </div>
                  </div>
                )}

                {/* 3. ASSIGNMENT HISTORY TAB */}
                {detailTab === "history" && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {!selectedReg.assignmentHistory || selectedReg.assignmentHistory.length === 0 ? (
                      <div className="text-center py-6 text-slate-400">No reassignment logs registered for this profile.</div>
                    ) : (
                      <div className="divide-y border border-slate-100 dark:border-slate-900 rounded-xl">
                        {selectedReg.assignmentHistory.map((item: any, idx: number) => {
                          const oldH = hospitals.find(h => h._id === item.oldHospital)?.name || "Unassigned";
                          const newH = hospitals.find(h => h._id === item.newHospital)?.name || "Unassigned";
                          return (
                            <div key={idx} className="p-3 space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="font-semibold text-slate-700 dark:text-slate-300">
                                  Moved from <span className="font-bold">{oldH}</span> → <span className="font-bold text-teal-600">{newH}</span>
                                </div>
                                <div className="text-slate-400 text-[10px] font-mono">
                                  {new Date(item.assignedAt).toLocaleString()}
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Assigned by: <span className="font-semibold">{item.assignedBy}</span> | Reason: <span className="italic">"{item.reason || "—"}"</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. AUDIT TRAIL LOGS TAB */}
                {detailTab === "audits" && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {auditsLoading ? (
                      <div className="text-center py-6 text-slate-400">Loading audit trail...</div>
                    ) : auditLogs.length === 0 ? (
                      <div className="text-center py-6 text-slate-400">No audit records registered for this dossier.</div>
                    ) : (
                      <div className="divide-y border border-slate-100 dark:border-slate-900 rounded-xl">
                        {auditLogs.map((log: any) => (
                          <div key={log._id} className="p-3 flex justify-between items-center text-[10px]">
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {log.action} <span className="text-[9px] text-slate-400 font-normal">(IP: {log.ipAddress})</span>
                              </div>
                              {log.details && (
                                <div className="text-slate-500 text-[9px]">Details: {log.details}</div>
                              )}
                              <div className="text-slate-400 text-[9px]">
                                Performed by: {log.performedBy}
                              </div>
                            </div>
                            <div className="text-slate-400 font-mono text-right shrink-0 ml-3">
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: PRINT CONFIGURATION */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Printer className="w-5 h-5 text-teal-600" /> PDF Print Configuration
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedReg?.personalInfo?.fullName && (
                <span>Generating for: <strong>{selectedReg.personalInfo.fullName}</strong> — {selectedReg.registrationId}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* SECTION A: Header layout */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">Header Layout</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPrintWithHeader(false)}
                  className={`p-3 rounded-xl border text-left space-y-1 ${!printWithHeader ? "border-teal-500 bg-teal-50/20 text-teal-700 dark:text-teal-400" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700"}`}
                >
                  <div className="font-semibold text-xs">Clean Registry</div>
                  <div className="text-[10px] text-slate-500">Standard plain layout</div>
                </button>
                <button
                  onClick={() => setPrintWithHeader(true)}
                  className={`p-3 rounded-xl border text-left space-y-1 ${printWithHeader ? "border-teal-500 bg-teal-50/20 text-teal-700 dark:text-teal-400" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700"}`}
                >
                  <div className="font-semibold text-xs">Clinic Letterhead</div>
                  <div className="text-[10px] text-slate-500">With branded header/logo</div>
                </button>
              </div>
            </div>

            {/* SECTION B: Core document sections */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">Document Sections</label>
                <button
                  onClick={() => setPrintSections([])}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${printSections.length === 0 ? "bg-teal-600 text-white border-teal-600" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                >
                  Full PDF (All Sections)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(selectedReg?.donorType === "egg" ? EGG_SECTIONS : SPERM_SECTIONS).map(item => {
                  const active = printSections.length === 0 || printSections.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        if (printSections.length === 0) {
                          // Switch from "all" to specific selection (everything except this one)
                          const allKeys = (selectedReg?.donorType === "egg" ? EGG_SECTIONS : SPERM_SECTIONS).map(s => s.key).filter(k => k !== item.key);
                          setPrintSections(allKeys);
                        } else {
                          handleToggleSection(item.key);
                        }
                      }}
                      className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center justify-between gap-2 ${active ? "border-teal-500 bg-teal-50/10 text-teal-700 dark:text-teal-400" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 text-slate-400"}`}
                    >
                      <span>{item.label}</span>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300"}`}>
                        {active && <Check className="w-2.5 h-2.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION C: Annexures */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">Attach Annexures</label>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_ANNEXURES.map(item => {
                  const active = printAttachments.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleToggleAttachment(item.id)}
                      className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center justify-between ${active ? "border-teal-500 bg-teal-50/10 text-teal-700 dark:text-teal-400" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700"}`}
                    >
                      <span>{item.label}</span>
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${active ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300"}`}>
                        {active && <Check className="w-2.5 h-2.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION D: Edit fields before print */}
            <div className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowEditFields(!showEditFields)}
                className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100"
              >
                <span className="flex items-center gap-2"><PenLine className="w-3.5 h-3.5 text-blue-500" /> Edit Fields Before Print</span>
                {showEditFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showEditFields && (
                <div className="p-3 space-y-3 border-t dark:border-slate-700">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Changes will be saved to the registration record permanently.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">Full Name</label>
                      <input
                        type="text"
                        className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder={selectedReg?.personalInfo?.fullName || "Full name"}
                        onChange={(e) => setPrintOverrides((prev: any) => ({ ...prev, personalInfo: { ...(prev.personalInfo || {}), fullName: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">Date of Birth</label>
                      <input
                        type="text"
                        className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder={selectedReg?.personalInfo?.dateOfBirth || "DOB"}
                        onChange={(e) => setPrintOverrides((prev: any) => ({ ...prev, personalInfo: { ...(prev.personalInfo || {}), dateOfBirth: e.target.value } }))}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500">Current Address</label>
                      <input
                        type="text"
                        className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder={selectedReg?.contactInfo?.currentAddress || "Address"}
                        onChange={(e) => setPrintOverrides((prev: any) => ({ ...prev, contactInfo: { ...(prev.contactInfo || {}), currentAddress: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">Aadhaar Number</label>
                      <input
                        type="text"
                        className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder={selectedReg?.personalInfo?.aadhaarNumber || "Aadhaar"}
                        onChange={(e) => setPrintOverrides((prev: any) => ({ ...prev, personalInfo: { ...(prev.personalInfo || {}), aadhaarNumber: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">Signature Date</label>
                      <input
                        type="date"
                        className="w-full h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                        onChange={(e) => setPrintOverrides((prev: any) => ({ ...prev, consent: { ...(prev.consent || {}), signatureDate: e.target.value } }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION E: Upload extra document */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-purple-500" /> Append Extra Document
              </label>
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center space-y-2">
                {printExtraDocUrl ? (
                  <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400">
                    <FileCheck2 className="w-4 h-4" />
                    <span className="flex-1 truncate">Document attached</span>
                    <button onClick={() => setPrintExtraDocUrl("")} className="text-rose-500 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] text-slate-500">Upload PDF, image, or document to append as an extra page. Saved permanently to this registration.</p>
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors ${uploadingExtraDoc ? "opacity-60 pointer-events-none" : ""}`}>
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingExtraDoc ? "Uploading..." : "Browse File"}
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadExtraDoc} />
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsPrintOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button onClick={handlePrintSubmit} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1">
                <Printer className="w-3.5 h-3.5" /> Generate & Print PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: BULK ASSIGN HOSPITAL */}
      <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Building2 className="w-5 h-5 text-teal-600" /> Bulk Clinic Mapping
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign <span className="font-bold">{selectedIds.length}</span> selected applications to a single clinic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="font-bold text-slate-700">Select Affiliate Clinic:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search clinics..."
                  value={bulkHospitalSearch}
                  onChange={(e) => setBulkHospitalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-900 rounded-xl divide-y divide-slate-50 dark:divide-slate-900">
                {hospitalsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading clinics...</div>
                ) : bulkFilteredHospitals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No active clinics match search.</div>
                ) : (
                  bulkFilteredHospitals.map(h => (
                    <button
                      key={h._id}
                      onClick={() => handleBulkAssign(h._id)}
                      className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex justify-between items-center group text-xs"
                      disabled={actionLoading}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600">{h.name}</div>
                        <div className="text-[10px] text-slate-500">{h.city}, {h.state}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
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

      {/* History Chain Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 p-6 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-teal-650" />
              Registration Edit History
            </DialogTitle>
            <DialogDescription className="text-xs">
              Audit log chain of status transitions and updates for &quot;{historyTargetName}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3 text-xs">
            {auditsLoading ? (
              <div className="flex justify-center items-center py-10 gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Fetching history chain...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic">
                No edit or status logs recorded for this registration record.
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pl-1 border-l-2 border-slate-200 dark:border-slate-800">
                {auditLogs.map((log: any, index: number) => (
                  <div key={index} className="text-xs pl-4 relative">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-teal-500" />
                    <div className="font-bold text-slate-850 dark:text-slate-200">{log.action}</div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {log.details}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>By: <strong>{log.performedBy}</strong></span>
                      <span>{new Date(log.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
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
