/**
 * Utilities for Indian Financial Year, Quarters, GST and TDS calculations
 */

export function parseDateSafe(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const str = String(val).trim();
  if (!str) return null;

  // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dmy) {
    return new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
  }

  // YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (ymd) {
    return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
  }

  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Returns Indian Financial Year string, e.g. "2026-27"
 * April of year Y to March of year Y+1 belongs to "YYYY-(YY+1)"
 */
export function getFinancialYear(dateVal: any): string {
  const dt = parseDateSafe(dateVal) || new Date();
  const month = dt.getMonth() + 1; // 1-12
  const fullYear = dt.getFullYear();

  if (month >= 4) {
    const nextYr = (fullYear + 1).toString().slice(-2);
    return `${fullYear}-${nextYr}`;
  } else {
    const currentYrShort = fullYear.toString().slice(-2);
    return `${fullYear - 1}-${currentYrShort}`;
  }
}

/**
 * Returns Indian Financial Quarter:
 * Q1: Apr - Jun (Months 4, 5, 6)
 * Q2: Jul - Sep (Months 7, 8, 9)
 * Q3: Oct - Dec (Months 10, 11, 12)
 * Q4: Jan - Mar (Months 1, 2, 3)
 */
export function getIndianQuarter(dateVal: any): "Q1" | "Q2" | "Q3" | "Q4" {
  const dt = parseDateSafe(dateVal) || new Date();
  const m = dt.getMonth() + 1;
  if (m >= 4 && m <= 6) return "Q1";
  if (m >= 7 && m <= 9) return "Q2";
  if (m >= 10 && m <= 12) return "Q3";
  return "Q4";
}

/**
 * Calculates GST based on service charge and clinic state
 * State "Delhi" -> Intra-state (CGST 9% + SGST 9%)
 * Other States -> Inter-state (IGST 18%)
 */
export function calculateGst(
  serviceCharge: number,
  state?: string,
  customTaxRate: number = 18
) {
  const taxableValue = Math.max(0, serviceCharge || 0);
  const isInterState = state ? !state.toLowerCase().includes("delhi") : false;

  if (isInterState) {
    const igstRate = customTaxRate;
    const igstAmount = Math.round((taxableValue * igstRate) / 100);
    return {
      taxableValue,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate,
      igstAmount,
      totalGst: igstAmount,
      supplyType: "INTER" as const,
      placeOfSupply: state || "Other State",
    };
  } else {
    const halfRate = customTaxRate / 2;
    const cgstAmount = Math.round((taxableValue * halfRate) / 100);
    const sgstAmount = Math.round((taxableValue * halfRate) / 100);
    return {
      taxableValue,
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      totalGst: cgstAmount + sgstAmount,
      supplyType: "INTRA" as const,
      placeOfSupply: "Delhi (07)",
    };
  }
}

/**
 * Calculates TDS on amount
 */
export function calculateTds(amount: number, percentage: number = 10): number {
  if (!amount || amount <= 0 || !percentage || percentage <= 0) return 0;
  return Math.round((amount * percentage) / 100);
}

/**
 * Generate formatted payment number, e.g. "PAY-2610-0042"
 */
export function generatePaymentNo(sequenceNumber: number, date: Date = new Date()): string {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const seq = sequenceNumber.toString().padStart(4, "0");
  return `PAY-${yy}${mm}-${seq}`;
}

/**
 * Generate formatted billing reference for non-invoiced donor records, e.g. "MB-2610-0042"
 */
export function generateBillRef(sequenceNumber: number, date: Date = new Date()): string {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const seq = sequenceNumber.toString().padStart(4, "0");
  return `MB-${yy}${mm}-${seq}`;
}
