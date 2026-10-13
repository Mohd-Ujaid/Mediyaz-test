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

export interface ClinicLedgerEntry {
  sNo: number;
  donorName: string;
  registrationId: string;
  clinicName?: string;
  hospitalName: string;
  location?: string;
  hospitalLocation?: string;
  hospitalCity?: string;
  hospitalCode?: string;
  donorOpuLocation?: string;
  opuLocation?: string;
  donorOpuDate?: string;
  opuDate?: string;
  pickupDate?: string;
  invoiceDate: string;
  invoiceNumber: string;
  amount: number;
  dealPrice: number;
  tdsPercentage?: number;
  tdsAmount?: number;
  gstAmount?: number;
  netAmount?: number;
  creditDate?: string;
  receivedDate?: string;
  creditAmount?: number;
  receivedAmount: number;
  pendingAmount: number;
  paymentStatus: "RECEIVED" | "PENDING" | "PARTIALLY_RECEIVED";
  date?: string;
  paymentRef?: string;
  donorId?: string;
  donorType?: "egg" | "sperm";
  recruitmentDate?: string;
  supplyDate?: string;
}

export interface ClinicLedgerPdfData {
  reportTitle?: string;
  generatedAt: string;
  generatedBy?: string;
  filterClinicName?: string;
  donorTypeFilter?: string;
  statusFilter?: string;
  entries: ClinicLedgerEntry[];
  totals: {
    totalRecords: number;
    totalDealPrice: number;
    totalAmount?: number;
    totalTdsAmount?: number;
    totalGstAmount?: number;
    totalNetAmount?: number;
    totalReceived: number;
    totalCreditAmount?: number;
    totalPending: number;
    collectionRate: number;
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

  // Top 2-Column Section (Logo & Company on Left, Meta & Bill-To on Right)
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

  // Bill To / Statement Recipient Box (Matching Invoice Layout)
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
    paddingVertical: 2.5,
    paddingHorizontal: 1.5,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  thText: {
    fontSize: 5.3,
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
    minHeight: 13,
  },
  tableRowEven: {
    backgroundColor: "#ffffff",
  },
  tableRowOdd: {
    backgroundColor: "#f8fafc",
  },
  tdCol: {
    paddingVertical: 2,
    paddingHorizontal: 1.8,
    borderRightWidth: 0.6,
    borderRightColor: "#cbd5e1",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  tdText: {
    fontSize: 5.8,
    color: "#0f172a",
  },
  tdTextBold: {
    fontSize: 5.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  tdSubText: {
    fontSize: 4.8,
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
    paddingVertical: 2,
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
    paddingVertical: 2,
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

export function ClinicLedgerPdfDocument({
  data,
}: {
  data: ClinicLedgerPdfData;
}) {
  const { entries = [], totals } = data;
  const clinicRecipientName = data.filterClinicName
    ? data.filterClinicName.toUpperCase()
    : "ALL REGISTERED ART CLINICS";

  const statementRef = `MED-LEDGER-${new Date().getFullYear()}-${String(
    totals.totalRecords || 1
  ).padStart(3, "0")}`;

  const pendingWords =
    totals.totalPending > 0
      ? numberToWordsIndian(totals.totalPending)
      : "NIL / ZERO ONLY";

  return (
    <Document
      title={`Mediyaz_ART_Bank_Ledger_${clinicRecipientName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`}
      author={MEDIYAZ_BANK_ISSUER.name}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Main Title: MEDIYAZ ART BANK LEDGER */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>MEDIYAZ ART BANK LEDGER</Text>
          <Text style={styles.subTitle}>
            {data.filterClinicName
              ? `STATEMENT FOR CLINIC: ${clinicRecipientName}`
              : "CLINIC FINANCIAL CONSIDERATION & RECONCILIATION STATEMENT"}
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

          {/* Top Right: Meta Table & BILL TO Clinic Box */}
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
                  CLINIC CONSIDERATION LEDGER
                </Text>
              </View>
              <View style={[styles.metaTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.metaTableCellLabel}>SAC / Currency:</Text>
                <Text style={styles.metaTableCellValue}>
                  SAC 999317 | INR (Indian Rupee)
                </Text>
              </View>
            </View>

            {/* BILL TO Box */}
            <View style={styles.billToBox}>
              <View style={[styles.billToRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.billToLabel}>STATEMENT FOR:</Text>
                <Text style={styles.billToValue}>{clinicRecipientName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table Container (Landscape Architecture with Invoice, Dates, and Amounts) */}
        <View style={styles.tableContainer}>
          {/* Table Header Row */}
          <View style={styles.tableHeaderRow}>
            <View style={[styles.thCol, { width: "2.5%" }]}>
              <Text style={styles.thText}>Sr.</Text>
            </View>
            <View style={[styles.thCol, { width: "8.5%" }]}>
              <Text style={styles.thText}>DONOR NAME</Text>
            </View>
            <View style={[styles.thCol, { width: "9.0%" }]}>
              <Text style={styles.thText}>REGISTRATION NO.</Text>
            </View>
            <View style={[styles.thCol, { width: "8.5%" }]}>
              <Text style={styles.thText}>CLINIC NAME</Text>
            </View>
            <View style={[styles.thCol, { width: "6.5%" }]}>
              <Text style={styles.thText}>LOCATION</Text>
            </View>
            <View style={[styles.thCol, { width: "8.0%" }]}>
              <Text style={styles.thText}>DONOR OPU LOCATION</Text>
            </View>
            <View style={[styles.thCol, { width: "6.0%" }]}>
              <Text style={styles.thText}>DONOR OPU DATE</Text>
            </View>
            <View style={[styles.thCol, { width: "6.0%" }]}>
              <Text style={styles.thText}>INVOICE DATE</Text>
            </View>
            <View style={[styles.thCol, { width: "6.0%" }]}>
              <Text style={styles.thText}>INVOICE NO.</Text>
            </View>
            <View style={[styles.thCol, { width: "7.0%" }]}>
              <Text style={styles.thText}>AMOUNT</Text>
            </View>
            <View style={[styles.thCol, { width: "6.0%" }]}>
              <Text style={styles.thText}>TDS -</Text>
            </View>
            <View style={[styles.thCol, { width: "5.0%" }]}>
              <Text style={styles.thText}>GST +</Text>
            </View>
            <View style={[styles.thCol, { width: "7.0%" }]}>
              <Text style={styles.thText}>NET AMOUNT</Text>
            </View>
            <View style={[styles.thCol, { width: "6.5%" }]}>
              <Text style={styles.thText}>CREDIT DATE</Text>
            </View>
            <View style={[styles.thCol, { width: "7.5%", borderRightWidth: 0 }]}>
              <Text style={styles.thText}>CREDIT AMOUNT</Text>
            </View>
          </View>

          {/* Table Body Rows */}
          {entries.map((entry, index) => {
            const isEven = index % 2 === 0;
            const hasPending = entry.pendingAmount > 0;
            const isReceived = entry.paymentStatus === "RECEIVED";
            const isPartial = entry.paymentStatus === "PARTIALLY_RECEIVED";
            const grossAmt = entry.amount || entry.dealPrice || 0;
            const tdsAmt = entry.tdsAmount || 0;
            const gstAmt = entry.gstAmount || 0;
            const netAmt = entry.netAmount || Math.max(0, grossAmt - tdsAmt + gstAmt);
            const credAmt = entry.creditAmount !== undefined ? entry.creditAmount : entry.receivedAmount || 0;
            const credDate = entry.creditDate && entry.creditDate !== "-" ? entry.creditDate : (entry.receivedDate || (isReceived ? "Cleared" : "Pending"));

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
                <View style={[styles.tdCol, { width: "2.5%", alignItems: "center" }]}>
                  <Text style={styles.tdText}>{entry.sNo}</Text>
                </View>

                {/* Donor Name */}
                <View style={[styles.tdCol, { width: "8.5%" }]}>
                  <Text style={styles.tdTextBold}>{entry.donorName}</Text>
                </View>

                {/* Registration No */}
                <View style={[styles.tdCol, { width: "9.0%" }]}>
                  <Text style={styles.tdTextBold}>{entry.registrationId}</Text>
                  <Text style={styles.tdSubText}>
                    {entry.donorType ? entry.donorType.toUpperCase() : "DONOR"}
                  </Text>
                </View>

                {/* Clinic Name */}
                <View style={[styles.tdCol, { width: "8.5%" }]}>
                  <Text style={styles.tdTextBold}>
                    {entry.clinicName || entry.hospitalName || "N/A"}
                  </Text>
                </View>

                {/* Location */}
                <View style={[styles.tdCol, { width: "6.5%" }]}>
                  <Text style={styles.tdText}>
                    {entry.location || entry.hospitalLocation || entry.hospitalCity || "-"}
                  </Text>
                </View>

                {/* Donor OPU Location */}
                <View style={[styles.tdCol, { width: "8.0%" }]}>
                  <Text style={styles.tdTextBold}>
                    {entry.donorOpuLocation || entry.opuLocation || "-"}
                  </Text>
                </View>

                {/* Donor OPU Date */}
                <View style={[styles.tdCol, { width: "6.0%" }]}>
                  <Text style={styles.tdTextBold}>
                    {entry.donorOpuDate || entry.opuDate || entry.pickupDate || "-"}
                  </Text>
                </View>

                {/* Invoice Date */}
                <View style={[styles.tdCol, { width: "6.0%" }]}>
                  <Text style={styles.tdTextBold}>{entry.invoiceDate || "-"}</Text>
                </View>

                {/* Invoice No */}
                <View style={[styles.tdCol, { width: "6.0%" }]}>
                  <Text style={styles.tdTextBold}>
                    {entry.invoiceNumber
                      ? entry.invoiceNumber.startsWith("#")
                        ? entry.invoiceNumber
                        : `#${entry.invoiceNumber}`
                      : "N/A"}
                  </Text>
                </View>

                {/* Amount (Gross) */}
                <View style={[styles.tdCol, { width: "7.0%", alignItems: "flex-end" }]}>
                  <Text style={styles.tdTextBold}>{formatCurrency(grossAmt)}</Text>
                </View>

                {/* TDS - */}
                <View style={[styles.tdCol, { width: "6.0%", alignItems: "flex-end" }]}>
                  <Text style={[styles.tdTextBold, { color: "#c2410c" }]}>
                    {tdsAmt > 0 ? `-${formatCurrency(tdsAmt)}` : "₹0"}
                  </Text>
                  <Text style={styles.tdSubText}>
                    {entry.tdsPercentage ? `(${entry.tdsPercentage}%)` : "0%"}
                  </Text>
                </View>

                {/* GST + */}
                <View style={[styles.tdCol, { width: "5.0%", alignItems: "flex-end" }]}>
                  <Text style={[styles.tdTextBold, { color: "#047857" }]}>
                    {gstAmt > 0 ? `+${formatCurrency(gstAmt)}` : "₹0"}
                  </Text>
                  <Text style={styles.tdSubText}>
                    {gstAmt > 0 ? "18% on SC" : "Exempt"}
                  </Text>
                </View>

                {/* Net Amount */}
                <View style={[styles.tdCol, { width: "7.0%", alignItems: "flex-end" }]}>
                  <Text style={[styles.tdTextBold, { color: "#0f766e" }]}>
                    {formatCurrency(netAmt)}
                  </Text>
                </View>

                {/* Credit Date */}
                <View style={[styles.tdCol, { width: "6.5%" }]}>
                  <Text style={styles.tdTextBold}>{credDate}</Text>
                </View>

                {/* Credit Amount */}
                <View style={[styles.tdCol, { width: "7.5%", alignItems: "flex-end", borderRightWidth: 0 }]}>
                  <Text
                    style={[
                      styles.tdTextBold,
                      { color: isReceived ? "#047857" : credAmt > 0 ? "#0284c7" : "#b91c1c" },
                    ]}
                  >
                    {formatCurrency(credAmt)}
                  </Text>
                  <Text style={[styles.tdSubText, { textTransform: "uppercase" }]}>
                    {isReceived ? "PAID" : isPartial ? "PARTIAL" : "PENDING"}
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
                  NET OUTSTANDING BALANCE IN WORDS:
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
                    Gross Consideration Amount:
                  </Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={styles.taxValText}>
                    {formatCurrency(totals.totalDealPrice || totals.totalAmount || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>
                    Less TDS Deductions (-):
                  </Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={[styles.taxValText, { color: "#c2410c" }]}>
                    -{formatCurrency(totals.totalTdsAmount || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>
                    Add GST on Service Charge (18% +):
                  </Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={[styles.taxValText, { color: "#047857" }]}>
                    +{formatCurrency(totals.totalGstAmount || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>
                    Net Amount Receivable:
                  </Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={[styles.taxValText, { color: "#0f766e" }]}>
                    {formatCurrency(totals.totalNetAmount || (((totals.totalDealPrice || 0) - (totals.totalTdsAmount || 0)) + (totals.totalGstAmount || 0)))}
                  </Text>
                </View>
              </View>

              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>
                    Total Bank Credit Received:
                  </Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={[styles.taxValText, { color: "#047857" }]}>
                    {formatCurrency(totals.totalReceived || totals.totalCreditAmount || 0)}
                  </Text>
                </View>
              </View>

              <View style={styles.grandTotalRow}>
                <View style={styles.grandTotalLabelCol}>
                  <Text style={styles.grandTotalLabelText}>
                    NET BALANCE PENDING (DUE):
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

        {/* Bank Remittance Table (Full Width, Signature Box Removed) */}
        <View style={styles.bottomGrid} wrap={false}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankTitle}>
              BANK REMITTANCE DETAILS (FOR SETTLEMENT)
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
            TERMS & STATUTORY RECONCILIATION CONDITIONS:
          </Text>
          <Text style={styles.termsLine}>
            1. All financial consideration records correspond to verified ART donor registrations as per the Assisted Reproductive Technology (Regulation) Act, 2021.
          </Text>
          <Text style={styles.termsLine}>
            2. Any discrepancy or reconciliation query must be notified in writing to Mediyaz ART Bank within 7 working days from the statement date.
          </Text>
          <Text style={styles.termsLine}>
            3. All remittances and settlements must be made strictly via RTGS / NEFT / Cheque in favor of &quot;MEDIYAZ ART BANK&quot; at the bank coordinates specified above.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default ClinicLedgerPdfDocument;
