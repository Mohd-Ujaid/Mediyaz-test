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
  { id: "terms", label: "Terms & Conditions" },
  { id: "notes", label: "Additional Clinical Notes" },
];

const DOCUMENTS_CONFIG = [
  { key: "passportPhoto", label: "Photo", accept: ".png,.jpg,.jpeg,.webp", folder: "profile-images" },
  { key: "aadhaarFront", label: "Aadhaar Card (Front)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "aadhaarBack", label: "Aadhaar Card (Back)", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "signature", label: "Signature", accept: ".png,.jpg,.jpeg,.webp", folder: "documents" },
  { key: "form13", label: "Form 13 (Consent & Fitness PDF)", accept: ".pdf", folder: "form13" },
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
  const [statusFilter, setStatusFilter] = useState("APPROVED");
  const [donorTypeFilter, setDonorTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
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
  const [itemsPerPage] = useState(10);

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

  // Edit Clinical & Schedule Dates Modal (Pickup, Recruitment, Supply)
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
      const autoStatus = computeEggDonorManagementStatus(updatedSim).status;

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
        entityType: "DonorRegistration",
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
    if (!confirm("Are you sure you want to remove Form 13? The registration will be marked incomplete.")) return;

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

  // Fetch Approved Registrations (Egg Donors Only)
  async function loadRegistrations() {
    setLoading(true);
    try {
      const data = (await getAdminRegistrationsAction({
        page: currentPage,
        limit: 10,
        search,
        donorType: "egg",
        status: statusFilter || undefined,
        hospital: hospitalFilter || undefined,
      })) as any;
      if (data.success && data.registrations) {
        // Strictly exclude any sperm donor records and auto-sync status for egg donors in management
        const eggOnly = (data.registrations || [])
          .filter(
            (r: any) => r.donorType !== "sperm" && !r.registrationId?.startsWith("MED-SD") && !r.registrationId?.startsWith("SPM")
          )
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
        if (data.pagination) setTotalPages(data.pagination.pages);
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
  }, [search, hospitalFilter, statusFilter, donorTypeFilter, currentPage]);

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
        const mappedHosp = hospitals.find((h) => h._id === hospitalId) || null;
        setRegistrations((prev) =>
          prev.map((r) =>
            r.registrationId === selectedReg.registrationId
              ? { ...r, assignedHospital: mappedHosp }
              : r
          )
        );
        if (selectedReg) {
          setSelectedReg((prev: any) => prev ? { ...prev, assignedHospital: mappedHosp } : null);
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Egg Donor Management
          </h1>
          <p className="text-xs text-slate-500">
            Manage approved egg donors, upload required lab reports and insurances, track donor compensation, set pickup dates, and collect Form 13.
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
        {/* Segmented Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-900">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="All egg donor management records"
            >
              <span>All</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "all"
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {statusCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("APPROVED")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "APPROVED"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Approved donors: awaiting lab reports, medical insurance, or retrieval schedule"
            >
              <span>Approved</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {statusCounts.approved}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("WAITING_FORM13")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "WAITING_FORM13"
                  ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Clinical tests & schedule complete: awaiting signed statutory Form 13"
            >
              <span>Waiting Form 13</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "WAITING_FORM13"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {statusCounts.waitingForm13}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("FILE_COMPLETED")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "FILE_COMPLETED"
                  ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Clinical file complete with Form 13 uploaded and verified"
            >
              <span>File Completed</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "FILE_COMPLETED"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {statusCounts.fileCompleted}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("COMPLETED")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "COMPLETED"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Donation cycle finalized and retrieval completed"
            >
              <span>Completed</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {statusCounts.completed || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("CANCELLED")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "CANCELLED"
                  ? "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
              }`}
              title="Cancelled registrations and aborted files"
            >
              <span>Cancelled</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === "CANCELLED"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {statusCounts.cancelled || 0}
              </span>
            </button>

            

            

          

            {(statusCounts.other || 0) > 0 && (
              <button
                type="button"
                onClick={() => handleTabChange("other")}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "other"
                    ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-xs border border-slate-200/90 dark:border-slate-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800 border border-transparent"
                }`}
                title="Other statuses"
              >
                <span>Other Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    activeTab === "other"
                      ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-slate-200/70 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {statusCounts.other}
                </span>
              </button>
            )}
          </div>

          
        </div>

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
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1 border-t border-slate-100 dark:border-slate-900">
          <div className="flex flex-wrap items-center gap-4">
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

          {(search || hospitalFilter || statusFilter !== "APPROVED" || dateFilter || activeTab !== "APPROVED") && (
            <button
              onClick={() => {
                setSearch("");
                setHospitalFilter("");
                setDateFilter("");
                handleTabChange("APPROVED");
              }}
              className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              Reset All Filters
            </button>
          )}
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

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            Loading records...
          </div>
        ) : paginatedRegs.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No approved donor records found.</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1280px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 w-10 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedRegs.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  </th>
                  <th className="p-3.5 whitespace-nowrap">Donor ID</th>
                  <th className="p-3.5 whitespace-nowrap">Donor Name</th>
                  <th className="p-3.5 whitespace-nowrap">Assigned Hospital</th>
                  <th className="p-3.5 whitespace-nowrap">Approved By</th>
                  <th className="p-3.5 whitespace-nowrap">Donor Deal</th>
                  <th className="p-3.5 whitespace-nowrap">Payout Status</th>
                  <th className="p-3.5 whitespace-nowrap">Form 13 Status</th>
                  <th className="p-3.5 whitespace-nowrap">Schedule Dates</th>
                  <th className="p-3.5 whitespace-nowrap">Status</th>
                  <th className="p-3.5 text-right whitespace-nowrap sticky right-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {paginatedRegs.map((reg) => {
                  const dealInfo = getDonorDealInfo(reg);
                  return (
                    <tr key={reg._id} className={`group/row hover:bg-slate-50/50 dark:hover:bg-slate-900/50 ${selectedIds.includes(reg.registrationId) ? "bg-teal-50/20" : ""}`}>
                      <td className="p-3.5 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(reg.registrationId)}
                          onChange={(e) => handleSelectRow(e.target.checked, reg.registrationId)}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
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
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {reg.personalInfo?.fullName || "—"}
                        </div>
                        <div className="text-[11px] text-slate-500 whitespace-nowrap">
                          {reg.personalInfo?.age ? `${reg.personalInfo.age} Yrs` : ""} {reg.personalInfo?.gender ? `• ${reg.personalInfo.gender}` : ""} {reg.personalInfo?.bloodGroup ? `• ${reg.personalInfo.bloodGroup}` : ""}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {reg.assignedHospital ? (
                          <div className="font-semibold text-teal-800 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300 px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1.5 border border-teal-200 dark:border-teal-800 whitespace-nowrap">
                            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate max-w-[160px]" title={reg.assignedHospital.name}>
                              {reg.assignedHospital.name}
                            </span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReg(reg);
                              setTempSelectedHospitalId(null);
                              setIsAssignOpen(true);
                            }}
                            className="h-6 text-[10px] text-teal-600 border-teal-200 hover:bg-teal-50 rounded-lg py-0.5 px-2 font-medium whitespace-nowrap"
                          >
                            + Assign Hospital
                          </Button>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {reg.reviewedBy ? reg.reviewedBy.split("@")[0] : (reg.status === "APPROVED" ? "Admin" : "—")}
                        </div>
                        <div className="text-[10px] text-slate-400 whitespace-nowrap">
                          {reg.reviewedAt ? new Date(reg.reviewedAt).toLocaleDateString() : (reg.updatedAt ? new Date(reg.updatedAt).toLocaleDateString() : "—")}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded text-[11px] inline-block font-mono border border-emerald-200 dark:border-emerald-800">
                            ₹{dealInfo.amount.toLocaleString()}
                          </span>
                          <div className="text-[10px] text-slate-500 capitalize whitespace-nowrap">
                            {dealInfo.category} Deal • {dealInfo.terms}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
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
                      <td className="p-3.5 whitespace-nowrap">
                        {(() => {
                          const form13 = getForm13Info(reg);
                          return form13.isUploaded ? (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => openInAppViewer(`Form 13 Statutory PDF - ${reg.personalInfo?.fullName || reg.registrationId}`, form13.url, form13.name, reg)}
                                className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 px-2.5 py-1 rounded-full text-[10px] border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors shadow-xs whitespace-nowrap"
                                title="Click to view Form 13 directly inside website"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> UPLOADED
                              </button>
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintForm13(reg);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 hover:underline cursor-pointer bg-teal-50/80 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 transition-colors whitespace-nowrap"
                                  title="View & Print Form 13 PDF directly in website"
                                >
                                  <Printer className="w-2.5 h-2.5 text-teal-600" /> Ready to Print
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenForm13Modal(reg);
                                  }}
                                  className="text-[9px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                                  title="Replace or remove Form 13"
                                >
                                  Manage
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <button
                                type="button"
                                onClick={() => handleOpenForm13Modal(reg)}
                                className="inline-flex items-center gap-1 font-bold text-rose-800 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 px-2.5 py-1 rounded-full text-[10px] border border-rose-200 dark:border-rose-800 cursor-pointer transition-colors shadow-xs whitespace-nowrap"
                                title="Form 13 Not Uploaded - Click to upload Form 13 PDF (Required for completion)"
                              >
                                <AlertCircle className="w-3 h-3 text-rose-600" /> NOT UPLOADED
                              </button>
                              <div className="text-[9px] text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">
                                Incomplete • Click to Upload
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="space-y-1 text-[11px]">
                          {/* Pickup Date */}
                          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                            <span className="text-slate-400 font-medium text-[10px]">Pickup:</span>
                            <div className="inline-flex items-center gap-1 font-semibold">
                              {formatDisplayDate(reg.pickupDate) ? (
                                <span className="text-rose-600 dark:text-rose-400 font-mono text-[10px]">
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
                      <td className="p-3.5 whitespace-nowrap">
                        {(() => {
                          const auto = computeEggDonorManagementStatus(reg);
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase inline-flex items-center gap-1.5 shadow-xs whitespace-nowrap ${
                                    auto.status === "FILE_COMPLETED" || auto.status === "COMPLETED"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                      : auto.status === "WAITING_FORM13"
                                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                      : auto.status === "APPROVED"
                                      ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                      : auto.status === "CANCELLED" || reg.status === "CANCELLED"
                                      ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                      : auto.status === "SUSPENDED"
                                      ? "bg-amber-100 text-amber-700 border-amber-200"
                                      : auto.status === "REJECTED"
                                      ? "bg-rose-100 text-rose-700 border-rose-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {auto.status === "APPROVED" ? "In Management" : (auto.status || reg.status || "").replace(/_/g, " ")}
                                </span>
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
                      <td className={`p-3.5 text-right whitespace-nowrap sticky right-0 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] ${selectedIds.includes(reg.registrationId) ? "bg-[#f5fbfb] dark:bg-slate-900" : "bg-white group-hover/row:bg-slate-50 dark:bg-slate-950 dark:group-hover/row:bg-slate-900"}`}>
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to cancel the registration for ${reg.personalInfo?.fullName || reg.registrationId}?`)) {
                                      handleSingleStatusChange(reg.registrationId, "CANCELLED");
                                    }
                                  }}
                                  className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                                >
                                  <XCircle className="w-4 h-4 text-rose-600" /> Cancel Registration
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm(`Re-activate / approve registration for ${reg.personalInfo?.fullName || reg.registrationId}?`)) {
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

      {/* DIALOG 1.5: SET CLINICAL & SCHEDULE DATES */}
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
            {/* Scheduled Pickup Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Scheduled Oocyte Pickup Date:
              </label>
              <Input
                type="date"
                value={pickupDateValue}
                onChange={(e) => setPickupDateValue(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
              />
              <p className="text-[10px] text-slate-400">
                Clinical retrieval date synchronized across donor and hospital registries.
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
                Scheduled or completed hospital delivery / supply date.
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ID: <span className="font-mono font-bold text-foreground">{selectedReg.registrationId}</span>
                        {selectedReg.donorId && (
                          <> • Donor ID: <span className="font-mono font-bold text-rose-600">{selectedReg.donorId}</span></>
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
                          if (confirm(`Are you sure you want to cancel the registration for ${selectedReg.personalInfo?.fullName || selectedReg.registrationId}?`)) {
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
                          if (confirm(`Re-activate / approve registration for ${selectedReg.personalInfo?.fullName || selectedReg.registrationId}?`)) {
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
                      })()}

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

                    {/* 4. Schedule Dates & Oocyte Pickup */}
                    <div className="p-4 rounded-2xl border bg-card space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Clinical Schedule &amp; Oocyte Retrieval Date
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
                            ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200"
                            : "bg-background border-dashed"
                        }`}>
                          <span className="text-[10px] text-rose-600 font-bold uppercase">
                            Oocyte Pickup Date
                          </span>
                          <div className="font-bold text-rose-600 text-sm">
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
    </div>
  );
}
