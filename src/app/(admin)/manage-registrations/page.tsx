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
  FileCheck2,
  FileCheck,
  CreditCard,
  CheckCircle2,
  Copy,
  Heart,
  ShieldCheck,
  ExternalLink,
  MoreHorizontal,
  XCircle,
  Lock,
  GitBranch,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { computeEggDonorManagementStatus, checkViralMarkersEntered } from "@/features/donor-registration/utils/egg-donor-status";
import { InAppDocumentViewer } from "@/components/ui/in-app-document-viewer";
import { DonorPrintModal } from "@/features/donor-registration/components/DonorPrintModal";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { FloatingBulkBar } from "@/components/ui/floating-bulk-bar";
import { confirmAction } from "@/components/ui/custom-confirm-modal";

const EGG_SECTIONS = [
  { key: "registration", label: "Registration Form" },
  { key: "contract", label: "Contract" },
  { key: "certificate", label: "Certificate (Rule 10)" },
  { key: "consent", label: "Consent Form" },
  { key: "profile", label: "Egg Profile & Report" },
  { key: "affidavit", label: "Affidavit" },
];

const COMMON_ANNEXURES = [
  { id: "form13", label: "Form 13 (Consent & Fitness PDF)" },
  { id: "form14", label: "Form 14 (Certificate & Screening PDF)" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "notes", label: "Additional Clinical Notes" },
];

const DOCUMENTS_CONFIG = [
  { key: "passportPhoto", label: "Photo", accept: ".png,.jpg,.jpeg,.webp", folder: "profile-images" },
  { key: "aadhaarFront", label: "Aadhaar Card (Front)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "aadhaarBack", label: "Aadhaar Card (Back)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "signature", label: "Signature", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "form13", label: "Form 13 (Consent & Fitness PDF)", accept: ".pdf", folder: "form13" },
  { key: "form14", label: "Form 14 (Certificate & Screening PDF)", accept: ".pdf", folder: "form14" },
  { key: "affidavit", label: "Affidavit (Form 13 Signed / Notarized)", accept: ".pdf,.png,.jpg,.jpeg,.webp", folder: "affidavit" },
  { key: "otherDocument", label: "Other Document", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
];

const getForm13Info = (reg: any) => {
  if (!reg) return { isUploaded: false, url: null, name: "", uploadedAt: null };
  const doc = reg.documents?.form13 || reg.form13 || null;
  const url = (typeof doc === "object" ? doc?.url : doc) || null;
  const name = (typeof doc === "object" ? doc?.name : null) || "Form-13.pdf";
  const uploadedAt = typeof doc === "object" ? doc?.uploadedAt : null;
  const isUploaded = Boolean(url && typeof url === "string" && url.trim().length > 0);
  return { isUploaded, url, name, uploadedAt };
};

const getForm14Info = (reg: any) => {
  if (!reg) return { isUploaded: false, url: null, name: "", uploadedAt: null };
  const doc = reg.documents?.form14 || reg.form14 || null;
  const url = (typeof doc === "object" ? doc?.url : doc) || null;
  const name = (typeof doc === "object" ? doc?.name : null) || "Form-14.pdf";
  const uploadedAt = typeof doc === "object" ? doc?.uploadedAt : null;
  const isUploaded = Boolean(url && typeof url === "string" && url.trim().length > 0);
  return { isUploaded, url, name, uploadedAt };
};

const getDonorDealInfo = (reg: any) => {
  if (!reg) return { category: "normal", amount: 0, terms: "", paymentStatus: "PENDING", isPaid: false, paidAt: null, paidBy: null, paymentReference: "" };
  const isSperm = reg.donorType === "sperm" || reg.registrationId?.startsWith("SPM-");
  const category = (
    reg.donorDeal?.donorCategory ||
    reg.donorDeal?.category ||
    reg.clinicDeal?.donorCategory ||
    reg.category ||
    "normal"
  ).toLowerCase();

  const rawAmount =
    reg.donorDeal?.compensationAmount ??
    reg.donorDeal?.totalAgreedAmount ??
    reg.donorDeal?.amount;

  const defaultComp = category === "profile" ? (isSperm ? 10000 : 60000) : (isSperm ? 5000 : 40000);
  const hospDealPrice = category === "profile"
    ? (reg.assignedHospital?.profiledonorDealPrice || reg.assignedHospital?.donorDealPrice)
    : reg.assignedHospital?.donorDealPrice;

  const amount =
    typeof rawAmount === "number" && rawAmount > 0
      ? rawAmount
      : (hospDealPrice && hospDealPrice > 0 ? hospDealPrice : defaultComp);

  const terms = reg.donorDeal?.paymentTerms || (isSperm ? "On Sample Collection" : "Full on Retrieval");
  const isPaid = reg.donorDeal?.paymentStatus === "PAID" || reg.isDonorPaid === true;
  const paymentStatus = reg.donorDeal?.paymentStatus || (reg.isDonorPaid ? "PAID" : "PENDING");
  const paidAt = reg.donorDeal?.paidAt || reg.paidAt || null;
  const paidBy = reg.donorDeal?.paidBy || reg.paidBy || null;
  const paymentReference = reg.donorDeal?.paymentReference || "";

  return { category, amount, terms, paymentStatus, isPaid, paidAt, paidBy, paymentReference };
};

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
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("APPROVED");
  const [donorTypeFilter, setDonorTypeFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Segmented Status Tabs State for Egg Donor Management
  type EggManagementTab =
    | "all"
    | "APPROVED"
    | "WAITING_FORM13"
    | "FILE_COMPLETED"
    | "COMPLETED"
    | "CANCELLED"
    | "UNDER_REVIEW"
    | "SUSPENDED"
    | "REJECTED"
    | "other";

  const [activeTab, setActiveTab] = useState<EggManagementTab>("APPROVED");
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    approved: 0,
    waitingForm13: 0,
    fileCompleted: 0,
    completed: 0,
    cancelled: 0,
    underReview: 0,
    suspended: 0,
    rejected: 0,
    other: 0,
  });

  const [tableDensity, setTableDensity] = useState<"compact" | "comfortable">("comfortable");
  const [visibleColumns, setVisibleColumns] = useState({
    hospital: true,
    doctor: true,
    approvedBy: true,
    deal: true,
    payout: true,
    form13: true,
    pickup: true,
    status: true,
  });

  const handleTabChange = (tab: EggManagementTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds([]);
    if (tab === "all") {
      setStatusFilter("");
    } else if (tab === "other") {
      setStatusFilter("other");
    } else {
      setStatusFilter(tab);
    }
  };

  // Selection state for Bulk Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal / Detail view
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"management" | "info" | "medical" | "history" | "audits">("management");
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);

  // Assign Hospital Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [tempSelectedHospitalId, setTempSelectedHospitalId] = useState<string | null>(null);
  const [tempSelectedBranch, setTempSelectedBranch] = useState<{
    branchId: string;
    branchName: string;
    doctorName?: string;
  } | null>(null);
  const [expandedHospitalIds, setExpandedHospitalIds] = useState<string[]>([]);
  
  // Dedicated Doctor Assignment State
  const [isAssignDoctorOpen, setIsAssignDoctorOpen] = useState(false);
  const [doctorAssignReg, setDoctorAssignReg] = useState<any | null>(null);
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [customDoctorInput, setCustomDoctorInput] = useState("");
  const [doctorModalBranchId, setDoctorModalBranchId] = useState("");

  // Bulk Doctor Assignment State
  const [isBulkAssignDoctorOpen, setIsBulkAssignDoctorOpen] = useState(false);
  const [bulkDoctorName, setBulkDoctorName] = useState("");
  const [bulkCustomDoctorInput, setBulkCustomDoctorInput] = useState("");
  const [bulkDoctorHospitalId, setBulkDoctorHospitalId] = useState("");
  const [bulkDoctorBranchId, setBulkDoctorBranchId] = useState("");

  // Edit Oocyte Pickup Date Modal
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pickupReg, setPickupReg] = useState<any | null>(null);
  const [pickupDateValue, setPickupDateValue] = useState("");
  const [pickupLocationValue, setPickupLocationValue] = useState("");
  const [savingPickupDate, setSavingPickupDate] = useState(false);

  // In-App Document Viewer State
  const [viewerDoc, setViewerDoc] = useState<{
    isOpen: boolean;
    title: string;
    fileUrl: string | null;
    fileName?: string;
    donorName?: string;
    donorId?: string;
  }>({
    isOpen: false,
    title: "",
    fileUrl: null,
  });

  const openInAppViewer = (title: string, fileUrl: string | null, fileName?: string, reg?: any) => {
    if (!fileUrl) {
      toast.error("Document file is not available.");
      return;
    }
    const donor = reg || selectedReg;
    setViewerDoc({
      isOpen: true,
      title,
      fileUrl,
      fileName: fileName || title.toLowerCase().replace(/[^a-z0-9]/g, "-") + ".pdf",
      donorName: donor?.personalInfo?.fullName,
      donorId: donor?.donorId || donor?.registrationId,
    });
  };

  const formatDateForInput = (d: any) => {
    if (!d) return "";
    const str = String(d).trim();
    if (!str) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (str.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    try {
      const dt = new Date(str);
      if (isNaN(dt.getTime())) return "";
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  };

  const formatDisplayDate = (d: any) => {
    if (!d) return null;
    const str = String(d).trim();
    if (!str) return null;
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

  const handleOpenPickupModal = (reg: any) => {
    setPickupReg(reg);
    setPickupDateValue(formatDateForInput(reg.pickupDate));
    const hospName = typeof reg.assignedHospital === "object" ? reg.assignedHospital?.name : "";
    const hospCity = typeof reg.assignedHospital === "object" ? reg.assignedHospital?.city : "";
    const fallbackLoc = hospName ? (hospCity ? `${hospName}, ${hospCity}` : hospName) : "";
    setPickupLocationValue(reg.opuLocation || reg.pickupLocation || fallbackLoc || "");
    setIsPickupModalOpen(true);
  };

  const handleSavePickupDate = async () => {
    if (!pickupReg) return;
    setSavingPickupDate(true);
    try {
      const targetId = pickupReg.registrationId || pickupReg._id;
      const cleanPickup = (pickupDateValue || "").trim();
      const cleanLocation = (pickupLocationValue || "").trim();
      const updatedSim = {
        ...pickupReg,
        pickupDate: cleanPickup,
        pickupLocation: cleanLocation,
        opuLocation: cleanLocation,
      };
      const autoStatus = computeEggDonorManagementStatus(updatedSim).status;

      // 1. Direct atomic patch for guaranteed persistence
      const patchRes = await patchAdminRegistrationFieldsAction(targetId, {
        pickupDate: cleanPickup,
        pickupLocation: cleanLocation,
        opuLocation: cleanLocation,
        status: autoStatus,
      });

      // 2. Also sync status transition pipeline
      const statusRes = await updateAdminRegistrationStatusAction({
        registrationId: targetId,
        pickupDate: cleanPickup,
        pickupLocation: cleanLocation,
        opuLocation: cleanLocation,
        status: autoStatus,
      }).catch((e: any) => ({ success: false, error: e?.message }));

      if (patchRes.success || statusRes.success) {
        if (autoStatus === "WAITING_FORM13") {
          toast.success("Oocyte pickup date & OPU location saved! Status automatically advanced to WAITING FORM 13.");
        } else if (autoStatus === "FILE_COMPLETED") {
          toast.success("Oocyte pickup date & OPU location saved! Status is FILE COMPLETED.");
        } else {
          toast.success("Oocyte pickup date & OPU location saved successfully!");
        }
        setIsPickupModalOpen(false);
        const updatedPickup = cleanPickup;
        setPickupReg(null);

        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === targetId || r._id === targetId
              ? {
                  ...r,
                  pickupDate: updatedPickup,
                  pickupLocation: cleanLocation,
                  opuLocation: cleanLocation,
                  status: autoStatus,
                }
              : r
          )
        );
        if (selectedReg && (selectedReg.registrationId === targetId || selectedReg._id === targetId)) {
          setSelectedReg((prev: any) =>
            prev
              ? {
                  ...prev,
                  pickupDate: updatedPickup,
                  pickupLocation: cleanLocation,
                  opuLocation: cleanLocation,
                  status: autoStatus,
                }
              : null
          );
        }
        loadRegistrations();
      } else {
        toast.error(patchRes.error || (statusRes as any).error || "Failed to update pickup date.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error updating pickup date.");
    } finally {
      setSavingPickupDate(false);
    }
  };

  // Donor Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentReg, setPaymentReg] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState<{
    status: "PAID" | "PENDING";
    paidDate: string;
    paidBy: string;
    paymentReference: string;
  }>({
    status: "PENDING",
    paidDate: "",
    paidBy: "Admin",
    paymentReference: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const handleOpenPaymentModal = (reg: any) => {
    setPaymentReg(reg);
    const deal = getDonorDealInfo(reg);
    const todayStr = new Date().toISOString().slice(0, 10);
    setPaymentForm({
      status: deal.isPaid ? "PAID" : "PAID",
      paidDate: formatDateForInput(deal.paidAt) || todayStr,
      paidBy: deal.paidBy || "Admin",
      paymentReference: deal.paymentReference || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!paymentReg) return;
    setSavingPayment(true);
    try {
      const updatedSim = {
        ...paymentReg,
        isDonorPaid: paymentForm.status === "PAID",
        donorDeal: {
          ...(paymentReg.donorDeal || {}),
          paymentStatus: paymentForm.status,
        },
      };
      const autoStatus = computeEggDonorManagementStatus(updatedSim).status;

      const data = await updateAdminRegistrationStatusAction({
        registrationId: paymentReg.registrationId,
        paymentStatus: paymentForm.status,
        paidAt: paymentForm.status === "PAID" ? paymentForm.paidDate : null,
        paidBy: paymentForm.status === "PAID" ? paymentForm.paidBy : null,
        paymentReference: paymentForm.paymentReference,
        status: autoStatus,
      });

      if (data.success) {
        if (autoStatus === "WAITING_FORM13") {
          toast.success("Donor marked as PAID! Status automatically advanced to WAITING FORM 13.");
        } else if (autoStatus === "FILE_COMPLETED") {
          toast.success("Donor marked as PAID! Status is FILE COMPLETED.");
        } else {
          toast.success(
            paymentForm.status === "PAID"
              ? "Donor marked as PAID successfully!"
              : "Donor payment status updated to PENDING."
          );
        }
        setIsPaymentModalOpen(false);
        const targetId = paymentReg.registrationId;
        const newStatus = paymentForm.status;
        const newPaidAt = paymentForm.status === "PAID" ? paymentForm.paidDate : null;
        const newPaidBy = paymentForm.status === "PAID" ? paymentForm.paidBy : null;
        const newRef = paymentForm.paymentReference;

        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === targetId
              ? {
                  ...r,
                  status: autoStatus,
                  isDonorPaid: newStatus === "PAID",
                  paidAt: newPaidAt,
                  paidBy: newPaidBy,
                  donorDeal: {
                    ...(r.donorDeal || {}),
                    paymentStatus: newStatus,
                    paidAt: newPaidAt,
                    paidBy: newPaidBy,
                    paymentReference: newRef,
                  },
                }
              : r
          )
        );
        if (selectedReg && selectedReg.registrationId === targetId) {
          setSelectedReg((prev: any) =>
            prev
              ? {
                  ...prev,
                  status: autoStatus,
                  isDonorPaid: newStatus === "PAID",
                  paidAt: newPaidAt,
                  paidBy: newPaidBy,
                  donorDeal: {
                    ...(prev.donorDeal || {}),
                    paymentStatus: newStatus,
                    paidAt: newPaidAt,
                    paidBy: newPaidBy,
                    paymentReference: newRef,
                  },
                }
              : null
          );
        }
        setPaymentReg(null);
        loadRegistrations();
      } else {
        toast.error(data.error || "Failed to update payment status.");
      }
    } catch {
      toast.error("Error updating payment status.");
    } finally {
      setSavingPayment(false);
    }
  };

  // Form 13 Statutory Document Modal State
  const [isForm13ModalOpen, setIsForm13ModalOpen] = useState(false);
  const [form13Reg, setForm13Reg] = useState<any | null>(null);
  const [uploadingForm13, setUploadingForm13] = useState(false);

  // Form 14 Statutory Document Modal State
  const [isForm14ModalOpen, setIsForm14ModalOpen] = useState(false);
  const [form14Reg, setForm14Reg] = useState<any | null>(null);
  const [uploadingForm14, setUploadingForm14] = useState(false);

  const checkCanUploadForm13 = (reg: any) => {
    if (!reg) return { canUpload: false, missing: [] };
    const hasViralMarker = !!(reg.labReports?.viralMarkersReport?.url || (Array.isArray(reg.labReports?.viralMarkers) ? reg.labReports?.viralMarkers[0]?.url : reg.labReports?.viralMarkers?.url));
    const hasBloodReport = !!(reg.labReports?.bloodReport?.url);
    const hasInsurance = !!(reg.labReports?.insurance?.url || reg.documents?.insurance?.url || reg.labReports?.lifeInsurance?.url);
    const hasHealthInsurance = !!(reg.labReports?.healthInsurance?.url);
    const hasPickup = !!(reg.pickupDate);
    const missing: string[] = [];
    if (!hasViralMarker) missing.push("Viral Markers Report");
    if (!hasBloodReport) missing.push("Blood Test Report");
    if (!hasInsurance) missing.push("Life / Medical Insurance Policy");
    if (!hasHealthInsurance) missing.push("Health Insurance Policy");
    if (!hasPickup) missing.push("Pickup Date");
    return {
      canUpload: missing.length === 0,
      missing,
      hasViralMarker,
      hasBloodReport,
      hasInsurance,
      hasHealthInsurance,
      hasPickup,
    };
  };

  const handleOpenForm13Modal = (reg: any) => {
    const info = getForm13Info(reg);
    if (!info.isUploaded) {
      const { canUpload, missing } = checkCanUploadForm13(reg);
      if (!canUpload) {
        toast.error(`Form 13 upload is locked. Upload/set first: ${missing.join(", ")}`);
        return;
      }
    }
    setForm13Reg(reg);
    setIsForm13ModalOpen(true);
  };

  const handlePrintForm13 = (reg: any) => {
    const info = getForm13Info(reg);
    if (!info.url) {
      toast.error("Form 13 has not been uploaded for this donor yet.");
      return;
    }
    openInAppViewer(
      `Form 13 Statutory Consent PDF - ${reg.personalInfo?.fullName || reg.registrationId}`,
      info.url,
      info.name || "Form-13.pdf",
      reg
    );

    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Form 13 Printed",
        entityType: "DonorRegistration",
        entityId: reg._id,
        details: `Form 13 PDF opened in viewer for ${reg.personalInfo?.fullName || reg.registrationId}`,
      }),
    }).catch(() => {});
  };

  const handleUploadForm13 = async (file: File) => {
    if (!form13Reg) return;
    const isAlreadyUploaded = !!getForm13Info(form13Reg).isUploaded;
    if (!isAlreadyUploaded) {
      const { canUpload, missing } = checkCanUploadForm13(form13Reg);
      if (!canUpload) {
        toast.error(`Cannot upload Form 13. Please upload/set: ${missing.join(", ")}`);
        return;
      }
    }
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted for Form 13.");
      return;
    }

    setUploadingForm13(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "form13");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const fileUrl = data.url || data.media?.url;

      if (data.success && fileUrl) {
        const form13Data = {
          name: file.name,
          url: fileUrl,
          fileId: data.fileId || data.media?.fileId || "",
          uploadedAt: new Date().toISOString(),
        };

        const updatedSim = {
          ...form13Reg,
          documents: { ...(form13Reg.documents || {}), form13: form13Data },
          form13: form13Data,
        };
        const autoStatus = computeEggDonorManagementStatus(updatedSim).status;

        const patchRes = await patchAdminRegistrationFieldsAction(form13Reg.registrationId, {
          "documents.form13": form13Data,
          form13: form13Data,
          status: autoStatus,
        });

        if (patchRes.success) {
          setRegistrations((prev) =>
            prev.map((r) =>
              r.registrationId === form13Reg.registrationId
                ? {
                    ...r,
                    documents: { ...(r.documents || {}), form13: form13Data },
                    form13: form13Data,
                    status: autoStatus,
                  }
                : r
            )
          );
          setForm13Reg((prev: any) =>
            prev
              ? {
                  ...prev,
                  documents: { ...(prev.documents || {}), form13: form13Data },
                  form13: form13Data,
                  status: autoStatus,
                }
              : null
          );
          if (selectedReg && selectedReg.registrationId === form13Reg.registrationId) {
            setSelectedReg((prev: any) =>
              prev
                ? {
                    ...prev,
                    documents: { ...(prev.documents || {}), form13: form13Data },
                    form13: form13Data,
                    status: autoStatus,
                  }
                : null
            );
          }

          toast.success(
            autoStatus === "FILE_COMPLETED"
              ? "Form 13 uploaded! Status automatically set to FILE COMPLETED."
              : "Form 13 uploaded successfully! Ready to print."
          );
        } else {
          toast.error(patchRes.error || "Failed to update record with Form 13.");
        }
      } else {
        toast.error(data.error || "Upload failed.");
      }
    } catch (e: any) {
      toast.error("Failed to upload Form 13: " + (e.message || "Upload error"));
    } finally {
      setUploadingForm13(false);
    }
  };

  const handleRemoveForm13 = async () => {
    if (!form13Reg) return;
    const confirmed = await confirmAction({
      title: "Remove Form 13",
      message: "Are you sure you want to remove Form 13? The registration will be marked incomplete.",
      confirmText: "Yes, Remove Form 13",
      variant: "destructive",
    });
    if (!confirmed) return;

    setUploadingForm13(true);
    try {
      const updatedSim = {
        ...form13Reg,
        documents: { ...(form13Reg.documents || {}), form13: null },
        form13: null,
      };
      const autoStatus = computeEggDonorManagementStatus(updatedSim).status;

      const patchRes = await patchAdminRegistrationFieldsAction(form13Reg.registrationId, {
        "documents.form13": null,
        form13: null,
        status: autoStatus,
      });

      if (patchRes.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === form13Reg.registrationId
              ? {
                  ...r,
                  documents: { ...(r.documents || {}), form13: null },
                  form13: null,
                  status: autoStatus,
                }
              : r
          )
        );
        setForm13Reg((prev: any) =>
          prev
            ? {
                ...prev,
                documents: { ...(prev.documents || {}), form13: null },
                form13: null,
                status: autoStatus,
              }
            : null
        );
        if (selectedReg && selectedReg.registrationId === form13Reg.registrationId) {
          setSelectedReg((prev: any) =>
            prev
              ? {
                  ...prev,
                  documents: { ...(prev.documents || {}), form13: null },
                  form13: null,
                  status: autoStatus,
                }
              : null
          );
        }
        toast.info(`Form 13 removed. Status automatically reverted to ${autoStatus.replace(/_/g, " ")}.`);
      } else {
        toast.error("Failed to remove Form 13.");
      }
    } catch {
      toast.error("Failed to remove Form 13.");
    } finally {
      setUploadingForm13(false);
    }
  };

  const handleOpenForm14Modal = (reg: any) => {
    const info = getForm14Info(reg);
    if (!info.isUploaded) {
      const { canUpload, missing } = checkCanUploadForm13(reg);
      if (!canUpload) {
        toast.error(`Form 14 upload is locked. Upload/set first: ${missing.join(", ")}`);
        return;
      }
    }
    setForm14Reg(reg);
    setIsForm14ModalOpen(true);
  };

  const handlePrintForm14 = (reg: any) => {
    const info = getForm14Info(reg);
    if (!info.url) {
      toast.error("Form 14 has not been uploaded for this donor yet.");
      return;
    }
    openInAppViewer(
      `Form 14 Statutory Certificate & Screening PDF - ${reg.personalInfo?.fullName || reg.registrationId}`,
      info.url,
      info.name || "Form-14.pdf",
      reg
    );

    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Form 14 Printed",
        entityType: "DonorRegistration",
        entityId: reg._id,
        details: `Form 14 PDF opened in viewer for ${reg.personalInfo?.fullName || reg.registrationId}`,
      }),
    }).catch(() => {});
  };

  const handleUploadForm14 = async (file: File) => {
    if (!form14Reg) return;
    const isAlreadyUploaded = !!getForm14Info(form14Reg).isUploaded;
    if (!isAlreadyUploaded) {
      const { canUpload, missing } = checkCanUploadForm13(form14Reg);
      if (!canUpload) {
        toast.error(`Cannot upload Form 14. Please upload/set: ${missing.join(", ")}`);
        return;
      }
    }
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted for Form 14.");
      return;
    }

    setUploadingForm14(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "form14");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const fileUrl = data.url || data.media?.url;

      if (data.success && fileUrl) {
        const form14Data = {
          name: file.name,
          url: fileUrl,
          fileId: data.fileId || data.media?.fileId || "",
          uploadedAt: new Date().toISOString(),
        };

        const patchRes = await patchAdminRegistrationFieldsAction(form14Reg.registrationId, {
          "documents.form14": form14Data,
          form14: form14Data,
        });

        if (patchRes.success) {
          setRegistrations((prev) =>
            prev.map((r) =>
              r.registrationId === form14Reg.registrationId
                ? {
                    ...r,
                    documents: { ...(r.documents || {}), form14: form14Data },
                    form14: form14Data,
                  }
                : r
            )
          );
          setForm14Reg((prev: any) =>
            prev
              ? {
                  ...prev,
                  documents: { ...(prev.documents || {}), form14: form14Data },
                  form14: form14Data,
                }
              : null
          );
          if (selectedReg && selectedReg.registrationId === form14Reg.registrationId) {
            setSelectedReg((prev: any) =>
              prev
                ? {
                    ...prev,
                    documents: { ...(prev.documents || {}), form14: form14Data },
                    form14: form14Data,
                  }
                : null
            );
          }

          toast.success("Form 14 uploaded successfully! Ready to print.");
        } else {
          toast.error(patchRes.error || "Failed to update record with Form 14.");
        }
      } else {
        toast.error(data.error || "Upload failed.");
      }
    } catch (e: any) {
      toast.error("Failed to upload Form 14: " + (e.message || "Upload error"));
    } finally {
      setUploadingForm14(false);
    }
  };

  const handleRemoveForm14 = async () => {
    if (!form14Reg) return;
    const confirmed = await confirmAction({
      title: "Remove Form 14",
      message: "Are you sure you want to remove Form 14?",
      confirmText: "Yes, Remove Form 14",
      variant: "destructive",
    });
    if (!confirmed) return;

    setUploadingForm14(true);
    try {
      const patchRes = await patchAdminRegistrationFieldsAction(form14Reg.registrationId, {
        "documents.form14": null,
        form14: null,
      });

      if (patchRes.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === form14Reg.registrationId
              ? {
                  ...r,
                  documents: { ...(r.documents || {}), form14: null },
                  form14: null,
                }
              : r
          )
        );
        setForm14Reg((prev: any) =>
          prev
            ? {
                ...prev,
                documents: { ...(prev.documents || {}), form14: null },
                form14: null,
              }
            : null
        );
        if (selectedReg && selectedReg.registrationId === form14Reg.registrationId) {
          setSelectedReg((prev: any) =>
            prev
              ? {
                  ...prev,
                  documents: { ...(prev.documents || {}), form14: null },
                  form14: null,
                }
              : null
          );
        }
        toast.info("Form 14 removed.");
      } else {
        toast.error("Failed to remove Form 14.");
      }
    } catch {
      toast.error("Failed to remove Form 14.");
    } finally {
      setUploadingForm14(false);
    }
  };

  const handleManagementDocUpload = async (docKey: "viralMarkersReport" | "bloodReport" | "insurance" | "healthInsurance", fileRef: any) => {
    const url = fileRef?.url;
    if (!selectedReg || !url) return;
    setActionLoading(true);
    try {
      const fileName = fileRef?.fileName || fileRef?.name || url.split("/").pop() || `${docKey}.pdf`;
      const docData = {
        url,
        fileId: fileRef?.fileId,
        fileName,
        uploadedAt: new Date(),
        verified: true,
      };

      const fieldPath = `labReports.${docKey}`;
      const updates: any = { [fieldPath]: docData };
      if (docKey === "viralMarkersReport") {
        updates["labReports.viralMarkers"] = [docData];
      }

      const updatedSim = {
        ...selectedReg,
        labReports: {
          ...(selectedReg.labReports || {}),
          ...(docKey === "viralMarkersReport"
            ? { viralMarkersReport: docData, viralMarkers: [docData] }
            : { [docKey]: docData }),
        },
      };
      const autoStatus = computeEggDonorManagementStatus(updatedSim).status;
      updates.status = autoStatus;

      const res = await fetch(`/api/donor-registrations/egg/${selectedReg.registrationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        if (autoStatus === "WAITING_FORM13") {
          toast.success("Document uploaded! All 4 tests complete. Status automatically advanced to WAITING FORM 13.");
        } else if (autoStatus === "FILE_COMPLETED") {
          toast.success("Document uploaded! Status automatically set to FILE COMPLETED.");
        } else {
          toast.success("Document uploaded successfully!");
        }
        setSelectedReg((prev: any) => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (!updated.labReports) updated.labReports = {};
          if (docKey === "viralMarkersReport") {
            updated.labReports.viralMarkersReport = docData;
            updated.labReports.viralMarkers = [docData];
          } else {
            updated.labReports[docKey] = docData;
          }
          updated.status = autoStatus;
          return updated;
        });
        setRegistrations((prev: any[]) =>
          prev.map((r: any) => {
            if (r.registrationId !== selectedReg.registrationId) return r;
            const updated = { ...r };
            if (!updated.labReports) updated.labReports = {};
            if (docKey === "viralMarkersReport") {
              updated.labReports.viralMarkersReport = docData;
              updated.labReports.viralMarkers = [docData];
            } else {
              updated.labReports[docKey] = docData;
            }
            updated.status = autoStatus;
            return updated;
          })
        );
      } else {
        toast.error(data.error || "Failed to update document.");
      }
    } catch {
      toast.error("Error uploading document.");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Form Dialog State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editTab, setEditTab] = useState<"details" | "documents" | "labReports">("details");

  // Print Configuration Modal State
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printWithHeader, setPrintWithHeader] = useState(true);
  const [printAttachments, setPrintAttachments] = useState<string[]>([]);
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
  const [bulkSelectedHospitalId, setBulkSelectedHospitalId] = useState<string | null>(null);
  const [bulkSelectedBranch, setBulkSelectedBranch] = useState<{
    branchId: string;
    branchName: string;
    doctorName?: string;
  } | null>(null);
  const [bulkExpandedHospitalIds, setBulkExpandedHospitalIds] = useState<string[]>([]);

  // Fetch Approved Registrations (Egg Donors Only)
  async function loadRegistrations() {
    setLoading(true);
    try {
      const data = (await getAdminRegistrationsAction({
        page: currentPage,
        limit: itemsPerPage,
        search,
        donorType: "egg",
        status: statusFilter || undefined,
        hospital: hospitalFilter || undefined,
        branch: branchFilter || undefined,
        startDate: fromDateFilter || undefined,
        endDate: toDateFilter || undefined,
      })) as any;
      if (data.success && data.registrations) {
        // Strictly exclude any sperm donor records and auto-sync status for egg donors in management
        const eggOnly = (data.registrations || [])
          .filter((r: any) => {
            if (r.donorType === "sperm" || r.registrationId?.startsWith("MED-SD") || r.registrationId?.startsWith("SPM")) {
              return false;
            }
            if (hospitalFilter) {
              const hId = typeof r.assignedHospital === "object" ? r.assignedHospital?._id : r.assignedHospital;
              if (hId && hId !== hospitalFilter) return false;
            }
            if (branchFilter && r.assignedBranch !== branchFilter) {
              return false;
            }
            return true;
          })
          .map((r: any) => {
            const computed = computeEggDonorManagementStatus(r).status;
            if (["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(r.status) && computed !== r.status) {
              if (computed === "FILE_COMPLETED" && r.status !== "FILE_COMPLETED") {
                patchAdminRegistrationFieldsAction(r.registrationId, { status: "FILE_COMPLETED" }).catch(() => {});
              }
              return { ...r, status: computed };
            }
            return r;
          });
        setRegistrations(eggOnly);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalCount(data.pagination.total || eggOnly.length);
        } else {
          setTotalCount(eggOnly.length);
        }
        if (data.statusCounts) setStatusCounts(data.statusCounts);
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
  }, [search, hospitalFilter, branchFilter, statusFilter, donorTypeFilter, fromDateFilter, toDateFilter, currentPage, itemsPerPage]);

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

  const openAssignHospitalModal = (reg: any) => {
    setSelectedReg(reg);
    const currentHospId = reg.assignedHospital?._id || reg.assignedHospital || null;
    setTempSelectedHospitalId(currentHospId);
    if (reg.assignedBranch) {
      setTempSelectedBranch({
        branchName: reg.assignedBranch,
        branchId: reg.assignedBranchId || "",
        doctorName: reg.assignedDoctor || ""
      });
    } else {
      setTempSelectedBranch(null);
    }
    if (currentHospId) {
      setExpandedHospitalIds([currentHospId]);
    } else {
      setExpandedHospitalIds([]);
    }
    setHospitalSearch("");
    setIsAssignOpen(true);
  };

  // Update Hospital Assignment
  const handleAssignHospital = async (
    hospitalId: string | null,
    branchInfo?: { branchName: string; branchId: string; doctorName?: string } | null
  ) => {
    if (!selectedReg) return;

    setActionLoading(true);
    try {
      const data = await updateAdminRegistrationStatusAction({
        registrationId: selectedReg.registrationId,
        assignedHospitalId: hospitalId,
        assignedBranch: branchInfo?.branchName || "",
        assignedBranchId: branchInfo?.branchId || "",
        assignedDoctor: branchInfo?.doctorName || "",
      });
      if (data.success) {
        toast.success(
          hospitalId
            ? (branchInfo?.branchName ? `Mapped to ${branchInfo.branchName} successfully!` : "Hospital mapped successfully!")
            : "Hospital mapping cleared."
        );
        setIsAssignOpen(false);
        const mappedHosp = hospitals.find((h) => h._id === hospitalId) || null;
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === selectedReg.registrationId
              ? {
                  ...r,
                  assignedHospital: mappedHosp,
                  assignedBranch: branchInfo?.branchName || "",
                  assignedBranchId: branchInfo?.branchId || "",
                  assignedDoctor: branchInfo?.doctorName || ""
                }
              : r
          )
        );
        if (selectedReg) {
          setSelectedReg((prev: any) =>
            prev
              ? {
                  ...prev,
                  assignedHospital: mappedHosp,
                  assignedBranch: branchInfo?.branchName || "",
                  assignedBranchId: branchInfo?.branchId || "",
                  assignedDoctor: branchInfo?.doctorName || ""
                }
              : null
          );
        }
        await loadRegistrations();
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
  const handleBulkAssign = async (
    hospitalId: string,
    branchInfo?: { branchName: string; branchId: string; doctorName?: string } | null
  ) => {
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
          assignedBranch: branchInfo?.branchName || "",
          assignedBranchId: branchInfo?.branchId || "",
          assignedDoctor: branchInfo?.doctorName || "",
        });
        if (data.success) {
          successCount++;
        }
      }
      
      toast.success(`Bulk assignment complete! Mapped ${successCount} registrations.`);
      setIsBulkAssignOpen(false);
      setSelectedIds([]);
      setBulkSelectedHospitalId(null);
      setBulkSelectedBranch(null);
      loadRegistrations();
    } catch (error) {
      toast.error("Network error during bulk assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Dedicated Doctor Assignment Handlers
  const openAssignDoctorModal = (reg: any) => {
    setDoctorAssignReg(reg);
    setSelectedDoctorName(reg.assignedDoctor ? `Dr. ${reg.assignedDoctor.replace(/^Dr\.?\s*/i, "")}` : "");
    setCustomDoctorInput("");
    setDoctorModalBranchId(reg.assignedBranchId || reg.assignedBranch || "");
    setIsAssignDoctorOpen(true);
  };

  const handleAssignDoctor = async (docName: string, branchInfo?: { branchName: string; branchId: string }) => {
    if (!doctorAssignReg) return;
    const finalDoc = docName.trim();
    setActionLoading(true);
    try {
      const payload: any = {
        registrationId: doctorAssignReg.registrationId,
        assignedDoctor: finalDoc,
      };
      if (branchInfo?.branchName) {
        payload.assignedBranch = branchInfo.branchName;
        payload.assignedBranchId = branchInfo.branchId;
      }
      const data = await updateAdminRegistrationStatusAction(payload);
      if (data.success) {
        toast.success(finalDoc ? `Doctor updated to Dr. ${finalDoc.replace(/^Dr\.?\s*/i, "")}` : "Doctor unassigned.");
        setIsAssignDoctorOpen(false);
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === doctorAssignReg.registrationId
              ? {
                  ...r,
                  assignedDoctor: finalDoc,
                  ...(branchInfo?.branchName ? { assignedBranch: branchInfo.branchName, assignedBranchId: branchInfo.branchId } : {}),
                }
              : r
          )
        );
        if (selectedReg && selectedReg.registrationId === doctorAssignReg.registrationId) {
          setSelectedReg((prev: any) =>
            prev
              ? {
                  ...prev,
                  assignedDoctor: finalDoc,
                  ...(branchInfo?.branchName ? { assignedBranch: branchInfo.branchName, assignedBranchId: branchInfo.branchId } : {}),
                }
              : null
          );
        }
        setDoctorAssignReg(null);
        await loadRegistrations();
      } else {
        toast.error(data.error || "Failed to update doctor assignment.");
      }
    } catch {
      toast.error("Network error during doctor update.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAssignDoctor = async (docName: string) => {
    const finalDoc = docName.trim();
    if (selectedIds.length === 0 || !finalDoc) return;
    setActionLoading(true);
    let successCount = 0;
    try {
      for (const regId of selectedIds) {
        const data = await updateAdminRegistrationStatusAction({
          registrationId: regId,
          assignedDoctor: finalDoc,
        });
        if (data.success) {
          successCount++;
        }
      }
      toast.success(`Assigned Dr. ${finalDoc.replace(/^Dr\.?\s*/i, "")} to ${successCount} registrations.`);
      setIsBulkAssignDoctorOpen(false);
      setSelectedIds([]);
      setBulkDoctorName("");
      setBulkCustomDoctorInput("");
      await loadRegistrations();
    } catch {
      toast.error("Error updating bulk doctor assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmAction({
      title: "Update Status",
      message: `Are you sure you want to change the status of ${selectedIds.length} selected applications to ${newStatus}?`,
      confirmText: `Yes, Set to ${newStatus}`,
      variant: newStatus === "CANCELLED" ? "destructive" : "default",
    });
    if (!confirmed) return;

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

  // Single Status Change
  const handleSingleStatusChange = async (registrationId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const data = await updateAdminRegistrationStatusAction({
        registrationId,
        status: newStatus,
      });
      if (data.success) {
        toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === registrationId ? { ...r, status: newStatus } : r
          )
        );
        if (selectedReg && selectedReg.registrationId === registrationId) {
          setSelectedReg((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
        loadRegistrations();
      } else {
        toast.error(data.error || "Failed to update status.");
      }
    } catch {
      toast.error("Network error during status update.");
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
          details: `Bulk PDF file printed (Branded header: true)`
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
      "Donor ID", "Donor Type", "Full Name", "Age", "Gender", "Blood Group", "Contact Number", "Email", "Assigned Hospital", "Payout Status", "Form 13 Status", "Date Approved"
    ];
    const rows = activeList.map((reg: any) => [
      reg.donorId || "—",
      reg.donorType,
      reg.personalInfo?.fullName || "",
      reg.personalInfo?.age || "",
      reg.personalInfo?.gender || "",
      reg.personalInfo?.bloodGroup || "",
      reg.contactInfo?.mobileNumber || "",
      reg.contactInfo?.emailAddress || "",
      reg.assignedHospital ? reg.assignedHospital.name : "Unassigned",
      getDonorDealInfo(reg).isPaid ? "PAID" : "NOT PAID",
      getForm13Info(reg).isUploaded ? "UPLOADED" : "NOT UPLOADED",
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
      donorId: reg.donorId || "",
      status: reg.status || "APPROVED",
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
          status: editForm.status,
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
        details: `PDF file printed (Header: ${printWithHeader}, Sections: ${printSections.join(",") || "all"}, Annexures: ${printAttachments.join(",")})`
      })
    });

    const targetId = selectedReg.registrationId || selectedReg.donorId || selectedReg._id;
    window.open(`/admin/manage-registrations/${targetId}/print?withHeader=${printWithHeader}${attachmentsQuery}${sectionsQuery}${extraDocQuery}${overridesQuery}`, "_blank");
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
  }, [search, hospitalFilter, branchFilter, fromDateFilter, toDateFilter, statusFilter]);

  // Selected hospital and available branches for filtering
  const selectedHospitalObj = hospitals.find((h) => h._id === hospitalFilter);
  const availableBranches = selectedHospitalObj
    ? (selectedHospitalObj.branches || [])
    : hospitals.flatMap((h) => (h.branches || []).map((b: any) => ({ ...b, hospitalName: h.name })));

  // Filtered hospitals lists
  const filteredHospitals = hospitals.filter(h => {
    if (h.status && h.status !== "ACTIVE") return false;
    const term = hospitalSearch.trim().toLowerCase();
    if (!term) return true;
    const matchName = h.name?.toLowerCase().includes(term);
    const matchShort = h.shortName?.toLowerCase().includes(term);
    const matchAddress = h.address?.toLowerCase().includes(term);
    const matchCity = h.city?.toLowerCase().includes(term);
    const matchBranch = Array.isArray(h.branches) && h.branches.some((b: any) =>
      b.branchName?.toLowerCase().includes(term) ||
      b.branchCode?.toLowerCase().includes(term) ||
      b.city?.toLowerCase().includes(term) ||
      b.doctorName?.toLowerCase().includes(term)
    );
    return Boolean(matchName || matchShort || matchAddress || matchCity || matchBranch);
  });

  const bulkFilteredHospitals = hospitals.filter(h => {
    if (h.status && h.status !== "ACTIVE") return false;
    const term = bulkHospitalSearch.trim().toLowerCase();
    if (!term) return true;
    const matchName = h.name?.toLowerCase().includes(term);
    const matchShort = h.shortName?.toLowerCase().includes(term);
    const matchAddress = h.address?.toLowerCase().includes(term);
    const matchCity = h.city?.toLowerCase().includes(term);
    const matchBranch = Array.isArray(h.branches) && h.branches.some((b: any) =>
      b.branchName?.toLowerCase().includes(term) ||
      b.branchCode?.toLowerCase().includes(term) ||
      b.city?.toLowerCase().includes(term) ||
      b.doctorName?.toLowerCase().includes(term)
    );
    return Boolean(matchName || matchShort || matchAddress || matchCity || matchBranch);
  });

  return (
    <div className="space-y-6 pb-12 text-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Egg Donor Management
          </h1>
        
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

      {/* Interactive Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            tab: "all" as const,
            title: "Total Records",
            count: statusCounts.all || 0,
            textColor: "text-teal-600 dark:text-teal-400",
            borderHover: "hover:border-teal-300 dark:hover:border-teal-700",
            activeBorder: "border-teal-500 dark:border-teal-400 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20",
            badgeBg: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
          },
          {
            tab: "APPROVED" as const,
            title: "Approved Donors",
            count: statusCounts.approved || 0,
            textColor: "text-emerald-600 dark:text-emerald-400",
            borderHover: "hover:border-emerald-300 dark:hover:border-emerald-700",
            activeBorder: "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20",
            badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
          },
          {
            tab: "WAITING_FORM13" as const,
            title: "Waiting Form 13",
            count: statusCounts.waitingForm13 || 0,
            textColor: "text-amber-600 dark:text-amber-400",
            borderHover: "hover:border-amber-300 dark:hover:border-amber-700",
            activeBorder: "border-amber-500 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20",
            badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
          },
          {
            tab: "FILE_COMPLETED" as const,
            title: "File Completed",
            count: statusCounts.fileCompleted || 0,
            textColor: "text-blue-600 dark:text-blue-400",
            borderHover: "hover:border-blue-300 dark:hover:border-blue-700",
            activeBorder: "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20",
            badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
          },
          {
            tab: "COMPLETED" as const,
            title: "Cycle Completed",
            count: statusCounts.completed || 0,
            textColor: "text-purple-600 dark:text-purple-400",
            borderHover: "hover:border-purple-300 dark:hover:border-purple-700",
            activeBorder: "border-purple-500 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20",
            badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
          },
          {
            tab: "CANCELLED" as const,
            title: "Cancelled",
            count: statusCounts.cancelled || 0,
            textColor: "text-rose-600 dark:text-rose-400",
            borderHover: "hover:border-rose-300 dark:hover:border-rose-700",
            activeBorder: "border-rose-500 dark:border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20",
            badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
          },
        ].map((card) => {
          const isSelected = activeTab === card.tab;
          return (
            <button
              key={card.tab}
              type="button"
              onClick={() => handleTabChange(card.tab)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none text-left relative overflow-hidden group shadow-2xs ${
                isSelected
                  ? card.activeBorder
                  : `border-slate-200/80 dark:border-slate-800 bg-card ${card.borderHover} hover:shadow-sm`
              }`}
              title={`Click to filter by ${card.title}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate ${card.textColor}`}>
                  {card.title}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0 animate-pulse" />
                )}
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${card.textColor}`}>
                  {card.count}
                </span>
                {isSelected && (
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${card.badgeBg}`}>
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Advanced Filters Panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm space-y-4">
        {/* Segmented Status Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name, Donor ID, Registration ID, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Hospital Filter */}
          <div>
            <select
              value={hospitalFilter}
              onChange={(e) => {
                setHospitalFilter(e.target.value);
                setBranchFilter("");
              }}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="">All Branches</option>
              {availableBranches.map((b: any, bIdx: number) => (
                <option key={b._id || `${b.branchName}-${bIdx}`} value={b.branchName}>
                  {b.branchName} {b.city ? `(${b.city})` : ""} {!selectedHospitalObj && b.hospitalName ? `• ${b.hospitalName}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                if (val === "APPROVED") setActiveTab("APPROVED");
                else if (val === "WAITING_FORM13") setActiveTab("WAITING_FORM13");
                else if (val === "FILE_COMPLETED") setActiveTab("FILE_COMPLETED");
                else if (val === "COMPLETED") setActiveTab("COMPLETED");
                else if (val === "CANCELLED") setActiveTab("CANCELLED");
                else if (val === "UNDER_REVIEW") setActiveTab("UNDER_REVIEW");
                else if (val === "SUSPENDED") setActiveTab("SUSPENDED");
                else if (val === "REJECTED") setActiveTab("REJECTED");
                else if (val === "" && activeTab !== "all") setActiveTab("all");
                else if (val === "other") setActiveTab("other");
              }}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500 font-medium"
            >
              {activeTab === "all" ? (
                <>
                  <option value="">All Pipeline Statuses</option>
                  <option value="APPROVED">Status: Approved</option>
                  <option value="WAITING_FORM13">Status: Waiting Form 13</option>
                  <option value="FILE_COMPLETED">Status: File Completed</option>
                  <option value="COMPLETED">Status: Completed</option>
                  <option value="CANCELLED">Status: Cancelled</option>
                  <option value="UNDER_REVIEW">Status: Under Review</option>
                  <option value="SUSPENDED">Status: Suspended</option>
                  <option value="REJECTED">Status: Rejected</option>
                </>
              ) : activeTab === "APPROVED" ? (
                <option value="APPROVED">Status: Approved</option>
              ) : activeTab === "WAITING_FORM13" ? (
                <option value="WAITING_FORM13">Status: Waiting Form 13</option>
              ) : activeTab === "FILE_COMPLETED" ? (
                <option value="FILE_COMPLETED">Status: File Completed</option>
              ) : activeTab === "COMPLETED" ? (
                <option value="COMPLETED">Status: Completed</option>
              ) : activeTab === "CANCELLED" ? (
                <option value="CANCELLED">Status: Cancelled</option>
              ) : activeTab === "UNDER_REVIEW" ? (
                <option value="UNDER_REVIEW">Status: Under Review</option>
              ) : activeTab === "SUSPENDED" ? (
                <option value="SUSPENDED">Status: Suspended</option>
              ) : activeTab === "REJECTED" ? (
                <option value="REJECTED">Status: Rejected</option>
              ) : (
                <>
                  <option value="other">All Other Statuses</option>
                  <option value="COMPLETED">Status: Completed</option>
                  <option value="UNDER_REVIEW">Status: Under Review</option>
                  <option value="SUSPENDED">Status: Suspended</option>
                  <option value="REJECTED">Status: Rejected</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Date Range & Sorting Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-3 border-t border-slate-100 dark:border-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-500">Date Range:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={fromDateFilter}
                onChange={(e) => setFromDateFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={toDateFilter}
                onChange={(e) => setToDateFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            {(fromDateFilter || toDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setFromDateFilter("");
                  setToDateFilter("");
                }}
                className="text-[11px] text-rose-500 hover:text-rose-600 underline font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
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

            {(search || hospitalFilter || branchFilter || statusFilter !== "APPROVED" || fromDateFilter || toDateFilter || activeTab !== "APPROVED") && (
              <button
                onClick={() => {
                  setSearch("");
                  setHospitalFilter("");
                  setBranchFilter("");
                  setFromDateFilter("");
                  setToDateFilter("");
                  handleTabChange("APPROVED");
                }}
                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                Reset All Filters
              </button>
            )}
          </div>
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
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1 py-1 px-3 h-8 cursor-pointer"
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
              variant="outline"
              onClick={exportSelectedCsv}
              className="border-teal-250 text-teal-800 dark:text-teal-300 rounded-xl text-xs gap-1 py-1 px-3 h-8"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Selected
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange("FILE_COMPLETED")}
              disabled={actionLoading}
              className="border-blue-200 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl text-xs gap-1 py-1 px-3 h-8"
              title="Mark selected as File Completed"
            >
              <FileCheck className="w-3.5 h-3.5" /> File Completed
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange("COMPLETED")}
              disabled={actionLoading}
              className="border-purple-200 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-xl text-xs gap-1 py-1 px-3 h-8"
              title="Mark selected as Completed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange("APPROVED")}
              disabled={actionLoading}
              className="border-emerald-200 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl text-xs gap-1 py-1 px-3 h-8"
              title="Mark selected as Approved"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange("SUSPENDED")}
              disabled={actionLoading}
              className="border-amber-250 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-xl text-xs gap-1 py-1 px-3 h-8"
              title="Suspend selected registrations"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Suspend
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange("CANCELLED")}
              disabled={actionLoading}
              className="border-rose-250 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs gap-1 py-1 px-3 h-8"
              title="Cancel selected registrations"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="text-slate-500 rounded-xl text-xs py-1 px-2 h-8 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table UX & Density Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
          <span>Showing <strong className="text-slate-900 dark:text-slate-100">{paginatedRegs.length}</strong> donor registries</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Density Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTableDensity("compact")}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                tableDensity === "compact"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Compact view - fit more rows"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setTableDensity("comfortable")}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                tableDensity === "comfortable"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Comfortable view - default spacing"
            >
              Comfortable
            </button>
          </div>

          {/* Column Visibility Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] rounded-lg gap-1.5 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  <span>Columns</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl text-xs space-y-1">
              <div className="font-bold text-[10px] text-slate-400 uppercase px-2 py-1">Visible Columns</div>
              {[
                { key: "hospital", label: "Assigned Hospital" },
                { key: "doctor", label: "Treating Doctor" },
                { key: "approvedBy", label: "Approved By" },
                { key: "deal", label: "Donor Deal" },
                { key: "payout", label: "Payout Status" },
                { key: "form13", label: "Form 13 & 14 Status" },
                { key: "pickup", label: "Pickup Date" },
                { key: "status", label: "File Status" },
              ].map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none text-[11px] font-medium"
                >
                  <input
                    type="checkbox"
                    checked={(visibleColumns as any)[col.key]}
                    onChange={(e) =>
                      setVisibleColumns((prev) => ({ ...prev, [col.key]: e.target.checked }))
                    }
                    className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <DataTableSkeleton rows={8} density={tableDensity} />
        ) : paginatedRegs.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No approved donor records found.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1280px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 backdrop-blur-md bg-slate-50/95 dark:bg-slate-900/95 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 shadow-2xs">
                <tr>
                  <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} w-10 whitespace-nowrap`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedRegs.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  </th>
                  <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Donor ID</th>
                  <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Donor Name</th>
                  {visibleColumns.hospital && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Assigned Hospital</th>}
                  {visibleColumns.doctor && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Treating Doctor</th>}
                  {visibleColumns.approvedBy && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Approved By</th>}
                  {visibleColumns.deal && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Donor Deal</th>}
                  {visibleColumns.payout && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Payout Status</th>}
                  {visibleColumns.form13 && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Form 13 &amp; 14 Status</th>}
                  {visibleColumns.pickup && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Pickup Date</th>}
                  {visibleColumns.status && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Status</th>}
                  <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} text-right whitespace-nowrap sticky right-0 bg-slate-50/95 dark:bg-slate-900/95 z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {paginatedRegs.map((reg) => {
                  const dealInfo = getDonorDealInfo(reg);
                  const cellPad = tableDensity === "compact" ? "py-2 px-2.5 text-[11px]" : "p-3.5 text-xs";
                  return (
                    <tr key={reg._id} className={`group/row hover:bg-slate-50/50 dark:hover:bg-slate-900/50 ${selectedIds.includes(reg.registrationId) ? "bg-teal-50/20" : ""}`}>
                      <td className={`${cellPad} whitespace-nowrap`}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(reg.registrationId)}
                          onChange={(e) => handleSelectRow(e.target.checked, reg.registrationId)}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                      </td>
                      <td className={`${cellPad} whitespace-nowrap`}>
                        {reg.donorId ? (
                          <div className="inline-flex items-center gap-1.5 font-bold font-mono text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-md text-[11px] border border-teal-200 dark:border-teal-800 whitespace-nowrap">
                            <span>{reg.donorId}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(reg.donorId);
                                toast.success(`Donor ID ${reg.donorId} copied to clipboard`);
                              }}
                              title="Copy Donor ID"
                              className="text-slate-400 hover:text-teal-600 transition-colors cursor-pointer p-0.5 rounded hover:bg-teal-100/50 dark:hover:bg-teal-900/50"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className={`${cellPad} whitespace-nowrap`}>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {reg.personalInfo?.fullName || "—"}
                        </div>
                        <div className="text-[11px] text-slate-500 whitespace-nowrap">
                          {reg.personalInfo?.age ? `${reg.personalInfo.age} Yrs` : ""} {reg.personalInfo?.gender ? `• ${reg.personalInfo.gender}` : ""} {reg.personalInfo?.bloodGroup ? `• ${reg.personalInfo.bloodGroup}` : ""}
                        </div>
                      </td>

                      {/* Hospital */}
                      {visibleColumns.hospital && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          {reg.assignedHospital ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-teal-800 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300 px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1.5 border border-teal-200 dark:border-teal-800 whitespace-nowrap">
                                <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span className="truncate max-w-[150px]" title={reg.assignedHospital.name}>
                                  {reg.assignedHospital.name}
                                </span>
                              </div>

                              {/* Branch Indicator */}
                              {reg.assignedBranch && (
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-teal-700 dark:text-teal-400 pl-1">
                                  <GitBranch className="w-3 h-3 text-teal-600 shrink-0" />
                                  <span className="truncate max-w-[150px]" title={reg.assignedBranch}>
                                    {reg.assignedBranch}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium pl-1">Unassigned</span>
                          )}
                        </td>
                      )}

                      {/* Treating Doctor (Read-only in Egg Donor Management; assigned during registration) */}
                      {visibleColumns.doctor && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          {reg.assignedDoctor ? (
                            <div
                              className="font-semibold text-purple-800 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300 px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1.5 border border-purple-200 dark:border-purple-800 whitespace-nowrap select-none"
                              title={`Treating Doctor: Dr. ${reg.assignedDoctor.replace(/^Dr\.?\s*/i, "")}`}
                            >
                              <Stethoscope className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                Dr. {reg.assignedDoctor.replace(/^Dr\.?\s*/i, "")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px] italic">
                              Unassigned
                            </span>
                          )}
                        </td>
                      )}

                      {/* Approved By */}
                      {visibleColumns.approvedBy && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {reg.reviewedBy ? reg.reviewedBy.split("@")[0] : (reg.status === "APPROVED" ? "Admin" : "—")}
                          </div>
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">
                            {reg.reviewedAt ? new Date(reg.reviewedAt).toLocaleDateString() : (reg.updatedAt ? new Date(reg.updatedAt).toLocaleDateString() : "—")}
                          </div>
                        </td>
                      )}

                      {/* Donor Deal */}
                      {visibleColumns.deal && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          <div className="space-y-0.5">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded text-[11px] inline-block font-mono border border-emerald-200 dark:border-emerald-800">
                              ₹{dealInfo.amount.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-slate-500 capitalize whitespace-nowrap">
                              {dealInfo.category} Deal • {dealInfo.terms}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Payout Status */}
                      {visibleColumns.payout && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          <div className="space-y-1">
                            {dealInfo.isPaid ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(reg)}
                                  className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 px-2.5 py-1 rounded-full text-[10px] border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors shadow-xs whitespace-nowrap"
                                  title="Click to change payout status"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID
                                </button>
                                <div className="mt-1 space-y-0.5 text-[10px] whitespace-nowrap">
                                  <div className="text-slate-600 dark:text-slate-400">
                                    Paid: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDisplayDate(dealInfo.paidAt) || "Recorded"}</span>
                                  </div>
                                  {dealInfo.paidBy && (
                                    <div className="text-slate-500 truncate max-w-[130px]" title={dealInfo.paidBy}>
                                      By: <span className="font-bold text-slate-700 dark:text-slate-300">{dealInfo.paidBy}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPaymentModal(reg)}
                                className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 px-2.5 py-1 rounded-full text-[10px] border border-amber-200 dark:border-amber-800 cursor-pointer transition-colors shadow-xs whitespace-nowrap"
                                title="Click to change payout status"
                              >
                                <Clock className="w-3 h-3 text-amber-600" /> NOT PAID
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Form 13 & 14 Status */}
                      {visibleColumns.form13 && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          {(() => {
                            const form13 = getForm13Info(reg);
                            const form14 = getForm14Info(reg);
                            const { canUpload } = checkCanUploadForm13(reg);

                            return (
                              <div className="space-y-1.5">
                                {/* Form 13 Row */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-500 w-13">Form 13:</span>
                                  {form13.isUploaded ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => openInAppViewer(`Form 13 Statutory Consent PDF - ${reg.personalInfo?.fullName || reg.registrationId}`, form13.url, form13.name, reg)}
                                        className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-2xs"
                                        title="Click to view Form 13 directly inside website"
                                      >
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Uploaded
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenForm13Modal(reg)}
                                        className="text-[9px] text-teal-600 hover:text-teal-800 hover:underline cursor-pointer font-medium"
                                        title="Manage Form 13"
                                      >
                                        Manage
                                      </button>
                                    </div>
                                  ) : canUpload ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenForm13Modal(reg)}
                                      className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200 dark:border-rose-800 cursor-pointer shadow-2xs"
                                      title="Click to upload Form 13 PDF"
                                    >
                                      <Upload className="w-2.5 h-2.5 text-rose-600" /> + Upload
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px] border border-slate-200 dark:border-slate-700 select-none">
                                      <Lock className="w-2.5 h-2.5 text-amber-500" /> Locked
                                    </span>
                                  )}
                                </div>

                                {/* Form 14 Row */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-500 w-13">Form 14:</span>
                                  {form14.isUploaded ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => openInAppViewer(`Form 14 Certificate & Screening PDF - ${reg.personalInfo?.fullName || reg.registrationId}`, form14.url, form14.name, reg)}
                                        className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-2xs"
                                        title="Click to view Form 14 directly inside website"
                                      >
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Uploaded
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenForm14Modal(reg)}
                                        className="text-[9px] text-teal-600 hover:text-teal-800 hover:underline cursor-pointer font-medium"
                                        title="Manage Form 14"
                                      >
                                        Manage
                                      </button>
                                    </div>
                                  ) : canUpload ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenForm14Modal(reg)}
                                      className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200 dark:border-rose-800 cursor-pointer shadow-2xs"
                                      title="Click to upload Form 14 PDF"
                                    >
                                      <Upload className="w-2.5 h-2.5 text-rose-600" /> + Upload
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px] border border-slate-200 dark:border-slate-700 select-none">
                                      <Lock className="w-2.5 h-2.5 text-amber-500" /> Locked
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      )}

                      {/* Pickup Date */}
                      {visibleColumns.pickup && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          <div className="space-y-1.5 text-xs">
                            {formatDisplayDate(reg.pickupDate) ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 font-bold font-mono text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-800 whitespace-nowrap">
                                  <Calendar className="w-3 h-3 text-rose-600" />
                                  {formatDisplayDate(reg.pickupDate)}
                                </span>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPickupModal(reg)}
                                    className="text-[10px] text-teal-600 hover:text-teal-800 hover:underline font-semibold cursor-pointer"
                                  >
                                    Change Date
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                                  <Clock className="w-2.5 h-2.5 text-amber-500" /> Not Set
                                </span>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPickupModal(reg)}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
                                  >
                                    + Set Pickup Date
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          {(() => {
                            const auto = computeEggDonorManagementStatus(reg);
                            return (
                              <div className="flex flex-col gap-1">
                                <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                  <StatusBadge
                                    status={auto.status || reg.status}
                                    label={auto.status === "APPROVED" ? "In Management" : undefined}
                                  />
                                </div>

                                {/* Progression milestone subtext */}
                                <div className="text-[9px] text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap">
                                  {auto.status === "CANCELLED" || reg.status === "CANCELLED" ? (
                                    <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                                      <XCircle className="w-2.5 h-2.5" /> Registration Cancelled
                                    </span>
                                  ) : auto.status === "FILE_COMPLETED" ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" /> File Completed
                                    </span>
                                  ) : auto.status === "WAITING_FORM13" ? (
                                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" /> Awaiting Form 13 PDF
                                    </span>
                                  ) : (
                                    <span title={`Missing: ${auto.missingRequirements.join(", ")}`} className="truncate max-w-[150px]">
                                      Docs: {auto.docsCount}/4 • {auto.isDealPaid ? "Paid" : "Unpaid"}
                                    </span>
                                  )}
                                </div>

                                {reg.updatedBy && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHistoryTargetName(reg.personalInfo?.fullName || reg.registrationId);
                                      loadAudits(reg._id);
                                      setIsHistoryOpen(true);
                                    }}
                                    className="text-[9px] text-slate-500 hover:text-teal-600 block text-left font-semibold cursor-pointer mt-0.5 truncate max-w-[130px] whitespace-nowrap"
                                    title="Click to view history chain"
                                  >
                                    By: <span className="font-bold">{reg.updatedBy}</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      )}

                      {/* Sticky Actions */}
                      <td className={`${cellPad} text-right whitespace-nowrap sticky right-0 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] ${selectedIds.includes(reg.registrationId) ? "bg-[#f5fbfb] dark:bg-slate-900" : "bg-white group-hover/row:bg-slate-50 dark:bg-slate-950 dark:group-hover/row:bg-slate-900"}`}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setSelectedReg(reg); setDetailTab("info"); setIsDetailOpen(true); }}
                            className="h-7 w-7 p-0 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                            title="Quick View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  title="Actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border">
                              <DropdownMenuItem
                                onClick={() => { setSelectedReg(reg); setDetailTab("info"); setIsDetailOpen(true); }}
                                className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                              >
                                <Eye className="w-4 h-4 text-blue-600" /> View Record Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(reg)}
                                className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                              >
                                <Edit3 className="w-4 h-4 text-emerald-600" /> Edit Details & Docs
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { 
                                  setSelectedReg(reg); 
                                  setPrintSections([]); 
                                  setPrintOverrides({}); 
                                  setPrintExtraDocUrl(""); 
                                  setShowEditFields(false);
                                  setIsPrintOpen(true); 
                                }}
                                className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                              >
                                <Printer className="w-4 h-4 text-teal-600" /> Print / PDF Docs
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {reg.status !== "CANCELLED" ? (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const confirmed = await confirmAction({
                                      title: "Cancel Registration",
                                      message: `Are you sure you want to cancel the registration for ${reg.personalInfo?.fullName || reg.registrationId}?`,
                                      confirmText: "Yes, Cancel Registration",
                                      variant: "destructive",
                                    });
                                    if (confirmed) {
                                      handleSingleStatusChange(reg.registrationId, "CANCELLED");
                                    }
                                  }}
                                  className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                                >
                                  <XCircle className="w-4 h-4 text-rose-600" /> Cancel Registration
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const confirmed = await confirmAction({
                                      title: "Re-Approve Registration",
                                      message: `Re-activate / approve registration for ${reg.personalInfo?.fullName || reg.registrationId}?`,
                                      confirmText: "Yes, Re-Approve",
                                      variant: "default",
                                    });
                                    if (confirmed) {
                                      handleSingleStatusChange(reg.registrationId, "APPROVED");
                                    }
                                  }}
                                  className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/40"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Re-Approve Registration
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer controls */}
        {!loading && (registrations.length > 0 || totalCount > 0) && (
          <CustomPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(newSize) => {
              setItemsPerPage(newSize);
              setCurrentPage(1);
            }}
            itemName="registrations"
            loading={loading}
          />
        )}
      </Card>

      {/* DIALOG 1: MAP HOSPITAL & BRANCH */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
              <Building2 className="w-5 h-5 text-teal-600" /> Map Partner Hospital & Branch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign registration: <span className="font-mono font-bold">{selectedReg?.registrationId}</span> to a partner hospital and choose the specific branch center.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Show Current Hospital & Branch Assignment */}
            {selectedReg?.assignedHospital && (
              <div className="p-3.5 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Currently Assigned
                  </span>
                  <Button
                    onClick={() => handleAssignHospital(null, null)}
                    variant="ghost"
                    size="sm"
                    className="h-6 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] rounded-lg p-1 px-2 cursor-pointer"
                    disabled={actionLoading}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Unassign Clinic
                  </Button>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{selectedReg.assignedHospital.name}</span>
                  </div>
                  
                  {selectedReg.assignedBranch ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 pl-6">
                      <GitBranch className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Branch: {selectedReg.assignedBranch}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 pl-6">
                      Branch: Main / Single Center
                    </div>
                  )}

                  {selectedReg.assignedDoctor && (
                    <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium pl-6 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>Treating Doctor: Dr. {selectedReg.assignedDoctor.replace(/^Dr\.?\s*/i, "")}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 pl-6">
                    {selectedReg.assignedHospital.address}
                  </div>
                </div>
              </div>
            )}

            {/* Professional Step-by-Step Dropdown Mapping */}
            <div className="space-y-4 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Choose Partner Clinic & Designated Branch</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {hospitals.length} partner clinics available
                </span>
              </div>

              {/* 1. Hospital Dropdown */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>1. Select Hospital / Clinic: <span className="text-red-500">*</span></span>
                  {tempSelectedHospitalId && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </label>
                <select
                  value={tempSelectedHospitalId || ""}
                  onChange={(e) => {
                    const hospId = e.target.value;
                    setTempSelectedHospitalId(hospId || null);
                    if (!hospId) {
                      setTempSelectedBranch(null);
                      return;
                    }
                    const hosp = hospitals.find(h => h._id === hospId);
                    if (hosp?.branches && hosp.branches.length > 0) {
                      const firstB = hosp.branches[0];
                      const firstDoc = firstB.doctors && firstB.doctors.length > 0
                        ? (typeof firstB.doctors[0] === "string" ? firstB.doctors[0] : firstB.doctors[0].name)
                        : (firstB.doctorName || "");
                      setTempSelectedBranch({
                        branchId: firstB._id || "branch_0",
                        branchName: firstB.branchName,
                        doctorName: firstDoc
                      });
                    } else {
                      setTempSelectedBranch({
                        branchId: "main",
                        branchName: "Main Center",
                        doctorName: hosp?.doctorName || ""
                      });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                >
                  <option value="">-- Choose Partner Hospital / ART Clinic --</option>
                  {hospitals.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.name} {h.shortName ? `(${h.shortName})` : ""} {h.city ? `• ${h.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2 & 3: Branch and Treatment Doctor (enabled once hospital is picked) */}
              {tempSelectedHospitalId && (() => {
                const hosp = hospitals.find(h => h._id === tempSelectedHospitalId);
                const hasBranches = Array.isArray(hosp?.branches) && hosp.branches.length > 0;
                const branches = hosp?.branches || [];
                const currentBranchObj = branches.find((b: any) => 
                  b._id === tempSelectedBranch?.branchId || b.branchName === tempSelectedBranch?.branchName
                ) || (branches.length > 0 ? branches[0] : null);

                return (
                  <div className="space-y-3.5 p-3.5 rounded-2xl bg-teal-50/40 dark:bg-slate-900/60 border border-teal-200/60 dark:border-slate-800">
                    {/* Branch Dropdown */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                          <span>2. Select Branch Center: <span className="text-red-500">*</span></span>
                        </span>
                        {hasBranches && (
                          <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                            {branches.length} {branches.length === 1 ? "branch available" : "branches available"}
                          </span>
                        )}
                      </label>

                      {hasBranches ? (
                        <select
                          value={tempSelectedBranch?.branchId || currentBranchObj?._id || ""}
                          onChange={(e) => {
                            const bId = e.target.value;
                            const b = branches.find((item: any, idx: number) => (item._id || `branch_${idx}`) === bId || item._id === bId);
                            if (b) {
                              const doc = b.doctors && b.doctors.length > 0
                                ? (typeof b.doctors[0] === "string" ? b.doctors[0] : b.doctors[0].name)
                                : (b.doctorName || "");
                              setTempSelectedBranch({
                                branchId: b._id || bId,
                                branchName: b.branchName,
                                doctorName: doc
                              });
                            }
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                        >
                          {branches.map((b: any, bIdx: number) => {
                            const idVal = b._id || `branch_${bIdx}`;
                            const locStr = [b.city, b.state].filter(Boolean).join(", ");
                            return (
                              <option key={idVal} value={idVal}>
                                {b.branchName} {b.branchCode ? `(${b.branchCode})` : ""} {locStr ? `• ${locStr}` : ""}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <div className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Single / Main Center (All operations based at main facility)</span>
                        </div>
                      )}
                    </div>

                    {/* Branch Info Card (Reg No, GST, Address) */}
                    {currentBranchObj && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {currentBranchObj.registrationNumber && (
                            <span className="font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 text-[10px] font-semibold">
                              Reg No: {currentBranchObj.registrationNumber}
                            </span>
                          )}
                          {currentBranchObj.gstNumber && (
                            <span className="font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 text-[10px] font-semibold">
                              GSTIN: {currentBranchObj.gstNumber}
                            </span>
                          )}
                          {currentBranchObj.pickupLocation && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                              OPU: {currentBranchObj.pickupLocation}
                            </span>
                          )}
                        </div>

                        {(currentBranchObj.addressLine1 || currentBranchObj.city || currentBranchObj.state) && (
                          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px] pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {[currentBranchObj.addressLine1, currentBranchObj.city, currentBranchObj.state, currentBranchObj.pincode].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Treatment Doctor Dropdown */}
                    <div className="space-y-1.5 pt-0.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                          <span>3. Treatment Doctor:</span>
                        </span>
                        {tempSelectedBranch?.doctorName && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                            Dr. {tempSelectedBranch.doctorName.replace(/^Dr\.?\s*/i, "")}
                          </span>
                        )}
                      </label>

                      {currentBranchObj?.doctors && currentBranchObj.doctors.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={
                              currentBranchObj.doctors.some((d: any) => {
                                const dName = typeof d === "string" ? d : d.name;
                                return (tempSelectedBranch?.doctorName?.replace(/^Dr\.?\s*/i, "").trim().toLowerCase()) === dName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase();
                              })
                                ? (tempSelectedBranch?.doctorName || "")
                                : "__custom__"
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__custom__") {
                                setTempSelectedBranch(prev => ({
                                  branchId: prev?.branchId || currentBranchObj._id || "branch_0",
                                  branchName: prev?.branchName || currentBranchObj.branchName,
                                  doctorName: ""
                                }));
                              } else {
                                setTempSelectedBranch(prev => ({
                                  branchId: prev?.branchId || currentBranchObj._id || "branch_0",
                                  branchName: prev?.branchName || currentBranchObj.branchName,
                                  doctorName: val
                                }));
                              }
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                          >
                            {currentBranchObj.doctors.map((d: any, dIdx: number) => {
                              const dName = typeof d === "string" ? d : d.name;
                              return (
                                <option key={dIdx} value={dName}>
                                  Dr. {dName.replace(/^Dr\.?\s*/i, "")}
                                </option>
                              );
                            })}
                            <option value="__custom__">+ Enter Custom Doctor Name...</option>
                          </select>

                          {/* Custom doctor name text input if custom selected or none match */}
                          {(!currentBranchObj.doctors.some((d: any) => {
                            const dName = typeof d === "string" ? d : d.name;
                            return (tempSelectedBranch?.doctorName?.replace(/^Dr\.?\s*/i, "").trim().toLowerCase()) === dName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase();
                          })) && (
                            <input
                              type="text"
                              placeholder="Type Treatment Doctor name (e.g. Dr. Sunita Rao)..."
                              value={tempSelectedBranch?.doctorName || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTempSelectedBranch(prev => ({
                                  branchId: prev?.branchId || currentBranchObj._id || "branch_0",
                                  branchName: prev?.branchName || currentBranchObj.branchName,
                                  doctorName: val
                                }));
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter Treatment Doctor name (e.g. Dr. Sunita Rao)..."
                          value={tempSelectedBranch?.doctorName || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempSelectedBranch(prev => ({
                              branchId: prev?.branchId || currentBranchObj?._id || "branch_0",
                              branchName: prev?.branchName || currentBranchObj?.branchName || "Main Center",
                              doctorName: val
                            }));
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t">
              <div className="text-[11px] text-slate-500 truncate">
                {tempSelectedHospitalId ? (
                  <span>
                    Selected: <strong className="text-teal-700 dark:text-teal-300">
                      {hospitals.find(h => h._id === tempSelectedHospitalId)?.name}
                    </strong>
                    {tempSelectedBranch?.branchName && (
                      <> → <span className="font-semibold">{tempSelectedBranch.branchName}</span></>
                    )}
                    {tempSelectedBranch?.doctorName && (
                      <> • <span className="text-purple-600 dark:text-purple-400 font-semibold">Dr. {tempSelectedBranch.doctorName.replace(/^Dr\.?\s*/i, "")}</span></>
                    )}
                  </span>
                ) : (
                  <span>No hospital selected</span>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignOpen(false)}
                  className="rounded-xl text-xs cursor-pointer"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => handleAssignHospital(tempSelectedHospitalId, tempSelectedBranch)}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1 cursor-pointer font-bold"
                  disabled={!tempSelectedHospitalId || actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirm Mapping
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1.5: SET OOCYTE PICKUP DATE */}
      <Dialog open={isPickupModalOpen} onOpenChange={setIsPickupModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-teal-600" /> Set Oocyte Pickup Date
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Donor: <span className="font-semibold text-slate-700 dark:text-slate-300">{pickupReg?.personalInfo?.fullName}</span> ({pickupReg?.registrationId})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Scheduled Pickup Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Scheduled Oocyte Retrieval / Pickup Date:
              </label>
              <Input
                type="date"
                value={pickupDateValue}
                onChange={(e) => setPickupDateValue(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-medium"
              />
            </div>

            {/* Donor OPU Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                Donor OPU / Pickup Location:
              </label>
              <Input
                type="text"
                placeholder="e.g. Apollo Fertility, OT Room / City Clinic"
                value={pickupLocationValue}
                onChange={(e) => setPickupLocationValue(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-medium"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hospital/center operation theatre or clinic where donor OPU retrieval is conducted (appears in Clinic Ledger).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPickupModalOpen(false)}
                className="rounded-xl text-xs"
                disabled={savingPickupDate}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePickupDate}
                disabled={savingPickupDate}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold gap-1 shadow-xs"
              >
                {savingPickupDate ? "Saving..." : "Save Pickup Date"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1.75: UPDATE DONOR PAYOUT STATUS */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Donor Compensation Payout
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Donor: <span className="font-semibold text-slate-700 dark:text-slate-300">{paymentReg?.personalInfo?.fullName}</span>
              {paymentReg?.donorId ? ` • Donor ID: ${paymentReg.donorId}` : ""}
              • Payout Amount: <span className="font-bold text-emerald-600 font-mono">₹{paymentReg ? getDonorDealInfo(paymentReg).amount.toLocaleString() : 0}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Status:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentForm((prev) => ({ ...prev, status: "PAID" }))}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    paymentForm.status === "PAID"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>✓ Paid to Donor</span>
                  {paymentForm.status === "PAID" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentForm((prev) => ({ ...prev, status: "PENDING" }))}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    paymentForm.status === "PENDING"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>⏳ Not Paid / Pending</span>
                  {paymentForm.status === "PENDING" && <Clock className="w-4 h-4 text-amber-600" />}
                </button>
              </div>
            </div>

            {paymentForm.status === "PAID" && (
              <>
                {/* Paid Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Paid Date:
                  </label>
                  <Input
                    type="date"
                    value={paymentForm.paidDate}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paidDate: e.target.value }))}
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                    required
                  />
                  <p className="text-[10px] text-slate-400">
                    The exact date on which compensation was paid out to the donor.
                  </p>
                </div>

                {/* Paid By */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Recorded / Authorizer Name:
                  </label>
                  <Input
                    type="text"
                    value={paymentForm.paidBy}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paidBy: e.target.value }))}
                    placeholder="e.g. Admin / Accounts Officer"
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                    required
                  />
                  <p className="text-[10px] text-slate-400">
                    Staff or admin who authorized or marked this payment.
                  </p>
                </div>

                {/* Payment Reference */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Payment Reference / UTR (Optional):
                  </label>
                  <Input
                    type="text"
                    value={paymentForm.paymentReference}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentReference: e.target.value }))}
                    placeholder="e.g. UPI / NEFT-2026-981729 / Cheque #1293"
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl text-xs"
                disabled={savingPayment}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePayment}
                disabled={savingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
              >
                {savingPayment ? "Saving..." : "Save Payout Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1.8: FORM 13 UPLOAD & PRINT MANAGEMENT */}
      <Dialog open={isForm13ModalOpen} onOpenChange={setIsForm13ModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <FileCheck2 className="w-5 h-5 text-teal-600" /> Upload Form 13
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Donor: <span className="font-semibold text-slate-700 dark:text-slate-300">{form13Reg?.personalInfo?.fullName}</span>
              {form13Reg?.donorId ? ` • Donor ID: ${form13Reg.donorId}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Status indicator notice */}
            {form13Reg && getForm13Info(form13Reg).isUploaded ? (
              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Form 13 Uploaded &amp; Verified</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                      Ready to Print
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => handlePrintForm13(form13Reg)}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5 h-8 font-semibold px-3.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Form 13 PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openInAppViewer("Form 13 Statutory Consent PDF", getForm13Info(form13Reg).url!, getForm13Info(form13Reg).name, form13Reg)}
                      className="border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 rounded-xl text-xs h-8 px-3"
                      title="View PDF inside website"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/50 dark:border-emerald-800/50 pt-2">
                  <div className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span className="truncate max-w-[260px]">{getForm13Info(form13Reg).name}</span>
                  </div>
                  {getForm13Info(form13Reg).uploadedAt && (
                    <div className="text-[10px] text-slate-400">
                      Uploaded on: {new Date(getForm13Info(form13Reg).uploadedAt!).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Form 13 Not Uploaded (Incomplete File)</span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                  Form 13 is statutory and mandatory under the ART Regulations. Without uploading the signed Form 13 PDF, this registration cannot be marked complete. Please choose and upload the signed PDF below.
                </p>
              </div>
            )}

            {/* Upload / Replace Area */}
            {(() => {
              const isUploaded = !!(form13Reg && getForm13Info(form13Reg).isUploaded);
              const { canUpload, hasViralMarker, hasBloodReport, hasInsurance, hasHealthInsurance, hasPickup } = checkCanUploadForm13(form13Reg);

              if (!isUploaded && !canUpload) {
                return (
                  <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Upload Locked — Medical Documents &amp; Pickup Date Required
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Before Form 13 can be uploaded, the following 4 clinical/insurance files and pickup date must be completed:
                    </p>
                    <div className="space-y-1.5 text-xs font-medium">
                      <div className={`flex items-center gap-2 ${hasViralMarker ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasViralMarker ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 1 — Viral Markers Report (HIV, HBsAg, HCV, VDRL)
                      </div>
                      <div className={`flex items-center gap-2 ${hasBloodReport ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasBloodReport ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 2 — Blood Test Report
                      </div>
                      <div className={`flex items-center gap-2 ${hasInsurance ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasInsurance ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 3 — Life / Medical Insurance Policy (Rule 13)
                      </div>
                      <div className={`flex items-center gap-2 ${hasHealthInsurance ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasHealthInsurance ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 4 — Health Insurance Policy
                      </div>
                      <div className={`flex items-center gap-2 ${hasPickup ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasPickup ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 5 — Oocyte Retrieval Pickup Date
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-2 border-t pt-3 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isUploaded ? "Replace Form 13 PDF:" : "Upload Form 13 PDF:"}
                    </label>
                    <span className="text-[10px] text-slate-400">Supported: PDF files up to 10MB</span>
                  </div>

                  <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {uploadingForm13 ? "Uploading and processing Form 13 PDF..." : "Select the completed, signed Form 13 PDF"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Once uploaded, the PDF will be immediately visible here and ready to print.
                      </p>
                    </div>

                    <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm ${uploadingForm13 ? "opacity-60 pointer-events-none" : ""}`}>
                      {uploadingForm13 ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading PDF...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{isUploaded ? "Choose Replacement PDF" : "Choose Form 13 PDF"}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        disabled={uploadingForm13}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadForm13(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* Footer buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              {form13Reg && getForm13Info(form13Reg).isUploaded ? (
                <button
                  type="button"
                  onClick={handleRemoveForm13}
                  disabled={uploadingForm13}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium hover:underline cursor-pointer"
                >
                  Remove Form 13
                </button>
              ) : <div />}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsForm13ModalOpen(false)}
                className="rounded-xl text-xs h-9 px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1.9: FORM 14 UPLOAD & PRINT MANAGEMENT */}
      <Dialog open={isForm14ModalOpen} onOpenChange={setIsForm14ModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <FileCheck2 className="w-5 h-5 text-indigo-600" /> Upload Form 14
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Donor: <span className="font-semibold text-slate-700 dark:text-slate-300">{form14Reg?.personalInfo?.fullName}</span>
              {form14Reg?.donorId ? ` • Donor ID: ${form14Reg.donorId}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Status indicator notice */}
            {form14Reg && getForm14Info(form14Reg).isUploaded ? (
              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Form 14 Uploaded &amp; Verified</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                      Ready to Print
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => handlePrintForm14(form14Reg)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs gap-1.5 h-8 font-semibold px-3.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Form 14 PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openInAppViewer("Form 14 Statutory Certificate & Screening PDF", getForm14Info(form14Reg).url!, getForm14Info(form14Reg).name, form14Reg)}
                      className="border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 rounded-xl text-xs h-8 px-3"
                      title="View PDF inside website"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/50 dark:border-emerald-800/50 pt-2">
                  <div className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="truncate max-w-[260px]">{getForm14Info(form14Reg).name}</span>
                  </div>
                  {getForm14Info(form14Reg).uploadedAt && (
                    <div className="text-[10px] text-slate-400">
                      Uploaded on: {new Date(getForm14Info(form14Reg).uploadedAt!).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Form 14 Not Uploaded (Screening Certificate)</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Form 14 is the statutory Certificate &amp; Screening document under the ART Regulations. Upload the completed and signed Form 14 PDF below.
                </p>
              </div>
            )}

            {/* Upload / Replace Area */}
            {(() => {
              const isUploaded = !!(form14Reg && getForm14Info(form14Reg).isUploaded);
              const { canUpload, hasViralMarker, hasBloodReport, hasInsurance, hasHealthInsurance, hasPickup } = checkCanUploadForm13(form14Reg);

              if (!isUploaded && !canUpload) {
                return (
                  <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Upload Locked — Medical Documents &amp; Pickup Date Required
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Before Form 14 can be uploaded, the following 4 clinical/insurance files and pickup date must be completed:
                    </p>
                    <div className="space-y-1.5 text-xs font-medium">
                      <div className={`flex items-center gap-2 ${hasViralMarker ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasViralMarker ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 1 — Viral Markers Report (HIV, HBsAg, HCV, VDRL)
                      </div>
                      <div className={`flex items-center gap-2 ${hasBloodReport ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasBloodReport ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 2 — Blood Test Report
                      </div>
                      <div className={`flex items-center gap-2 ${hasInsurance ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasInsurance ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 3 — Life / Medical Insurance Policy (Rule 13)
                      </div>
                      <div className={`flex items-center gap-2 ${hasHealthInsurance ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasHealthInsurance ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 4 — Health Insurance Policy
                      </div>
                      <div className={`flex items-center gap-2 ${hasPickup ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300"}`}>
                        {hasPickup ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                        Step 5 — Oocyte Retrieval Pickup Date
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-2 border-t pt-3 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isUploaded ? "Replace Form 14 PDF:" : "Upload Form 14 PDF:"}
                    </label>
                    <span className="text-[10px] text-slate-400">Supported: PDF files up to 10MB</span>
                  </div>

                  <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {uploadingForm14 ? "Uploading and processing Form 14 PDF..." : "Select the completed, signed Form 14 PDF"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Once uploaded, the PDF will be immediately visible here and ready to print.
                      </p>
                    </div>

                    <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm ${uploadingForm14 ? "opacity-60 pointer-events-none" : ""}`}>
                      {uploadingForm14 ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading PDF...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{isUploaded ? "Choose Replacement PDF" : "Choose Form 14 PDF"}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        disabled={uploadingForm14}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadForm14(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* Footer buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
              {form14Reg && getForm14Info(form14Reg).isUploaded ? (
                <button
                  type="button"
                  onClick={handleRemoveForm14}
                  disabled={uploadingForm14}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium hover:underline cursor-pointer"
                >
                  Remove Form 14
                </button>
              ) : <div />}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsForm14ModalOpen(false)}
                className="rounded-xl text-xs h-9 px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: VIEW REGISTRATION DETAILS (Egg Donor Management Hub) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl rounded-3xl overflow-y-auto max-h-[88vh] border shadow-2xl p-6 sm:p-8">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-100">
                <BookmarkCheck className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Egg Donor Management File
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Manage clinical viral markers &amp; blood tests, Rule 13 insurance, donor compensation payouts, and statutory Form 13 clearance.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedReg && (() => {
            const autoInfo = computeEggDonorManagementStatus(selectedReg);
            const form13Info = getForm13Info(selectedReg);
            const form14Info = getForm14Info(selectedReg);
            const dealInfo = getDonorDealInfo(selectedReg);
            const isRegistry = selectedReg.hospitalDealType === "registry" || selectedReg.clinicDeal?.donorCategory === "registry" || dealInfo.category === "registry";

            const managementDocs = [
              {
                key: "viralMarkersReport" as const,
                label: "Viral Markers Report (HIV, HBsAg, HCV, VDRL)",
                doc: selectedReg.labReports?.viralMarkersReport ||
                  (Array.isArray(selectedReg.labReports?.viralMarkers) ? selectedReg.labReports?.viralMarkers[0] : selectedReg.labReports?.viralMarkers),
                icon: Activity,
                color: "text-indigo-600",
              },
              {
                key: "bloodReport" as const,
                label: "Blood Test Report (CBC & Grouping)",
                doc: selectedReg.labReports?.bloodReport,
                icon: Heart,
                color: "text-rose-600",
              },
              {
                key: "insurance" as const,
                label: "Life / Medical Insurance Policy (Rule 13)",
                doc: selectedReg.labReports?.insurance || selectedReg.documents?.insurance,
                icon: ShieldCheck,
                color: "text-emerald-600",
              },
              {
                key: "healthInsurance" as const,
                label: "Health Insurance Policy",
                doc: selectedReg.labReports?.healthInsurance,
                icon: ShieldCheck,
                color: "text-teal-600",
              },
            ];

            const allManagementDocsUploaded = managementDocs.every((d) => !!d.doc?.url);

            return (
              <div className="space-y-5 py-2">
                {/* ─── Profile Header ────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-2xl border justify-between">
                  <div className="flex items-center gap-3.5">
                    {selectedReg.documents?.passportPhoto?.url ? (
                      <img
                        alt="Donor Photo"
                        src={selectedReg.documents.passportPhoto.url}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border">
                        No Photo
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-foreground">
                          {selectedReg.personalInfo?.fullName}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200">
                          {selectedReg.personalInfo?.bloodGroup || "Blood Group —"}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border flex items-center gap-1.5 ${
                          autoInfo.status === "FILE_COMPLETED" || autoInfo.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : autoInfo.status === "WAITING_FORM13"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : autoInfo.status === "CANCELLED" || selectedReg.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          Status: {(autoInfo.status || selectedReg.status || "").replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center flex-wrap gap-1.5">
                        <span>ID: <strong className="font-mono text-foreground">{selectedReg.registrationId}</strong></span>
                        {selectedReg.donorId && (
                          <span>• Donor ID: <strong className="font-mono text-rose-600">{selectedReg.donorId}</strong></span>
                        )}
                        <span>• Hospital: <strong className="text-foreground">{selectedReg.assignedHospital?.name || "Unassigned"}</strong></span>
                        {selectedReg.assignedHospital && selectedReg.assignedBranch && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200/60">
                            <GitBranch className="w-3 h-3 text-teal-600" />
                            {selectedReg.assignedBranch}
                            {selectedReg.assignedDoctor && (
                              <span className="text-slate-400 font-normal">
                                • Dr. {selectedReg.assignedDoctor.replace(/^Dr\.?\s*/i, "")}
                              </span>
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPrintOpen(true)}
                      className="h-8 rounded-xl text-xs gap-1.5 shadow-xs border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-600" /> Print Documents &amp; Forms
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { handleOpenEdit(selectedReg); setIsDetailOpen(false); }}
                      className="h-8 text-xs text-emerald-600 border-emerald-250 hover:bg-emerald-50 rounded-xl gap-1 shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Record
                    </Button>
                    {selectedReg.status !== "CANCELLED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const confirmed = await confirmAction({
                            title: "Cancel Registration",
                            message: `Are you sure you want to cancel the registration for ${selectedReg.personalInfo?.fullName || selectedReg.registrationId}?`,
                            confirmText: "Yes, Cancel Registration",
                            variant: "destructive",
                          });
                          if (confirmed) {
                            await handleSingleStatusChange(selectedReg.registrationId, "CANCELLED");
                            setSelectedReg((prev: any) => prev ? { ...prev, status: "CANCELLED" } : null);
                          }
                        }}
                        className="h-8 text-xs text-rose-600 border-rose-250 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl gap-1 shadow-xs"
                        title="Cancel registration"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel File
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const confirmed = await confirmAction({
                            title: "Re-Approve Registration",
                            message: `Re-activate / approve registration for ${selectedReg.personalInfo?.fullName || selectedReg.registrationId}?`,
                            confirmText: "Yes, Re-Approve",
                            variant: "default",
                          });
                          if (confirmed) {
                            await handleSingleStatusChange(selectedReg.registrationId, "APPROVED");
                            setSelectedReg((prev: any) => prev ? { ...prev, status: "APPROVED" } : null);
                          }
                        }}
                        className="h-8 text-xs text-emerald-600 border-emerald-250 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl gap-1 shadow-xs"
                        title="Re-approve registration"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Re-Approve File
                      </Button>
                    )}
                  </div>
                </div>

                {/* ─── Tabs Navigation ───────────────────────────────────────── */}
                <div className="flex border-b border-border text-xs font-semibold overflow-x-auto gap-1">
                  <button
                    onClick={() => setDetailTab("management")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "management"
                        ? "border-rose-600 text-rose-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Egg Donor Management Hub
                  </button>
                  <button
                    onClick={() => setDetailTab("info")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "info"
                        ? "border-rose-600 text-rose-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Applicant &amp; Husband Details
                  </button>
                  <button
                    onClick={() => setDetailTab("medical")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "medical"
                        ? "border-rose-600 text-rose-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Medical History
                  </button>
                  <button
                    onClick={() => setDetailTab("history")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "history"
                        ? "border-rose-600 text-rose-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Hospital History
                  </button>
                  <button
                    onClick={() => setDetailTab("audits")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "audits"
                        ? "border-rose-600 text-rose-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <History className="w-3.5 h-3.5" /> Audit Logs
                  </button>
                </div>

                {/* ─── TAB CONTENT ───────────────────────────────────────────── */}
                {detailTab === "management" && (
                  <div className="space-y-5">
                    {/* 1. Progress Status Stepper */}
                    <div className="p-4 rounded-2xl border bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-900/30 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Management Stage Progression (Automated)
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Status automatically transitions based on clinical tests, compensation payout, pickup date, and Form 13.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold">Automatic Status:</span>
                          <span
                            className={`font-bold text-[11px] px-3 py-1 rounded-full border uppercase inline-flex items-center gap-1.5 shadow-xs ${
                              autoInfo.status === "FILE_COMPLETED" || autoInfo.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
                                : autoInfo.status === "WAITING_FORM13"
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                                : "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            {autoInfo.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                        <div className="p-2.5 rounded-xl border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> 1. Registration &amp; Affidavit
                          </div>
                          <p className="text-[10px] text-muted-foreground pl-5 mt-0.5">Application verified &amp; approved</p>
                        </div>

                        <div className={`p-2.5 rounded-xl border transition-all ${
                          autoInfo.isEligibleForWaitingForm13
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200"
                            : "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 ring-1 ring-amber-300"
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold text-[11px]">
                            {autoInfo.isEligibleForWaitingForm13 ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span className={autoInfo.isEligibleForWaitingForm13 ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}>
                              2. Tests, Insurance &amp; Payout
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground pl-5 mt-0.5">
                            {autoInfo.isEligibleForWaitingForm13
                              ? "All 4 tests, insurance & payout complete"
                              : `Docs: ${autoInfo.docsCount}/4 • ${autoInfo.isDealPaid ? "Payout Settled" : "Payout Pending"} • ${autoInfo.hasPickupDate ? "Pickup Set" : "Pickup Unset"}`}
                          </p>
                        </div>

                        <div className={`p-2.5 rounded-xl border transition-all ${
                          autoInfo.status === "FILE_COMPLETED"
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200"
                            : autoInfo.isEligibleForWaitingForm13
                            ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 ring-1 ring-amber-300"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200"
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold text-[11px]">
                            {autoInfo.status === "FILE_COMPLETED" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : autoInfo.isEligibleForWaitingForm13 ? (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span className={
                              autoInfo.status === "FILE_COMPLETED"
                                ? "text-emerald-800 dark:text-emerald-300"
                                : autoInfo.isEligibleForWaitingForm13
                                ? "text-amber-800 dark:text-amber-300"
                                : "text-muted-foreground"
                            }>
                              3. Statutory Form 13 PDF
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground pl-5 mt-0.5">
                            {autoInfo.status === "FILE_COMPLETED"
                              ? "Form 13 uploaded • File Completed"
                              : autoInfo.isEligibleForWaitingForm13
                              ? "Prerequisites met • Waiting Form 13"
                              : "Pending prerequisites completion"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. The 4 Required Clinical & Management Documents */}
                    <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-rose-600" />
                            Required Clinical Tests &amp; Insurance Policies (4 Key Documents)
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Upload Viral Markers, Blood Test Report, Life Insurance Policy (ART Rule 13), and Health Insurance Policy.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { handleOpenEdit(selectedReg); setEditTab("labReports"); setIsDetailOpen(false); }}
                          className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg gap-1"
                        >
                          <Upload className="w-3 h-3" /> Bulk Document Manager
                        </Button>
                      </div>

                      {/* Certificate (Rule 10) Status & Issuance Bar */}
                      {/* {(() => {
                        const viralCheck = checkViralMarkersEntered(selectedReg);
                        if (viralCheck.certificateIssued) {
                          return (
                            <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                                    Certificate (Rule 10) Officially Issued
                                  </span>
                                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                                    Verified screening negative for HIV, HBV, HCV, and VDRL (Syphilis) under ART Rules, 2022.
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsPrintOpen(true)}
                                className="h-7 text-xs border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg gap-1 font-semibold shrink-0"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print Certificate
                              </Button>
                            </div>
                          );
                        }

                        if (viralCheck.isEntered) {
                          return (
                            <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <div>
                                  <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                                    Viral Markers Entered • Certificate (Rule 10) Ready to Issue
                                  </span>
                                  <p className="text-[10px] text-amber-800 dark:text-amber-300">
                                    Viral markers are present. Click Issue Certificate to enable Rule 10 certification for printing.
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const regId = selectedReg.registrationId || selectedReg._id;
                                    await patchAdminRegistrationFieldsAction(regId, {
                                      certificateIssued: true,
                                      certificateIssuedAt: new Date(),
                                      certificateIssuedBy: "Admin",
                                    });
                                    const updated = { ...selectedReg, certificateIssued: true, certificateIssuedAt: new Date() };
                                    setSelectedReg(updated);
                                    setRegistrations((prev: any[]) => prev.map((r) => r.registrationId === regId ? { ...r, certificateIssued: true } : r));
                                    toast.success("Certificate in term of Rule 10 issued successfully!");
                                  } catch (e: any) {
                                    toast.error("Failed to issue certificate: " + (e as any)?.message);
                                  }
                                }}
                                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1 font-bold shadow-xs shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" /> Issue Certificate (Rule 10)
                              </Button>
                            </div>
                          );
                        }

                        return (
                          <div className="p-2.5 rounded-xl border border-dashed text-[11px] text-muted-foreground flex items-center gap-2 bg-muted/20">
                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>
                              Enter/upload Viral Markers Report (HIV, HBsAg, HCV, VDRL) to enable Certificate (Rule 10) issuance.
                            </span>
                          </div>
                        );
                      })()} */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {managementDocs.map((item, idx) => {
                          const hasDoc = !!item.doc?.url;
                          const Icon = item.icon;

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                                hasDoc
                                  ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                                  : "bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 border-dashed"
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                                    <Icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                                    <span className="truncate">{item.label}</span>
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    hasDoc
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}>
                                    {hasDoc ? "Uploaded ✓" : "Missing ✗"}
                                  </span>
                                </div>

                                {hasDoc ? (
                                  <div className="flex items-center justify-between pt-1">
                                    <button
                                      type="button"
                                      onClick={() => openInAppViewer(item.label, item.doc.url, item.doc.fileName || `${item.key}.pdf`, selectedReg)}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3" /> View Uploaded Report
                                    </button>
                                    {item.doc.fileName && (
                                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                                        {item.doc.fileName}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-muted-foreground italic">
                                    Document has not been uploaded yet.
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 mt-2 border-t border-border/50">
                                <FileUploadField
                                  label={hasDoc ? "Replace Document" : "Upload Document"}
                                  value={(item.doc as any) || undefined}
                                  folder="labReports"
                                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                                  onChange={(fileRef: any) => handleManagementDocUpload(item.key, fileRef)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Certificate (Rule 10) Status & Issuance Bar */}
                      {(() => {
                        const viralCheck = checkViralMarkersEntered(selectedReg);
                        if (viralCheck.certificateIssued) {
                          return (
                            <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                                    Certificate (Rule 10) Officially Issued
                                  </span>
                                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                                    Verified screening negative for HIV, HBV, HCV, and VDRL (Syphilis) under ART Rules, 2022.
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsPrintOpen(true)}
                                className="h-7 text-xs border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg gap-1 font-semibold shrink-0"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print Certificate
                              </Button>
                            </div>
                          );
                        }

                        return (
                          <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <div>
                                <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                                  Certificate (Rule 10) Ready to Issue
                                </span>
                                <p className="text-[10px] text-amber-800 dark:text-amber-300">
                                  Click Issue Certificate to enable Rule 10 certification for printing.
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  const regId = selectedReg.registrationId || selectedReg._id;
                                  await patchAdminRegistrationFieldsAction(regId, {
                                    certificateIssued: true,
                                    certificateIssuedAt: new Date(),
                                    certificateIssuedBy: "Admin",
                                  });
                                  const updated = { ...selectedReg, certificateIssued: true, certificateIssuedAt: new Date() };
                                  setSelectedReg(updated);
                                  setRegistrations((prev: any[]) => prev.map((r) => r.registrationId === regId ? { ...r, certificateIssued: true } : r));
                                  toast.success("Certificate in term of Rule 10 issued successfully!");
                                } catch (e: any) {
                                  toast.error("Failed to issue certificate: " + (e as any)?.message);
                                }
                              }}
                              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1 font-bold shadow-xs shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" /> Issue Certificate (Rule 10)
                            </Button>
                          </div>
                        );
                      })()}

                    {/* 3. Donor Compensation & Payment Card */}
                    <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Donor Compensation &amp; Payout Tracking
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {isRegistry ? (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                              🏛️ Registry (No Payout)
                            </span>
                          ) : dealInfo.isPaid ? (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID IN FULL
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> PENDING PAYOUT
                            </span>
                          )}

                          {!isRegistry && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPaymentModal(selectedReg)}
                              className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg gap-1"
                            >
                              <CreditCard className="w-3 h-3" /> {dealInfo.isPaid ? "Edit Payout" : "Record Payment"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {isRegistry ? (
                        <div className="p-3 bg-teal-50/60 dark:bg-teal-950/20 rounded-xl border border-teal-200 text-xs text-teal-800 dark:text-teal-300">
                          This donor is assigned under the <strong>Registry Tier</strong> (Direct ART Bank Registry Allocation). No donor deal or compensation payout applies.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-background border space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Compensation Deal</span>
                            <div className="font-bold text-emerald-600 font-mono text-base">
                              ₹{dealInfo.amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground capitalize">
                              {dealInfo.category} Tier • {dealInfo.terms || "Full on retrieval"}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-background border space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Payment Status</span>
                            <div className="font-bold text-foreground text-sm">
                              {dealInfo.isPaid ? "Payment Completed" : "Payment Pending"}
                            </div>
                            {dealInfo.isPaid && (
                              <div className="text-[10px] text-muted-foreground space-y-0.5 pt-0.5">
                                <div>Ref: <span className="font-mono text-foreground font-semibold">{dealInfo.paymentReference || "—"}</span></div>
                                <div>Date: <span className="font-semibold text-foreground">{formatDisplayDate(dealInfo.paidAt) || "Recorded"}</span></div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Oocyte Retrieval Pickup Date */}
                    <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Oocyte Retrieval &amp; Pickup Date
                          </h4>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPickupModal(selectedReg)}
                          className="h-7 text-xs text-teal-700 border-teal-200 hover:bg-teal-50 rounded-lg gap-1"
                        >
                          <Calendar className="w-3 h-3" /> {selectedReg.pickupDate ? "Change Pickup Date" : "Set Pickup Date"}
                        </Button>
                      </div>

                      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        selectedReg.pickupDate
                          ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200"
                          : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 border-dashed"
                      }`}>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Scheduled Oocyte Pickup Date
                          </span>
                          <div className={`text-base font-bold font-mono ${selectedReg.pickupDate ? "text-rose-600 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"}`}>
                            {formatDisplayDate(selectedReg.pickupDate) || "Date Not Set — Click button to schedule"}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {selectedReg.pickupDate
                              ? "Oocyte pickup date is confirmed and recorded for clinical retrieval."
                              : "Mandatory step: Oocyte pickup date must be entered before the statutory Form 13 PDF can be uploaded."}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleOpenPickupModal(selectedReg)}
                          className={`rounded-xl text-xs font-semibold h-8 gap-1.5 shrink-0 ${
                            selectedReg.pickupDate
                              ? "bg-rose-600 hover:bg-rose-700 text-white"
                              : "bg-teal-600 hover:bg-teal-700 text-white"
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {selectedReg.pickupDate ? "Modify Date" : "Enter Pickup Date"}
                        </Button>
                      </div>
                    </div>

                    {/* 5. Statutory Form 13 Clearance & Completion */}
                    <div className={`p-4 rounded-2xl border space-y-3 shadow-xs ${
                      form13Info.isUploaded
                        ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <FileCheck2 className="w-4 h-4 text-teal-600" />
                            Statutory Form 13 Clearance (Indian ART Act Compliance)
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Form 13 is the mandatory Consent &amp; Fitness Certificate issued by the registered ART Clinic.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {form13Info.isUploaded ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Form 13 Uploaded ✓
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Form 13 Required
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1">
                        <div>
                          {form13Info.isUploaded ? (
                            <div className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                              <span>File Name: <strong>{form13Info.name}</strong></span>
                              {form13Info.uploadedAt && (
                                <span className="text-[10px] text-muted-foreground">({new Date(form13Info.uploadedAt).toLocaleDateString()})</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-600 dark:text-slate-400">
                              Upload the signed Form 13 PDF from the clinic to complete this file and move to Completed Files.
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {form13Info.isUploaded ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openInAppViewer("Form 13 Statutory PDF", form13Info.url!, form13Info.name, selectedReg)}
                                className="h-8 rounded-xl text-xs font-semibold text-teal-800 hover:bg-teal-50 border-teal-200 gap-1.5 shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Form 13
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handlePrintForm13(selectedReg)}
                                className="h-8 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-xs"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print Form 13 PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenForm13Modal(selectedReg)}
                                className="h-8 rounded-xl text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Replace PDF
                              </Button>
                            </>
                          ) : (() => {
                            const hasViralMarker = !!(selectedReg.labReports?.viralMarkersReport?.url || (Array.isArray(selectedReg.labReports?.viralMarkers) ? selectedReg.labReports?.viralMarkers[0]?.url : selectedReg.labReports?.viralMarkers?.url));
                            const hasBloodReport = !!(selectedReg.labReports?.bloodReport?.url);
                            const hasInsurance = !!(selectedReg.labReports?.insurance?.url || selectedReg.documents?.insurance?.url || selectedReg.labReports?.lifeInsurance?.url);
                            const hasHealthInsurance = !!(selectedReg.labReports?.healthInsurance?.url);
                            const hasPickup = !!(selectedReg.pickupDate);
                            const canUploadForm13 = hasViralMarker && hasBloodReport && hasInsurance && hasHealthInsurance && hasPickup;

                            if (!canUploadForm13) {
                              return (
                                <div className="space-y-3 w-full">
                                  <div className="p-3 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Form 13 Upload Locked</p>
                                    </div>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400">Complete all 4 required files &amp; pickup date before uploading Form 13:</p>
                                    <div className="space-y-1">
                                      <div className={`flex items-center gap-2 text-[11px] font-semibold ${ hasViralMarker ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300" }`}>
                                        {hasViralMarker ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                        Step 1 — Viral Markers Report (HIV, HBsAg, HCV, VDRL)
                                      </div>
                                      <div className={`flex items-center gap-2 text-[11px] font-semibold ${ hasBloodReport ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300" }`}>
                                        {hasBloodReport ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                        Step 2 — Blood Test Report
                                      </div>
                                      <div className={`flex items-center gap-2 text-[11px] font-semibold ${ hasInsurance ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300" }`}>
                                        {hasInsurance ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                        Step 3 — Life / Medical Insurance Policy (Rule 13)
                                      </div>
                                      <div className={`flex items-center gap-2 text-[11px] font-semibold ${ hasHealthInsurance ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300" }`}>
                                        {hasHealthInsurance ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                        Step 4 — Health Insurance Policy (Mandatory)
                                      </div>
                                      <div className={`flex items-center gap-2 text-[11px] font-semibold ${ hasPickup ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300" }`}>
                                        {hasPickup ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                        Step 5 — Pickup Date (via Schedule dates)
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <Button
                                size="sm"
                                onClick={() => handleOpenForm13Modal(selectedReg)}
                                className="h-8 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs"
                              >
                                <Upload className="w-3.5 h-3.5" /> Upload Form 13 PDF
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 6. Statutory Form 14 Clearance (Certificate & Screening) */}
                    <div className={`p-4 rounded-2xl border space-y-3 shadow-xs ${
                      form14Info.isUploaded
                        ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <FileCheck2 className="w-4 h-4 text-indigo-600" />
                            Statutory Form 14 Certificate (Screening &amp; Clearance)
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Form 14 is the statutory Certificate &amp; Screening document under the ART Regulations.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {form14Info.isUploaded ? (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Form 14 Uploaded ✓
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Form 14 Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1">
                        <div>
                          {form14Info.isUploaded ? (
                            <div className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                              <span>File Name: <strong>{form14Info.name}</strong></span>
                              {form14Info.uploadedAt && (
                                <span className="text-[10px] text-muted-foreground">({new Date(form14Info.uploadedAt).toLocaleDateString()})</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-600 dark:text-slate-400">
                              Upload the signed Form 14 screening certificate from the clinic.
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {form14Info.isUploaded ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openInAppViewer("Form 14 Statutory PDF", form14Info.url!, form14Info.name, selectedReg)}
                                className="h-8 rounded-xl text-xs font-semibold text-indigo-800 hover:bg-indigo-50 border-indigo-200 gap-1.5 shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Form 14
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handlePrintForm14(selectedReg)}
                                className="h-8 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print Form 14 PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenForm14Modal(selectedReg)}
                                className="h-8 rounded-xl text-xs text-slate-700 hover:bg-slate-50"
                              >
                                Replace PDF
                              </Button>
                            </>
                          ) : (() => {
                            const hasViralMarker = !!(selectedReg.labReports?.viralMarkersReport?.url || (Array.isArray(selectedReg.labReports?.viralMarkers) ? selectedReg.labReports?.viralMarkers[0]?.url : selectedReg.labReports?.viralMarkers?.url));
                            const hasBloodReport = !!(selectedReg.labReports?.bloodReport?.url);
                            const hasInsurance = !!(selectedReg.labReports?.insurance?.url || selectedReg.documents?.insurance?.url || selectedReg.labReports?.lifeInsurance?.url);
                            const hasHealthInsurance = !!(selectedReg.labReports?.healthInsurance?.url);
                            const hasPickup = !!(selectedReg.pickupDate);
                            const canUploadForm14 = hasViralMarker && hasBloodReport && hasInsurance && hasHealthInsurance && hasPickup;

                            if (!canUploadForm14) {
                              return (
                                <div className="space-y-3 w-full">
                                  <div className="p-3 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Form 14 Upload Locked</p>
                                    </div>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400">Complete all 4 required files &amp; pickup date before uploading Form 14:</p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <Button
                                size="sm"
                                onClick={() => handleOpenForm14Modal(selectedReg)}
                                className="h-8 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs"
                              >
                                <Upload className="w-3.5 h-3.5" /> Upload Form 14 PDF
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── INFO TAB ──────────────────────────────────────────────── */}
                {detailTab === "info" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-4 rounded-2xl border text-xs">
                      <div><span className="text-muted-foreground block text-[10px]">Full Name:</span> <span className="font-bold text-foreground text-sm">{selectedReg.personalInfo?.fullName}</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">Husband Name:</span> <span className="font-bold text-foreground">{selectedReg.personalInfo?.husbandName || selectedReg.personalInfo?.spouseName || "—"}</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">Blood Group:</span> <span className="font-bold text-rose-600">{selectedReg.personalInfo?.bloodGroup || "—"}</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">Age / Gender:</span> <span className="font-semibold">{selectedReg.personalInfo?.age} Yrs / Female</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">Aadhaar:</span> <span className="font-mono">{selectedReg.personalInfo?.aadhaarNumber || "—"}</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">PAN:</span> <span className="font-mono">{selectedReg.personalInfo?.panNumber || "—"}</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">Education:</span> <span>{selectedReg.personalInfo?.education || "—"}</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">Occupation:</span> <span>{selectedReg.personalInfo?.occupation || "—"}</span></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl border bg-background space-y-1.5">
                        <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-600" /> Contact Details
                        </div>
                        <div><span className="text-muted-foreground">Mobile:</span> <span className="font-mono font-semibold">{selectedReg.contactInfo?.mobileNumber || "—"}</span></div>
                        <div><span className="text-muted-foreground">Email:</span> <span>{selectedReg.contactInfo?.emailAddress || "—"}</span></div>
                        <div><span className="text-muted-foreground">Emergency Contact:</span> {selectedReg.emergencyContact?.contactPersonName} ({selectedReg.emergencyContact?.relationship || "Husband"})</div>
                      </div>

                      <div className="p-3.5 rounded-xl border bg-background space-y-1.5">
                        <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-600" /> Residential Address
                        </div>
                        <div>{selectedReg.contactInfo?.currentAddress || "—"}</div>
                        <div className="text-muted-foreground">{selectedReg.contactInfo?.city}, {selectedReg.contactInfo?.state} - {selectedReg.contactInfo?.pincode}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── MEDICAL TAB ───────────────────────────────────────────── */}
                {detailTab === "medical" && (
                  <div className="space-y-4">
                    <div className="bg-muted/40 p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-muted-foreground">Allergies:</div>
                        <div className="font-semibold text-foreground">{selectedReg.medicalInfo?.allergies || "None declared"}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-muted-foreground">Current Medications:</div>
                        <div className="font-semibold text-foreground">{selectedReg.medicalInfo?.currentMedications || "None declared"}</div>
                      </div>
                      <div className="space-y-1 sm:col-span-2 border-t pt-2">
                        <div className="font-bold text-muted-foreground">Clinical History &amp; Notes:</div>
                        <div className="italic text-foreground">{selectedReg.medicalInfo?.medicalHistory || "No additional medical history notes."}</div>
                      </div>
                      <div className="space-y-1 sm:col-span-2 border-t pt-2 grid grid-cols-2 gap-2">
                        <div><span className="font-bold text-muted-foreground">Diabetes:</span> {selectedReg.medicalInfo?.diabetes || "No"}</div>
                        <div><span className="font-bold text-muted-foreground">Hypertension:</span> {selectedReg.medicalInfo?.hypertension || "No"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── HOSPITAL HISTORY TAB ──────────────────────────────────── */}
                {detailTab === "history" && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {!selectedReg.assignmentHistory || selectedReg.assignmentHistory.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs">No hospital reassignment logs registered for this donor.</div>
                    ) : (
                      <div className="divide-y border rounded-xl">
                        {selectedReg.assignmentHistory.map((item: any, idx: number) => {
                          const oldH = hospitals.find(h => h._id === item.oldHospital)?.name || "Unassigned";
                          const newH = hospitals.find(h => h._id === item.newHospital)?.name || "Unassigned";
                          return (
                            <div key={idx} className="p-3 space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <div className="font-semibold text-foreground">
                                  Moved from <span className="font-bold">{oldH}</span> → <span className="font-bold text-teal-600">{newH}</span>
                                </div>
                                <div className="text-muted-foreground text-[10px] font-mono">
                                  {new Date(item.assignedAt).toLocaleString()}
                                </div>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Assigned by: <span className="font-semibold">{item.assignedBy}</span> | Reason: <span className="italic">"{item.reason || "—"}"</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── AUDIT TRAIL TAB ───────────────────────────────────────── */}
                {detailTab === "audits" && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {auditsLoading ? (
                      <div className="text-center py-6 text-muted-foreground text-xs">Loading audit trail...</div>
                    ) : auditLogs.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs">No audit records registered for this record.</div>
                    ) : (
                      <div className="divide-y border rounded-xl">
                        {auditLogs.map((log: any) => (
                          <div key={log._id} className="p-3 flex justify-between items-center text-[10px]">
                            <div className="space-y-1">
                              <div className="font-semibold text-foreground">
                                {log.action} <span className="text-[9px] text-muted-foreground font-normal">(IP: {log.ipAddress})</span>
                              </div>
                              {log.details && (
                                <div className="text-muted-foreground text-[9px]">Details: {log.details}</div>
                              )}
                              <div className="text-muted-foreground text-[9px]">
                                Performed by: {log.performedBy}
                              </div>
                            </div>
                            <div className="text-muted-foreground font-mono text-right shrink-0 ml-3">
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: PRINT CONFIGURATION */}
      <DonorPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        registration={selectedReg}
        onRegistrationUpdated={(updated) => {
          setSelectedReg((prev: any) =>
            prev?.registrationId === updated?.registrationId ? { ...prev, ...updated } : prev
          );
          setRegistrations((prev) =>
            prev.map((r) =>
              r.registrationId === updated.registrationId ? { ...r, ...updated } : r
            )
          );
        }}
      />

      {/* DIALOG 4: BULK ASSIGN HOSPITAL & BRANCH */}
      <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base font-bold">
              <Building2 className="w-5 h-5 text-teal-600" /> Bulk Clinic & Branch Mapping
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign <strong className="text-teal-700 dark:text-teal-300 font-bold">{selectedIds.length}</strong> selected applications to a single clinic and designated branch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Professional Step-by-Step Dropdown Mapping for Bulk Assignment */}
            <div className="space-y-4 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Choose Destination Clinic & Branch</span>
                </span>
                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold">
                  Targeting {selectedIds.length} donors
                </span>
              </div>

              {/* 1. Hospital Dropdown */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>1. Select Hospital / Clinic: <span className="text-red-500">*</span></span>
                  {bulkSelectedHospitalId && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </label>
                <select
                  value={bulkSelectedHospitalId || ""}
                  onChange={(e) => {
                    const hospId = e.target.value;
                    setBulkSelectedHospitalId(hospId || null);
                    if (!hospId) {
                      setBulkSelectedBranch(null);
                      return;
                    }
                    const hosp = hospitals.find(h => h._id === hospId);
                    if (hosp?.branches && hosp.branches.length > 0) {
                      const firstB = hosp.branches[0];
                      const firstDoc = firstB.doctors && firstB.doctors.length > 0
                        ? (typeof firstB.doctors[0] === "string" ? firstB.doctors[0] : firstB.doctors[0].name)
                        : (firstB.doctorName || "");
                      setBulkSelectedBranch({
                        branchId: firstB._id || "branch_0",
                        branchName: firstB.branchName,
                        doctorName: firstDoc
                      });
                    } else {
                      setBulkSelectedBranch({
                        branchId: "main",
                        branchName: "Main Center",
                        doctorName: hosp?.doctorName || ""
                      });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                >
                  <option value="">-- Choose Partner Hospital / ART Clinic --</option>
                  {hospitals.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.name} {h.shortName ? `(${h.shortName})` : ""} {h.city ? `• ${h.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2 & 3: Branch and Treatment Doctor for Bulk */}
              {bulkSelectedHospitalId && (() => {
                const hosp = hospitals.find(h => h._id === bulkSelectedHospitalId);
                const hasBranches = Array.isArray(hosp?.branches) && hosp.branches.length > 0;
                const branches = hosp?.branches || [];
                const currentBranchObj = branches.find((b: any) => 
                  b._id === bulkSelectedBranch?.branchId || b.branchName === bulkSelectedBranch?.branchName
                ) || (branches.length > 0 ? branches[0] : null);

                return (
                  <div className="space-y-3.5 p-3.5 rounded-2xl bg-teal-50/40 dark:bg-slate-900/60 border border-teal-200/60 dark:border-slate-800">
                    {/* Branch Dropdown */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                          <span>2. Select Branch Center: <span className="text-red-500">*</span></span>
                        </span>
                        {hasBranches && (
                          <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                            {branches.length} {branches.length === 1 ? "branch available" : "branches available"}
                          </span>
                        )}
                      </label>

                      {hasBranches ? (
                        <select
                          value={bulkSelectedBranch?.branchId || currentBranchObj?._id || ""}
                          onChange={(e) => {
                            const bId = e.target.value;
                            const b = branches.find((item: any, idx: number) => (item._id || `branch_${idx}`) === bId || item._id === bId);
                            if (b) {
                              const doc = b.doctors && b.doctors.length > 0
                                ? (typeof b.doctors[0] === "string" ? b.doctors[0] : b.doctors[0].name)
                                : (b.doctorName || "");
                              setBulkSelectedBranch({
                                branchId: b._id || bId,
                                branchName: b.branchName,
                                doctorName: doc
                              });
                            }
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                        >
                          {branches.map((b: any, bIdx: number) => {
                            const idVal = b._id || `branch_${bIdx}`;
                            const locStr = [b.city, b.state].filter(Boolean).join(", ");
                            return (
                              <option key={idVal} value={idVal}>
                                {b.branchName} {b.branchCode ? `(${b.branchCode})` : ""} {locStr ? `• ${locStr}` : ""}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <div className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Single / Main Center (All operations based at main facility)</span>
                        </div>
                      )}
                    </div>

                    {/* Branch Info Card (Reg No, GST, Address) */}
                    {currentBranchObj && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {currentBranchObj.registrationNumber && (
                            <span className="font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 text-[10px] font-semibold">
                              Reg No: {currentBranchObj.registrationNumber}
                            </span>
                          )}
                          {currentBranchObj.gstNumber && (
                            <span className="font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 text-[10px] font-semibold">
                              GSTIN: {currentBranchObj.gstNumber}
                            </span>
                          )}
                          {currentBranchObj.pickupLocation && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                              OPU: {currentBranchObj.pickupLocation}
                            </span>
                          )}
                        </div>

                        {(currentBranchObj.addressLine1 || currentBranchObj.city || currentBranchObj.state) && (
                          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px] pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {[currentBranchObj.addressLine1, currentBranchObj.city, currentBranchObj.state, currentBranchObj.pincode].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: Treatment Doctor Dropdown for Bulk */}
                    <div className="space-y-1.5 pt-0.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                          <span>3. Treatment Doctor for Selected Applications:</span>
                        </span>
                        {bulkSelectedBranch?.doctorName && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                            Dr. {bulkSelectedBranch.doctorName.replace(/^Dr\.?\s*/i, "")}
                          </span>
                        )}
                      </label>

                      {currentBranchObj?.doctors && currentBranchObj.doctors.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={
                              currentBranchObj.doctors.some((d: any) => {
                                const dName = typeof d === "string" ? d : d.name;
                                return (bulkSelectedBranch?.doctorName?.replace(/^Dr\.?\s*/i, "").trim().toLowerCase()) === dName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase();
                              })
                                ? (bulkSelectedBranch?.doctorName || "")
                                : "__custom__"
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__custom__") {
                                setBulkSelectedBranch(prev => ({
                                  branchId: prev?.branchId || currentBranchObj._id || "branch_0",
                                  branchName: prev?.branchName || currentBranchObj.branchName,
                                  doctorName: ""
                                }));
                              } else {
                                setBulkSelectedBranch(prev => ({
                                  branchId: prev?.branchId || currentBranchObj._id || "branch_0",
                                  branchName: prev?.branchName || currentBranchObj.branchName,
                                  doctorName: val
                                }));
                              }
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                          >
                            {currentBranchObj.doctors.map((d: any, dIdx: number) => {
                              const dName = typeof d === "string" ? d : d.name;
                              return (
                                <option key={dIdx} value={dName}>
                                  Dr. {dName.replace(/^Dr\.?\s*/i, "")}
                                </option>
                              );
                            })}
                            <option value="__custom__">+ Enter Custom Doctor Name...</option>
                          </select>

                          {/* Custom doctor name text input if custom selected or none match */}
                          {(!currentBranchObj.doctors.some((d: any) => {
                            const dName = typeof d === "string" ? d : d.name;
                            return (bulkSelectedBranch?.doctorName?.replace(/^Dr\.?\s*/i, "").trim().toLowerCase()) === dName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase();
                          })) && (
                            <input
                              type="text"
                              placeholder="Type Treatment Doctor name (e.g. Dr. Sunita Rao)..."
                              value={bulkSelectedBranch?.doctorName || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkSelectedBranch(prev => ({
                                  branchId: prev?.branchId || currentBranchObj._id || "branch_0",
                                  branchName: prev?.branchName || currentBranchObj.branchName,
                                  doctorName: val
                                }));
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter Treatment Doctor name (e.g. Dr. Sunita Rao)..."
                          value={bulkSelectedBranch?.doctorName || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBulkSelectedBranch(prev => ({
                              branchId: prev?.branchId || currentBranchObj?._id || "branch_0",
                              branchName: prev?.branchName || currentBranchObj?.branchName || "Main Center",
                              doctorName: val
                            }));
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t">
              <div className="text-[11px] text-slate-500 truncate">
                {bulkSelectedHospitalId ? (
                  <span>
                    Selected: <strong className="text-teal-700 dark:text-teal-300">
                      {hospitals.find(h => h._id === bulkSelectedHospitalId)?.name}
                    </strong>
                    {bulkSelectedBranch?.branchName && (
                      <> → <span className="font-semibold">{bulkSelectedBranch.branchName}</span></>
                    )}
                    {bulkSelectedBranch?.doctorName && (
                      <> • <span className="text-purple-600 dark:text-purple-400 font-semibold">Dr. {bulkSelectedBranch.doctorName.replace(/^Dr\.?\s*/i, "")}</span></>
                    )}
                  </span>
                ) : (
                  <span>No hospital selected</span>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBulkAssignOpen(false)}
                  className="rounded-xl text-xs cursor-pointer"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (bulkSelectedHospitalId) {
                      handleBulkAssign(bulkSelectedHospitalId, bulkSelectedBranch);
                    }
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1 cursor-pointer font-bold"
                  disabled={!bulkSelectedHospitalId || actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirm Bulk Assignment ({selectedIds.length})
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ASSIGN TREATING DOCTOR (STRICTLY ISOLATED TO ASSIGNED HOSPITAL & BRANCH) */}
      <Dialog open={isAssignDoctorOpen} onOpenChange={setIsAssignDoctorOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base font-bold">
              <Stethoscope className="w-5 h-5 text-purple-600" /> Assign Treating Doctor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign treating doctor for donor{" "}
              <strong className="text-purple-700 dark:text-purple-300 font-bold">
                {doctorAssignReg?.personalInfo?.fullName || doctorAssignReg?.donorId || doctorAssignReg?.registrationId}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Hospital & Branch Context - Isolated to assigned hospital & branch */}
            {(() => {
              const hospId = doctorAssignReg?.assignedHospital?._id 
                || doctorAssignReg?.assignedHospitalId 
                || (typeof doctorAssignReg?.assignedHospital === "string" && doctorAssignReg?.assignedHospital.length === 24 ? doctorAssignReg?.assignedHospital : null);
              const hospName = doctorAssignReg?.assignedHospital?.name 
                || (typeof doctorAssignReg?.assignedHospital === "string" ? doctorAssignReg?.assignedHospital : "");

              const matchedHosp = hospitals.find(h => 
                (hospId && (h._id === hospId || String(h._id) === String(hospId))) ||
                (hospName && h.name?.toLowerCase().trim() === hospName.toLowerCase().trim())
              );

              const hasBranches = Array.isArray(matchedHosp?.branches) && matchedHosp.branches.length > 0;
              const currentBranch = hasBranches 
                ? (matchedHosp.branches.find((b: any) => 
                    b._id === doctorModalBranchId ||
                    b.branchName === doctorModalBranchId ||
                    b.branchName === doctorAssignReg?.assignedBranch ||
                    b._id === doctorAssignReg?.assignedBranchId
                  ) || matchedHosp.branches[0])
                : null;

              // Extract doctors strictly from this single branch / hospital (NO MERGING with other branches or hospitals!)
              const branchDocs: string[] = [];
              const addDocName = (raw: string) => {
                if (!raw) return;
                raw.split(/[,;\/]+|\band\b/i).forEach(p => {
                  const clean = p.replace(/^Dr\.?\s*/i, "").trim();
                  if (clean && !branchDocs.some(d => d.toLowerCase() === clean.toLowerCase())) {
                    branchDocs.push(clean);
                  }
                });
              };

              if (currentBranch) {
                if (Array.isArray(currentBranch.doctors)) {
                  currentBranch.doctors.forEach((d: any) => {
                    const name = typeof d === "string" ? d : d?.name;
                    if (name) addDocName(name);
                  });
                }
                if (currentBranch.doctorName) {
                  addDocName(currentBranch.doctorName);
                }
              } else if (matchedHosp && (!matchedHosp.branches || matchedHosp.branches.length === 0)) {
                if (Array.isArray(matchedHosp.doctors)) {
                  matchedHosp.doctors.forEach((d: any) => {
                    const name = typeof d === "string" ? d : d?.name;
                    if (name) addDocName(name);
                  });
                }
                if (matchedHosp.doctorName) {
                  addDocName(matchedHosp.doctorName);
                }
              }

              return (
                <div className="space-y-3">
                  {matchedHosp ? (
                    <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
                        <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{matchedHosp.name}</span>
                      </div>

                      {hasBranches ? (
                        <div className="space-y-1">
                          <label className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-teal-600" />
                            <span>Branch:</span>
                          </label>
                          <select
                            value={currentBranch?._id || currentBranch?.branchName || ""}
                            onChange={(e) => {
                              const bId = e.target.value;
                              setDoctorModalBranchId(bId);
                              const newB = matchedHosp.branches.find((b: any) => b._id === bId || b.branchName === bId);
                              if (newB) {
                                const newDocs: string[] = [];
                                const addN = (raw: string) => {
                                  if (!raw) return;
                                  raw.split(/[,;\/]+|\band\b/i).forEach(p => {
                                    const c = p.replace(/^Dr\.?\s*/i, "").trim();
                                    if (c && !newDocs.some(d => d.toLowerCase() === c.toLowerCase())) newDocs.push(c);
                                  });
                                };
                                if (Array.isArray(newB.doctors)) newB.doctors.forEach((d: any) => addN(typeof d === "string" ? d : d?.name));
                                if (newB.doctorName) addN(newB.doctorName);
                                if (newDocs.length > 0) {
                                  setSelectedDoctorName(`Dr. ${newDocs[0]}`);
                                  setCustomDoctorInput("");
                                }
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                          >
                            {matchedHosp.branches.map((b: any, bIdx: number) => (
                              <option key={b._id || bIdx} value={b._id || b.branchName}>
                                {b.branchName} {b.city ? `• ${b.city}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 pl-5">
                          <span>Main Center Facility</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1 text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>No Hospital Assigned</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Please assign a hospital &amp; branch to this donor first to view affiliated doctors, or enter doctor name manually below.
                      </p>
                    </div>
                  )}

                  {/* Available Doctors (STRICTLY for this branch) */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Treating Doctor:</span>
                      {selectedDoctorName && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                          Dr. {selectedDoctorName.replace(/^Dr\.?\s*/i, "")}
                        </span>
                      )}
                    </label>

                    {branchDocs.length > 0 ? (
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-purple-600" />
                          <span>Doctors available at {currentBranch?.branchName || matchedHosp?.name} ({branchDocs.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {branchDocs.map((doc, idx) => {
                            const isSelected = selectedDoctorName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase() === doc.trim().toLowerCase();
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedDoctorName(`Dr. ${doc}`);
                                  setCustomDoctorInput("");
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSelected
                                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                    : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                                }`}
                              >
                                <Stethoscope className={`w-3 h-3 ${isSelected ? "text-white" : "text-purple-600"}`} />
                                Dr. {doc}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : matchedHosp ? (
                      <div className="text-[11px] text-slate-500 italic p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        No doctors currently registered specifically for {currentBranch?.branchName ? `"${currentBranch.branchName}"` : matchedHosp.name}. Type doctor name below.
                      </div>
                    ) : null}

                    {/* Manual doctor name input */}
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Type doctor name (e.g. Dr. Sonia Malik)..."
                        value={customDoctorInput || (selectedDoctorName ? `Dr. ${selectedDoctorName.replace(/^Dr\.?\s*/i, "")}` : "")}
                        onChange={(e) => {
                          setCustomDoctorInput(e.target.value);
                          setSelectedDoctorName(e.target.value);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t">
              <div>
                {doctorAssignReg?.assignedDoctor && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAssignDoctor("")}
                    disabled={actionLoading}
                    className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Unassign Doctor
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignDoctorOpen(false)}
                  disabled={actionLoading}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const hospId = doctorAssignReg?.assignedHospital?._id || doctorAssignReg?.assignedHospitalId || (typeof doctorAssignReg?.assignedHospital === "string" && doctorAssignReg?.assignedHospital.length === 24 ? doctorAssignReg?.assignedHospital : null);
                    const hospName = doctorAssignReg?.assignedHospital?.name || (typeof doctorAssignReg?.assignedHospital === "string" ? doctorAssignReg?.assignedHospital : "");
                    const matchedHosp = hospitals.find(h => (hospId && (h._id === hospId || String(h._id) === String(hospId))) || (hospName && h.name?.toLowerCase().trim() === hospName.toLowerCase().trim()));
                    const bObj = matchedHosp?.branches?.find((b: any) => b._id === doctorModalBranchId || b.branchName === doctorModalBranchId);
                    handleAssignDoctor(selectedDoctorName, bObj ? { branchName: bObj.branchName, branchId: bObj._id } : undefined);
                  }}
                  disabled={actionLoading || !selectedDoctorName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs gap-1 font-bold cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Doctor
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: BULK ASSIGN TREATING DOCTOR (STRICTLY ISOLATED BY HOSPITAL & BRANCH) */}
      <Dialog open={isBulkAssignDoctorOpen} onOpenChange={setIsBulkAssignDoctorOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base font-bold">
              <Stethoscope className="w-5 h-5 text-purple-600" /> Bulk Assign Treating Doctor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign a treating doctor to <strong className="text-purple-700 dark:text-purple-300 font-bold">{selectedIds.length}</strong> selected registrations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Step 1: Select Hospital */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>1. Select Hospital / Clinic:</span>
              </label>
              <select
                value={bulkDoctorHospitalId}
                onChange={(e) => {
                  const val = e.target.value;
                  setBulkDoctorHospitalId(val);
                  const h = hospitals.find(item => item._id === val);
                  if (h?.branches && h.branches.length > 0) {
                    setBulkDoctorBranchId(h.branches[0]._id || h.branches[0].branchName);
                  } else {
                    setBulkDoctorBranchId("");
                  }
                  setBulkDoctorName("");
                  setBulkCustomDoctorInput("");
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-purple-500 shadow-xs"
              >
                <option value="">-- Choose Hospital to view branch doctors --</option>
                {hospitals.map(h => (
                  <option key={h._id} value={h._id}>
                    {h.name} {h.shortName ? `(${h.shortName})` : ""} {h.city ? `• ${h.city}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Branch & Doctors for that branch */}
            {bulkDoctorHospitalId && (() => {
              const hosp = hospitals.find(h => h._id === bulkDoctorHospitalId);
              const hasBranches = Array.isArray(hosp?.branches) && hosp.branches.length > 0;
              const selectedBranch = hasBranches
                ? (hosp.branches.find((b: any) => b._id === bulkDoctorBranchId || b.branchName === bulkDoctorBranchId) || hosp.branches[0])
                : null;

              // Extract doctors strictly from this single branch (or standalone hospital)
              const branchDocs: string[] = [];
              const addDocName = (raw: string) => {
                if (!raw) return;
                raw.split(/[,;\/]+|\band\b/i).forEach(p => {
                  const clean = p.replace(/^Dr\.?\s*/i, "").trim();
                  if (clean && !branchDocs.some(d => d.toLowerCase() === clean.toLowerCase())) {
                    branchDocs.push(clean);
                  }
                });
              };

              if (selectedBranch) {
                if (Array.isArray(selectedBranch.doctors)) {
                  selectedBranch.doctors.forEach((d: any) => {
                    const name = typeof d === "string" ? d : d?.name;
                    if (name) addDocName(name);
                  });
                }
                if (selectedBranch.doctorName) {
                  addDocName(selectedBranch.doctorName);
                }
              } else if (hosp && (!hosp.branches || hosp.branches.length === 0)) {
                if (Array.isArray(hosp.doctors)) {
                  hosp.doctors.forEach((d: any) => {
                    const name = typeof d === "string" ? d : d?.name;
                    if (name) addDocName(name);
                  });
                }
                if (hosp.doctorName) {
                  addDocName(hosp.doctorName);
                }
              }

              return (
                <div className="space-y-3.5 p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/60">
                  {hasBranches && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-purple-600" />
                        <span>2. Select Branch Center:</span>
                      </label>
                      <select
                        value={selectedBranch?._id || selectedBranch?.branchName || ""}
                        onChange={(e) => {
                          setBulkDoctorBranchId(e.target.value);
                          setBulkDoctorName("");
                          setBulkCustomDoctorInput("");
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-purple-500 shadow-xs"
                      >
                        {hosp.branches.map((b: any, bIdx: number) => (
                          <option key={b._id || bIdx} value={b._id || b.branchName}>
                            {b.branchName} {b.city ? `• ${b.city}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Doctors of that branch */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-purple-900 dark:text-purple-300 font-bold flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-purple-600" />
                      Doctors at {selectedBranch?.branchName || hosp?.name} ({branchDocs.length}):
                    </span>
                    {branchDocs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {branchDocs.map((doc, idx) => {
                          const isSelected = bulkDoctorName.replace(/^Dr\.?\s*/i, "").trim().toLowerCase() === doc.trim().toLowerCase();
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setBulkDoctorName(`Dr. ${doc}`);
                                setBulkCustomDoctorInput("");
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                  : "bg-white hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-slate-900 dark:text-purple-300 dark:border-purple-800"
                              }`}
                            >
                              <Stethoscope className={`w-3 h-3 ${isSelected ? "text-white" : "text-purple-600"}`} />
                              Dr. {doc}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        No doctors listed specifically for this branch. Enter doctor name below.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Doctor Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Doctor Name to Assign:</span>
                {bulkDoctorName && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                    Dr. {bulkDoctorName.replace(/^Dr\.?\s*/i, "")}
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="Type doctor name (e.g., Dr. Sonia Malik)..."
                value={bulkCustomDoctorInput || (bulkDoctorName ? `Dr. ${bulkDoctorName.replace(/^Dr\.?\s*/i, "")}` : "")}
                onChange={(e) => {
                  setBulkCustomDoctorInput(e.target.value);
                  setBulkDoctorName(e.target.value);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkAssignDoctorOpen(false)}
                disabled={actionLoading}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleBulkAssignDoctor(bulkDoctorName)}
                disabled={actionLoading || !bulkDoctorName.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs gap-1 font-bold cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm Doctor Assignment ({selectedIds.length})
              </Button>
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
                    <label className="text-[10px] font-semibold flex items-center justify-between text-slate-500">
                      <span>Donor ID</span>
                      <span className="text-[9px] text-slate-400 font-mono">System Assigned</span>
                    </label>
                    <Input
                      value={editForm.donorId || "—"}
                      disabled
                      readOnly
                      className="font-mono font-semibold bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-800"
                    />
                  </div>
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
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold">Pipeline Status</label>
                    <select
                      value={editForm.status || "APPROVED"}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                    >
                      <option value="APPROVED">Approved</option>
                      <option value="WAITING_FORM13">Waiting Form 13</option>
                      <option value="FILE_COMPLETED">File Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
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

                  {/* Blood Report */}
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

                  {/* Life Insurance */}
                  <FileUploadField
                    label="Life / Medical Insurance (Rule 13 — Mandatory)"
                    value={editForm.labReports?.insurance || editForm.documents?.insurance || null}
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(file) => {
                      setEditForm((prev: any) => ({
                        ...prev,
                        labReports: { ...prev.labReports, insurance: file },
                        documents: { ...prev.documents, insurance: file },
                      }));
                    }}
                    folder="documents"
                  />

                  {/* Health Insurance */}
                  <FileUploadField
                    label="Health Insurance Policy (Mandatory)"
                    value={editForm.labReports?.healthInsurance || null}
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(file) => {
                      setEditForm((prev: any) => ({
                        ...prev,
                        labReports: { ...prev.labReports, healthInsurance: file },
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
      {/* IN-APP DOCUMENT VIEWER */}
      <InAppDocumentViewer
        isOpen={viewerDoc.isOpen}
        onClose={() => setViewerDoc((prev) => ({ ...prev, isOpen: false }))}
        title={viewerDoc.title}
        fileUrl={viewerDoc.fileUrl}
        fileName={viewerDoc.fileName}
        donorName={viewerDoc.donorName}
        donorId={viewerDoc.donorId}
      />

      {/* Sticky / Floating Bottom Bulk Action Bar */}
      <FloatingBulkBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        itemLabel="egg donors"
      >
        <Button
          size="sm"
          onClick={() => setIsBulkAssignOpen(true)}
          disabled={actionLoading}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5 h-8 font-medium shadow-xs cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5" /> Assign Hospital
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleBulkPrint}
          disabled={actionLoading}
          className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs gap-1.5 h-8 font-medium cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" /> Print PDFs
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={exportSelectedCsv}
          disabled={actionLoading}
          className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs gap-1.5 h-8 font-medium cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkStatusChange("FILE_COMPLETED")}
          disabled={actionLoading}
          className="border-blue-700/80 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 rounded-xl text-xs gap-1 h-8 font-medium cursor-pointer"
        >
          <FileCheck className="w-3.5 h-3.5" /> File Completed
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkStatusChange("COMPLETED")}
          disabled={actionLoading}
          className="border-purple-700/80 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 rounded-xl text-xs gap-1 h-8 font-medium cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkStatusChange("APPROVED")}
          disabled={actionLoading}
          className="border-emerald-700/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-xs gap-1 h-8 font-medium cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkStatusChange("SUSPENDED")}
          disabled={actionLoading}
          className="border-amber-700/80 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded-xl text-xs gap-1 h-8 font-medium cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5" /> Suspend
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleBulkStatusChange("CANCELLED")}
          disabled={actionLoading}
          className="border-rose-700/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs gap-1 h-8 font-medium cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" /> Cancel
        </Button>
      </FloatingBulkBar>
    </div>
  );
}
