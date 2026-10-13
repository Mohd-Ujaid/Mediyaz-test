import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import {
  MEDIYAZ_LOGO_BASE64,
  MEDIYAZ_BANK_ISSUER,
} from "../invoice/invoice-assets";
import { numberToWordsIndian } from "@/lib/invoice-utils";

export interface DonorLedgerEntry {
  sNo: number;
  registrationId: string;
  donorId?: string;
  donorName: string;
  donorType: "egg" | "sperm";
  hospitalName: string;
  compensationAmount: number;
  advanceAmount: number;
  paidAmount: number;
  balancePending: number;
  paymentMethod: string;
  paymentStatus: "PAID" | "PENDING" | "PARTIALLY_PAID";
  date?: string;
  recruitmentDate?: string;
  supplyDate?: string;
  paidAt?: string;
  paymentRef?: string;
}

export interface DonorLedgerPdfData {
  reportTitle?: string;
  generatedAt: string;
  generatedBy?: string;
  filterClinicName?: string;
  donorTypeFilter?: string;
  statusFilter?: string;
  entries: DonorLedgerEntry[];
  totals: {
    totalDonors: number;
    totalCompensation: number;
    totalPaid: number;
    totalPending: number;
    settlementRate: number;
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 22,
    fontFamily: "Helvetica",
    fontSize: 7.2,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  // Main Title: Centered, formal, uppercase
  titleContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2.2,
    color: "#0f172a",
    textAlign: "center",
    textTransform: "uppercase",
  },
  subTitle: {
    fontSize: 7.6,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textAlign: "center",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Top 2-Column Section (Logo & Company on Left, Meta & Account on Right)
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
    gap: 10,
  },
  leftHeaderCol: {
    width: "36%",
  },
  rightHeaderCol: {
    width: "64%",
  },
  logoBox: {
    marginBottom: 3,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoImage: {
    maxWidth: 170,
    height: 60,
    objectFit: "contain",
  },

  // Left Header Company Address Grid (Matching Invoice Layout)
  companyTable: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
  },
  companyTableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    minHeight: 12,
  },
  companyTableCellLabel: {
    width: "28%",
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    alignSelf: "stretch",
  },
  companyTableCellValue: {
    width: "72%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  companyTableCellValueAddress: {
    width: "72%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.4,
    color: "#0f172a",
    lineHeight: 1.2,
  },

  // Right Header Meta Grid (Matching Invoice Layout)
  metaTable: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    marginBottom: 3,
  },
  metaTableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    minHeight: 12,
  },
  metaTableCellLabel: {
    width: "28%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    alignSelf: "stretch",
  },
  metaTableCellValue: {
    width: "72%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Statement / Account Info Box (Matching Invoice Layout)
  billToBox: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
  },
  billToRow: {
    flexDirection: "row",
    minHeight: 12,
  },
  billToLabel: {
    width: "28%",
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    alignSelf: "stretch",
  },
  billToValue: {
    width: "72%",
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Main Ledger Table Styling (Matching Invoice Architecture)
  tableContainer: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    marginBottom: 5,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  thCol: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  thText: {
    fontSize: 6.2,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
    textTransform: "uppercase",
  },

  // Table Body Rows
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#cbd5e1",
    minHeight: 14,
  },
  tableRowEven: {
    backgroundColor: "#ffffff",
  },
  tableRowOdd: {
    backgroundColor: "#f8fafc",
  },
  tdCol: {
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    borderRightWidth: 0.6,
    borderRightColor: "#cbd5e1",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  tdText: {
    fontSize: 6.8,
    color: "#0f172a",
  },
  tdTextBold: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  tdSubText: {
    fontSize: 5.6,
    color: "#64748b",
    marginTop: 0.5,
  },

  // Totals & In-Words Section (Matching Invoice's totalSectionRow)
  totalSectionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  totalWordsCol: {
    width: "64%",
    borderRightWidth: 1,
    borderRightColor: "#334155",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  totalWordsTopRow: {
    minHeight: 12,
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  totalWordsTopText: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  totalWordsBody: {
    padding: 4,
    flex: 1,
    justifyContent: "center",
  },
  wordsAmountText: {
    fontSize: 7.4,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    lineHeight: 1.3,
  },

  // Total Summary Column (Right Side of Table Bottom)
  totalSummaryCol: {
    width: "36%",
    alignSelf: "stretch",
  },
  taxRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    minHeight: 12,
  },
  taxLabelCol: {
    width: "60%",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  taxLabelText: {
    fontSize: 6.3,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  taxValCol: {
    width: "40%",
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "flex-end",
    alignSelf: "stretch",
  },
  taxValText: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    minHeight: 13,
  },
  grandTotalLabelCol: {
    width: "60%",
    paddingHorizontal: 4,
    paddingVertical: 2.5,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  grandTotalLabelText: {
    fontSize: 6.6,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  grandTotalValCol: {
    width: "40%",
    paddingHorizontal: 4,
    paddingVertical: 2.5,
    justifyContent: "center",
    alignItems: "flex-end",
    alignSelf: "stretch",
  },
  grandTotalValText: {
    fontSize: 7.4,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },

  // Bank Remittance Table (Full Width in Landscape, No Signature Box)
  bottomGrid: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    marginBottom: 4,
  },
  bankHeader: {
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  bankTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
    color: "#0f172a",
    textDecoration: "underline",
  },
  bankTableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    minHeight: 11.5,
  },
  bankTableCellLabel: {
    width: "18%",
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    alignSelf: "stretch",
  },
  bankTableCellValue: {
    width: "82%",
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // Terms & Conditions Box (Matching Invoice Layout)
  termsBox: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    padding: 3,
  },
  termsTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.6,
    color: "#0f172a",
    marginBottom: 1.5,
  },
  termsLine: {
    fontSize: 5.7,
    lineHeight: 1.25,
    color: "#334155",
  },
});

const formatCurrency = (amount: number) => {
  return "Rs. " + (amount || 0).toLocaleString("en-IN");
};

export function DonorLedgerPdfDocument({
  data,
}: {
  data: DonorLedgerPdfData;
}) {
  const { entries = [], totals } = data;
  const clinicRecipientName = data.filterClinicName
    ? data.filterClinicName.toUpperCase()
    : "ALL REGISTERED DONOR BENEFICIARIES";

  const statementRef = `MED-DNR-LEDGER-${new Date().getFullYear()}-${String(
    totals.totalDonors || 1
  ).padStart(3, "0")}`;

  const pendingWords =
    totals.totalPending > 0
      ? numberToWordsIndian(totals.totalPending)
      : "NIL / ZERO ONLY";

  return (
    <Document
      title={`Mediyaz_Donor_Disbursement_Ledger_${clinicRecipientName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`}
      author={MEDIYAZ_BANK_ISSUER.name}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Main Title: MEDIYAZ ART BANK DONOR LEDGER */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>MEDIYAZ ART BANK DONOR LEDGER</Text>
          <Text style={styles.subTitle}>
            {data.filterClinicName
              ? `DONOR DISBURSEMENTS FOR: ${clinicRecipientName}`
              : "DONOR COMPENSATION & DISBURSEMENT LEDGER STATEMENT"}
          </Text>
        </View>

        {/* Top 2-Column Header Row */}
        <View style={styles.headerRow}>
          {/* Top Left: Logo & Company Address */}
          <View style={styles.leftHeaderCol}>
            <View style={styles.logoBox}>
              <Image src={MEDIYAZ_LOGO_BASE64} style={styles.logoImage} />
            </View>
            <View style={styles.companyTable}>
              <View style={styles.companyTableRow}>
                <Text style={styles.companyTableCellLabel}>Address.</Text>
                <Text style={styles.companyTableCellValueAddress}>
                  {MEDIYAZ_BANK_ISSUER.addressLine1}{" "}
                  {MEDIYAZ_BANK_ISSUER.addressLine2}
                </Text>
              </View>
              <View style={styles.companyTableRow}>
                <Text style={styles.companyTableCellLabel}>Contact No.</Text>
                <Text style={styles.companyTableCellValue}>
                  {MEDIYAZ_BANK_ISSUER.contactNo}
                </Text>
              </View>
              <View style={styles.companyTableRow}>
                <Text style={styles.companyTableCellLabel}>Email :</Text>
                <Text style={styles.companyTableCellValue}>
                  {MEDIYAZ_BANK_ISSUER.email}
                </Text>
              </View>
              <View style={styles.companyTableRow}>
                <Text style={styles.companyTableCellLabel}>Govt Reg:</Text>
                <Text style={styles.companyTableCellValue}>
                  {MEDIYAZ_BANK_ISSUER.registrationNumber}
                </Text>
              </View>
              <View style={[styles.companyTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.companyTableCellLabel}>GSTIN/UIN:</Text>
                <Text style={styles.companyTableCellValue}>
                  {MEDIYAZ_BANK_ISSUER.gstin}
                </Text>
              </View>
            </View>
          </View>

          {/* Top Right: Meta Table & STATEMENT FOR Box */}
          <View style={styles.rightHeaderCol}>
            {/* Meta Table */}
            <View style={styles.metaTable}>
              <View style={styles.metaTableRow}>
                <Text style={styles.metaTableCellLabel}>Statement Date:</Text>
                <Text style={styles.metaTableCellValue}>
                  {data.generatedAt || ""}
                </Text>
              </View>
              <View style={styles.metaTableRow}>
                <Text style={styles.metaTableCellLabel}>Statement Ref:</Text>
                <Text style={styles.metaTableCellValue}>{statementRef}</Text>
              </View>
              <View style={styles.metaTableRow}>
                <Text style={styles.metaTableCellLabel}>Ledger Type:</Text>
                <Text style={styles.metaTableCellValue}>
                  DONOR COMPENSATION LEDGER
                </Text>
              </View>
              <View style={[styles.metaTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.metaTableCellLabel}>SAC / Currency:</Text>
                <Text style={styles.metaTableCellValue}>
                  SAC 999317 | INR (Indian Rupee)
                </Text>
              </View>
            </View>

            {/* STATEMENT FOR Box */}
            <View style={styles.billToBox}>
              <View style={[styles.billToRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.billToLabel}>STATEMENT FOR:</Text>
                <Text style={styles.billToValue}>{clinicRecipientName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table Container (Landscape Architecture with Recruitment & Supply Dates) */}
        <View style={styles.tableContainer}>
          {/* Table Header Row */}
          <View style={styles.tableHeaderRow}>
            <View style={[styles.thCol, { width: "3%" }]}>
              <Text style={styles.thText}>Sr.</Text>
            </View>
            <View style={[styles.thCol, { width: "9%" }]}>
              <Text style={styles.thText}>RECRUITMENT DATE</Text>
            </View>
            <View style={[styles.thCol, { width: "9%" }]}>
              <Text style={styles.thText}>SUPPLY DATE</Text>
            </View>
            <View style={[styles.thCol, { width: "16%" }]}>
              <Text style={styles.thText}>REGISTRATION NO.</Text>
            </View>
            <View style={[styles.thCol, { width: "18%" }]}>
              <Text style={styles.thText}>HOSPITAL / CLINIC</Text>
            </View>
            <View style={[styles.thCol, { width: "17%" }]}>
              <Text style={styles.thText}>DONOR DETAILS</Text>
            </View>
            <View style={[styles.thCol, { width: "9%" }]}>
              <Text style={styles.thText}>COMPENSATION</Text>
            </View>
            <View style={[styles.thCol, { width: "9%" }]}>
              <Text style={styles.thText}>PAID AMOUNT</Text>
            </View>
            <View
              style={[
                styles.thCol,
                { width: "10%", borderRightWidth: 0 },
              ]}
            >
              <Text style={styles.thText}>PENDING</Text>
            </View>
          </View>

          {/* Table Body Rows */}
          {entries.map((entry, index) => {
            const isEven = index % 2 === 0;
            const hasPending = entry.balancePending > 0;

            return (
              <View
                key={entry.registrationId || index}
                style={[
                  styles.tableRow,
                  isEven ? styles.tableRowEven : styles.tableRowOdd,
                ]}
                wrap={false}
              >
                {/* Sr. No */}
                <View
                  style={[
                    styles.tdCol,
                    { width: "3%", alignItems: "center" },
                  ]}
                >
                  <Text style={styles.tdText}>{entry.sNo}</Text>
                </View>

                {/* Recruitment Date */}
                <View
                  style={[
                    styles.tdCol,
                    { width: "9%", alignItems: "center" },
                  ]}
                >
                  <Text style={styles.tdText}>
                    {entry.recruitmentDate || entry.date || "-"}
                  </Text>
                </View>

                {/* Supply Date */}
                <View
                  style={[
                    styles.tdCol,
                    { width: "9%", alignItems: "center" },
                  ]}
                >
                  <Text style={styles.tdText}>
                    {entry.supplyDate || "-"}
                  </Text>
                </View>

                {/* Registration Number */}
                <View style={[styles.tdCol, { width: "16%" }]}>
                  <Text style={styles.tdTextBold}>
                    {entry.registrationId}
                  </Text>
                </View>

                {/* Hospital / Clinic */}
                <View style={[styles.tdCol, { width: "18%" }]}>
                  <Text style={styles.tdTextBold}>
                    {entry.hospitalName || "N/A"}
                  </Text>
                </View>

                {/* Donor Details */}
                <View style={[styles.tdCol, { width: "17%" }]}>
                  <Text style={styles.tdTextBold}>{entry.donorName}</Text>
                  <Text style={styles.tdSubText}>
                    ({entry.donorType.toUpperCase()})
                  </Text>
                </View>

                {/* Compensation Amount */}
                <View
                  style={[
                    styles.tdCol,
                    { width: "9%", alignItems: "flex-end" },
                  ]}
                >
                  <Text style={styles.tdTextBold}>
                    {formatCurrency(entry.compensationAmount)}
                  </Text>
                </View>

                {/* Paid Amount */}
                <View
                  style={[
                    styles.tdCol,
                    { width: "9%", alignItems: "flex-end" },
                  ]}
                >
                  <Text style={styles.tdTextBold}>
                    {formatCurrency(entry.paidAmount)}
                  </Text>
                </View>

                {/* Pending Amount */}
                <View
                  style={[
                    styles.tdCol,
                    {
                      width: "10%",
                      alignItems: "flex-end",
                      borderRightWidth: 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tdTextBold,
                      hasPending ? { color: "#b91c1c" } : {},
                    ]}
                  >
                    {formatCurrency(entry.balancePending)}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Totals & In-Words Section */}
          <View style={styles.totalSectionRow} wrap={false}>
            {/* Left: Amount in Words */}
            <View style={styles.totalWordsCol}>
              <View style={styles.totalWordsTopRow}>
                <Text style={styles.totalWordsTopText}>
                  NET PENDING DISBURSEMENT IN WORDS:
                </Text>
              </View>
              <View style={styles.totalWordsBody}>
                <Text style={styles.wordsAmountText}>{pendingWords}</Text>
              </View>
            </View>

            {/* Right: Balance Summary */}
            <View style={styles.totalSummaryCol}>
              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>
                    Total Compensation
                  </Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={styles.taxValText}>
                    {formatCurrency(totals.totalCompensation)}
                  </Text>
                </View>
              </View>

              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>
                    Total Paid to Donors
                  </Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={styles.taxValText}>
                    {formatCurrency(totals.totalPaid)}
                  </Text>
                </View>
              </View>

              <View style={styles.grandTotalRow}>
                <View style={styles.grandTotalLabelCol}>
                  <Text style={styles.grandTotalLabelText}>
                    NET BALANCE PENDING (DUE)
                  </Text>
                </View>
                <View style={styles.grandTotalValCol}>
                  <Text
                    style={[
                      styles.grandTotalValText,
                      totals.totalPending > 0 ? { color: "#b91c1c" } : {},
                    ]}
                  >
                    {formatCurrency(totals.totalPending)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bank Disbursement Account Details Table (Full Width, Signature Box Removed) */}
        <View style={styles.bottomGrid} wrap={false}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankTitle}>
              OFFICIAL BANK DISBURSEMENT ACCOUNT DETAILS
            </Text>
          </View>
          <View style={styles.bankTableRow}>
            <Text style={styles.bankTableCellLabel}>Account Name:</Text>
            <Text style={styles.bankTableCellValue}>
              {MEDIYAZ_BANK_ISSUER.bankName}
            </Text>
          </View>
          <View style={styles.bankTableRow}>
            <Text style={styles.bankTableCellLabel}>Bank & Branch:</Text>
            <Text style={styles.bankTableCellValue}>
              Axis Bank, {MEDIYAZ_BANK_ISSUER.addressLine1}
            </Text>
          </View>
          <View style={styles.bankTableRow}>
            <Text style={styles.bankTableCellLabel}>Account Number:</Text>
            <Text style={styles.bankTableCellValue}>
              {MEDIYAZ_BANK_ISSUER.bankAccountNo}
            </Text>
          </View>
          <View style={styles.bankTableRow}>
            <Text style={styles.bankTableCellLabel}>IFSC / MICR:</Text>
            <Text style={styles.bankTableCellValue}>
              {MEDIYAZ_BANK_ISSUER.ifsc} / {MEDIYAZ_BANK_ISSUER.micr}
            </Text>
          </View>
          <View style={[styles.bankTableRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.bankTableCellLabel}>PAN / GSTIN:</Text>
            <Text style={styles.bankTableCellValue}>
              {MEDIYAZ_BANK_ISSUER.panNo} / {MEDIYAZ_BANK_ISSUER.gstin}
            </Text>
          </View>
        </View>

        {/* Terms & Conditions Box */}
        <View style={styles.termsBox} wrap={false}>
          <Text style={styles.termsTitle}>
            DONOR REIMBURSEMENT COMPLIANCE CONDITIONS:
          </Text>
          <Text style={styles.termsLine}>
            1. All disbursements represent bona fide insurance and reimbursement allowances stipulated under ART Act 2021.
          </Text>
          <Text style={styles.termsLine}>
            2. Any discrepancy or pending claim reconciliation must be reported within 7 working days from statement issue.
          </Text>
          <Text style={styles.termsLine}>
            3. Payments are remitted via verifiable banking channels directly to verified donor beneficiary accounts.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default DonorLedgerPdfDocument;
