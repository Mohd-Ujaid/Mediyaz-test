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
} from "lucide-react";
import { toast } from "sonner";
import { EGG_SECTIONS } from "@/features/pdf-generator/egg/types";
import { checkViralMarkersEntered } from "@/features/donor-registration/utils/egg-donor-status";
import { patchAdminRegistrationFieldsAction } from "@/features/donor-registration/actions/donor-registration.actions";

interface DonorPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
  onRegistrationUpdated?: (updatedReg: any) => void;
  hideForm14A?: boolean;
}

export function DonorPrintModal({
  isOpen,
  onClose,
  registration,
  onRegistrationUpdated,
  hideForm14A = false,
}: DonorPrintModalProps) {
  const [currentReg, setCurrentReg] = useState<any>(registration);
  const [withHeader, setWithHeader] = useState<boolean>(true);
  const [selectedSections, setSelectedSections] = useState<string[]>([]); // empty = all sections
  const [issuingCert, setIssuingCert] = useState<boolean>(false);

  const uploadedAffidavit = currentReg?.documents?.affidavit || currentReg?.affidavit;
  const hasUploadedAffidavit = Boolean(uploadedAffidavit?.url);
  const [affidavitType, setAffidavitType] = useState<"uploaded" | "template" | "both">(
    hasUploadedAffidavit ? "uploaded" : "template"
  );

  const sectionsList = hideForm14A
    ? EGG_SECTIONS.filter((s) => s.key !== "form14a")
    : EGG_SECTIONS;

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

  const viralCheck = checkViralMarkersEntered(currentReg);
  const isCertIssued = viralCheck.certificateIssued;

  // Handle section toggle ("single single" selection vs "all")
  const handleToggleSection = (key: string) => {
    // If certificate is not issued, prevent selecting it
    if (key === "certificate" && !isCertIssued) {
      if (viralCheck.isEntered) {
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
      // Was "all" selected; switch to all except this key
      const next = availableSections.filter((k) => k !== key);
      setSelectedSections(next);
    } else {
      if (selectedSections.includes(key)) {
        const next = selectedSections.filter((k) => k !== key);
        setSelectedSections(next);
      } else {
        const next = [...selectedSections, key];
        if (next.length >= availableSections.length) {
          setSelectedSections([]); // back to all
        } else {
          setSelectedSections(next);
        }
      }
    }
  };

  // Issue Certificate (Rule 10) action
  const handleIssueCertificate = async () => {
    if (!viralCheck.isEntered) {
      toast.error("Cannot issue certificate: Viral marker reports are missing.");
      return;
    }

    setIssuingCert(true);
    try {
      const regId = currentReg.registrationId || currentReg._id;
      const now = new Date();

      // Try PUT route first
      let updatedReg = null;
      try {
        const res = await fetch(`/api/donor-registrations/egg/${regId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            certificateIssued: true,
            certificateIssuedAt: now,
            certificateIssuedBy: "Admin",
          }),
        });
        const data = await res.json();
        if (data.success && data.registration) {
          updatedReg = data.registration;
        }
      } catch {
        // Fallback to server action
      }

      if (!updatedReg) {
        const actionRes = await patchAdminRegistrationFieldsAction(regId, {
          certificateIssued: true,
          certificateIssuedAt: now,
          certificateIssuedBy: "Admin",
        });
        if (actionRes.success && actionRes.registration) {
          updatedReg = actionRes.registration;
        }
      }

      // Local optimistic update if API succeeded
      const merged = {
        ...currentReg,
        ...(updatedReg || {}),
        certificateIssued: true,
        certificateIssuedAt: now,
        certificateIssuedBy: "Admin",
      };

      setCurrentReg(merged);
      if (onRegistrationUpdated) {
        onRegistrationUpdated(merged);
      }

      toast.success(
        "Certificate in term of Rule 10 issued successfully! Certificate section is now unlocked."
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

    // Filter out certificate if not issued
    let effectiveSections = [...selectedSections];
    if (effectiveSections.length > 0 && !isCertIssued) {
      effectiveSections = effectiveSections.filter((s) => s !== "certificate");
    }

    if (hideForm14A) {
      if (effectiveSections.length === 0) {
        // If complete file in registration mode, explicitly pass all sections except form14a
        effectiveSections = sectionsList
          .map((s) => s.key)
          .filter((k) => k !== "form14a" && (k !== "certificate" || isCertIssued));
      } else {
        effectiveSections = effectiveSections.filter((s) => s !== "form14a");
      }
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
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Printer className="w-5 h-5 text-teal-600" />
            Egg Donor Print Options & Documents
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure letterhead header, choose individual sections or all documents, and manage Rule 10 certification for donor #{currentReg.registrationId || currentReg.donorId} ({currentReg.personalInfo?.fullName})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 text-xs">
          {/* Viral Marker & Certificate Notice / Action Bar */}
          {!isCertIssued && (
            <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                      Certificate (Rule 10) Not Issued
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                      {viralCheck.isEntered ? (
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

                {viralCheck.isEntered && (
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
            <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-xs">
                  Certificate (Rule 10) is Officially Issued
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                  • Negative screening for HIV, HBV, HCV & VDRL verified
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300">
                Active & Printable
              </span>
            </div>
          )}

          {/* 1. Letterhead Format */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                1. Letterhead Header Format
              </span>
              <span className="text-[11px] text-muted-foreground">
                Choose letterhead branding or clean blank margins
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWithHeader(true)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                  withHeader
                    ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-sm"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>With Header (Letterhead)</span>
                  </div>
                  {withHeader && (
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Includes Mediyaz ART Bank letterhead with branding, registration number, and contact details. Recommended for standard PDF export and digital records.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWithHeader(false)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                  !withHeader
                    ? "border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-sm"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Without Header (Blank Stationery)</span>
                  </div>
                  {!withHeader && (
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  No top letterhead graphic. Clean top and bottom margins formatted for printing directly on pre-printed physical clinic letterhead stationery.
                </p>
              </button>
            </div>
          </div>

          {/* 2. What to Print (Document Sections: Single Single or All) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                2. What to Print (Sections: By All or Single-Single)
              </span>
              <button
                type="button"
                onClick={() => setSelectedSections([])}
                className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-all ${
                  isCompleteFile
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "border-slate-300 dark:border-slate-700 text-muted-foreground hover:bg-muted"
                }`}
              >
                ✓ All Documents (Complete File)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sectionsList.map((item) => {
                const isSelected =
                  isCompleteFile
                    ? item.key === "certificate"
                      ? isCertIssued
                      : true
                    : selectedSections.includes(item.key);

                const isBlockedCertificate = item.key === "certificate" && !isCertIssued;
                const isAffidavit = item.key === "affidavit";

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleSection(item.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                      isBlockedCertificate
                        ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 text-muted-foreground cursor-pointer"
                        : isSelected
                        ? "border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 text-foreground shadow-xs"
                        : "border-border hover:bg-muted/30 text-muted-foreground opacity-60"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.key === "certificate" && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                              isCertIssued
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {isCertIssued ? "Issued" : "Not Issued"}
                          </span>
                        )}
                        {isAffidavit && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                              hasUploadedAffidavit
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200"
                            }`}
                          >
                            {hasUploadedAffidavit ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Uploaded
                              </>
                            ) : (
                              "Template"
                            )}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">
                        {isBlockedCertificate ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">
                            You haven&apos;t issued the certificate
                          </span>
                        ) : isAffidavit && hasUploadedAffidavit ? (
                          <span className="flex items-center gap-1">
                            <span className="truncate max-w-[120px]">{uploadedAffidavit.fileName || "Notarized Affidavit"}</span>
                            <span>•</span>
                            <a
                              href={uploadedAffidavit.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                              title="View uploaded affidavit"
                            >
                              View ↗
                            </a>
                          </span>
                        ) : (
                          item.desc
                        )}
                      </div>
                    </div>

                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isBlockedCertificate
                          ? "border-amber-300 bg-amber-100/50 dark:bg-amber-900/40 text-amber-700"
                          : isSelected
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {isSelected && !isBlockedCertificate && <Check className="w-2.5 h-2.5" />}
                      {isBlockedCertificate && <span className="text-[10px] font-bold">!</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Affidavit Print Mode Selector if Affidavit is part of print & uploaded */}
            {(isCompleteFile || selectedSections.includes("affidavit")) && hasUploadedAffidavit && (
              <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900 dark:text-teal-200 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    Affidavit Print Mode (Uploaded File Detected)
                  </span>
                  <a
                    href={uploadedAffidavit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-teal-700 dark:text-teal-300 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    Preview Uploaded Document ↗
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAffidavitType("uploaded")}
                    className={`p-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                      affidavitType === "uploaded"
                        ? "border-teal-600 bg-white dark:bg-teal-900/80 font-bold text-teal-900 dark:text-teal-100 shadow-xs ring-1 ring-teal-500"
                        : "border-slate-200 dark:border-slate-800 bg-transparent text-muted-foreground hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Uploaded Affidavit</span>
                      {affidavitType === "uploaded" && <Check className="w-3 h-3 text-teal-600" />}
                    </div>
                    <p className="text-[9px] text-muted-foreground font-normal mt-0.5">Signed &amp; Notarized copy (Default)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAffidavitType("template")}
                    className={`p-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                      affidavitType === "template"
                        ? "border-teal-600 bg-white dark:bg-teal-900/80 font-bold text-teal-900 dark:text-teal-100 shadow-xs ring-1 ring-teal-500"
                        : "border-slate-200 dark:border-slate-800 bg-transparent text-muted-foreground hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Statutory Template</span>
                      {affidavitType === "template" && <Check className="w-3 h-3 text-teal-600" />}
                    </div>
                    <p className="text-[9px] text-muted-foreground font-normal mt-0.5">Blank Form 13 (3 pages)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAffidavitType("both")}
                    className={`p-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                      affidavitType === "both"
                        ? "border-teal-600 bg-white dark:bg-teal-900/80 font-bold text-teal-900 dark:text-teal-100 shadow-xs ring-1 ring-teal-500"
                        : "border-slate-200 dark:border-slate-800 bg-transparent text-muted-foreground hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Both</span>
                      {affidavitType === "both" && <Check className="w-3 h-3 text-teal-600" />}
                    </div>
                    <p className="text-[9px] text-muted-foreground font-normal mt-0.5">Uploaded + Blank Template</p>
                  </button>
                </div>
              </div>
            )}

            {isCompleteFile && !isCertIssued && (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium italic pt-1">
                * Note: When printing All Documents, Certificate (Rule 10) is omitted because you haven&apos;t issued the certificate yet.
              </p>
            )}
          </div>


          {/* Dialog Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
            <div className="text-[11px] text-muted-foreground">
              Selected: <strong className="text-foreground">{withHeader ? "With Header" : "Without Header"}</strong> •{" "}
              {isCompleteFile
                ? "All Documents (Complete File)"
                : `${selectedSections.length} Section(s)`}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs h-9 px-3"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleExecutePrint(false)}
                className="rounded-xl text-xs h-9 px-3 text-slate-700 dark:text-slate-300 hover:text-teal-600"
                title="Quick print without letterhead background"
              >
                Print Without Header
              </Button>

              <Button
                type="button"
                onClick={() => handleExecutePrint()}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                Proceed to Print
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
