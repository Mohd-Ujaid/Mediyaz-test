"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Dna,
  Edit3,
  Calendar,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Activity,
  Printer,
  FileText,
  ExternalLink,
  Shield,
  Eye,
  FileCheck
} from "lucide-react";
import { InAppDocumentViewer } from "@/components/ui/in-app-document-viewer";

interface PreviousDonorViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any | null;
  onEdit: (record: any) => void;
}

export function PreviousDonorViewDialog({
  open,
  onOpenChange,
  record,
  onEdit,
}: PreviousDonorViewDialogProps) {
  const [viewerFile, setViewerFile] = useState<{ url: string; name?: string } | null>(null);

  if (!record) return null;

  const isEgg = record.donorType === "egg";
  const p = record.personalInfo || {};
  const c = record.contactInfo || {};
  const m = record.medicalInfo || {};
  const v = record.viralMarkers || {};
  const egg = record.eggDonorDetails || {};
  const sperm = record.spermDonorDetails || {};
  const docs = record.documents || {};
  const labs = record.labReports || {};

  const handlePrint = () => {
    window.print();
  };

  const getDocUrl = (doc: any) => {
    if (!doc) return null;
    return typeof doc === "string" ? doc : doc.url;
  };

  const getDocName = (doc: any, fallback: string) => {
    if (!doc) return fallback;
    if (typeof doc === "string") return fallback;
    return doc.name || doc.fileName || fallback;
  };

  const docList = [
    { label: "Viral Marker Report", doc: labs.viralMarkersReport || (Array.isArray(labs.viralMarkers) ? labs.viralMarkers[0] : labs.viralMarkers), tag: "Lab Report" },
    ...(isEgg
      ? [
          { label: "Life Insurance Policy", doc: labs.lifeInsurance || labs.insurance || docs.insurance, tag: "Insurance" },
          { label: "Health Insurance Policy", doc: labs.healthInsurance, tag: "Insurance" },
        ]
      : []),
    { label: "Blood Report", doc: labs.bloodReport, tag: "Lab Report" },
    ...(isEgg ? [] : [{ label: "Semen Analysis Report", doc: labs.semenAnalysisReport, tag: "Lab Report" }]),
    { label: "Donor Photo", doc: docs.passportPhoto, tag: "Identity" },
    { label: "Aadhaar Card (Front)", doc: docs.aadhaarFront, tag: "Identity" },
    { label: "Aadhaar Card (Back)", doc: docs.aadhaarBack, tag: "Identity" },
    { label: "Donor Signature", doc: docs.signature, tag: "Identity" },
    { label: "Affidavit (Form 13 Signed)", doc: docs.affidavit, tag: "Statutory" },
    { label: "Form 13 Consent PDF", doc: docs.form13, tag: "Statutory" },
    { label: "Other Document", doc: docs.otherDocument, tag: "Supporting" },
  ].filter((item) => Boolean(getDocUrl(item.doc)));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[96vw] xl:max-w-7xl max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border shadow-2xl">
          <DialogHeader className="p-5 border-b bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {p.fullName || "Historical Record"}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={
                      isEgg
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-teal-50 text-teal-700 border-teal-200"
                    }
                  >
                    {isEgg ? "Egg Donor" : "Sperm Donor"}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {record.recordCode || "No Code"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Legacy ID: {record.legacyId || "—"} • Saved on:{" "}
                  {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "—"}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(record);
                  }}
                  className="text-xs bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Record
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Key Identity Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border bg-slate-50/70 dark:bg-slate-800/40">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Aadhaar Number
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {p.aadhaarNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Blood Group
                </span>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                  {p.bloodGroup || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Age / Gender
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {p.age ? `${p.age} Yrs` : "—"} / {p.gender || (isEgg ? "Female" : "Male")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Mobile Number
                </span>
                <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {c.mobileNumber || "—"}
                </span>
              </div>
            </div>

            {/* UPLOADED DOCUMENTS & REPORTS SECTION */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center justify-between border-b pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-teal-600" />
                  Uploaded Documents & Reports ({docList.length})
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Viral Markers, Insurance & KYC Files
                </span>
              </h4>

              {docList.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                  No documents or reports uploaded for this historical record.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {docList.map((item, idx) => {
                    const url = getDocUrl(item.doc)!;
                    const fileName = getDocName(item.doc, item.label);
                    const isPdf = url.toLowerCase().includes(".pdf");

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                              {item.tag}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {isPdf ? "PDF" : "IMAGE"}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate" title={fileName}>
                            {fileName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t">
                          <button
                            type="button"
                            onClick={() => setViewerFile({ url, name: item.label })}
                            className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 py-1 px-2 rounded-md transition"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-1 text-slate-500 hover:text-slate-800 rounded-md border"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Personal & Physical Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5 border-b pb-1">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                Personal & Demographics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Marital Status</span>
                  <span className="font-medium">{p.maritalStatus || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Education</span>
                  <span className="font-medium">{p.education || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Occupation</span>
                  <span className="font-medium">{p.occupation || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Height & Weight</span>
                  <span className="font-medium">
                    {p.height || "—"} / {p.weight || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Complexion</span>
                  <span className="font-medium">{p.complexion || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Eye / Hair Color</span>
                  <span className="font-medium">
                    {p.eyeColor || "—"} / {p.hairColor || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">PAN Number</span>
                  <span className="font-mono font-medium">{p.panNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Religion</span>
                  <span className="font-medium">{p.religion || "—"}</span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5 border-b pb-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                Address & Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Email Address</span>
                  <span className="font-medium">{c.emailAddress || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">City & District</span>
                  <span className="font-medium">
                    {c.city || "—"}{c.district ? `, ${c.district}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">State & Pincode</span>
                  <span className="font-medium">
                    {c.state || "—"} {c.pincode ? `(${c.pincode})` : ""}
                  </span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-[10px] text-muted-foreground block">Current Address</span>
                  <span className="font-medium">{c.currentAddress || "—"}</span>
                </div>
              </div>
            </div>

            {/* Clinical & Viral Markers */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5 border-b pb-1">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                Screening & Viral Markers
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                  <span className="text-[10px] text-muted-foreground block">HIV I & II</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{v.hiv || "—"}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                  <span className="text-[10px] text-muted-foreground block">HBsAg (Hep B)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{v.hbsag || "—"}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                  <span className="text-[10px] text-muted-foreground block">HCV (Hep C)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{v.hcv || "—"}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                  <span className="text-[10px] text-muted-foreground block">VDRL</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{v.vdrl || "—"}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                  <span className="text-[10px] text-muted-foreground block">Thalassemia</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{v.thalassemia || "—"}</span>
                </div>
              </div>
            </div>

            {/* Donor Specific Records */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5 border-b pb-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                {isEgg ? "Egg Donation Cycle Info" : "Semen Analysis Details"}
              </h4>
              {isEgg ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Menstrual Cycle</span>
                    <span className="font-medium">{egg.menstrualCycleDetails || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Deliveries / Abortions</span>
                    <span className="font-medium">
                      {egg.numberOfDeliveries || "—"} / {egg.numberOfAbortions || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Eggs Retrieved (Mature)</span>
                    <span className="font-medium">
                      {egg.numberOfEggsRetrieved || "—"} ({egg.matureEggsCount || "—"})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Compensation</span>
                    <span className="font-medium">{egg.compensationPaid ? `₹${egg.compensationPaid}` : "—"}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Semen Volume</span>
                    <span className="font-medium">{sperm.semenVolume || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Motility & Count</span>
                    <span className="font-medium">
                      {sperm.motility || "—"} / {sperm.spermCount || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Total Vials</span>
                    <span className="font-medium">{sperm.totalVials || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Compensation</span>
                    <span className="font-medium">{sperm.compensationPaid ? `₹${sperm.compensationPaid}` : "—"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hospital & Archive Notes */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5 border-b pb-1">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                Clinic & Physical Archive Notes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Hospital / Clinic</span>
                  <span className="font-medium">{record.hospitalOrClinic || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Doctor Name</span>
                  <span className="font-medium">{record.doctorName || "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Registration Date</span>
                  <span className="font-medium">{record.registrationDate || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Schedule Date</span>
                  <span className="font-medium">{record.scheduleDate || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Pickup Date</span>
                  <span className="font-medium">{record.pickupDate || "—"}</span>
                </div>
              </div>
              {record.notes && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs">
                  <span className="text-[10px] text-muted-foreground block font-bold mb-1">Remarks / Location</span>
                  <p className="whitespace-pre-wrap">{record.notes}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* In-App Document Viewer */}
      {viewerFile && (
        <InAppDocumentViewer
          isOpen={Boolean(viewerFile)}
          onClose={() => setViewerFile(null)}
          title={viewerFile.name || "Document Preview"}
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          donorName={p.fullName || undefined}
          donorId={record.recordCode || undefined}
        />
      )}
    </>
  );
}
