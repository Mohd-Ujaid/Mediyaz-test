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
  MEDIYAZ_SIGNATURE_BASE64,
  MEDIYAZ_BANK_ISSUER,
  INVOICE_TERMS_AND_CONDITIONS,
  INVOICE_NOTES,
} from "./invoice-assets";
import { numberToWordsIndian } from "@/lib/invoice-utils";

export interface CompletedFileInvoiceData {
  invoiceNumber: string;
  invoiceDate: string; // e.g. "19.09.2026"
  sacCode?: string; // "999317"
  gstin?: string; // "07FJBPS6601G1Z7"
  donorType: "egg" | "sperm";
  donorName: string;
  huidNo: string;
  hospitalName: string;
  hospitalGstin?: string;
  hospitalAddress?: string;
  pickupDate: string; // e.g. "19.09.2026"
  pickupLocation?: string;
  saleType?: "STATE" | "INTER-STATE";
  serviceCharge: number; // default 5000
  serviceChargeSac?: string; // default 999321
  donorReimbursement: number; // default 95000
  reimbursementSac?: string; // default 999317
  cgstRate?: number; // 9
  cgstAmount?: number; // 450
  sgstRate?: number; // 9
  sgstAmount?: number; // 450
  igstRate?: number; // 0 or 18
  igstAmount?: number; // 0
  totalAmountBeforeTax?: number; // default 100000
  totalAmountAfterTax: number; // 100900
  amountInWords?: string;
  beforeTaxAmountInWords?: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 22,
    fontFamily: "Helvetica",
    fontSize: 7.2,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  // Main title
  titleContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2.5,
    color: "#0f172a",
    textAlign: "center",
    textTransform: "uppercase",
  },
  // Top 2-Column Section (Logo & Bank on Left, Meta & Bill To on Right)
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 6,
    gap: 8,
  },
  leftHeaderCol: {
    width: "36%",
  },
  rightHeaderCol: {
    width: "64%",
  },
  logoBox: {
    // height: 100,
    marginBottom: 4,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoImage: {
    maxWidth: 180,
    height: 80,
    objectFit: "contain",
  },
  // Left Header Company Address Grid (matching Meta Table)
  companyTable: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
  },
  companyTableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    minHeight: 12.5,
  },
  companyTableCellLabel: {
    width: "24%",
    paddingVertical: 2,
    paddingHorizontal: 2.5,
    borderRightWidth: 0.6,
    borderRightColor: "#475569",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    alignSelf: "stretch",
  },
  companyTableCellValue: {
    width: "76%",
    paddingVertical: 2,
    paddingHorizontal: 3.5,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  companyTableCellValueAddress: {
    width: "76%",
    paddingVertical: 2,
    paddingHorizontal: 3.5,
    fontSize: 6.4,
    color: "#0f172a",
    lineHeight: 1.25,
  },
  // Right Header Meta Grid
  metaTable: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    marginBottom: 4,
  },
  metaTableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    minHeight: 13,
  },
  metaTableCellLabel: {
    width: "30%",
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
    width: "70%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  // BILL TO Box
  billToBox: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
  },
  billToRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    minHeight: 13,
  },
  billToLabel: {
    width: "30%",
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
  billToValue: {
    width: "70%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  billToValueNormal: {
    width: "62%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.6,
    color: "#1e293b",
    lineHeight: 1.25,
  },
  // Donor Bar
  donorBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    backgroundColor: "#f8fafc",
    marginBottom: 5,
  },
  donorBarText: {
    fontSize: 7.4,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  // Table Styling
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
  // Table Rows
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#cbd5e1",
    minHeight: 15,
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
  // Sub-header for CGST / SGST / IGST
  subHeaderRow: {
    flexDirection: "row",
    borderTopWidth: 0.6,
    borderTopColor: "#475569",
    width: "100%",
  },
  subCol: {
    width: "50%",
    paddingVertical: 1.5,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  // Totals & In-Words Section
  totalSectionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  totalWordsCol: {
    width: "68%",
    borderRightWidth: 1,
    borderRightColor: "#334155",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  totalWordsTopRow: {
    minHeight: 12.5,
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
    justifyContent: "space-between",
  },
  totalSummaryCol: {
    width: "32%",
    alignSelf: "stretch",
  },
  taxRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    minHeight: 12.5,
  },
  taxLabelCol: {
    width: "58%",
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
    width: "42%",
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "flex-end",
    alignSelf: "stretch",
  },
  taxValText: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: "#0f172a",
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    minHeight: 14,
  },
  grandTotalLabelCol: {
    width: "58%",
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
    width: "42%",
    paddingHorizontal: 4,
    paddingVertical: 2.5,
    justifyContent: "center",
    alignItems: "flex-end",
    alignSelf: "stretch",
  },
  grandTotalValText: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
  },
  // Bank Details & Signatory
  bottomGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    marginBottom: 5,
  },
  bankCol: {
    width: "55%",
    borderRightWidth: 1,
    borderRightColor: "#334155",
  },
  bankHeader: {
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    paddingVertical: 2.5,
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
    minHeight: 12.5,
  },
  bankTableCellLabel: {
    width: "36%",
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
  bankTableCellValue: {
    width: "64%",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  signCol: {
    width: "45%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  signCertHeader: {
    borderBottomWidth: 0.6,
    borderBottomColor: "#475569",
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  certText: {
    fontSize: 6.2,
    color: "#0f172a",
    textAlign: "center",
  },
  signMiddleBody: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "space-between",
  },
  bankHeadingRight: {
    fontSize: 7.4,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7",
    textAlign: "center",
  },
  signImage: {
    width: 105,
    height: 24,
    objectFit: "contain",
    marginVertical: 1,
  },
  proprietorText: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#0284c7",
    textAlign: "center",
  },
  signFooterRow: {
    borderTopWidth: 0.6,
    borderTopColor: "#475569",
    minHeight: 12.5,
    paddingVertical: 2,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  signatoryText: {
    fontSize: 7.0,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
  },
  // Terms & Conditions Box
  termsBox: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    padding: 3.5,
    marginBottom: 4,
  },
  termsTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    color: "#0f172a",
    marginBottom: 2,
  },
  termsLine: {
    fontSize: 5.9,
    lineHeight: 1.3,
    color: "#334155",
  },
  // Notes Box
  notesBox: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 2,
    padding: 3.5,
  },
  notesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    color: "#0f172a",
    marginBottom: 2,
  },
  notesLine: {
    fontSize: 5.9,
    lineHeight: 1.3,
    color: "#334155",
  },
});

export default function CompletedFileInvoicePdfDocument({
  invoice,
}: {
  invoice: CompletedFileInvoiceData;
}) {
  if (!invoice) return null;

  const isEgg = invoice.donorType === "egg";
  const pickupLabel = isEgg ? "Date of Oocyte Pickup" : "Date of Sperm Pickup";
  const reimbursementDescription = isEgg
    ? "Rembursment Of Oocyte Donor Exp"
    : "Rembursment Of Sperm Donor Exp";

  const serviceChargeAmount = invoice.serviceCharge || 5000;
  const donorReimbursementAmount = invoice.donorReimbursement || 95000;
  const isInterState = invoice.saleType === "INTER-STATE";

  const cgstRate = isInterState ? 0 : invoice.cgstRate ?? 9;
  const cgstAmount = isInterState ? 0 : invoice.cgstAmount ?? 450;
  const sgstRate = isInterState ? 0 : invoice.sgstRate ?? 9;
  const sgstAmount = isInterState ? 0 : invoice.sgstAmount ?? 450;
  const igstRate = isInterState ? invoice.igstRate ?? 18 : 0;
  const igstAmount = isInterState
    ? invoice.igstAmount ?? (serviceChargeAmount * igstRate) / 100
    : 0;

  const serviceChargeTotal =
    serviceChargeAmount + cgstAmount + sgstAmount + igstAmount;
  const totalBeforeTax =
    invoice.totalAmountBeforeTax ||
    serviceChargeAmount + donorReimbursementAmount;
  const totalAmount =
    invoice.totalAmountAfterTax || serviceChargeTotal + donorReimbursementAmount;

  const beforeTaxWordsText =
    invoice.beforeTaxAmountInWords || numberToWordsIndian(totalBeforeTax);
  const wordsText =
    invoice.amountInWords || numberToWordsIndian(totalAmount);

  return (
    <Document
      title={`Invoice_${invoice.invoiceNumber}_${invoice.donorName || "Donor"}`}
      author={MEDIYAZ_BANK_ISSUER.name}
    >
      <Page size="A4" style={styles.page}>
        {/* Main Title: INVOICE */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>INVOICE</Text>
        </View>

        {/* Top Header Row */}
        <View style={styles.headerRow}>
          {/* Top Left: Logo & Company Address */}
          <View style={styles.leftHeaderCol}>
            <View style={styles.logoBox}>
              <Image src={MEDIYAZ_LOGO_BASE64} style={styles.logoImage} />
            </View>
            <View style={styles.companyTable}>
              <View style={styles.companyTableRow}>
                <Text style={styles.companyTableCellLabel}>Address.</Text>
                <Text style={styles.companyTableCellValue}>
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
              <View style={[styles.companyTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.companyTableCellLabel}>Website:</Text>
                <Text style={styles.companyTableCellValue}>
                  {MEDIYAZ_BANK_ISSUER.website}
                </Text>
              </View>
            </View>
          </View>

          {/* Top Right: Meta & BILL TO */}
          <View style={styles.rightHeaderCol}>
            {/* Meta Table */}
            <View style={styles.metaTable}>
              <View style={styles.metaTableRow}>
                <Text style={styles.metaTableCellLabel}>Invoice Date:</Text>
                <Text style={styles.metaTableCellValue}>
                  {invoice.invoiceDate || ""}
                </Text>
              </View>
              <View style={styles.metaTableRow}>
                <Text style={styles.metaTableCellLabel}>Invoice No.</Text>
                <Text style={styles.metaTableCellValue}>
                  {invoice.invoiceNumber || ""}
                </Text>
              </View>
              <View style={styles.metaTableRow}>
                <Text style={styles.metaTableCellLabel}>SAC Code</Text>
                <Text style={styles.metaTableCellValue}>
                  {invoice.sacCode || MEDIYAZ_BANK_ISSUER.sacCode}
                </Text>
              </View>
              <View style={[styles.metaTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.metaTableCellLabel}>GSTIN/UIN:</Text>
                <Text style={styles.metaTableCellValue}>
                  {invoice.gstin || MEDIYAZ_BANK_ISSUER.gstin}
                </Text>
              </View>
            </View>

            {/* BILL TO Box */}
            <View style={styles.billToBox}>
              <View style={styles.billToRow}>
                <Text style={styles.billToLabel}>BILL TO</Text>
                <Text style={styles.billToValue}>
                  {invoice.hospitalName || "ART Clinic / Hospital"}
                </Text>
              </View>
              <View style={styles.billToRow}>
                <Text style={styles.billToLabel}>GSTIN/UIN:</Text>
                <Text style={styles.billToValueNormal}>
                  {invoice.hospitalGstin || "Unregistered / Consumer"}
                </Text>
              </View>
              <View style={styles.billToRow}>
                <Text style={styles.billToLabel}>Address :</Text>
                <Text style={styles.billToValueNormal}>
                  {invoice.hospitalAddress || "N/A"}
                </Text>
              </View>
              <View style={styles.billToRow}>
                <Text style={styles.billToLabel}>{pickupLabel}</Text>
                <Text style={styles.billToValue}>
                  {invoice.pickupDate || invoice.invoiceDate || ""}
                </Text>
              </View>
              <View style={styles.billToRow}>
                <Text style={styles.billToLabel}>Pickup Location</Text>
                <Text style={styles.billToValueNormal}>
                  {invoice.pickupLocation || invoice.hospitalName || ""}
                </Text>
              </View>
              <View style={[styles.billToRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.billToLabel}>SALE TYPE</Text>
                <Text style={styles.billToValue}>
                  {invoice.saleType || "STATE"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Full-width Donor Bar */}
        <View style={styles.donorBar}>
          <Text style={styles.donorBarText}>
            Donor Name : {invoice.donorName || "N/A"}
          </Text>
          <Text style={styles.donorBarText}>
            HUID No. {invoice.huidNo || "N/A"}
          </Text>
        </View>

        {/* Items Table */}
        <View style={styles.tableContainer}>
          {/* Table Header Row 1 */}
          <View style={styles.tableHeaderRow}>
            <View style={[styles.thCol, { width: "4%" }]}>
              <Text style={styles.thText}>Sr.</Text>
            </View>
            <View style={[styles.thCol, { width: "32%" }]}>
              <Text style={styles.thText}>SERVICE DESCRIPTION</Text>
            </View>
            <View style={[styles.thCol, { width: "9%" }]}>
              <Text style={styles.thText}>HSN/SAC</Text>
            </View>
            <View style={[styles.thCol, { width: "5%" }]}>
              <Text style={styles.thText}>QTY</Text>
            </View>
            <View style={[styles.thCol, { width: "11%" }]}>
              <Text style={styles.thText}>AMOUNY</Text>
            </View>
            {/* CGST */}
            <View style={[styles.thCol, { width: "13%", padding: 0 }]}>
              <Text style={[styles.thText, { paddingVertical: 1.5 }]}>CGST</Text>
              <View style={styles.subHeaderRow}>
                <View
                  style={[
                    styles.subCol,
                    { borderRightWidth: 0.6, borderRightColor: "#475569" },
                  ]}
                >
                  <Text style={styles.thText}>Rate</Text>
                </View>
                <View style={styles.subCol}>
                  <Text style={styles.thText}>Amount</Text>
                </View>
              </View>
            </View>
            {/* SGST */}
            <View style={[styles.thCol, { width: "13%", padding: 0 }]}>
              <Text style={[styles.thText, { paddingVertical: 1.5 }]}>SGST</Text>
              <View style={styles.subHeaderRow}>
                <View
                  style={[
                    styles.subCol,
                    { borderRightWidth: 0.6, borderRightColor: "#475569" },
                  ]}
                >
                  <Text style={styles.thText}>Rate</Text>
                </View>
                <View style={styles.subCol}>
                  <Text style={styles.thText}>Amount</Text>
                </View>
              </View>
            </View>
            {/* IGST */}
            <View style={[styles.thCol, { width: "13%", padding: 0 }]}>
              <Text style={[styles.thText, { paddingVertical: 1.5 }]}>
                {isInterState ? "IGST" : "IGST NOT APPLY"}
              </Text>
              <View style={styles.subHeaderRow}>
                <View
                  style={[
                    styles.subCol,
                    { borderRightWidth: 0.6, borderRightColor: "#475569" },
                  ]}
                >
                  <Text style={styles.thText}>Rate</Text>
                </View>
                <View style={styles.subCol}>
                  <Text style={styles.thText}>Amount</Text>
                </View>
              </View>
            </View>
            {/* Final Amount */}
            <View style={[styles.thCol, { width: "13%", borderRightWidth: 0 }]}>
              <Text style={styles.thText}>AMOUNT</Text>
            </View>
          </View>

          {/* Row 1: service charge */}
          <View style={styles.tableRow}>
            <View style={[styles.tdCol, { width: "4%", alignItems: "center" }]}>
              <Text style={styles.tdText}>1</Text>
            </View>
            <View style={[styles.tdCol, { width: "32%" }]}>
              <Text style={styles.tdText}>Service Charge</Text>
            </View>
            <View style={[styles.tdCol, { width: "9%", alignItems: "center" }]}>
              <Text style={styles.tdText}>
                {invoice.serviceChargeSac || "999321"}
              </Text>
            </View>
            <View style={[styles.tdCol, { width: "5%", alignItems: "center" }]}>
              <Text style={styles.tdText}>1</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "11%", alignItems: "flex-end" }]}
            >
              <Text style={styles.tdText}>
                {serviceChargeAmount.toFixed(2)}
              </Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "center" }]}
            >
              <Text style={styles.tdText}>{cgstRate > 0 ? `${cgstRate}%` : "-"}</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "flex-end" }]}
            >
              <Text style={styles.tdText}>
                {cgstAmount > 0 ? cgstAmount.toFixed(0) : "-"}
              </Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "center" }]}
            >
              <Text style={styles.tdText}>{sgstRate > 0 ? `${sgstRate}%` : "-"}</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "flex-end" }]}
            >
              <Text style={styles.tdText}>
                {sgstAmount > 0 ? sgstAmount.toFixed(0) : "-"}
              </Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "center" }]}
            >
              <Text style={styles.tdText}>
                {isInterState ? `${igstRate}%` : "Exempt"}
              </Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "flex-end" }]}
            >
              <Text style={styles.tdText}>
                {isInterState ? igstAmount.toFixed(0) : ""}
              </Text>
            </View>
            <View
              style={[
                styles.tdCol,
                { width: "13%", alignItems: "flex-end", borderRightWidth: 0 },
              ]}
            >
              <Text style={styles.tdTextBold}>
                {serviceChargeTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Row 2: Rembursment Of Oocyte/Sperm Donor Exp */}
          <View style={styles.tableRow}>
            <View style={[styles.tdCol, { width: "4%", alignItems: "center" }]}>
              <Text style={styles.tdText}>2</Text>
            </View>
            <View style={[styles.tdCol, { width: "32%" }]}>
              <Text style={styles.tdText}>{reimbursementDescription}</Text>
            </View>
            <View style={[styles.tdCol, { width: "9%", alignItems: "center" }]}>
              <Text style={styles.tdText}>
                {invoice.reimbursementSac || "999317"}
              </Text>
            </View>
            <View style={[styles.tdCol, { width: "5%", alignItems: "center" }]}>
              <Text style={styles.tdText}>1</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "11%", alignItems: "flex-end" }]}
            >
              <Text style={styles.tdText}>
                {donorReimbursementAmount.toFixed(2)}
              </Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "center" }]}
            >
              <Text style={styles.tdText}>-</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "flex-end" }]}
            >
              <Text style={styles.tdText}>-</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "center" }]}
            >
              <Text style={styles.tdText}>-</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "flex-end" }]}
            >
              <Text style={styles.tdText}>-</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "center" }]}
            >
              <Text style={styles.tdText}>-</Text>
            </View>
            <View
              style={[styles.tdCol, { width: "6.5%", alignItems: "flex-end" }]}
            >
              <Text style={styles.tdText}>-</Text>
            </View>
            <View
              style={[
                styles.tdCol,
                { width: "13%", alignItems: "flex-end", borderRightWidth: 0 },
              ]}
            >
              <Text style={styles.tdTextBold}>
                {donorReimbursementAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Blank row 1 to match official invoice stature */}
          {/* <View style={[styles.tableRow, { minHeight: 12 }]}>
            <View style={[styles.tdCol, { width: "4%" }]} />
            <View style={[styles.tdCol, { width: "32%" }]} />
            <View style={[styles.tdCol, { width: "9%" }]} />
            <View style={[styles.tdCol, { width: "5%" }]} />
            <View style={[styles.tdCol, { width: "11%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "13%", borderRightWidth: 0 }]} />
          </View> */}

          {/* Blank row 2 */}
          {/* <View style={[styles.tableRow, { minHeight: 12 }]}>
            <View style={[styles.tdCol, { width: "4%" }]} />
            <View style={[styles.tdCol, { width: "32%" }]} />
            <View style={[styles.tdCol, { width: "9%" }]} />
            <View style={[styles.tdCol, { width: "5%" }]} />
            <View style={[styles.tdCol, { width: "11%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "6.5%" }]} />
            <View style={[styles.tdCol, { width: "13%", borderRightWidth: 0 }]} />
          </View> */}

          {/* TOTAL & Summary Block */}
          <View style={styles.totalSectionRow}>
            {/* Left: Total in Words */}
            <View style={styles.totalWordsCol}>
              <View style={styles.totalWordsTopRow}>
                <Text style={styles.totalWordsTopText}>TOTAL</Text>
              </View>
              <View style={styles.totalWordsBody}>
                <View>
                  <Text
                    style={{
                      fontSize: 6.0,
                      color: "#475569",
                      fontFamily: "Helvetica",
                      marginBottom: 1,
                    }}
                  >
                    Total Amount Before Tax In Words
                  </Text>
                  <Text
                    style={{
                      fontSize: 6.8,
                      fontFamily: "Helvetica-Bold",
                      color: "#0f172a",
                      marginBottom: 10,
                    }}
                  >
                    {beforeTaxWordsText}
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 6.0,
                      color: "#475569",
                      fontFamily: "Helvetica",
                      marginBottom: 1,
                    }}
                  >
                    Total Invoice Amount In Words
                  </Text>
                  <Text
                    style={{
                      fontSize: 7.0,
                      fontFamily: "Helvetica-Bold",
                      color: "#0f172a",
                    }}
                  >
                    {wordsText}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right: Tax Breakdown & Total Amount After Tax */}
            <View style={styles.totalSummaryCol}>
              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>Total Amount Before Tax</Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={[styles.taxValText, { fontFamily: "Helvetica-Bold" }]}>
                    {totalBeforeTax.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>CGST @ 9 %</Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={styles.taxValText}>{cgstAmount.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>SGST @ 9 %</Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={styles.taxValText}>{sgstAmount.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.taxRow}>
                <View style={styles.taxLabelCol}>
                  <Text style={styles.taxLabelText}>IGST @ 18%</Text>
                </View>
                <View style={styles.taxValCol}>
                  <Text style={styles.taxValText}>{igstAmount.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.grandTotalRow}>
                <View style={styles.grandTotalLabelCol}>
                  <Text style={styles.grandTotalLabelText}>Total Amount After Tax</Text>
                </View>
                <View style={styles.grandTotalValCol}>
                  <Text style={styles.grandTotalValText}>
                    {totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Grid: Bank Details & Authorised Signatory */}
        <View style={styles.bottomGrid}>
          {/* Bank Details Table */}
          <View style={styles.bankCol}>
            <View style={styles.bankHeader}>
              <Text style={styles.bankTitle}>Bank Datails</Text>
            </View>
            <View style={styles.bankTableRow}>
              <Text style={styles.bankTableCellLabel}>Bank A/C, Name.</Text>
              <Text style={styles.bankTableCellValue}>
                {MEDIYAZ_BANK_ISSUER.bankName}
              </Text>
            </View>
            <View style={styles.bankTableRow}>
              <Text style={styles.bankTableCellLabel}>Bank A/C, No.</Text>
              <Text style={styles.bankTableCellValue}>
                {MEDIYAZ_BANK_ISSUER.bankAccountNo}
              </Text>
            </View>
            <View style={styles.bankTableRow}>
              <Text style={styles.bankTableCellLabel}>IFSC:</Text>
              <Text style={styles.bankTableCellValue}>
                {MEDIYAZ_BANK_ISSUER.ifsc}
              </Text>
            </View>
            <View style={styles.bankTableRow}>
              <Text style={styles.bankTableCellLabel}>MICR:</Text>
              <Text style={styles.bankTableCellValue}>
                {MEDIYAZ_BANK_ISSUER.micr}
              </Text>
            </View>
            <View style={[styles.bankTableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.bankTableCellLabel}>Pan No.</Text>
              <Text style={styles.bankTableCellValue}>
                {MEDIYAZ_BANK_ISSUER.panNo}
              </Text>
            </View>
          </View>

          {/* Authorised Signatory */}
          <View style={styles.signCol}>
            <View style={styles.signCertHeader}>
              <Text style={styles.certText}>
                Certified that the particuler given above true and correct
              </Text>
            </View>
            <View style={styles.signMiddleBody}>
              <Text style={styles.bankHeadingRight}>
                For {MEDIYAZ_BANK_ISSUER.name}
              </Text>
              <Image
                src={MEDIYAZ_SIGNATURE_BASE64}
                style={styles.signImage}
              />
              <Text style={styles.proprietorText}>
                Proprietor
              </Text>
            </View>
            <View style={styles.signFooterRow}>
              <Text style={styles.signatoryText}>
                {MEDIYAZ_BANK_ISSUER.signatoryTitle}
              </Text>
            </View>
          </View>
        </View>

        {/* TERM & CONDITIONS */}
        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>TERM & CONDITIONS</Text>
          {INVOICE_TERMS_AND_CONDITIONS.map((term, index) => (
            <Text key={index} style={styles.termsLine}>
              {term}
            </Text>
          ))}
        </View>

        {/* NOTES */}
        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>NOTES:-</Text>
          {INVOICE_NOTES.map((note, index) => (
            <Text key={index} style={styles.notesLine}>
              {note}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
