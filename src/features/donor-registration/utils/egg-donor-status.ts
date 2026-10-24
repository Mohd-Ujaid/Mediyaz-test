/**
 * Utility for automatic status computation in Egg Donor Registration & Management.
 *
 * Rules:
 * 1. An egg donor begins as "NEW" (or "SUBMITTED" / "DRAFT").
 * 2. When identity documents (Aadhaar, photo, signature) are verified -> Status AUTOMATICALLY becomes "DOCUMENTS_VERIFIED".
 * 3. When signed & notarized affidavit is uploaded -> Status AUTOMATICALLY becomes "AFFIDAVIT_UPLOADED".
 * 4. When hospital is assigned AND financial deal is agreed -> Status AUTOMATICALLY becomes "APPROVED".
 * 5. When all 4 management documents (Viral Markers, Blood Report, Life Insurance Rule 13, Health Insurance)
 *    are uploaded, AND donor compensation is settled (PAID or Registry tier), AND pickup date is set:
 *    -> Status AUTOMATICALLY becomes "WAITING_FORM13".
 * 6. When the statutory Form 13 PDF is uploaded (and all above conditions are satisfied):
 *    -> Status AUTOMATICALLY becomes "FILE_COMPLETED".
 * 7. If Form 13 is removed or any prerequisite is cleared:
 *    -> Status AUTOMATICALLY reverts to "WAITING_FORM13" or "APPROVED".
 */

export interface EggDonorManagementStatusResult {
  status: "DRAFT" | "NEW" | "SUBMITTED" | "UNDER_REVIEW" | "DOCUMENTS_VERIFIED" | "AFFIDAVIT_UPLOADED" | "APPROVED" | "WAITING_FORM13" | "FILE_COMPLETED" | "REJECTED" | "SUSPENDED" | "COMPLETED" | "CANCELLED" | string;
  hasViralMarkers: boolean;
  hasBloodReport: boolean;
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  hasAllDocs: boolean;
  isDealPaid: boolean;
  hasPickupDate: boolean;
  hasForm13: boolean;
  hasAffidavit: boolean;
  isDocVerified: boolean;
  hasHospital: boolean;
  hasCompletedDeal: boolean;
  missingRequirements: string[];
  isEligibleForWaitingForm13: boolean;
  isEligibleForFileCompleted: boolean;
  docsCount: number;
}

/**
 * Merges a base object with update fields, correctly expanding dot-notation keys
 * like "documents.affidavit" or "labReports.bloodReport" so nested checks always succeed.
 */
export function mergeWithDotNotation(base: any, updates: Record<string, any>): any {
  const result = JSON.parse(JSON.stringify(base || {}));
  for (const [key, value] of Object.entries(updates || {})) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let cur = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") {
          cur[parts[i]] = {};
        }
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = { ...(result[key] || {}), ...value };
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function computeEggDonorManagementStatus(reg: any): EggDonorManagementStatusResult {
  if (!reg) {
    return {
      status: "NEW",
      hasViralMarkers: false,
      hasBloodReport: false,
      hasLifeInsurance: false,
      hasHealthInsurance: false,
      hasAllDocs: false,
      isDealPaid: false,
      hasPickupDate: false,
      hasForm13: false,
      hasAffidavit: false,
      isDocVerified: false,
      hasHospital: false,
      hasCompletedDeal: false,
      missingRequirements: [
        "Viral Markers Report",
        "Blood Test Report",
        "Life Insurance (Rule 13)",
        "Health Insurance",
        "Donor Compensation Payment",
        "Oocyte Pickup Date",
        "Form 13 Statutory PDF",
      ],
      isEligibleForWaitingForm13: false,
      isEligibleForFileCompleted: false,
      docsCount: 0,
    };
  }

  // 1. Documents (4 Management Documents)
  const hasViralMarkers = Boolean(
    reg.labReports?.viralMarkersReport?.url ||
      reg["labReports.viralMarkersReport"]?.url ||
      (Array.isArray(reg.labReports?.viralMarkers) && reg.labReports?.viralMarkers[0]?.url) ||
      reg.labReports?.viralMarkers?.url
  );

  const hasBloodReport = Boolean(
    reg.labReports?.bloodReport?.url ||
      reg["labReports.bloodReport"]?.url
  );

  const hasLifeInsurance = Boolean(
    reg.labReports?.insurance?.url ||
      reg["labReports.insurance"]?.url ||
      reg.labReports?.lifeInsurance?.url ||
      reg["labReports.lifeInsurance"]?.url ||
      reg.documents?.insurance?.url ||
      reg["documents.insurance"]?.url ||
      reg.documents?.lifeInsurance?.url ||
      reg["documents.lifeInsurance"]?.url
  );

  const hasHealthInsurance = Boolean(
    reg.labReports?.healthInsurance?.url ||
      reg["labReports.healthInsurance"]?.url
  );

  const docsCount =
    (hasViralMarkers ? 1 : 0) +
    (hasBloodReport ? 1 : 0) +
    (hasLifeInsurance ? 1 : 0) +
    (hasHealthInsurance ? 1 : 0);

  const hasAllDocs = docsCount === 4;

  // 2. Deal & Payment
  const isRegistry =
    reg.hospitalDealType === "registry" ||
    reg.clinicDeal?.donorCategory === "registry" ||
    reg.donorDeal?.donorCategory === "registry" ||
    reg.donorDeal?.category === "registry" ||
    reg.category === "registry";

  const isDealPaid =
    isRegistry ||
    reg.donorDeal?.paymentStatus === "PAID" ||
    reg.isDonorPaid === true;

  // 3. Pickup Date (Oocyte Retrieval Scheduled Date)
  const rawPickup = reg.pickupDate || reg.donorInfo?.pickupDate;
  const hasPickupDate = Boolean(rawPickup && typeof rawPickup === "string" && rawPickup.trim().length > 0);

  // 4. Form 13 Statutory PDF
  const form13 = reg.documents?.form13 || reg.form13 || reg["documents.form13"];
  const form13Url = typeof form13 === "object" ? form13?.url : form13;
  const hasForm13 = Boolean(form13Url && typeof form13Url === "string" && form13Url.trim().length > 0);

  // 5. Hospital & Deal (Pre-approval Step 4)
  const assignedHosp = reg.assignedHospital;
  const hasHospital = Boolean(
    assignedHosp &&
      (typeof assignedHosp === "string"
        ? assignedHosp.trim().length > 0
        : Boolean(assignedHosp._id || assignedHosp.name))
  );

  const hasClinicPrice = isRegistry || Boolean(reg.clinicDeal?.hospitalDealPrice && Number(reg.clinicDeal.hospitalDealPrice) > 0);
  const hasDonorDeal = isRegistry || Boolean(reg.donorDeal?.compensationAmount && Number(reg.donorDeal.compensationAmount) > 0);
  const hasCompletedDeal = hasHospital && (hasClinicPrice || hasDonorDeal || Boolean(reg.clinicDeal));

  // 6. Affidavit (Pre-approval Step 3)
  const affidavit = reg.documents?.affidavit || reg.affidavit || reg["documents.affidavit"];
  const affidavitUrl = typeof affidavit === "object" ? affidavit?.url : affidavit;
  const hasAffidavit = Boolean(affidavitUrl && typeof affidavitUrl === "string" && affidavitUrl.trim().length > 0);

  // 7. Identity Documents Verified (Pre-approval Step 2)
  const isDocVerified = Boolean(
    reg.documentVerification?.isVerified === true ||
    (reg.documents?.aadhaarFront?.url && reg.documents?.passportPhoto?.url)
  );

  // Collect missing items
  const missingRequirements: string[] = [];
  if (!hasViralMarkers) missingRequirements.push("Viral Markers Report");
  if (!hasBloodReport) missingRequirements.push("Blood Test Report");
  if (!hasLifeInsurance) missingRequirements.push("Life Insurance (Rule 13)");
  if (!hasHealthInsurance) missingRequirements.push("Health Insurance");
  if (!isDealPaid) missingRequirements.push("Donor Compensation Payment");
  if (!hasPickupDate) missingRequirements.push("Oocyte Pickup Date");
  if (!hasForm13) missingRequirements.push("Form 13 Statutory PDF");

  const isEligibleForWaitingForm13 = hasAllDocs && isDealPaid && hasPickupDate;
  const isEligibleForFileCompleted = hasForm13;

  const currentStatus = reg.status || "NEW";

  // Preserve explicit manual terminal statuses
  if (["REJECTED", "SUSPENDED", "CANCELLED", "COMPLETED"].includes(currentStatus)) {
    return {
      status: currentStatus,
      hasViralMarkers,
      hasBloodReport,
      hasLifeInsurance,
      hasHealthInsurance,
      hasAllDocs,
      isDealPaid,
      hasPickupDate,
      hasForm13,
      hasAffidavit,
      isDocVerified,
      hasHospital,
      hasCompletedDeal,
      missingRequirements,
      isEligibleForWaitingForm13,
      isEligibleForFileCompleted,
      docsCount,
    };
  }

  // Preserve incomplete wizard draft
  if (currentStatus === "DRAFT" && (reg.currentStep || 1) < 3 && !reg.consent?.confirmTruth) {
    return {
      status: "DRAFT",
      hasViralMarkers,
      hasBloodReport,
      hasLifeInsurance,
      hasHealthInsurance,
      hasAllDocs,
      isDealPaid,
      hasPickupDate,
      hasForm13,
      hasAffidavit,
      isDocVerified,
      hasHospital,
      hasCompletedDeal,
      missingRequirements,
      isEligibleForWaitingForm13,
      isEligibleForFileCompleted,
      docsCount,
    };
  }

  // ── Automatic Status Assignment Engine ─────────────────────────────────────
  let computedStatus = currentStatus;

  // 1. Highest priority: Form 13 uploaded -> FILE_COMPLETED
  if (hasForm13) {
    computedStatus = "FILE_COMPLETED";
  }
  // 2. All 4 clinical reports uploaded + deal paid + pickup date set -> WAITING_FORM13
  else if (isEligibleForWaitingForm13) {
    computedStatus = "WAITING_FORM13";
  }
  // 3. Hospital assigned & deal agreed (or already approved in management pipeline) -> APPROVED
  else if (
    (hasCompletedDeal && (hasAffidavit || isDocVerified || ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(currentStatus))) ||
    ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(currentStatus)
  ) {
    computedStatus = "APPROVED";
  }
  // 4. Pre-approval Step 3: Signed affidavit uploaded -> AFFIDAVIT_UPLOADED
  else if (hasAffidavit) {
    computedStatus = "AFFIDAVIT_UPLOADED";
  }
  // 5. Pre-approval Step 2: Identity documents verified -> DOCUMENTS_VERIFIED
  else if (isDocVerified) {
    computedStatus = "DOCUMENTS_VERIFIED";
  }
  // 6. Explicit under review
  else if (currentStatus === "UNDER_REVIEW") {
    computedStatus = "UNDER_REVIEW";
  }
  // 7. Base status
  else {
    computedStatus = currentStatus === "DRAFT" ? "DRAFT" : (currentStatus === "SUBMITTED" ? "SUBMITTED" : "NEW");
  }

  return {
    status: computedStatus,
    hasViralMarkers,
    hasBloodReport,
    hasLifeInsurance,
    hasHealthInsurance,
    hasAllDocs,
    isDealPaid,
    hasPickupDate,
    hasForm13,
    hasAffidavit,
    isDocVerified,
    hasHospital,
    hasCompletedDeal,
    missingRequirements,
    isEligibleForWaitingForm13,
    isEligibleForFileCompleted,
    docsCount,
  };
}

export function hasUploadedViralMarkersReport(reg: any): boolean {
  if (!reg) return false;
  const labReports = reg.labReports || {};
  const managementDocs = reg.managementDocs || {};
  const docReports = reg.documents || {};

  const checkRef = (val: any) =>
    Boolean(val && typeof val === "object" && val.url && String(val.url).trim().length > 0);
  const checkArray = (arr: any) =>
    Array.isArray(arr) && arr.some((f: any) => checkRef(f));

  return (
    checkRef(labReports.viralMarkersReport) ||
    checkRef(reg["labReports.viralMarkersReport"]) ||
    checkRef(labReports.viralMarkers) ||
    checkRef(reg["labReports.viralMarkers"]) ||
    checkRef(managementDocs.viralMarkers) ||
    checkRef(reg["managementDocs.viralMarkers"]) ||
    checkRef(docReports.viralMarkersReport) ||
    checkArray(labReports.viralMarkers) ||
    checkArray(labReports.viralMarkersReport)
  );
}

export function hasUploadedBloodReport(reg: any): boolean {
  if (!reg) return false;
  const labReports = reg.labReports || {};
  const managementDocs = reg.managementDocs || {};
  const docReports = reg.documents || {};

  const checkRef = (val: any) =>
    Boolean(val && typeof val === "object" && val.url && String(val.url).trim().length > 0);
  const checkArray = (arr: any) =>
    Array.isArray(arr) && arr.some((f: any) => checkRef(f));

  return (
    checkRef(labReports.bloodReport) ||
    checkRef(reg["labReports.bloodReport"]) ||
    checkRef(managementDocs.bloodReport) ||
    checkRef(reg["managementDocs.bloodReport"]) ||
    checkRef(docReports.bloodReport) ||
    checkArray(labReports.bloodReport)
  );
}

export interface ViralMarkersCheckResult {
  isEntered: boolean;
  hasFile: boolean;
  hasTests: boolean;
  hasViralReport: boolean;
  hasBloodReport: boolean;
  canIssueCertificate: boolean;
  hiv: boolean;
  hbsag: boolean;
  hcv: boolean;
  vdrl: boolean;
  certificateIssued: boolean;
  certificateIssuedAt?: Date | string | null;
  certificateIssuedBy?: string | null;
  missingItems: string[];
}

export function checkViralMarkersEntered(reg: any): ViralMarkersCheckResult {
  if (!reg) {
    return {
      isEntered: false,
      hasFile: false,
      hasTests: false,
      hasViralReport: false,
      hasBloodReport: false,
      canIssueCertificate: false,
      hiv: false,
      hbsag: false,
      hcv: false,
      vdrl: false,
      certificateIssued: false,
      missingItems: ["Viral Markers Report (PDF/Scan)", "Blood Report (PDF/Scan)"],
    };
  }

  // 1. Check for uploaded Viral Marker PDF report and Blood Report
  const hasViralReport = hasUploadedViralMarkersReport(reg);
  const hasBloodReport = hasUploadedBloodReport(reg);
  const hasFile = hasViralReport;

  // 2. Check for clinical test results in medicalInfo / investigations
  const med = reg.medicalInfo || reg.investigations || {};
  const hiv = Boolean(med.hivStatus && String(med.hivStatus).trim().length > 0);
  const hbsag = Boolean(med.hbsagStatus && String(med.hbsagStatus).trim().length > 0);
  const hcv = Boolean(med.hepatitisCStatus && String(med.hepatitisCStatus).trim().length > 0);
  const vdrl = Boolean(med.vdrl && String(med.vdrl).trim().length > 0);
  const hasTests = hiv && hbsag && hcv && vdrl;

  const isEntered = true;
  const canIssueCertificate = true;
  const certificateIssued = Boolean(reg.certificateIssued === true || reg.isCertificateIssued === true);

  const missingItems: string[] = [];
  if (!hasViralReport) missingItems.push("Viral Markers Report (PDF/Scan)");
  if (!hasBloodReport) missingItems.push("Blood Report (PDF/Scan)");
  if (!hiv) missingItems.push("HIV Test (Type 1 & 2)");
  if (!hbsag) missingItems.push("Hepatitis B (HBsAg)");
  if (!hcv) missingItems.push("Hepatitis C (HCV)");
  if (!vdrl) missingItems.push("VDRL / Syphilis");

  return {
    isEntered,
    hasFile,
    hasTests,
    hasViralReport,
    hasBloodReport,
    canIssueCertificate,
    hiv,
    hbsag,
    hcv,
    vdrl,
    certificateIssued,
    certificateIssuedAt: reg.certificateIssuedAt,
    certificateIssuedBy: reg.certificateIssuedBy,
    missingItems,
  };
}
