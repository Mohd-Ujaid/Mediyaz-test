"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Search,
  Printer,
  Check,
  Eye,
  Loader2,
  Calendar,
  MapPin,
  Activity,
  Phone,
  AlertCircle,
  Clock,
  Dna,
  Building2,
  FileText,
  BookmarkCheck,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  History,
  Edit3,
  Upload,
  FileCheck2,
  CreditCard,
  CheckCircle2,
  Copy,
  ShieldCheck,
  MoreHorizontal,
  XCircle,
  FlaskConical,
  Award,
  GitBranch,
  Stethoscope,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
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
import { computeSpermDonorManagementStatus } from "@/features/donor-registration/utils/sperm-donor-status";
import { InAppDocumentViewer } from "@/components/ui/in-app-document-viewer";
import { DonorPrintModal } from "@/features/donor-registration/components/DonorPrintModal";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { FloatingBulkBar } from "@/components/ui/floating-bulk-bar";
import { confirmAction } from "@/components/ui/custom-confirm-modal";

const DOCUMENTS_CONFIG = [
  { key: "passportPhoto", label: "Photo", accept: ".png,.jpg,.jpeg,.webp", folder: "profile-images" },
  { key: "aadhaarFront", label: "Aadhaar Card (Front)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "aadhaarBack", label: "Aadhaar Card (Back)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "signature", label: "Signature", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "form13", label: "Form 13 (Consent & Fitness PDF)", accept: ".pdf", folder: "form13" },
  { key: "form14", label: "Form 14 (Screening Certificate PDF)", accept: ".pdf", folder: "form14" },
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

  const defaultComp = category === "profile" ? 10000 : 5000;
  const hospDealPrice = category === "profile"
    ? (reg.assignedHospital?.profiledonorDealPrice || reg.assignedHospital?.donorDealPrice)
    : reg.assignedHospital?.donorDealPrice;

  const amount =
    typeof rawAmount === "number" && rawAmount > 0
      ? rawAmount
      : (hospDealPrice && hospDealPrice > 0 ? hospDealPrice : defaultComp);

  const terms = reg.donorDeal?.paymentTerms || "On Sample Collection";
  const isPaid = reg.donorDeal?.paymentStatus === "PAID" || reg.isDonorPaid === true;
  const paymentStatus = reg.donorDeal?.paymentStatus || (reg.isDonorPaid ? "PAID" : "PENDING");
  const paidAt = reg.donorDeal?.paidAt || reg.paidAt || null;
  const paidBy = reg.donorDeal?.paidBy || reg.paidBy || null;
  const paymentReference = reg.donorDeal?.paymentReference || "";

  return { category, amount, terms, paymentStatus, isPaid, paidAt, paidBy, paymentReference };
};

export default function ManageSpermRegistrationsPage() {
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
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");

  // Segmented Status Tabs State for Sperm Donor Management
  const [activeTab, setActiveTab] = useState<"all" | "APPROVED" | "WAITING_FORM13" | "FILE_COMPLETED" | "CANCELLED" | "other">("APPROVED");
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    approved: 0,
    waitingForm13: 0,
    fileCompleted: 0,
    cancelled: 0,
    other: 0,
  });

  const handleTabChange = (tab: "all" | "APPROVED" | "WAITING_FORM13" | "FILE_COMPLETED" | "CANCELLED" | "other") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds([]);
    if (tab === "all") {
      setStatusFilter("");
    } else if (tab === "other") {
      setStatusFilter("other");
    } else if (tab === "CANCELLED") {
      setStatusFilter("CANCELLED");
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
  const [assignReg, setAssignReg] = useState<any | null>(null);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [tempSelectedHospitalId, setTempSelectedHospitalId] = useState<string | null>(null);
  const [tempSelectedBranch, setTempSelectedBranch] = useState<{
    branchId: string;
    branchName: string;
    doctorName?: string;
  } | null>(null);

  // Dedicated Doctor Assignment States
  const [isAssignDoctorOpen, setIsAssignDoctorOpen] = useState(false);
  const [doctorAssignReg, setDoctorAssignReg] = useState<any | null>(null);
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [customDoctorInput, setCustomDoctorInput] = useState("");
  const [doctorModalBranchId, setDoctorModalBranchId] = useState("");

  // Bulk Doctor Assignment States
  const [isBulkAssignDoctorOpen, setIsBulkAssignDoctorOpen] = useState(false);
  const [bulkDoctorName, setBulkDoctorName] = useState("");
  const [bulkCustomDoctorInput, setBulkCustomDoctorInput] = useState("");
  const [bulkDoctorHospitalId, setBulkDoctorHospitalId] = useState("");
  const [bulkDoctorBranchId, setBulkDoctorBranchId] = useState("");

  // Table UX & Density States
  const [tableDensity, setTableDensity] = useState<"compact" | "comfortable">("comfortable");
  const [visibleColumns, setVisibleColumns] = useState({
    hospital: true,
    doctor: true,
    approvedBy: true,
    deal: true,
    payout: true,
    form13: true,
    scheduleDates: true,
    status: true,
  });

  const handleOpenAssignModal = (reg: any) => {
    setAssignReg(reg);
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
    setHospitalSearch("");
    setIsAssignOpen(true);
  };

  // Edit Clinical & Schedule Dates Modal (Sample Collection, Recruitment, Supply)
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pickupReg, setPickupReg] = useState<any | null>(null);
  const [pickupDateValue, setPickupDateValue] = useState("");
  const [recruitmentDateValue, setRecruitmentDateValue] = useState("");
  const [supplyDateValue, setSupplyDateValue] = useState("");
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
    setRecruitmentDateValue(formatDateForInput(reg.recruitmentDate));
    setSupplyDateValue(formatDateForInput(reg.supplyDate));
    setIsPickupModalOpen(true);
  };

  const handleSavePickupDate = async () => {
    if (!pickupReg) return;
    setSavingPickupDate(true);
    try {
      const updatedSim = {
        ...pickupReg,
        pickupDate: pickupDateValue,
        recruitmentDate: recruitmentDateValue,
        supplyDate: supplyDateValue,
      };
      const autoStatus = computeSpermDonorManagementStatus(updatedSim).status;

      const data = await updateAdminRegistrationStatusAction({
        registrationId: pickupReg.registrationId,
        pickupDate: pickupDateValue,
        recruitmentDate: recruitmentDateValue,
        supplyDate: supplyDateValue,
        status: autoStatus,
      });
      if (data.success) {
        if (autoStatus === "WAITING_FORM13") {
          toast.success("Dates saved! Status automatically advanced to WAITING FORM 13.");
        } else if (autoStatus === "FILE_COMPLETED") {
          toast.success("Dates saved! Status is FILE COMPLETED.");
        } else {
          toast.success("Schedule dates updated successfully!");
        }
        setIsPickupModalOpen(false);
        const updatedPickup = pickupDateValue;
        const updatedRecruit = recruitmentDateValue;
        const updatedSupply = supplyDateValue;
        const targetId = pickupReg.registrationId;
        setPickupReg(null);
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === targetId
              ? {
                  ...r,
                  pickupDate: updatedPickup,
                  recruitmentDate: updatedRecruit,
                  supplyDate: updatedSupply,
                  status: autoStatus,
                }
              : r
          )
        );
        if (selectedReg && selectedReg.registrationId === targetId) {
          setSelectedReg((prev: any) =>
            prev
              ? {
                  ...prev,
                  pickupDate: updatedPickup,
                  recruitmentDate: updatedRecruit,
                  supplyDate: updatedSupply,
                  status: autoStatus,
                }
              : null
          );
        }
        loadRegistrations();
      } else {
        toast.error(data.error || "Failed to update dates.");
      }
    } catch {
      toast.error("Error updating dates.");
    } finally {
      setSavingPickupDate(false);
    }
  };

  // Donor Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentReg, setPaymentReg] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState<{
    donorCategory: "normal" | "profile" | "registry";
    compensationAmount: number;
    paymentTerms: string;
    paymentMethod: "bank_transfer" | "upi" | "cheque" | "cash";
    status: "PAID" | "PENDING";
    paidDate: string;
    paidBy: string;
    paymentReference: string;
  }>({
    donorCategory: "normal",
    compensationAmount: 5000,
    paymentTerms: "Full on Sample Collection & Cryopreservation",
    paymentMethod: "bank_transfer",
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
    const cat = (reg.donorDeal?.donorCategory || reg.hospitalDealType || deal.category || "normal") as "normal" | "profile" | "registry";
    const compAmount =
      reg.donorDeal?.compensationAmount !== undefined
        ? reg.donorDeal.compensationAmount
        : cat === "registry"
        ? 0
        : deal.amount || (cat === "profile" ? 10000 : 5000);

    setPaymentForm({
      donorCategory: cat,
      compensationAmount: compAmount,
      paymentTerms: reg.donorDeal?.paymentTerms || deal.terms || "Full on Sample Collection & Cryopreservation",
      paymentMethod: (reg.donorDeal?.paymentMethod || "bank_transfer") as any,
      status: deal.isPaid ? "PAID" : "PENDING",
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
      const isPaid = paymentForm.status === "PAID";
      const resolvedPaidDate = isPaid ? (paymentForm.paidDate ? new Date(paymentForm.paidDate) : new Date()) : null;
      const resolvedPaidBy = isPaid ? (paymentForm.paidBy || "Admin") : null;
      const compAmount = paymentForm.donorCategory === "registry" ? 0 : Number(paymentForm.compensationAmount || 0);

      const updatedDonorDeal = {
        ...(paymentReg.donorDeal || {}),
        donorCategory: paymentForm.donorCategory,
        compensationAmount: compAmount,
        paymentTerms: paymentForm.paymentTerms,
        paymentMethod: paymentForm.paymentMethod,
        paymentStatus: paymentForm.status,
        agreedAt: paymentReg.donorDeal?.agreedAt || new Date(),
        agreedBy: paymentReg.donorDeal?.agreedBy || "Admin",
        paidAt: resolvedPaidDate,
        paidBy: resolvedPaidBy,
        paymentReference: paymentForm.paymentReference || "",
      };

      const updatedSim = {
        ...paymentReg,
        isDonorPaid: isPaid,
        hospitalDealType: paymentForm.donorCategory,
        donorDeal: updatedDonorDeal,
      };
      const autoStatus = computeSpermDonorManagementStatus(updatedSim).status;

      const regId = paymentReg.registrationId || paymentReg._id;
      const res = await fetch(`/api/donor-registrations/sperm/${encodeURIComponent(regId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalDealType: paymentForm.donorCategory,
          donorDeal: updatedDonorDeal,
          clinicDeal: {
            donorCategory: paymentForm.donorCategory,
            hospitalDealPrice: paymentForm.donorCategory === "profile" ? 25000 : 15000,
            currency: "INR",
            paymentStatus: "PENDING",
          },
          isDonorPaid: isPaid,
          paidAt: resolvedPaidDate,
          paidBy: resolvedPaidBy,
          paymentReference: paymentForm.paymentReference || "",
          status: autoStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          isPaid
            ? "Donor payment marked as PAID and compensation details saved!"
            : "Donor compensation & payment details updated successfully!"
        );
        setIsPaymentModalOpen(false);
        const updated = {
          ...paymentReg,
          ...(data.registration || {}),
          status: autoStatus,
          isDonorPaid: isPaid,
          paidAt: resolvedPaidDate,
          paidBy: resolvedPaidBy,
          paymentReference: paymentForm.paymentReference || "",
          donorDeal: updatedDonorDeal,
          hospitalDealType: paymentForm.donorCategory,
        };

        setRegistrations((prev) =>
          prev.map((r) => (r.registrationId === regId || r._id === regId ? { ...r, ...updated } : r))
        );
        if (selectedReg && (selectedReg.registrationId === regId || selectedReg._id === regId)) {
          setSelectedReg((prev: any) => ({ ...prev, ...updated }));
        }
        setPaymentReg(null);
        loadRegistrations();
      } else {
        toast.error(data.error || "Failed to update donor payment details.");
      }
    } catch {
      toast.error("Error saving donor payment.");
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

  const handleOpenForm13Modal = (reg: any) => {
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
        entityType: "SpermDonorRegistration",
        entityId: reg._id,
        details: `Form 13 PDF opened in viewer for ${reg.personalInfo?.fullName || reg.registrationId}`,
      }),
    }).catch(() => {});
  };

  const handleUploadForm13 = async (file: File) => {
    if (!form13Reg) return;
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
        const autoStatus = computeSpermDonorManagementStatus(updatedSim).status;

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
      const autoStatus = computeSpermDonorManagementStatus(updatedSim).status;

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
        entityType: "SpermDonorRegistration",
        entityId: reg._id,
        details: `Form 14 PDF opened in viewer for ${reg.personalInfo?.fullName || reg.registrationId}`,
      }),
    }).catch(() => {});
  };

  const handleUploadForm14 = async (file: File) => {
    if (!form14Reg) return;
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

  const handleManagementDocUpload = async (docKey: "semenAnalysisReport" | "viralMarkersReport" | "bloodReport" | "insurance" | "healthInsurance", fileRef: any) => {
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
      if (docKey === "semenAnalysisReport") {
        updates["labReports.semenAnalysis"] = [docData];
        updates["semenAnalysisReport"] = docData;
      } else if (docKey === "viralMarkersReport") {
        updates["labReports.viralMarkers"] = [docData];
        updates["viralMarkersReport"] = docData;
      } else if (docKey === "insurance") {
        updates["insurance"] = docData;
        updates["documents.insurance"] = docData;
      }

      const updatedSim = {
        ...selectedReg,
        labReports: {
          ...(selectedReg.labReports || {}),
          ...(docKey === "semenAnalysisReport"
            ? { semenAnalysisReport: docData, semenAnalysis: [docData] }
            : docKey === "viralMarkersReport"
            ? { viralMarkersReport: docData, viralMarkers: [docData] }
            : { [docKey]: docData }),
        },
        ...(docKey === "insurance" ? { insurance: docData } : {}),
      };
      const autoStatus = computeSpermDonorManagementStatus(updatedSim).status;
      updates.status = autoStatus;

      const res = await fetch(`/api/donor-registrations/sperm/${selectedReg.registrationId}`, {
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
          if (docKey === "semenAnalysisReport") {
            updated.labReports.semenAnalysisReport = docData;
            updated.labReports.semenAnalysis = [docData];
            updated.semenAnalysisReport = docData;
          } else if (docKey === "viralMarkersReport") {
            updated.labReports.viralMarkersReport = docData;
            updated.labReports.viralMarkers = [docData];
            updated.viralMarkersReport = docData;
          } else if (docKey === "insurance") {
            updated.labReports.insurance = docData;
            updated.insurance = docData;
            if (!updated.documents) updated.documents = {};
            updated.documents.insurance = docData;
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
            if (docKey === "semenAnalysisReport") {
              updated.labReports.semenAnalysisReport = docData;
              updated.labReports.semenAnalysis = [docData];
              updated.semenAnalysisReport = docData;
            } else if (docKey === "viralMarkersReport") {
              updated.labReports.viralMarkersReport = docData;
              updated.labReports.viralMarkers = [docData];
              updated.viralMarkersReport = docData;
            } else if (docKey === "insurance") {
              updated.labReports.insurance = docData;
              updated.insurance = docData;
              if (!updated.documents) updated.documents = {};
              updated.documents.insurance = docData;
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

  // Fetch Approved Registrations (Sperm Donors Only)
  async function loadRegistrations() {
    setLoading(true);
    try {
      const data = (await getAdminRegistrationsAction({
        page: currentPage,
        limit: itemsPerPage,
        search,
        donorType: "sperm",
        status: statusFilter || undefined,
        hospital: hospitalFilter || undefined,
        branch: branchFilter || undefined,
        startDate: fromDateFilter || undefined,
        endDate: toDateFilter || undefined,
      })) as any;
      if (data.success && data.registrations) {
        // Strictly exclude egg donors and auto-sync status for sperm donors in management
        const spermOnly = (data.registrations || [])
          .filter(
            (r: any) => {
              if (r.donorType !== "sperm" && !r.registrationId?.startsWith("MED-SD") && !r.registrationId?.startsWith("SPM")) {
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
            }
          )
          .map((r: any) => {
            const computed = computeSpermDonorManagementStatus(r).status;
            if (["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(r.status) && computed !== r.status) {
              if (computed === "FILE_COMPLETED" && r.status !== "FILE_COMPLETED") {
                patchAdminRegistrationFieldsAction(r.registrationId, { status: "FILE_COMPLETED" }).catch(() => {});
              }
              return { ...r, status: computed };
            }
            return r;
          });
        setRegistrations(spermOnly);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalCount(data.pagination.total || spermOnly.length);
        } else {
          setTotalCount(spermOnly.length);
        }
        if (data.statusCounts) setStatusCounts(data.statusCounts);
      } else {
        toast.error(data.error || "Failed to load registrations.");
      }
    } catch {
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
    } catch {
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
    } catch {
      console.error("Failed to load audit logs");
    } finally {
      setAuditsLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, [search, hospitalFilter, branchFilter, statusFilter, fromDateFilter, toDateFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    loadHospitals();
  }, []);

  // When registrationIdParam changes in URL, auto open detail
  useEffect(() => {
    if (registrationIdParam) {
      fetch(`/api/donor-registrations/sperm/${registrationIdParam}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.registration) {
            setSelectedReg(d.registration);
            setDetailTab("management");
            setIsDetailOpen(true);
          }
        })
        .catch(() => {});
    }
  }, [registrationIdParam]);

  // Handle single hospital assign
  const handleAssignHospital = async (
    hospitalId: string | null,
    branchInfo?: { branchName: string; branchId: string; doctorName?: string } | null
  ) => {
    const target = assignReg || selectedReg;
    if (!target) return;
    setActionLoading(true);
    try {
      const regId = target.registrationId || target._id;
      const data = await updateAdminRegistrationStatusAction({
        registrationId: target.registrationId,
        assignedHospitalId: hospitalId || "",
        assignedBranch: branchInfo?.branchName || "",
        assignedBranchId: branchInfo?.branchId || "",
        assignedDoctor: branchInfo?.doctorName || "",
        reason: "Assigned via Sperm Donor Management dashboard",
      });
      if (data.success) {
        toast.success(
          hospitalId
            ? (branchInfo?.branchName ? `Mapped to ${branchInfo.branchName} successfully!` : "Clinic assigned successfully!")
            : "Clinic unassigned."
        );
        setIsAssignOpen(false);
        const updatedHosp = hospitals.find((h) => h._id === hospitalId) || null;
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === target.registrationId || r._id === regId
              ? {
                  ...r,
                  assignedHospital: updatedHosp,
                  assignedBranch: branchInfo?.branchName || "",
                  assignedBranchId: branchInfo?.branchId || "",
                  assignedDoctor: branchInfo?.doctorName || "",
                }
              : r
          )
        );
        if (selectedReg && (selectedReg.registrationId === target.registrationId || selectedReg._id === regId)) {
          setSelectedReg((prev: any) => ({
            ...prev,
            assignedHospital: updatedHosp,
            assignedBranch: branchInfo?.branchName || "",
            assignedBranchId: branchInfo?.branchId || "",
            assignedDoctor: branchInfo?.doctorName || "",
          }));
        }
        setAssignReg(null);
        loadRegistrations();
      } else {
        toast.error(data.error || "Failed to update hospital assignment.");
      }
    } catch {
      toast.error("Error updating hospital assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Operations Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(registrations.map((r) => r.registrationId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmAction({
      title: "Update Status",
      message: `Are you sure you want to change status to "${newStatus}" for ${selectedIds.length} donors?`,
      confirmText: `Yes, Set to ${newStatus}`,
      variant: newStatus === "CANCELLED" ? "destructive" : "default",
    });
    if (!confirmed) return;

    setActionLoading(true);
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await updateAdminRegistrationStatusAction({
          registrationId: id,
          status: newStatus,
          adminNotes: `Bulk status update to ${newStatus}`,
        });
        if (res.success) successCount++;
      }
      toast.success(`Updated ${successCount} of ${selectedIds.length} donor records.`);
      setSelectedIds([]);
      loadRegistrations();
    } catch {
      toast.error("Bulk status update encountered errors.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAssign = async (
    hospitalId: string,
    branchInfo?: { branchName: string; branchId: string; doctorName?: string } | null
  ) => {
    if (selectedIds.length === 0 || !hospitalId) return;
    setActionLoading(true);
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await updateAdminRegistrationStatusAction({
          registrationId: id,
          assignedHospitalId: hospitalId,
          assignedBranch: branchInfo?.branchName || "",
          assignedBranchId: branchInfo?.branchId || "",
          assignedDoctor: branchInfo?.doctorName || "",
          reason: "Bulk assignment via Sperm Donor Management dashboard",
        });
        if (res.success) successCount++;
      }
      toast.success(`Assigned ${successCount} of ${selectedIds.length} donors to clinic.`);
      setIsBulkAssignOpen(false);
      setSelectedIds([]);
      loadRegistrations();
    } catch {
      toast.error("Bulk clinic assignment encountered errors.");
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
        reason: "Doctor assignment via Sperm Donor Management dashboard",
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
          reason: "Bulk doctor assignment via Sperm Donor Management dashboard",
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
      toast.error("Network error during bulk doctor assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleStatusChange = async (regId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await updateAdminRegistrationStatusAction({
        registrationId: regId,
        status: newStatus,
        adminNotes: `Status changed to ${newStatus}`,
      });
      if (res.success) {
        toast.success(`Status updated to ${newStatus}`);
        loadRegistrations();
        if (selectedReg && selectedReg.registrationId === regId) {
          setSelectedReg((prev: any) => ({ ...prev, status: newStatus }));
        }
      } else {
        toast.error(res.error || "Failed to update status.");
      }
    } catch {
      toast.error("Error updating status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkExportCSV = () => {
    if (selectedIds.length === 0) return;
    const selectedRegs = registrations.filter((r) => selectedIds.includes(r.registrationId));
    const headers = [
      "Donor ID",
      "Registration ID",
      "Full Name",
      "Age",
      "Blood Group",
      "Hospital",
      "Status",
      "Payout Status",
      "Form 13",
      "Form 14",
      "Sample Collection Date",
      "Phone",
      "Email",
    ];
    const rows = selectedRegs.map((r) => {
      const deal = getDonorDealInfo(r);
      const f13 = getForm13Info(r);
      const f14 = getForm14Info(r);
      return [
        r.donorId || "",
        r.registrationId,
        r.personalInfo?.fullName || "",
        r.personalInfo?.age || "",
        r.personalInfo?.bloodGroup || "",
        r.assignedHospital?.name || "Unassigned",
        r.status,
        deal.isPaid ? "PAID" : "NOT PAID",
        f13.isUploaded ? "UPLOADED" : "MISSING",
        f14.isUploaded ? "UPLOADED" : "MISSING",
        r.pickupDate || "",
        r.contactInfo?.mobileNumber || "",
        r.contactInfo?.emailAddress || "",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sperm_donors_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedRegs.length} sperm donor records to CSV.`);
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      window.open(`/admin/manage-registrations/${id}/print?withHeader=true`, "_blank");
    });
    toast.info(`Opening printable dossiers for ${selectedIds.length} donors in new tabs...`);
  };

  // Open Edit profile modal
  const handleOpenEdit = (reg: any) => {
    setSelectedReg(reg);
    setEditForm({
      fullName: reg.personalInfo?.fullName || "",
      fatherName: reg.personalInfo?.fatherName || "",
      motherName: reg.personalInfo?.motherName || "",
      bloodGroup: reg.personalInfo?.bloodGroup || "",
      phone: reg.contactInfo?.mobileNumber || "",
      email: reg.contactInfo?.emailAddress || "",
      currentAddress: reg.contactInfo?.currentAddress || "",
      status: reg.status || "APPROVED",
      donorId: reg.donorId || "",
      documents: reg.documents || {},
      labReports: reg.labReports || {},
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;
    setActionLoading(true);
    try {
      const updates = {
        "personalInfo.fullName": editForm.fullName,
        "personalInfo.fatherName": editForm.fatherName,
        "personalInfo.motherName": editForm.motherName,
        "personalInfo.bloodGroup": editForm.bloodGroup,
        "contactInfo.mobileNumber": editForm.phone,
        "contactInfo.emailAddress": editForm.email,
        "contactInfo.currentAddress": editForm.currentAddress,
        status: editForm.status,
        documents: editForm.documents,
        labReports: editForm.labReports,
      };

      const res = await patchAdminRegistrationFieldsAction(selectedReg.registrationId, updates);
      if (res.success) {
        toast.success("Profile updated successfully!");
        setIsEditOpen(false);
        loadRegistrations();
      } else {
        toast.error(res.error || "Failed to update profile.");
      }
    } catch {
      toast.error("Error saving profile edits.");
    } finally {
      setActionLoading(false);
    }
  };

  // Pagination Logic
  const paginatedRegs = registrations;

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
  const filteredHospitals = hospitals.filter(
    (h) =>
      h.status === "ACTIVE" &&
      (h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
        h.address.toLowerCase().includes(hospitalSearch.toLowerCase()))
  );

  const bulkFilteredHospitals = hospitals.filter(
    (h) =>
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
            <Dna className="w-6 h-6 text-teal-600" />
            Sperm Donor Management
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
            tab: "CANCELLED" as const,
            title: "Cancelled / Inactive",
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
                else if (val === "CANCELLED") setActiveTab("CANCELLED");
                else if (val === "" && activeTab !== "all") setActiveTab("all");
                else if (["COMPLETED", "UNDER_REVIEW", "SUSPENDED", "REJECTED", "other"].includes(val)) setActiveTab("other");
              }}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500 font-medium"
            >
              {activeTab === "all" ? (
                <>
                  <option value="">All Pipeline Statuses</option>
                  <option value="APPROVED">Status: Approved</option>
                  <option value="WAITING_FORM13">Status: Waiting Form 13</option>
                  <option value="FILE_COMPLETED">Status: File Completed</option>
                  <option value="CANCELLED">Status: Cancelled</option>
                  <option value="COMPLETED">Status: Completed</option>
                  <option value="UNDER_REVIEW">Status: Under Review</option>
                  <option value="SUSPENDED">Status: Suspended</option>
                  <option value="REJECTED">Status: Rejected</option>
                </>
              ) : activeTab === "other" ? (
                <>
                  <option value="other">All Other Statuses</option>
                  <option value="COMPLETED">Status: Completed</option>
                  <option value="UNDER_REVIEW">Status: Under Review</option>
                  <option value="SUSPENDED">Status: Suspended</option>
                  <option value="REJECTED">Status: Rejected</option>
                </>
              ) : (
                <option value={activeTab}>Filter: {activeTab.replace(/_/g, " ")}</option>
              )}
            </select>
          </div>
        </div>

        {/* Date Range & Reset Options */}
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

          {(search || hospitalFilter || branchFilter || statusFilter !== "APPROVED" || fromDateFilter || toDateFilter || activeTab !== "APPROVED") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setHospitalFilter("");
                setBranchFilter("");
                setStatusFilter("APPROVED");
                setActiveTab("APPROVED");
                setFromDateFilter("");
                setToDateFilter("");
              }}
              className="h-8 text-xs text-slate-600 hover:text-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            >
              Reset All Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-800 dark:text-teal-300 text-xs px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60">
              {selectedIds.length} Selected
            </span>
            <span className="text-slate-500 text-xs">Perform batch clinical operations:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBulkSelectedHospitalId(null);
                setBulkSelectedBranch(null);
                setIsBulkAssignOpen(true);
              }}
              disabled={actionLoading}
              className="border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-100/50 rounded-xl text-xs gap-1 py-1 px-3 h-8 cursor-pointer"
              title="Assign selected sperm donors to an affiliate clinic"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" /> Assign Clinic
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBulkDoctorName("");
                setBulkCustomDoctorInput("");
                const selectedRegs = registrations.filter(r => selectedIds.includes(r.registrationId));
                const firstHospId = selectedRegs[0]?.assignedHospital?._id || selectedRegs[0]?.assignedHospitalId;
                const allSameHosp = selectedRegs.length > 0 && selectedRegs.every(r => (r.assignedHospital?._id || r.assignedHospitalId) === firstHospId);
                if (allSameHosp && firstHospId) {
                  setBulkDoctorHospitalId(firstHospId);
                  const firstBranchId = selectedRegs[0]?.assignedBranchId || selectedRegs[0]?.assignedBranch;
                  const allSameBranch = selectedRegs.every(r => (r.assignedBranchId || r.assignedBranch) === firstBranchId);
                  if (allSameBranch && firstBranchId) {
                    setBulkDoctorBranchId(firstBranchId);
                  } else {
                    setBulkDoctorBranchId("");
                  }
                } else {
                  setBulkDoctorHospitalId("");
                  setBulkDoctorBranchId("");
                }
                setIsBulkAssignDoctorOpen(true);
              }}
              disabled={actionLoading}
              className="border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 hover:bg-purple-100/50 rounded-xl text-xs gap-1 py-1 px-3 h-8 cursor-pointer shadow-xs"
              title="Assign selected sperm donors to a treating doctor"
            >
              <Stethoscope className="w-3.5 h-3.5 text-purple-600" /> Assign Doctor
            </Button>
            <Button
              variant="outline"
              onClick={handleBulkPrint}
              disabled={actionLoading}
              className="border-slate-200 hover:bg-slate-100 rounded-xl text-xs gap-1 py-1 px-3 h-8"
              title="Print documents for selected registrations"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" /> Print PDFs
            </Button>
            <Button
              variant="outline"
              onClick={handleBulkExportCSV}
              disabled={actionLoading}
              className="border-slate-200 hover:bg-slate-100 rounded-xl text-xs gap-1 py-1 px-3 h-8"
              title="Export selected donor rows to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
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
                { key: "scheduleDates", label: "Schedule Dates" },
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
          <div className="text-center py-20 text-slate-400 text-xs">No sperm donor records found for the selected status.</div>
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
                  {visibleColumns.scheduleDates && <th className={`${tableDensity === "compact" ? "py-2 px-2.5" : "p-3.5"} whitespace-nowrap`}>Schedule Dates</th>}
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
                      {visibleColumns.hospital && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          {reg.assignedHospital ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-teal-800 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300 px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1.5 border border-teal-200 dark:border-teal-800 whitespace-nowrap">
                                <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span className="truncate max-w-[160px]" title={reg.assignedHospital.name}>
                                  {reg.assignedHospital.name}
                                </span>
                              </div>
                              {reg.assignedBranch && (
                                <div className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1 pl-1">
                                  <GitBranch className="w-3 h-3 text-teal-600 shrink-0" />
                                  <span>{reg.assignedBranch}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium pl-1">Unassigned</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.doctor && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          {reg.assignedDoctor ? (
                            <button
                              type="button"
                              onClick={() => openAssignDoctorModal(reg)}
                              className="font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 dark:text-purple-300 px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1.5 border border-purple-200 dark:border-purple-800 whitespace-nowrap cursor-pointer transition-colors"
                              title="Click to change treating doctor"
                            >
                              <Stethoscope className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span className="truncate max-w-[150px]" title={reg.assignedDoctor}>
                                Dr. {reg.assignedDoctor.replace(/^Dr\.?\s*/i, "")}
                              </span>
                            </button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssignDoctorModal(reg)}
                              className="h-6 text-[10px] text-purple-600 border-purple-200 hover:bg-purple-50 rounded-lg py-0.5 px-2 font-medium whitespace-nowrap cursor-pointer"
                            >
                              + Assign Doctor
                            </Button>
                          )}
                        </td>
                      )}
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
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenForm13Modal(reg)}
                                      className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200 dark:border-rose-800 cursor-pointer shadow-2xs"
                                      title="Click to upload Form 13 PDF"
                                    >
                                      <Upload className="w-2.5 h-2.5 text-rose-600" /> + Upload
                                    </button>
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
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenForm14Modal(reg)}
                                      className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200 dark:border-rose-800 cursor-pointer shadow-2xs"
                                      title="Click to upload Form 14 PDF"
                                    >
                                      <Upload className="w-2.5 h-2.5 text-rose-600" /> + Upload
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      )}
                      {visibleColumns.scheduleDates && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          <div className="space-y-1 text-[11px]">
                            {/* Sample Collection Date */}
                            <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                              <span className="text-slate-400 font-medium text-[10px]">Collection:</span>
                              <div className="inline-flex items-center gap-1 font-semibold">
                                {formatDisplayDate(reg.pickupDate) ? (
                                  <span className="text-teal-700 dark:text-teal-400 font-mono text-[10px]">
                                    {formatDisplayDate(reg.pickupDate)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">Not set</span>
                                )}
                              </div>
                            </div>

                            {/* Recruitment Date */}
                            <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                              <span className="text-slate-400 font-medium text-[10px]">Recruit:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 text-[10px]">
                                {formatDisplayDate(reg.recruitmentDate) || "—"}
                              </span>
                            </div>

                            {/* Supply Date */}
                            <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                              <span className="text-slate-400 font-medium text-[10px]">Supply:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 text-[10px]">
                                {formatDisplayDate(reg.supplyDate) || "—"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenPickupModal(reg)}
                              className="text-[10px] text-teal-600 hover:text-teal-800 hover:underline font-semibold flex items-center gap-1 pt-0.5 border-t border-slate-100 dark:border-slate-800 cursor-pointer w-full whitespace-nowrap"
                            >
                              <Calendar className="w-2.5 h-2.5" /> Manage Dates
                            </button>
                          </div>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className={`${cellPad} whitespace-nowrap`}>
                          {(() => {
                            const auto = computeSpermDonorManagementStatus(reg);
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
                                    <span title={`Status: ${auto.status} • Requirements: ${auto.missingRequirements.join(", ")}`} className="truncate max-w-[150px]">
                                      {auto.missingRequirements[0] || (auto.isDealPaid ? "Dates Pending" : "In Management")}
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
                                <Edit3 className="w-4 h-4 text-emerald-600" /> Edit Details &amp; Docs
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenPickupModal(reg)}
                                className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                              >
                                <Calendar className="w-4 h-4 text-blue-600" /> Schedule Clinical Dates
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenPaymentModal(reg)}
                                className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                              >
                                <CreditCard className="w-4 h-4 text-emerald-600" /> Donor Compensation &amp; Payout
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
                                      message: `Re-activate registration for ${reg.personalInfo?.fullName || reg.registrationId}?`,
                                      confirmText: "Yes, Restore to Approved",
                                      variant: "default",
                                    });
                                    if (confirmed) {
                                      handleSingleStatusChange(reg.registrationId, "APPROVED");
                                    }
                                  }}
                                  className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/40"
                                >
                                  <Check className="w-4 h-4 text-emerald-600" /> Restore to Approved
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

        {/* Custom Pagination */}
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
            itemName="sperm donor registrations"
            loading={loading}
          />
        )}
      </Card>

      {/* DIALOG 1: MAP HOSPITAL */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base font-bold">
              <Building2 className="w-5 h-5 text-teal-600" /> Map Partner Hospital &amp; Branch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign sperm donor: <span className="font-mono font-bold">{selectedReg?.registrationId}</span> to a partner hospital and choose the specific branch center and treating doctor.
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
                  <span>Choose Partner Clinic &amp; Designated Branch</span>
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
                              Location: {currentBranchObj.pickupLocation}
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

      {/* DIALOG 1.5: SET CLINICAL & SCHEDULE DATES (Sample Collection, Recruitment, Supply) */}
      <Dialog open={isPickupModalOpen} onOpenChange={setIsPickupModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-teal-600" /> Manage Clinical &amp; Schedule Dates
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Donor: <span className="font-semibold text-slate-700 dark:text-slate-300">{pickupReg?.personalInfo?.fullName}</span> ({pickupReg?.registrationId})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            {/* Scheduled Sample Collection Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Scheduled Sample Collection Date:
              </label>
              <Input
                type="date"
                value={pickupDateValue}
                onChange={(e) => setPickupDateValue(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
              <p className="text-[10px] text-slate-400">
                Semen collection and cryopreservation date scheduled with partner clinic.
              </p>
            </div>

            {/* Recruitment Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Recruitment Date:
              </label>
              <Input
                type="date"
                value={recruitmentDateValue}
                onChange={(e) => setRecruitmentDateValue(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
              <p className="text-[10px] text-slate-400">
                Donor onboarding and recruitment confirmation date.
              </p>
            </div>

            {/* Supply Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Supply Date:
              </label>
              <Input
                type="date"
                value={supplyDateValue}
                onChange={(e) => setSupplyDateValue(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
              <p className="text-[10px] text-slate-400">
                Scheduled or completed clinic sample dispatch / supply date.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs"
              >
                {savingPickupDate ? "Saving..." : "Save Dates"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1.75: ASSIGN DONOR DEAL & PAYMENT STATUS */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Assign Donor Deal &amp; Payment Status
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign compensation deal, payment terms, and donor paid/pending status for{" "}
              <strong className="text-foreground">{paymentReg?.personalInfo?.fullName || paymentReg?.registrationId}</strong>
              {paymentReg?.donorId ? ` • Donor ID: ${paymentReg.donorId}` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* 1. Deal Category Selection Cards */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Select Donor Deal Tier:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    key: "normal",
                    title: "Normal Donor",
                    desc: "Standard tier deal.",
                    price: 5000,
                    icon: "👤",
                  },
                  {
                    key: "profile",
                    title: "Profile Donor",
                    desc: "Premium verified tier.",
                    price: 10000,
                    icon: "⭐",
                  },
                  {
                    key: "registry",
                    title: "Registry Allocation",
                    desc: "Direct ART Bank allocation.",
                    price: 0,
                    icon: "🏛️",
                  },
                ].map((cat) => {
                  const isSelected = paymentForm.donorCategory === cat.key;
                  return (
                    <div
                      key={cat.key}
                      onClick={() =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          donorCategory: cat.key as any,
                          compensationAmount: cat.price,
                        }))
                      }
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200"
                          : "bg-background hover:bg-muted/40 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center gap-1">
                          <span>{cat.icon}</span> {cat.title}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-600 text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{cat.desc}</p>
                      <div className="font-mono font-bold text-xs mt-2 text-foreground">
                        ₹{cat.price.toLocaleString()} Payout
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Compensation Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-muted/30 rounded-xl border">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  Compensation Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  value={paymentForm.compensationAmount}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      compensationAmount: Number(e.target.value),
                    }))
                  }
                  disabled={paymentForm.donorCategory === "registry"}
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  Payment Method
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, paymentMethod: e.target.value as any }))
                  }
                  className="w-full h-8 text-xs p-1.5 bg-background border rounded-lg font-medium"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash Voucher</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  Payment Terms
                </label>
                <Input
                  value={paymentForm.paymentTerms}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                  className="h-8 text-xs font-medium"
                />
              </div>
            </div>

            {/* 3. Donor Paid Status Toggle */}
            <div className="space-y-2 pt-1 border-t">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Donor Payout Status (Paid or Not Paid): <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Toggle whether payout has been disbursed to donor.
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentForm((prev) => ({ ...prev, status: "PAID" }))}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                    paymentForm.status === "PAID"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/30"
                      : "bg-background text-slate-700 hover:bg-slate-50 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ DONOR PAID
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentForm((prev) => ({ ...prev, status: "PENDING" }))}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${
                    paymentForm.status === "PENDING"
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/30"
                      : "bg-background text-slate-700 hover:bg-slate-50 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  ⏳ NOT PAID (PENDING)
                </button>
              </div>

              {paymentForm.status === "PAID" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-600" /> Paid Date
                    </label>
                    <Input
                      type="date"
                      value={paymentForm.paidDate}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paidDate: e.target.value }))}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">
                      Paid By (Officer / Staff)
                    </label>
                    <Input
                      value={paymentForm.paidBy}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paidBy: e.target.value }))}
                      placeholder="e.g. Accounts / Manager"
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">
                      UTR / Transaction Ref No.
                    </label>
                    <Input
                      value={paymentForm.paymentReference}
                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentReference: e.target.value }))}
                      placeholder="e.g. UTR-98321048123"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Donor Bank Details Box */}
            {paymentReg?.bankDetails && (
              <div className="p-3 bg-muted/40 rounded-xl border text-xs space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                  Donor Bank Account on File:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[9px] text-muted-foreground block">Holder:</span>
                    <span className="font-semibold text-foreground truncate block">
                      {paymentReg.bankDetails.accountHolderName || paymentReg.personalInfo?.fullName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block">Bank:</span>
                    <span className="font-semibold text-foreground truncate block">
                      {paymentReg.bankDetails.bankName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block">A/C Number:</span>
                    <span className="font-mono font-bold text-foreground truncate block">
                      {paymentReg.bankDetails.accountNumber || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block">IFSC / UPI:</span>
                    <span className="font-mono font-semibold text-foreground truncate block">
                      {paymentReg.bankDetails.ifscCode || paymentReg.bankDetails.upiId || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl text-xs h-9"
                disabled={savingPayment}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePayment}
                disabled={savingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 font-bold shadow-xs cursor-pointer"
              >
                {savingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                Save Compensation &amp; Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1.85: FORM 13 STATUTORY DOCUMENT MODAL */}
      <Dialog open={isForm13ModalOpen} onOpenChange={setIsForm13ModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <FileCheck2 className="w-5 h-5 text-teal-600" />
              Statutory Form 13 Management
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Donor: <span className="font-semibold text-slate-700 dark:text-slate-300">{form13Reg?.personalInfo?.fullName}</span>
              {" "}({form13Reg?.registrationId})
              {form13Reg?.donorId ? ` • Donor ID: ${form13Reg.donorId}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {form13Reg && getForm13Info(form13Reg).isUploaded ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Form 13 Uploaded &amp; Clear
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        Valid statutory consent &amp; medical fitness certificate attached.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handlePrintForm13(form13Reg)}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-8 px-3 gap-1 shadow-xs"
                      title="Print Form 13 PDF directly in website"
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
                  Form 13 is statutory and mandatory under ART Bank Regulations. Without uploading the signed Form 13 PDF, this sperm donor file cannot be marked complete. Please choose and upload the signed PDF below.
                </p>
              </div>
            )}

            {/* Upload / Replace Area */}
            <div className="space-y-2 border-t pt-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {form13Reg && getForm13Info(form13Reg).isUploaded ? "Replace Form 13 PDF:" : "Upload Form 13 PDF:"}
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
                      <span>{form13Reg && getForm13Info(form13Reg).isUploaded ? "Choose Replacement PDF" : "Choose Form 13 PDF"}</span>
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

      {/* DIALOG 1.86: FORM 14 STATUTORY DOCUMENT MODAL */}
      <Dialog open={isForm14ModalOpen} onOpenChange={setIsForm14ModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              Statutory Form 14 Certificate &amp; Screening Management
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Donor: <span className="font-semibold text-slate-700 dark:text-slate-300">{form14Reg?.personalInfo?.fullName}</span>
              {" "}({form14Reg?.registrationId})
              {form14Reg?.donorId ? ` • Donor ID: ${form14Reg.donorId}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {form14Reg && getForm14Info(form14Reg).isUploaded ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Form 14 Uploaded &amp; Clear
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        Valid statutory screening certificate attached.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handlePrintForm14(form14Reg)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-8 px-3 gap-1 shadow-xs"
                      title="Print Form 14 PDF directly in website"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Form 14 PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openInAppViewer("Form 14 Statutory Certificate PDF", getForm14Info(form14Reg).url!, getForm14Info(form14Reg).name, form14Reg)}
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
                  Form 14 is the statutory Certificate &amp; Screening document under ART Regulations. Upload the completed and signed Form 14 PDF below.
                </p>
              </div>
            )}

            {/* Upload / Replace Area */}
            <div className="space-y-2 border-t pt-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {form14Reg && getForm14Info(form14Reg).isUploaded ? "Replace Form 14 PDF:" : "Upload Form 14 PDF:"}
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
                      <span>{form14Reg && getForm14Info(form14Reg).isUploaded ? "Choose Replacement PDF" : "Choose Form 14 PDF"}</span>
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

      {/* DIALOG 2: VIEW REGISTRATION DETAILS (Sperm Donor Management Hub) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl rounded-3xl overflow-y-auto max-h-[88vh] border shadow-2xl p-6 sm:p-8">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 border border-teal-100">
                <BookmarkCheck className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Sperm Donor Clinical Management File
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Manage semen analysis report, viral screening tests, Rule 13 insurance, donor compensation payouts, and statutory Form 13 clearance.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedReg && (() => {
            const autoInfo = computeSpermDonorManagementStatus(selectedReg);
            const form13Info = getForm13Info(selectedReg);
            const form14Info = getForm14Info(selectedReg);
            const dealInfo = getDonorDealInfo(selectedReg);
            const isRegistry = selectedReg.hospitalDealType === "registry" || selectedReg.clinicDeal?.donorCategory === "registry" || dealInfo.category === "registry";

            return (
              <div className="space-y-5 py-2">
                {/* ─── Profile Header ────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-2xl border justify-between">
                  <div className="flex items-center gap-3.5">
                    {selectedReg.documents?.passportPhoto?.url ? (
                      <img
                        alt="Donor Photo"
                        src={selectedReg.documents.passportPhoto.url}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
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
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-bold border border-teal-200">
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ID: <span className="font-mono font-bold text-foreground">{selectedReg.registrationId}</span>
                        {selectedReg.donorId && (
                          <> • Donor ID: <span className="font-mono font-bold text-teal-600">{selectedReg.donorId}</span></>
                        )}
                        {" "}• Hospital: <span className="font-semibold text-foreground">{selectedReg.assignedHospital?.name || "Unassigned"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPrintOpen(true)}
                      className="rounded-xl text-xs gap-1.5 h-8 border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Dossier
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleOpenEdit(selectedReg);
                      }}
                      className="rounded-xl text-xs gap-1.5 h-8 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </Button>
                  </div>
                </div>

                {/* ─── Detail Tabs Navigation ─────────────────────────────────── */}
                <div className="flex border-b text-xs font-semibold overflow-x-auto gap-1">
                  <button
                    onClick={() => setDetailTab("management")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "management"
                        ? "border-teal-600 text-teal-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" /> Clinical Management Hub
                  </button>
                  <button
                    onClick={() => setDetailTab("info")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "info"
                        ? "border-teal-600 text-teal-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Donor Profile
                  </button>
                  <button
                    onClick={() => setDetailTab("medical")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "medical"
                        ? "border-teal-600 text-teal-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Medical Details
                  </button>
                  <button
                    onClick={() => setDetailTab("history")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "history"
                        ? "border-teal-600 text-teal-600 font-bold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Hospital History
                  </button>
                  <button
                    onClick={() => setDetailTab("audits")}
                    className={`pb-2.5 px-3.5 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      detailTab === "audits"
                        ? "border-teal-600 text-teal-600 font-bold"
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
                            Status automatically transitions based on semen report, viral tests, compensation payout, sample collection date, and Form 13.
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
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> 1. Registration &amp; KYC
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
                              2. Hospital &amp; Schedule Dates
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground pl-5 mt-0.5">
                            {autoInfo.isEligibleForWaitingForm13
                              ? "Hospital assigned & collection date set ✓"
                              : "Assign hospital, supply & sample pickup date"}
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
                            {autoInfo.hasForm13
                              ? "Form 13 uploaded & file completed ✓"
                              : "Form 13 statutory PDF required to finalize"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Verified Semen Profile & Cryo Coordinates Summary */}
                    <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <FlaskConical className="w-4 h-4 text-teal-600" />
                            Verified Sperm Profile Analytics &amp; Cryo Storage Coordinates
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Laboratory semen parameters and cryo coordinates recorded and verified during donor registration.
                          </p>
                        </div>

                        {selectedReg.certificateIssued && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <Award className="w-3 h-3 text-purple-600" /> Rule 10 Issued
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Motility Range</span>
                          <div className="font-bold text-foreground text-sm">
                            {selectedReg.semenAnalysisDetails?.motility || selectedReg.donorInfo?.semenAnalysis || "—"}
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Each Vial Contains</span>
                          <div className="font-bold text-teal-700 dark:text-teal-400 text-sm">
                            {selectedReg.semenAnalysisDetails?.eachVialContains || "—"}
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Vials Cryopreserved</span>
                          <div className="font-bold text-foreground text-sm">
                            {selectedReg.semenAnalysisDetails?.totalVials ? `${selectedReg.semenAnalysisDetails.totalVials} Vials` : "—"}
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Sample Volume</span>
                          <div className="font-bold text-foreground text-sm">
                            {selectedReg.semenAnalysisDetails?.volume || "—"}
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Container / Tank No.</span>
                          <div className="font-mono font-bold text-foreground text-sm">
                            {selectedReg.storageDetails?.containerNo || "—"}
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Canister &amp; Goblet</span>
                          <div className="font-mono font-bold text-foreground text-sm">
                            {selectedReg.storageDetails?.canisterNo || "—"} {selectedReg.storageDetails?.gobletNo && `• ${selectedReg.storageDetails.gobletNo}`}
                          </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1 sm:col-span-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Storage Facility Location</span>
                          <div className="font-medium text-foreground text-xs truncate">
                            {selectedReg.storageDetails?.storageLocation || "ART Lab Cryo Bank"}
                          </div>
                        </div>
                      </div>

                      {/* Quick access to uploaded registration lab reports */}
                      {(selectedReg.labReports?.viralMarkersReport?.url || selectedReg.labReports?.bloodReport?.url) && (
                        <div className="pt-2 border-t flex items-center gap-3 text-xs">
                          <span className="text-[10px] text-muted-foreground font-semibold">Registration Reports:</span>
                          {selectedReg.labReports?.viralMarkersReport?.url && (
                            <button
                              type="button"
                              onClick={() => openInAppViewer("Viral Markers Screening", selectedReg.labReports.viralMarkersReport.url, "viral-markers.pdf", selectedReg)}
                              className="text-teal-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Eye className="w-3 h-3" /> Viral Markers PDF
                            </button>
                          )}
                          {selectedReg.labReports?.bloodReport?.url && (
                            <button
                              type="button"
                              onClick={() => openInAppViewer("Blood Profile & CBC", selectedReg.labReports.bloodReport.url, "blood-report.pdf", selectedReg)}
                              className="text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Eye className="w-3 h-3" /> Blood Test PDF
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3. Partner ART Clinic / Hospital Assignment */}
                    <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Affiliate Partner Clinic / Hospital Assignment
                          </h4>
                        </div>
                      </div>

                      {selectedReg.assignedHospital ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-background border space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Assigned Hospital</span>
                            <div className="font-bold text-foreground text-sm">
                              {selectedReg.assignedHospital.name}
                            </div>
                            {selectedReg.assignedBranch && (
                              <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                                <GitBranch className="w-3 h-3 text-teal-600" />
                                <span>{selectedReg.assignedBranch}</span>
                              </div>
                            )}
                            {selectedReg.assignedDoctor && (
                              <div className="text-[11px] font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                <Stethoscope className="w-3 h-3 text-purple-600" />
                                <span>Dr. {selectedReg.assignedDoctor.replace(/^Dr\.?\s*/i, "")}</span>
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground">
                              {selectedReg.assignedHospital.city}, {selectedReg.assignedHospital.state}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-background border space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Contact &amp; Code</span>
                            <div className="font-mono font-semibold text-foreground text-xs">
                              {selectedReg.assignedHospital.hospitalCode || selectedReg.assignedHospital.phone || "—"}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {selectedReg.assignedHospital.email || selectedReg.assignedHospital.address || "Accredited Partner"}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 text-teal-800 dark:text-teal-300 space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-teal-700 dark:text-teal-400">Mapping Status</span>
                            <div className="font-bold flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Active Clinic Assignment
                            </div>
                            {selectedReg.assignedAt && (
                              <div className="text-[10px] text-muted-foreground">
                                Assigned: {new Date(selectedReg.assignedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed bg-muted/30 border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs">
                          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-muted-foreground font-medium">
                            No Partner Clinic assigned to this donor (hospital is assigned during registration).
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 4. Donor Deal & Compensation Payout */}
                    <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Donor Compensation Deal &amp; Payout
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {isRegistry ? (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                              Registry Allocation
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

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPaymentModal(selectedReg)}
                            className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" /> {dealInfo.isPaid ? "Edit Payment & Deal" : "Assign / Record Payment"}
                          </Button>
                        </div>
                      </div>

                      {isRegistry ? (
                        <div className="p-3 bg-teal-50/60 dark:bg-teal-950/20 rounded-xl border border-teal-200 text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between gap-3">
                          <div>
                            This donor is currently marked under <strong>Registry Allocation</strong> (₹0 compensation).
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPaymentModal(selectedReg)}
                            className="h-7 text-xs text-teal-700 border-teal-300 hover:bg-teal-100 rounded-lg shrink-0 cursor-pointer"
                          >
                            Configure Deal
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-background border space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Compensation Deal</span>
                            <div className="font-bold text-emerald-600 font-mono text-base">
                              ₹{dealInfo.amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground capitalize">
                              {dealInfo.category} Tier • {dealInfo.terms || "On Sample Collection"}
                            </div>
                            {selectedReg.donorDeal?.paymentMethod && (
                              <div className="text-[10px] text-muted-foreground">
                                Method: <span className="font-semibold text-foreground uppercase">{selectedReg.donorDeal.paymentMethod.replace(/_/g, " ")}</span>
                              </div>
                            )}
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
                                {dealInfo.paidBy && <div>By: <span className="font-semibold text-foreground">{dealInfo.paidBy}</span></div>}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Donor Bank Account preview if present */}
                      {selectedReg.bankDetails && (
                        <div className="p-2.5 bg-muted/30 rounded-xl border text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div><span className="text-[9px] text-muted-foreground block">A/C Holder:</span> <span className="font-semibold text-foreground truncate block">{selectedReg.bankDetails.accountHolderName || selectedReg.personalInfo?.fullName || "—"}</span></div>
                          <div><span className="text-[9px] text-muted-foreground block">Bank:</span> <span className="font-semibold text-foreground truncate block">{selectedReg.bankDetails.bankName || "—"}</span></div>
                          <div><span className="text-[9px] text-muted-foreground block">Account No:</span> <span className="font-mono font-bold text-foreground truncate block">{selectedReg.bankDetails.accountNumber || "—"}</span></div>
                          <div><span className="text-[9px] text-muted-foreground block">IFSC / UPI:</span> <span className="font-mono font-semibold text-foreground truncate block">{selectedReg.bankDetails.ifscCode || selectedReg.bankDetails.upiId || "—"}</span></div>
                        </div>
                      )}
                    </div>

                    {/* 4. Schedule Dates & Sample Collection */}
                    <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Clinical Schedule &amp; Sample Collection Date
                          </h4>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPickupModal(selectedReg)}
                          className="h-7 text-xs text-teal-700 border-teal-200 hover:bg-teal-50 rounded-lg gap-1"
                        >
                          <Calendar className="w-3 h-3" /> {selectedReg.pickupDate ? "Change Collection Date" : "Set Collection Date"}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-background border space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Recruitment Date</span>
                          <div className="font-bold text-foreground">
                            {formatDisplayDate(selectedReg.recruitmentDate) || "—"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-background border space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Supply Date</span>
                          <div className="font-bold text-foreground">
                            {formatDisplayDate(selectedReg.supplyDate) || "—"}
                          </div>
                        </div>

                        <div className={`p-3 rounded-xl border space-y-1 ${
                          selectedReg.pickupDate
                            ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200"
                            : "bg-background border-dashed"
                        }`}>
                          <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase">
                            Sample Collection Date
                          </span>
                          <div className="font-bold text-teal-700 dark:text-teal-400 text-sm">
                            {formatDisplayDate(selectedReg.pickupDate) || "Not scheduled yet"}
                          </div>
                        </div>
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
                            Form 13 is the mandatory Consent &amp; Fitness Certificate issued by the registered ART Bank.
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
                              Upload the signed Form 13 PDF to complete this sperm donor clinical file and move to Completed Files.
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
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenForm13Modal(selectedReg)}
                              className="h-8 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Form 13 PDF
                            </Button>
                          )}
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
                              Upload the signed Form 14 screening certificate to accompany this donor file.
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
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenForm14Modal(selectedReg)}
                              className="h-8 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Form 14 PDF
                            </Button>
                          )}
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
                      <div><span className="text-muted-foreground block text-[10px]">Father / Spouse Name:</span> <span className="font-bold text-foreground">{selectedReg.personalInfo?.fatherName || selectedReg.personalInfo?.spouseName || "—"}</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">Blood Group:</span> <span className="font-bold text-teal-600">{selectedReg.personalInfo?.bloodGroup || "—"}</span></div>
                      <div><span className="text-muted-foreground block text-[10px]">Age / Gender:</span> <span className="font-semibold">{selectedReg.personalInfo?.age} Yrs / Male</span></div>
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
                        <div><span className="text-muted-foreground">Emergency Contact:</span> {selectedReg.emergencyContact?.contactPersonName} ({selectedReg.emergencyContact?.relationship || "Relative"})</div>
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
                        <div className="font-bold text-muted-foreground">Semen Parameters:</div>
                        <div className="font-semibold text-foreground">
                          {selectedReg.labReports?.semenAnalysisReport?.parameters
                            ? JSON.stringify(selectedReg.labReports.semenAnalysisReport.parameters)
                            : "Standard parameters attached in report PDF"}
                        </div>
                      </div>
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
                          const oldH = hospitals.find((h) => h._id === item.oldHospital)?.name || "Unassigned";
                          const newH = hospitals.find((h) => h._id === item.newHospital)?.name || "Unassigned";
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
                                Assigned by: <span className="font-semibold">{item.assignedBy}</span> | Reason: <span className="italic">&quot;{item.reason || "—"}&quot;</span>
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
              <Building2 className="w-5 h-5 text-teal-600" /> Bulk Clinic &amp; Branch Mapping
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign <strong className="text-teal-700 dark:text-teal-300 font-bold">{selectedIds.length}</strong> selected applications to a single clinic and designated branch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Step-by-Step Dropdown Mapping for Bulk Assignment */}
            <div className="space-y-4 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Choose Destination Clinic &amp; Branch</span>
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
                              Location: {currentBranchObj.pickupLocation}
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
            <DialogTitle className="text-base font-bold">Edit Sperm Donor Registration Profile</DialogTitle>
            <DialogDescription className="text-xs">Adjust registry particulars manually below.</DialogDescription>
          </DialogHeader>

          {/* Tab selectors */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold mb-4 mt-2">
            <button
              type="button"
              onClick={() => setEditTab("details")}
              className={`pb-2 px-4 border-b-2 transition-all ${editTab === "details" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              General Details
            </button>
            <button
              type="button"
              onClick={() => setEditTab("documents")}
              className={`pb-2 px-4 border-b-2 transition-all ${editTab === "documents" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              KYC Documents
            </button>
            <button
              type="button"
              onClick={() => setEditTab("labReports")}
              className={`pb-2 px-4 border-b-2 transition-all ${editTab === "labReports" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
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
                          [key]: file || null,
                        },
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
                {/* Semen Analysis Report */}
                <FileUploadField
                  label="Semen Analysis Report (PDF only — Mandatory)"
                  value={editForm.labReports?.semenAnalysisReport || editForm.semenAnalysisReport || null}
                  accept=".pdf"
                  onChange={(file) => {
                    setEditForm((prev: any) => ({
                      ...prev,
                      labReports: {
                        ...prev.labReports,
                        semenAnalysisReport: file || null,
                      },
                    }));
                  }}
                  folder="documents"
                />

                {/* Viral Markers */}
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
                            viralMarkers: [...current, file],
                          },
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
                                  viralMarkers: updated,
                                },
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
                        bloodReport: file || null,
                      },
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
                  label="Health Insurance Policy"
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
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl text-xs h-9">Cancel</Button>
              <Button type="submit" disabled={actionLoading} className="rounded-xl text-xs h-9 bg-teal-600 text-white font-bold">Save Changes</Button>
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
        itemLabel="sperm donors"
      >
        <Button
          size="sm"
          onClick={() => {
            setBulkSelectedHospitalId(null);
            setBulkSelectedBranch(null);
            setIsBulkAssignOpen(true);
          }}
          disabled={actionLoading}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5 h-8 font-medium shadow-xs cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5" /> Assign Clinic
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setBulkDoctorName("");
            setBulkCustomDoctorInput("");
            const selectedRegs = registrations.filter((r) => selectedIds.includes(r.registrationId));
            const firstHospId = selectedRegs[0]?.assignedHospital?._id || selectedRegs[0]?.assignedHospitalId;
            const allSameHosp =
              selectedRegs.length > 0 &&
              selectedRegs.every((r) => (r.assignedHospital?._id || r.assignedHospitalId) === firstHospId);
            if (allSameHosp && firstHospId) {
              setBulkDoctorHospitalId(firstHospId);
              const firstBranchId = selectedRegs[0]?.assignedBranchId || selectedRegs[0]?.assignedBranch;
              const allSameBranch = selectedRegs.every((r) => (r.assignedBranchId || r.assignedBranch) === firstBranchId);
              setBulkDoctorBranchId(allSameBranch && firstBranchId ? firstBranchId : "");
            } else {
              setBulkDoctorHospitalId("");
              setBulkDoctorBranchId("");
            }
            setIsBulkAssignDoctorOpen(true);
          }}
          disabled={actionLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs gap-1.5 h-8 font-medium shadow-xs cursor-pointer"
        >
          <Stethoscope className="w-3.5 h-3.5" /> Assign Doctor
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
          onClick={handleBulkExportCSV}
          disabled={actionLoading}
          className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs gap-1.5 h-8 font-medium cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
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
