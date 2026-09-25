"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Building2,
  FileText,
  Check,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Award,
  Dna,
} from "lucide-react";
import { toast } from "sonner";
import { SPERM_SECTIONS } from "@/features/pdf-generator/sperm/types";

interface SpermDonorPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
  onRegistrationUpdated?: (updatedReg: any) => void;
}

export function SpermDonorPrintModal({
  isOpen,
  onClose,
  registration,
  onRegistrationUpdated,
}: SpermDonorPrintModalProps) {
  const [currentReg, setCurrentReg] = useState<any>(registration);
  const [withHeader, setWithHeader] = useState<boolean>(true);
  const [selectedSections, setSelectedSections] = useState<string[]>([]); // empty = all sections
  const [issuingCert, setIssuingCert] = useState<boolean>(false);

  const uploadedAffidavit = currentReg?.documents?.affidavit || currentReg?.affidavit;
  const hasUploadedAffidavit = Boolean(uploadedAffidavit?.url);
  const [affidavitType, setAffidavitType] = useState<"uploaded" | "template" | "both">(
    hasUploadedAffidavit ? "uploaded" : "template"
  );

  const sectionsList = SPERM_SECTIONS;

  useEffect(() => {
    if (registration) {
      setCurrentReg(registration);
      setSelectedSections([]);
      setWithHeader(true);
      const aff = registration.documents?.affidavit || registration.affidavit;
      setAffidavitType(aff?.url ? "uploaded" : "template");
    }
  }, [registration, isOpen]);

  if (!currentReg) return null;

  // Check viral markers and certificate
  const hasViralFile = Boolean(
    currentReg.labReports?.viralMarkersReport?.url ||
      (Array.isArray(currentReg.labReports?.viralMarkers) &&
        currentReg.labReports?.viralMarkers.some((f: any) => Boolean(f?.url))) ||
      currentReg.labReports?.viralMarkers?.url
  );
  const inv = currentReg.investigations || currentReg.medicalInfo || {};
  const hiv = Boolean(inv.hivStatus && String(inv.hivStatus).trim().length > 0);
  const hbsag = Boolean(inv.hbsagStatus && String(inv.hbsagStatus).trim().length > 0);
  const hcv = Boolean(inv.hepatitisCStatus && String(inv.hepatitisCStatus).trim().length > 0);
  const vdrl = Boolean(inv.vdrl && String(inv.vdrl).trim().length > 0);
  const hasTests = hiv && hbsag && hcv && vdrl;
  const isViralEntered = hasViralFile || hasTests;
  const isCertIssued = Boolean(currentReg.certificateIssued === true || currentReg.isCertificateIssued === true);

  // Handle section toggle ("single single" selection vs "all")
  const handleToggleSection = (key: string) => {
    if (key === "certificate" && !isCertIssued) {
      if (isViralEntered) {
        toast.warning(
          "You haven't issued the certificate yet. Click 'Issue Certificate Now' above to issue it.",
          { duration: 4500 }
        );
      } else {
        toast.error(
          "You haven't issued the certificate. Please enter/upload all viral marker reports first.",
          { duration: 4500 }
        );
      }
      return;
    }

    const availableSections = sectionsList.map((s) => s.key);

    if (selectedSections.length === 0) {
      const next = availableSections.filter((k) => k !== key);
      setSelectedSections(next);
    } else {
      if (selectedSections.includes(key)) {
        const next = selectedSections.filter((k) => k !== key);
        setSelectedSections(next);
      } else {
        const next = [...selectedSections, key];
        if (next.length === availableSections.length) {
          setSelectedSections([]);
        } else {
          setSelectedSections(next);
        }
      }
    }
  };

  const handleSelectAll = () => {
    setSelectedSections([]);
  };

  const handleIssueCertificate = async () => {
    const regId = currentReg.registrationId || currentReg._id;
    if (!regId) return;

    setIssuingCert(true);
    try {
      const now = new Date();
      const res = await fetch(`/api/donor-registrations/sperm/${regId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateIssued: true,
          certificateIssuedAt: now,
          certificateIssuedBy: "Admin",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update registration");
      }

      const merged = {
        ...currentReg,
        ...(data.registration || {}),
        certificateIssued: true,
        certificateIssuedAt: now,
        certificateIssuedBy: "Admin",
      };

      setCurrentReg(merged);
      if (onRegistrationUpdated) {
        onRegistrationUpdated(merged);
      }

      toast.success(
        "Certificate in terms of Rule 10 issued successfully! Certificate section is now unlocked."
      );
    } catch (err: any) {
      console.error("Failed to issue certificate:", err);
      toast.error(err.message || "Failed to issue certificate.");
    } finally {
      setIssuingCert(false);
    }
  };

  // Execute print in new window
  const handleExecutePrint = (forceWithHeader?: boolean) => {
    const regId = currentReg.registrationId || currentReg._id;
    if (!regId) return;

    const useHeader = forceWithHeader !== undefined ? forceWithHeader : withHeader;

    let effectiveSections = [...selectedSections];
    if (effectiveSections.length === 0 && !isCertIssued) {
      effectiveSections = sectionsList
        .map((s) => s.key)
        .filter((k) => k !== "certificate");
    }

    const sectionsParam =
      effectiveSections.length > 0 ? `&sections=${effectiveSections.join(",")}` : "";

    const affidavitTypeParam = `&affidavitType=${affidavitType}`;
    const printUrl = `/admin/manage-registrations/${regId}/print?withHeader=${useHeader}${sectionsParam}${affidavitTypeParam}`;
    window.open(printUrl, "_blank");
    onClose();
  };

  const isCompleteFile = selectedSections.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Printer className="w-5 h-5 text-teal-600" />
            Sperm Donor Print Options &amp; Documents
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure letterhead header, choose individual sections or all documents, and manage Rule 10 certification for semen donor #{currentReg.registrationId || currentReg.donorId} ({currentReg.personalInfo?.fullName})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 text-xs">
          {/* Viral Marker & Certificate Notice / Action Bar */}
          {!isCertIssued && (
            <div className="p-3.5 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                      Certificate (Rule 10) Not Issued
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                      {isViralEntered ? (
                        <>
                          All viral marker reports (HIV, HBV, HCV, VDRL) are entered.
                          You can now issue the statutory certificate under Rule 10 of ART Rules, 2022.
                        </>
                      ) : (
                        <>
                          Viral marker reports are not completely entered yet. Please upload the viral markers PDF report or fill screening test results to issue the certificate.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {isViralEntered && (
                  <Button
                    size="sm"
                    disabled={issuingCert}
                    onClick={handleIssueCertificate}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs h-8 px-3 shrink-0 gap-1.5 shadow-sm"
                  >
                    {issuingCert ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Award className="w-3.5 h-3.5" />
                    )}
                    Issue Certificate Now
                  </Button>
                )}
              </div>
            </div>
          )}

          {isCertIssued && (
            <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong className="font-semibold">Rule 10 Certificate is Issued</strong>
                  {currentReg.certificateIssuedAt && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 ml-1.5">
                      (Issued on {new Date(currentReg.certificateIssuedAt).toLocaleDateString("en-IN")})
                    </span>
                  )}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Unlocked
              </span>
            </div>
          )}

          {/* Letterhead Configuration */}
          <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" /> Letterhead &amp; Header
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setWithHeader(true)}
                className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition ${
                  withHeader
                    ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-1 ring-teal-500"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div>
                  <div className="font-bold text-foreground text-xs">With Letterhead Header</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Includes Mediyaz ART Bank logo, registered clinic address, licensing &amp; contact info.
                  </div>
                </div>
                {withHeader && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setWithHeader(false)}
                className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition ${
                  !withHeader
                    ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-1 ring-teal-500"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div>
                  <div className="font-bold text-foreground text-xs">Blank / Pre-Printed Stationery</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    No top letterhead header — reserves top space for your physical pre-printed letterhead sheets.
                  </div>
                </div>
                {!withHeader && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
              </button>
            </div>
          </div>

          {/* Affidavit Source Options */}
          <div className="p-4 rounded-2xl border bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" /> Affidavit Document Selection
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAffidavitType("uploaded")}
                disabled={!hasUploadedAffidavit}
                className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                  !hasUploadedAffidavit
                    ? "opacity-50 cursor-not-allowed bg-muted/10 border-dashed"
                    : affidavitType === "uploaded"
                    ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-1 ring-teal-500 font-bold"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Uploaded Affidavit</span>
                  {hasUploadedAffidavit && <span className="text-[10px] text-emerald-600 font-normal">Available</span>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {hasUploadedAffidavit
                    ? "Print actual signed &amp; notarized copy"
                    : "No affidavit uploaded yet"}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAffidavitType("template")}
                className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                  affidavitType === "template"
                    ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-1 ring-teal-500 font-bold"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="font-bold text-xs">Mediyaz Form 14/15</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Official 3-page statutory template
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAffidavitType("both")}
                disabled={!hasUploadedAffidavit}
                className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                  !hasUploadedAffidavit
                    ? "opacity-50 cursor-not-allowed bg-muted/10 border-dashed"
                    : affidavitType === "both"
                    ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-1 ring-teal-500 font-bold"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="font-bold text-xs">Both Copies</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Append template + uploaded scan
                </div>
              </button>
            </div>
          </div>

          {/* Section Selection ("Single Single" Print or Complete File) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Document Sections to Print
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Select individual documents to print single pages, or choose &quot;Print Complete Dossier&quot;.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className={`h-7 rounded-xl text-[11px] font-semibold ${
                  isCompleteFile
                    ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50"
                    : ""
                }`}
              >
                {isCompleteFile ? "✓ Complete Dossier (All)" : "Select All"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sectionsList.map((sec) => {
                const isSelected =
                  isCompleteFile || selectedSections.includes(sec.key);
                const isCertLocked = sec.key === "certificate" && !isCertIssued;

                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => handleToggleSection(sec.key)}
                    disabled={isCertLocked}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isCertLocked
                        ? "opacity-50 bg-muted/20 border-dashed cursor-not-allowed"
                        : isSelected
                        ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-1 ring-teal-500 font-medium"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSelected && !isCertLocked
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "border-muted-foreground/30 bg-background"
                        }`}
                      >
                        {isSelected && !isCertLocked && (
                          <Check className="w-3 h-3 stroke-[3]" />
                        )}
                      </div>
                      <span className="text-xs text-foreground font-medium">
                        {sec.label}
                      </span>
                    </div>

                    {isCertLocked && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                        Issue First
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-5 border-t mt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExecutePrint(false)}
              className="rounded-xl text-xs h-9 px-3.5 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950"
              title="Print without letterhead header"
            >
              Print (No Header)
            </Button>

            <Button
              type="button"
              onClick={() => handleExecutePrint()}
              className="rounded-xl text-xs h-9 px-4 font-bold bg-[#285b63] hover:bg-[#1d464d] text-white shadow-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              {isCompleteFile
                ? "Print Complete File"
                : `Print Selected (${selectedSections.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
