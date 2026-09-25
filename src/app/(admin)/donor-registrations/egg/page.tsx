"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  Printer,
  Edit3,
  Check,
  X,
  Eye,
  Loader2,
  Clock,
  ExternalLink,
  Ban,
  RefreshCw,
  Plus,
  RotateCcw,
  Phone,
  PhoneCall,
  Copy,
  Sparkles,
  User,
  Heart,
  Activity,
  FileSpreadsheet,
  Trash2,
  Building2,
  CreditCard,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Upload,
  Users,
  Lock,
  ClipboardList,
  Award,
  FileBadge2,
  Stethoscope,
  HeartPulse,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GitHubDeleteModal } from "@/components/ui/github-delete-modal";
import { FileUploadField } from "@/features/file-upload/components/FileUploadField";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { InAppDocumentViewer } from "@/components/ui/in-app-document-viewer";
import { DonorPrintModal } from "@/features/donor-registration/components/DonorPrintModal";

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  online_inquiry: { label: "🌐 Online", className: "bg-rose-50 text-rose-600 border border-rose-100" },
  walk_in: { label: "🏥 Walk-in", className: "bg-amber-50 text-amber-700 border border-amber-100" },
  admin_created: { label: "👤 Admin", className: "bg-violet-50 text-violet-700 border border-violet-100" },
};

const DOCUMENTS_CONFIG = [
  { key: "passportPhoto", label: "Photo", accept: ".png,.jpg,.jpeg,.webp", folder: "profile-images" },
  { key: "aadhaarFront", label: "Aadhaar Card (Front)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "aadhaarBack", label: "Aadhaar Card (Back)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "signature", label: "Signature", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "otherDocument", label: "Other Document", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
];

export default function AdminEggDonorRegistrationsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal / Detail view
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);

  // Print Configuration Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetReg, setPrintTargetReg] = useState<any | null>(null);

  // GitHub-style Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [regToDelete, setRegToDelete] = useState<{ id: string; name?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenPrint = (reg: any) => {
    setPrintTargetReg(reg);
    setIsPrintModalOpen(true);
  };

  // Edit fields modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editTab, setEditTab] = useState<"details" | "documents" | "labReports" | "affidavit">("details");

  // Create walk-in registration modal (Egg Donor: Female, Husband Details)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    aadhaarNumber: "",
    mobileNumber: "",
    dateOfBirth: "",
    gender: "Female",
    husbandName: "",
    husbandOccupation: "",
    bloodGroup: "",
    adminNotes: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Stats from DB
  const [stats, setStats] = useState<{
    total: number;
    new?: number;
    submitted: number;
    approved: number;
    underReview: number;
    documentsVerified?: number;
    affidavitUploaded?: number;
    draft: number;
    rejected: number;
    suspended?: number;
    otherUntilApproved?: number;
  }>({
    total: 0,
    new: 0,
    submitted: 0,
    approved: 0,
    underReview: 0,
    documentsVerified: 0,
    affidavitUploaded: 0,
    draft: 0,
    rejected: 0,
    suspended: 0,
    otherUntilApproved: 0,
  });

  // Active ART Clinics & Hospitals for Mapping
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Dual-Deal (Clinic Deal + Donor Deal) Modal State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealForm, setDealForm] = useState<{
    assignedHospitalId: string;
    donorCategory: "registry" | "normal" | "profile";
    hospitalDealPrice: number;
    compensationAmount: number;
    paymentTerms: string;
    paymentMethod: "bank_transfer" | "upi" | "cheque" | "cash";
    paymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
    advanceAmount: number;
    balanceAmount: number;
    paymentReference: string;
    notes: string;
    adminNotes: string;
    pickupDate?: string;
    recruitmentDate: string;
    supplyDate: string;
    targetStatus: "APPROVED" | null;
  }>({
    assignedHospitalId: "",
    donorCategory: "normal",
    hospitalDealPrice: 0,
    compensationAmount: 0,
    paymentTerms: "Full on Retrieval",
    paymentMethod: "bank_transfer",
    paymentStatus: "PENDING",
    advanceAmount: 0,
    balanceAmount: 0,
    paymentReference: "",
    notes: "",
    adminNotes: "",
    pickupDate: "",
    recruitmentDate: "",
    supplyDate: "",
    targetStatus: null,
  });

  const fetchHospitals = useCallback(async () => {
    try {
      const res = await fetch("/api/hospitals?status=ACTIVE&limit=200", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setHospitals(data.hospitals || []);
      }
    } catch (err) {
      console.error("Failed to load hospitals", err);
    }
  }, []);

  type EggRegTab =
    | "all"
    | "new"
    | "draft"
    | "under_review"
    | "documents_verified"
    | "affidavit_uploaded"
    | "approved"
    | "rejected"
    | "suspended"
    | "other";

  const [activeTab, setActiveTab] = useState<EggRegTab>("new");

  const fetchEggRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        tab: activeTab,
      });
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);
      if (bloodGroupFilter) params.append("bloodGroup", bloodGroupFilter);

      const res = await fetch(`/api/donor-registrations/egg?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error(data.error || "Failed to load egg donor registrations");
      }
    } catch (err: any) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, bloodGroupFilter, activeTab]);

  const handleTabChange = (tab: EggRegTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setStatusFilter("");
  };

  useEffect(() => {
    fetchEggRegistrations();
    fetchHospitals();
  }, [fetchEggRegistrations, fetchHospitals]);

  // ─── Step-Gated Workflow Pipeline Helper ──────────────────────────────────
  const getWorkflowStatus = (reg: any) => {
    // Step 1: Form Filled / Details Present (starts as NEW)
    const hasAadhaarDoc = !!(reg.documents?.aadhaarFront?.url || reg.documents?.aadhaarBack?.url);
    const hasPhoto = !!(reg.documents?.passportPhoto?.url);
    const hasSig = !!(reg.documents?.signature?.url);
    const step1Complete = !!(reg.personalInfo?.fullName && reg.personalInfo?.aadhaarNumber);

    // Step 2: Documents Verified (Aadhaar, photo, signature checked)
    const isDocVerified =
      reg.documentVerification?.isVerified === true ||
      reg.status === "DOCUMENTS_VERIFIED" ||
      reg.status === "AFFIDAVIT_UPLOADED" ||
      reg.status === "APPROVED" ||
      reg.status === "WAITING_FORM13" ||
      reg.status === "FILE_COMPLETED";

    // Step 3: Affidavit Uploaded
    const hasAffidavit = !!(reg.documents?.affidavit?.url);
    const step3Complete =
      hasAffidavit ||
      reg.status === "AFFIDAVIT_UPLOADED" ||
      reg.status === "APPROVED" ||
      reg.status === "WAITING_FORM13" ||
      reg.status === "FILE_COMPLETED";

    // Step 4: Hospital & Deal (Registry / Normal / Profile)
    const isRegistry = reg.hospitalDealType === "registry" || reg.clinicDeal?.donorCategory === "registry";
    const hasHospital = !!(reg.assignedHospital);
    const hasClinicPrice = !!(reg.clinicDeal?.hospitalDealPrice && reg.clinicDeal.hospitalDealPrice > 0);
    const hasDonorDeal = isRegistry ? true : !!(reg.donorDeal?.compensationAmount && reg.donorDeal.compensationAmount > 0);
    const hasDates = !!(reg.recruitmentDate || reg.supplyDate);
    const step4Complete = hasHospital && hasClinicPrice && hasDonorDeal;

    return {
      step1Complete,
      step2Complete: isDocVerified,
      step3Complete,
      step4Complete,
      allComplete: isDocVerified && step3Complete && step4Complete,
      details: {
        hasAadhaarDoc,
        hasPhoto,
        hasSig,
        isDocVerified,
        hasAffidavit,
        hasHospital,
        hasClinicPrice,
        hasDonorDeal,
        isRegistry,
        hasDates,
      },
    };
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

  const handleOpenDealModal = (reg: any, targetStatus: "APPROVED" | null = null) => {
    const wf = getWorkflowStatus(reg);
    if (!wf.step2Complete) {
      toast.error("Step 2 Incomplete — Please verify documents first.");
      return;
    }
    if (!wf.step3Complete) {
      toast.error("Step 3 Incomplete — Please upload signed affidavit first.");
      return;
    }
    setSelectedReg(reg);
    const assignedHospObj = typeof reg.assignedHospital === "object" && reg.assignedHospital !== null ? reg.assignedHospital : null;
    const assignedId = assignedHospObj?._id ? String(assignedHospObj._id) : (typeof reg.assignedHospital === "string" ? reg.assignedHospital : "");
    const matchedHosp = hospitals.find((h) => String(h._id) === assignedId) || assignedHospObj;

    const initialCategory: "normal" | "profile" =
      reg.clinicDeal?.donorCategory || reg.donorDeal?.donorCategory || "normal";

    const defaultClinicPrice =
      reg.clinicDeal?.hospitalDealPrice ||
      (matchedHosp
        ? initialCategory === "profile"
          ? matchedHosp.profiledonorDealPrice || matchedHosp.donorDealPrice || 0
          : matchedHosp.donorDealPrice || 0
        : 0);

    const defaultDonorComp =
      reg.donorDeal?.compensationAmount || (initialCategory === "profile" ? 60000 : 40000);

    setDealForm({
      assignedHospitalId: assignedId,
      donorCategory: initialCategory,
      hospitalDealPrice: defaultClinicPrice,
      compensationAmount: defaultDonorComp,
      paymentTerms: reg.donorDeal?.paymentTerms || "Lump-sum upon Successful Retrieval",
      paymentMethod: reg.donorDeal?.paymentMethod || "bank_transfer",
      paymentStatus: reg.donorDeal?.paymentStatus || "PENDING",
      advanceAmount: reg.donorDeal?.advanceAmount || 0,
      balanceAmount: reg.donorDeal?.balanceAmount || 0,
      paymentReference: reg.donorDeal?.paymentReference || "",
      notes: reg.donorDeal?.notes || reg.clinicDeal?.notes || "",
      adminNotes: reg.adminNotes || adminNotes || "",
      pickupDate: formatDateForInput(reg.pickupDate || reg.donorInfo?.pickupDate),
      recruitmentDate: formatDateForInput(reg.recruitmentDate || reg.donorInfo?.recruitmentDate),
      supplyDate: formatDateForInput(reg.supplyDate || reg.donorInfo?.supplyDate),
      targetStatus,
    });
    setIsDealModalOpen(true);
  };

  const handleHospitalChange = (hospitalId: string) => {
    const matchedHosp = hospitals.find((h) => h._id === hospitalId);
    const newPrice = matchedHosp
      ? dealForm.donorCategory === "profile"
        ? matchedHosp.profiledonorDealPrice || 0
        : matchedHosp.donorDealPrice || 0
      : 0;

    setDealForm((prev) => ({
      ...prev,
      assignedHospitalId: hospitalId,
      hospitalDealPrice: newPrice,
    }));
  };

  const handleCategoryChange = (category: "registry" | "normal" | "profile") => {
    const matchedHosp = hospitals.find((h) => h._id === dealForm.assignedHospitalId);
    const newPrice = matchedHosp
      ? category === "profile"
        ? matchedHosp.profiledonorDealPrice || 0
        : matchedHosp.donorDealPrice || 0
      : dealForm.hospitalDealPrice;

    const defaultComp = category === "registry" ? 0 : category === "profile" ? 60000 : 40000;
    const newComp =
      category === "registry"
        ? 0
        : !dealForm.compensationAmount ||
          dealForm.compensationAmount === 40000 ||
          dealForm.compensationAmount === 60000
        ? defaultComp
        : dealForm.compensationAmount;

    setDealForm((prev) => ({
      ...prev,
      donorCategory: category,
      hospitalDealPrice: newPrice,
      compensationAmount: newComp,
    }));
  };

  const handleSubmitDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;

    if (!dealForm.assignedHospitalId) {
      toast.error("Please assign an ART clinic / hospital.");
      return;
    }

    if (dealForm.donorCategory !== "registry" && (!dealForm.compensationAmount || dealForm.compensationAmount <= 0)) {
      toast.error("Deal with donor (compensation amount) must be greater than ₹0.");
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = {
        assignedHospital: dealForm.assignedHospitalId,
        clinicDeal: {
          donorCategory: dealForm.donorCategory,
          hospitalDealPrice:
            Number(dealForm.hospitalDealPrice) ||
            (dealForm.donorCategory === "profile" ? 85000 : 65000),
          currency: "INR",
          notes: dealForm.notes,
        },
        donorDeal: {
          donorCategory: dealForm.donorCategory,
          compensationAmount: Number(dealForm.compensationAmount),
          paymentMethod: selectedReg.donorDeal?.paymentMethod || dealForm.paymentMethod || "bank_transfer",
          paymentTerms: selectedReg.donorDeal?.paymentTerms || dealForm.paymentTerms || "Full on Retrieval",
          paymentStatus: selectedReg.donorDeal?.paymentStatus || dealForm.paymentStatus || "PENDING",
          advanceAmount: Number(dealForm.advanceAmount) || selectedReg.donorDeal?.advanceAmount || 0,
          balanceAmount: Number(dealForm.balanceAmount) || selectedReg.donorDeal?.balanceAmount || 0,
          paymentReference: dealForm.paymentReference || selectedReg.donorDeal?.paymentReference || "",
          notes: dealForm.notes,
        },
        hospitalDealType: dealForm.donorCategory,
        adminNotes: dealForm.adminNotes,
        recruitmentDate: dealForm.recruitmentDate || "",
        supplyDate: dealForm.supplyDate || "",
        status: "APPROVED",
      };

      const res = await fetch(`/api/donor-registrations/egg/${selectedReg.registrationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          dealForm.targetStatus === "APPROVED"
            ? "Egg Donor Approved! Hospital & dual deals assigned successfully."
            : "Hospital & deals saved successfully."
        );
        setIsDealModalOpen(false);
        setIsDetailOpen(false);
        const savedRecruit = dealForm.recruitmentDate || "";
        const savedSupply = dealForm.supplyDate || "";
        const targetId = selectedReg.registrationId;
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === targetId
              ? {
                  ...r,
                  recruitmentDate: savedRecruit,
                  supplyDate: savedSupply,
                  status: dealForm.targetStatus || r.status,
                }
              : r
          )
        );
        fetchEggRegistrations();
      } else {
        toast.error(data.error || "Failed to save details.");
      }
    } catch (err) {
      toast.error("Error communicating with server.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (regId: string, newStatus: string) => {
    if (newStatus === "APPROVED") {
      const reg = registrations.find((r) => r.registrationId === regId) || selectedReg;
      const wf = getWorkflowStatus(reg);

      if (!wf.step2Complete) {
        toast.error("Cannot approve — Step 2 incomplete. Please verify documents first.");
        return;
      }

      if (!wf.step3Complete) {
        toast.error("Cannot approve — Step 3 incomplete. Please upload the signed & notarized affidavit.");
        return;
      }

      if (!wf.step4Complete) {
        handleOpenDealModal(reg, "APPROVED");
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/donor-registrations/egg/${regId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Registration marked as ${newStatus}`);
        setIsDetailOpen(false);
        fetchEggRegistrations();
      } else {
        toast.error(data.error || "Status update failed.");
        if (data.error && data.error.includes("hospital")) {
          const reg = registrations.find((r) => r.registrationId === regId) || selectedReg;
          handleOpenDealModal(reg, "APPROVED");
        }
      }
    } catch (err: any) {
      toast.error("Error updating registration status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDocuments = async (verify: boolean = true) => {
    if (!selectedReg) return;
    const regId = selectedReg.registrationId || selectedReg._id;
    if (!regId) {
      toast.error("Registration ID not found.");
      return;
    }
    setActionLoading(true);
    try {
      const nextStatus = verify
        ? "DOCUMENTS_VERIFIED"
        : (selectedReg.status === "DOCUMENTS_VERIFIED" ? "SUBMITTED" : selectedReg.status || "SUBMITTED");

      const docVerificationPayload = {
        isVerified: verify,
        verifiedAt: verify ? new Date() : null,
        notes: verify ? "Verified by Admin" : "",
      };

      const res = await fetch(`/api/donor-registrations/egg/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: nextStatus,
          documentVerification: docVerificationPayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(verify ? "Identity Documents Verified! (Proceed to Step 3)" : "Document verification reset.");
        const updatedDoc = data.registration || {
          ...selectedReg,
          status: nextStatus,
          documentVerification: docVerificationPayload,
        };
        setSelectedReg((prev: any) => ({
          ...prev,
          ...updatedDoc,
          status: nextStatus,
          documentVerification: docVerificationPayload,
        }));
        setRegistrations((prev: any[]) =>
          prev.map((r: any) =>
            (r.registrationId === regId || r._id === regId)
              ? { ...r, ...updatedDoc, status: nextStatus, documentVerification: docVerificationPayload }
              : r
          )
        );
        fetchEggRegistrations();
      } else {
        toast.error(data.error || "Failed to update verification.");
      }
    } catch (err) {
      console.error("Error updating document verification:", err);
      toast.error("Error updating document verification.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAffidavitUpload = async (fileRef: any) => {
    if (!selectedReg) return;
    const regId = selectedReg.registrationId || selectedReg._id;
    if (!regId) {
      toast.error("Registration ID not found.");
      return;
    }

    if (!fileRef || !fileRef.url) {
      // Removing affidavit
      setActionLoading(true);
      try {
        const res = await fetch(`/api/donor-registrations/egg/${encodeURIComponent(regId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            "documents.affidavit": null,
            status: "DOCUMENTS_VERIFIED",
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Affidavit removed. You can now upload a new affidavit.");
          setSelectedReg((prev: any) => ({
            ...prev,
            status: "DOCUMENTS_VERIFIED",
            documents: {
              ...(prev?.documents || {}),
              affidavit: null,
            },
          }));
          setRegistrations((prev: any[]) =>
            prev.map((r: any) =>
              (r.registrationId === regId || r._id === regId)
                ? {
                    ...r,
                    status: "DOCUMENTS_VERIFIED",
                    documents: {
                      ...(r.documents || {}),
                      affidavit: null,
                    },
                  }
                : r
            )
          );
          fetchEggRegistrations();
        } else {
          toast.error(data.error || "Failed to remove affidavit.");
        }
      } catch {
        toast.error("Error removing affidavit.");
      } finally {
        setActionLoading(false);
      }
      return;
    }

    setActionLoading(true);
    try {
      const url = fileRef.url;
      const fileName = fileRef?.fileName || fileRef?.name || url.split("/").pop() || "affidavit.pdf";
      const res = await fetch(`/api/donor-registrations/egg/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          "documents.affidavit": {
            url,
            fileId: fileRef?.fileId,
            fileName,
            uploadedAt: new Date(),
          },
          status: "AFFIDAVIT_UPLOADED",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Affidavit uploaded successfully! Status updated to AFFIDAVIT_UPLOADED.");
        setSelectedReg((prev: any) => ({
          ...prev,
          status: "AFFIDAVIT_UPLOADED",
          documents: {
            ...(prev?.documents || {}),
            affidavit: { url, fileName, fileId: fileRef?.fileId, uploadedAt: new Date() },
          },
        }));
        setRegistrations((prev: any[]) =>
          prev.map((r: any) =>
            (r.registrationId === regId || r._id === regId)
              ? {
                  ...r,
                  status: "AFFIDAVIT_UPLOADED",
                  documents: {
                    ...(r.documents || {}),
                    affidavit: { url, fileName, fileId: fileRef?.fileId, uploadedAt: new Date() },
                  },
                }
              : r
          )
        );
        fetchEggRegistrations();
      } else {
        toast.error(data.error || "Failed to save affidavit.");
      }
    } catch {
      toast.error("Error uploading affidavit.");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadAffidavit = (reg: any) => {
    if (!reg) return;
    const regId = reg.registrationId || reg._id;
    if (!regId) {
      toast.error("Registration ID not found.");
      return;
    }
    // Opens the official 3-page statutory affidavit (Blank stamp page with signature + Affidavit clauses + Verification)
    const printUrl = `/admin/manage-registrations/${regId}/print?withHeader=false&sections=affidavit&affidavitType=template`;
    window.open(printUrl, "_blank");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.aadhaarNumber.trim() || !createForm.mobileNumber.trim()) {
      toast.error("Please fill in Full Name, Aadhaar and Mobile Number.");
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        adminNotes: createForm.adminNotes,
        personalInfo: {
          fullName: createForm.fullName.trim(),
          gender: "Female",
          husbandName: createForm.husbandName.trim(),
          husbandOccupation: createForm.husbandOccupation.trim(),
          spouseName: createForm.husbandName.trim(),
          spouseOccupation: createForm.husbandOccupation.trim(),
          aadhaarNumber: createForm.aadhaarNumber.replace(/\D/g, ""),
          dateOfBirth: createForm.dateOfBirth,
          bloodGroup: createForm.bloodGroup,
          maritalStatus: "Married",
        },
        contactInfo: {
          mobileNumber: createForm.mobileNumber.trim(),
        },
      };

      const res = await fetch("/api/donor-registrations/egg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Egg donor registration created! ID: ${data.registration.registrationId}`);
        setIsCreateOpen(false);
        setCreateForm({
          fullName: "",
          aadhaarNumber: "",
          mobileNumber: "",
          dateOfBirth: "",
          gender: "Female",
          husbandName: "",
          husbandOccupation: "",
          bloodGroup: "",
          adminNotes: "",
        });
        fetchEggRegistrations();
      } else {
        toast.error(data.error || "Failed to create registration.");
      }
    } catch (err: any) {
      toast.error("Error creating registration.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (reg: any) => {
    setSelectedReg(reg);
    setEditForm({
      fullName: reg.personalInfo?.fullName || "",
      phone: reg.contactInfo?.mobileNumber || "",
      email: reg.contactInfo?.emailAddress || "",
      husbandName: reg.personalInfo?.husbandName || reg.personalInfo?.spouseName || "",
      husbandOccupation: reg.personalInfo?.husbandOccupation || reg.personalInfo?.spouseOccupation || "",
      bloodGroup: reg.personalInfo?.bloodGroup || "",
      currentAddress: reg.contactInfo?.currentAddress || "",
      permanentAddress: reg.contactInfo?.permanentAddress || "",
      state: reg.contactInfo?.state || "",
      city: reg.contactInfo?.city || "",
      pincode: reg.contactInfo?.pincode || "",
      // Extended personal info
      dateOfBirth: formatDateForInput(reg.personalInfo?.dateOfBirth),
      aadhaarNumber: reg.personalInfo?.aadhaarNumber || "",
      education: reg.personalInfo?.education || "",
      occupation: reg.personalInfo?.occupation || "",
      height: reg.personalInfo?.height || "",
      weight: reg.personalInfo?.weight || "",
      religion: reg.personalInfo?.religion || "",
      fatherName: reg.personalInfo?.fatherName || "",
      maritalStatus: reg.personalInfo?.maritalStatus || "Married",
      // Emergency contact
      emergencyContactName: reg.emergencyContact?.contactPersonName || reg.personalInfo?.husbandName || reg.personalInfo?.spouseName || "",
      emergencyContactPhone: reg.emergencyContact?.contactPersonPhone || reg.contactInfo?.mobileNumber || "",
      emergencyRelationship: reg.emergencyContact?.relationship || "Husband",
      // Files
      documents: reg.documents || {},
      labReports: reg.labReports || {},
    });
    setEditTab("details");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;
    setActionLoading(true);

    try {
      const payload = {
        "personalInfo.fullName": editForm.fullName,
        "personalInfo.husbandName": editForm.husbandName,
        "personalInfo.husbandOccupation": editForm.husbandOccupation,
        "personalInfo.spouseName": editForm.husbandName,
        "personalInfo.spouseOccupation": editForm.husbandOccupation,
        "personalInfo.gender": "Female",
        "personalInfo.bloodGroup": editForm.bloodGroup,
        "personalInfo.dateOfBirth": editForm.dateOfBirth,
        "personalInfo.aadhaarNumber": editForm.aadhaarNumber,
        "personalInfo.education": editForm.education,
        "personalInfo.occupation": editForm.occupation,
        "personalInfo.height": editForm.height,
        "personalInfo.weight": editForm.weight,
        "personalInfo.religion": editForm.religion,
        "personalInfo.fatherName": editForm.fatherName,
        "personalInfo.maritalStatus": editForm.maritalStatus,
        "contactInfo.mobileNumber": editForm.phone,
        "contactInfo.emailAddress": editForm.email,
        "contactInfo.currentAddress": editForm.currentAddress,
        "contactInfo.permanentAddress": editForm.permanentAddress,
        "contactInfo.state": editForm.state,
        "contactInfo.city": editForm.city,
        "contactInfo.pincode": editForm.pincode,
        "emergencyContact.contactPersonName": editForm.emergencyContactName,
        "emergencyContact.contactPersonPhone": editForm.emergencyContactPhone,
        "emergencyContact.relationship": editForm.emergencyRelationship,
        documents: editForm.documents,
        labReports: editForm.labReports,
      } as any;

      if (
        editForm.documents?.affidavit?.url &&
        !["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(selectedReg.status)
      ) {
        payload.status = "AFFIDAVIT_UPLOADED";
      }

      const res = await fetch(`/api/donor-registrations/egg/${selectedReg.registrationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Egg donor registration updated successfully!");
        setIsEditOpen(false);
        fetchEggRegistrations();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (err: any) {
      toast.error("Error saving changes.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (reg: any) => {
    setRegToDelete({
      id: reg.registrationId,
      name: reg.personalInfo?.fullName || "Egg Donor Applicant",
    });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!regToDelete?.id) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/donor-registrations/egg/${regToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Registration ${regToDelete.id} deleted permanently.`);
        setDeleteModalOpen(false);
        setRegToDelete(null);
        fetchEggRegistrations();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (err) {
      toast.error("Error deleting registration");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCsv = () => {
    if (registrations.length === 0) {
      toast.error("No registrations data available to export.");
      return;
    }

    const headers = [
      "Registration ID",
      "Full Name",
      "Gender",
      "Husband Name",
      "Husband Occupation",
      "Blood Group",
      "Mobile",
      "Email",
      "Status",
      "Date",
    ];

    const rows = registrations.map((r) => [
      r.registrationId,
      r.personalInfo?.fullName || "",
      "Female",
      r.personalInfo?.husbandName || r.personalInfo?.spouseName || "",
      r.personalInfo?.husbandOccupation || r.personalInfo?.spouseOccupation || "",
      r.personalInfo?.bloodGroup || "",
      r.contactInfo?.mobileNumber || "",
      r.contactInfo?.emailAddress || "",
      r.status,
      new Date(r.createdAt).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `egg_donor_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported CSV successfully!");
  };

  return (
    <div className="space-y-6 pb-12 px-1 sm:px-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Egg Donor Registrations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review, verify, and manage incoming oocyte donor applications under Indian ART Act 2021 statutory guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={fetchEggRegistrations}
            disabled={loading}
            className="rounded-xl h-10 px-3.5 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            onClick={exportToCsv}
            className="rounded-xl h-10 px-3.5 text-xs gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl border shadow-xs">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Total Egg Applications</div>
          <div className="text-2xl sm:text-3xl font-bold mt-2 text-foreground">{stats.total || totalCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Oocyte donor records in DB</p>
        </Card>
        <Card className="p-4 rounded-2xl border shadow-xs">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">New Registrations</div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">
            {(stats as any).new ?? stats.submitted ?? registrations.filter((r) => r.status === "NEW" || r.status === "SUBMITTED").length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting initial document verification</p>
        </Card>
        <Card className="p-4 rounded-2xl border shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved</div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">
            {stats.approved ?? registrations.filter((r) => r.status === "APPROVED").length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Verified, affidavit &amp; hospital assigned</p>
        </Card>
        <Card className="p-4 rounded-2xl border shadow-xs">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Under Review</div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">
            {stats.underReview ?? registrations.filter((r) => r.status === "UNDER_REVIEW").length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Verification &amp; check in progress</p>
        </Card>
      </div>

      {/* ─── Unified Control Toolbar: Segmented Status Tabs + Search & Filters ─── */}
      <Card className="p-3.5 sm:p-4 rounded-2xl border bg-card shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="All egg donor registrations"
            >
              <span>All</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "all"
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {stats.total ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("new")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "new"
                  ? "bg-white dark:bg-slate-900 text-[#285b63] dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Incoming submitted registrations"
            >
              <span>New</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "new"
                    ? "bg-[#285b63]/10 text-[#285b63] dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {(stats as any).new ?? stats.submitted ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("draft")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "draft"
                  ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Incomplete draft registrations"
            >
              <span>Draft</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "draft"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {(stats as any).draft ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("under_review")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "under_review"
                  ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Under administrative and medical review"
            >
              <span>Under Review</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "under_review"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {(stats as any).underReview ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("documents_verified")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "documents_verified"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Identity documents verified"
            >
              <span>Documents Verified</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "documents_verified"
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {(stats as any).documentsVerified ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("affidavit_uploaded")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "affidavit_uploaded"
                  ? "bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Signed statutory affidavit uploaded"
            >
              <span>Affidavit Uploaded</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "affidavit_uploaded"
                    ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {(stats as any).affidavitUploaded ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("approved")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "approved"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Approved registrations moved to Management"
            >
              <span>Approved</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "approved"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {(stats as any).approved ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("rejected")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "rejected"
                  ? "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Rejected applications"
            >
              <span>Rejected</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "rejected"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {(stats as any).rejected ?? 0}
              </span>
            </button>

            

            {((stats as any).otherUntilApproved || 0) > 0 && (
              <button
                type="button"
                onClick={() => handleTabChange("other")}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "other"
                    ? "bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
                }`}
                title="Other intermediate statuses until approved"
              >
                <span>Other Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    activeTab === "other"
                      ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                      : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {(stats as any).otherUntilApproved ?? 0}
                </span>
              </button>
            )}
          </div>

          
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80 md:w-96">
            <Input
              placeholder="Search code, name, husband name, phone, aadhaar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 h-10 text-xs rounded-xl"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                if (val === "NEW" || val === "SUBMITTED") setActiveTab("new");
                else if (val === "DRAFT") setActiveTab("draft");
                else if (val === "UNDER_REVIEW") setActiveTab("under_review");
                else if (val === "DOCUMENTS_VERIFIED") setActiveTab("documents_verified");
                else if (val === "AFFIDAVIT_UPLOADED") setActiveTab("affidavit_uploaded");
                else if (val === "APPROVED") setActiveTab("approved");
                else if (val === "REJECTED") setActiveTab("rejected");
                else if (val === "SUSPENDED") setActiveTab("suspended");
              }}
              className="h-10 px-3 rounded-xl border border-input bg-background text-xs cursor-pointer"
            >
              {activeTab === "new" ? (
                <>
                  <option value="">All New Registrations</option>
                  <option value="NEW">New</option>
                  <option value="SUBMITTED">Submitted</option>
                </>
              ) : activeTab === "draft" ? (
                <>
                  <option value="">All Drafts</option>
                  <option value="DRAFT">Draft (Incomplete)</option>
                </>
              ) : activeTab === "under_review" ? (
                <option value="UNDER_REVIEW">Under Review</option>
              ) : activeTab === "documents_verified" ? (
                <option value="DOCUMENTS_VERIFIED">Documents Verified</option>
              ) : activeTab === "affidavit_uploaded" ? (
                <option value="AFFIDAVIT_UPLOADED">Affidavit Uploaded</option>
              ) : activeTab === "approved" ? (
                <option value="APPROVED">Approved</option>
              ) : activeTab === "rejected" ? (
                <option value="REJECTED">Rejected</option>
              ) : activeTab === "suspended" ? (
                <option value="SUSPENDED">Suspended</option>
              ) : (
                <>
                  <option value="">All Registration Statuses</option>
                  <option value="NEW">New</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="DRAFT">Draft</option>
                  <option value="DOCUMENTS_VERIFIED">Documents Verified</option>
                  <option value="AFFIDAVIT_UPLOADED">Affidavit Uploaded</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SUSPENDED">Suspended</option>
                </>
              )}
            </select>

            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-input bg-background text-xs cursor-pointer"
            >
              <option value="">All Blood Groups</option>
              {["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            {(search || statusFilter || bloodGroupFilter) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setBloodGroupFilter("");
                }}
                className="h-10 px-3 text-xs text-rose-600 gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-2xl border bg-card overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
            Loading egg donor registrations...
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-xs">
            No matching egg donor registrations found in database.
          </div>
        ) : (
          <Table className="min-w-[1050px]">
            <TableHeader>
              {activeTab === "draft" ? (
                <TableRow className="bg-amber-50/50 dark:bg-amber-950/20">
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Aadhaar No.</TableHead>
                  <TableHead>Phone / Calling</TableHead>
                  <TableHead>Step Reached</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              ) : (
                <TableRow>
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Husband Details</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Contact Details</TableHead>
                  <TableHead>Assigned Hospital</TableHead>
                  <TableHead>Donor Deal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => (
                activeTab === "draft" ? (
                  <TableRow key={reg._id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/10">
                    <TableCell className="font-bold font-mono text-foreground">
                      <span className="text-amber-800 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        {reg.registrationId}
                      </span>
                    </TableCell>

                    <TableCell className="font-semibold text-foreground">
                      <div>{reg.personalInfo?.fullName || <span className="text-muted-foreground italic font-normal">Name not filled yet</span>}</div>
                      {reg.personalInfo?.husbandName && (
                        <div className="text-[10px] text-muted-foreground">
                          Husband: {reg.personalInfo.husbandName}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="font-mono text-xs text-foreground">
                        {reg.personalInfo?.aadhaarNumber ? (
                          <span>{reg.personalInfo.aadhaarNumber.slice(0, 4)} {reg.personalInfo.aadhaarNumber.slice(4, 8)} {reg.personalInfo.aadhaarNumber.slice(8)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {reg.contactInfo?.mobileNumber ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <a
                            href={`tel:${reg.contactInfo.mobileNumber}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold transition shadow-2xs"
                            title="Click to call applicant"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{reg.contactInfo.mobileNumber}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(reg.contactInfo.mobileNumber);
                              toast.success("Phone number copied!");
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Copy number"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-900 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>Left at Step {reg.currentStep || 1} of 5</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {reg.updatedAt ? new Date(reg.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {reg.contactInfo?.mobileNumber && (
                          <a
                            href={`tel:${reg.contactInfo.mobileNumber}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                            title="Call applicant"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> Call
                          </a>
                        )}
                        <a
                          href={`http://localhost:3000/register/egg?draftId=${reg.registrationId}&step=${reg.currentStep || 1}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#285b63] hover:bg-[#1d464d] text-white text-xs font-bold transition shadow-xs"
                          title="Open pre-filled form to continue registration"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Resume Form
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = `http://localhost:3000/register/egg?draftId=${reg.registrationId}&step=${reg.currentStep || 1}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Direct resume link copied to clipboard!");
                          }}
                          className="rounded-xl h-8 px-2 text-xs"
                          title="Copy Direct Resume Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReg(reg);
                            setIsDetailOpen(true);
                          }}
                          className="rounded-xl h-8 px-2.5 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                <TableRow key={reg._id}>
                  <TableCell className="font-bold font-mono text-foreground">
                    <span>{reg.registrationId}</span>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    <div>{reg.personalInfo?.fullName || "Awaiting Name"}</div>
                    {reg.referredBy && (
                      <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                        Ref: {reg.referredBy}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">
                        {reg.personalInfo?.husbandName || reg.personalInfo?.spouseName || "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {reg.personalInfo?.husbandOccupation || reg.personalInfo?.spouseOccupation || "Occupation: Not specified"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-rose-600">{reg.personalInfo?.bloodGroup || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{reg.contactInfo?.mobileNumber || "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{reg.contactInfo?.emailAddress || "—"}</div>
                    </div>
                  </TableCell>

                  {/* Assigned Hospital */}
                  <TableCell>
                    {reg.assignedHospital ? (
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {reg.assignedHospital.shortName || reg.assignedHospital.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{reg.assignedHospital.city || "Verified"}</div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenDealModal(reg)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Assign Hospital
                      </button>
                    )}
                  </TableCell>

                  {/* Donor Deal */}
                  <TableCell>
                    {(() => {
                      const hosp = reg.assignedHospital;
                      const category = reg.donorDeal?.donorCategory || reg.clinicDeal?.donorCategory || "normal";
                      const amount =
                        reg.donorDeal?.compensationAmount ||
                        (hosp ? (category === "profile" ? 60000 : 40000) : 0);

                      if (amount > 0) {
                        return (
                          <div
                            className="space-y-0.5 cursor-pointer group"
                            onClick={() => handleOpenDealModal(reg)}
                            title="Click to view or edit donor deal"
                          >
                            <div className="font-mono font-bold text-emerald-600 flex items-center gap-1 group-hover:underline">
                              ₹{Number(amount).toLocaleString()}
                            </div>
                            <span
                              className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                category === "profile"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                              }`}
                            >
                              {category === "profile" ? "Profile" : "Normal"}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDealModal(reg)}
                          className="h-6 px-2 text-[10px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> + Set Deal
                        </Button>
                      );
                    })()}
                  </TableCell>

                  {/* Status Button (Refined pill button matching Mediyaz design system) */}
                  <TableCell>
                    {(() => {
                      const status = reg.status || "NEW";
                      const isDone = status === "APPROVED" || status === "FILE_COMPLETED" || status === "COMPLETED";
                      const isInProcess = status === "DOCUMENTS_VERIFIED" || status === "AFFIDAVIT_UPLOADED" || status === "UNDER_REVIEW";
                      const isNew = status === "NEW" || status === "SUBMITTED";
                      const isDraft = status === "DRAFT";
                      const isRejected = status === "REJECTED" || status === "SUSPENDED";

                      let iconNode: React.ReactNode = null;
                      let labelText = "";
                      let subBadge = "";
                      let statusTheme = "";

                      if (isDone) {
                        statusTheme = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
                        iconNode = (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                          </span>
                        );
                        labelText = "Done";
                      } else if (isInProcess) {
                        statusTheme = "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
                        iconNode = (
                          <span className="text-sky-600 dark:text-sky-400 text-xs font-mono font-bold leading-none select-none">✻</span>
                        );
                        labelText = "In Process";
                        subBadge = status === "DOCUMENTS_VERIFIED" ? "Docs" : status === "AFFIDAVIT_UPLOADED" ? "Affidavit" : "";
                      } else if (isNew) {
                        statusTheme = "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800";
                        iconNode = (
                          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                        );
                        labelText = "New";
                      } else if (isDraft) {
                        statusTheme = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
                        iconNode = (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        );
                        labelText = "Draft";
                      } else if (isRejected) {
                        statusTheme = "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
                        iconNode = (
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        );
                        labelText = "Rejected";
                      } else {
                        statusTheme = "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700";
                        iconNode = <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />;
                        labelText = status.replace(/_/g, " ");
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReg(reg);
                            setIsDetailOpen(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 shadow-2xs hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${statusTheme}`}
                          title={`Status: ${status.replace(/_/g, " ")} — Click to review details`}
                        >
                          {iconNode}
                          <span>{labelText}</span>
                          {subBadge && (
                            <span className="text-[10px] opacity-80 font-normal">
                              ({subBadge})
                            </span>
                          )}
                        </button>
                      );
                    })()}

                    {(reg.recruitmentDate || reg.supplyDate || reg.pickupDate) && (
                      <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5 font-normal">
                        {reg.recruitmentDate && <div>Recruit: <span className="font-semibold text-foreground">{formatDisplayDate(reg.recruitmentDate)}</span></div>}
                        {reg.supplyDate && <div>Supply: <span className="font-semibold text-foreground">{formatDisplayDate(reg.supplyDate)}</span></div>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
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
                        <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedReg(reg);
                              setAdminNotes(reg.adminNotes || "");
                              setIsDetailOpen(true);
                            }}
                            className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                          >
                            <Eye className="w-4 h-4 text-blue-600" /> View / Review Registration
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(reg)}
                            className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                          >
                            <Edit3 className="w-4 h-4 text-emerald-600" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenPrint(reg)}
                            className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                          >
                            <Printer className="w-4 h-4 text-teal-600" /> Print Registration File
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDealModal(reg)}
                            className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                          >
                            <Building2 className="w-4 h-4 text-blue-600" /> Hospital Deal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(reg)}
                            className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" /> Delete Registration
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
                )
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && registrations.length > 0 && (
          <div className="p-4 border-t">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </Card>

      {/* Detail Review Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-3xl max-w-5xl bg-background border shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {selectedReg && (() => {
            const wf = getWorkflowStatus(selectedReg);
            const isDocVerified = wf.step2Complete;
            const hasAffidavit = wf.details.hasAffidavit;
            const isRegistry = wf.details.isRegistry;

            return (
              <div className="space-y-6">
                {/* ─── Profile Header ────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b pb-5 justify-between">
                  <div className="flex items-center gap-4">
                    {selectedReg.documents?.passportPhoto?.url ? (
                      <img
                        alt="Passport Photo"
                        src={selectedReg.documents.passportPhoto.url}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border">
                        No Photo
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-foreground">
                          {selectedReg.personalInfo?.fullName}
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200">
                          {selectedReg.personalInfo?.bloodGroup || "Blood Group —"}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          selectedReg.status === "APPROVED" || selectedReg.status === "FILE_COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : selectedReg.status === "AFFIDAVIT_UPLOADED"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                            : selectedReg.status === "DOCUMENTS_VERIFIED"
                            ? "bg-sky-100 text-sky-800 border-sky-200"
                            : "bg-teal-100 text-teal-800 border-teal-200"
                        }`}>
                          Status: {selectedReg.status === "SUBMITTED" ? "NEW" : (selectedReg.status || "NEW").replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reg ID: <span className="font-mono font-bold text-foreground">{selectedReg.registrationId}</span>
                        {selectedReg.donorId && (
                          <> • Donor ID: <span className="font-mono font-bold text-rose-600">{selectedReg.donorId}</span></>
                        )}
                        {" "}• Gender: Female (Egg Donor) • Age: {selectedReg.personalInfo?.age || "—"} Yrs
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenPrint(selectedReg)}
                      className="h-8 rounded-xl text-xs gap-1.5 shadow-xs border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-600" /> Print Registration & Forms
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleOpenEdit(selectedReg);
                        setIsDetailOpen(false);
                      }}
                      className="h-8 rounded-xl text-xs gap-1.5 text-emerald-600 border-emerald-250 hover:bg-emerald-50 shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Registration
                    </Button>
                  </div>
                </div>

                {/* ─── 4-Step Pipeline Workflow Stepper ──────────────────────── */}
                <div className="p-4 rounded-2xl border bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-900/30 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Egg Donor Approval Pipeline</h3>
                    {wf.allComplete ? (
                      <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready for Management
                      </span>
                    ) : (
                      <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Step-Gated Flow Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        num: 1,
                        label: "Registration Info",
                        sublabel: "Personal, husband & contact details",
                        done: wf.step1Complete,
                        locked: false,
                        icon: ClipboardList,
                      },
                      {
                        num: 2,
                        label: "Document Verification",
                        sublabel: wf.step2Complete
                          ? "Identity docs matched with form"
                          : "Review uploaded docs vs form",
                        done: wf.step2Complete,
                        locked: false,
                        icon: ShieldCheck,
                      },
                      {
                        num: 3,
                        label: "Affidavit Upload",
                        sublabel: wf.step3Complete
                          ? "Notarized affidavit on file"
                          : wf.step2Complete
                          ? "Download, notarize & upload"
                          : "Verify docs in Step 2 first",
                        done: wf.step3Complete,
                        locked: !wf.step2Complete,
                        icon: FileBadge2,
                      },
                      {
                        num: 4,
                        label: "Hospital & Deal",
                        sublabel: wf.step4Complete
                          ? "Hospital & deals configured"
                          : wf.step3Complete
                          ? "Registry / Normal / Profile deal"
                          : "Upload affidavit in Step 3 first",
                        done: wf.step4Complete,
                        locked: !wf.step3Complete,
                        icon: Building2,
                      },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className={`relative p-3 rounded-xl border text-xs transition-all ${
                          step.done
                            ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                            : step.locked
                            ? "bg-muted/30 border-dashed border-border opacity-60"
                            : "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 ring-1 ring-amber-300"
                        }`}
                      >
                        {step.locked && (
                          <Lock className="w-3 h-3 absolute top-2.5 right-2.5 text-muted-foreground" />
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            step.done ? "bg-emerald-500 text-white" : step.locked ? "bg-muted text-muted-foreground" : "bg-amber-500 text-white"
                          }`}>
                            {step.done ? <Check className="w-3 h-3" /> : step.num}
                          </div>
                          <span className={`font-bold text-[11px] truncate ${
                            step.done ? "text-emerald-700 dark:text-emerald-400" : step.locked ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed pl-6">{step.sublabel}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── Step 1 & 2: Side-by-Side Form vs Document Comparison ──── */}
                <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4.5 h-4.5 text-rose-600" />
                        Step 1 &amp; 2: Review Registration Form vs Uploaded Identity Documents
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Compare applicant and husband identity details side-by-side with uploaded Aadhaar, photograph, and signature.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDocVerified ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Documents Verified ✓
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Verification Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left Column: Form Details */}
                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Registration Form Data (Submitted)
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-semibold">Female Egg Donor</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Donor Full Name:</span>
                          <span className="font-bold text-foreground text-sm">{selectedReg.personalInfo?.fullName || "—"}</span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Husband Name:</span>
                          <span className="font-bold text-foreground text-sm">
                            {selectedReg.personalInfo?.husbandName || selectedReg.personalInfo?.spouseName || "—"}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Date of Birth &amp; Age:</span>
                          <span className="font-semibold text-foreground">
                            {selectedReg.personalInfo?.dateOfBirth || "—"} ({selectedReg.personalInfo?.age || "—"} Years)
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Aadhaar Number:</span>
                          <span className="font-mono font-bold text-foreground">
                            {selectedReg.personalInfo?.aadhaarNumber || "—"}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border sm:col-span-2">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Residential Address:</span>
                          <span className="text-foreground">
                            {selectedReg.contactInfo?.currentAddress || "—"}
                            {selectedReg.contactInfo?.city && `, ${selectedReg.contactInfo.city}`}
                            {selectedReg.contactInfo?.state && `, ${selectedReg.contactInfo.state}`}
                            {selectedReg.contactInfo?.pincode && ` - ${selectedReg.contactInfo.pincode}`}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Mobile &amp; Email:</span>
                          <span className="text-foreground font-mono">
                            {selectedReg.contactInfo?.mobileNumber || "—"}
                            {selectedReg.contactInfo?.emailAddress && ` • ${selectedReg.contactInfo.emailAddress}`}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Education &amp; Occupation:</span>
                          <span className="text-foreground">
                            {selectedReg.personalInfo?.education || "—"} | {selectedReg.personalInfo?.occupation || "—"}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border sm:col-span-2">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Referral / Sourcing:</span>
                          <span className="text-teal-700 dark:text-teal-300 font-semibold">
                            Source: {selectedReg.referral?.sourceReferralType || "Online"}
                            {selectedReg.agentCode && ` (Agent / Refer ID: ${selectedReg.agentCode})`}
                            {selectedReg.referredBy && ` (Referred by: ${selectedReg.referredBy})`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Uploaded Identity Documents */}
                    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Uploaded Identity Documents
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-semibold">Aadhaar, Photo &amp; Sign</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            key: "aadhaarFront",
                            label: "Aadhaar Front",
                            doc: selectedReg.documents?.aadhaarFront,
                            icon: ShieldCheck,
                            color: "text-blue-600",
                          },
                          {
                            key: "aadhaarBack",
                            label: "Aadhaar Back",
                            doc: selectedReg.documents?.aadhaarBack,
                            icon: ShieldCheck,
                            color: "text-blue-600",
                          },
                          {
                            key: "passportPhoto",
                            label: "Passport Photo",
                            doc: selectedReg.documents?.passportPhoto,
                            icon: User,
                            color: "text-emerald-600",
                          },
                          {
                            key: "signature",
                            label: "Donor Signature",
                            doc: selectedReg.documents?.signature,
                            icon: Edit3,
                            color: "text-purple-600",
                          },
                        ].map((item, idx) => {
                          const hasDoc = !!item.doc?.url;
                          const isImg = hasDoc && !item.doc.url.toLowerCase().endsWith(".pdf");

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                                hasDoc ? "bg-background border-border" : "bg-muted/40 border-dashed"
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold flex items-center gap-1 truncate">
                                    <item.icon className={`w-3 h-3 ${item.color} shrink-0`} />
                                    <span className="truncate">{item.label}</span>
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    hasDoc ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                                  }`}>
                                    {hasDoc ? "Uploaded" : "Missing"}
                                  </span>
                                </div>

                                {hasDoc && isImg && (
                                  <div
                                    onClick={() => setPreviewMedia({ url: item.doc.url, title: item.label })}
                                    className="w-full h-24 rounded-lg overflow-hidden border bg-muted/40 cursor-pointer relative group flex items-center justify-center"
                                  >
                                    <img
                                      src={item.doc.url}
                                      alt={item.label}
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                      <Eye className="w-3 h-3" /> Enlarge
                                    </div>
                                  </div>
                                )}

                                {hasDoc && !isImg && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMedia({ url: item.doc.url, title: item.label })}
                                    className="w-full h-24 rounded-lg border bg-muted/40 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground text-xs gap-1 cursor-pointer transition-colors"
                                  >
                                    <FileText className="w-6 h-6 text-rose-500" />
                                    <span className="text-[10px] font-mono truncate max-w-[90%]">
                                      View PDF
                                    </span>
                                  </button>
                                )}

                                {!hasDoc && (
                                  <div className="w-full h-24 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-[10px] italic">
                                    Not uploaded
                                  </div>
                                )}
                              </div>

                              {hasDoc && (
                                <div className="pt-2 mt-1 border-t flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMedia({ url: item.doc.url, title: item.label })}
                                    className="text-[10px] text-rose-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Eye className="w-2.5 h-2.5" /> Preview Document
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Document Verification Action Footer */}
                  <div className="p-3.5 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      {isDocVerified ? (
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Identity verified against registration data. Step 2 Complete!
                        </div>
                      ) : (
                        <div className="text-slate-700 dark:text-slate-300">
                          Confirm that the name, husband name, age, and Aadhaar on the uploaded cards match the form above.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDocVerified ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifyDocuments(false)}
                          disabled={actionLoading}
                          className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl cursor-pointer"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3 mr-1" />
                          )}
                          Re-check / Reset Verification
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleVerifyDocuments(true)}
                          disabled={actionLoading}
                          className="h-9 text-xs font-bold px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Confirm &amp; Mark Documents Verified (Proceed to Step 3)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── Step 3: Statutory Affidavit (Rule 14) Execution & Upload ── */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  !isDocVerified
                    ? "bg-muted/20 border-dashed opacity-60"
                    : hasAffidavit
                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                    : "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 ring-1 ring-amber-300"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      {!isDocVerified ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <FileBadge2 className={`w-4.5 h-4.5 ${hasAffidavit ? "text-emerald-600" : "text-amber-600"}`} />
                      )}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                          Step 3: Statutory Affidavit (ART Act 2021 — Rule 14)
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Download pre-filled template, execute on non-judicial stamp paper with notary seal, and upload.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasAffidavit ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Affidavit Uploaded ✓
                        </span>
                      ) : isDocVerified ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Upload Required
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground border flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Locked (Complete Step 2 First)
                        </span>
                      )}
                    </div>
                  </div>

                  {!isDocVerified ? (
                    <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed">
                      Step 3 is locked. Please verify identity documents in Step 2 above to unlock affidavit generation and upload.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                      {/* Left: Download Instructions & Button */}
                      <div className="p-4 bg-background rounded-xl border space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-rose-600" />
                          Download Affidavit Template
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Click below to open and print the pre-filled statutory affidavit (Blank E-Stamp page with donor signature, followed by affidavit clauses and verification).
                        </p>
                        <Button
                          size="sm"
                          onClick={() => downloadAffidavit(selectedReg)}
                          className="w-full h-9 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white gap-2 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" /> Download &amp; Print Affidavit Template
                        </Button>
                      </div>

                      {/* Right: Upload Area */}
                      <div className="p-4 bg-background rounded-xl border space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          Upload Signed &amp; Notarized Affidavit
                        </h4>

                        {hasAffidavit ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                                    Current Affidavit:
                                  </span>{" "}
                                  <span className="font-mono text-muted-foreground text-[11px] truncate max-w-[180px] inline-block align-bottom">
                                    {selectedReg.documents?.affidavit?.fileName || "affidavit.pdf"}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPreviewMedia({ url: selectedReg.documents?.affidavit?.url, title: "Uploaded Affidavit" })}
                                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                            </div>

                            <FileUploadField
                              label="Replace Notarized Affidavit"
                              value={selectedReg.documents?.affidavit as any}
                              folder="affidavit"
                              accept=".pdf,.png,.jpg,.jpeg,.webp"
                              onChange={handleAffidavitUpload}
                              description="Click 'Replace' to select and upload a new signed & notarized affidavit file, or 'X' to remove."
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Upload the stamped and notarized affidavit (PDF or high-resolution image).
                            </p>
                            <FileUploadField
                              label="Upload Notarized Affidavit (PDF / Image)"
                              value={undefined as any}
                              folder="affidavit"
                              accept=".pdf,.png,.jpg,.jpeg,.webp"
                              onChange={handleAffidavitUpload}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Step 4: Hospital & Deal Tier Allocation ────────────────── */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  !hasAffidavit
                    ? "bg-muted/20 border-dashed opacity-60"
                    : wf.step4Complete
                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                    : "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 ring-1 ring-blue-300"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      {!hasAffidavit ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Building2 className={`w-4.5 h-4.5 ${wf.step4Complete ? "text-emerald-600" : "text-blue-600"}`} />
                      )}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                          Step 4: Hospital Allocation &amp; Deal Configuration
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Select ART clinic, choose Deal Tier (Registry, Normal, or Profile), and specify schedule dates.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {wf.step4Complete ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hospital &amp; Deals Configured ✓
                        </span>
                      ) : hasAffidavit ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> Setup Required
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground border flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Locked (Upload Affidavit First)
                        </span>
                      )}
                    </div>
                  </div>

                  {!hasAffidavit ? (
                    <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed">
                      Step 4 is locked. Please upload the signed and notarized affidavit in Step 3 to unlock hospital and deal configuration.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 3 Tier Explanation Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                          isRegistry
                            ? "bg-teal-50 border-teal-300 ring-2 ring-teal-500/20 dark:bg-teal-950/30"
                            : "bg-background border-border"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                              🏛️ Option 1: Registry
                            </span>
                            {isRegistry && <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-200 text-teal-900">Active</span>}
                          </div>
                          <p className="text-[11px] text-muted-foreground">Direct ART Bank Registry allocation. <strong>No donor deal required (₹0 donor payout).</strong></p>
                        </div>

                        <div className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                          !isRegistry && (selectedReg.donorDeal?.donorCategory === "normal" || selectedReg.clinicDeal?.donorCategory === "normal")
                            ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 dark:bg-blue-950/30"
                            : "bg-background border-border"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                              👤 Option 2: Normal
                            </span>
                            {!isRegistry && (selectedReg.donorDeal?.donorCategory === "normal" || selectedReg.clinicDeal?.donorCategory === "normal") && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-900">Active</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">Standard donor tier. <strong>Includes donor compensation deal (standard ₹40,000).</strong></p>
                        </div>

                        <div className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                          !isRegistry && (selectedReg.donorDeal?.donorCategory === "profile" || selectedReg.clinicDeal?.donorCategory === "profile")
                            ? "bg-purple-50 border-purple-300 ring-2 ring-purple-500/20 dark:bg-purple-950/30"
                            : "bg-background border-border"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                              ⭐ Option 3: Profile
                            </span>
                            {!isRegistry && (selectedReg.donorDeal?.donorCategory === "profile" || selectedReg.clinicDeal?.donorCategory === "profile") && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-900">Active</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">Premium donor tier. <strong>Includes donor compensation deal (standard ₹60,000).</strong></p>
                        </div>
                      </div>

                      {/* Current Assignment Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="p-3 bg-background rounded-xl border text-xs space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-500" /> Assigned Hospital
                          </span>
                          <div className="font-bold text-foreground">
                            {selectedReg.assignedHospital?.name || (
                              <span className="text-amber-600">Not assigned yet</span>
                            )}
                          </div>
                          {selectedReg.assignedHospital?.city && (
                            <div className="text-[10px] text-muted-foreground">
                              {selectedReg.assignedHospital.city}, {selectedReg.assignedHospital.state}
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-background rounded-xl border text-xs space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-emerald-500" /> Donor Deal Status
                          </span>
                          {isRegistry ? (
                            <div className="font-bold text-teal-700 dark:text-teal-300">
                              Registry (₹0 Payout)
                            </div>
                          ) : (
                            <div className="font-bold text-emerald-600 font-mono text-sm">
                              {selectedReg.donorDeal?.compensationAmount
                                ? `₹${Number(selectedReg.donorDeal.compensationAmount).toLocaleString()}`
                                : "Not configured"}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground">
                            {selectedReg.donorDeal?.paymentTerms || "Full upon retrieval"}
                          </div>
                        </div>

                        <div className="p-3 bg-background rounded-xl border text-xs space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-teal-500" /> Recruitment Date
                          </span>
                          <div className="font-bold text-foreground">
                            {formatDisplayDate(selectedReg.recruitmentDate) || "—"}
                          </div>
                        </div>

                        <div className="p-3 bg-background rounded-xl border text-xs space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-teal-500" /> Supply Date
                          </span>
                          <div className="font-bold text-foreground">
                            {formatDisplayDate(selectedReg.supplyDate) || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleOpenDealModal(selectedReg)}
                          className="h-9 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          {selectedReg.assignedHospital ? "Edit Hospital & Deal Setup" : "Select Hospital & Configure Deal"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Review Notes & Application Decision Center ────────────── */}
                <div className="p-5 rounded-2xl bg-muted/40 border space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Clinical Reviewer Remarks &amp; Pipeline Actions
                  </h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter clinical assessment notes or verification remarks..."
                    rows={2}
                    className="w-full p-3 text-xs bg-background border rounded-xl focus:ring-1 focus:ring-rose-500"
                  />

                  <div className="flex flex-wrap gap-2 justify-end pt-1">
                    <Button
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedReg.registrationId, "UNDER_REVIEW")}
                      variant="outline"
                      className="h-9 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 rounded-xl"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1" /> Mark Under Review
                    </Button>
                    <Button
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedReg.registrationId, "REJECTED")}
                      variant="outline"
                      className="h-9 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Reject Application
                    </Button>
                    <Button
                      size="sm"
                      disabled={actionLoading || !wf.allComplete}
                      onClick={() => handleUpdateStatus(selectedReg.registrationId, "APPROVED")}
                      className={`h-9 text-xs font-bold px-5 rounded-xl shadow-xs ${
                        wf.allComplete
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-muted text-muted-foreground cursor-not-allowed border"
                      }`}
                    >
                      {wf.allComplete ? (
                        <><Check className="w-4 h-4 mr-1.5" /> Approve &amp; Move to Egg Donor Management</>
                      ) : (
                        <><Lock className="w-3.5 h-3.5 mr-1.5" /> Complete Steps 1-4 to Approve</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Dual Deals & Hospital Assignment Modal */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent className="rounded-2xl max-w-2xl bg-background border p-6 max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {dealForm.targetStatus === "APPROVED"
                    ? "Approve Egg Donor: Hospital Assignment & Setup"
                    : "Manage Hospital Assignment & Donor Deal"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Assign ART clinic, select donor category (Normal or Profile), and specify donor compensation.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitDeal} className="space-y-5 pt-3">
            {/* Donor Banner */}
            {selectedReg && (
              <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-foreground text-sm">{selectedReg.personalInfo?.fullName}</span>
                  <span className="text-muted-foreground ml-2">
                    (ID: <span className="font-mono font-bold text-foreground">{selectedReg.registrationId}</span>)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px]">
                    Blood: {selectedReg.personalInfo?.bloodGroup || "—"}
                  </span>
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-700 font-bold rounded text-[10px]">
                    Egg Donor (Female)
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 1: ASSIGN HOSPITAL */}
            <div className="space-y-2 border-b pb-4">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                1. Select ART Clinic / Hospital <span className="text-rose-600">*</span>
              </label>
              <select
                value={dealForm.assignedHospitalId}
                onChange={(e) => handleHospitalChange(e.target.value)}
                required
                className="w-full p-2.5 text-xs bg-background border rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
              >
                <option value="">— Select ART Hospital / Clinic —</option>
                {hospitals.map((hosp) => (
                  <option key={hosp._id} value={hosp._id}>
                    {hosp.name} ({hosp.city}, {hosp.state})
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION 2: DONOR CATEGORY (REGISTRY VS NORMAL VS PROFILE) */}
            <div className="space-y-3 border-b pb-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  2. Deal Option (Registry vs Normal vs Profile) <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground italic">Select option</span>
              </div>

              {/* Deal Options: Registry vs Normal vs Profile */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("registry")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    dealForm.donorCategory === "registry"
                      ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-400"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Registry</span>
                    {dealForm.donorCategory === "registry" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Direct clinic registration (no donor deal)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange("normal")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    dealForm.donorCategory === "normal"
                      ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-400"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Normal</span>
                    {dealForm.donorCategory === "normal" && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Standard ART bank screening &amp; matching</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange("profile")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    dealForm.donorCategory === "profile"
                      ? "border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-400"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Profile</span>
                    {dealForm.donorCategory === "profile" && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Premium tier with verified profile</p>
                </button>
              </div>
            </div>

            {/* SECTION 3: DEAL WITH DONOR (Hidden for Registry) */}
            {dealForm.donorCategory !== "registry" ? (
              <div className="space-y-3 border-b pb-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    3. Deal with Donor (Compensation Amount) <span className="text-rose-600">*</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-foreground">
                    Donor Compensation Amount (₹ INR) <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    type="number"
                    value={dealForm.compensationAmount || ""}
                    onChange={(e) => setDealForm({ ...dealForm, compensationAmount: Number(e.target.value) })}
                    placeholder="e.g. 45000"
                    className="text-xs font-mono font-bold text-emerald-600"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Registry Option Selected:</strong> No donor compensation deal required for this registration.</span>
              </div>
            )}

            {/* SECTION 4: APPROVAL & ADMIN NOTES */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground">Approval Remarks / Notes</label>
              <textarea
                value={dealForm.adminNotes}
                onChange={(e) => setDealForm({ ...dealForm, adminNotes: e.target.value })}
                placeholder="Enter clinical assessment notes or specific terms for this egg donor match..."
                rows={2}
                className="w-full p-2.5 text-xs bg-background border rounded-xl"
              />
            </div>

            {/* SECTION 5: RECRUITMENT & SUPPLY DATES */}
            <div className="space-y-3 border-b pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Recruitment Date
                  </label>
                  <Input
                    type="date"
                    value={dealForm.recruitmentDate}
                    onChange={(e) => setDealForm({ ...dealForm, recruitmentDate: e.target.value })}
                    className="rounded-xl text-xs h-9"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Donor onboarding and recruitment confirmation date.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Supply Date
                  </label>
                  <Input
                    type="date"
                    value={dealForm.supplyDate}
                    onChange={(e) => setDealForm({ ...dealForm, supplyDate: e.target.value })}
                    className="rounded-xl text-xs h-9"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Scheduled or completed hospital delivery / supply date.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDealModalOpen(false)}
                className="text-xs h-9 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className={`text-xs h-9 rounded-xl font-bold px-4 ${
                  dealForm.targetStatus === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                  </>
                ) : dealForm.targetStatus === "APPROVED" ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" /> Confirm Hospital, Deals &amp; Approve
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5 mr-1.5" /> Save Hospital &amp; Deals
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl max-w-3xl bg-background border p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Egg Donor Registration &amp; Documents</DialogTitle>
            <DialogDescription className="text-xs">
              Update oocyte donor details, identity cards (Aadhaar), signature, and medical documents.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            {/* Tab Navigation */}
            <div className="flex border-b gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEditTab("details")}
                className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
                  editTab === "details"
                    ? "border-rose-600 text-rose-600 font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Personal &amp; Family Info
              </button>
              <button
                type="button"
                onClick={() => setEditTab("documents")}
                className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
                  editTab === "documents"
                    ? "border-rose-600 text-rose-600 font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Identity Documents &amp; Signature
              </button>
              <button
                type="button"
                onClick={() => setEditTab("labReports")}
                className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
                  editTab === "labReports"
                    ? "border-rose-600 text-rose-600 font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className="w-3.5 h-3.5" /> Lab Reports
              </button>
              <button
                type="button"
                onClick={() => setEditTab("affidavit")}
                className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
                  editTab === "affidavit"
                    ? "border-rose-600 text-rose-600 font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileBadge2 className="w-3.5 h-3.5" /> Affidavit
              </button>
            </div>

            {/* TAB 1: Personal Details (Extended) */}
            {editTab === "details" && (
              <div className="space-y-4">
                <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Fields marked <span className="font-bold text-rose-600">*</span> match the registration form. Changes save directly to the database.</span>
                </div>

                {/* Section: Core Info */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Core Identity</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Full Legal Name <span className="text-rose-500">*</span></label>
                      <Input value={editForm.fullName || ""} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Gender</label>
                      <Input value="Female" readOnly className="bg-muted cursor-not-allowed font-semibold text-rose-600 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Date of Birth <span className="text-rose-500">*</span></label>
                      <Input type="date" value={editForm.dateOfBirth || ""} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Aadhaar Card Number <span className="text-rose-500">*</span></label>
                      <Input value={editForm.aadhaarNumber || ""} onChange={(e) => setEditForm({ ...editForm, aadhaarNumber: e.target.value })} maxLength={12} placeholder="12-digit" className="text-xs font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Blood Group <span className="text-rose-500">*</span></label>
                      <select value={editForm.bloodGroup || ""} onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs">
                        <option value="">Select Blood Group</option>
                        {["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Religion</label>
                      <Input value={editForm.religion || ""} onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })} placeholder="e.g. Hindu, Muslim, Christian" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Father&apos;s Name</label>
                      <Input value={editForm.fatherName || ""} onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })} placeholder="Father's full name" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Marital Status</label>
                      <select value={editForm.maritalStatus || "Married"} onChange={(e) => setEditForm({ ...editForm, maritalStatus: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs">
                        <option value="Married">Married</option>
                        <option value="Unmarried">Unmarried</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Education / Qualification</label>
                      <Input value={editForm.education || ""} onChange={(e) => setEditForm({ ...editForm, education: e.target.value })} placeholder="e.g. Graduate, 12th Pass" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Occupation</label>
                      <Input value={editForm.occupation || ""} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} placeholder="e.g. Homemaker, Farmer" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Height (cm)</label>
                      <Input type="number" value={editForm.height || ""} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} placeholder="e.g. 158" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Weight (kg)</label>
                      <Input type="number" value={editForm.weight || ""} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} placeholder="e.g. 55" className="text-xs" />
                    </div>
                  </div>
                </div>

                {/* Section: Husband / Spouse */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-2">Husband / Spouse Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-rose-600 font-bold">Husband&apos;s Name <span className="text-rose-500">*</span></label>
                      <Input value={editForm.husbandName || ""} onChange={(e) => setEditForm({ ...editForm, husbandName: e.target.value })} placeholder="Husband full legal name" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-rose-600 font-bold">Husband&apos;s Occupation <span className="text-rose-500">*</span></label>
                      <Input value={editForm.husbandOccupation || ""} onChange={(e) => setEditForm({ ...editForm, husbandOccupation: e.target.value })} placeholder="e.g. Service, Business, Farmer" className="text-xs" />
                    </div>
                  </div>
                </div>

                {/* Section: Contact */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Contact Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Mobile Number <span className="text-rose-500">*</span></label>
                      <Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Email Address</label>
                      <Input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="text-xs" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-semibold">Current Address <span className="text-rose-500">*</span></label>
                      <Input value={editForm.currentAddress || ""} onChange={(e) => setEditForm({ ...editForm, currentAddress: e.target.value })} className="text-xs" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-semibold">Permanent Address</label>
                      <Input value={editForm.permanentAddress || ""} onChange={(e) => setEditForm({ ...editForm, permanentAddress: e.target.value })} placeholder="If different from current" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">State</label>
                      <Input value={editForm.state || ""} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} placeholder="e.g. Maharashtra" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">City</label>
                      <Input value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="e.g. Pune" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Pincode</label>
                      <Input value={editForm.pincode || ""} onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })} maxLength={6} placeholder="6-digit" className="text-xs font-mono" />
                    </div>
                  </div>
                </div>

                {/* Section: Emergency Contact */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Emergency Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Contact Person Name</label>
                      <Input value={editForm.emergencyContactName || ""} onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })} placeholder="Name of emergency contact" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Contact Phone</label>
                      <Input value={editForm.emergencyContactPhone || ""} onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} placeholder="Mobile number" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold">Relationship</label>
                      <select value={editForm.emergencyRelationship || "Husband"} onChange={(e) => setEditForm({ ...editForm, emergencyRelationship: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs">
                        <option value="Husband">Husband</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Documents & KYC (Aadhaar, Signature, Photo, Other) */}
            {editTab === "documents" && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Upload or replace donor Aadhaar cards, passport photo, and handwritten signatures.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileUploadField
                    label="Passport Photo"
                    value={editForm.documents?.passportPhoto || null}
                    onChange={(file) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        documents: { ...prev.documents, passportPhoto: file },
                      }))
                    }
                    accept=".png,.jpg,.jpeg,.webp"
                    folder="profile-images"
                    enableCrop={true}
                    cropMode="photo"
                  />
                  <FileUploadField
                    label="Aadhaar Card (Front)"
                    value={editForm.documents?.aadhaarFront || null}
                    onChange={(file) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        documents: { ...prev.documents, aadhaarFront: file },
                      }))
                    }
                    accept=".png,.jpg,.jpeg,.webp"
                    folder="documents"
                    enableCrop={true}
                    cropMode="document"
                  />
                  <FileUploadField
                    label="Aadhaar Card (Back)"
                    value={editForm.documents?.aadhaarBack || null}
                    onChange={(file) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        documents: { ...prev.documents, aadhaarBack: file },
                      }))
                    }
                    accept=".png,.jpg,.jpeg,.webp"
                    folder="documents"
                    enableCrop={true}
                    cropMode="document"
                  />
                  <FileUploadField
                    label="Donor Signature"
                    value={editForm.documents?.signature || null}
                    onChange={(file) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        documents: { ...prev.documents, signature: file },
                      }))
                    }
                    accept=".png,.jpg,.jpeg,.webp"
                    folder="documents"
                    enableCrop={true}
                    cropMode="signature"
                  />
                  <div className="sm:col-span-2">
                    <FileUploadField
                      label="Other Supporting Document"
                      value={editForm.documents?.otherDocument || null}
                      onChange={(file) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          documents: { ...prev.documents, otherDocument: file },
                        }))
                      }
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      folder="documents"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Lab Reports */}
            {editTab === "labReports" && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Attach or update medical examination reports, viral screening, and mandatory donor insurance.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileUploadField
                    label="Blood Test Report"
                    value={editForm.labReports?.bloodReport || null}
                    onChange={(file) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        labReports: { ...prev.labReports, bloodReport: file },
                      }))
                    }
                    accept=".pdf,.png,.jpg,.jpeg"
                    folder="documents"
                  />

                  <FileUploadField
                    label="Viral Markers Report (HIV, HBsAg, HCV, VDRL)"
                    value={
                      editForm.labReports?.viralMarkersReport ||
                      (Array.isArray(editForm.labReports?.viralMarkers)
                        ? editForm.labReports?.viralMarkers[0]
                        : editForm.labReports?.viralMarkers) ||
                      null
                    }
                    onChange={(file) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        labReports: {
                          ...prev.labReports,
                          viralMarkersReport: file,
                          viralMarkers: file ? [file] : [],
                        },
                      }))
                    }
                    accept=".pdf,.png,.jpg,.jpeg"
                    folder="documents"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FileUploadField
                    label="Life / Medical Insurance (Rule 13 — Mandatory)"
                    value={editForm.labReports?.insurance || editForm.documents?.insurance || null}
                    onChange={(file) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        labReports: { ...prev.labReports, insurance: file },
                        documents: { ...prev.documents, insurance: file },
                      }))
                    }
                    accept=".pdf,.png,.jpg,.jpeg"
                    folder="documents"
                  />
                  <FileUploadField
                    label="Health Insurance Policy (Mandatory)"
                    value={editForm.labReports?.healthInsurance || null}
                    onChange={(file) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        labReports: { ...prev.labReports, healthInsurance: file },
                      }))
                    }
                    accept=".pdf,.png,.jpg,.jpeg"
                    folder="documents"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Affidavit */}
            {editTab === "affidavit" && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <FileBadge2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Download the pre-filled affidavit template, get it notarized on Non-Judicial Stamp Paper, then upload the signed copy below.</span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/40 space-y-2">
                    <p className="text-xs font-bold">Step-by-Step Instructions:</p>
                    <ol className="text-[11px] space-y-1 list-decimal pl-4 text-muted-foreground">
                      <li>Click <strong className="text-foreground">"Download Affidavit Template"</strong> below — a pre-filled affidavit opens in a new tab.</li>
                      <li>Print on <strong className="text-foreground">Non-Judicial Stamp Paper</strong> of appropriate denomination.</li>
                      <li>Donor must sign in front of a <strong className="text-foreground">Notary Public / Oath Commissioner</strong> who will stamp &amp; seal.</li>
                      <li>Scan the notarized document and <strong className="text-foreground">upload below</strong>.</li>
                    </ol>
                    <button
                      type="button"
                      onClick={() => downloadAffidavit(selectedReg)}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download &amp; Print Affidavit Template
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold">Upload Signed &amp; Notarized Affidavit</p>
                    <FileUploadField
                      label="Signed Affidavit (Notarized on Stamp Paper)"
                      value={editForm.documents?.affidavit || null}
                      onChange={(file) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          documents: { ...prev.documents, affidavit: file },
                        }))
                      }
                      accept=".pdf,.png,.jpg,.jpeg"
                      folder="documents"
                    />
                    {editForm.documents?.affidavit?.url && (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Affidavit uploaded — </span>
                        <button
                          type="button"
                          onClick={() => setPreviewMedia({ url: editForm.documents.affidavit.url, title: "Signed Affidavit" })}
                          className="underline flex items-center gap-0.5 cursor-pointer font-semibold text-rose-600 hover:text-rose-700"
                        >
                          View Document
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl text-xs h-9">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="rounded-xl text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Walk-in Create Registration Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl max-w-xl bg-background border p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-rose-600" />
              Register New Egg Donor (Oocytes)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct registration for female egg donor. Gender is locked to Female and requires Husband details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Donor Full Name <span className="text-rose-500">*</span></label>
                <Input
                  placeholder="Enter legal full name"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Gender</label>
                <Input
                  value="Female"
                  readOnly
                  className="rounded-xl text-xs bg-muted font-bold text-rose-600 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-rose-600 font-bold">Husband&apos;s Name <span className="text-rose-500">*</span></label>
                <Input
                  placeholder="Enter husband's full name"
                  value={createForm.husbandName}
                  onChange={(e) => setCreateForm({ ...createForm, husbandName: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-rose-600 font-bold">Husband&apos;s Occupation <span className="text-rose-500">*</span></label>
                <Input
                  placeholder="e.g. Farmer, Business, Job"
                  value={createForm.husbandOccupation}
                  onChange={(e) => setCreateForm({ ...createForm, husbandOccupation: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Aadhaar Card Number <span className="text-rose-500">*</span></label>
                <Input
                  placeholder="12-digit Aadhaar number"
                  maxLength={12}
                  value={createForm.aadhaarNumber}
                  onChange={(e) => setCreateForm({ ...createForm, aadhaarNumber: e.target.value })}
                  className="rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Mobile Number <span className="text-rose-500">*</span></label>
                <Input
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={createForm.mobileNumber}
                  onChange={(e) => setCreateForm({ ...createForm, mobileNumber: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Date of Birth</label>
                <Input
                  type="date"
                  value={createForm.dateOfBirth}
                  onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Blood Group</label>
                <select
                  value={createForm.bloodGroup}
                  onChange={(e) => setCreateForm({ ...createForm, bloodGroup: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs"
                >
                  <option value="">Select Blood Group</option>
                  {["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Admin Notes / Remarks</label>
              <textarea
                rows={2}
                placeholder="Optional administrative intake notes..."
                value={createForm.adminNotes}
                onChange={(e) => setCreateForm({ ...createForm, adminNotes: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-input bg-background text-xs"
              />
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs h-9">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="rounded-xl text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {createLoading ? "Submitting..." : "Create Egg Registration"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Quick Preview Modal (In-App) */}
      <InAppDocumentViewer
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        title={previewMedia?.title || "Document Preview"}
        fileUrl={previewMedia?.url || null}
        donorName={selectedReg?.personalInfo?.fullName}
        donorId={selectedReg?.donorId || selectedReg?.registrationId}
      />

      {/* Egg Donor Print Options & Dossier Configuration Modal */}
      <DonorPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        registration={printTargetReg}
        hideForm14A={true}
        onRegistrationUpdated={(updated) => {
          setPrintTargetReg(updated);
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

      {/* GitHub-style Delete Registration Confirmation Dialog */}
      <GitHubDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        expectedId={regToDelete?.id || ""}
        itemName={regToDelete?.name}
        itemType="egg donor registration"
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
