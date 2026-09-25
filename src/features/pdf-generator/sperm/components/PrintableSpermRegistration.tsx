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
import AffidavitPdf from "./PrintableSpermAffidavit";

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
    textAlign: "left",
  },
  hbtext: {
    fontFamily: "NotoSansDevanagari",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "left",
  },
  page: {
    // position: "relative",
    // padding: 40,
    // fontFamily: "Times-Roman",
    // fontSize: 11,
    // lineHeight: 1.5,
    // color: "#000",

    position: "relative",
    paddingTop: 70, // Leave space for header
    paddingBottom: 90, // Leave space for footer
    paddingHorizontal: 40,
    fontFamily: "Times-Roman",
    fontSize: 11,
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
    // textDecoration: "underline",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 10,
  },
  row: {
    border: "1px solid black",

    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  text: {
    fontSize: 11,
    textAlign: "justify",
    marginBottom: 10,
  },
  bold: {
    fontFamily: "Times-Bold",
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
  },
  listText: {
    flex: 1,
  },
  signatureBlock: {
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
    width: 160,
    paddingTop: 4,
    textAlign: "center",
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
  c1: {
    width: "30%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 4,
  },

  c2: {
    width: "20%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 4,
  },

  c3: {
    width: "37%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 4,
  },

  c4: {
    width: "13%",
    borderBottomWidth: 1,
    padding: 4,
  },

  // bold: {
  //   fontWeight: "bold",
  // },

  centerBold: {
    fontWeight: "bold",
    textAlign: "center",
  },

  listRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
  },

  bullet: {
    width: 15,
    fontSize: 12,
  },

  number: {
    width: 18,
  },

  // listText: {
  //   flex: 1,
  //   lineHeight: 1.4,
  // },
  heading: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 8,
  },

  heading2: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 8,
  },

  footer: {
    marginTop: 70,
    textAlign: "center",
    fontSize: 10,
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
}

// All available section keys for sperm donor
export const SPERM_SECTIONS = [
  { key: "registration", label: "Registration Form" },
  { key: "contract", label: "Contract" },
  { key: "certificate", label: "Certificate (Rule 10)" },
  { key: "consent", label: "Consent Form (Form 15)" },
  { key: "profile", label: "Semen Profile & Report" },
  { key: "affidavit", label: "Affidavit" },
];

// const SectionSeparator = ({ title }: { title: string }) => (
//   <Page
//     size="A4"
//     style={{
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       backgroundColor: "#006666",
//       fontFamily: "Times-Bold",
//     }}
//   >
//     <View style={{ textAlign: "center" }}>
//       <Text style={{ fontSize: 28, color: "#ffffff", letterSpacing: 2 }}>
//         {title.toUpperCase()}
//       </Text>
//       <View
//         style={{
//           marginTop: 20,
//           borderTopWidth: 1,
//           borderColor: "#ffffff",
//           width: 250,
//           alignSelf: "center",
//         }}
//       />
//       <Text style={{ fontSize: 11, color: "#ccffff", marginTop: 12 }}>
//         MEDIYAZ ART BANK — CONFIDENTIAL MEDICAL DOCUMENT
//       </Text>
//     </View>
//   </Page>
// );

const PrintableDonorRegistration = ({
  registration,
  qrCodeUrl,
  withHeader = false,
  attachments = [],
  sections,
  overrides = {},
  extraDocUrl,
}: PdfDocumentProps) => {
  // Merge overrides into registration data
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

  const showSection = (key: string) =>
    !sections || sections.length === 0 || sections.includes(key);
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

  const rawRegistrationDate =
    recruitmentDate ||
    spermDonorInfo?.recruitmentDate ||
    overrides?.recruitmentDate ||
    consent?.signatureDate ||
    "";
  const displayRegistrationDate =
    formatDisplayDate(rawRegistrationDate) || rawRegistrationDate || "";

  const displayFileNumber =
    fileNumber ||
    overrides?.fileNumber ||
    (registrationId
      ? `MAB/SD/${registrationId.split("-").pop()?.slice(-3) || "001"}`
      : "MAB/SD/001");

  const displayDonorId =
    donorId ||
    mergedRegistration.donorId ||
    overrides?.donorId ||
    registrationId ||
    "MAB/SD/___";

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

  // const renderHeader = () => (
  //     <View
  //           fixed
  //           style={{
  //             position: "absolute",
  //             top: 20,
  //             left: 40,
  //             right: 40,
  //             flexDirection: "row",
  //             justifyContent: "space-between",
  //             alignItems: "center",
  //             borderBottom: "1 solid #D3D3D3",
  //             paddingBottom: 10,
  //           }}
  //         >
  //           {/* Left */}
  //           <View
  //             style={{
  //               flexDirection: "row",
  //               alignItems: "center",
  //             }}
  //           >
  //             <Image //               src="/logo.webo" // Replace with your logo
  //               style={{
  //                 width: 50,
  //                 height: 50,
  //                 marginRight: 10,
  //               }}
  //             />

  //             <Text
  //               style={{
  //                 fontSize: 18,
  //                 fontWeight: "bold",
  //                 color: "#003366",
  //               }}
  //             >
  //               ABC Technologies Pvt. Ltd.
  //             </Text>
  //           </View>
  //         </View>
  //   );

  const renderFooter = () => (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 20,
        left: 40,
        right: 40,
        borderTop: "1 solid #D3D3D3",
        paddingTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      {/* LEFT SIDE */}
      <View
        style={{
          width: "48%",
        }}
      >
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            Email
          </Text>

          <Text style={{ fontSize: 9 }}>info@abccompany.com</Text>
        </View>

        <View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            Address
          </Text>

          <Text style={{ fontSize: 9 }}>
            123 Business Park{"\n"}
            New Delhi, India - 110001
          </Text>
        </View>
      </View>

      {/* RIGHT SIDE */}
      <View
        style={{
          width: "48%",
          alignItems: "flex-end",
        }}
      >
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            Phone
          </Text>

          <Text style={{ fontSize: 9 }}>+91 9876543210</Text>
        </View>

        <View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            Website
          </Text>

          <Text style={{ fontSize: 9 }}>www.abccompany.com</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Document title={`Donor_Registration_${registrationId || "Draft"}`}>
      {/* ========================================== */}
      {/* SPERM - PAGE 1: REGISTRATION FORM */}
      {/* ========================================== */}
      {/* {showSection("registration") && (
        // <SectionSeparator title="Registration Form" />
      )} */}
      {showSection("registration") && (
        <Page size="A4" style={styles.page}>
          {/* {renderHeader()} */}
          {withHeader && (
            <>
              <Image
                src={"/images/letterhead5.jpeg"}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "600",
                  height: "842",
                }}
                fixed
              />
              {/* Removed QR Image */}
              <View
                style={{
                  position: "absolute",
                  top: 20,
                  right: 40,
                  fontSize: 8,
                  color: "#006666",
                  fontFamily: "Times-Bold",
                }}
              >
                <Text>Mediyaz National Registry Record</Text>
                <Text>Reg ID: {registrationId}</Text>
                <Text>Issue Date: {new Date().toLocaleDateString()}</Text>
              </View>
            </>
          )}
          <Text style={styles.title}>REGISTRATION FORM For SPERM DONOR</Text>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text style={styles.label}>Registration Date</Text>
                <Text>{displayRegistrationDate}</Text>
              </View>

              <View style={styles.tableCell}>
                <Text style={styles.label}>Sample ID</Text>
                <Text>{displayFileNumber}</Text>
              </View>

              <View style={styles.tableCell}>
                <Text style={styles.label}>Donor ID</Text>
                <Text>{displayDonorId}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.text}>
            I, Mr <Text style={styles.bold}>{personalInfo.fullName || ""}</Text> age <Text style={styles.bold}>{personalInfo.age || ""}</Text>{" "}
            years, R/o <Text style={styles.bold}>{formatAddress(contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}</Text>; having Aadhar Card
            No. <Text style={styles.bold}>{personalInfo.aadhaarNumber || ""}</Text> and date of birth{" "}
            <Text style={styles.bold}>{personalInfo.dateOfBirth || ""}</Text>, is willing to donate my Sperm to
            needy couple/woman and agree to abide by following terms.
          </Text>

          <Text style={styles.htext}>
            मैं, <Text style={styles.bold}>{personalInfo.fullName || ""}</Text>, आयु <Text style={styles.bold}>{personalInfo.age || ""}</Text>{" "}
            वर्ष, निवासी मकान संख्या, <Text style={styles.bold}>{formatAddress(contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}</Text>; आधार
            कार्ड संख्या <Text style={styles.bold}>{personalInfo.aadhaarNumber || ""}</Text> और जन्म तिथि{" "}
            <Text style={styles.bold}>{personalInfo.dateOfBirth || ""}</Text> है। ज़रूरतमंद कपल/महिला को अपना
            स्पर्म डोनेट करने को तैयार हूँ और नीचे दी गई शर्तों को मानने के लिए
            सहमत हूँ।
          </Text>

          <View style={[styles.list, styles.htext]}>
            {[
              {
                en: `My date of birth ${formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || "—"}, age ${donorAgeWords || (donorAge ? `${donorAge}` : "—")} years as on today is more than twenty-one years and less than fifty-five years.`,
                hi: `मेरी जन्मतिथि ${formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || "—"} है, आज के हिसाब से मेरी उम्र ${donorAge ? `${donorAge} साल` : "इक्कीस साल से ज़्यादा"} और पचपन साल से कम है।`,
              },
              {
                en: "I agree that I am registering for donating my Sperm for non-commercial purpose and for the purposes of assisted reproductive technology services arising due to infertility, disease and/or social and medical concerns.",
                hi: "मैं सहमत हूँ कि मैं अपने स्पर्म को गैर-व्यावसायिक उद्देश्य के लिए और बांझपन, बीमारी और/या सामाजिक और मेडिकल चिंताओं के कारण होने वाली असिस्टेड रिप्रोडक्टिव टेक्नोलॉजी सेवाओं के उद्देश्यों के लिए दान करने के लिए रजिस्टर कर रहा हूँ।",
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
                en: "I agree that I will donate my Sperm to the needy couple/woman and go to the ART   bank whenever informed by ART Bank namely MEDIYAZ ART BANK in the event my Sperm is collected and preserved, same may be used for the purposes  specified in the Assisted Reproductive Technology (Regulation) Act, 2021.",
                hi: "मैं सहमत हूँ कि मैं ज़रूरतमंद कपल/महिला को अपना स्पर्म डोनेट करूँगा और जब भी ART बैंक, यानी मेडियाज़ आर्ट बैंक द्वारा मुझे बताया जाएगा, तो मैं वहाँ जाऊँगा। अगर मेरा स्पर्म इकट्ठा करके सुरक्षित रखा जाता है, तो उसका इस्तेमाल असिस्टेड रिप्रोडक्टिव टेक्नोलॉजी (रेगुलेशन) एक्ट, 2021 में बताए गए कामों के लिए किया जा सकता है।",
              },
              {
                en: "I agree and affirm that I will not try to know the identity of recipient and disclose the same to any person in the event the identity of recipient is come within my knowledge as per law.",
                hi: "मैं सहमत हूँ और पुष्टि करता हूँ कि मैं प्राप्तकर्ता की पहचान जानने की कोशिश नहीं करूँगा और अगर कानून के अनुसार प्राप्तकर्ता की पहचान मेरे सामने आती है, तो मैं उसे किसी भी व्यक्ति को नहीं बताऊंगा।",
              },
              {
                en: "I undertake and confirm that I am registering myself for donating my sperm with ART Bank namely (MEDIYAZ ART BANK) for the first time and have not registered with any other ART Bank before. I further undertake and confirm that I have never donated my sperm to any couple/woman in past and will never donate my oocyte to any couple/woman more than one in my life.",
                hi: "मैं यह वादा करता हूँ और पुष्टि करता हूँ कि मैं पहली बार ART बैंक यानी (मेडियज़ आर्ट बैंक) में अपना स्पर्म डोनेट करने के लिए रजिस्टर कर रहा हूँ और मैंने पहले किसी दूसरे ART बैंक में रजिस्टर नहीं किया है। मैं यह भी वादा करता हूँ और पुष्टि करता हूँ कि मैंने पहले कभी किसी कपल/महिला को अपना स्पर्म डोनेट नहीं किया है और मैं अपनी ज़िंदगी में एक से ज़्यादा बार किसी कपल/महिला को अपना ऊसाइट डोनेट नहीं करूँगा।",
              },
              {
                en: "I confirm and verify that the above-mentioned facts are true and correct to the best of my knowledge.",
                hi: "मैं पुष्टि करता हूँ और वेरिफ़ाई करता हूँ कि ऊपर बताए गए तथ्य मेरी जानकारी के अनुसार सही और सच हैं।",
              },
            ].map((item, idx) => (
              <View style={[styles.listItem, styles.text]} key={idx}>
                <Text style={styles.listBullet}>{idx + 1}.</Text>

                <View style={styles.listText}>
                  <Text>{item.en}</Text>
                  <Text style={styles.htext}>{item.hi}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.signatureBlock}>
            <View style={styles.signArea}>
              {documents.signature?.url ? (
                <Image
                  src={documents.signature.url}
                  cache={false}
                  style={{
                    width: 105,
                    height: 35,
                    alignSelf: "center",
                    marginBottom: 3,
                  }}
                />
              ) : (
                <Text style={{ height: 40, textAlign: "center" }}>
                  No Signature
                </Text>
              )}
              <Text style={styles.signLine}>Sperm donor Signature</Text>
              <Text style={styles.subSignText}>
                (Self-Attested copy of AADHAR Enclosed)
              </Text>
            </View>
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
              <Text style={styles.signLine}>Mr. IMTIYAZ SHAIKH</Text>
              <Text>Director/Proprietor</Text>
              <Text>For MEDIYAZ ART BANK</Text>
            </View>
          </View>
        </Page>
      )}

      {/* ========================================== */}
      {/* SPERM - PAGE 2: CONTRACT */}
      {/* ========================================== */}
      {/* {showSection("contract") && <SectionSeparator title="Contract" />} */}
      {showSection("contract") && (
        <Page size="A4" style={styles.page}>
          {/* {renderHeader(2)} */}
          <Text style={styles.title}>
            Contract between the ART bank and the Semen Donor
          </Text>

          <Text style={[styles.text, { maxWidth: 350, alignSelf: "center" }]}>
            The ART bank and the Donor agree to come into this contract today on
            the {day} day of {month}, (year), in {year}{" "}
            as per the following conditions.
          </Text>

          <Text style={styles.text}>
            <Text style={styles.bold}>First Part</Text> being (MEDIYAZ ART BANK)
            having its office at 366/4, Govindpuri Kalka ji new Delhi 110019,
            and the registered office at 366/4, Govindpuri Kalka ji new Delhi
            110019, herein referred to as the ART Bank.
          </Text>

          <Text
            style={[styles.bold, { textAlign: "center", marginBottom: 10 }]}
          >
            And
          </Text>

          <Text style={styles.text}>
            <Text style={styles.bold}>Second Part</Text> being Mr.{" "}
            <Text style={styles.bold}>{personalInfo.fullName || ""}</Text> age <Text style={styles.bold}>{personalInfo.age || ""}</Text>{" "}
            years, R/o <Text style={styles.bold}>{formatAddress(contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}</Text>; having Aadhar Card
            No. <Text style={styles.bold}>{personalInfo.aadhaarNumber || ""}</Text> and date of birth{" "}
            <Text style={styles.bold}>{personalInfo.dateOfBirth || ""}</Text>, herein referred to as the Donor.
          </Text>

          <Text
            style={[styles.bold, { textAlign: "center", marginBottom: 10 }]}
          >
            Whereas
          </Text>

          <View style={styles.list}>
            {[
              "The first part is a ART bank that is established, amongst other purposes, to collect and store human semen for use in ART procedures.",
              "The second part is an individual who has willingly agreed to donate his semen to the Bank.",
              "That the Bank and the Donor have therefore, come to form this contract to facilitate the process with the laid down terms and conditions.",
            ].map((text, idx) => (
              <View style={styles.listItem} key={idx}>
                <Text style={styles.listBullet}>{idx + 1}.</Text>
                <Text style={styles.listText}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.bold, { marginTop: 15, marginBottom: 10 }]}>
            NOW THIS INDENTURE WITNESSETH THAT:
          </Text>

          <View style={styles.list}>
            {[
              "The Art Bank agrees to accept the semen of the Donor and to preserve it as per the rules laid down in the ART (Regulation) Act.2021",
              "The Donor agrees to disclose the true facts of himself and not to suppress any personal details to the Bank, including family history, genetic background, criminal background, religion, etc. The Bank agrees to keep all information about the Donor confidential.",
              "The Donor agrees to relinquish all parental rights over the child, which may be conceived from his gamete.",
              "The bank agrees to inform the Donor about all the tests that would be necessary for the safety and protection of the ART procedure. The Donor agrees to undergo all the tests required by the Bank.",
              "If the semen is not of acceptable quality, the Donor agrees that his semen that was collected and analysed would be returned to him from the Bank.",
              "This agreement is signed by both the parties after a clear understanding of all the issues involved, and in full senses and under no pressure from any person.",
            ].map((text, idx) => (
              <View style={styles.listItem} key={idx}>
                <Text style={styles.listBullet}>{idx + 1}.</Text>
                <Text style={styles.listText}>{text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.signatureBlock}>
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
              <Text style={styles.signLine}>Signature of the Art Bank</Text>
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
                    marginBottom: 3,
                  }}
                />
              ) : (
                <Text style={{ height: 40, textAlign: "center" }}>
                  No Signature
                </Text>
              )}
              <Text style={styles.signLine}>Signature of Donor</Text>
            </View>
          </View>
        </Page>
      )}

      {/* ========================================== */}
      {/* SPERM - PAGE 3: CERTIFICATE */}
      {/* ========================================== */}
      {/* {showSection("certificate") && (
        <SectionSeparator title="Certificate (Rule 10)" />
      )} */}
      {showSection("certificate") && (
        <Page size="A4" style={styles.page}>
          {/* {renderHeader(3)} */}

          <Text
            style={[styles.title, { fontSize: 12, textDecoration: "none" }]}
          >
            CERTIFICATE IN TERM OF RULE 10 OF THE ASSISTED REPRODUCTIVE
            TECHNOLOGY RULES, 2022
          </Text>

          <Text style={styles.text}>
            We hereby certify that Mr{" "}
            <Text style={styles.bold}>{personalInfo.fullName || ""}</Text> age{" "}
            <Text style={styles.bold}>{personalInfo.age || ""}</Text> years Aadhar Card No.{" "}
            <Text style={styles.bold}>{personalInfo.aadhaarNumber || ""}</Text> is registered Sperm donor of
            MEDIYAZ ART BANK (ART Bank Registration No.
            DL/AB/2022/10605/AB/SEB/21) Donor registration No.{" "}
            <Text style={styles.bold}>{displayDonorId}</Text> and his Records have been
            duly maintained in accordance with the assisted reproductive
            technology rules 2022.
          </Text>

          <Text style={styles.text}>
            We further certify that said donor has been screened and tested for
            following communicable disease and have been found to be Negative:
          </Text>
          <View style={[styles.list, { marginLeft: 20 }]}>
            <Text style={styles.text}>
              • Human immunodeficiency virus (HIV), type 1 & 2
            </Text>
            <Text style={styles.text}>• Hepatitis B virus (HBV)</Text>
            <Text style={styles.text}>• Hepatitis C virus (HCV)</Text>
            <Text style={styles.text}>
              • Treponema Pallidum (syphilis) through (VDRL)
            </Text>
          </View>

          <View style={{ marginTop: 20, marginBottom: 30 }}>
            <Text style={styles.bold}>Certified By</Text>
            <Image
              src="/images/signature.png"
              style={{
                height: 35,
                width: 100,
                objectFit: "contain",
                alignSelf: "flex-start",
                marginTop: 5,
                marginBottom: 3,
              }}
            />
            <Text
              style={[
                styles.bold,
                styles.signLine,
                { width: 140, textAlign: "left" },
              ]}
            >
              Mr. IMTIYAZ SHAIKH
            </Text>
            <Text>Director/ Proprietor</Text>
            <Text>For MEDIYAZ ART BANK</Text>
          </View>
        </Page>
      )}

      {/* {showSection("consent") && (
        <SectionSeparator title="Consent Form (Form 15)" />
      )} */}
      {showSection("consent") && (
        <Page size="A4" style={styles.page}>
          {/* Heading */}
          <Text
            style={{
              textAlign: "center",
              fontFamily: "Times-Bold",
              fontSize: 16,
            }}
          >
            FORM 15
          </Text>

          <Text
            style={{
              textAlign: "center",
              fontFamily: "Times-Bold",
              fontSize: 11,
              marginBottom: 10,
            }}
          >
            [See rule 13 (2) (ii)]
          </Text>

          <Text
            style={{
              textAlign: "center",
              fontFamily: "Times-Bold",
              fontSize: 15,
              marginBottom: 20,
            }}
          >
            CONSENT FORM FOR THE DONOR SPERM
          </Text>

          {/* Paragraph 1 */}
          <Text style={styles.text}>
            I, Mr. <Text style={styles.bold}>{personalInfo.fullName}</Text>{" "}
            Address, House No.{" "}
            <Text style={styles.bold}>{formatAddress(contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}</Text> Mobile
            number. <Text style={styles.bold}>{contactInfo.mobileNumber}</Text>{" "}
            AADHAR card number.{" "}
            <Text style={styles.bold}>{personalInfo.aadhaarNumber}</Text>{" "}
            Willingly consent to donate my sperm to couple/individual who are
            unable to have a child by other means. At this stage and to the best
            of my knowledge I am free of any infectious diseases or genetic
            disorders.
          </Text>

          {/* Paragraph 2 */}
          <Text style={styles.text}>
            I have had a full discussion with Dr. Sanaul haq Hashmi (name and
            address of the clinician) Mediyaz Art Bank - 336/4 Govindpuri Kalka
            Ji South Delhi 110019 on{" "}
            <Text style={styles.bold}>{consent.signatureDate}</Text>
          </Text>

          {/* Paragraph 3 */}
          <Text style={styles.text}>
            I have been counselled by Dr. Sanaul haq Hashmi (name and address of
            independent counsellor) Mediyaz Art Bank - 336/4 Govindpuri Kalka Ji
            South Delhi 110019 on{" "}
            <Text style={styles.bold}>{consent.signatureDate}</Text>
          </Text>

          {/* Paragraph 4 */}
          <Text style={styles.text}>
            I understand that there will be no direct or indirect contact
            between the recipient and me, and my personal identity will not be
            disclosed to the recipient or to the child born through the use of
            my gamete. (If applicable)
          </Text>

          <Text style={styles.text}>
            I understand that I shall have no rights whatsoever on the resulting
            offspring and vice versa.
          </Text>

          {/* Donor Signature */}
          <View style={{ marginTop: 15 }}>
            <Text style={{ fontSize: 18 }}>
              .........................................
            </Text>

            <Text style={{ marginTop: 4 }}>Signature of Donor</Text>
          </View>

          {/* Endorsement */}
          <Text
            style={{
              textAlign: "center",
              fontFamily: "Times-Bold",
              marginTop: 25,
              marginBottom: 15,
            }}
          >
            Endorsement by the ART bank
          </Text>

          <Text style={styles.text}>
            I/we have personally explained to{" "}
            <Text style={styles.bold}>{personalInfo.fullName}</Text> the details
            and implications of his signing this consent / approval form, and
            made sure to the extent humanly possible that he understands these
            details and implications.
          </Text>

          {/* Doctor */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 30,
            }}
          >
            <View style={{ width: "45%" }}>
              <Text>Name and signature of the Doctor</Text>
            </View>

            <View style={{ width: "55%" }}>
              <Text>Dr. Sanaul haq Hashmi</Text>
            </View>
          </View>

          {/* Witness */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 35,
            }}
          >
            <View style={{ width: "45%" }}>
              <Image
                src="/images/signature.png"
                style={{
                  height: 35,
                  width: 100,
                  objectFit: "contain",
                  alignSelf: "flex-start",
                  marginBottom: 3,
                }}
              />
              <Text style={styles.signLine}>
                Name, address and signature of
              </Text>
              <Text>the Witness from the ART bank</Text>
            </View>

            <View style={{ width: "55%" }}>
              <Text>Imtiyaz Shaikh</Text>
              <Text>336/4 Govindpuri Kalka Ji</Text>
              <Text>South Delhi 110019</Text>
            </View>
          </View>

          {/* ART Bank */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 25,
            }}
          >
            <View style={{ width: "45%" }}>
              <Text>Name and address of the ART bank</Text>
            </View>

            <View style={{ width: "55%" }}>
              <Text style={styles.bold}>Mediyaz Art Bank.</Text>
              <Text>336/4 Govindpuri Kalka Ji</Text>
              <Text>South Delhi 110019</Text>
            </View>
          </View>

          {/* Date */}
          <Text style={{ marginTop: 30 }}>
            Dated: <Text style={styles.bold}>{consent.signatureDate}</Text>
          </Text>
        </Page>
      )}

      {/* {showSection("profile") && (
        <SectionSeparator title="Semen Profile & Report" />
      )} */}
      {showSection("profile") && (
        <>
          <Page size="A4" style={styles.page}>
            <Text style={styles.title}>SEMEN PROFILE AND REPORT</Text>

            {/* =================== MAIN TABLE =================== */}
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.c1}>Donor Name</Text>
                <Text style={[styles.c2, styles.bold]}>
                  {personalInfo.fullName}
                </Text>
                <Text style={[styles.c3, styles.centerBold]}>HISTORY:</Text>
                <Text style={styles.c4}></Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>Donor ID</Text>
                <Text style={[styles.c2, styles.bold]}>{displayDonorId}</Text>
                <Text style={styles.c3}>8. Blood group and Rh status</Text>
                <Text style={styles.c4}>{personalInfo.bloodGroup}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>
                  1. Identification number{"\n"}(Donor)
                </Text>
                <Text style={styles.c2}>{personalInfo.aadhaarNumber}</Text>
                <Text style={styles.c3}>
                  9. Human immunodeficiency virus{"\n"}HIV Type I & II
                </Text>
                <Text style={styles.c4}>{investigations.hivStatus || "Negative"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>2. Age / Date of birth</Text>
                <Text style={styles.c2}>
                  {personalInfo.age ? `${personalInfo.age} Yrs / ` : ""}
                  {formatDisplayDate(personalInfo.dateOfBirth) || personalInfo.dateOfBirth || "—"}
                </Text>
                <Text style={styles.c3}>10. Hepatitis B Virus status</Text>
                <Text style={styles.c4}>{investigations.hbsagStatus || "Negative"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>3. Marital status</Text>
                <Text style={styles.c2}>{personalInfo.maritalStatus}</Text>
                <Text style={styles.c3}>11. Hepatitis C Virus status</Text>
                <Text style={styles.c4}>{investigations.hepatitisCStatus || "Negative"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>4. Education of donor</Text>
                <Text style={styles.c2}>{personalInfo.education}</Text>
                <Text style={styles.c3}>12. VDRL</Text>
                <Text style={styles.c4}>{investigations.vdrl || "Negative"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>5. Occupation of donor</Text>
                <Text style={styles.c2}>{personalInfo.occupation}</Text>
                <Text style={styles.c3}>13. Medical history</Text>
                <Text style={styles.c4}>{medicalInfo.medicalHistory || "No"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>6. Religion</Text>
                <Text style={styles.c2}>{personalInfo.religion || "—"}</Text>
                <Text style={styles.c3}>
                  14. History of any abnormality in a{"\n"}child of the donor
                </Text>
                <Text style={styles.c4}>{medicalInfo.geneticDisorders || "No"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>7. Nationality</Text>
                <Text style={styles.c2}>{contactInfo.country || (personalInfo as any).nationality || "Indian"}</Text>
                <Text style={styles.c3}>
                  15. Family history from the medical{"\n"}point of view
                </Text>
                <Text style={styles.c4}>{medicalInfo.familyMedicalHistory || "No"}</Text>
              </View>
            </View>

            {/* ================= FEATURES ================= */}

            <Text style={styles.heading}>FEATURES:</Text>

            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.c1}>16. Height</Text>
                <Text style={[styles.c2, styles.bold]}>
                  {personalInfo.height}
                </Text>
                <Text style={styles.c3}>19. Colour of hair</Text>
                <Text style={[styles.c4, styles.bold]}>{personalInfo.hairColor || "—"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>17. Weight</Text>
                <Text style={[styles.c2, styles.bold]}>
                  {personalInfo.weight}
                </Text>
                <Text style={styles.c3}>20. Colour of eyes</Text>
                <Text style={[styles.c4, styles.bold]}>{personalInfo.eyeColor || "—"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.c1}>18. Colour of skin</Text>
                <Text style={[styles.c2, styles.bold]}>{personalInfo.complexion || "—"}</Text>
                <Text style={styles.c3}>21. Hobby</Text>
                <Text style={[styles.c4, styles.bold]}>{personalInfo.hobby || "—"}</Text>
              </View>
            </View>

            {/* ================= BULLETS ================= */}

            <View style={{ marginTop: 20, marginLeft: 22 }}>
              <View style={styles.listRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>
                  Donor are Non-Reactive for HIV I & II, HbsAg, HCV and VDRL
                </Text>
              </View>

              <View style={styles.listRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>Motility 70%-90%</Text>
              </View>

              <View style={styles.listRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>
                  Each vial contains 55-60 million Sperm
                </Text>
              </View>
            </View>

            {/* ================= THAWING ================= */}

            <Text style={styles.heading2}>Thawing Process:</Text>

            <View style={{ marginLeft: 26 }}>
              <View style={styles.listRow}>
                <Text style={styles.number}>1.</Text>
                <Text style={styles.listText}>
                  Incubate the Sample vial for 30-45 Mints at 37° C.
                </Text>
              </View>

              <View style={styles.listRow}>
                <Text style={styles.number}>2.</Text>
                <Text style={styles.listText}>
                  Gently Mix the Sample and take 1 Drop on Slide and analyses
                  the sample under Microscope.
                </Text>
              </View>

              <View style={styles.listRow}>
                <Text style={styles.number}>3.</Text>
                <Text style={styles.listText}>
                  Contact immediately for any problem with respect to the semen
                  sample
                </Text>
              </View>
            </View>

            <Text style={styles.footer}>
              *This is not Valid for Medico-legal purpose.
            </Text>
          </Page>

          {/* SPERM - PAGE 4b: CLINICAL INVESTIGATIONS */}
          <Page size="A4" style={styles.page}>
            <Text style={styles.title}>CLINICAL INVESTIGATIONS & PHYSICAL EXAM</Text>

            <Text style={{ fontSize: 10, fontFamily: "Times-Bold", marginBottom: 5 }}>
              LABORATORY DIAGNOSTICS:
            </Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.c1}>Hb (Hemoglobin)</Text>
                <Text style={styles.c2}>{investigations.hb}</Text>
                <Text style={styles.c3}>Total RBC Count</Text>
                <Text style={styles.c4}>{investigations.totalRbc}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.c1}>Total WBC Count</Text>
                <Text style={styles.c2}>{investigations.totalWbc}</Text>
                <Text style={styles.c3}>Differential WBC</Text>
                <Text style={styles.c4}>{investigations.differentialWbc}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.c1}>Platelet Count</Text>
                <Text style={styles.c2}>{investigations.plateletCount}</Text>
                <Text style={styles.c3}>Peripheral Smear</Text>
                <Text style={styles.c4}>{investigations.peripheralSmear}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.c1}>Random Blood Sugar</Text>
                <Text style={styles.c2}>{investigations.randomBloodSugar}</Text>
                <Text style={styles.c3}>Blood Urea/Creatinine</Text>
                <Text style={styles.c4}>{investigations.bloodUreaSerumCreatinine}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.c1}>SGPT</Text>
                <Text style={styles.c2}>{investigations.sgpt}</Text>
                <Text style={styles.c3}>Routine Urine Exam</Text>
                <Text style={styles.c4}>{investigations.routineUrine}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.c1}>Hemoglobin A2</Text>
                <Text style={styles.c2}>{investigations.hemoglobinA2}</Text>
                <Text style={styles.c3}>Other Specific Tests</Text>
                <Text style={styles.c4}>{investigations.otherSpecificTest}</Text>
              </View>
            </View>

            <Text style={{ fontSize: 10, fontFamily: "Times-Bold", marginTop: 15, marginBottom: 5 }}>
              DETAILED PHYSICAL EXAMINATION:
            </Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.c1}>Pulse</Text>
                <Text style={styles.c2}>{physicalExamination.pulse}</Text>
                <Text style={styles.c3}>Blood Pressure</Text>
                <Text style={styles.c4}>{physicalExamination.bloodPressure}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.c1}>Temperature</Text>
                <Text style={styles.c2}>{physicalExamination.temperature}</Text>
                <Text style={styles.c3}>Respiratory System</Text>
                <Text style={styles.c4}>{physicalExamination.respiratorySystem}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.c1}>Cardiovascular System</Text>
                <Text style={styles.c2}>{physicalExamination.cardiovascularSystem}</Text>
                <Text style={styles.c3}>Per Abdominal</Text>
                <Text style={styles.c4}>{physicalExamination.perAbdominal}</Text>
              </View>
            </View>
          </Page>

          <Page size="A4" style={styles.page}>
            <View
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 700, // or "100%" if appropriate
              }}
            >
              <Image
                src="/uploads/1785337185829-Gardenia_Fashion_Brand_Art_Design_Logo_(1).png"
                style={{
                  // width: 250,
                  height: 180,
                  objectFit: "contain",
                }}
              />

              <Image
                src="/uploads/1785337188140-Gardenia_Fashion_Brand_Art_Design_Logo_(1).png"
                style={{
                  // width: 250,
                  height: 180,
                  objectFit: "contain",
                }}
              />
            </View>
          </Page>
        </>
      )}

      {/* {showSection("affidavit") && <SectionSeparator title="Affidavit" />} */}
      {showSection("affidavit") && (
        <AffidavitPdf
          personalInfo={personalInfo}
          contactInfo={contactInfo}
          documents={documents}
          registrationDate={displayRegistrationDate}
        />
      )}


      {showAttachment("terms") && (
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

      {showAttachment("notes") && (
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
      {/* SPERM - FINAL PAGE: AADHAAR CARD (FRONT & BACK WITH SIGNATURE) */}
      {/* ========================================== */}
      {(documents?.aadhaarFront?.url || documents?.aadhaarBack?.url) && (
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
                  width: "100%",
                  height: documents?.aadhaarBack?.url ? 330 : 660,
                  objectFit: "contain",
                  marginBottom: documents?.aadhaarBack?.url ? 10 : 0,
                }}
              />
            )}

            {documents?.aadhaarBack?.url && (
              <Image
                src={documents.aadhaarBack.url}
                style={{
                  width: "100%",
                  height: documents?.aadhaarFront?.url ? 330 : 660,
                  objectFit: "contain",
                }}
              />
            )}
          </View>

          {/* Signature */}
          {documents?.signature?.url && (
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "flex-end",
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
        </Page>
      )}
    </Document>
  );
};

export { PrintableDonorRegistration as PrintableSpermRegistration };
export default PrintableDonorRegistration;
