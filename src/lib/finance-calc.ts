import { parseDateSafe, getFinancialYear, getIndianQuarter, calculateGst } from "./tax-finance-utils";

export interface IStandardCaseFinancial {
  registrationId: string;
  donorId?: string;
  donorName: string;
  donorType: "egg" | "sperm";
  hospitalId: string;
  hospitalName: string;
  hospitalState?: string;
  branchName?: string;
  
  // Important Dates
  pickupDate?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  hasInvoice: boolean;
  caseDate: Date; // Primary accrual reference date
  
  // Financial Year & Period
  financialYear: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  month: number; // 1-12
  
  // Deal & Accrual Economics
  dealPrice: number; // What clinic is billed
  serviceCharge: number; // Mediyaz margin
  gstAmount: number;
  tdsPercentage: number;
  tdsAmount: number;
  netReceivableFromClinic: number;
  donorCompensation: number; // What donor is promised
  
  // Clinic Cash IN Status
  clinicPaymentStatus: "PENDING" | "PARTIALLY_RECEIVED" | "RECEIVED";
  clinicReceivedAmount: number;
  clinicPendingAmount: number;
  clinicReceivedAt?: Date | null;
  clinicPaymentReference?: string;
  clinicPayments: Array<{
    amount: number;
    date: Date;
    reference?: string;
    mode?: string;
  }>;

  // Donor Cash OUT Status
  donorPaymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  donorPaidAmount: number;
  donorPendingAmount: number;
  donorPaidAt?: Date | null;
  donorPaymentReference?: string;
  donorPayments: Array<{
    amount: number;
    date: Date;
    reference?: string;
    mode?: string;
  }>;
}

/**
 * Standardize an egg or sperm registration record into unified financial dimensions
 */
export function normalizeRecordToFinancial(r: any): IStandardCaseFinancial {
  const hosp = typeof r.assignedHospital === "object" ? r.assignedHospital : null;
  const clinicDeal = r.clinicDeal || {};
  const donorDeal = r.donorDeal || {};
  const isSperm = r.donorType === "sperm";
  const category = clinicDeal.donorCategory || donorDeal.donorCategory || "normal";

  // 1. Determine Clinic Deal Price
  const defaultHospPrice = hosp
    ? isSperm
      ? category === "profile"
        ? hosp.spermProfileDonorDealPrice || 25000
        : hosp.spermDonorDealPrice || 15000
      : category === "profile"
      ? hosp.eggProfileDonorDealPrice || hosp.profiledonorDealPrice || 85000
      : hosp.eggDonorDealPrice || hosp.donorDealPrice || 65000
    : isSperm
    ? category === "profile" ? 25000 : 15000
    : category === "profile" ? 85000 : 65000;

  const dealPrice =
    Number(clinicDeal.hospitalDealPrice) ||
    Number(clinicDeal.totalAmount) ||
    Number(r.dealPrice) ||
    defaultHospPrice;

  // 2. Service Charge (Our Margin)
  const serviceCharge =
    clinicDeal.serviceCharge !== undefined && clinicDeal.serviceCharge !== null && Number(clinicDeal.serviceCharge) >= 0
      ? Number(clinicDeal.serviceCharge)
      : hosp?.serviceCharge !== undefined && hosp?.serviceCharge !== null && Number(hosp.serviceCharge) >= 0
      ? Number(hosp.serviceCharge)
      : isSperm
      ? 3000
      : 5000;

  // 3. GST & TDS
  const gstAmount =
    clinicDeal.gstAmount !== undefined && Number(clinicDeal.gstAmount) >= 0
      ? Number(clinicDeal.gstAmount)
      : Math.round(serviceCharge * 0.18);

  // 4. Donor Compensation
  const donorCompensation =
    Number(donorDeal.compensationAmount) ||
    Number(clinicDeal.donorReimbursement) ||
    Math.max(0, dealPrice - serviceCharge) ||
    (category === "profile" ? (isSperm ? 10000 : 60000) : (isSperm ? 5000 : 55000));

  // 5. Date Parsing & Categorization
  const rawCaseDate = clinicDeal.invoiceDate || r.invoiceDate || r.pickupDate || r.createdAt || new Date();
  const caseDate = parseDateSafe(rawCaseDate) || new Date();
  const financialYear = getFinancialYear(caseDate);
  const quarter = getIndianQuarter(caseDate);
  const year = caseDate.getFullYear();
  const month = caseDate.getMonth() + 1;

  const rawClinicPayments: any[] = Array.isArray(clinicDeal.payments) ? clinicDeal.payments : [];
  let clinicPayments: Array<{ amount: number; date: Date; reference?: string; mode?: string }> = [];

  let clinicReceivedAmount = 0;
  let tdsAmount = 0;

  if (rawClinicPayments.length > 0) {
    clinicPayments = rawClinicPayments.map((p) => ({
      amount: Number(p.netAmount ?? p.amount ?? 0),
      date: parseDateSafe(p.date) || caseDate,
      reference: p.reference || "",
      mode: p.paymentMode || "bank_transfer",
    }));
    clinicReceivedAmount = rawClinicPayments.reduce((acc, p) => acc + Number(p.netAmount ?? p.amount ?? 0), 0);
    tdsAmount = rawClinicPayments.reduce((acc, p) => acc + Number(p.tdsAmount ?? 0), 0);
  } else {
    clinicReceivedAmount = Number(clinicDeal.receivedAmount || 0);
    tdsAmount = Number(clinicDeal.tdsAmount || clinicDeal.tdsTotal || 0);
  }

  const tdsPercentage =
    clinicDeal.tdsPercentage !== undefined && Number(clinicDeal.tdsPercentage) >= 0
      ? Number(clinicDeal.tdsPercentage)
      : hosp?.tdsPercentage !== undefined && Number(hosp.tdsPercentage) >= 0
      ? Number(hosp.tdsPercentage)
      : (dealPrice > 0 && tdsAmount > 0 ? Math.round((tdsAmount / dealPrice) * 100) : 2);

  const totalSettled = clinicReceivedAmount + tdsAmount;
  const isClinicFull =
    clinicDeal.isPaymentReceived === true ||
    clinicDeal.paymentStatus === "RECEIVED" ||
    (dealPrice > 0 && totalSettled >= dealPrice);

  const finalClinicReceived = isClinicFull ? (clinicReceivedAmount || dealPrice) : clinicReceivedAmount;
  const netReceivableFromClinic = dealPrice;
  const clinicPendingAmount = isClinicFull ? 0 : Math.max(0, dealPrice - (finalClinicReceived + tdsAmount));

  if (clinicPayments.length === 0 && finalClinicReceived > 0) {
    const recvDate = parseDateSafe(clinicDeal.receivedAt || clinicDeal.receivedDate) || caseDate;
    clinicPayments.push({
      amount: finalClinicReceived,
      date: recvDate,
      reference: clinicDeal.paymentReference || "",
      mode: "bank_transfer",
    });
  }

  const clinicPaymentStatus: "PENDING" | "PARTIALLY_RECEIVED" | "RECEIVED" = isClinicFull
    ? "RECEIVED"
    : finalClinicReceived > 0
    ? "PARTIALLY_RECEIVED"
    : "PENDING";

  const clinicReceivedAt = parseDateSafe(clinicDeal.receivedAt || clinicDeal.receivedDate) || (isClinicFull ? caseDate : null);

  // 7. Donor Paid Cash Logic
  const rawDonorPayments: any[] = Array.isArray(donorDeal.payments) ? donorDeal.payments : [];
  let donorPayments: Array<{ amount: number; date: Date; reference?: string; mode?: string }> = [];

  if (rawDonorPayments.length > 0) {
    donorPayments = rawDonorPayments.map((p) => ({
      amount: Number(p.amount || 0),
      date: parseDateSafe(p.date) || parseDateSafe(r.paidAt) || caseDate,
      reference: p.reference || "",
      mode: p.method || p.paymentMethod || "bank_transfer",
    }));
  }

  const isDonorFull = r.isDonorPaid === true || donorDeal.paymentStatus === "PAID";
  let donorPaidAmount = isDonorFull
    ? donorCompensation
    : Number(donorDeal.advanceAmount || 0);

  if (donorPayments.length > 0) {
    const sumPaid = donorPayments.reduce((acc, p) => acc + p.amount, 0);
    if (sumPaid > 0) donorPaidAmount = sumPaid;
  } else if (donorPaidAmount > 0) {
    const paidDate = parseDateSafe(donorDeal.paidAt || r.paidAt) || caseDate;
    donorPayments.push({
      amount: donorPaidAmount,
      date: paidDate,
      reference: donorDeal.paymentReference || "",
      mode: donorDeal.paymentMethod || "bank_transfer",
    });
  }

  const donorPendingAmount = isDonorFull ? 0 : Math.max(0, donorCompensation - donorPaidAmount);
  const donorPaymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELLED" = isDonorFull
    ? "PAID"
    : donorPaidAmount > 0
    ? "PARTIALLY_PAID"
    : "PENDING";

  const donorPaidAt = parseDateSafe(donorDeal.paidAt || r.paidAt) || (isDonorFull ? caseDate : null);

  const invoiceNumber = (clinicDeal.invoiceNumber || r.invoiceNumber || "").trim();
  const hasInvoice = Boolean(invoiceNumber || clinicDeal.isInvoiceGenerated || r.isInvoiceGenerated);

  return {
    registrationId: r.registrationId,
    donorId: r.donorId || r.registrationId,
    donorName: r.personalInfo?.fullName || "Donor",
    donorType: r.donorType,
    hospitalId: hosp?._id?.toString() || "",
    hospitalName: hosp?.name || "Unassigned Clinic",
    hospitalState: hosp?.state || "Delhi",
    branchName: r.assignedBranch || clinicDeal.assignedBranch || hosp?.branches?.[0]?.branchName || "Main Branch",
    pickupDate: r.pickupDate || "",
    invoiceDate: clinicDeal.invoiceDate || r.invoiceDate || "",
    invoiceNumber,
    hasInvoice,
    caseDate,
    financialYear,
    quarter,
    year,
    month,
    dealPrice,
    serviceCharge,
    gstAmount,
    tdsPercentage,
    tdsAmount,
    netReceivableFromClinic,
    donorCompensation,
    clinicPaymentStatus,
    clinicReceivedAmount,
    clinicPendingAmount,
    clinicReceivedAt,
    clinicPaymentReference: clinicDeal.paymentReference || "",
    clinicPayments,
    donorPaymentStatus,
    donorPaidAmount,
    donorPendingAmount,
    donorPaidAt,
    donorPaymentReference: donorDeal.paymentReference || "",
    donorPayments,
  };
}
