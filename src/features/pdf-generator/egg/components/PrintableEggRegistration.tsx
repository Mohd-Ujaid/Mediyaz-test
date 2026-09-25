/* eslint-disable jsx-a11y/alt-text */
import React from "react";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import EggAffidavit from "./PrintableEggAffidavit";

const PdfImage = Image as unknown as React.ComponentType<any>;

Font.register({
  family: "NotoSansDevanagari",
  fonts: [
    { src: "/fonts/NotoSansDevanagari-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/NotoSansDevanagari-Bold.ttf",    fontWeight: "bold" },
  ],
});

// Prevent react-pdf from breaking Devanagari words mid-character
Font.registerHyphenationCallback((word) => [word]);

// Define PDF styles
const styles = StyleSheet.create({
  htext: {
    fontFamily: "NotoSansDevanagari",
    fontSize: 12,
    fontWeight: "normal",
     textAlign: 'left',
  },
  hbtext: {
    fontFamily: "NotoSansDevanagari",
    fontSize: 12,
    fontWeight: "bold",
     textAlign: 'left',
  },
  page: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    fontFamily: "Times-Roman",
    fontSize: 14,
    lineHeight: 1.4,
    color: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 9,
    color: "#666",
    textTransform: "uppercase",
  },
  qrCode: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Times-Bold",
    textAlign: "center",
    textDecoration: "underline",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    fontSize: 14,
    textAlign: "justify",
  },
  bold: {
    fontFamily: "Times-Bold",
    fontSize:12
  },
  list: {
    marginTop: 10,
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    textAlign: "justify",
  },
  listBullet: {
    width: 20,
    fontSize: 12,
  },
  listText: {
    flex: 1,
    fontSize:12,
    lineHeight:1.4
  },
  signatureBlock: {
    position:"relative",
    top:"40%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 50,
  },
  signArea: {
    alignItems: "center",
  },
  digitalSign: {
    fontFamily: "Times-Italic",
    fontSize: 14,
    marginBottom: 5,
  },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    width: 180,
    paddingTop: 4,
    textAlign: "center",
    fontSize:14,
    fontFamily: "Times-Bold",
  },
  subSignText: {
    fontSize: 9,
    fontFamily: "Times-Roman",
  },
  // table: {
  //   width: "100%",
  //   borderWidth: 1,
  //   borderColor: "#000",
  //   marginTop: 15,
  //   marginBottom: 15,
  // },
  // tableRow: {
  //   flexDirection: "row",
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#000",
  // },
  tableColHeader: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000",
    backgroundColor: "#f3f4f6",
    fontFamily: "Times-Bold",
    fontSize: 10,
    textAlign: "center",
  },
  tableCol: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 10,
    textAlign: "center",
  },
  tableColLast: {
    borderRightWidth: 0,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  gridItem2: {
    width: "50%",
    flexDirection: "row",
    marginBottom: 6,
  },
  gridItem4: {
    width: "25%",
    flexDirection: "row",
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginVertical: 10,
  },

  tableRow: {
    flexDirection: "row",
  },

  tableCell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 8,
  },

  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  denseTitle: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  denseSectionTitle: {
    textAlign: "left",
    fontSize: 10,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 3,
    // textDecoration: "underline",
  },

  denseSectionTitleCenter: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    marginTop: 2,
    marginBottom: 3,
  },

  denseTable: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 4,
  },

  denseRow: {
    flexDirection: "row",
  },

  denseCellNoBottom: {
    borderBottomWidth: 0,
  },

  cellLabel: {
    width: "28%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  cellValue: {
    width: "20%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    textTransform: "capitalize",
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  cellLabelHistory: {
    width: "45%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    textTransform: "capitalize",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  cellValueHistory: {
    width: "10%",
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    textTransform: "capitalize",
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  cellLabelInvestLeft: {
    width: "28%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  cellValueInvestLeft: {
    width: "20%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  cellLabelInvestRight: {
    width: "34%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  cellValueInvestRight: {
    width: "18%",
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  featureCellLabel: {
    width: "25%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  featureCellValue: {
    width: "25%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  featureCellValueLast: {
    width: "25%",
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  denseExamLabelLeft: {
    width: "30%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  denseExamValueLeft: {
    width: "20%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize:  9,
    fontFamily: "Times-Roman",
  },

  denseExamLabelRight: {
    width: "32%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  denseExamValueRight: {
    width: "18%",
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 9,
    fontFamily: "Times-Roman",
  },

  denseFootnotesTitle: {
    marginTop: 5,
    fontSize: 11,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
  },

  denseFootnoteText: {
    marginTop: 1.5,
    fontSize: 10,
    fontFamily: "Times-Roman",
    lineHeight: 1.2,
  },
});

interface PdfDocumentProps {
  registration: any;
  qrCodeUrl: string;
  withHeader?: boolean;
  attachments?: string[];
  sections?: string[];
  overrides?: Record<string, any>;
  extraDocUrl?: string;
  affidavitType?: string;
}

const PrintableEggRegistration = ({
  registration,
  qrCodeUrl,
  withHeader = false,
  attachments = [],
  sections,
  overrides = {},
  extraDocUrl,
  affidavitType,
}: PdfDocumentProps) => {
  // Merge overrides
  const mergedRegistration = { ...registration };
  if (overrides.personalInfo)
    mergedRegistration.personalInfo = {
      ...(registration.personalInfo || {}),
      ...overrides.personalInfo,
    };
  if (overrides.contactInfo)
    mergedRegistration.contactInfo = {
      ...(registration.contactInfo || {}),
      ...overrides.contactInfo,
    };
  if (overrides.consent)
    mergedRegistration.consent = {
      ...(registration.consent || {}),
      ...overrides.consent,
    };

  const isCertificateIssued = Boolean(
    registration?.certificateIssued === true ||
    registration?.isCertificateIssued === true ||
    mergedRegistration?.certificateIssued === true ||
    mergedRegistration?.isCertificateIssued === true ||
    overrides?.certificateIssued === true
  );

  const showSection = (key: string) => {
    if (!sections || sections.length === 0) {
      // Complete Registration / "by all":
      // Certificate (Rule 10) is ONLY included if certificate is issued!
      if (key === "certificate") return isCertificateIssued;
      return true;
    }
    // Specific sections selected ("single single"):
    if (sections.includes(key)) {
      if (key === "certificate") return isCertificateIssued;
      return true;
    }
    // Key aliases
    if (key === "registration" && (sections.includes("reg_form") || sections.includes("regForm"))) return true;
    if (key === "contract" && sections.includes("terms_contract")) return true;
    if (key === "profile" && (sections.includes("info_form") || sections.includes("profile_form") || sections.includes("info"))) return true;
    if (key === "form14a" && (sections.includes("consent") || sections.includes("consent_form") || sections.includes("form14A"))) return true;
    if (key === "certificate" && (sections.includes("cert") || sections.includes("rule10"))) return isCertificateIssued;
    if (key === "affidavit" && sections.includes("egg_affidavit")) return true;
    if (key === "aadhaar" && (sections.includes("aadhaar_card") || sections.includes("id_proof"))) return true;
    return false;
  };

  const showAttachment = (key: string) =>
    !sections ||
    sections.length === 0 ||
    sections.includes(key) ||
    attachments.includes(key);

  const {
    personalInfo = {},
    contactInfo = {},
    medicalInfo = {},
    consent = {},
    documents = {},
    donorType,
    registrationId,
    donorId,
    spermDonorInfo = {},
    eggDonorInfo = {},
    investigations = {},
    physicalExamination = {},
    assignedHospital,
    recruitmentDate,
    fileNumber,
  } = mergedRegistration || {};

  const isSperm = donorType === "sperm" || !donorType;

  // Date Formatting helper
  const formatDisplayDate = (d: any) => {
    if (!d) return "";
    const str = String(d).trim();
    if (!str) return "";
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, dayNum] = str.split("-").map(Number);
        const dt = new Date(y, m - 1, dayNum);
        return dt.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
      const dt = new Date(str);
      if (isNaN(dt.getTime())) return str;
      return dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return str;
    }
  };

  // 1. Registration Date displays recruitmentDate (keeps "Registration Date:" label)
  const rawRegistrationDate =
    recruitmentDate ||
    eggDonorInfo?.recruitmentDate ||
    overrides?.recruitmentDate ||
    consent?.signatureDate ||
    "";
  const displayRegistrationDate =
    formatDisplayDate(rawRegistrationDate) || rawRegistrationDate || "";

  // 2. Auto-generated file number
  const displayFileNumber =
    fileNumber ||
    overrides?.fileNumber ||
    (registrationId
      ? `MAB/ED/${registrationId.split("-").pop()?.slice(-3) || "001"}`
      : "MAB/ED/001");

  // 3. Donor ID (uses allocated donorId, e.g. DON-2026-1008, fallback to registrationId)
  const displayDonorId =
    donorId ||
    mergedRegistration.donorId ||
    overrides?.donorId ||
    registrationId ||
    "MAB/OD/___";

  // 4. ART Clinic and Doctor from assignedHospital in manage-registrations
  const clinicName =
    assignedHospital?.name ||
    mergedRegistration.clinicName ||
    "";

  const rawDoctorName = (
    assignedHospital?.contactPerson ||
    mergedRegistration.doctorName ||
    ""
  ).trim();

  let formattedDoctor = rawDoctorName;
  if (formattedDoctor) {
    if (!/^Dr\.?\s*/i.test(formattedDoctor)) {
      formattedDoctor = `Dr. ${formattedDoctor}`;
    } else {
      formattedDoctor = formattedDoctor.replace(/^Dr\.?\s*/i, "Dr. ");
    }
  }

  // 5. Egg donor specific clinical & history details (donorInfo in DB, fallback to eggDonorInfo)
  const donorInfoData =
    mergedRegistration.donorInfo ||
    mergedRegistration.eggDonorInfo ||
    eggDonorInfo ||
    {};

  // 6. Clinical supply date & recruiter
  const supplyDateVal =
    mergedRegistration.supplyDate ||
    mergedRegistration.hospitalDeliveryDate ||
    "";
  const displaySupplyDate =
    formatDisplayDate(supplyDateVal) || supplyDateVal || "";
  const recruiterName =
    mergedRegistration.recruiterName ||
    mergedRegistration.affiliatedBy ||
    mergedRegistration.createdByEmployee ||
    "Imtiyaz Shaikh";

  // Date Formatting
  const dateObj = rawRegistrationDate
    ? new Date(rawRegistrationDate)
    : consent.signatureDate
    ? new Date(consent.signatureDate)
    : new Date();
  const day = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate();
  const month = dateObj.toLocaleString("default", { month: "long" });
  const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
  const numericMonth = String((isNaN(dateObj.getMonth()) ? new Date().getMonth() : dateObj.getMonth()) + 1).padStart(2, "0");
  console.log(personalInfo)

  const formatAddress = (addr = "", city = "", state = "", country = "", pin = "") => {
    if (!addr) return "";
    const parts = [addr];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    if (pin) parts.push(pin);
    return parts.join(", ");
  };

  // Age calculation and number to words conversion
  const calculateAge = (dob: any): number | undefined => {
    if (!dob) return undefined;
    try {
      let birth: Date;
      const str = String(dob).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split("-").map(Number);
        birth = new Date(y, m - 1, d);
      } else if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(str)) {
        const parts = str.split(/[/-]/).map(Number);
        birth = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        birth = new Date(str);
      }
      if (isNaN(birth.getTime())) return undefined;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age >= 0 ? age : undefined;
    } catch {
      return undefined;
    }
  };

  const numberToWords = (num?: number): string => {
    if (num === undefined || num === null || isNaN(num) || num <= 0) return "";
    const ones = [
      "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
      "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
      "seventeen", "eighteen", "nineteen"
    ];
    const tens = [
      "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
    ];
    if (num < 20) return ones[num] || "";
    if (num < 100) {
      const t = Math.floor(num / 10);
      const o = num % 10;
      return o ? `${tens[t]}-${ones[o]}` : tens[t];
    }
    return String(num);
  };

  const donorAge =
    calculateAge(personalInfo.dateOfBirth) ??
    (personalInfo.age ? Number(personalInfo.age) : undefined);
  const donorAgeWords = numberToWords(donorAge);

  // FIX: Using regular functions instead of React components for inline elements
  // This prevents react-pdf's layout engine from flattening the document text.
  const renderHeader = (pageNum: number) => (
    <View style={styles.header} fixed>
      <View>
        <Text style={styles.headerText}>
          MEDIYAZ ART BANK - LEGAL DOCUMENTS
        </Text>
        <Text style={styles.headerText}>Page {pageNum}</Text>
      </View>
    </View>
  );

  return (
    <Document title={`Donor_Registration_${displayFileNumber.replace(/\//g, "_")}_${displayDonorId || registrationId || "Draft"}`}>
      {/* ========================================== */}
      {/* EGG - PAGE 1: REGISTRATION FORM */}
      {/* ========================================== */}
      {showSection("registration") && (
      <Page size="A4" style={[styles.page, { paddingTop: 70, paddingBottom: 70 }]}>
        {withHeader && (
          <>
            <Image
              src={"/images/letterheaad3.png"}
              style={{
                position: "absolute",
                top: 5,
                left: 0,
                width: "600",
                height: "842",
              }}
              fixed
            />
            <View
              style={{
                position: "absolute",
                top: 30,
                right: 40,
                fontSize: 10,
                color: "#006666",
                fontFamily: "Times-Bold",
              }}
            >
              <Text>For Clinic</Text>
            </View>
          </>
        )}

        <Text style={styles.title }>
          REGISTRATION FORM FOR OOCYTE DONOR
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#000",
            marginBottom: 15,
          }}
        >
          {/* Row 1: Registration Date, File Number, Donor ID */}
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: "#000",
            }}
          >
            <View
              style={{
                width: "33%",
                borderRightWidth: 1,
                borderRightColor: "#000",
                paddingHorizontal: 8,
                paddingVertical: 5,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Times-Bold", fontSize: 10 }}>
                Registration Date: {displayRegistrationDate}
              </Text>
            </View>

            <View
              style={{
                width: "27%",
                borderRightWidth: 1,
                borderRightColor: "#000",
                paddingHorizontal: 8,
                paddingVertical: 5,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Times-Bold", fontSize: 10 }}>
                File Number: {displayFileNumber}
              </Text>
            </View>

            <View
              style={{
                width: "40%",
                paddingHorizontal: 8,
                paddingVertical: 5,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Times-Bold", fontSize: 10 }}>
                DONOR ID: {displayDonorId}
              </Text>
            </View>
          </View>

          {/* Row 2: ART Clinic and Doctor (aligns vertical line at 60% with Row 1) */}
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                width: formattedDoctor ? "60%" : "100%",
                borderRightWidth: formattedDoctor ? 1 : 0,
                borderRightColor: "#000",
                paddingHorizontal: 8,
                paddingVertical: 5,
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "Times-Bold", fontSize: 10 }}>
                ART Clinic: {clinicName || " "}
              </Text>
            </View>

            {formattedDoctor ? (
              <View
                style={{
                  width: "40%",
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontFamily: "Times-Bold", fontSize: 10 }}>
                  Doctor: {formattedDoctor}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ paddingBottom: 5 }}>
          <Text style={[styles.text, { fontSize: 11.5, paddingBottom: 3, lineHeight: 1.3 }]}>
            I, <Text style={styles.bold}>{personalInfo.fullName || ""}</Text> W/O{" "}
            <Text style={styles.bold}>{personalInfo.spouseName || personalInfo.husbandName || ""}</Text>
            , house No.{" "}
            <Text style={styles.bold}>{formatAddress(contactInfo.permanentAddress || contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}</Text>,  Aadhar No{" "}
            <Text style={styles.bold}>{personalInfo.aadhaarNumber || ""}</Text> date of birth{" "}
            <Text style={styles.bold}>{formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || ""}</Text> and Mobile no{" "}
            <Text style={styles.bold}>{contactInfo.mobileNumber || ""}</Text>, is willing to donate my oocyte to
            needy couple/woman and agree to abide by following terms.
          </Text>

          <Text style={[styles.htext, { fontSize: 11.5, lineHeight: 1.3 }]}>
            मैं, <Text style={styles.bold}>{personalInfo.fullName || ""}</Text> पत्नी{" "}
            <Text style={styles.bold}>{personalInfo.spouseName || personalInfo.husbandName || ""}</Text>
            , मकान नंबर:{" "}
            <Text style={styles.bold}>{formatAddress(contactInfo.permanentAddress || contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}</Text>, और आधार नंबर{" "}
            <Text style={styles.bold}>{personalInfo.aadhaarNumber || ""}</Text> जन्म तिथि{" "}
            <Text style={styles.bold}>{formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || ""}</Text> और मोबाइल नंबर{" "}
            <Text style={styles.bold}>{contactInfo.mobileNumber || ""}</Text>, जरूरतमंद जोड़े/महिला को अपना अंडाणु दान करने को तैयार हूं और निम्नलिखित शर्तों का पालन करने के लिए सहमत हैं।
          </Text>
        </View>

        <View style={[styles.list, { marginTop: 3, }]}>
          {[
            {
              en: `My date of birth ${formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || "—"}, age as on today is more than twenty-three years and less than thirty-five years.`,
              hi: `मेरी जन्म तिथि ${formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || "—"} है और आज की मेरी आयु तेईस वर्ष से अधिक और पैंतीस वर्ष से कम है ।`,
            },
            {
              en: "I agree that I am registering for donating my oocyte for non-commercial purpose and for the purposes of assisted reproductive technology services arising due to infertility, disease and/or social and medical concerns.",
              hi: "मैं सहमत हूं कि मैं गैर-वाणिज्यिक उद्देश्य के लिए और बांझपन, बीमारी और/या सामाजिक और चिकित्सा चिंताओं के कारण उत्पन्न होने वाली सहायक प्रजनन प्रौद्योगिकी सेवाओं के उद्देश्यों के लिए अपना ओसाइट दान करने के लिए पंजीकरण कर रही हूं।",
            },
            {
              en: "I agree that I am willing to undergo pathology tests which are required to be done under the provisions of the Assisted Reproductive Technology (Regulation) Act, 2021 and Rules made thereunder.",
              hi: "मैं सहमत हूं कि मैं पैथोलॉजी टेस्ट कराने की इच्छुक हूं, जो कि सहायक प्रजनन प्रौद्योगिकी (विनियमन) अधिनियम, 2021 और उसके तहत बनाए गए नियमों के प्रावधानों के तहत किया जाना आवश्यक है।",
            },
            {
              en: "I confirm that at this stage and to the best of my knowledge I am not suffering from any known infectious diseases or genetic disorders.",
              hi: "मैं पुष्टि करती हूं कि इस स्तर पर और जहां तक ​​मेरी जानकारी है, मैं किसी ज्ञात संक्रामक रोग या आनुवंशिक विकार से पीड़ित नहीं हूं।",
            },
            {
              en: "I agree that I will donate my oocyte to the needy couple/woman and go to the ART Clinic whenever informed by ART Bank namely (MEDIYAZ ART BANK) in the event my oocyte is collected/retrieved and preserved, same may be used for the purposes specified in the Assisted Reproductive Technology (Regulation) Act, 2021.",
              hi: "मैं सहमत हूं कि मैं अपना ऊसाइट/ अंडाणु जरूरतमंद दंपति/महिला को दान कर दूंगी और जब भी एआरटी बैंक अर्थात्  (मेडियाज़ एआरटी बैंक) द्वारा सूचित किया जाएगा तो मैं एआरटी क्लिनिक जाऊंगी और यदि मेरे ऊसाइट का नमूना एकत्र और संरक्षित किया जाता है, तो उसका उपयोग सहायक प्रजनन प्रौद्योगिकी (विनियमन) अधिनियम, २०२१ में निर्दिष्ट उद्देश्य के लिए किया जा सकता है।",
            },
            // {
            //   en: "I agree and affirm that I will not try to know the identity of recipient and disclose the same to any person in the event the identity of recipient is come within my knowledge as per law.",
            //   hi: "मैं सहमत हूँ और पुष्टि करती हूँ कि मैं प्राप्तकर्ता की पहचान जानने का प्रयास नहीं करूँगी और कानून के अनुसार यदि प्राप्तकर्ता की पहचान मेरे संज्ञान में आए तो उसे किसी भी व्यक्ति को प्रकट नहीं करूँगी।",
            // },
            // {
            //   en: "I undertake and confirm that I am registering myself for donating my oocyte with ART Bank namely (MEDIYAZ ART BANK) for the first time and have not registered with any other ART Bank before.",
            //   hi: "मैं वचन देती हूँ और पुष्टि करती हूँ कि मैं पहली बार ART बैंक (MEDIYAZ ART BANK) में अपना अंडाणु दान करने के लिए पंजीकरण करा रही हूँ और इससे पहले किसी अन्य ART बैंक में पंजीकरण नहीं कराया है।",
            // },
            // {
            //   en: "I confirm and verify that the above-mentioned facts are true and correct to the best of my knowledge.",
            //   hi: "मैं पुष्टि और सत्यापित करती हूँ कि उपरोक्त तथ्य मेरी सर्वोत्तम जानकारी के अनुसार सत्य और सही हैं।",
            // },
          ].map((item, idx) => (
            <View style={[styles.listItem, { marginBottom: 5 }]} key={idx}>
              <Text style={styles.listBullet}>{idx + 1}.</Text>
              <View style={styles.listText}>
                <Text>{item.en}</Text>
                {item.hi ? (
                  <Text style={[styles.htext, { marginTop: 1 }]} >{item.hi}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>


        <View style={[styles.list, { marginTop: 20, }]}>
          {[
            {
              en: "I agree and affirm that I will not try to know the identity of recipient and disclose the same to any person in the event the identity of recipient is come within my knowledge as per law.",
              hi: "मैं सहमत हूं और पुष्टि करती हूं कि मैं प्राप्तकर्ता की पहचान जानने की कोशिश नहीं करूंगी और कानून के अनुसार \nप्राप्तकर्ता की पहचान मेरी जानकारी में आने की स्थिति में किसी भी व्यक्ति को इसका खुलासा नहीं करूंगी।",
            },
            {
              en: "I undertake and confirm that I am registering myself for donating my oocyte with ART Bank namely (MEDIYAZ ART BANK) for the first time and have not registered with any other ART Bank before. I further undertake and confirm that I have never donated my oocyte to any couple/woman in past and will never donate my oocyte to any couple/woman more than one in my life.",
              hi: "मैं वचन देती हूं और पुष्टि करती हूं कि मैं पहली बार एआरटी बैंक अर्थात् (मेडियाज़ एआरटी बैंक) के साथ अपना \nओसाइट/अंडाणु दान करने के लिए खुद को पंजीकृत कर रही हूं और पहले किसी अन्य एआरटी बैंक के साथ पंजीकृत नहीं हूं। मैं आगे वचन देती हूं और पुष्टि करती हूं कि मैंने अतीत में कभी भी किसी जोड़े/महिला को अपना अंडाणु दान नहीं \nकिया है और अपने जीवन में एक के अलावे कभी भी किसी भी जोड़े/महिला को अपना अंडाणु दान नहीं करूंगी।",
            },
            {
              en: " I confirm and verify that the above-mentioned facts are true and correct to the best of my knowledge.",
              hi: " मैं पुष्टि करती हूं और सत्यापित करती हूं कि उपर्युक्त तथ्य मेरी सर्वोत्तम जानकारी के अनुसार सत्य और सही हैं।",
            },
          ].map((item, idx) => (
            <View style={[styles.listItem, { marginBottom: 5 }]} key={idx}>
              <Text style={styles.listBullet}>{idx + 6}.</Text>
              <View style={styles.listText}>
                <Text>{item.en}</Text>
                {item.hi ? (
                  <Text style={[styles.htext, { marginTop: 1 }]}>{item.hi}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.signatureBlock, { marginTop: 20 }]}>
          <View style={styles.signArea}>
            {documents.signature?.url ? (
              <Image
                src={`${documents.signature.url}`}
                cache={false}
                style={{
                  width: 105,
                  height: 35,
                  alignSelf: "center",
                  marginBottom: 5,
                }}
              />
            ) : (
              <Text style={{ height: 40, textAlign: "center" }}>
                No Signature
              </Text>
            )}
            <Text style={styles.signLine}>Oocyte donor Signature</Text>
            <Text style={styles.subSignText}>
              (Self-Attested copy of AADHAR Enclosed)
            </Text>
          </View>
          {/* <View style={styles.signArea}>
            <Image
              src="/images/signature.png"
              style={{
                height: 35,
                width: 100,
                objectFit: "contain",
                alignSelf: "center",
                marginBottom: 3,
              }}
            />
            <Text style={styles.signLine}>Mr. IMTIYAZ SHAIKH</Text>
            <Text>Director/Proprietor</Text>
            <Text>For MEDIYAZ ART BANK</Text>
          </View> */}
        </View>
      </Page>
      )}

      {/* ========================================== */}
      {/* EGG - PAGE 2: CONTRACT */}
      {/* ========================================== */}
      {showSection("contract") && (
      <Page size="A4" style={[styles.page, { paddingTop: 70, paddingBottom: 70 } ]}>
        {withHeader && (
          <>
            <Image
              src={"/images/letterheaad3.png"}
              style={{
                position: "absolute",
                top: 5,
                left: 0,
                width: "600",
                height: "842",
              }}
              fixed
            />
            {/* <View
              style={{
                position: "absolute",
                top: 30,
                right: 40,
                fontSize: 10,
                color: "#006666",
                fontFamily: "Times-Bold",
              }}
            >
              <Text>For Clinic</Text>
            </View> */}
          </>
        )}
        <Text style={[styles.title, withHeader ? { marginTop:5}:{}]}>
          Contract between the ART bank and the Oocyte Donor
        </Text>

        <Text style={[styles.text,{fontSize:12}]}>
          The ART bank and the Donor agree to come into this contract today on
          the {displayRegistrationDate} as per the following conditions.
        </Text>

        <View style={{marginTop:10}}>

        <Text style={[styles.text,{fontSize:12,marginBottom:5}]}>
          <Text style={styles.bold}>First Part</Text> being <Text style={styles.bold}> (MEDIYAZ ART BANK) </Text>
          having its office at <Text style={styles.bold}> 366/4, Govindpuri Kalka ji new Delhi 110019 </Text>, and
          the registered office at <Text style={styles.bold}> 366/4, Govindpuri Kalka ji new Delhi 110019</Text>,
          herein referred to as the <Text style={styles.bold}>ART Bank</Text>(which expression shall, unless repugnant to the context or meaning thereof, be deemed to mean and include legal representatives, administrators, etc., of the said ART Bank);
        </Text>
        <Text style={[styles.htext, { fontSize: 12 }]}>
          पहला भाग 
          <Text style={styles.hbtext}>(मेडियाज़ एआरटी बैंक)</Text>, जिसका कार्यालय
          <Text style={styles.hbtext}> 366/4, गोविंदपुरी कालका जी नई दिल्ली 110019 </Text>
          में है, और {"\n"}पंजीकृत कार्यालय 
          <Text style={styles.hbtext}> 366/4, गोविंदपुरी कालका जी नई दिल्ली 110019 </Text>
          में है, जिसे यहां
          <Text style={styles.hbtext}> एआरटी बैंक </Text>
          कहा गया है (जो अभिव्यक्ति है) जब तक कि यह संदर्भ या उसके अर्थ के प्रतिकूल न हो, इसका मतलब यह माना जाएगा और इसमें उक्त एआरटी बैंक के कानूनी प्रतिनिधि, प्रशासक आदि शामिल होंगे);
        </Text>

        </View>

        <Text style={[styles.bold, { textAlign: "center", marginBottom: 10 }]}>
          And
        </Text>

        <View >

        <Text style={[styles.text, { fontSize: 11.5, marginBottom: 4, lineHeight: 1.3 }]}>
          <Text style={styles.bold}>Second Part</Text> I{" "}
          <Text style={styles.bold}>{personalInfo.fullName || ""}</Text> W/O{" "}
          <Text style={styles.bold}>{personalInfo.spouseName || personalInfo.husbandName || ""}</Text>
          , House No.:{" "}
          <Text style={styles.bold}>{formatAddress(contactInfo.permanentAddress || contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}</Text>, Aadhar No{" "}
          <Text style={styles.bold}>{personalInfo.aadhaarNumber || ""}</Text> date of birth{" "}
          <Text style={styles.bold}>{formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || ""}</Text> and Mobile no{" "}
          <Text style={styles.bold}>{contactInfo.mobileNumber || ""}</Text>, herein referred to as the Donor (which expression shall, unless repugnant to the context or meaning thereof, be deemed to mean and include legal representatives, administrators, etc., of the said Clinic.
        </Text>
        <Text style={[styles.htext, { fontSize: 11.5, lineHeight: 1.3 }]}>
          <Text style={styles.hbtext}>दूसरा भाग है</Text> मैं{" "}
          <Text style={styles.hbtext}>{personalInfo.fullName || ""}</Text> पत्नी{" "}
          <Text style={styles.hbtext}>{personalInfo.spouseName || personalInfo.husbandName || ""}</Text>
          , मकान नंबर:{" "}
          <Text style={styles.hbtext}>{formatAddress(contactInfo.permanentAddress || contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}</Text>, आधार नं{" "}
          <Text style={styles.hbtext}>{personalInfo.aadhaarNumber || ""}</Text> जन्म तिथि{" "}
          <Text style={styles.hbtext}>{formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || ""}</Text> और मोबाइल नं{" "}
          <Text style={styles.hbtext}>{contactInfo.mobileNumber || ""}</Text>, को यहां दाता के रूप में संदर्भित किया गया है (यह अभिव्यक्ति, जब तक कि संदर्भ या उसके अर्थ के {"\n"} प्रतिकूल न हो, उक्त क्लिनिक के कानूनी प्रतिनिधियों, प्रशासकों आदि को शामिल माना जाएगा।
        </Text>

        </View>

        <Text style={[styles.bold, { textAlign: "center", marginBottom: 5, marginTop: 10 }]}>
          Whereas
        </Text>

        <View style={[styles.list]}>
          {[
            {
              en: "The first part is ART bank that is established, amongst other purposes, to collect, screen and supply oocyte donor to ART clinics for use in ART procedures.",
              hi: " पहला भाग एआरटी बैंक है जो अन्य उद्देश्यों के साथ-साथ एआरटी प्रक्रियाओं में उपयोग के लिए एआरटी क्लीनिकों में ओओसाइट डोनर को इकट्ठा करने, स्क्रीन करने और आपूर्ति करने के लिए स्थापित किया गया है।",
            },
            {
              en: "The second part is an individual who has willingly agreed to donate her oocytes to the ART clinic against a consideration for the same.",
              hi: "दूसरा भाग एक व्यक्ति का है जो स्वेच्छा से एआरटी क्लिनिक को अपने अंडाणु दान करने के लिए सहमत हो गया है।",
            },
            {
              en: " That the ART Bank and the Donor have, therefore, come to form this contract to facilitate the process with the laid down terms and conditions.",
              hi: "  इसलिए, एआरटी बैंक और दाता ने निर्धारित नियमों और शर्तों के साथ प्रक्रिया को सुविधाजनक बनाने के लिए यह \nअनुबंध तैयार किया है।",
            },
          ].map((item, idx) => (
            <View style={[styles.listItem, { marginBottom: 5 }]} key={idx}>
              <Text style={styles.listBullet}>{idx + 1}.</Text>
              <View style={styles.listText}>
                <Text>{item.en}</Text>
                {item.hi ? (
                  <Text style={[styles.htext, { marginTop: 1 }]}>{item.hi}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={{marginTop:0}}>

        

        <Text style={[styles.bold, { marginTop: 5, marginBottom: 5,textAlign:"center" }]}>
          NOW THIS INDENTURE WITNESSETH THAT:
        </Text>

        <View style={[styles.list]}>
          {[
            {
              en: "The ART Bank agrees to screen and select oocyte donors and to supply them to ART clinics desiring of oocyte donors as per the rules laid down in the ART (Regulation) Act.2021.",
              hi: "एआरटी बैंक अण्डाणु दाताओं की जांच और चयन करने तथा एआरटी (विनियमन) अधिनियम 2021 में निर्धारित नियमों के अनुसार अण्डाणु दाताओं की इच्छा रखने वाले एआरटी क्लीनिकों को उनकी आपूर्ति करने के लिए सहमत है।",
            },
            {
              en: "The Donor agrees to disclose the true facts of herself and not to suppress any personal details to the Bank, including family history, genetic background, criminal background, religion, etc. The ART Bank agrees to keep all information about the Donor confidential. Non information shall be declared by the ART Bank accept by an order of a court or to the Indian Council of Medical Research. If any Information is suppressed by the Donor and that suppression causes any damage in the ART procedure or to the patient, then the ART Bank will not be responsible for it but only the Donor will be responsible and punishable under the provisions of law",
              hi: "दाता अपने बारे में सही तथ्यों का खुलासा करने और पारिवारिक इतिहास, आनुवंशिक पृष्ठभूमि, आपराधिक पृष्ठभूमि,\n धर्म आदि सहित बैंक के किसी भी व्यक्तिगत विवरण को न छिपाने के लिए सहमत है। एआरटी बैंक दाता के बारे में सभी जानकारी को गोपनीय रखने के लिए सहमत है। गैर-जानकारी एआरटी बैंक द्वारा किसी अदालत के आदेश या भारतीय \nचिकित्सा अनुसंधान परिषद को स्वीकार किए जाने की घोषणा की जाएगी। यदि कोई दाता द्वारा जानकारी छिपाई जाती है और उस दमन से एआरटी प्रक्रिया में या रोगी को कोई क्षति होती है, तो एआरटी बैंक इसके लिए जिम्मेदार नहीं होगा, बल्कि केवल दाता ही जिम्मेदार होगा और कानून के प्रावधानों के तहत दंडनीय होगा।",
            },
            {
              en: " The Donor agrees to relinquish all parental rights over the child, which may be conceived from his gamete.",
              hi: "दाता बच्चे पर सभी माता-पिता के अधिकारों को त्यागने के लिए सहमत है, जो उसके युग्मक से उत्पन्न हो सकता है|",
            },
            {
              en: "The Donor, agrees to take consent of her husband before donating her oocytes and also produce the same before the ART bank at the time of signing this agreement.",
              hi: "दाता, अपने अंडाणु दान करने से पहले अपने पति की सहमति लेने के लिए सहमत है और इस समझौते पर हस्ताक्षर करने के समय इसे एआरटी बैंक के समक्ष भी प्रस्तुत करेगी।",
            },
            {
              en: "The ART Bank agrees to inform the Donor about all the tests that would be necessary for the safety and protection of the ART procedure. The Donor agrees to undergo all the tests required by the ART Bank and ART Clinic. The ART Bank also agrees to inform the Donor about the results of the above tests.",
              hi: "एआरटी बैंक दाता को उन सभी परीक्षणों के बारे में सूचित करने के लिए सहमत है जो एआरटी प्रक्रिया की सुरक्षा और \nसुरक्षा के लिए आवश्यक होंगे। दाता एआरटी बैंक और एआरटी क्लिनिक द्वारा आवश्यक सभी परीक्षणों से गुजरने के लिए सहमत है। एआरटी बैंक उपरोक्त परीक्षणों के परिणामों के बारे में दाता को सूचित करने के लिए भी सहमत है।",
            },
            {
              en: "The Donor agrees to be assigned to ART clinic as directed by the ART Bank for the purposes of undergoing oocyte donation.",
              hi: "दाता अंडाणु दान के प्रयोजनों के लिए एआरटी बैंक के निर्देशानुसार एआरटी क्लिनिक को सौंपे जाने के लिए सहमत है।",
            },
            {
              en: "The Donor agrees to undergo ovarian stimulation by taking regular medication as directed by the ART clinic and come regularly for follow up as directed.",
              hi: "दाता एआरटी क्लिनिक के निर्देशानुसार नियमित दवा लेकर डिम्बग्रंथि उत्तेजना से गुजरने और निर्देशानुसारअनुवर्ती \nकार्रवाई के लिए नियमित रूप से आने के लिए सहमत है।",
            },
            {
              en: "The donor has been adequately information by the ART Bank about the procedure and its potential complications.",
              hi: "एआरटी बैंक द्वारा दाता को प्रक्रिया और इसकी संभावित जटिलताओं के बारे में पर्याप्त जानकारी दी गई है।",
            },
            // {
            //   en: "The donor has been adequately information by the ART Bank about the procedure and its potential complications.",
            //   hi: "एआरटी बैंक द्वारा दाता को प्रक्रिया और इसकी संभावित जटिलताओं के बारे में पर्याप्त जानकारी दी गई है।",
            // },
            {
              en: "The Donor agrees not to discontinue treatment midway except on medical Advice of the ART clinic.",
              hi: "दाता एआरटी क्लिनिक की चिकित्सा सलाह के अलावा बीच में इलाज बंद नहीं करने पर सहमत है।",
            },
            {
              en: "The ART Bank and the Donor agree to abide by all the relevant provisions and relating to sourcing, storage, handling and record keeping for gametes, embryos duties of patients, donors, respectively, of the ART (Regulation) Act. 2021.",
              hi: "बैंक और दाता एआरटी (विनियमन) अधिनियम 2021 के क्रमशः युग्मक, भ्रूण और रोगियों, दाताओं के कर्तव्यों के लिए सोर्सिंग, भंडारण, हैंडलिंग और रिकॉर्ड रखने से संबंधित सभी प्रासंगिक प्रावधानों का पालन करने के लिए सहमत हैं।",
            },
            {
              en: " This agreement is signed by both the parties after a clear understanding of all the issues involved, and in full senses and under no pressure from any person.",
              hi: "सभी की स्पष्ट समझ के बाद इस समझौते पर दोनों पक्षों द्वारा हस्ताक्षर किए जाते हैं जो मुद्दे शामिल हैं, और पूरे होश-हवास में और किसी भी व्यक्ति के दबाव में नहीं।",
            },
          ].map((item, idx) => (
            <View style={[styles.listItem, { marginBottom: 5 }]} key={idx}>
              <Text style={styles.listBullet}>{idx + 1}.</Text>
              <View style={styles.listText}>
                <Text>{item.en}</Text>
                {item.hi ? (
                  <Text style={[styles.htext, { marginTop: 1 }]}>{item.hi}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
        </View>

        {/* <View style={[styles.list,{marginTop:10}]}>
          {[
            
            {
              en: "The donor has been adequately information by the ART Bank about the procedure and its potential complications.",
              hi: "एआरटी बैंक द्वारा दाता को प्रक्रिया और इसकी संभावित जटिलताओं के बारे में पर्याप्त जानकारी दी गई है।",
            },
            {
              en: "The Donor agrees not to discontinue treatment midway except on medical Advice of the ART clinic.",
              hi: "दाता एआरटी क्लिनिक की चिकित्सा सलाह के अलावा बीच में इलाज बंद नहीं करने पर सहमत है।",
            },
            {
              en: "The ART Bank and the Donor agree to abide by all the relevant provisions and relating to sourcing, storage, handling and record keeping for gametes, embryos duties of patients, donors, respectively, of the ART (Regulation) Act. 2021.",
              hi: "बैंक और दाता एआरटी (विनियमन) अधिनियम 2021 के क्रमशः युग्मक, भ्रूण और रोगियों, दाताओं के कर्तव्यों के लिए सोर्सिंग, भंडारण, हैंडलिंग और रिकॉर्ड रखने से संबंधित सभी प्रासंगिक प्रावधानों का पालन करने के लिए सहमत हैं।",
            },
            {
              en: " This agreement is signed by both the parties after a clear understanding of all the issues involved, and in full senses and under no pressure from any person.",
              hi: "सभी की स्पष्ट समझ के बाद इस समझौते पर दोनों पक्षों द्वारा हस्ताक्षर किए जाते हैं जो मुद्दे शामिल हैं, और पूरे होश-हवास में और किसी भी व्यक्ति के दबाव में नहीं।",
            },
          ].map((item, idx) => (
            <View style={[styles.listItem, { marginBottom: 5 }]} key={idx}>
              <Text style={styles.listBullet}>{idx + 8}.</Text>
              <View style={styles.listText}>
                <Text>{item.en}</Text>
                {item.hi ? (
                  <Text style={[styles.htext, { marginTop: 1 }]}>{item.hi}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View> */}

        <View style={[styles.signatureBlock,{top:"35%"}]}>
          <View style={styles.signArea}>
            <Image
              src="/images/signature.png"
              style={{
                height: 35,
                width: 100,
                objectFit: "contain",
                alignSelf: "center",
                marginBottom: 3,
              }}
            />
            <Text style={styles.signLine}>For MEDIYAZ ART BANK</Text>
            <Text>Proprietor</Text>
            <Text style={{ fontSize: 10, marginTop: 5, color: "#666" }}>
              First Part
            </Text>
          </View>
          <View style={styles.signArea}>
            {documents.signature?.url ? (
              <Image
                src={documents.signature.url}
                cache={false}
                style={{
                  width: 105,
                  height: 35,
                  alignSelf: "center",
                  marginBottom: 5,
                }}
              />
            ) : (
              <Text style={{ height: 40, textAlign: "center" }}>
                No Signature
              </Text>
            )}
            <Text style={styles.signLine}>Signature of Donor</Text>
            <Text style={{ fontSize: 10, marginTop: 5, color: "#666" }}>
              Second Part
            </Text>
          </View>
        </View>
      </Page>
      )}

      {/* ========================================== */}
      {/* EGG - PAGE 3: INFORMATION FORM */}
      {/* ========================================== */}
      {showSection("profile") && (
      <Page
        size="A4"
        style={[styles.page, { fontSize: 12, lineHeight: 1.15, paddingTop: 70, paddingBottom: 40 }]}
      >
        {withHeader && (
          <Image
            src={"/images/letterheaad3.png"}
            style={{
              position: "absolute",
              top: 5,
              left: 0,
              width: "600",
              height: "842",
            }}
            fixed
          />
        )}
        <Text style={[styles.denseTitle,{marginTop:3,fontSize:14}]}>INFORMATION FORM FOR OOCYTE DONOR</Text>

        <Text style={[styles.denseSectionTitle,{marginTop:15}]}>BASIC INFORMATION:</Text>

        {/* Main Table: Basic Info & History */}
        <View style={styles.denseTable}>
          {/* Row 1 */}
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabel,{fontSize:11,fontWeight:700}]}>Donor Name</Text>
            <Text style={[styles.cellValue,{fontSize:11,fontWeight:700}]}>{personalInfo.fullName || ""}</Text>
            <Text style={[styles.cellLabelHistory,{fontSize:11,fontWeight:700}]}>HISTORY</Text>
            <Text style={[styles.cellValueHistory,{fontSize:10,fontWeight:700}]}></Text>
          </View>

          {/* Row 2 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>Donor ID</Text>
            <Text style={[styles.cellValue]}>{displayDonorId}</Text>
            <Text style={styles.cellLabelHistory}>9. Obstetric history</Text>
            <Text style={styles.cellValueHistory}>{donorInfoData.obstetricHistory || "No"}</Text>
          </View>

          {/* Row 3 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>1. Identification number (Donor)</Text>
            <Text style={styles.cellValue}>{personalInfo.aadhaarNumber || ""}</Text>
            <Text style={[styles.cellLabelHistory,{paddingLeft:10}]}>a. Number of deliveries</Text>
            <Text style={styles.cellValueHistory}>{donorInfoData.numberOfDeliveries || "01"}</Text>
          </View>

          {/* Row 4 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>2. Age / Date of birth</Text>
            <Text style={styles.cellValue}>
              {formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || "—"}
            </Text>
            <Text style={[styles.cellLabelHistory,{paddingLeft:10}]}>b. Number of abortions</Text>
            <Text style={styles.cellValueHistory}>{donorInfoData.numberOfAbortions || "No"}</Text>
          </View>

          {/* Row 5 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>3. Marital status</Text>
            <Text style={styles.cellValue}>{personalInfo.maritalStatus || ""}</Text>
            <Text style={[styles.cellLabelHistory,{paddingLeft:10}]}>c. other points of note</Text>
            <Text style={styles.cellValueHistory}>{donorInfoData.otherPointsOfNote || "No"}</Text>
          </View>

          {/* Row 6 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>4. Education of donor</Text>
            <Text style={styles.cellValue}>{personalInfo.education || ""}</Text>
            <Text style={styles.cellLabelHistory}>10. Menstrual history</Text>
            <Text style={styles.cellValueHistory}>{donorInfoData.menstrualCycleDetails || "Regular"}</Text>
          </View>

          {/* Row 7 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>5. Education spouse</Text>
            <Text style={styles.cellValue}>{personalInfo.husbandEducation || personalInfo.spouseEducation || "N/A"}</Text>
            <Text style={styles.cellLabelHistory}>11. History of use of contraceptives</Text>
            <Text style={styles.cellValueHistory}>{donorInfoData.contraceptiveHistory || "No"}</Text>
          </View>

          {/* Row 8 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>6. Occupation of donor</Text>
            <Text style={styles.cellValue}>{personalInfo.occupation || ""}</Text>
            <Text style={styles.cellLabelHistory}>12. Medical history</Text>
            <Text style={styles.cellValueHistory}>{medicalInfo.medicalHistory || "No"}</Text>
          </View>

          {/* Row 9 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>7. Occupation of spouse</Text>
            <Text style={styles.cellValue}>{personalInfo.husbandOccupation || personalInfo.spouseOccupation || " "}</Text>
            <Text style={styles.cellLabelHistory}>13. Family history from the medical point of view</Text>
            <Text style={styles.cellValueHistory}>{medicalInfo.familyMedicalHistory || "No"}</Text>
          </View>

          {/* Row 10 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>6. Monthly income</Text>
            <Text style={styles.cellValue}>{personalInfo.monthlyIncome || " "}</Text>
            <Text style={[styles.cellLabelHistory]}>14. History of any abnormality in a child of the donor</Text>
            <Text style={styles.cellValueHistory}>{(medicalInfo as any).childAbnormalityHistory || medicalInfo.geneticDisorders || "No"}</Text>
          </View>

          {/* Row 11 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>7. Religion</Text>
            <Text style={styles.cellValue}>{personalInfo.religion || " "}</Text>
            <Text style={styles.cellLabelHistory}>15. History of blood transfusion</Text>
            <Text style={styles.cellValueHistory}>{donorInfoData.bloodTransfusionHistory || "No"}</Text>
          </View>

          {/* Row 12 */}
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabel,{borderWidth:0}]}>8. Nationality</Text>
            <Text style={[styles.cellValue,{borderWidth:0}]}>{contactInfo.country || (personalInfo as any).nationality || "Indian"}</Text>
            <Text style={[styles.cellLabelHistory,{borderWidth:0}]}>16. History of substance abuse</Text>
            <Text style={[styles.cellValueHistory,{borderWidth:0}]}>{donorInfoData.substanceAbuseHistory || "No"}</Text>
          </View>

        </View>

        {/* FEATURES */}
        <Text style={styles.denseSectionTitle}>FEATURES:</Text>

        <View style={styles.denseTable}>
          <View style={styles.denseRow}>
            <Text style={styles.featureCellLabel}>17. Height</Text>
            <Text style={styles.featureCellValue}>{personalInfo.height || ""}</Text>
            <Text style={styles.featureCellLabel}>20. Colour of hair</Text>
            <Text style={styles.featureCellValueLast}>{personalInfo.hairColor || ""}</Text>
          </View>

          <View style={styles.denseRow}>
            <Text style={styles.featureCellLabel}>18. Weight</Text>
            <Text style={styles.featureCellValue}>{personalInfo.weight || ""}</Text>
            <Text style={styles.featureCellLabel}>21. Colour of eyes</Text>
            <Text style={styles.featureCellValueLast}>{personalInfo.eyeColor || ""}</Text>
          </View>

          <View style={styles.denseRow}>
            <Text style={[styles.featureCellLabel, styles.denseCellNoBottom]}>19. Colour of skin</Text>
            <Text style={[styles.featureCellValue, styles.denseCellNoBottom]}>{personalInfo.complexion || ""}</Text>
            <Text style={[styles.featureCellLabel, styles.denseCellNoBottom]}>Hobby / Interests</Text>
            <Text style={[styles.featureCellValueLast, styles.denseCellNoBottom]}>{personalInfo.hobby || ""}</Text>
          </View>
        </View>

        {/* INVESTIGATIONS */}
        <Text style={styles.denseSectionTitle}>
          INVESTIGATIONS: TO BE FILLED BY RESPECTIVE INVESTIGATOR
        </Text>

        <View style={styles.denseTable}>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabelInvestLeft}>22. Blood group and Rh status</Text>
            <Text style={styles.cellValueInvestLeft}>{""}</Text>
            <Text style={styles.cellLabelInvestRight}>25. Blood urea / Serum creatinine</Text>
            <Text style={styles.cellValueInvestRight}>{investigations.bloodUreaSerumCreatinine || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabelInvestLeft}>23. Complete blood picture</Text>
            <Text style={styles.cellValueInvestLeft}>{investigations.completeBloodPicture || ""}</Text>
            <Text style={styles.cellLabelInvestRight}>26. SGPT</Text>
            <Text style={styles.cellValueInvestRight}>{investigations.sgpt || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabelInvestLeft,{paddingLeft:10}]}>a. Hb</Text>
            <Text style={styles.cellValueInvestLeft}>{investigations.hb || ""}</Text>
            <Text style={styles.cellLabelInvestRight}>27. Routine urine examination</Text>
            <Text style={styles.cellValueInvestRight}>{investigations.routineUrine || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabelInvestLeft,{paddingLeft:10}]}>b. Total RBC count</Text>
            <Text style={styles.cellValueInvestLeft}>{investigations.totalRbc || ""}</Text>
            <Text style={styles.cellLabelInvestRight}>28. HBsAg status</Text>
            <Text style={styles.cellValueInvestRight}>{investigations.hbsagStatus || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabelInvestLeft,{paddingLeft:10}]}>c. Total WBC count</Text>
            <Text style={styles.cellValueInvestLeft}>{investigations.totalWbc || ""}</Text>
            <Text style={styles.cellLabelInvestRight}>29. Hepatitis C status</Text>
            <Text style={styles.cellValueInvestRight}>{investigations.hepatitisCStatus || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabelInvestLeft,{paddingLeft:10}]}>d. Differential WBC count</Text>
            <Text style={styles.cellValueInvestLeft}>{investigations.differentialWbc || ""}</Text>
            <Text style={styles.cellLabelInvestRight}>30. HIV status with date of the tests done</Text>
            <Text style={styles.cellValueInvestRight}>{investigations.hivStatus || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabelInvestLeft,{paddingLeft:10}]}>e. Platelet count</Text>
            <Text style={styles.cellValueInvestLeft}>{investigations.plateletCount || ""}</Text>
            <Text style={styles.cellLabelInvestRight}>31. Hemoglobin A2 for thalassemia) status</Text>
            <Text style={styles.cellValueInvestRight}>{investigations.hemoglobinA2 || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabelInvestLeft,{paddingLeft:10}]}>f. Peripheral smear</Text>
            <Text style={styles.cellValueInvestLeft}>{investigations.peripheralSmear || ""}</Text>
            <Text style={styles.cellLabelInvestRight}>32. Any other specific test</Text>
            <Text style={styles.cellValueInvestRight}>{investigations.otherSpecificTest || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={[styles.cellLabelInvestLeft, styles.denseCellNoBottom]}>24. Random blood sugar</Text>
            <Text style={[styles.cellValueInvestLeft, styles.denseCellNoBottom]}>{investigations.randomBloodSugar || ""}</Text>
            <Text style={[styles.cellLabelInvestRight, styles.denseCellNoBottom]}></Text>
            <Text style={[styles.cellValueInvestRight, styles.denseCellNoBottom]}></Text>
          </View>
        </View>

        {/* DETAILED PHYSICAL EXAMINATION */}
        <Text style={styles.denseSectionTitle}>DETAILED PHYSICAL EXAMINATION:</Text>

        <View style={styles.denseTable}>
          <View style={styles.denseRow}>
            <Text style={styles.denseExamLabelLeft}>33. Pulse</Text>
            <Text style={styles.denseExamValueLeft}>{physicalExamination.pulse || ""}</Text>
            <Text style={styles.denseExamLabelRight}>36. Respiratory system</Text>
            <Text style={styles.denseExamValueRight}>{physicalExamination.respiratorySystem || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.denseExamLabelLeft}>34. Blood pressure</Text>
            <Text style={styles.denseExamValueLeft}>{physicalExamination.bloodPressure || ""}</Text>
            <Text style={styles.denseExamLabelRight}>37. Cardiovascular system</Text>
            <Text style={styles.denseExamValueRight}>{physicalExamination.cardiovascularSystem || ""}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={[styles.denseExamLabelLeft, styles.denseCellNoBottom]}>35. Temperature</Text>
            <Text style={[styles.denseExamValueLeft, styles.denseCellNoBottom]}>{physicalExamination.temperature || ""}</Text>
            <Text style={[styles.denseExamLabelRight, styles.denseCellNoBottom]}>38. Per abdominal examination</Text>
            <Text style={[styles.denseExamValueRight, styles.denseCellNoBottom]}>{physicalExamination.perAbdominal || ""}</Text>
          </View>
        </View>

        <Text style={styles.denseFootnotesTitle}>Footnotes:</Text>
        <Text style={styles.denseFootnoteText}>
          (1) To be carried out within 15 days prior to oocyte donation
        </Text>
        <Text style={styles.denseFootnoteText}>
          (2) Any additional test carried out on the basis of the history and examination of donor
        </Text>
      </Page>
      )}

      {/* ========================================== */}
      {/* EGG - PAGE 4: FORM 14 A */}
      {/* ========================================== */}
      {showSection("form14a") && (
      <Page size="A4" style={[styles.page, { paddingTop: 80 }]}  >
        {withHeader && (
          <Image
            src={"/images/letterheaad3.png"}
            style={{
              position: "absolute",
              top: 5,
              left: 0,
              width: 600,
              height: 842,
            }}
            fixed
          />
        )}
        {/* Gazette of India Extraordinary Header */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text style={{ width: 50, fontSize: 10, fontFamily: "Times-Bold", fontWeight: "bold" }}>
              45
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", flex: 1, letterSpacing: 0.5 }}>
              THE GAZETTE OF INDIA: EXTRAORDINARY
            </Text>
            <Text style={{ width: 100, fontSize: 9.5, fontFamily: "Times-Roman", textAlign: "right" }}>
              [PART II—SEC. 3 (i)]
            </Text>
          </View>
          {/* <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 1 }}>
            <Text style={{ width: 50, fontSize: 9, fontFamily: "Times-Roman" }}>
              
            </Text>
          </View> */}
          <View style={{ borderBottomWidth: 1.2, borderColor: "#000", marginTop: 3 }} />
        </View>

        {/* Form 14 A Title Block */}
        <View style={{ alignItems: "center", marginBottom: 14 }}>
          <Text style={{ fontSize: 14, fontFamily: "Times-Bold", fontWeight: "bold", marginBottom: 3, letterSpacing: 0.5 }}>
            FORM 14 A
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "Times-Bold", fontWeight: "bold", marginBottom: 5 }}>
            [See rule 13 (2) (i)]
          </Text>
          <Text style={{ fontSize: 12, fontFamily: "Times-Roman", textAlign: "center" }}>
            <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold" }}>For Oocyte Donors</Text> Aadhaar No.{" "}
            {personalInfo.aadhaarNumber || ""}{" "}
            (For donors recruited and screened by the ART bank)
          </Text>
        </View>

        {/* ART Bank Name and Registration Number */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontFamily: "Times-Roman" }}>
            (Name of the ART bank) <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold" }}>MEDIYAZ ART BANK</Text>
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "Times-Roman" }}>
            Registration No <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold" }}>DL/AB/2022/10605/AB/SEB/21</Text>
          </Text>
        </View>

        {/* Register Table */}
        <View style={{ borderWidth: 1, borderColor: "#000" }}>
          {/* Header Row */}
          <View style={{ flexDirection: "row", minHeight: 46, alignItems: "stretch", borderBottomWidth: 1, borderColor: "#000" }}>
            <View style={{ width: "18%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", fontSize: 10 }}>
                Donor ID
              </Text>
            </View>
            <View style={{ width: "12%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", fontSize: 10, lineHeight: 1.15 }}>
                {"Recruitment\nDate"}
              </Text>
            </View>
            <View style={{ width: "15%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", fontSize: 10, lineHeight: 1.15 }}>
                {"Name of\nperson\nRecruiting"}
              </Text>
            </View>
            <View style={{ width: "12%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", fontSize: 10 }}>
                Signature
              </Text>
            </View>
            <View style={{ width: "11%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", fontSize: 10, lineHeight: 1.15 }}>
                {"Supply\nDate"}
              </Text>
            </View>
            <View style={{ width: "23%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", fontSize: 10 }}>
                ART Clinic
              </Text>
            </View>
            <View style={{ width: "7%", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", fontSize: 10, lineHeight: 1.15 }}>
                {"Receipt\nattached\n\n(Yes /\nNo)"}
              </Text>
            </View>
          </View>

          {/* Populated Row 1 */}
          <View style={{ flexDirection: "row", minHeight: 32, alignItems: "stretch", borderBottomWidth: 1, borderColor: "#000", flexWrap: 'wrap' }}>
            <View style={{ width: "18%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center", display:"flex",flexWrap: 'wrap',  }}>
              <Text style={{ fontFamily: "Times-Bold", fontWeight: "bold", textAlign: "center", fontSize: 10, width:"100%" }}>
                {displayDonorId}
                
              </Text>
            </View>
            <View style={{ width: "12%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ textAlign: "center", fontSize: 10 }}>
                {displayRegistrationDate}
                
              </Text>
            </View>
            <View style={{ width: "15%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ textAlign: "center", fontSize: 10 }}>
                {recruiterName}
              </Text>
            </View>
            <View style={{ width: "12%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Image
                src="/images/signature.png"
                style={{ width: 75, objectFit: "contain" }}
              />
            </View>
            <View style={{ width: "11%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ textAlign: "center", fontSize: 10 }}>
                {displaySupplyDate || ""}
              </Text>
            </View>
            <View style={{ width: "23%", borderRightWidth: 1, borderColor: "#000", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ textAlign: "center", fontSize: 10 }}>
                {clinicName || ""}
               
              </Text>
            </View>
            <View style={{ width: "7%", padding: 4, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ textAlign: "center", fontSize: 10 }}>{""}</Text>
            </View>
          </View>

          {/* Blank Rows for Official Register Appearance (10 blank rows) */}
          {Array.from({ length: 10 }).map((_, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                height: 25,
                alignItems: "stretch",
                borderBottomWidth: idx === 9 ? 0 : 1,
                borderColor: "#000",
              }}
            >
              <View style={{ width: "18%", borderRightWidth: 1, borderColor: "#000" }} />
              <View style={{ width: "12%", borderRightWidth: 1, borderColor: "#000" }} />
              <View style={{ width: "15%", borderRightWidth: 1, borderColor: "#000" }} />
              <View style={{ width: "12%", borderRightWidth: 1, borderColor: "#000" }} />
              <View style={{ width: "11%", borderRightWidth: 1, borderColor: "#000" }} />
              <View style={{ width: "23%", borderRightWidth: 1, borderColor: "#000" }} />
              <View style={{ width: "7%" }} />
            </View>
          ))}
        </View>
      </Page>
      )}

      {/* ========================================== */}
      {/* EGG - PAGE 5: CERTIFICATE */}
      {/* ========================================== */}
      {showSection("certificate") && isCertificateIssued && (
      <Page size="A4" style={[styles.page,{ paddingTop: 70, paddingBottom: 70 } ]}>
        {withHeader && (
          <Image
            src={"/images/letterheaad3.png"}
            style={{
              position: "absolute",
              top: 5,
              left: 0,
              width: 600,
              height: 842,
            }}
            fixed
          />
        )}

        <View style={{ marginTop: withHeader ? 20 : 20 }}>
          <Text
            style={[
              styles.bold,
              { textAlign: "center", marginBottom: 25, fontSize: 13, lineHeight: 1.4 },
            ]}
          >
            CERTIFICATE IN TERM OF RULE 10 OF THE ASSISTED REPRODUCTIVE
            TECHNOLOGY RULES, 2022
          </Text>

          <Text style={[styles.text, { marginBottom: 18, lineHeight: 1.6 }]}>
            We hereby certify that Mrs,{" "}
            <Text style={styles.bold}>{personalInfo.fullName || ""}</Text>{" "}
            registered Oocyte donor of MEDIYAZ ART BANK (ART Bank Registration
            No. <Text style={styles.bold}>DL/AB/2022/10605/AB/SEB/21</Text>) Donor registration No.{" "}
            <Text style={styles.bold}>{displayDonorId}</Text> and her Records have been
            duly maintained in accordance with the assisted reproductive
            technology rules 2022.
          </Text>

          <Text style={[styles.text, { marginBottom: 18, lineHeight: 1.6 }]}>
            We further certify that the said oocyte donor has been screened and
            tested for the following communicable diseases and has been found to
            be negative.
          </Text>

          <View style={[styles.list, { marginLeft: 25, marginBottom: 40 }]}>
            <Text style={[styles.text, { marginBottom: 8 }]}>
              • Human immunodeficiency virus (HIV), type 1 & 2
            </Text>
            <Text style={[styles.text, { marginBottom: 8 }]}>
              • Hepatitis B virus (HBV)
            </Text>
            <Text style={[styles.text, { marginBottom: 8 }]}>
              • Hepatitis C virus (HCV)
            </Text>
            <Text style={[styles.text, { marginBottom: 8 }]}>
              • Treponema Pallidum (syphilis) through (VDRL)
            </Text>
          </View>

          <View style={{ marginTop: 30 }}>
            <Text style={[styles.bold, { marginBottom: 8 }]}>Certified By</Text>
            <Image
              src="/images/signature.png"
              style={{
                height: 40,
                width: 120,
                objectFit: "contain",
                alignSelf: "flex-start",
                marginTop: 5,
                marginBottom: 5,
              }}
            />
            <Text
              style={[
                styles.bold,
                styles.signLine,
                { width: 160, textAlign: "left", marginBottom: 3 },
              ]}
            >
              Mr. IMTIYAZ SHAIKH
            </Text>
            <Text style={{ fontSize: 11, marginBottom: 2 }}>Director / Proprietor</Text>
            <Text style={{ fontSize: 11, fontFamily: "Times-Bold", fontWeight: "bold" }}>
              For MEDIYAZ ART BANK
            </Text>
          </View>
        </View>
      </Page>
      )}

      {showSection("affidavit") && (
        <>
          {/* If uploaded affidavit is an image and not template-only, render full page image */}
          {Boolean(
            (documents?.affidavit?.url || mergedRegistration?.affidavit?.url) &&
            !((documents?.affidavit?.url || mergedRegistration?.affidavit?.url).toLowerCase().includes(".pdf")) &&
            !((documents?.affidavit?.url || mergedRegistration?.affidavit?.url).toLowerCase().startsWith("data:application/pdf")) &&
            affidavitType !== "template"
          ) && (
            <Page size="A4" style={[styles.page, { padding: 0, justifyContent: "center", alignItems: "center" }]}>
              {withHeader && (
                <Image
                  src="/images/letterheaad3.png"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    width: "100%",
                    height: 95,
                    objectFit: "cover",
                  }}
                />
              )}
              <View style={{ flex: 1, width: "100%", height: "100%", padding: withHeader ? "105 25 25 25" : 25, justifyContent: "center", alignItems: "center" }}>
                <Image
                  src={documents?.affidavit?.url || mergedRegistration?.affidavit?.url}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </View>
            </Page>
          )}

          {/* Render statutory template if requested or if no uploaded affidavit */}
          {(!(documents?.affidavit?.url || mergedRegistration?.affidavit?.url) ||
            affidavitType === "template" ||
            affidavitType === "both") && (
            <EggAffidavit 
              consent={consent}
              donor={{
                name: personalInfo.fullName,
                husbandName: personalInfo.spouseName || personalInfo.husbandName || "",
                husbandEducation: personalInfo.husbandEducation || personalInfo.spouseEducation || "",
                houseNo: "", 
                address: contactInfo.currentAddress,
                currentAddress: contactInfo.currentAddress,
                permanentAddress: contactInfo.permanentAddress || contactInfo.currentAddress,
                city: contactInfo.city,
                state: contactInfo.state,
                country: contactInfo.country,
                pincode: contactInfo.pincode,
                aadhaar: personalInfo.aadhaarNumber,
                dob: formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth,
                mobile: contactInfo.mobileNumber,
                verificationDate: `${day} ${month} ${year}`,
                deliveries: donorInfoData.numberOfDeliveries,
              }} 
              documents={documents}
              withHeader={withHeader}
            />
          )}
        </>
      )}


      {attachments?.includes("terms") && (
        <Page size="A4" style={styles.page}>
          {withHeader && (
            <Image
              src="/images/letterheaad3.png"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 600,
                height: 842,
              }}
              fixed
            />
          )}
          <View style={{ marginTop: 20 }}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: 14,
                  textDecoration: "none",
                  textAlign: "left",
                  color: "#006666",
                },
              ]}
            >
              REGISTRY TERMS & CONDITIONS
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: "#444",
                marginTop: 10,
                textAlign: "justify",
                lineHeight: 1.6,
              }}
            >
              1. CONFIDENTIALITY: In accordance with Section 22 of the ART
              (Regulation) Act, 2021, the identity of the gamete donor shall
              remain strictly confidential. No recipient couple or child born
              shall have access to the personal identity details of the donor.
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: "#444",
                marginTop: 8,
                textAlign: "justify",
                lineHeight: 1.6,
              }}
            >
              2. PARENTAL RIGHTS: The donor hereby relinquishes all claims and
              parental rights over any offspring conceived from the donated
              gametes. The recipient couple shall be the legal parents of the
              child.
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: "#444",
                marginTop: 8,
                textAlign: "justify",
                lineHeight: 1.6,
              }}
            >
              3. MEDICAL VERITY: The donor certifies that all medical histories,
              lifestyle statements, and test declarations submitted are
              accurate. Any active suppression of genetic disorders or
              transmissible infections shall void the registration and may lead
              to clinical audits.
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: "#444",
                marginTop: 8,
                textAlign: "justify",
                lineHeight: 1.6,
              }}
            >
              4. COMPENSATION: Reimbursement of expenses, medical coverage, and
              any altruistic donor benefits shall be governed strictly by the
              state guidelines and clinic policies, with no direct financial
              negotiations allowed.
            </Text>
          </View>
        </Page>
      )}

      {attachments?.includes("notes") && (
        <Page size="A4" style={styles.page}>
          {withHeader && (
            <Image
              src="/images/letterheaad3.png"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 600,
                height: 842,
              }}
              fixed
            />
          )}
          <View style={{ marginTop: 20 }}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: 14,
                  textDecoration: "none",
                  textAlign: "left",
                  color: "#006666",
                },
              ]}
            >
              ADDITIONAL REMARKS & NOTES
            </Text>
            <View
              style={{
                marginTop: 20,
                borderBottomWidth: 1,
                borderColor: "#ccc",
                height: 25,
              }}
            />
            <View
              style={{ borderBottomWidth: 1, borderColor: "#ccc", height: 25 }}
            />
            <View
              style={{ borderBottomWidth: 1, borderColor: "#ccc", height: 25 }}
            />
            <View
              style={{ borderBottomWidth: 1, borderColor: "#ccc", height: 25 }}
            />
            <View
              style={{ borderBottomWidth: 1, borderColor: "#ccc", height: 25 }}
            />
            <View
              style={{ borderBottomWidth: 1, borderColor: "#ccc", height: 25 }}
            />
            <View
              style={{ borderBottomWidth: 1, borderColor: "#ccc", height: 25 }}
            />
            <View
              style={{ borderBottomWidth: 1, borderColor: "#ccc", height: 25 }}
            />
            <View
              style={{ borderBottomWidth: 1, borderColor: "#ccc", height: 25 }}
            />
          </View>
        </Page>
      )}

      {extraDocUrl &&
        /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(extraDocUrl) && (
          <Page size="A4" style={{ padding: 0 }}>
            <Image
              src={extraDocUrl}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Page>
        )}

      {/* ========================================== */}
      {/* EGG - FINAL PAGE: AADHAAR CARD (FRONT & BACK WITH SIGNATURE) */}
      {/* ========================================== */}
      {showSection("aadhaar") && (documents?.aadhaarFront?.url || documents?.aadhaarBack?.url) && (
        <Page
          size="A4"
          style={{
            padding: 30,
            justifyContent: "space-between",
          }}
          wrap={false}
        >
          <View
            style={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-around",
              flex: 1,
            }}
          >
            {documents?.aadhaarFront?.url && (
              <Image
                src={documents.aadhaarFront.url}
                style={{
                  width: "70%",
                  height: documents?.aadhaarBack?.url ? 330 : 660,
                  objectFit: "contain",
                  marginBottom: documents?.aadhaarBack?.url ? 10 : 0,
                }}
              />
            )}

            {/* Signature */}
          {documents?.signature?.url && (
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "center",
                paddingRight: 10,
                paddingTop: 10,
              }}
            >
              <Image
                src={documents.signature.url}
                style={{
                  width: 140,
                  height: 50,
                  objectFit: "contain",
                }}
              />
            </View>
          )}

            {documents?.aadhaarBack?.url && (
              <Image
                src={documents.aadhaarBack.url}
                style={{
                  width: "70%",
                  height: documents?.aadhaarFront?.url ? 330 : 660,
                  objectFit: "contain",
                }}
              />
            )}
          </View>

          
        </Page>
      )}
    </Document>
  );
};

export default PrintableEggRegistration;
