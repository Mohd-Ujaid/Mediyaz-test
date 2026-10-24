"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Receipt,
  Download,
  Printer,
  Building2,
  RefreshCw,
  Eye,
  Edit3,
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
import {
  MEDIYAZ_LOGO_BASE64,
  MEDIYAZ_SIGNATURE_BASE64,
  MEDIYAZ_BANK_ISSUER,
  INVOICE_TERMS_AND_CONDITIONS,
  INVOICE_NOTES,
} from "@/features/pdf-generator/invoice/invoice-assets";
import { formatDotDate, numberToWordsIndian } from "@/lib/invoice-utils";
import { pdf } from "@react-pdf/renderer";
import CompletedFileInvoicePdfDocument, {
  CompletedFileInvoiceData,
} from "@/features/pdf-generator/invoice/CompletedFileInvoicePdfDocument";

interface CompletedFileInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
  donorType?: "egg" | "sperm";
  onInvoiceSaved?: () => void;
  readOnly?: boolean;
}

export function CompletedFileInvoiceModal({
  isOpen,
  onClose,
  registration,
  donorType = "egg",
  onInvoiceSaved,
  readOnly = false,
}: CompletedFileInvoiceModalProps) {
  const isEgg = donorType === "egg";
  const hosp =
    typeof registration?.assignedHospital === "object"
      ? registration.assignedHospital
      : null;

  const isSperm = donorType === "sperm" || registration?.donorType === "sperm";
  const cat = registration?.clinicDeal?.donorCategory || registration?.donorDeal?.donorCategory || "normal";

  // Build default initial form data (e.g. 60,000 for normal egg donor)
  const defaultDealPrice =
    registration?.clinicDeal?.totalAmount ||
    registration?.clinicDeal?.hospitalDealPrice ||
    (hosp
      ? isSperm
        ? cat === "profile"
          ? hosp.spermProfileDonorDealPrice || 25000
          : hosp.spermDonorDealPrice || 15000
        : cat === "profile"
        ? hosp.eggProfileDonorDealPrice || hosp.profiledonorDealPrice || 85000
        : hosp.eggDonorDealPrice || hosp.donorDealPrice || 60000
      : isSperm
      ? 15000
      : 60000);

  const defaultServiceCharge = hosp?.serviceCharge || 5000;
  const defaultReimbursement = Math.max(
    0,
    defaultDealPrice - defaultServiceCharge
  );

  const initialHospAddress = hosp
    ? [
        hosp.addressLine1,
        hosp.addressLine2,
        hosp.city,
        hosp.state ? `${hosp.state}${hosp.pincode ? `, ${hosp.pincode}` : ""}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : "Aashlok 25 AB, Block A 1, Nauroji Nagar, Safdarjung Enclave, New Delhi, Delhi 110029";

  const initialInvoiceDate = registration?.pickupDate
    ? formatDotDate(registration.pickupDate)
    : formatDotDate(new Date());

  const initialPickupDate = registration?.pickupDate
    ? formatDotDate(registration.pickupDate)
    : initialInvoiceDate;

  // State
  const [invoiceNumber, setInvoiceNumber] = useState(
    registration?.clinicDeal?.invoiceNumber || registration?.invoiceNumber || "54"
  );
  const [invoiceDate, setInvoiceDate] = useState(initialInvoiceDate);
  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [hospitalName, setHospitalName] = useState(
    hosp?.name || "Mediworld Fertility Private Limited"
  );
  const [hospitalGstin, setHospitalGstin] = useState(
    hosp?.gstNumber || "07AANCM1124F1ZQ"
  );
  const [hospitalAddress, setHospitalAddress] = useState(initialHospAddress);
  const [pickupLocation, setPickupLocation] = useState(
    hosp?.pickupLocation || hosp?.shortName || hosp?.name || "Mediworld Fertility Centre"
  );
  const [saleType, setSaleType] = useState<"STATE" | "INTER-STATE">(
    hosp?.state && !hosp.state.toLowerCase().includes("delhi")
      ? "INTER-STATE"
      : "STATE"
  );

  const [totalDealPrice, setTotalDealPrice] = useState(defaultDealPrice);
  const [serviceCharge, setServiceCharge] = useState(defaultServiceCharge);
  const [donorReimbursement, setDonorReimbursement] =
    useState(defaultReimbursement);
  const [branchName, setBranchName] = useState("");

  const [activeTab, setActiveTab] = useState<"settings" | "preview">("preview");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // PDF Blob states for instant download and printing
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Sync state when registration opens
  useEffect(() => {
    if (registration) {
      const h =
        typeof registration.assignedHospital === "object"
          ? registration.assignedHospital
          : null;

      const pDate = registration.pickupDate
        ? formatDotDate(registration.pickupDate)
        : formatDotDate(new Date());

      setInvoiceDate(registration.clinicDeal?.invoiceDate ? formatDotDate(registration.clinicDeal.invoiceDate) : pDate);
      setPickupDate(pDate);

      // Invoice number: prioritize existing saved invoice number
      const existingInvNum = (registration.clinicDeal?.invoiceNumber || registration.invoiceNumber || "").trim();
      if (existingInvNum) {
        setInvoiceNumber(existingInvNum);
      } else {
        const numOnly = registration.registrationId?.replace(/\D/g, "");
        setInvoiceNumber(numOnly ? numOnly.slice(-3) || "54" : "54");
      }

      setHospitalName(h?.name || "Mediworld Fertility Private Limited");
      setHospitalGstin(h?.gstNumber || "07AANCM1124F1ZQ");
      setPickupLocation(
        registration.opuLocation ||
          registration.pickupLocation ||
          h?.pickupLocation ||
          h?.shortName ||
          h?.name ||
          "Mediworld Fertility Centre"
      );

      const branchVal = (
        registration.assignedBranch ||
        registration.branchName ||
        registration.clinicDeal?.assignedBranch ||
        h?.branches?.[0]?.branchName ||
        registration.opuLocation ||
        registration.pickupLocation ||
        (h?.city ? `${h.city} Branch` : "")
      );
      setBranchName(branchVal);

      const addr = h
        ? [
            h.addressLine1,
            h.addressLine2,
            h.city,
            h.state ? `${h.state}${h.pincode ? `, ${h.pincode}` : ""}` : "",
          ]
            .filter(Boolean)
            .join(", ")
        : "Aashlok 25 AB, Block A 1, Nauroji Nagar, Safdarjung Enclave, New Delhi, Delhi 110029";
      setHospitalAddress(addr);

      setSaleType(
        h?.state && !h.state.toLowerCase().includes("delhi")
          ? "INTER-STATE"
          : "STATE"
      );

      const isSpermReg = donorType === "sperm" || registration.donorType === "sperm";
      const catReg = registration.clinicDeal?.donorCategory || registration.donorDeal?.donorCategory || "normal";
      const resolvedDealPrice =
        registration.clinicDeal?.totalAmount ||
        registration.clinicDeal?.hospitalDealPrice ||
        (h
          ? isSpermReg
            ? catReg === "profile"
              ? h.spermProfileDonorDealPrice || 25000
              : h.spermDonorDealPrice || 15000
            : catReg === "profile"
            ? h.eggProfileDonorDealPrice || h.profiledonorDealPrice || 85000
            : h.eggDonorDealPrice || h.donorDealPrice || 60000
          : isSpermReg
          ? 15000
          : 60000);

      const sc =
        registration.clinicDeal?.serviceCharge !== undefined && registration.clinicDeal?.serviceCharge !== null
          ? Number(registration.clinicDeal.serviceCharge)
          : h?.serviceCharge !== undefined && h?.serviceCharge !== null
          ? Number(h.serviceCharge)
          : 5000;

      const reimb =
        registration.clinicDeal?.donorReimbursement !== undefined && registration.clinicDeal?.donorReimbursement !== null
          ? Number(registration.clinicDeal.donorReimbursement)
          : Math.max(0, resolvedDealPrice - sc);

      setTotalDealPrice(resolvedDealPrice);
      setServiceCharge(sc);
      setDonorReimbursement(reimb);
      if (readOnly) {
        setActiveTab("preview");
      }
    }
  }, [registration, donorType, readOnly]);

  // Financial calculations
  const isInterState = saleType === "INTER-STATE";
  const cgstRate = isInterState ? 0 : 9;
  const cgstAmount = isInterState ? 0 : (serviceCharge * 9) / 100;
  const sgstRate = isInterState ? 0 : 9;
  const sgstAmount = isInterState ? 0 : (serviceCharge * 9) / 100;
  const igstRate = isInterState ? 18 : 0;
  const igstAmount = isInterState ? (serviceCharge * 18) / 100 : 0;

  const totalBeforeTax = serviceCharge + donorReimbursement;
  const beforeTaxWordsText = numberToWordsIndian(totalBeforeTax);

  const serviceChargeTotal =
    serviceCharge + cgstAmount + sgstAmount + igstAmount;
  const totalAmountAfterTax = serviceChargeTotal + donorReimbursement;
  const wordsText = numberToWordsIndian(totalAmountAfterTax);

  const donorName = registration?.personalInfo?.fullName || "Donor";
  const huidNo = registration?.donorId || registration?.registrationId || "N/A";

  const reimbursementDesc = isEgg
    ? "Rembursment Of Oocyte Donor Exp"
    : "Rembursment Of Sperm Donor Exp";
  const pickupLabel = isEgg ? "Date of Oocyte Pickup" : "Date of Sperm Pickup";

  // Synchronization helpers
  const handleTotalDealChange = (val: number) => {
    setTotalDealPrice(val);
    setDonorReimbursement(Math.max(0, val - serviceCharge));
  };

  const handleServiceChargeChange = (val: number) => {
    setServiceCharge(val);
    setDonorReimbursement(Math.max(0, totalDealPrice - val));
  };

  const handleReimbursementChange = (val: number) => {
    setDonorReimbursement(val);
    setTotalDealPrice(val + serviceCharge);
  };

  // Save invoice details to database and activate donor in ledger
  const saveInvoiceToDb = async (silent = false): Promise<boolean> => {
    if (!registration) return false;
    setIsSaving(true);
    try {
      const gstVal = isInterState ? igstAmount : cgstAmount + sgstAmount;
      const tdsAmt = Math.round(totalBeforeTax * 0.02);
      const netVal = Math.max(0, totalBeforeTax - tdsAmt + gstVal);

      const res = await fetch("/api/hospitals/completed-files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.registrationId,
          donorType: isEgg ? "egg" : "sperm",
          invoiceNumber,
          invoiceDate,
          pickupDate,
          opuLocation: pickupLocation,
          isInvoiceGenerated: true,
          clinicDeal: {
            isInvoiceGenerated: true,
            billingMode: "INVOICED",
            invoiceNumber,
            invoiceDate,
            hospitalDealPrice: totalBeforeTax,
            totalAmount: totalBeforeTax,
            serviceCharge,
            donorReimbursement,
            gstAmount: gstVal,
            gst: {
              taxableValue: serviceCharge,
              cgstRate: isInterState ? 0 : 9,
              cgstAmount: isInterState ? 0 : cgstAmount,
              sgstRate: isInterState ? 0 : 9,
              sgstAmount: isInterState ? 0 : sgstAmount,
              igstRate: isInterState ? 18 : 0,
              igstAmount: isInterState ? igstAmount : 0,
              totalGst: gstVal,
              supplyType: isInterState ? "INTER" : "INTRA",
              placeOfSupply: isInterState ? "Other State" : "Delhi (07)",
              clinicGstin: hospitalGstin,
              gstDate: invoiceDate,
            },
            tdsPercentage: 2,
            tdsAmount: tdsAmt,
            netReceivableAmount: netVal,
          },
          donorDeal: {
            compensationAmount: donorReimbursement,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (!silent) {
          toast.success(`Invoice #${invoiceNumber} saved! Record is entered in Invoice Tracker & Ledger.`);
        }
        onInvoiceSaved?.();
        return true;
      } else {
        if (!silent) toast.error(data.error || "Failed to save invoice to ledger");
        return false;
      }
    } catch (err: any) {
      console.error("Save invoice error:", err);
      if (!silent) toast.error("Error saving invoice to database");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Automatically record & persist generated invoice when opened in generation mode
  useEffect(() => {
    if (isOpen && !readOnly) {
      const isAlreadyGenerated = Boolean(
        registration?.clinicDeal?.isInvoiceGenerated ||
        registration?.isInvoiceGenerated ||
        (registration?.clinicDeal?.invoiceNumber && String(registration.clinicDeal.invoiceNumber).trim() !== "") ||
        (registration?.invoiceNumber && String(registration.invoiceNumber).trim() !== "")
      );
      if (!isAlreadyGenerated) {
        saveInvoiceToDb(true);
      }
    }
  }, [isOpen, readOnly, registration?.registrationId]);

  // Pre-generate PDF Blob in background for instant download and printing
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function generateClientPdf() {
      try {
        const currentInvoiceData: CompletedFileInvoiceData = {
          invoiceNumber,
          invoiceDate,
          sacCode: "999317",
          gstin: "07FJBPS6601G1Z7",
          donorType: isEgg ? "egg" : "sperm",
          donorName,
          huidNo,
          hospitalName,
          hospitalGstin,
          hospitalAddress,
          branchName,
          pickupDate,
          pickupLocation,
          saleType,
          serviceCharge,
          serviceChargeSac: "999321",
          donorReimbursement,
          reimbursementSac: "999317",
          cgstRate,
          cgstAmount,
          sgstRate,
          sgstAmount,
          igstRate,
          igstAmount,
          totalAmountBeforeTax: totalBeforeTax,
          totalAmountAfterTax,
          amountInWords: wordsText,
          beforeTaxAmountInWords: beforeTaxWordsText,
        };

        const blob = await pdf(
          <CompletedFileInvoicePdfDocument invoice={currentInvoiceData} />
        ).toBlob();

        if (isCancelled) return;
        const newUrl = URL.createObjectURL(blob);
        setPdfBlob(blob);
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return newUrl;
        });
      } catch (err: any) {
        console.error("PDF background generation error:", err);
      }
    }

    generateClientPdf();

    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    invoiceNumber,
    invoiceDate,
    donorName,
    huidNo,
    hospitalName,
    hospitalGstin,
    hospitalAddress,
    pickupDate,
    pickupLocation,
    saleType,
    serviceCharge,
    donorReimbursement,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalAmountAfterTax,
    wordsText,
    isEgg,
  ]);

  // Build query params for PDF url fallback
  const buildPdfParams = (preview: boolean) => {
    const params = new URLSearchParams();
    params.set("donorType", isEgg ? "egg" : "sperm");
    params.set("id", registration?._id || registration?.registrationId || "");
    params.set("invoiceNumber", invoiceNumber);
    params.set("invoiceDate", invoiceDate);
    params.set("pickupDate", pickupDate);
    params.set("hospitalName", hospitalName);
    params.set("hospitalGstin", hospitalGstin);
    params.set("hospitalAddress", hospitalAddress);
    params.set("pickupLocation", pickupLocation);
    params.set("saleType", saleType);
    params.set("serviceCharge", serviceCharge.toString());
    params.set("donorReimbursement", donorReimbursement.toString());
    if (preview) params.set("preview", "true");
    return params.toString();
  };

  // 1. Download PDF Action
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await saveInvoiceToDb(true);
      if (pdfBlob && pdfBlobUrl) {
        const link = document.createElement("a");
        link.href = pdfBlobUrl;
        link.download = `Invoice_${invoiceNumber}_${donorName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Invoice #${invoiceNumber} downloaded and recorded in ledger!`);
        return;
      }

      const url = `/api/completed-files/invoice/pdf?${buildPdfParams(false)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to download invoice PDF");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Invoice_${invoiceNumber}_${donorName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Invoice #${invoiceNumber} downloaded and recorded in ledger!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download invoice PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Print PDF Action
  const handlePrintPdf = async () => {
    await saveInvoiceToDb(true);
    if (pdfBlobUrl) {
      const printWin = window.open(pdfBlobUrl, "_blank");
      if (printWin) {
        printWin.focus();
        return;
      }
    }
    const url = `/api/completed-files/invoice/pdf?${buildPdfParams(true)}`;
    window.open(url, "_blank");
  };

  if (!registration) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[92vh] max-h-[92vh] p-0 flex flex-col rounded-2xl bg-background border shadow-2xl overflow-hidden focus:outline-none">
        {/* Top Header - Fixed & Clean */}
        <DialogHeader className="shrink-0 px-6 py-4 border-b bg-card/95 backdrop-blur z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Tax Invoice Preview
                  </DialogTitle>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    {isEgg ? "EGG DONOR" : "SPERM DONOR"}
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>
                    Donor: <strong className="text-foreground">{donorName}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    HUID:{" "}
                    <span className="font-mono text-foreground font-semibold">
                      {huidNo}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    Clinic:{" "}
                    <span className="text-foreground font-medium">
                      {hospitalName}
                    </span>
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Badges & Tab Toggle */}
            <div className="flex items-center gap-2">
              {readOnly ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <Eye className="w-3.5 h-3.5 text-sky-600" /> Official Invoice View
                </div>
              ) : (
                <div className="flex rounded-xl bg-muted p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === "preview"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Live Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === "settings"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Breakdown
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Container for Invoice Paper & Settings */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950/40">
          {activeTab === "preview" ? (
            /* Visual Invoice Paper Container - Centered, Smoothly Scrollable */
            <div className="bg-white text-slate-900 rounded-xl border border-slate-300 shadow-xl p-6 sm:p-8 max-w-3xl mx-auto font-sans text-xs select-text">
              {/* Header Title */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase">
                  INVOICE
                </h1>
              </div>

              {/* Top Two Column Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                {/* Left: Logo & Company Address */}
                <div className="space-y-2">
                  <div className="h-[80px] flex items-center">
                    <img
                      src={MEDIYAZ_LOGO_BASE64}
                      alt="Mediyaz ART Bank"
                      className="h-[80px] max-w-[180px] object-contain"
                    />
                  </div>
                  <div className="border border-slate-700 rounded overflow-hidden text-[11px]">
                    <div className="flex border-b border-slate-400">
                      <div className="w-[24%] bg-slate-50 font-bold p-1 border-r border-slate-400 shrink-0">
                        Address.
                      </div>
                      <div className="w-[76%] p-1 font-bold">
                        {MEDIYAZ_BANK_ISSUER.addressLine1}{" "}
                        {MEDIYAZ_BANK_ISSUER.addressLine2}
                      </div>
                    </div>
                    <div className="flex border-b border-slate-400">
                      <div className="w-[24%] bg-slate-50 font-bold p-1 border-r border-slate-400 shrink-0">
                        Contact No.
                      </div>
                      <div className="w-[76%] font-bold p-1">
                        {MEDIYAZ_BANK_ISSUER.contactNo}
                      </div>
                    </div>
                    <div className="flex border-b border-slate-400">
                      <div className="w-[24%] bg-slate-50 font-bold p-1 border-r border-slate-400 shrink-0">
                        Email :
                      </div>
                      <div className="w-[76%] font-bold p-1">
                        {MEDIYAZ_BANK_ISSUER.email}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-[24%] bg-slate-50 font-bold p-1 border-r border-slate-400 shrink-0">
                        Website:
                      </div>
                      <div className="w-[76%] font-bold p-1">
                        {MEDIYAZ_BANK_ISSUER.website}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Meta Table & BILL TO */}
                <div className="space-y-2">
                  {/* Meta Table */}
                  <div className="border border-slate-700 rounded overflow-hidden text-[11px]">
                    <div className="grid grid-cols-12 border-b border-slate-400">
                      <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        Invoice Date:
                      </div>
                      <div className="col-span-7 font-bold p-1">
                        {invoiceDate}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-slate-400">
                      <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        Invoice No.
                      </div>
                      <div className="col-span-7 font-bold p-1">
                        {invoiceNumber}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-slate-400">
                      <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        SAC Code
                      </div>
                      <div className="col-span-7 font-bold p-1">999317</div>
                    </div>
                    <div className="grid grid-cols-12">
                      <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        GSTIN/UIN:
                      </div>
                      <div className="col-span-7 font-bold p-1">
                        {MEDIYAZ_BANK_ISSUER.gstin}
                      </div>
                    </div>
                  </div>

                  {/* BILL TO Box */}
                  <div className="border border-slate-700 rounded overflow-hidden text-[11px]">
                    <div className="grid grid-cols-12 border-b border-slate-400">
                      <div className="col-span-4 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        BILL TO
                      </div>
                      <div className="col-span-8 font-bold p-1 text-slate-900">
                        {hospitalName}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-slate-400">
                      <div className="col-span-4 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        GSTIN/UIN:
                      </div>
                      <div className="col-span-8 p-1">{hospitalGstin}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-slate-400">
                      <div className="col-span-4 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        Address :
                      </div>
                      <div className="col-span-8 p-1 text-[10px] leading-tight">
                        {hospitalAddress}
                      </div>
                    </div>
                    {Boolean(branchName) && (
                      <div className="grid grid-cols-12 border-b border-slate-400">
                        <div className="col-span-4 bg-slate-50 font-bold p-1 border-r border-slate-400">
                          Branch :
                        </div>
                        <div className="col-span-8 p-1 font-semibold text-slate-800">
                          {branchName}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-12 border-b border-slate-400">
                      <div className="col-span-4 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        {pickupLabel}
                      </div>
                      <div className="col-span-8 font-bold p-1">
                        {pickupDate}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-slate-400">
                      <div className="col-span-4 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        Pickup Location
                      </div>
                      <div className="col-span-8 p-1">{pickupLocation}</div>
                    </div>
                    <div className="grid grid-cols-12">
                      <div className="col-span-4 bg-slate-50 font-bold p-1 border-r border-slate-400">
                        SALE TYPE
                      </div>
                      <div className="col-span-8 font-bold p-1">
                        {saleType}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-width Donor Bar */}
              <div className="border border-slate-700 rounded p-1.5 bg-slate-50 flex items-center justify-between font-bold text-xs mb-3">
                <div>Donor Name : {donorName}</div>
                <div>HUID No. {huidNo}</div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-700 rounded overflow-hidden mb-3">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-700 font-bold text-center">
                      <th className="p-1 border-r border-slate-400 w-6">Sr.</th>
                      <th className="p-1 border-r border-slate-400 text-left">
                        SERVICE DESCRIPTION
                      </th>
                      <th className="p-1 border-r border-slate-400 w-16">
                        HSN/SAC
                      </th>
                      <th className="p-1 border-r border-slate-400 w-10">QTY</th>
                      <th className="p-1 border-r border-slate-400 w-20 text-right">
                        AMOUNY
                      </th>
                      <th
                        colSpan={2}
                        className="p-0 border-r border-slate-400 w-24 text-center"
                      >
                        <div className="border-b border-slate-400 py-0.5">
                          CGST
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="border-r border-slate-400">Rate</span>
                          <span>Amount</span>
                        </div>
                      </th>
                      <th
                        colSpan={2}
                        className="p-0 border-r border-slate-400 w-24 text-center"
                      >
                        <div className="border-b border-slate-400 py-0.5">
                          SGST
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="border-r border-slate-400">Rate</span>
                          <span>Amount</span>
                        </div>
                      </th>
                      <th
                        colSpan={2}
                        className="p-0 border-r border-slate-400 w-24 text-center"
                      >
                        <div className="border-b border-slate-400 py-0.5">
                          {isInterState ? "IGST" : "IGST NOT APPLY"}
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="border-r border-slate-400">Rate</span>
                          <span>Amount</span>
                        </div>
                      </th>
                      <th className="p-1 w-24 text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 1: service charge */}
                    <tr className="border-b border-slate-300">
                      <td className="p-1 border-r border-slate-300 text-center font-semibold">
                        1
                      </td>
                      <td className="p-1 border-r border-slate-300 font-semibold">
                        Service Charge
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        999321
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        1
                      </td>
                      <td className="p-1 border-r border-slate-300 text-right font-medium">
                        {serviceCharge.toFixed(2)}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        {cgstRate > 0 ? `${cgstRate}%` : "-"}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-right">
                        {cgstAmount > 0 ? cgstAmount.toFixed(0) : "-"}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        {sgstRate > 0 ? `${sgstRate}%` : "-"}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-right">
                        {sgstAmount > 0 ? sgstAmount.toFixed(0) : "-"}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        {isInterState ? `${igstRate}%` : "Exempt"}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-right">
                        {isInterState ? igstAmount.toFixed(0) : ""}
                      </td>
                      <td className="p-1 text-right font-bold text-slate-900">
                        {serviceChargeTotal.toFixed(2)}
                      </td>
                    </tr>

                    {/* Row 2: Rembursment Of Oocyte / Sperm Donor Exp */}
                    <tr className="border-b border-slate-300">
                      <td className="p-1 border-r border-slate-300 text-center font-semibold">
                        2
                      </td>
                      <td className="p-1 border-r border-slate-300 font-semibold">
                        {reimbursementDesc}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        999317
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        1
                      </td>
                      <td className="p-1 border-r border-slate-300 text-right font-medium">
                        {donorReimbursement.toFixed(2)}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        -
                      </td>
                      <td className="p-1 border-r border-slate-300 text-right">
                        -
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        -
                      </td>
                      <td className="p-1 border-r border-slate-300 text-right">
                        -
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        -
                      </td>
                      <td className="p-1 border-r border-slate-300 text-right">
                        -
                      </td>
                      <td className="p-1 text-right font-bold text-slate-900">
                        {donorReimbursement.toFixed(2)}
                      </td>
                    </tr>



                    {/* Summary row */}
                    <tr className="border-t border-slate-700">
                      <td
                        colSpan={5}
                        className="p-0 border-r border-slate-700 align-top"
                      >
                        <div className="font-bold text-xs p-1 px-2 border-b border-slate-400">
                          TOTAL
                        </div>
                        <div className="p-2 space-y-2">
                          <div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Total Amount Before Tax In Words
                            </div>
                            <div className="font-bold text-xs text-slate-900 mb-2">
                              {beforeTaxWordsText}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Total Invoice Amount In Words
                            </div>
                            <div className="font-bold text-xs text-slate-900">
                              {wordsText}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td colSpan={7} className="p-0 align-top">
                        <div className="grid grid-cols-12 border-b border-slate-400 p-1 text-[10px]">
                          <span className="col-span-7 font-bold text-slate-900">
                            Total Amount Before Tax
                          </span>
                          <span className="col-span-5 text-right font-bold text-slate-900">
                            {totalBeforeTax.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 border-b border-slate-400 p-1 text-[10px]">
                          <span className="col-span-7 font-bold">
                            CGST @ 9 %
                          </span>
                          <span className="col-span-5 text-right font-medium">
                            {cgstAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 border-b border-slate-400 p-1 text-[10px]">
                          <span className="col-span-7 font-bold">
                            SGST @ 9 %
                          </span>
                          <span className="col-span-5 text-right font-medium">
                            {sgstAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 border-b border-slate-400 p-1 text-[10px]">
                          <span className="col-span-7 font-bold">
                            IGST @ 18%
                          </span>
                          <span className="col-span-5 text-right font-medium">
                            {igstAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 bg-slate-100 p-1 text-xs font-black">
                          <span className="col-span-7 text-slate-900">
                            Total Amount After Tax
                          </span>
                          <span className="col-span-5 text-right text-teal-700">
                            {totalAmountAfterTax.toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bank Details & Authorised Signatory Box */}
              <div className="grid grid-cols-12 border border-slate-700 rounded overflow-hidden text-[10px] mb-3">
                {/* Bank Details Table */}
                <div className="col-span-7 border-r border-slate-700 text-[10px]">
                  <div className="bg-slate-100 font-bold p-1 text-[11px] underline border-b border-slate-400 px-2">
                    Bank Datails
                  </div>
                  <div className="grid grid-cols-12 border-b border-slate-400">
                    <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                      Bank A/C, Name.
                    </div>
                    <div className="col-span-7 font-bold p-1">
                      {MEDIYAZ_BANK_ISSUER.bankName}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-b border-slate-400">
                    <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                      Bank A/C, No.
                    </div>
                    <div className="col-span-7 font-bold p-1">
                      {MEDIYAZ_BANK_ISSUER.bankAccountNo}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-b border-slate-400">
                    <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                      IFSC:
                    </div>
                    <div className="col-span-7 font-bold p-1">
                      {MEDIYAZ_BANK_ISSUER.ifsc}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-b border-slate-400">
                    <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                      MICR:
                    </div>
                    <div className="col-span-7 font-bold p-1">
                      {MEDIYAZ_BANK_ISSUER.micr}
                    </div>
                  </div>
                  <div className="grid grid-cols-12">
                    <div className="col-span-5 bg-slate-50 font-bold p-1 border-r border-slate-400">
                      Pan No.
                    </div>
                    <div className="col-span-7 font-bold p-1">
                      {MEDIYAZ_BANK_ISSUER.panNo}
                    </div>
                  </div>
                </div>

                {/* Signatory Box */}
                <div className="col-span-5 flex flex-col justify-between text-center bg-slate-50/30">
                  <div className="text-[9px] text-slate-800 p-1 px-2 border-b border-slate-400">
                    Certified that the particuler given above true and correct
                  </div>
                  <div className="p-2 flex-1 flex flex-col items-center justify-between">
                    <div className="font-bold text-[11px] text-sky-700">
                      For {MEDIYAZ_BANK_ISSUER.name}
                    </div>
                    <img
                      src={MEDIYAZ_SIGNATURE_BASE64 || "/images/signature.png"}
                      alt="Authorised Signature"
                      className="h-10 max-w-[150px] object-contain my-1"
                    />
                    <div className="font-bold text-[11px] text-sky-700">
                      Proprietor
                    </div>
                  </div>
                  <div className="p-1 px-2 border-t border-slate-400 font-bold text-[10px] text-slate-900">
                    {MEDIYAZ_BANK_ISSUER.signatoryTitle}
                  </div>
                </div>
              </div>

              {/* TERM & CONDITIONS */}
              <div className="border border-slate-700 rounded p-2 text-[9px] leading-tight space-y-1 mb-2">
                <div className="font-bold text-[10px] uppercase">
                  TERM & CONDITIONS
                </div>
                {INVOICE_TERMS_AND_CONDITIONS.map((term, i) => (
                  <div key={i}>{term}</div>
                ))}
              </div>

              {/* NOTES */}
              <div className="border border-slate-700 rounded p-2 text-[9px] leading-tight space-y-1">
                <div className="font-bold text-[10px] uppercase">NOTES:-</div>
                {INVOICE_NOTES.map((note, i) => (
                  <div key={i}>{note}</div>
                ))}
              </div>
            </div>
          ) : (
            /* Tab 2: Edit Invoice Settings & Breakdown */
            <div className="max-w-3xl mx-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    Invoice Number
                  </label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                    placeholder="e.g. 54"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    Invoice Date
                  </label>
                  <Input
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="DD.MM.YYYY"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">
                    {pickupLabel}
                  </label>
                  <Input
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="h-9 text-xs"
                    placeholder="DD.MM.YYYY"
                  />
                </div>
              </div>

              {/* ART Clinic / BILL TO Details */}
              <div className="p-3.5 rounded-xl border bg-card space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" /> BILL TO —
                  ART Clinic Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Clinic / Entity Name
                    </label>
                    <Input
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="h-9 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Clinic GSTIN / UIN
                    </label>
                    <Input
                      value={hospitalGstin}
                      onChange={(e) => setHospitalGstin(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Pickup Location
                    </label>
                    <Input
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Sale Type & GST Mode
                    </label>
                    <select
                      value={saleType}
                      onChange={(e) =>
                        setSaleType(e.target.value as "STATE" | "INTER-STATE")
                      }
                      className="w-full h-9 px-3 rounded-lg border bg-background text-xs font-semibold"
                    >
                      <option value="STATE">
                        STATE (Delhi Intra-state: CGST 9% + SGST 9%)
                      </option>
                      <option value="INTER-STATE">
                        INTER-STATE (Outside Delhi: IGST 18%)
                      </option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Full Billing Address
                    </label>
                    <Input
                      value={hospitalAddress}
                      onChange={(e) => setHospitalAddress(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Price Breakdown Details */}
              <div className="p-3.5 rounded-xl border bg-card space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-blue-600" /> Deal & Price Breakdown
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-300">
                    Formula: Reimbursement = Deal Price - Service Charge
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. Total Hospital Deal Price */}
                  <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                    <label className="font-bold text-teal-800 dark:text-teal-300 block mb-1">
                      1. Total Deal Price (Gross)
                    </label>
                    <Input
                      type="number"
                      value={totalDealPrice}
                      onChange={(e) => handleTotalDealChange(parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs font-bold text-teal-700"
                      placeholder="e.g. 60000"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Hospital Consideration: <strong>₹{totalDealPrice.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  {/* 2. Service Charge */}
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <label className="font-bold text-blue-800 dark:text-blue-300 block mb-1">
                      2. Service Charge (18% GST)
                    </label>
                    <Input
                      type="number"
                      value={serviceCharge}
                      onChange={(e) => handleServiceChargeChange(parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs font-bold text-blue-700"
                      placeholder="e.g. 5000"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      GST (18%): <strong>₹{(isInterState ? igstAmount : cgstAmount + sgstAmount).toFixed(0)}</strong> • Total: <strong>₹{serviceChargeTotal.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  {/* 3. Donor Reimbursement */}
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <label className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                      3. {reimbursementDesc} (Exempt)
                    </label>
                    <Input
                      type="number"
                      value={donorReimbursement}
                      onChange={(e) => handleReimbursementChange(parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs font-bold text-amber-700"
                      placeholder="e.g. 55000"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      SAC 999317 (Pure reimbursement of expenses)
                    </div>
                  </div>
                </div>

                {/* Calculation Info Banner */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                  <div>
                    Deal: <strong className="text-foreground">₹{totalDealPrice.toLocaleString("en-IN")}</strong> = Service Charge <strong className="text-foreground">₹{serviceCharge.toLocaleString("en-IN")}</strong> + Donor Reimbursement <strong className="text-foreground">₹{donorReimbursement.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="text-teal-600 font-semibold">
                    18% GST applies strictly to Service Charge
                  </div>
                </div>

                {/* Total Summary banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-muted-foreground font-semibold uppercase">
                      Total Invoice Value (With Tax):
                    </div>
                    <div className="text-xl font-black text-teal-700 dark:text-teal-300">
                      ₹{totalAmountAfterTax.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground max-w-sm">
                    <span className="font-bold text-foreground">In Words: </span>
                    {wordsText}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer Toolbar */}
        <div className="shrink-0 px-6 py-3 border-t bg-card/95 backdrop-blur flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!readOnly && (
              <Button
                type="button"
                onClick={() => saveInvoiceToDb(false)}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 gap-1.5 shadow-sm font-bold cursor-pointer"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Receipt className="w-3.5 h-3.5" />
                )}
                Save Invoice to Tracker & Ledger
              </Button>
            )}

            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-9 px-4 gap-1.5 shadow-sm font-semibold cursor-pointer"
            >
              {isDownloading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Download Invoice PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handlePrintPdf}
              className="rounded-xl text-xs h-9 px-4 gap-1.5 font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs h-9 px-4 font-medium cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
