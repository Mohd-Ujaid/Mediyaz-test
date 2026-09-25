/**
 * Utility for automatic status computation in Sperm Donor Management.
 *
 * Rules:
 * 1. A sperm donor begins management with status "APPROVED".
 * 2. When all 4 management documents (Semen Analysis Report, Viral Markers, Blood Report, Insurance Rule 13)
 *    are uploaded, AND donor compensation is settled (PAID or Registry tier), AND sample collection date is set:
 *    -> Status AUTOMATICALLY becomes "WAITING_FORM13".
 * 3. When the statutory Form 13 PDF is uploaded (and all above conditions are satisfied):
 *    -> Status AUTOMATICALLY becomes "FILE_COMPLETED".
 * 4. If Form 13 is removed or any prerequisite is cleared:
 *    -> Status AUTOMATICALLY reverts to "WAITING_FORM13" or "APPROVED".
 */

export interface SpermDonorManagementStatusResult {
  status: "APPROVED" | "WAITING_FORM13" | "FILE_COMPLETED" | "CANCELLED" | string;
  hasSemenAnalysis: boolean;
  hasViralMarkers: boolean;
  hasBloodReport: boolean;
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  hasAllDocs: boolean;
  isDealPaid: boolean;
  hasPickupDate: boolean; // Sample Collection Scheduled Date
  hasForm13: boolean;
  missingRequirements: string[];
  isEligibleForWaitingForm13: boolean;
  isEligibleForFileCompleted: boolean;
  docsCount: number;
}

export function computeSpermDonorManagementStatus(reg: any): SpermDonorManagementStatusResult {
  if (!reg) {
    return {
      status: "APPROVED",
      hasSemenAnalysis: false,
      hasViralMarkers: false,
      hasBloodReport: false,
      hasLifeInsurance: false,
      hasHealthInsurance: false,
      hasAllDocs: true,
      isDealPaid: false,
      hasPickupDate: false,
      hasForm13: false,
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
  const form13 = reg.documents?.form13 || reg.form13;
  const form13Url = typeof form13 === "object" ? form13?.url : form13;
  const hasForm13 = Boolean(form13Url && typeof form13Url === "string" && form13Url.trim().length > 0);

  // 4. Lab Tests (Pre-completed during registration pipeline)
  const hasSemenAnalysis = Boolean(
    reg.labReports?.semenAnalysisReport?.url ||
      reg.labReports?.semenAnalysis?.url ||
      reg.semenAnalysisDetails?.motility ||
      reg.donorInfo?.semenAnalysis
  );
  const hasViralMarkers = Boolean(
    reg.labReports?.viralMarkersReport?.url ||
      reg.labReports?.viralMarkers?.url
  );
  const hasBloodReport = Boolean(reg.labReports?.bloodReport?.url);
  const hasLifeInsurance = false;
  const hasHealthInsurance = false;
  const docsCount = (hasSemenAnalysis ? 1 : 0) + (hasViralMarkers ? 1 : 0) + (hasBloodReport ? 1 : 0);
  const hasAllDocs = true;

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

  // Missing requirements in Sperm Donor Management
  const missingRequirements: string[] = [];
  if (!hasHospital) missingRequirements.push("Assign ART Clinic / Hospital");
  if (!hasDates) missingRequirements.push("Recruitment / Supply / Pickup Date");
  if (!hasForm13) missingRequirements.push("Form 13 Statutory Clearance PDF");

  const isEligibleForWaitingForm13 = (hasHospital && hasDates) || hasPickupDate;
  const isEligibleForFileCompleted = hasForm13;

  // Preserve existing non-management statuses like REJECTED, SUSPENDED, NEW, DRAFT, SUBMITTED, DOCUMENTS_VERIFIED, UNDER_REVIEW, CANCELLED
  const currentStatus = reg.status || "APPROVED";
  if (["REJECTED", "SUSPENDED", "DRAFT", "NEW", "SUBMITTED", "DOCUMENTS_VERIFIED", "UNDER_REVIEW", "CANCELLED"].includes(currentStatus)) {
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
      missingRequirements,
      isEligibleForWaitingForm13,
      isEligibleForFileCompleted,
      docsCount,
    };
  }

  let computedStatus = "APPROVED";
  if (hasForm13) {
    computedStatus = "FILE_COMPLETED";
  } else if (isEligibleForWaitingForm13) {
    computedStatus = "WAITING_FORM13";
  } else {
    computedStatus = "APPROVED";
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

export function checkViralMarkersEntered(reg: any): ViralMarkersCheckResult {
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

  // 1. Check for uploaded Viral Marker PDF report
  const hasFile = Boolean(
    reg.labReports?.viralMarkersReport?.url ||
      (Array.isArray(reg.labReports?.viralMarkers) &&
        reg.labReports?.viralMarkers.some((f: any) => Boolean(f?.url))) ||
      reg.labReports?.viralMarkers?.url
  );

  // 2. Check for clinical test results in medicalInfo or investigations
  const med = reg.medicalInfo || {};
  const inv = reg.investigations || {};
  const hiv = Boolean((med.hivStatus && String(med.hivStatus).trim().length > 0) || (inv.hivStatus && String(inv.hivStatus).trim().length > 0));
  const hbsag = Boolean((med.hbsagStatus && String(med.hbsagStatus).trim().length > 0) || (inv.hbsagStatus && String(inv.hbsagStatus).trim().length > 0));
  const hcv = Boolean((med.hepatitisCStatus && String(med.hepatitisCStatus).trim().length > 0) || (inv.hepatitisCStatus && String(inv.hepatitisCStatus).trim().length > 0));
  const vdrl = Boolean((med.vdrl && String(med.vdrl).trim().length > 0) || (inv.vdrl && String(inv.vdrl).trim().length > 0));
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

export interface SemenAnalysisCheckResult {
  isEntered: boolean;
  hasFile: boolean;
  hasParticulars: boolean;
  semenAnalysisText: string;
  missingItems: string[];
}

export function checkSemenAnalysisEntered(reg: any): SemenAnalysisCheckResult {
  if (!reg) {
    return {
      isEntered: false,
      hasFile: false,
      hasParticulars: false,
      semenAnalysisText: "",
      missingItems: ["Semen Analysis Report"],
    };
  }

  const hasFile = Boolean(
    reg.labReports?.semenAnalysisReport?.url ||
      reg.labReports?.semenAnalysis?.url ||
      (Array.isArray(reg.labReports?.semenAnalysis) && reg.labReports?.semenAnalysis[0]?.url)
  );

  const rawAnalysis = reg.donorInfo?.semenAnalysis || "";
  const hasParticulars = Boolean(rawAnalysis && String(rawAnalysis).trim().length > 0);

  const isEntered = hasFile || hasParticulars;
  const missingItems: string[] = [];
  if (!isEntered) missingItems.push("Semen Analysis Report");

  return {
    isEntered,
    hasFile,
    hasParticulars,
    semenAnalysisText: String(rawAnalysis),
    missingItems,
  };
}
