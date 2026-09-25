"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  FileCheck,
  Building2,
  Calendar,
  Search,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Printer,
  X,
  FileText,
  FileWarning,
  Lock,
  Check,
  MoreHorizontal,
  Dna,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InAppDocumentViewer } from "@/components/ui/in-app-document-viewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DocItem {
  key: string;
  name: string;
  category: "identity" | "legal" | "medical" | "dossier";
  isUploaded: boolean;
  url?: string;
  fileName?: string;
  isSystemPdf?: boolean;
}

const EGG_SECTIONS = [
  { key: "registration", label: "Registration Form", desc: "Demographics, contact & personal information" },
  { key: "contract", label: "Contract Agreement", desc: "Legal agreement with ART Clinic & Bank" },
  { key: "certificate", label: "Certificate (Rule 10)", desc: "Statutory ART Regulation certificate" },
  { key: "consent", label: "Consent Form", desc: "Voluntary donor informed consent" },
  { key: "profile", label: "Egg Profile & Lab Summary", desc: "Clinical profiling and routine blood report" },
  { key: "affidavit", label: "ART Donor Affidavit", desc: "Form 13 statutory sworn declaration" },
];

const SPERM_SECTIONS = [
  { key: "registration", label: "Registration Form", desc: "Demographics, contact & donor identification" },
  { key: "medical", label: "Medical History", desc: "General health, genetic & lifestyle record" },
  { key: "physical", label: "Physical Examination", desc: "Clinical observations & biometrics" },
  { key: "investigation", label: "Lab Investigations", desc: "Viral screening, blood typing, semen analysis" },
  { key: "consent", label: "Consent & Declaration", desc: "Statutory gamete donation declaration" },
  { key: "affidavit", label: "Sperm Donor Affidavit", desc: "Sworn legal compliance document" },
];

const COMMON_ANNEXURES = [
  { id: "terms", label: "Terms & Conditions", desc: "Detailed statutory rules & ART guidelines" },
  { id: "notes", label: "Additional Clinical Notes", desc: "Supplementary physician notes and remarks" },
];

export interface CompletedFilesDirectoryProps {
  initialDonorType?: "egg" | "sperm" | "all";
  pageTitle?: string;
  badgeLabel?: string;
  description?: string;
}

export function CompletedFilesDirectory({
  initialDonorType = "egg",
  pageTitle,
  badgeLabel,
  description,
}: CompletedFilesDirectoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCompletedFiles: 0,
    totalHospitalDeals: 0,
    totalHospitalReceived: 0,
    totalHospitalPending: 0,
    hospitalPaidCount: 0,
    hospitalPendingCount: 0,
    totalDonorDeals: 0,
    totalDonorPaid: 0,
    totalDonorPending: 0,
    donorPaidCount: 0,
    donorPendingCount: 0,
    scheduledPickupsCount: 0,
  });

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("all_completed");
  const [donorPaymentFilter, setDonorPaymentFilter] = useState("ALL");
  const [hospitalPaymentFilter, setHospitalPaymentFilter] = useState("ALL");
  const [donorTypeFilter, setDonorTypeFilter] = useState<string>(initialDonorType);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);

  // Print Configuration States
  const [printWithHeader, setPrintWithHeader] = useState(true);
  const [printSections, setPrintSections] = useState<string[]>([]);
  const [printAttachments, setPrintAttachments] = useState<string[]>([]);
  const [printExtraDocUrl, setPrintExtraDocUrl] = useState<string>("");

  // Hospital Payment Form State
  const [paymentForm, setPaymentForm] = useState<any>({
    registrationId: "",
    hospitalDealPrice: 0,
    hospitalPaymentStatus: "PENDING",
    isHospitalPaymentReceived: false,
    hospitalReceivedAmount: 0,
    hospitalReceivedAt: "",
    hospitalPaymentRef: "",
    hospitalNotes: "",
  });

  // Sync donorTypeFilter when prop changes
  useEffect(() => {
    setDonorTypeFilter(initialDonorType);
  }, [initialDonorType]);

  // Load Hospitals for filter dropdown
  useEffect(() => {
    async function fetchHospitals() {
      try {
        const res = await fetch("/api/hospitals?limit=200");
        const data = await res.json();
        if (data.success && data.hospitals) {
          setHospitals(data.hospitals);
        }
      } catch (err) {
        console.error("Failed to load hospitals:", err);
      }
    }
    fetchHospitals();
  }, []);

  // Fetch Completed Files
  async function loadCompletedFiles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
      if (statusFilter) params.append("status", statusFilter);
      if (donorPaymentFilter !== "ALL") params.append("donorPaymentStatus", donorPaymentFilter);
      if (hospitalPaymentFilter !== "ALL") params.append("hospitalPaymentStatus", hospitalPaymentFilter);
      if (donorTypeFilter) params.append("donorType", donorTypeFilter);
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());

      const res = await fetch(`/api/hospitals/completed-files?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setRegistrations(data.registrations || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error(data.error || "Failed to load completed files");
      }
    } catch (err: any) {
      console.error("Error loading completed files:", err);
      toast.error("Network error while loading completed files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompletedFiles();
  }, [
    currentPage,
    itemsPerPage,
    selectedHospitalId,
    statusFilter,
    donorPaymentFilter,
    hospitalPaymentFilter,
    donorTypeFilter,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCompletedFiles();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedHospitalId("ALL");
    setStatusFilter("all_completed");
    setDonorPaymentFilter("ALL");
    setHospitalPaymentFilter("ALL");
    setDonorTypeFilter(initialDonorType);
    setCurrentPage(1);
  };

  // Helper to extract and verify all registration documents
  const getRegistrationDocuments = (reg: any): DocItem[] => {
    const docs = reg?.documents || {};
    const labs = reg?.labReports || {};

    const isRefUploaded = (ref: any): { uploaded: boolean; url?: string; fileName?: string } => {
      if (!ref) return { uploaded: false };
      if (typeof ref === "string" && ref.trim().length > 0) {
        return { uploaded: true, url: ref, fileName: ref.split("/").pop() };
      }
      if (typeof ref === "object") {
        if (Array.isArray(ref)) {
          if (ref.length > 0 && (ref[0]?.url || ref[0]?.fileId)) {
            return { uploaded: true, url: ref[0].url, fileName: ref[0].fileName || ref[0].name };
          }
          return { uploaded: false };
        }
        if (ref.url || ref.fileId || ref.fileName || ref.name) {
          return { uploaded: true, url: ref.url, fileName: ref.fileName || ref.name };
        }
      }
      return { uploaded: false };
    };

    const check = (name: string, category: "identity" | "legal" | "medical", ref: any, altRef?: any): DocItem => {
      let res = isRefUploaded(ref);
      if (!res.uploaded && altRef) {
        res = isRefUploaded(altRef);
      }
      return {
        key: name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        name,
        category,
        isUploaded: res.uploaded,
        url: res.url,
        fileName: res.fileName,
      };
    };

    const printDossierUrl = reg?.registrationId
      ? `/admin/manage-registrations/${reg.registrationId}/print?withHeader=true&attachments=stamp,certificate`
      : "";

    const docList: DocItem[] = [
      {
        key: "official_dossier_pdf",
        name: "Official Registration & Clinical Documents (PDF)",
        category: "dossier",
        isUploaded: !!reg?.registrationId,
        url: printDossierUrl,
        fileName: `${reg?.registrationId || "Donor"}_Clinical_File.pdf`,
        isSystemPdf: true,
      },
      check("Aadhaar Card (Front)", "identity", docs.aadhaarFront),
      check("Aadhaar Card (Back)", "identity", docs.aadhaarBack),
      check("Passport Size Photo", "identity", docs.passportPhoto),
      check("Donor Signature", "identity", docs.signature),
      check("PAN Card", "identity", docs.panCard || docs.pan),
      check("Form 13 / ART Donor Affidavit", "legal", docs.form13, reg?.form13),
      check("Insurance Policy", "legal", docs.insurance, labs.insurance),
      check("Blood Group & Routine Report", "medical", labs.bloodReport),
      check("Viral Markers (HIV, HBsAg, HCV, VDRL)", "medical", labs.viralMarkersReport, labs.viralMarkers),
      check("Other Medical Reports", "medical", labs.otherReports, docs.extraAttachment || docs.otherDocument),
    ];

    if (reg?.donorType === "sperm" || donorTypeFilter === "sperm") {
      docList.push(check("Semen Analysis Report", "medical", labs.semenAnalysisReport, labs.semenAnalysis));
    }

    return docList;
  };

  // Open Print Configuration Dialog
  const handlePrintRegistration = (reg: any, defaultWithHeader = true) => {
    if (!reg?.registrationId) return;
    setSelectedReg(reg);
    setPrintWithHeader(defaultWithHeader);
    setPrintSections([]);
    setPrintAttachments([]);
    setPrintExtraDocUrl("");
    setIsPrintModalOpen(true);
  };

  // Toggle Print Section
  const handleTogglePrintSection = (key: string, donorType: string) => {
    const allSections = donorType === "sperm" ? SPERM_SECTIONS : EGG_SECTIONS;
    if (printSections.length === 0) {
      setPrintSections(allSections.map((s) => s.key).filter((k) => k !== key));
    } else {
      if (printSections.includes(key)) {
        const next = printSections.filter((k) => k !== key);
        setPrintSections(next);
      } else {
        const next = [...printSections, key];
        if (next.length === allSections.length) {
          setPrintSections([]);
        } else {
          setPrintSections(next);
        }
      }
    }
  };

  // Toggle Annexure
  const handleTogglePrintAttachment = (id: string) => {
    setPrintAttachments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Execute Print with selected options
  const handleExecutePrint = () => {
    if (!selectedReg?.registrationId) return;
    const attachmentsQuery = printAttachments.length > 0 ? `&attachments=${printAttachments.join(",")}` : "";
    const sectionsQuery = printSections.length > 0 ? `&sections=${printSections.join(",")}` : "";
    const extraDocQuery = printExtraDocUrl ? `&extraDocUrl=${encodeURIComponent(printExtraDocUrl)}` : "";

    const printUrl = `/admin/manage-registrations/${selectedReg.registrationId}/print?withHeader=${printWithHeader}${attachmentsQuery}${sectionsQuery}${extraDocQuery}`;
    window.open(printUrl, "_blank");
    setIsPrintModalOpen(false);
  };

  // Quick direct print helper
  const handleQuickPrint = (reg: any, withHeader: boolean) => {
    if (!reg?.registrationId) return;
    const printUrl = `/admin/manage-registrations/${reg.registrationId}/print?withHeader=${withHeader}&attachments=stamp,certificate`;
    window.open(printUrl, "_blank");
  };

  // Helper to trigger single file download cleanly
  const downloadSingleFile = async (url: string, filename: string) => {
    try {
      const downloadProxyUrl = `/api/view-file?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&download=1`;
      const link = document.createElement("a");
      link.href = downloadProxyUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download file.");
    }
  };

  // Download all registration documents and details as a consolidated ZIP
  const handleDownloadAllDocuments = async (reg: any) => {
    if (!reg) return;
    setDownloadingZipId(reg.registrationId);
    toast.info(`Preparing document archive for ${reg.registrationId}...`);

    try {
      const zip = new JSZip();
      const folderName = `${reg.registrationId}_${reg.personalInfo?.fullName || "Donor"}_Documents`.replace(/[^a-zA-Z0-9_-]/g, "_");
      const folder = zip.folder(folderName) || zip;

      // 1. Generate text dossier summary
      const hosp = typeof reg.assignedHospital === "object" ? reg.assignedHospital : null;
      const donorStreet = reg.contactInfo?.currentAddress || reg.contactInfo?.permanentAddress || "";
      const donorCity = reg.contactInfo?.city || "";
      const donorDistrict = reg.contactInfo?.district && reg.contactInfo.district !== donorCity ? reg.contactInfo.district : "";
      const donorState = reg.contactInfo?.state || "";
      const donorPin = reg.contactInfo?.pincode ? `PIN: ${reg.contactInfo.pincode}` : "";
      const donorAddressFull = [donorStreet, donorCity, donorDistrict, donorState, donorPin].filter(Boolean).join(", ") || "N/A";

      const hospStreet = hosp?.address?.street || hosp?.address?.city || hosp?.addressLine1 || "";
      const hospCity = hosp?.address?.city || hosp?.city || "";
      const hospState = hosp?.address?.state || hosp?.state || "";
      const hospPin = hosp?.address?.pincode || hosp?.pincode ? `PIN: ${hosp.address?.pincode || hosp?.pincode}` : "";
      const hospAddressFull = hosp ? [hospStreet, hospCity, hospState, hospPin].filter(Boolean).join(", ") || "N/A" : "N/A";

      const summaryText = `=====================================================
MEDIYAZ ART BANK - COMPLETED FILE SUMMARY
=====================================================

REGISTRATION DETAILS
--------------------
Registration ID   : ${reg.registrationId || "N/A"}
Donor ID          : ${reg.donorId || "Pending"}
Donor Type        : ${reg.donorType === "sperm" ? "Sperm Donor" : "Egg Donor (Oocyte Donor)"}
File Status       : ${reg.status || "COMPLETED"}
Registration Date : ${reg.createdAt ? new Date(reg.createdAt).toLocaleDateString("en-IN") : "N/A"}

PERSONAL & IDENTIFICATION DETAILS
---------------------------------
Full Name         : ${reg.personalInfo?.fullName || "N/A"}
Age / DOB         : ${reg.personalInfo?.age ? `${reg.personalInfo.age} yrs` : "N/A"} (${reg.personalInfo?.dateOfBirth ? new Date(reg.personalInfo.dateOfBirth).toLocaleDateString("en-IN") : "N/A"})
Gender            : ${reg.personalInfo?.gender || (reg.donorType === "sperm" ? "Male" : "Female")}
Blood Group       : ${reg.personalInfo?.bloodGroup || "N/A"}
Marital Status    : ${reg.personalInfo?.maritalStatus || "N/A"}
Aadhaar Number    : ${reg.personalInfo?.aadhaarNumber || "N/A"}
PAN Number        : ${reg.personalInfo?.panNumber || "N/A"}

CONTACT INFORMATION
-------------------
Primary Phone     : ${reg.contactInfo?.mobileNumber || reg.contactInfo?.primaryPhone || "N/A"}
Email Address     : ${reg.contactInfo?.emailAddress || reg.contactInfo?.email || "N/A"}
Donor Address     : ${donorAddressFull}

ASSIGNED ART CLINIC / HOSPITAL
------------------------------
Hospital Name     : ${hosp?.name || "Not Assigned"}
Hospital Code     : ${hosp?.code || "N/A"}
Contact Person    : ${hosp?.contactPerson || "N/A"}
Hospital Phone    : ${hosp?.mobileNumber || hosp?.phone || "N/A"}
Hospital Email    : ${hosp?.email || "N/A"}
Hospital Address  : ${hospAddressFull}

SCHEDULE INFORMATION
--------------------
Recruitment Date  : ${reg.recruitmentDate ? new Date(reg.recruitmentDate).toLocaleDateString("en-IN") : "Not Set"}
Supply Date       : ${reg.supplyDate ? new Date(reg.supplyDate).toLocaleDateString("en-IN") : "Not Set"}
Pickup Date       : ${reg.pickupDate ? new Date(reg.pickupDate).toLocaleDateString("en-IN") : "Not Set"}

PRINT DOSSIER LINK
------------------
Admin Direct Print URL: /admin/manage-registrations/${reg.registrationId}/print

Exported from Mediyaz ART Bank Portal on ${new Date().toLocaleString("en-IN")}
`;
      folder.file("Registration_Summary.txt", summaryText);

      // 2. Fetch and append all uploaded document files
      const docs = getRegistrationDocuments(reg).filter((d) => d.isUploaded && d.url && !d.isSystemPdf);
      let fetchedCount = 0;

      for (const doc of docs) {
        try {
          if (!doc.url) continue;
          const res = await fetch(doc.url);
          if (!res.ok) continue;
          const blob = await res.blob();
          const ext = doc.fileName?.includes(".") ? doc.fileName.split(".").pop() : (doc.url.split(".").pop()?.split("?")[0] || "pdf");
          const safeName = `${doc.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;
          folder.file(safeName, blob);
          fetchedCount++;
        } catch (fileErr) {
          console.error(`Failed to bundle document ${doc.name}:`, fileErr);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const zipUrl = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(zipUrl);

      toast.success(`Downloaded all documents (${fetchedCount} files + Summary) for ${reg.registrationId}`);
    } catch (err: any) {
      console.error("Failed to generate zip archive:", err);
      toast.error("Failed to package documents into ZIP. Please try downloading individual files.");
    } finally {
      setDownloadingZipId(null);
    }
  };

  // Open Payment Update Modal
  const handleOpenPaymentModal = (reg: any) => {
    setSelectedReg(reg);
    const hospDealPrice = Number(reg.clinicDeal?.hospitalDealPrice || 0);
    const isHospReceived = reg.clinicDeal?.isPaymentReceived || reg.clinicDeal?.paymentStatus === "RECEIVED";
    const hospReceivedAmount = Number(reg.clinicDeal?.receivedAmount || (isHospReceived ? hospDealPrice : 0));

    setPaymentForm({
      registrationId: reg.registrationId,
      hospitalDealPrice: hospDealPrice,
      hospitalPaymentStatus: isHospReceived ? "RECEIVED" : (reg.clinicDeal?.paymentStatus || "PENDING"),
      isHospitalPaymentReceived: isHospReceived,
      hospitalReceivedAmount: hospReceivedAmount,
      hospitalReceivedAt: reg.clinicDeal?.receivedAt
        ? new Date(reg.clinicDeal.receivedAt).toISOString().split("T")[0]
        : isHospReceived
        ? new Date().toISOString().split("T")[0]
        : "",
      hospitalPaymentRef: reg.clinicDeal?.paymentReference || "",
      hospitalNotes: reg.clinicDeal?.notes || "",
    });

    setIsPaymentModalOpen(true);
  };

  // Save Hospital Payment Changes
  const handleSaveHospitalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;

    setActionLoading(true);
    try {
      const isReceived = paymentForm.hospitalPaymentStatus === "RECEIVED";
      const payload = {
        registrationId: selectedReg.registrationId,
        donorType: selectedReg.donorType || donorTypeFilter || "egg",
        clinicDeal: {
          hospitalDealPrice: Number(paymentForm.hospitalDealPrice) || Number(selectedReg.clinicDeal?.hospitalDealPrice) || 0,
          paymentStatus: paymentForm.hospitalPaymentStatus,
          isPaymentReceived: isReceived,
          receivedAmount: isReceived
            ? Number(paymentForm.hospitalReceivedAmount) || Number(paymentForm.hospitalDealPrice) || 0
            : Number(paymentForm.hospitalReceivedAmount) || 0,
          receivedAt: paymentForm.hospitalReceivedAt ? new Date(paymentForm.hospitalReceivedAt) : null,
          paymentReference: paymentForm.hospitalPaymentRef || "",
          notes: paymentForm.hospitalNotes || "",
        },
      };

      const res = await fetch("/api/hospitals/completed-files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Hospital payment status updated successfully!");
        setIsPaymentModalOpen(false);
        loadCompletedFiles();
      } else {
        toast.error(data.error || "Failed to update hospital payment");
      }
    } catch (err: any) {
      console.error("Error saving hospital payment:", err);
      toast.error("Network error while saving payment status");
    } finally {
      setActionLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!registrations || registrations.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const exportRows = registrations.map((r) => {
      const hosp = typeof r.assignedHospital === "object" ? r.assignedHospital : null;

      const donorStreet = r.contactInfo?.currentAddress || r.contactInfo?.permanentAddress || "";
      const donorCity = r.contactInfo?.city || "";
      const donorDistrict = r.contactInfo?.district && r.contactInfo.district !== donorCity ? r.contactInfo.district : "";
      const donorState = r.contactInfo?.state || "";
      const donorPin = r.contactInfo?.pincode ? `PIN: ${r.contactInfo.pincode}` : "";
      const donorFullAddress = [donorStreet, donorCity, donorDistrict, donorState, donorPin].filter(Boolean).join(", ") || "N/A";

      const hospitalStreet = [hosp?.addressLine1, hosp?.addressLine2].filter(Boolean).join(", ");
      const hospitalCity = hosp?.city || "";
      const hospitalState = hosp?.state || "";
      const hospitalPin = hosp?.pincode ? `PIN: ${hosp.pincode}` : "";
      const hospitalFullAddress = hosp ? (
        [hospitalStreet, hospitalCity, hospitalState, hospitalPin].filter(Boolean).join(", ") || hosp.address || "N/A"
      ) : "N/A";

      return {
        "Registration ID": r.registrationId,
        "Donor ID": r.donorId || "N/A",
        "Donor Name": r.personalInfo?.fullName || "N/A",
        "Aadhaar No.": r.personalInfo?.aadhaarNumber || r.personalInfo?.aadharNumber || "N/A",
        "Donor Type": (r.donorType || donorTypeFilter || "egg").toUpperCase(),
        "Blood Group": r.personalInfo?.bloodGroup || "N/A",
        "Age": r.personalInfo?.age || "N/A",
        "Mobile": r.contactInfo?.mobileNumber || "N/A",
        "Email": r.contactInfo?.emailAddress || "N/A",
        "Donor Address": donorFullAddress,
        "File Status": r.status,
        "Assigned Hospital": hosp?.name || "Unassigned",
        "Hospital Address": hospitalFullAddress,
        "Hospital City": hosp?.city || "N/A",
        "Hospital Contact Person": hosp?.contactPerson || "N/A",
        "Hospital Contact Phone": hosp?.mobileNumber || hosp?.contactInfo || "N/A",
        "Pickup Date": r.pickupDate || "N/A",
        "Recruitment Date": r.recruitmentDate || "N/A",
        "Supply Date": r.supplyDate || "N/A",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Completed Files");
    XLSX.writeFile(workbook, `ART_Completed_Files_${donorTypeFilter.toUpperCase()}_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel report exported successfully!");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatDisplayDate = (str?: string) => {
    if (!str) return "Not Scheduled";
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

  const resolvedPageTitle =
    pageTitle ||
    (donorTypeFilter === "sperm"
      ? "Completed Sperm Donor Files"
      : donorTypeFilter === "egg"
      ? "Completed Egg Donor Files"
      : "Completed Files Directory");

  const resolvedBadgeLabel =
    badgeLabel ||
    (donorTypeFilter === "sperm"
      ? "Sperm Donor Files"
      : donorTypeFilter === "egg"
      ? "Egg Donor Files"
      : "Completed Files");

  const resolvedDonorDealLabel =
    donorTypeFilter === "sperm"
      ? "Donor Deal (Sperm Donor)"
      : donorTypeFilter === "egg"
      ? "Donor Deal (Egg Donor)"
      : "Donor Deal";

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-12">
          <FileCheck className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>{resolvedBadgeLabel}</span>
              <span>•</span>
              <span className="bg-teal-500/30 px-2 py-0.5 rounded-full text-white">Files Completed Section</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              {resolvedPageTitle}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {totalCount} Total
              </span>
            </h1>
            <p className="text-teal-100/80 text-sm mt-1 max-w-2xl">
              {description ||
                "Financial and compliance status for completed donor files: update hospital payment collections, verify uploaded documents, and review agreed deals."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={loadCompletedFiles}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold rounded-xl gap-1.5 h-10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExportExcel}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs gap-1.5 h-10 shadow-lg shadow-emerald-950/30"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Files Count */}
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Files</span>
            <div className="text-2xl font-black mt-1 text-foreground">
              {stats.totalCompletedFiles || totalCount}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
              All clinical files completed
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Hospital Deals & Receivables */}
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hospital Deals Value</span>
            <div className="text-2xl font-black mt-1 text-teal-600 dark:text-teal-400">
              ₹{(stats.totalHospitalDeals || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ₹{(stats.totalHospitalReceived || 0).toLocaleString("en-IN")}
              </span>
              <span>rec'd</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                ₹{(stats.totalHospitalPending || 0).toLocaleString("en-IN")}
              </span>
              <span>due</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Donor Deals / Compensation */}
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {resolvedDonorDealLabel}
            </span>
            <div className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">
              ₹{(stats.totalDonorDeals || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ₹{(stats.totalDonorPaid || 0).toLocaleString("en-IN")}
              </span>
              <span>paid</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                ₹{(stats.totalDonorPending || 0).toLocaleString("en-IN")}
              </span>
              <span>pending</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Scheduled Dates Tracker */}
        <div className="bg-card rounded-xl p-4 border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Files</span>
            <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
              {stats.scheduledPickupsCount || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Pickups, Recruitment & Supplies
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card rounded-2xl p-4 border shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Reg ID, Donor ID, Name, Clinic..."
              className="pl-9 h-10 rounded-xl text-xs"
            />
          </div>

          {/* Hospital Filter */}
          <div>
            <select
              value={selectedHospitalId}
              onChange={(e) => {
                setSelectedHospitalId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All ART Clinics</option>
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} {h.city ? `(${h.city})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Payment Status */}
          <div>
            <select
              value={hospitalPaymentFilter}
              onChange={(e) => {
                setHospitalPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">Hospital Payment: All</option>
              <option value="RECEIVED">Payment Received</option>
              <option value="PENDING">Payment Pending</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
            </select>
          </div>

          {/* Donor Payout Status */}
          <div>
            <select
              value={donorPaymentFilter}
              onChange={(e) => {
                setDonorPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">Donor Payout: All</option>
              <option value="PAID">Donor Paid</option>
              <option value="PENDING">Donor Unpaid / Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all_completed">Completed Files Only</option>
              <option value="FILE_COMPLETED">Status: File Completed</option>
              <option value="COMPLETED">Status: Completed</option>
              <option value="ALL">Include Approved Files</option>
            </select>
          </div>
        </form>

        {(search ||
          selectedHospitalId !== "ALL" ||
          statusFilter !== "all_completed" ||
          donorPaymentFilter !== "ALL" ||
          hospitalPaymentFilter !== "ALL") && (
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <span className="text-xs text-muted-foreground">
              Filtering completed {donorTypeFilter === "sperm" ? "sperm" : "egg"} files
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">Registration ID</th>
                <th className="p-4">Donor ID</th>
                <th className="p-4">Donor Profile</th>
                <th className="p-4">Assigned Hospital</th>
                <th className="p-4">Hospital Deal & Payment</th>
                <th className="p-4">{resolvedDonorDealLabel}</th>
                <th className="p-4">Documents Status</th>
                <th className="p-4">Schedule Dates</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                      <span className="font-semibold text-sm">Loading completed files...</span>
                    </div>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileCheck className="w-12 h-12 text-muted-foreground/40" />
                      <span className="font-bold text-base text-foreground">No Completed Files Found</span>
                      <p className="text-xs max-w-sm">
                        No registrations currently match your filter criteria. Try adjusting your search query or status filter.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs rounded-xl h-8"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => {
                  const hosp = typeof reg.assignedHospital === "object" ? reg.assignedHospital : null;
                  const isHospPaid = reg.clinicDeal?.isPaymentReceived || reg.clinicDeal?.paymentStatus === "RECEIVED";
                  const isDonorPaid = reg.isDonorPaid || reg.donorDeal?.paymentStatus === "PAID";
                  const regDocs = getRegistrationDocuments(reg);
                  const uploadedCount = regDocs.filter((d) => d.isUploaded).length;
                  const totalDocsCount = regDocs.length;
                  const allDocsUploaded = uploadedCount === totalDocsCount;

                  return (
                    <tr key={reg._id || reg.registrationId} className="hover:bg-muted/30 transition-colors">
                      {/* 1. Registration ID */}
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <span>{reg.registrationId}</span>
                          <button
                            onClick={() => copyToClipboard(reg.registrationId, "Registration ID")}
                            className="text-muted-foreground hover:text-teal-600 p-0.5 rounded transition-colors"
                            title="Copy Registration ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              reg.status === "COMPLETED"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                : reg.status === "FILE_COMPLETED"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {reg.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString("en-IN") : ""}
                        </div>
                      </td>

                      {/* 2. Donor ID */}
                      <td className="p-4 align-top">
                        {reg.donorId ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-mono font-bold text-xs">
                            {reg.donorId}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* 3. Donor Profile */}
                      <td className="p-4 align-top">
                        <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          {reg.personalInfo?.fullName || "N/A"}
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {reg.personalInfo?.bloodGroup || "O+"}
                          </span>
                        </div>
                        {(reg.personalInfo?.husbandName || reg.personalInfo?.spouseName) && (
                          <div className="text-[11px] text-muted-foreground">
                            Spouse: <span className="font-medium text-foreground">{reg.personalInfo.husbandName || reg.personalInfo.spouseName}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          {reg.personalInfo?.age ? <span>{reg.personalInfo.age} yrs</span> : null}
                          {reg.contactInfo?.city ? <span>• {reg.contactInfo.city}</span> : null}
                          {reg.contactInfo?.mobileNumber ? <span>• {reg.contactInfo.mobileNumber}</span> : null}
                        </div>
                      </td>

                      {/* 4. Assigned Hospital */}
                      <td className="p-4 align-top">
                        {hosp ? (
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate max-w-[180px]">{hosp.name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {hosp.city ? `${hosp.city}, ` : ""}{hosp.state || "India"}
                            </div>
                            {hosp.contactPerson && (
                              <div className="text-[10px] text-muted-foreground">
                                Contact: {hosp.contactPerson}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>No Clinic Assigned</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Hospital Deal & Hospital Payment Status */}
                      <td className="p-4 align-top">
                        <div className="font-black text-sm text-teal-700 dark:text-teal-300">
                          ₹{(reg.clinicDeal?.hospitalDealPrice || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Tier: <span className="text-foreground">{reg.clinicDeal?.donorCategory || "Normal"} Donor</span>
                        </div>
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isHospPaid
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                : reg.clinicDeal?.paymentStatus === "PARTIALLY_RECEIVED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                            }`}
                          >
                            {isHospPaid ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            {isHospPaid ? "Payment Received" : reg.clinicDeal?.paymentStatus === "PARTIALLY_RECEIVED" ? "Partially Rec'd" : "Payment Pending"}
                          </span>
                        </div>
                        {isHospPaid ? (
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            Collected: ₹{(reg.clinicDeal?.receivedAmount || reg.clinicDeal?.hospitalDealPrice || 0).toLocaleString("en-IN")}
                          </div>
                        ) : null}
                      </td>

                      {/* 6. Donor Deal */}
                      <td className="p-4 align-top">
                        <div className="font-black text-sm text-blue-700 dark:text-blue-300">
                          ₹{(reg.donorDeal?.compensationAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {reg.donorDeal?.paymentTerms || "Full on Retrieval"}
                        </div>
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDonorPaid
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                : reg.donorDeal?.paymentStatus === "PARTIALLY_PAID"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                            }`}
                          >
                            {isDonorPaid ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            {isDonorPaid ? "Donor Paid" : reg.donorDeal?.paymentStatus === "PARTIALLY_PAID" ? "Partially Paid" : "Donor Unpaid"}
                          </span>
                        </div>
                        {(reg.donorDeal?.advanceAmount || 0) > 0 && !isDonorPaid ? (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Adv: ₹{reg.donorDeal.advanceAmount} | Bal: ₹{reg.donorDeal.balanceAmount || 0}
                          </div>
                        ) : null}
                      </td>

                      {/* 7. Document Status */}
                      <td className="p-4 align-top">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReg(reg);
                            setIsDocModalOpen(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                            allDocsUploaded
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : uploadedCount >= 5
                              ? "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
                              : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                          title="Click to inspect all document upload statuses"
                        >
                          {allDocsUploaded ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <FileWarning className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{uploadedCount}/{totalDocsCount} Uploaded</span>
                        </button>

                        <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className={regDocs.find(d => d.name.includes("Form 13"))?.isUploaded ? "text-emerald-600 font-semibold" : "text-rose-600"}>
                              {regDocs.find(d => d.name.includes("Form 13"))?.isUploaded ? "✓ Form 13" : "✗ Form 13"}
                            </span>
                            <span>•</span>
                            <span className={regDocs.find(d => d.name.includes("Viral Markers"))?.isUploaded ? "text-emerald-600 font-semibold" : "text-rose-600"}>
                              {regDocs.find(d => d.name.includes("Viral Markers"))?.isUploaded ? "✓ Viral" : "✗ Viral"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 8. Schedule Dates */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-muted-foreground w-14">Pickup:</span>
                            <span className={`font-medium ${reg.pickupDate ? "text-foreground font-bold" : "text-muted-foreground italic"}`}>
                              {formatDisplayDate(reg.pickupDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-muted-foreground w-14">Recruit:</span>
                            <span className={`font-medium ${reg.recruitmentDate ? "text-foreground font-bold" : "text-muted-foreground italic"}`}>
                              {formatDisplayDate(reg.recruitmentDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold text-muted-foreground w-14">Supply:</span>
                            <span className={`font-medium ${reg.supplyDate ? "text-foreground font-bold" : "text-muted-foreground italic"}`}>
                              {formatDisplayDate(reg.supplyDate)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 9. Actions */}
                      <td className="p-4 align-top text-right">
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
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedReg(reg);
                                  setIsDetailModalOpen(true);
                                }}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2"
                              >
                                <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                View Complete File
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenPaymentModal(reg)}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2 text-teal-600 focus:text-teal-700"
                              >
                                <CreditCard className="w-4 h-4 text-teal-600" />
                                Hospital Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedReg(reg);
                                  setIsDocModalOpen(true);
                                }}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2"
                              >
                                <FileCheck className="w-4 h-4 text-blue-600" />
                                Documents Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handlePrintRegistration(reg)}
                                className="cursor-pointer gap-2 text-xs font-semibold py-2"
                              >
                                <Printer className="w-4 h-4 text-slate-500" />
                                Print Registration File
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-bold text-foreground">{registrations.length}</span> of{" "}
            <span className="font-bold text-foreground">{totalCount}</span> completed records
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="rounded-lg h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="px-2 font-medium">
              Page <span className="font-bold text-foreground">{currentPage}</span> of{" "}
              <span className="font-bold text-foreground">{totalPages}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="rounded-lg h-8 px-2.5 text-xs gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal 1: HOSPITAL PAYMENT STATUS */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-teal-600" />
              Update Hospital Payment Status
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Record payment receipt and billing collection from the assigned ART Clinic.
            </DialogDescription>
          </DialogHeader>

          {selectedReg && (
            <form onSubmit={handleSaveHospitalPayment} className="space-y-4 pt-2">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  <strong>Fixed Scope:</strong> Only Hospital Payment collection can be changed here. Donor compensation, donor payouts, hospital assignment, and retrieval schedule dates are managed under <strong>Registration Management</strong>.
                </p>
              </div>

              <div className="bg-muted/40 p-3.5 rounded-xl border space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Registration ID</span>
                    <span className="font-bold text-foreground">{selectedReg.registrationId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Donor ID</span>
                    <span className="font-mono font-bold text-teal-600">{selectedReg.donorId || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Donor Name</span>
                    <span className="font-bold text-foreground">{selectedReg.personalInfo?.fullName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Assigned Hospital</span>
                    <span className="font-bold text-foreground">
                      {typeof selectedReg.assignedHospital === "object" ? selectedReg.assignedHospital?.name : "Unassigned"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Agreed Clinic Deal Price:</span>
                  <span className="font-black text-sm text-teal-700 dark:text-teal-300">
                    ₹{(paymentForm.hospitalDealPrice || selectedReg.clinicDeal?.hospitalDealPrice || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl border bg-teal-500/5 border-teal-500/20">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Payment Received Status</span>
                    <span className="text-[10px] text-teal-600 font-semibold">Required</span>
                  </label>
                  <select
                    value={paymentForm.hospitalPaymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      const isRec = newStatus === "RECEIVED";
                      setPaymentForm({
                        ...paymentForm,
                        hospitalPaymentStatus: newStatus,
                        isHospitalPaymentReceived: isRec,
                        hospitalReceivedAmount: isRec ? paymentForm.hospitalDealPrice : paymentForm.hospitalReceivedAmount,
                        hospitalReceivedAt: isRec && !paymentForm.hospitalReceivedAt ? new Date().toISOString().split("T")[0] : paymentForm.hospitalReceivedAt,
                      });
                    }}
                    className="w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="PENDING">Pending Payment (Not Received)</option>
                    <option value="RECEIVED">Payment Received (Full)</option>
                    <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Amount Received (₹)</label>
                    <Input
                      type="number"
                      value={paymentForm.hospitalReceivedAmount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, hospitalReceivedAmount: Number(e.target.value) })}
                      className="h-9 rounded-lg text-xs font-bold"
                      placeholder="e.g. 65000"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Payment Received Date</label>
                    <Input
                      type="date"
                      value={paymentForm.hospitalReceivedAt}
                      onChange={(e) => setPaymentForm({ ...paymentForm, hospitalReceivedAt: e.target.value })}
                      className="h-9 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Payment Reference / UTR Number</label>
                  <Input
                    value={paymentForm.hospitalPaymentRef}
                    onChange={(e) => setPaymentForm({ ...paymentForm, hospitalPaymentRef: e.target.value })}
                    className="h-9 rounded-lg text-xs"
                    placeholder="NEFT / RTGS / UTR / Cheque Reference"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Collection Remarks / Notes</label>
                  <Input
                    value={paymentForm.hospitalNotes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, hospitalNotes: e.target.value })}
                    className="h-9 rounded-lg text-xs"
                    placeholder="e.g. Cleared by Apollo Fertility accounts dept."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs h-9 px-5 gap-1.5 shadow-md"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Payment Status
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: DOCUMENTS STATUS & VERIFICATION INSPECTOR */}
      <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <FileCheck className="w-5 h-5 text-teal-600" />
              Document Status & Upload Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              View all compliance, legal, medical, and KYC documents for registration #{selectedReg?.registrationId}
            </DialogDescription>
          </DialogHeader>

          {selectedReg && (() => {
            const docs = getRegistrationDocuments(selectedReg);
            const uploadedCount = docs.filter((d) => d.isUploaded).length;
            const totalDocs = docs.length;
            const percentage = Math.round((uploadedCount / totalDocs) * 100);

            return (
              <div className="space-y-4 pt-2 text-xs">
                {/* Header Summary Strip */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {selectedReg.personalInfo?.fullName || "N/A"}{" "}
                        <span className="font-normal text-muted-foreground">({selectedReg.registrationId})</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Donor ID: <span className="font-mono font-bold text-teal-600">{selectedReg.donorId || "Pending"}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                        uploadedCount === totalDocs
                          ? "bg-emerald-600 text-white"
                          : uploadedCount >= 5
                          ? "bg-blue-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}>
                        {uploadedCount}/{totalDocs} Documents Uploaded ({percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        uploadedCount === totalDocs
                          ? "bg-emerald-500"
                          : uploadedCount >= 5
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handlePrintRegistration(selectedReg)}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-8 px-3 text-xs font-semibold gap-1.5 shadow-sm"
                      title="Print complete registration file"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Documents (PDF)
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={downloadingZipId === selectedReg.registrationId}
                      onClick={() => handleDownloadAllDocuments(selectedReg)}
                      className="rounded-xl h-8 px-3 text-xs font-semibold gap-1.5 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
                      title="Package all documents into a single ZIP file"
                    >
                      {downloadingZipId === selectedReg.registrationId ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Download All Documents (ZIP)
                    </Button>
                  </div>
                </div>

                {/* Categorized Document Checklist */}
                <div className="space-y-3">
                  {[
                    { category: "dossier", title: "Complete Registration Documents & Official PDF" },
                    { category: "legal", title: "Legal & ART Compliance" },
                    { category: "identity", title: "Identity & KYC Documents" },
                    { category: "medical", title: "Medical & Lab Investigation Reports" },
                  ].map((group) => {
                    const groupDocs = docs.filter((d) => d.category === group.category);
                    if (groupDocs.length === 0) return null;

                    return (
                      <div key={group.category} className="space-y-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          {group.title}
                        </span>

                        <div className="divide-y rounded-xl border bg-card overflow-hidden">
                          {groupDocs.map((doc) => (
                            <div
                              key={doc.key}
                              className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {doc.isUploaded ? (
                                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                    <FileWarning className="w-4 h-4" />
                                  </div>
                                )}

                                <div>
                                  <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                                    <span>{doc.name}</span>
                                    {doc.isSystemPdf && (
                                      <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 rounded text-[9px] font-black uppercase tracking-wider">
                                        Official PDF
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {doc.isUploaded ? (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                        ✓ Available {doc.fileName ? `(${doc.fileName})` : ""}
                                      </span>
                                    ) : (
                                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                        ✗ Not Uploaded / Missing
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    doc.isUploaded
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200"
                                  }`}
                                >
                                  {doc.isUploaded ? "Uploaded" : "Missing"}
                                </span>

                                {doc.isUploaded && doc.url && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setViewerDoc({
                                          isOpen: true,
                                          title: `${doc.name} - ${selectedReg.personalInfo?.fullName || selectedReg.registrationId}`,
                                          fileUrl: doc.url || null,
                                          fileName: `${doc.key}.pdf`,
                                          donorName: selectedReg.personalInfo?.fullName,
                                          donorId: selectedReg.donorId || selectedReg.registrationId,
                                        })
                                      }
                                      className="px-2 py-1 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950 flex items-center gap-1 font-semibold text-[11px] border border-teal-200 dark:border-teal-800 cursor-pointer"
                                      title="View Document"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View</span>
                                    </button>

                                    {doc.isSystemPdf ? (
                                      <button
                                        onClick={() => handlePrintRegistration(selectedReg)}
                                        className="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-muted flex items-center gap-1 font-semibold text-[11px] border"
                                        title="Print Registration Documents"
                                      >
                                        <Printer className="w-3.5 h-3.5 text-teal-600" />
                                        <span>Print</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => downloadSingleFile(doc.url!, doc.fileName || `${doc.name}.pdf`)}
                                        className="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-muted flex items-center gap-1 font-semibold text-[11px] border"
                                        title="Download File"
                                      >
                                        <Download className="w-3.5 h-3.5 text-teal-600" />
                                        <span>Download</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-muted/30 p-3 rounded-xl border text-[11px] text-muted-foreground">
                  <p>
                    <strong>Note for Admin:</strong> To upload new files, replace missing documents, or manage affidavits, please open the registration inside <strong>Registration Management</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePrintRegistration(selectedReg)}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-8 px-3 gap-1 shadow-sm font-semibold"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Documents
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={downloadingZipId === selectedReg.registrationId}
                      onClick={() => handleDownloadAllDocuments(selectedReg)}
                      className="rounded-xl text-xs h-8 px-3 gap-1 font-semibold border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
                    >
                      {downloadingZipId === selectedReg.registrationId ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Download All (ZIP)
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsDocModalOpen(false)}
                    className="rounded-xl text-xs h-8 px-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal 3: View Complete File Details */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Completed File Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Full summary and document checklist for registration #{selectedReg?.registrationId}
            </DialogDescription>
          </DialogHeader>

          {selectedReg && (() => {
            const regDocs = getRegistrationDocuments(selectedReg);
            const uploadedCount = regDocs.filter((d) => d.isUploaded).length;

            return (
              <div className="space-y-4 text-xs pt-2">
                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/40 dark:to-blue-950/40 border flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-foreground">
                      {selectedReg.personalInfo?.fullName || "N/A"}
                    </h3>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      Registration ID: <span className="font-bold text-foreground">{selectedReg.registrationId}</span> • Donor ID:{" "}
                      <span className="font-bold text-teal-600">{selectedReg.donorId || "Unassigned"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-600 text-white">
                      {selectedReg.donorType ? selectedReg.donorType.toUpperCase() : "EGG"} DONOR
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {selectedReg.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div className="p-4 rounded-xl border bg-card space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider border-b pb-1">
                      Personal Details
                    </h4>
                    <div className="space-y-1">
                      <div><span className="text-muted-foreground">Spouse / Husband:</span> <span className="font-semibold">{selectedReg.personalInfo?.husbandName || selectedReg.personalInfo?.spouseName || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Blood Group:</span> <span className="font-bold text-teal-600">{selectedReg.personalInfo?.bloodGroup || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Date of Birth:</span> <span>{selectedReg.personalInfo?.dateOfBirth || "N/A"} ({selectedReg.personalInfo?.age || "N/A"} yrs)</span></div>
                      <div><span className="text-muted-foreground">Education / Occupation:</span> <span>{selectedReg.personalInfo?.education || "N/A"} / {selectedReg.personalInfo?.occupation || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Height & Weight:</span> <span>{selectedReg.personalInfo?.height || "N/A"} cm, {selectedReg.personalInfo?.weight || "N/A"} kg</span></div>
                      <div><span className="text-muted-foreground">Aadhaar Number:</span> <span className="font-mono">{selectedReg.personalInfo?.aadhaarNumber || "N/A"}</span></div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="p-4 rounded-xl border bg-card space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider border-b pb-1">
                      Contact & Location
                    </h4>
                    <div className="space-y-1">
                      <div><span className="text-muted-foreground">Mobile:</span> <span className="font-semibold">{selectedReg.contactInfo?.mobileNumber || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Email:</span> <span>{selectedReg.contactInfo?.emailAddress || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Current City:</span> <span>{selectedReg.contactInfo?.city || "N/A"}, {selectedReg.contactInfo?.state || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Permanent Address:</span> <span>{selectedReg.contactInfo?.permanentAddress || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Pincode:</span> <span>{selectedReg.contactInfo?.pincode || "N/A"}</span></div>
                    </div>
                  </div>
                </div>

                {/* Financial Agreements Box */}
                <div className="p-4 rounded-xl border bg-card space-y-3">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider border-b pb-1">
                    Financial Agreements & Settlement
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Hospital */}
                    <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-800 dark:text-teal-300">ART Clinic Deal</span>
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsDetailModalOpen(false);
                            handleOpenPaymentModal(selectedReg);
                          }}
                          className="h-6 px-2 text-[10px] bg-teal-600 hover:bg-teal-700 text-white rounded-md gap-1"
                        >
                          <CreditCard className="w-3 h-3" /> Update Payment
                        </Button>
                      </div>
                      <div><span className="text-muted-foreground">Assigned Clinic:</span> <span className="font-semibold text-foreground">{typeof selectedReg.assignedHospital === "object" ? selectedReg.assignedHospital?.name : "None"}</span></div>
                      <div><span className="text-muted-foreground">Agreed Price:</span> <span className="font-black text-teal-600">₹{(selectedReg.clinicDeal?.hospitalDealPrice || 0).toLocaleString("en-IN")}</span></div>
                      <div><span className="text-muted-foreground">Payment Received Status:</span> <span className="font-bold">{selectedReg.clinicDeal?.paymentStatus || "PENDING"}</span></div>
                      <div><span className="text-muted-foreground">Amount Collected:</span> <span className="font-bold text-emerald-600">₹{(selectedReg.clinicDeal?.receivedAmount || 0).toLocaleString("en-IN")}</span></div>
                      {selectedReg.clinicDeal?.paymentReference && <div><span className="text-muted-foreground">Payment Ref:</span> <span className="font-mono">{selectedReg.clinicDeal.paymentReference}</span></div>}
                    </div>

                    {/* Donor */}
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-800 dark:text-blue-300">Deal with Donor</span>
                        <span className="text-[10px] text-muted-foreground italic">Managed in Registration</span>
                      </div>
                      <div><span className="text-muted-foreground">Compensation Amount:</span> <span className="font-black text-blue-600">₹{(selectedReg.donorDeal?.compensationAmount || 0).toLocaleString("en-IN")}</span></div>
                      <div><span className="text-muted-foreground">Donor Paid Status:</span> <span className="font-bold">{selectedReg.isDonorPaid ? "PAID" : selectedReg.donorDeal?.paymentStatus || "PENDING"}</span></div>
                      <div><span className="text-muted-foreground">Advance Paid:</span> <span>₹{(selectedReg.donorDeal?.advanceAmount || 0).toLocaleString("en-IN")}</span></div>
                      <div><span className="text-muted-foreground">Balance Due:</span> <span>₹{(selectedReg.donorDeal?.balanceAmount || 0).toLocaleString("en-IN")}</span></div>
                      {selectedReg.donorDeal?.paymentReference && <div><span className="text-muted-foreground">Payout Ref:</span> <span className="font-mono">{selectedReg.donorDeal.paymentReference}</span></div>}
                    </div>
                  </div>
                </div>

                {/* Documents Checklist Box */}
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      Documents & Compliance Status ({uploadedCount}/{regDocs.length} Uploaded)
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setIsDocModalOpen(true);
                      }}
                      className="h-6 px-2 text-[10px] gap-1"
                    >
                      <FileCheck className="w-3 h-3 text-teal-600" /> Full Checklist
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {regDocs.map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                        <span className="text-muted-foreground font-medium">{doc.name}:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.isUploaded ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {doc.isUploaded ? "Uploaded" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule Dates */}
                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider border-b pb-1">
                    Schedule Dates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div><span className="text-muted-foreground">Pickup Date:</span> <span className="font-semibold block">{formatDisplayDate(selectedReg.pickupDate)}</span></div>
                    <div><span className="text-muted-foreground">Recruitment Date:</span> <span className="font-semibold block">{formatDisplayDate(selectedReg.recruitmentDate)}</span></div>
                    <div><span className="text-muted-foreground">Supply Date:</span> <span className="font-semibold block">{formatDisplayDate(selectedReg.supplyDate)}</span></div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePrintRegistration(selectedReg)}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-9 px-3 gap-1.5 shadow-sm font-semibold"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Documents & Records
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={downloadingZipId === selectedReg.registrationId}
                      onClick={() => handleDownloadAllDocuments(selectedReg)}
                      className="rounded-xl text-xs h-9 px-3 gap-1.5 font-semibold border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
                    >
                      {downloadingZipId === selectedReg.registrationId ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Download All Documents (ZIP)
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="rounded-xl text-xs h-9 px-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal 4: PRINT CONFIGURATION MODAL */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Printer className="w-5 h-5 text-teal-600" />
              Print Options & Letterhead Configuration
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select what to print (Registration Form, Contract, Consent, Affidavits) and choose between Clinic Letterhead or Blank paper format for registration #{selectedReg?.registrationId}
            </DialogDescription>
          </DialogHeader>

          {selectedReg && (() => {
            const donorType = selectedReg.donorType || donorTypeFilter || "egg";
            const sectionList = donorType === "sperm" ? SPERM_SECTIONS : EGG_SECTIONS;
            const availableDocs = getRegistrationDocuments(selectedReg).filter(
              (d) => d.isUploaded && d.url && !d.isSystemPdf
            );

            return (
              <div className="space-y-5 pt-2 text-xs">
                {/* 1. Letterhead Option */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                      1. Letterhead Format
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Choose if you need branding or blank layout
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPrintWithHeader(true)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                        printWithHeader
                          ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-sm"
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                          <Building2 className="w-4 h-4 text-teal-600" />
                          <span>With Clinic Letterhead</span>
                        </div>
                        {printWithHeader && (
                          <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Includes Mediyaz ART Bank header, branding, logo, registration number, and clinic contact details. Recommended for standard PDF printing and electronic records.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintWithHeader(false)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                        !printWithHeader
                          ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-sm"
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span>Without Letterhead (Clean)</span>
                        </div>
                        {!printWithHeader && (
                          <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        No background graphic or top logo. Clean top margins designed for printing directly on pre-printed physical ART Clinic stationery.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. What to Print */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                      2. What to Print (Document Sections)
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrintSections([])}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        printSections.length === 0
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "border-slate-300 dark:border-slate-700 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      ✓ Full File (All Sections)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sectionList.map((item) => {
                      const isSelected =
                        printSections.length === 0 || printSections.includes(item.key);

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleTogglePrintSection(item.key, donorType)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                            isSelected
                              ? "border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 text-foreground"
                              : "border-border hover:bg-muted/30 text-muted-foreground opacity-60"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>{item.label}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground line-clamp-1">
                              {item.desc}
                            </div>
                          </div>
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? "bg-teal-600 border-teal-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Annexures & Official Seals */}
                <div className="space-y-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                    3. Attach Annexures & Official Seals
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COMMON_ANNEXURES.map((item) => {
                      const isSelected = printAttachments.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTogglePrintAttachment(item.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                            isSelected
                              ? "border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 text-foreground"
                              : "border-border hover:bg-muted/30 text-muted-foreground opacity-60"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>{item.label}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground line-clamp-1">
                              {item.desc}
                            </div>
                          </div>
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? "bg-teal-600 border-teal-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Merge Uploaded Document into Print */}
                {availableDocs.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                      4. Merge Uploaded Document into Print (Optional)
                    </span>
                    <select
                      value={printExtraDocUrl}
                      onChange={(e) => setPrintExtraDocUrl(e.target.value)}
                      className="w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-- None (Only Print Registration & Forms) --</option>
                      {availableDocs.map((doc) => (
                        <option key={doc.key} value={doc.url}>
                          Attach: {doc.name} {doc.fileName ? `(${doc.fileName})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dialog Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                  <div className="text-[11px] text-muted-foreground">
                    Selected: <strong className="text-foreground">{printWithHeader ? "With Letterhead" : "Without Letterhead"}</strong> • {printSections.length === 0 ? "All Sections" : `${printSections.length} Sections`} • {printAttachments.length} Annexures
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPrintModalOpen(false)}
                      className="rounded-xl text-xs h-9 px-3"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleQuickPrint(selectedReg, false)}
                      className="rounded-xl text-xs h-9 px-3 text-slate-700 dark:text-slate-300 hover:text-teal-600"
                      title="Quick print without letterhead background"
                    >
                      Print Without Letterhead
                    </Button>

                    <Button
                      type="button"
                      onClick={handleExecutePrint}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5 shadow-md"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Proceed to Print
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* In-App Document Viewer */}
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
