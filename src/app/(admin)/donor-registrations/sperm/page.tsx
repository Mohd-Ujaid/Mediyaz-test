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
  Dna,
  FlaskConical,
  Database,
  Package,
  BookmarkCheck,
  ArrowRight,
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
import { SpermDonorPrintModal } from "@/features/donor-registration/components/SpermDonorPrintModal";

const DOCUMENTS_CONFIG = [
  { key: "passportPhoto", label: "Photo", accept: ".png,.jpg,.jpeg,.webp", folder: "profile-images" },
  { key: "aadhaarFront", label: "Aadhaar Card (Front)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "aadhaarBack", label: "Aadhaar Card (Back)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "signature", label: "Signature", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "otherDocument", label: "Other Document", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
];

export type SpermRegTab =
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

export default function AdminSpermDonorRegistrationsPage() {
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

  // Stats from DB
  const [stats, setStats] = useState<{
    total?: number;
    new?: number;
    submitted?: number;
    underReview?: number;
    documentsVerified?: number;
    affidavitUploaded?: number;
    approved?: number;
    waitingForm13?: number;
    fileCompleted?: number;
    rejected?: number;
    draft?: number;
    suspended?: number;
    otherUntilApproved?: number;
  }>({
    total: 0,
    new: 0,
    submitted: 0,
    underReview: 0,
    documentsVerified: 0,
    affidavitUploaded: 0,
    approved: 0,
    waitingForm13: 0,
    fileCompleted: 0,
    rejected: 0,
    draft: 0,
    suspended: 0,
    otherUntilApproved: 0,
  });

  // Hospitals for deal modal
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Deal modal
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealForm, setDealForm] = useState<{
    assignedHospitalId: string;
    donorCategory: "registry" | "normal" | "profile";
    hospitalDealPrice: number | string;
    compensationAmount: number | string;
    paymentTerms: string;
    paymentMethod: "bank_transfer" | "upi" | "cheque" | "cash";
    paymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
    advanceAmount: number | string;
    balanceAmount: number | string;
    paymentReference: string;
    notes: string;
    adminNotes: string;
    recruitmentDate: string;
    supplyDate: string;
    targetStatus: "APPROVED" | null;
  }>({
    assignedHospitalId: "",
    donorCategory: "normal",
    hospitalDealPrice: 15000,
    compensationAmount: 5000,
    paymentTerms: "On Sample Collection",
    paymentMethod: "bank_transfer",
    paymentStatus: "PENDING",
    advanceAmount: 0,
    balanceAmount: 0,
    paymentReference: "",
    notes: "",
    adminNotes: "",
    recruitmentDate: "",
    supplyDate: "",
    targetStatus: null,
  });

  // Step 2 Lab reports state
  const [labForm, setLabForm] = useState({
    viralMarkersReport: null as any,
    bloodReport: null as any,
    hivStatus: "Non-Reactive",
    hbsagStatus: "Non-Reactive",
    hepatitisCStatus: "Non-Reactive",
    vdrl: "Non-Reactive",
  });

  // Step 3 Semen analysis & cryo storage state
  const [semenForm, setSemenForm] = useState({
    motility: "70%-90%",
    eachVialContains: "55-60 million Sperm",
    volume: "2.5 ml",
    totalVials: "4",
    morphology: ">4% normal forms",
    liquefactionTime: "25 mins",
    containerNo: "Tank 01",
    canisterNo: "Canister 03",
    gobletNo: "Cane B2 / Goblet 1",
    storageLocation: "ART Lab Cryo Room - Rack A",
    freezingDate: new Date().toISOString().split("T")[0],
    nitrogenLevelOk: true,
  });
  // Keep modal forms in sync with selectedReg
  useEffect(() => {
    if (selectedReg) {
      setLabForm({
        viralMarkersReport:
          selectedReg.labReports?.viralMarkersReport ||
          selectedReg.labReports?.viralMarkers ||
          null,
        bloodReport: selectedReg.labReports?.bloodReport || null,
        hivStatus: selectedReg.investigations?.hivStatus || "Non-Reactive",
        hbsagStatus: selectedReg.investigations?.hbsagStatus || "Non-Reactive",
        hepatitisCStatus: selectedReg.investigations?.hepatitisCStatus || "Non-Reactive",
        vdrl: selectedReg.investigations?.vdrl || "Non-Reactive",
      });

      setSemenForm({
        motility: selectedReg.semenAnalysisDetails?.motility || "70%-90%",
        eachVialContains: selectedReg.semenAnalysisDetails?.eachVialContains || "55-60 million Sperm",
        volume: selectedReg.semenAnalysisDetails?.volume || "2.5 ml",
        totalVials: String(selectedReg.semenAnalysisDetails?.totalVials || "4"),
        morphology: selectedReg.semenAnalysisDetails?.morphology || ">4% normal forms",
        liquefactionTime: selectedReg.semenAnalysisDetails?.liquefactionTime || "25 mins",
        containerNo: selectedReg.storageDetails?.containerNo || "Tank 01",
        canisterNo: selectedReg.storageDetails?.canisterNo || "Canister 03",
        gobletNo: selectedReg.storageDetails?.gobletNo || "Cane B2 / Goblet 1",
        storageLocation: selectedReg.storageDetails?.storageLocation || "ART Lab Cryo Room - Rack A",
        freezingDate: selectedReg.storageDetails?.freezingDate || new Date().toISOString().split("T")[0],
        nitrogenLevelOk: selectedReg.storageDetails?.nitrogenLevelOk !== false,
      });
    }
  }, [selectedReg]);

  // Active status tab: default "new"
  const [activeTab, setActiveTab] = useState<SpermRegTab>("new");

  const fetchSpermRegistrations = useCallback(async () => {
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

      const res = await fetch(`/api/donor-registrations/sperm?${params.toString()}`, {
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
        toast.error(data.error || "Failed to load sperm registrations");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, bloodGroupFilter, activeTab]);

  useEffect(() => {
    fetchSpermRegistrations();
  }, [fetchSpermRegistrations]);

  const handleTabChange = (newTab: SpermRegTab) => {
    setActiveTab(newTab);
    setCurrentPage(1);
    setStatusFilter("");
  };

  const getWorkflowStatus = (reg: any) => {
    if (!reg) {
      return {
        step1Complete: false,
        step2Complete: false,
        step3Complete: false,
        allComplete: false,
        details: {
          hasAadhaarDoc: false,
          hasPhoto: false,
          hasSig: false,
          isDocVerified: false,
          hasViralReport: false,
          hasBloodReport: false,
          isCertIssued: false,
          hasSemenAnalysis: false,
          hasStorage: false,
          isApproved: false,
        },
      };
    }

    const hasAadhaarDoc = !!(reg.documents?.aadhaarFront?.url || reg.documents?.aadhaarBack?.url);
    const hasPhoto = !!(reg.documents?.passportPhoto?.url);
    const hasSig = !!(reg.documents?.signature?.url);

    // Step 1: Document Verification
    const isDocVerified =
      reg.documentVerification?.isVerified === true ||
      ["DOCUMENTS_VERIFIED", "UNDER_REVIEW", "APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(reg.status);
    const step1Complete = isDocVerified;

    // Step 2: Viral Markers & Blood Reports Upload
    const hasViralReport = Boolean(
      reg.labReports?.viralMarkersReport?.url ||
        reg.labReports?.viralMarkers?.url ||
        (Array.isArray(reg.labReports?.viralMarkers) && reg.labReports?.viralMarkers[0]?.url) ||
        reg.viralMarkersReport?.url
    );
    const hasBloodReport = Boolean(reg.labReports?.bloodReport?.url || reg.bloodReport?.url);
    const step2Complete =
      (hasViralReport && hasBloodReport) ||
      ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(reg.status);

    // Step 3: Statutory Rule 10 Certificate, Semen Analysis & Storage
    const isCertIssued = Boolean(reg.certificateIssued);
    const hasSemenAnalysis = Boolean(
      reg.semenAnalysisDetails?.motility ||
        reg.semenAnalysisDetails?.eachVialContains ||
        reg.donorInfo?.semenAnalysis
    );
    const hasStorage = Boolean(
      reg.storageDetails?.containerNo ||
        reg.storageDetails?.storageLocation
    );
    const step3Complete =
      (isCertIssued && (hasSemenAnalysis || hasStorage)) ||
      ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(reg.status);

    const isApproved = ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(reg.status);

    return {
      step1Complete,
      step2Complete,
      step3Complete,
      allComplete: isApproved || (step1Complete && step2Complete && step3Complete),
      details: {
        hasAadhaarDoc,
        hasPhoto,
        hasSig,
        isDocVerified,
        hasViralReport,
        hasBloodReport,
        isCertIssued,
        hasSemenAnalysis,
        hasStorage,
        isApproved,
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
    if (!d) return "—";
    const str = String(d).trim();
    if (!str) return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      try {
        const [y, m, day] = str.split("-").map(Number);
        const dt = new Date(y, m - 1, day);
        return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        return str;
      }
    }
    try {
      const dt = new Date(str);
      if (isNaN(dt.getTime())) return str;
      return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return str;
    }
  };

  // Load Hospitals
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

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleOpenDealModal = (reg: any, targetStatus: "APPROVED" | null = null) => {
    setSelectedReg(reg);
    const assignedId =
      typeof reg.assignedHospital === "object"
        ? reg.assignedHospital?._id || ""
        : reg.assignedHospital || "";

    const initialCategory: "registry" | "normal" | "profile" =
      reg.donorDeal?.donorCategory ||
      reg.clinicDeal?.donorCategory ||
      reg.hospitalDealType ||
      "normal";

    const matchedHosp = hospitals.find((h) => h._id === assignedId);
    const defaultClinicPrice =
      reg.clinicDeal?.hospitalDealPrice ||
      (matchedHosp
        ? initialCategory === "profile"
          ? matchedHosp.profiledonorDealPrice || matchedHosp.donorDealPrice || 25000
          : initialCategory === "registry"
          ? 12000
          : matchedHosp.donorDealPrice || 15000
        : 15000);

    const defaultDonorComp =
      reg.donorDeal?.compensationAmount ||
      (initialCategory === "registry" ? 0 : initialCategory === "profile" ? 10000 : 5000);

    setDealForm({
      assignedHospitalId: assignedId,
      donorCategory: initialCategory,
      hospitalDealPrice: defaultClinicPrice,
      compensationAmount: defaultDonorComp,
      paymentTerms: reg.donorDeal?.paymentTerms || "Full upon sample delivery",
      paymentMethod: reg.donorDeal?.paymentMethod || "bank_transfer",
      paymentStatus: reg.donorDeal?.paymentStatus || "PENDING",
      advanceAmount: reg.donorDeal?.advanceAmount || 0,
      balanceAmount: reg.donorDeal?.balanceAmount || 0,
      paymentReference: reg.donorDeal?.paymentReference || "",
      notes: reg.donorDeal?.notes || reg.clinicDeal?.notes || "",
      adminNotes: reg.adminNotes || adminNotes || "",
      recruitmentDate: formatDateForInput(reg.recruitmentDate),
      supplyDate: formatDateForInput(reg.supplyDate || reg.pickupDate),
      targetStatus,
    });
    setIsDealModalOpen(true);
  };

  const handleHospitalChange = (hospitalId: string) => {
    const matchedHosp = hospitals.find((h) => h._id === hospitalId);
    const newPrice = matchedHosp
      ? dealForm.donorCategory === "profile"
        ? matchedHosp.profiledonorDealPrice || 25000
        : dealForm.donorCategory === "registry"
        ? 12000
        : matchedHosp.donorDealPrice || 15000
      : 15000;

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
        ? matchedHosp.profiledonorDealPrice || 25000
        : category === "registry"
        ? 12000
        : matchedHosp.donorDealPrice || 15000
      : category === "profile"
      ? 25000
      : category === "registry"
      ? 12000
      : 15000;

    const defaultComp = category === "registry" ? 0 : category === "profile" ? 10000 : 5000;
    const newComp =
      category === "registry"
        ? 0
        : !dealForm.compensationAmount ||
          dealForm.compensationAmount === 5000 ||
          dealForm.compensationAmount === 10000
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

    if (dealForm.donorCategory !== "registry" && (!dealForm.compensationAmount || Number(dealForm.compensationAmount) <= 0)) {
      toast.error("Deal with donor (compensation amount) must be greater than ₹0 for normal/profile donors.");
      return;
    }

    setActionLoading(true);
    try {
      const regId = selectedReg.registrationId || selectedReg._id;
      const isRegTier = dealForm.donorCategory === "registry";

      const payload: any = {
        assignedHospital: dealForm.assignedHospitalId,
        hospitalDealType: dealForm.donorCategory,
        recruitmentDate: dealForm.recruitmentDate || "",
        supplyDate: dealForm.supplyDate || "",
        pickupDate: dealForm.supplyDate || "",
        clinicDeal: {
          donorCategory: dealForm.donorCategory,
          hospitalDealPrice:
            Number(dealForm.hospitalDealPrice) ||
            (dealForm.donorCategory === "profile" ? 25000 : dealForm.donorCategory === "registry" ? 12000 : 15000),
          currency: "INR",
          notes: dealForm.notes,
        },
        donorDeal: {
          donorCategory: dealForm.donorCategory,
          compensationAmount: isRegTier ? 0 : Number(dealForm.compensationAmount),
          paymentMethod: selectedReg.donorDeal?.paymentMethod || dealForm.paymentMethod || "bank_transfer",
          paymentTerms: selectedReg.donorDeal?.paymentTerms || dealForm.paymentTerms || "Full upon sample delivery",
          paymentStatus: selectedReg.donorDeal?.paymentStatus || dealForm.paymentStatus || "PENDING",
          advanceAmount: Number(dealForm.advanceAmount) || selectedReg.donorDeal?.advanceAmount || 0,
          balanceAmount: Number(dealForm.balanceAmount) || selectedReg.donorDeal?.balanceAmount || 0,
          paymentReference: dealForm.paymentReference || selectedReg.donorDeal?.paymentReference || "",
          notes: dealForm.notes,
        },
        adminNotes: dealForm.adminNotes,
      };

      if (dealForm.targetStatus) {
        payload.status = dealForm.targetStatus;
      }

      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update hospital & deal");
      }

      toast.success(
        dealForm.targetStatus === "APPROVED"
          ? "Sperm donor approved and deal saved successfully!"
          : "Hospital assignment and financial deal saved!"
      );
      setIsDealModalOpen(false);
      fetchSpermRegistrations();
      if (selectedReg) {
        setSelectedReg((prev: any) => ({
          ...prev,
          ...(data.registration || {}),
          ...payload,
        }));
      }
    } catch (err: any) {
      console.error("Deal submission failed:", err);
      toast.error(err.message || "Failed to update hospital deal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (regId: string, newStatus: string) => {
    if (newStatus === "APPROVED") {
      const reg = registrations.find((r) => r.registrationId === regId) || selectedReg;
      const wf = getWorkflowStatus(reg);

      if (!wf.step1Complete) {
        toast.error("Cannot approve — Step 1 incomplete. Please verify identity documents first.");
        return;
      }

      if (!wf.step2Complete) {
        toast.error("Cannot approve — Step 2 incomplete. Please upload viral marker and blood reports.");
        return;
      }

      if (!wf.step3Complete) {
        toast.error("Cannot approve — Step 3 incomplete. Please issue Rule 10 certificate and enter semen analysis details.");
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Registration marked as ${newStatus}`);
        setIsDetailOpen(false);
        fetchSpermRegistrations();
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

  // Step 1: Document Verification Handler
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
        notes: verify ? "Verified by Clinical Reviewer" : "",
        checklist: {
          photoMatched: verify,
          aadhaarMatched: verify,
          ageEligible: verify,
          signatureMatched: verify,
          identityConfirmed: verify,
        },
      };

      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
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
        toast.success(verify ? "Identity Documents Verified! (Proceed to Step 2)" : "Document verification reset.");
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
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch (err: any) {
      toast.error("Failed to update document verification");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Viral Markers File Upload Handler
  const handleUploadViralMarkers = async (fileRef: any) => {
    if (!selectedReg) return;
    const regId = selectedReg.registrationId || selectedReg._id;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "labReports.viralMarkersReport": fileRef,
          "labReports.viralMarkers": fileRef,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(fileRef ? "Viral markers report uploaded!" : "Viral markers report removed.");
        setLabForm((prev) => ({ ...prev, viralMarkersReport: fileRef }));
        setSelectedReg((prev: any) => ({
          ...prev,
          labReports: { ...(prev?.labReports || {}), viralMarkersReport: fileRef, viralMarkers: fileRef },
        }));
      } else {
        toast.error(data.error || "Failed to update viral markers report");
      }
    } catch {
      toast.error("Error saving viral markers report");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Blood Report File Upload Handler
  const handleUploadBloodReport = async (fileRef: any) => {
    if (!selectedReg) return;
    const regId = selectedReg.registrationId || selectedReg._id;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "labReports.bloodReport": fileRef,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(fileRef ? "Blood test report uploaded!" : "Blood test report removed.");
        setLabForm((prev) => ({ ...prev, bloodReport: fileRef }));
        setSelectedReg((prev: any) => ({
          ...prev,
          labReports: { ...(prev?.labReports || {}), bloodReport: fileRef },
        }));
      } else {
        toast.error(data.error || "Failed to update blood report");
      }
    } catch {
      toast.error("Error saving blood report");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Save All Lab Reports & Advance Status to UNDER_REVIEW
  const handleSaveLabReports = async () => {
    if (!selectedReg) return;
    const regId = selectedReg.registrationId || selectedReg._id;
    setActionLoading(true);
    try {
      const nextStatus =
        selectedReg.status === "DOCUMENTS_VERIFIED" || selectedReg.status === "SUBMITTED" || selectedReg.status === "NEW"
          ? "UNDER_REVIEW"
          : selectedReg.status;

      const payload = {
        status: nextStatus,
        "labReports.viralMarkersReport": labForm.viralMarkersReport,
        "labReports.viralMarkers": labForm.viralMarkersReport,
        "labReports.bloodReport": labForm.bloodReport,
        "investigations.hivStatus": labForm.hivStatus,
        "investigations.hbsagStatus": labForm.hbsagStatus,
        "investigations.hepatitisCStatus": labForm.hepatitisCStatus,
        "investigations.vdrl": labForm.vdrl,
      };

      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Step 2 Complete: Viral Markers and Blood reports saved! Status updated to Under Review.");
        const updated = {
          ...selectedReg,
          ...(data.registration || {}),
          status: nextStatus,
          labReports: {
            ...(selectedReg.labReports || {}),
            viralMarkersReport: labForm.viralMarkersReport,
            bloodReport: labForm.bloodReport,
          },
          investigations: {
            ...(selectedReg.investigations || {}),
            hivStatus: labForm.hivStatus,
            hbsagStatus: labForm.hbsagStatus,
            hepatitisCStatus: labForm.hepatitisCStatus,
            vdrl: labForm.vdrl,
          },
        };
        setSelectedReg(updated);
        setRegistrations((prev) =>
          prev.map((r) => (r.registrationId === regId || r._id === regId ? { ...r, ...updated } : r))
        );
      } else {
        toast.error(data.error || "Failed to save lab reports");
      }
    } catch {
      toast.error("Error saving lab reports");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Issue Statutory Certificate in terms of Rule 10
  const handleIssueRule10Certificate = async () => {
    if (!selectedReg) return;
    const regId = selectedReg.registrationId || selectedReg._id;
    setActionLoading(true);
    try {
      const now = new Date();
      const payload = {
        certificateIssued: true,
        certificateIssuedAt: now,
        certificateIssuedBy: "Admin",
      };

      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Certificate in terms of Rule 10 issued successfully!");
        setSelectedReg((prev: any) => ({
          ...prev,
          certificateIssued: true,
          certificateIssuedAt: now,
          certificateIssuedBy: "Admin",
        }));
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === regId || r._id === regId
              ? { ...r, certificateIssued: true, certificateIssuedAt: now, certificateIssuedBy: "Admin" }
              : r
          )
        );
      } else {
        toast.error(data.error || "Failed to issue certificate");
      }
    } catch {
      toast.error("Error issuing certificate");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Save Semen Analytic Values & Cryo Storage Location
  const handleSaveSemenAndStorage = async () => {
    if (!selectedReg) return;
    const regId = selectedReg.registrationId || selectedReg._id;
    setActionLoading(true);
    try {
      const semenSummary = `${semenForm.motility} Motility • ${semenForm.eachVialContains} • Tank: ${semenForm.containerNo || "Cryo"}`;

      const payload = {
        semenAnalysisDetails: {
          volume: semenForm.volume,
          motility: semenForm.motility,
          eachVialContains: semenForm.eachVialContains,
          totalVials: semenForm.totalVials,
          morphology: semenForm.morphology,
          liquefactionTime: semenForm.liquefactionTime,
        },
        storageDetails: {
          containerNo: semenForm.containerNo,
          canisterNo: semenForm.canisterNo,
          gobletNo: semenForm.gobletNo,
          storageLocation: semenForm.storageLocation,
          freezingDate: semenForm.freezingDate,
          nitrogenLevelOk: semenForm.nitrogenLevelOk,
        },
        "donorInfo.semenAnalysis": semenSummary,
      };

      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Step 3 Complete: Semen analysis values and cryo storage details saved!");
        const updated = {
          ...selectedReg,
          ...(data.registration || {}),
          semenAnalysisDetails: payload.semenAnalysisDetails,
          storageDetails: payload.storageDetails,
          donorInfo: { ...(selectedReg.donorInfo || {}), semenAnalysis: semenSummary },
        };
        setSelectedReg(updated);
        setRegistrations((prev) =>
          prev.map((r) => (r.registrationId === regId || r._id === regId ? { ...r, ...updated } : r))
        );
      } else {
        toast.error(data.error || "Failed to save semen and storage details");
      }
    } catch {
      toast.error("Error saving semen details");
    } finally {
      setActionLoading(false);
    }
  };

  // Approve and Move to Sperm Donor Management
  const handleApproveAndMoveToManagement = async () => {
    if (!selectedReg) return;
    const regId = selectedReg.registrationId || selectedReg._id;

    setActionLoading(true);
    try {
      const payload: any = {
        status: "APPROVED",
        reviewedBy: "Admin",
        reviewedAt: new Date(),
      };

      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("🎉 Registration Approved! Officially moved to Sperm Donor Management.");
        const updated = {
          ...selectedReg,
          ...(data.registration || {}),
          status: "APPROVED",
          donorId: data.registration?.donorId || selectedReg.donorId,
        };
        setSelectedReg(updated);
        setRegistrations((prev) =>
          prev.map((r) => (r.registrationId === regId || r._id === regId ? { ...r, ...updated } : r))
        );
        fetchSpermRegistrations();
      } else {
        toast.error(data.error || "Failed to approve registration");
      }
    } catch {
      toast.error("Error approving registration into management");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (reg: any) => {
    setSelectedReg(reg);
    const existingInvestigations = reg.investigations || {};
    const existingMedical = reg.medicalInfo || {};

    setEditForm({
      personalInfo: {
        fullName: reg.personalInfo?.fullName || "",
        fatherName: reg.personalInfo?.fatherName || "",
        motherName: reg.personalInfo?.motherName || "",
        gender: "Male",
        dateOfBirth: formatDateForInput(reg.personalInfo?.dateOfBirth),
        age: reg.personalInfo?.age || "",
        bloodGroup: reg.personalInfo?.bloodGroup || "",
        maritalStatus: reg.personalInfo?.maritalStatus || "Single",
        education: reg.personalInfo?.education || "",
        occupation: reg.personalInfo?.occupation || "",
        height: reg.personalInfo?.height || "",
        weight: reg.personalInfo?.weight || "",
        eyeColor: reg.personalInfo?.eyeColor || "",
        hairColor: reg.personalInfo?.hairColor || "",
        complexion: reg.personalInfo?.complexion || "",
        aadhaarNumber: reg.personalInfo?.aadhaarNumber || "",
        panNumber: reg.personalInfo?.panNumber || "",
        religion: reg.personalInfo?.religion || "",
        monthlyIncome: reg.personalInfo?.monthlyIncome || "",
      },
      contactInfo: {
        mobileNumber: reg.contactInfo?.mobileNumber || "",
        alternateMobile: reg.contactInfo?.alternateMobile || "",
        emailAddress: reg.contactInfo?.emailAddress || "",
        currentAddress: reg.contactInfo?.currentAddress || "",
        permanentAddress: reg.contactInfo?.permanentAddress || "",
        city: reg.contactInfo?.city || "",
        district: reg.contactInfo?.district || "",
        state: reg.contactInfo?.state || "",
        pincode: reg.contactInfo?.pincode || "",
      },
      donorInfo: {
        semenAnalysis: reg.donorInfo?.semenAnalysis || "",
        previousDonationHistory: reg.donorInfo?.previousDonationHistory || "",
        numberOfDonations: reg.donorInfo?.numberOfDonations || "",
        lastDonationDate: formatDateForInput(reg.donorInfo?.lastDonationDate),
        abstinencePeriod: reg.donorInfo?.abstinencePeriod || "",
      },
      bankDetails: {
        accountHolderName: reg.bankDetails?.accountHolderName || "",
        bankName: reg.bankDetails?.bankName || "",
        branch: reg.bankDetails?.branch || "",
        ifscCode: reg.bankDetails?.ifscCode || "",
        accountNumber: reg.bankDetails?.accountNumber || "",
        upiId: reg.bankDetails?.upiId || "",
      },
      investigations: {
        hivStatus: existingInvestigations.hivStatus || existingMedical.hivStatus || "",
        hbsagStatus: existingInvestigations.hbsagStatus || existingMedical.hbsagStatus || "",
        hepatitisCStatus: existingInvestigations.hepatitisCStatus || existingMedical.hepatitisCStatus || "",
        vdrl: existingInvestigations.vdrl || existingMedical.vdrl || "",
      },
      documents: {
        passportPhoto: reg.documents?.passportPhoto || null,
        aadhaarFront: reg.documents?.aadhaarFront || null,
        aadhaarBack: reg.documents?.aadhaarBack || null,
        signature: reg.documents?.signature || null,
        otherDocument: reg.documents?.otherDocument || null,
        affidavit: reg.documents?.affidavit || reg.affidavit || null,
      },
      labReports: {
        viralMarkersReport: reg.labReports?.viralMarkersReport || null,
        bloodReport: reg.labReports?.bloodReport || null,
        semenAnalysisReport: reg.labReports?.semenAnalysisReport || null,
        insurance: reg.labReports?.insurance || null,
      },
      status: reg.status || "NEW",
      hospitalDealType: reg.hospitalDealType || "normal",
      adminNotes: reg.adminNotes || "",
    });
    setEditTab("details");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReg) return;
    setActionLoading(true);
    try {
      const regId = selectedReg.registrationId || selectedReg._id;
      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save registration edits");
      }

      toast.success("Sperm donor details updated successfully!");
      setIsEditOpen(false);
      fetchSpermRegistrations();
      if (selectedReg) {
        setSelectedReg((prev: any) => ({
          ...prev,
          ...(data.registration || {}),
          ...editForm,
        }));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update details");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (reg: any) => {
    setRegToDelete({
      id: reg.registrationId || reg._id,
      name: reg.personalInfo?.fullName || reg.registrationId,
    });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!regToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regToDelete.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete sperm registration");
      }

      toast.success(`Registration ${regToDelete.id} permanently deleted.`);
      setRegistrations((prev) => prev.filter((r) => r.registrationId !== regToDelete.id && r._id !== regToDelete.id));
      setDeleteModalOpen(false);
      setRegToDelete(null);
      if (selectedReg?.registrationId === regToDelete.id || selectedReg?._id === regToDelete.id) {
        setIsDetailOpen(false);
        setSelectedReg(null);
      }
      fetchSpermRegistrations();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadAffidavit = (reg: any) => {
    if (!reg) return;
    const regId = reg.registrationId || reg._id;
    if (!regId) {
      toast.error("Registration ID not found.");
      return;
    }
    const printUrl = `/admin/manage-registrations/${regId}/print?withHeader=false&sections=affidavit&affidavitType=template`;
    window.open(printUrl, "_blank");
  };

  const exportToCsv = () => {
    if (registrations.length === 0) {
      toast.error("No sperm donor data to export.");
      return;
    }
    const headers = [
      "Registration ID",
      "Full Name",
      "Father Name",
      "Mother Name",
      "Gender",
      "Blood Group",
      "Age",
      "Marital Status",
      "Mobile",
      "Email",
      "Aadhaar Number",
      "City",
      "State",
      "Education",
      "Occupation",
      "Semen Analysis",
      "Assigned Hospital",
      "Clinic Deal Price",
      "Donor Compensation",
      "Status",
      "Registration Date",
    ];

    const rows = registrations.map((r) => [
      `"${r.registrationId || ""}"`,
      `"${r.personalInfo?.fullName || ""}"`,
      `"${r.personalInfo?.fatherName || ""}"`,
      `"${r.personalInfo?.motherName || ""}"`,
      `"${r.personalInfo?.gender || "Male"}"`,
      `"${r.personalInfo?.bloodGroup || ""}"`,
      `"${r.personalInfo?.age || ""}"`,
      `"${r.personalInfo?.maritalStatus || ""}"`,
      `"${r.contactInfo?.mobileNumber || ""}"`,
      `"${r.contactInfo?.emailAddress || ""}"`,
      `"${r.personalInfo?.aadhaarNumber || ""}"`,
      `"${r.contactInfo?.city || ""}"`,
      `"${r.contactInfo?.state || ""}"`,
      `"${r.personalInfo?.education || ""}"`,
      `"${r.personalInfo?.occupation || ""}"`,
      `"${r.donorInfo?.semenAnalysis || ""}"`,
      `"${r.assignedHospital?.shortName || r.assignedHospital?.name || ""}"`,
      `"${r.clinicDeal?.hospitalDealPrice || ""}"`,
      `"${r.donorDeal?.compensationAmount || ""}"`,
      `"${r.status || ""}"`,
      `"${r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sperm_donor_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully.");
  };

  return (
    <div className="space-y-6 pb-12 px-1 sm:px-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Sperm Donor Registrations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Review, verify, and manage incoming semen donor applications under Indian ART Act 2021 statutory guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={fetchSpermRegistrations}
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
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Total Semen Applications</div>
          <div className="text-2xl sm:text-3xl font-bold mt-2 text-foreground">{stats.total || totalCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Sperm donor records in DB</p>
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
              title="All sperm donor registrations"
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
              title="Under administrative and clinical review"
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
              placeholder="Search code, name, father name, mother name, phone, aadhaar..."
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
            <Loader2 className="w-8 h-8 text-[#285b63] animate-spin" />
            Loading sperm donor registrations...
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-xs">
            No matching sperm donor registrations found in database.
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
                  <TableHead>Donor Name</TableHead>
                  <TableHead>Father &amp; Mother Details</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Contact Details</TableHead>
                  <TableHead>Semen Analytics &amp; Cryo Storage</TableHead>
                  <TableHead>Verification Stages</TableHead>
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
                      {reg.personalInfo?.fatherName && (
                        <div className="text-[10px] text-muted-foreground">
                          Father: {reg.personalInfo.fatherName}
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
                          href={`http://localhost:3000/register/sperm?draftId=${reg.registrationId}&step=${reg.currentStep || 1}`}
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
                            const url = `http://localhost:3000/register/sperm?draftId=${reg.registrationId}&step=${reg.currentStep || 1}`;
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
                        {reg.personalInfo?.fatherName ? `Father: ${reg.personalInfo.fatherName}` : reg.personalInfo?.spouseName ? `Spouse: ${reg.personalInfo.spouseName}` : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {reg.personalInfo?.motherName ? `Mother: ${reg.personalInfo.motherName}` : reg.personalInfo?.maritalStatus ? `Marital: ${reg.personalInfo.maritalStatus}` : "Parents: Not specified"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-teal-700 dark:text-teal-400">{reg.personalInfo?.bloodGroup || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{reg.contactInfo?.mobileNumber || "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{reg.contactInfo?.emailAddress || "—"}</div>
                    </div>
                  </TableCell>

                  {/* Semen Analytics & Cryo Storage */}
                  <TableCell>
                    {(() => {
                      const semen = reg.semenAnalysis;
                      const storage = reg.cryoStorage;
                      if (semen?.motility || semen?.totalVials || storage?.containerNo) {
                        return (
                          <div className="space-y-0.5 text-xs">
                            <div className="font-semibold text-foreground flex items-center gap-1">
                              <span className="font-mono text-teal-700 dark:text-teal-400 font-bold">
                                Motility: {semen?.motility || "—"}
                              </span>
                              {semen?.totalVials && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                  {semen.totalVials}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              Tank: {storage?.containerNo || "—"} • Canister: {storage?.canisterNo || "—"}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <span className="text-[11px] text-muted-foreground italic">
                          Awaiting Step 3 values
                        </span>
                      );
                    })()}
                  </TableCell>

                  {/* Verification Stages */}
                  <TableCell>
                    {(() => {
                      const wf = getWorkflowStatus(reg);
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              wf.step1Complete
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                            title="Step 1: KYC / Identity Documents Verification"
                          >
                            {wf.step1Complete ? "1. Docs ✓" : "1. Docs"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              wf.step2Complete
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                            title="Step 2: Viral Markers & Blood Lab Reports"
                          >
                            {wf.step2Complete ? "2. Labs ✓" : "2. Labs"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              wf.step3Complete
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                            title="Step 3: Statutory Rule 10 Clearance & Analytics"
                          >
                            {wf.step3Complete ? "3. Cert ✓" : "3. Cert"}
                          </span>
                        </div>
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

      {/* ─── Detail Review Dialog (Matching Egg Donor View Exactly) ─── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-3xl max-w-5xl bg-background border shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {selectedReg && (() => {
            const wf = getWorkflowStatus(selectedReg);
            const isDocVerified = wf.step1Complete;
            const hasAffidavit = Boolean(selectedReg.documents?.affidavit?.url || selectedReg.affidavit?.url);
            const isRegistry =
              selectedReg.hospitalDealType === "registry" ||
              selectedReg.donorDeal?.donorCategory === "registry" ||
              selectedReg.clinicDeal?.donorCategory === "registry";

            return (
              <div className="space-y-6">
                {/* ─── Profile Header ────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b pb-5 justify-between">
                  <div className="flex items-center gap-4">
                    {selectedReg.documents?.passportPhoto?.url ? (
                      <img
                        alt="Passport Photo"
                        src={selectedReg.documents.passportPhoto.url}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-md cursor-pointer hover:opacity-90 transition"
                        onClick={() => setPreviewMedia({ url: selectedReg.documents.passportPhoto.url, title: "Passport Photo" })}
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
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold border border-teal-200">
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
                          <> • Donor ID: <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{selectedReg.donorId}</span></>
                        )}
                        {" "}• Gender: Male (Sperm Donor) • Age: {selectedReg.personalInfo?.age || "—"} Yrs
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
                      <Printer className="w-3.5 h-3.5 text-teal-600" /> Print Registration &amp; Forms
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
                    <Award className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Sperm Donor Automated Registration Pipeline</h3>
                    {wf.allComplete ? (
                      <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Transferred to Management
                      </span>
                    ) : (
                      <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Automated Step Flow Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        num: 1,
                        label: "1. Document Verify",
                        sublabel: wf.step1Complete ? "Identity & Aadhaar verified ✓" : "Review Aadhaar, photo & sign",
                        done: wf.step1Complete,
                        locked: false,
                        icon: ShieldCheck,
                      },
                      {
                        num: 2,
                        label: "2. Viral & Blood Reports",
                        sublabel: wf.step2Complete
                          ? "Viral markers & CBC on file ✓"
                          : wf.step1Complete
                          ? "Upload viral marker & blood reports"
                          : "Verify documents in Step 1 first",
                        done: wf.step2Complete,
                        locked: !wf.step1Complete,
                        icon: FlaskConical,
                      },
                      {
                        num: 3,
                        label: "3. Certificate, Semen Values & Storage",
                        sublabel: wf.step3Complete
                          ? "Rule 10 issued & cryo stored ✓"
                          : wf.step2Complete
                          ? "Issue cert & enter motility/vials/storage"
                          : "Upload lab reports in Step 2 first",
                        done: wf.step3Complete,
                        locked: !wf.step2Complete,
                        icon: FileBadge2,
                      },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className={`relative p-3 rounded-xl border text-xs transition-all ${
                          step.done
                            ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                            : step.locked
                            ? "bg-muted/30 border-dashed border-border opacity-60"
                            : "bg-teal-50/70 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800 ring-1 ring-teal-400"
                        }`}
                      >
                        {step.locked && (
                          <Lock className="w-3 h-3 absolute top-2.5 right-2.5 text-muted-foreground" />
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            step.done ? "bg-emerald-500 text-white" : step.locked ? "bg-muted text-muted-foreground" : "bg-teal-600 text-white"
                          }`}>
                            {step.done ? <Check className="w-3 h-3" /> : step.num}
                          </div>
                          <span className={`font-bold text-[11px] truncate ${
                            step.done ? "text-emerald-700 dark:text-emerald-400" : step.locked ? "text-muted-foreground" : "text-teal-800 dark:text-teal-300"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed pl-6">{step.sublabel}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── STEP 1: DOCUMENT VERIFICATION (Form vs Uploaded Docs) ──── */}
                <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4.5 h-4.5 text-teal-600" />
                        Step 1: First — Document Verify (Registration Form vs Identity Documents)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Compare applicant and family identity details side-by-side with uploaded Aadhaar, photograph, and signature.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {wf.step1Complete ? (
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
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Registration Form Data (Submitted)
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-semibold">Male Semen Donor</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Donor Full Name:</span>
                          <span className="font-bold text-foreground text-sm">{selectedReg.personalInfo?.fullName || "—"}</span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Father&apos;s Name:</span>
                          <span className="font-bold text-foreground text-sm">
                            {selectedReg.personalInfo?.fatherName || selectedReg.personalInfo?.spouseName || "—"}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Mother&apos;s Name / Marital:</span>
                          <span className="font-semibold text-foreground">
                            {selectedReg.personalInfo?.motherName || "—"} • {selectedReg.personalInfo?.maritalStatus || "Single"}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Date of Birth &amp; Age:</span>
                          <span className="font-semibold text-foreground">
                            {selectedReg.personalInfo?.dateOfBirth || "—"} ({selectedReg.personalInfo?.age || "—"} Years)
                            {selectedReg.personalInfo?.age && (Number(selectedReg.personalInfo.age) < 21 || Number(selectedReg.personalInfo.age) > 55) && (
                              <span className="text-rose-600 font-bold ml-1 text-[10px]">(ART Act 21-55 Alert!)</span>
                            )}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Aadhaar Number:</span>
                          <span className="font-mono font-bold text-foreground">
                            {selectedReg.personalInfo?.aadhaarNumber || "—"}
                          </span>
                        </div>
                        <div className="p-2.5 bg-background rounded-lg border">
                          <span className="text-[10px] text-muted-foreground block font-semibold">Blood Group &amp; Semen Analysis:</span>
                          <span className="font-bold text-teal-700 dark:text-teal-400">
                            {selectedReg.personalInfo?.bloodGroup || "—"}
                            {selectedReg.donorInfo?.semenAnalysis && ` • ${selectedReg.donorInfo.semenAnalysis}`}
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
                            Source: {selectedReg.referral?.sourceReferralType || selectedReg.registrationSource || "Online"}
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
                                    <FileText className="w-6 h-6 text-teal-600" />
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
                                    className="text-[10px] text-teal-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
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
                      {wf.step1Complete ? (
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Identity verified against registration data. Step 1 Complete! (Proceed to Step 2)
                        </div>
                      ) : (
                        <div className="text-slate-700 dark:text-slate-300">
                          Confirm that the name, father name, age (21–55), and Aadhaar on the uploaded cards match the form above.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {wf.step1Complete ? (
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
                          Confirm &amp; Mark Documents Verified (Proceed to Step 2) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── STEP 2: UPLOAD VIRAL MARKER AND BLOOD REPORTS ──────────── */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  !wf.step1Complete
                    ? "bg-muted/20 border-dashed opacity-60"
                    : wf.step2Complete
                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                    : "bg-teal-50/50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800 ring-1 ring-teal-300"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      {!wf.step1Complete ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <FlaskConical className={`w-4.5 h-4.5 ${wf.step2Complete ? "text-emerald-600" : "text-teal-600"}`} />
                      )}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                          Step 2: Second — Upload Viral Marker and Blood Reports
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Upload statutory viral infection screening (HIV, HBsAg, HCV, VDRL) and complete blood count / thalassemia reports.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {wf.step2Complete ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Lab Reports Uploaded (Under Review) ✓
                        </span>
                      ) : wf.step1Complete ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Upload Lab Reports
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground border flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Locked (Verify Documents in Step 1 First)
                        </span>
                      )}
                    </div>
                  </div>

                  {!wf.step1Complete ? (
                    <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed">
                      Step 2 is locked. Please verify identity documents in Step 1 above to unlock lab reports upload.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 2A: Viral Markers Report */}
                        <div className="p-4 bg-background rounded-xl border space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                              1. Viral Markers Screening Report (HIV, HBsAg, HCV, VDRL)
                            </h4>
                            {labForm.viralMarkersReport?.url && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                Uploaded
                              </span>
                            )}
                          </div>

                          <FileUploadField
                            label="Upload Viral Markers Report (PDF / Image)"
                            value={labForm.viralMarkersReport as any}
                            folder="lab-reports"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            onChange={handleUploadViralMarkers}
                            description="Screening for HIV 1 &amp; 2, HBsAg, Anti-HCV, and Syphilis (VDRL)."
                          />

                          {/* Infection Marker Quick Status */}
                          <div className="pt-2 border-t space-y-2">
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                              Screening Marker Interpretations:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              {[
                                { key: "hivStatus", label: "HIV 1&2", val: labForm.hivStatus },
                                { key: "hbsagStatus", label: "HBsAg", val: labForm.hbsagStatus },
                                { key: "hepatitisCStatus", label: "HCV", val: labForm.hepatitisCStatus },
                                { key: "vdrl", label: "VDRL", val: labForm.vdrl },
                              ].map((m) => (
                                <div key={m.key} className="p-2 bg-muted/30 rounded-lg border">
                                  <span className="text-[10px] text-muted-foreground block font-bold">{m.label}:</span>
                                  <select
                                    value={m.val}
                                    onChange={(e) => setLabForm((prev) => ({ ...prev, [m.key]: e.target.value }))}
                                    className="w-full mt-1 text-[11px] font-bold p-1 bg-background border rounded"
                                  >
                                    <option value="Non-Reactive">Non-Reactive</option>
                                    <option value="Reactive">Reactive (Alert!)</option>
                                    <option value="Negative">Negative</option>
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 2B: Blood Report */}
                        <div className="p-4 bg-background rounded-xl border space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                              2. Complete Blood Profile &amp; CBC Report
                            </h4>
                            {labForm.bloodReport?.url && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                Uploaded
                              </span>
                            )}
                          </div>

                          <FileUploadField
                            label="Upload Blood Test / CBC Report (PDF / Image)"
                            value={labForm.bloodReport as any}
                            folder="lab-reports"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            onChange={handleUploadBloodReport}
                            description="CBC, Hemoglobin, Blood Grouping &amp; Rh typing, Thalassemia screen."
                          />

                          <div className="pt-2 border-t text-xs space-y-1.5 text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>Donor Blood Group:</span>
                              <span className="font-bold text-foreground bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {selectedReg.personalInfo?.bloodGroup || "—"}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              Required for verifying donor biological eligibility before Rule 10 statutory certification.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Save Lab Reports Action Footer */}
                      <div className="p-3.5 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">
                          Saving viral markers and blood reports automatically sets the registration status to <strong className="text-teal-700 dark:text-teal-400">UNDER_REVIEW</strong> and unlocks Step 3.
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveLabReports}
                          disabled={actionLoading}
                          className="h-9 text-xs font-bold px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs gap-1.5 shrink-0"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Save Lab Reports &amp; Advance to Step 3 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── STEP 3: ISSUE CERTIFICATE & ENTER SPERM ANALYTIC VALUES & STORAGE ─ */}
                <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  !wf.step2Complete
                    ? "bg-muted/20 border-dashed opacity-60"
                    : wf.step3Complete
                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                    : "bg-purple-50/50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800 ring-1 ring-purple-300"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      {!wf.step2Complete ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Award className={`w-4.5 h-4.5 ${wf.step3Complete ? "text-emerald-600" : "text-purple-600"}`} />
                      )}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                          Step 3: Third — Issue Certificate, Semen Analytic Values &amp; Cryo Storage Details
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Issue Rule 10 statutory clearance, record sperm profile analytics (motility, each vial count), and specify cryo storage coordinates (container no., canister, goblet).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {wf.step3Complete ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Certificate &amp; Cryo Stored ✓
                        </span>
                      ) : wf.step2Complete ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-600" /> Certificate &amp; Values Required
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground border flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Locked (Complete Step 2 First)
                        </span>
                      )}
                    </div>
                  </div>

                  {!wf.step2Complete ? (
                    <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed">
                      Step 3 is locked. Please upload viral markers and blood reports in Step 2 above to unlock certification and semen analysis.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 3A: Rule 10 Statutory Certificate Box */}
                      <div className="p-4 bg-background rounded-xl border space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                          <div>
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <FileBadge2 className="w-4 h-4 text-purple-600" />
                              A. Certificate in terms of Rule 10 (Assisted Reproductive Technology Act, 2021)
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Mandatory statutory certification confirming donor is medically fit, free from HIV/HBsAg/HCV, and semen qualifies for ART use.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {selectedReg.certificateIssued ? (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Certificate Officially Issued
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={handleIssueRule10Certificate}
                                disabled={actionLoading}
                                className="h-8 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-xs gap-1.5"
                              >
                                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                                Issue Certificate (Rule 10)
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPrint(selectedReg)}
                              className="h-8 text-xs rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" /> View / Print Certificate
                            </Button>
                          </div>
                        </div>

                        {selectedReg.certificateIssued && (
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                            <span>
                              ✓ Statutory Rule 10 Certificate issued on{" "}
                              <strong>{formatDisplayDate(selectedReg.certificateIssuedAt || new Date())}</strong> by{" "}
                              <strong>{selectedReg.certificateIssuedBy || "Clinical Administrator"}</strong>.
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">ART ACT 2021 COMPLIANT</span>
                          </div>
                        )}
                      </div>

                      {/* 3B: Semen Analytic Values (Shown in Profile & Reports) */}
                      <div className="p-4 bg-background rounded-xl border space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                            B. Sperm Profile Analytic Values (Shown in Semen Donor Profile &amp; Reports)
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">Laboratory Parameters</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          {/* Motility */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                              <span>Sperm Motility (% / Range) <span className="text-rose-500">*</span></span>
                            </label>
                            <Input
                              value={semenForm.motility}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, motility: e.target.value }))}
                              placeholder="e.g. 70%-90% or 65% Progressive"
                              className="h-8 text-xs font-medium"
                            />
                            <div className="flex gap-1 pt-0.5">
                              {["70%-90%", "60%-70%", "50%-60%"].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setSemenForm((prev) => ({ ...prev, motility: opt }))}
                                  className="text-[9px] px-1.5 py-0.5 bg-muted rounded hover:bg-slate-200 transition font-semibold"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Each Vial Contains */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                              <span>Each Vial Contains <span className="text-rose-500">*</span></span>
                            </label>
                            <Input
                              value={semenForm.eachVialContains}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, eachVialContains: e.target.value }))}
                              placeholder="e.g. 55-60 million Sperm"
                              className="h-8 text-xs font-medium"
                            />
                            <div className="flex gap-1 pt-0.5">
                              {["55-60 million Sperm", "50 million Sperm", "40 million Sperm"].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setSemenForm((prev) => ({ ...prev, eachVialContains: opt }))}
                                  className="text-[9px] px-1.5 py-0.5 bg-muted rounded hover:bg-slate-200 transition font-semibold truncate"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Total Vials Cryopreserved */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">
                              Total Vials Cryopreserved <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={semenForm.totalVials}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, totalVials: e.target.value }))}
                              placeholder="e.g. 4 or 6 Vials"
                              className="h-8 text-xs font-medium"
                            />
                          </div>

                          {/* Ejaculate Volume */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">
                              Ejaculate Volume (mL)
                            </label>
                            <Input
                              value={semenForm.volume}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, volume: e.target.value }))}
                              placeholder="e.g. 2.5 ml"
                              className="h-8 text-xs font-medium"
                            />
                          </div>

                          {/* Morphology */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">
                              Normal Morphology (%)
                            </label>
                            <Input
                              value={semenForm.morphology}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, morphology: e.target.value }))}
                              placeholder="e.g. >4% normal forms"
                              className="h-8 text-xs font-medium"
                            />
                          </div>

                          {/* Liquefaction Time */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">
                              Liquefaction Time
                            </label>
                            <Input
                              value={semenForm.liquefactionTime}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, liquefactionTime: e.target.value }))}
                              placeholder="e.g. 25 mins"
                              className="h-8 text-xs font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3C: Cryo Storage Information (Where Sperm is Stored) */}
                      <div className="p-4 bg-background rounded-xl border space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-emerald-600" />
                            C. Information Where Sperm is Stored (Cryo Tank Coordinates)
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">Liquid Nitrogen (-196°C) Coordinates</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          {/* Container / Tank No */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">
                              Container / Cryo Tank No. <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={semenForm.containerNo}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, containerNo: e.target.value }))}
                              placeholder="e.g. Tank 01 / LN2-Alpha"
                              className="h-8 text-xs font-medium font-mono"
                            />
                          </div>

                          {/* Canister No */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">
                              Canister No. <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={semenForm.canisterNo}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, canisterNo: e.target.value }))}
                              placeholder="e.g. Canister 03"
                              className="h-8 text-xs font-medium font-mono"
                            />
                          </div>

                          {/* Goblet / Cane No */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">
                              Goblet / Cane No. <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={semenForm.gobletNo}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, gobletNo: e.target.value }))}
                              placeholder="e.g. Cane B2 / Goblet 1"
                              className="h-8 text-xs font-medium font-mono"
                            />
                          </div>

                          {/* Storage Location */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[11px] font-bold text-foreground">
                              Storage Facility / Room Location
                            </label>
                            <Input
                              value={semenForm.storageLocation}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, storageLocation: e.target.value }))}
                              placeholder="e.g. Mediyaz ART Cryo Room - Cryo Bank Rack A"
                              className="h-8 text-xs font-medium"
                            />
                          </div>

                          {/* Freezing Date */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">
                              Freezing / Cryo Date
                            </label>
                            <Input
                              type="date"
                              value={semenForm.freezingDate}
                              onChange={(e) => setSemenForm((prev) => ({ ...prev, freezingDate: e.target.value }))}
                              className="h-8 text-xs font-medium"
                            />
                          </div>
                        </div>

                        <div className="pt-1 flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            id="nitrogenLevelOk"
                            checked={semenForm.nitrogenLevelOk}
                            onChange={(e) => setSemenForm((prev) => ({ ...prev, nitrogenLevelOk: e.target.checked }))}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                          />
                          <label htmlFor="nitrogenLevelOk" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                            Liquid Nitrogen Level Verified &amp; Maintained at -196°C
                          </label>
                        </div>
                      </div>

                      {/* Save Semen & Storage Footer */}
                      <div className="p-3.5 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">
                          Saving sperm analytic values and cryo storage coordinates completes Step 3. Once saved, approve the donor to officially move to Sperm Donor Management.
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveSemenAndStorage}
                          disabled={actionLoading}
                          className="h-9 text-xs font-bold px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-xs gap-1.5 shrink-0 cursor-pointer"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Save Semen Values &amp; Storage Details
                        </Button>
                      </div>

                      {/* APPROVAL & TRANSFER BUTTON OR SUCCESS BANNER */}
                      <div className="pt-2">
                        {wf.details.isApproved ? (
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  Donor Officially Approved &amp; Active in Sperm Donor Management!
                                </div>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                  Donor ID: <strong className="font-mono text-sm">{selectedReg.donorId}</strong> • Status: <strong>{selectedReg.status}</strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Link href="/manage-sperm-registrations">
                                  <Button
                                    type="button"
                                    className="h-10 px-5 text-xs font-bold bg-[#285b63] hover:bg-[#1e444a] text-white rounded-xl shadow-xs gap-1.5 cursor-pointer"
                                  >
                                    Go to Sperm Donor Management <ArrowRight className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                                <Link href="/completed-files/sperm">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 px-3.5 text-xs font-semibold rounded-xl border-emerald-300 cursor-pointer"
                                  >
                                    Completed Files
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border bg-gradient-to-r from-teal-50 via-sky-50 to-white dark:from-teal-950/30 dark:to-slate-900 border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-teal-600" />
                                Ready for Sperm Donor Management
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Complete clinical intake and cryo banking approved. Partner hospital, schedule dates, and donor payment are assigned in <strong>Sperm Donor Management</strong>.
                              </p>
                            </div>

                            <Button
                              type="button"
                              onClick={handleApproveAndMoveToManagement}
                              disabled={actionLoading || !wf.step3Complete}
                              className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md gap-2 shrink-0 cursor-pointer"
                            >
                              {actionLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                              Approve &amp; Move to Sperm Donor Management ➔
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Review Notes & Application Secondary Decision Center ─────────── */}
                <div className="p-4 rounded-2xl bg-muted/40 border space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Clinical Reviewer Remarks &amp; Quick Actions
                  </h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter clinical assessment notes or verification remarks..."
                    rows={2}
                    className="w-full p-3 text-xs bg-background border rounded-xl focus:ring-1 focus:ring-teal-500"
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
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Dual Deals & Hospital Assignment Modal (Matching Egg Donor View Exactly) ─── */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent className="rounded-2xl max-w-2xl bg-background border p-6 max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-[#285b63] dark:text-teal-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {dealForm.targetStatus === "APPROVED"
                    ? "Approve Sperm Donor: Hospital Assignment & Setup"
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
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded text-[10px]">
                    Blood: {selectedReg.personalInfo?.bloodGroup || "—"}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                    Sperm Donor (Male)
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
                className="w-full p-2.5 text-xs bg-background border rounded-xl font-medium focus:ring-2 focus:ring-teal-500"
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
                    placeholder="e.g. 5000"
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
                placeholder="Enter clinical assessment notes or specific terms for this semen donor match..."
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

      {/* ─── Edit Details Modal ─── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-3xl max-w-4xl bg-background border shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Edit3 className="w-5 h-5 text-teal-600" />
              Edit Sperm Donor Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update personal info, contact details, lab screening, or uploaded documents for #{selectedReg?.registrationId}
            </DialogDescription>
          </DialogHeader>

          {/* Edit Tabs */}
          <div className="flex items-center gap-2 border-b pb-3 pt-1">
            {[
              { key: "details", label: "Personal & Contact" },
              { key: "documents", label: "Documents" },
              { key: "labReports", label: "Lab Reports & Viral" },
              { key: "affidavit", label: "Affidavit" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setEditTab(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  editTab === tab.key
                    ? "bg-[#285b63] text-white shadow-xs"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-2 text-xs">
            {editTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Full Name *</label>
                    <Input
                      value={editForm.personalInfo?.fullName || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, fullName: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Father&apos;s Name</label>
                    <Input
                      value={editForm.personalInfo?.fatherName || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, fatherName: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Mother&apos;s Name</label>
                    <Input
                      value={editForm.personalInfo?.motherName || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, motherName: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Blood Group</label>
                    <select
                      value={editForm.personalInfo?.bloodGroup || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, bloodGroup: e.target.value },
                        }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs cursor-pointer"
                    >
                      <option value="">Select Blood Group</option>
                      {["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Date of Birth</label>
                    <Input
                      type="date"
                      value={editForm.personalInfo?.dateOfBirth || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Age</label>
                    <Input
                      type="number"
                      value={editForm.personalInfo?.age || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, age: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Marital Status</label>
                    <select
                      value={editForm.personalInfo?.maritalStatus || "Single"}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, maritalStatus: e.target.value },
                        }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs cursor-pointer"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Mobile Number *</label>
                    <Input
                      value={editForm.contactInfo?.mobileNumber || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, mobileNumber: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Email Address</label>
                    <Input
                      value={editForm.contactInfo?.emailAddress || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, emailAddress: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Aadhaar Number</label>
                    <Input
                      value={editForm.personalInfo?.aadhaarNumber || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, aadhaarNumber: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">City</label>
                    <Input
                      value={editForm.contactInfo?.city || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, city: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">State</label>
                    <Input
                      value={editForm.contactInfo?.state || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, state: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Pincode</label>
                    <Input
                      value={editForm.contactInfo?.pincode || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, pincode: e.target.value },
                        }))
                      }
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {editTab === "documents" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DOCUMENTS_CONFIG.map((doc) => (
                  <div key={doc.key} className="p-3.5 rounded-2xl border bg-muted/10 space-y-2">
                    <div className="font-bold text-xs text-foreground">{doc.label}</div>
                    <FileUploadField
                      value={(editForm.documents?.[doc.key] || null) as any}
                      label={`Upload ${doc.label}`}
                      accept={doc.accept}
                      folder={doc.folder}
                      onChange={(fileRef) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            [doc.key]: fileRef,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {editTab === "labReports" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">HIV 1 &amp; 2 Result</label>
                    <Input
                      value={editForm.investigations?.hivStatus || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          investigations: { ...prev.investigations, hivStatus: e.target.value },
                        }))
                      }
                      placeholder="e.g. Non-Reactive / Negative"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">HBsAg Result</label>
                    <Input
                      value={editForm.investigations?.hbsagStatus || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          investigations: { ...prev.investigations, hbsagStatus: e.target.value },
                        }))
                      }
                      placeholder="e.g. Non-Reactive"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">HCV Result</label>
                    <Input
                      value={editForm.investigations?.hepatitisCStatus || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          investigations: { ...prev.investigations, hepatitisCStatus: e.target.value },
                        }))
                      }
                      placeholder="e.g. Non-Reactive"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">VDRL Result</label>
                    <Input
                      value={editForm.investigations?.vdrl || ""}
                      onChange={(e) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          investigations: { ...prev.investigations, vdrl: e.target.value },
                        }))
                      }
                      placeholder="e.g. Non-Reactive"
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-2xl border bg-muted/10 space-y-2">
                    <div className="font-bold text-xs text-foreground">Viral Markers PDF Report</div>
                    <FileUploadField
                      value={(editForm.labReports?.viralMarkersReport || null) as any}
                      label="Upload Viral Markers Report"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      folder="reports"
                      onChange={(fileRef) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          labReports: {
                            ...prev.labReports,
                            viralMarkersReport: fileRef,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl border bg-muted/10 space-y-2">
                    <div className="font-bold text-xs text-foreground">Semen Analysis Report</div>
                    <FileUploadField
                      value={(editForm.labReports?.semenAnalysisReport || null) as any}
                      label="Upload Semen Analysis Report"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      folder="reports"
                      onChange={(fileRef) =>
                        setEditForm((prev: any) => ({
                          ...prev,
                          labReports: {
                            ...prev.labReports,
                            semenAnalysisReport: fileRef,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {editTab === "affidavit" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
                  <h4 className="font-bold text-xs text-foreground">Download Statutory Template</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Download the pre-filled Form 15 affidavit template for notarization.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadAffidavit(selectedReg)}
                    className="rounded-xl text-xs h-8 border-teal-300 text-teal-700 hover:bg-teal-50 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Affidavit Template
                  </Button>
                </div>

                <div className="p-4 rounded-2xl border bg-muted/10 space-y-2">
                  <h4 className="font-bold text-xs text-foreground">Upload Signed &amp; Notarized Affidavit</h4>
                  <FileUploadField
                    value={(editForm.documents?.affidavit || null) as any}
                    label="Upload Notarized Affidavit"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    folder="affidavits"
                    onChange={(fileRef) =>
                      setEditForm((prev: any) => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          affidavit: fileRef,
                        },
                        affidavit: fileRef,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={actionLoading}
              className="rounded-xl text-xs h-10 px-5 bg-[#285b63] hover:bg-[#1d464d] text-white font-bold"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sperm Donor Print Modal */}
      <SpermDonorPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        registration={printTargetReg}
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

      {/* GitHub-style Delete Confirmation Dialog */}
      <GitHubDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        expectedId={regToDelete?.id || ""}
        itemName={regToDelete?.name}
        itemType="sperm donor registration"
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      {/* In-App Document Viewer */}
      <InAppDocumentViewer
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        title={previewMedia?.title || "Document Preview"}
        fileUrl={previewMedia?.url || null}
        donorName={selectedReg?.personalInfo?.fullName}
        donorId={selectedReg?.donorId || selectedReg?.registrationId}
      />
    </div>
  );
}
