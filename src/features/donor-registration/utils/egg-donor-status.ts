/**
 * Utility for automatic status computation in Egg Donor Management.
 *
 * Rules:
 * 1. An egg donor begins management with status "APPROVED".
 * 2. When all 4 management documents (Viral Markers, Blood Report, Life Insurance Rule 13, Health Insurance)
 *    are uploaded, AND donor compensation is settled (PAID or Registry tier), AND pickup date is set:
 *    -> Status AUTOMATICALLY becomes "WAITING_FORM13".
 * 3. When the statutory Form 13 PDF is uploaded (and all above conditions are satisfied):
 *    -> Status AUTOMATICALLY becomes "FILE_COMPLETED".
 * 4. If Form 13 is removed or any prerequisite is cleared:
 *    -> Status AUTOMATICALLY reverts to "WAITING_FORM13" or "APPROVED".
 */

export interface EggDonorManagementStatusResult {
  status: "APPROVED" | "WAITING_FORM13" | "FILE_COMPLETED" | "CANCELLED" | string;
  hasViralMarkers: boolean;
  hasBloodReport: boolean;
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  hasAllDocs: boolean;
  isDealPaid: boolean;
  hasPickupDate: boolean;
  hasForm13: boolean;
  missingRequirements: string[];
  isEligibleForWaitingForm13: boolean;
  isEligibleForFileCompleted: boolean;
  docsCount: number;
}

export function computeEggDonorManagementStatus(reg: any): EggDonorManagementStatusResult {
  if (!reg) {
    return {
      status: "APPROVED",
      hasViralMarkers: false,
      hasBloodReport: false,
      hasLifeInsurance: false,
      hasHealthInsurance: false,
      hasAllDocs: false,
      isDealPaid: false,
      hasPickupDate: false,
      hasForm13: false,
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
      (Array.isArray(reg.labReports?.viralMarkers) && reg.labReports?.viralMarkers[0]?.url) ||
      reg.labReports?.viralMarkers?.url
  );

  const hasBloodReport = Boolean(reg.labReports?.bloodReport?.url);

  const hasLifeInsurance = Boolean(
    reg.labReports?.insurance?.url ||
      reg.documents?.insurance?.url
  );

  const hasHealthInsurance = Boolean(reg.labReports?.healthInsurance?.url);

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
  const form13 = reg.documents?.form13 || reg.form13;
  const form13Url = typeof form13 === "object" ? form13?.url : form13;
  const hasForm13 = Boolean(form13Url && typeof form13Url === "string" && form13Url.trim().length > 0);

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

  // Preserve existing non-management statuses like REJECTED, SUSPENDED, NEW, DRAFT, SUBMITTED, CANCELLED
  const currentStatus = reg.status || "APPROVED";
  if (["REJECTED", "SUSPENDED", "DRAFT", "NEW", "SUBMITTED", "CANCELLED"].includes(currentStatus)) {
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
      reg.labReports?.viralMarkers?.url ||
      reg.managementDocs?.viralMarkers?.url
  );

  // 2. Check for clinical test results in medicalInfo
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

