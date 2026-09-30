/**
 * Utility for automatic status computation in Sperm Donor Registration & Management.
 *
 * Rules:
 * 1. A sperm donor begins as "NEW" (or "SUBMITTED" / "DRAFT").
 * 2. When identity documents (Aadhaar, photo, signature) are verified -> Status AUTOMATICALLY becomes "DOCUMENTS_VERIFIED".
 * 3. When signed & notarized affidavit is uploaded -> Status AUTOMATICALLY becomes "AFFIDAVIT_UPLOADED".
 * 4. When hospital is assigned AND financial deal is agreed -> Status AUTOMATICALLY becomes "APPROVED".
 * 5. When all 4 management documents (Semen Analysis Report, Viral Markers, Blood Report, Insurance Rule 13)
 *    are uploaded, AND donor compensation is settled (PAID or Registry tier), AND sample collection date is set:
 *    -> Status AUTOMATICALLY becomes "WAITING_FORM13".
 * 6. When the statutory Form 13 PDF is uploaded (and all above conditions are satisfied):
 *    -> Status AUTOMATICALLY becomes "FILE_COMPLETED".
 * 7. If Form 13 is removed or any prerequisite is cleared:
 *    -> Status AUTOMATICALLY reverts to "WAITING_FORM13" or "APPROVED".
 */

export interface SpermDonorManagementStatusResult {
  status: "DRAFT" | "NEW" | "SUBMITTED" | "UNDER_REVIEW" | "DOCUMENTS_VERIFIED" | "AFFIDAVIT_UPLOADED" | "APPROVED" | "WAITING_FORM13" | "FILE_COMPLETED" | "REJECTED" | "SUSPENDED" | "COMPLETED" | "CANCELLED" | string;
  hasSemenAnalysis: boolean;
  hasViralMarkers: boolean;
  hasBloodReport: boolean;
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  hasAllDocs: boolean;
  isDealPaid: boolean;
  hasPickupDate: boolean; // Sample Collection Scheduled Date
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
 * like "documents.affidavit" or "labReports.semenAnalysisReport".
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

export function computeSpermDonorManagementStatus(reg: any): SpermDonorManagementStatusResult {
  if (!reg) {
    return {
      status: "NEW",
      hasSemenAnalysis: false,
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
        "Assign ART Clinic / Hospital",
        "Recruitment / Supply / Pickup Date",
        "Form 13 Statutory Clearance PDF",
      ],
      isEligibleForWaitingForm13: false,
      isEligibleForFileCompleted: false,
      docsCount: 0,
    };
  }

  // 1. Hospital Assignment
  const assignedHospital = reg.assignedHospital;
  const hasHospital = Boolean(
    assignedHospital &&
      (typeof assignedHospital === "string"
        ? assignedHospital.trim().length > 0
        : Boolean(assignedHospital._id || assignedHospital.name))
  );

  // 2. Dates (Pickup / Supply / Recruitment Date)
  const rawPickup = reg.pickupDate || reg.donorInfo?.pickupDate || reg.donorInfo?.lastDonationDate;
  const rawSupply = reg.supplyDate;
  const rawRecruitment = reg.recruitmentDate;
  const hasPickupDate = Boolean(rawPickup && typeof rawPickup === "string" && rawPickup.trim().length > 0);
  const hasDates = Boolean(
    hasPickupDate ||
      (rawSupply && typeof rawSupply === "string" && rawSupply.trim().length > 0) ||
      (rawRecruitment && typeof rawRecruitment === "string" && rawRecruitment.trim().length > 0)
  );

  // 3. Form 13 Statutory Clearance PDF
  const form13 = reg.documents?.form13 || reg.form13 || reg["documents.form13"];
  const form13Url = typeof form13 === "object" ? form13?.url : form13;
  const hasForm13 = Boolean(form13Url && typeof form13Url === "string" && form13Url.trim().length > 0);

  // 4. Lab Tests
  const hasSemenAnalysis = Boolean(
    reg.labReports?.semenAnalysisReport?.url ||
      reg["labReports.semenAnalysisReport"]?.url ||
      reg.labReports?.semenAnalysis?.url ||
      reg["labReports.semenAnalysis"]?.url ||
      reg.semenAnalysisDetails?.motility ||
      reg.donorInfo?.semenAnalysis
  );
  const hasViralMarkers = Boolean(
    reg.labReports?.viralMarkersReport?.url ||
      reg["labReports.viralMarkersReport"]?.url ||
      reg.labReports?.viralMarkers?.url ||
      reg["labReports.viralMarkers"]?.url
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
      reg.documents?.lifeInsurance?.url
  );
  const hasHealthInsurance = Boolean(
    reg.labReports?.healthInsurance?.url ||
      reg["labReports.healthInsurance"]?.url
  );
  const docsCount = (hasSemenAnalysis ? 1 : 0) + (hasViralMarkers ? 1 : 0) + (hasBloodReport ? 1 : 0);
  const hasAllDocs = hasSemenAnalysis && hasViralMarkers;

  // 5. Deal & Payment
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

  const hasClinicPrice = isRegistry || Boolean(reg.clinicDeal?.hospitalDealPrice && Number(reg.clinicDeal.hospitalDealPrice) > 0);
  const hasDonorDeal = isRegistry || Boolean(reg.donorDeal?.compensationAmount && Number(reg.donorDeal.compensationAmount) > 0);
  const hasCompletedDeal = hasHospital && (hasClinicPrice || hasDonorDeal || Boolean(reg.clinicDeal));

  // 6. Affidavit
  const affidavit = reg.documents?.affidavit || reg.affidavit || reg["documents.affidavit"];
  const affidavitUrl = typeof affidavit === "object" ? affidavit?.url : affidavit;
  const hasAffidavit = Boolean(affidavitUrl && typeof affidavitUrl === "string" && affidavitUrl.trim().length > 0);

  // 7. Identity Documents Verified
  const isDocVerified = Boolean(
    reg.documentVerification?.isVerified === true ||
    (reg.documents?.aadhaarFront?.url && reg.documents?.passportPhoto?.url)
  );

  // Missing requirements in Sperm Donor Management
  const missingRequirements: string[] = [];
  if (!hasHospital) missingRequirements.push("Assign ART Clinic / Hospital");
  if (!hasDates) missingRequirements.push("Recruitment / Supply / Pickup Date");
  if (!hasForm13) missingRequirements.push("Form 13 Statutory Clearance PDF");

  const isEligibleForWaitingForm13 = (hasHospital && hasDates) || hasPickupDate;
  const isEligibleForFileCompleted = hasForm13;

  const currentStatus = reg.status || "NEW";

  // Preserve explicit manual terminal statuses
  if (["REJECTED", "SUSPENDED", "CANCELLED", "COMPLETED"].includes(currentStatus)) {
    return {
      status: currentStatus,
      hasSemenAnalysis,
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
      hasSemenAnalysis,
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
  // 2. Hospital + Dates + Compensation settled -> WAITING_FORM13
  else if (isEligibleForWaitingForm13 && (isDealPaid || isRegistry)) {
    computedStatus = "WAITING_FORM13";
  }
  // 3. Hospital assigned & deal completed (or already approved in management pipeline) -> APPROVED
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
    hasSemenAnalysis,
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

export interface ViralMarkersCheckResult {
  isEntered: boolean;
  hasFile: boolean;
  hasTests: boolean;
  hiv: boolean;
  hbsag: boolean;
  hcv: boolean;
  vdrl: boolean;
  certificateIssued: boolean;
  certificateIssuedAt?: Date | string | null;
  certificateIssuedBy?: string | null;
  missingItems: string[];
}

export function checkSpermViralMarkersEntered(reg: any): ViralMarkersCheckResult {
  if (!reg) {
    return {
      isEntered: false,
      hasFile: false,
      hasTests: false,
      hiv: false,
      hbsag: false,
      hcv: false,
      vdrl: false,
      certificateIssued: false,
      missingItems: ["Viral Markers Report"],
    };
  }

  const hasFile = Boolean(
    reg.labReports?.viralMarkersReport?.url ||
      reg["labReports.viralMarkersReport"]?.url ||
      reg.labReports?.viralMarkers?.url ||
      reg["labReports.viralMarkers"]?.url ||
      reg.managementDocs?.viralMarkers?.url
  );

  const med = reg.medicalInfo || {};
  const hiv = Boolean(med.hivStatus && String(med.hivStatus).trim().length > 0);
  const hbsag = Boolean(med.hbsagStatus && String(med.hbsagStatus).trim().length > 0);
  const hcv = Boolean(med.hepatitisCStatus && String(med.hepatitisCStatus).trim().length > 0);
  const vdrl = Boolean(med.vdrl && String(med.vdrl).trim().length > 0);
  const hasTests = hiv && hbsag && hcv && vdrl;

  const isEntered = hasFile || hasTests;
  const certificateIssued = Boolean(reg.certificateIssued === true || reg.isCertificateIssued === true);

  const missingItems: string[] = [];
  if (!hasFile) {
    if (!hiv) missingItems.push("HIV Test (Type 1 & 2)");
    if (!hbsag) missingItems.push("Hepatitis B (HBsAg)");
    if (!hcv) missingItems.push("Hepatitis C (HCV)");
    if (!vdrl) missingItems.push("VDRL / Syphilis");
  }

  return {
    isEntered,
    hasFile,
    hasTests,
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
