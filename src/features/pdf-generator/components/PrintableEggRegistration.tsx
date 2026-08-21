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
import PrintableDonorRegistration from "./PrintableDonorRegistration";
import EggAffidavit from "./PrintableEggAffidavit";

const PdfImage = Image as unknown as React.ComponentType<any>;

Font.register({
  family: "NotoSansDevanagari",
  src: "/fonts/NotoSansDevanagari-Regular.ttf",
});

// Define PDF styles
const styles = StyleSheet.create({
  htext: {
    fontFamily: "NotoSansDevanagari",
    fontSize: 12,
  },
  page: {
    padding: 40,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
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
    marginBottom: 20,
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
  dynamicField: {
    fontFamily: "Times-Bold",
    textDecoration: "underline",
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
  densePage: {
    padding: 25,
    fontSize: 8,
    fontFamily: "Times-Roman",
  },

  denseTitle: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },

  sectionTitle: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "bold",
    marginVertical: 4,
    textDecoration: "underline",
  },

  denseTable: {
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 8,
  },

  denseRow: {
    flexDirection: "row",
  },

  cellLabel: {
    width: "32%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 3,
  },

  cellValue: {
    width: "18%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 3,
  },

  featureCell: {
    width: "25%",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 5,
    minHeight: 20,
  },

  footer: {
    marginTop: 6,
    fontWeight: "bold",
  },

  note: {
    marginTop: 3,
    fontSize: 7,
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

const PrintableEggRegistration = ({
  registration,
  qrCodeUrl,
  withHeader = false,
  attachments = [],
  sections,
  overrides = {},
  extraDocUrl,
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
    spermDonorInfo = {},
    eggDonorInfo = {},
    investigations = {},
    physicalExamination = {},
  } = mergedRegistration || {};

  const isSperm = donorType === "sperm" || !donorType;

  // Date Formatting
  const dateObj = consent.signatureDate
    ? new Date(consent.signatureDate)
    : new Date();
  const day = dateObj.getDate();
  const month = dateObj.toLocaleString("default", { month: "long" });
  const year = dateObj.getFullYear();
  const numericMonth = String(dateObj.getMonth() + 1).padStart(2, "0");

  const formatAddress = (addr = "", city = "", state = "", country = "", pin = "") => {
    if (!addr) return "";
    const parts = [addr];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    if (pin) parts.push(pin);
    return parts.join(", ");
  };

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
      {qrCodeUrl && (
        <PdfImage
          style={styles.qrCode}
          src={qrCodeUrl}
          alt="QR code for donor registration"
        />
      )}
    </View>
  );

  const DField = (value: any, fallback = "__________") => (
    <Text style={styles.dynamicField}> {value || fallback} </Text>
  );
  return (
    <Document title={`Donor_Registration_${registrationId || "Draft"}`}>
      {/* ========================================== */}
      {/* EGG - PAGE 1: REGISTRATION FORM */}
      {/* ========================================== */}
      <Page size="A4" style={styles.page}>
        {withHeader && (
          <>
            <Image
              src={"/images/letterheaad3.png"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "600",
                height: "910",
              }}
              fixed
            />
            {qrCodeUrl ? (
              <Image
                src={qrCodeUrl}
                style={{
                  position: "absolute",
                  top: 30,
                  right: 40,
                  width: 45,
                  height: 45,
                }}
              />
            ) : null}
            <View
              style={{
                position: "absolute",
                top: 30,
                left: 40,
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
        {/* {renderHeader(1)} */}
        <Text style={styles.title}>REGISTRATION FORM FoR OOCYTE DONOR</Text>

        <View style={styles.row}>
          <Text style={styles.bold}>
            Registration Date: {DField(consent.signatureDate)}
          </Text>
          <Text style={styles.bold}>File Number: {DField("[System Gen]")}</Text>
          <Text style={styles.bold}>
            DONOR ID: {DField(registrationId || "MAB/OD/___")}
          </Text>
        </View>

        <View style={[styles.row, { justifyContent: "flex-start" }]}>
          <Text style={[styles.bold, { marginRight: 20 }]}>
            ART Clinic: {DField("FertiJoy IVF & Fertility")}
          </Text>
          <Text style={styles.bold}>Dr. {DField("Ramya Mishra")}</Text>
        </View>

        <Text style={[styles.text, { marginTop: 10 }]}>
          I, {DField(personalInfo.fullName)} W/O{" "}
          {DField(personalInfo.spouseName || "______________")}, House no.{" "}
          {DField(formatAddress(contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode))} and Aadhar No{" "}
          {DField(personalInfo.aadhaarNumber)} date of birth{" "}
          {DField(personalInfo.dateOfBirth)} and Mobile no{" "}
          {DField(contactInfo.mobileNumber)}, is willing to donate my oocyte to
          needy couple/woman and agree to abide by following terms.
        </Text>

        <View style={styles.list}>
          {[
            "My date of birth age as on today is more than twenty-three years and less than thirty-five years.",
            "I agree that I am registering for donating my oocyte for non-commercial purpose and for the purposes of assisted reproductive technology services arising due to infertility, disease and/or social and medical concerns.",
            "I agree that I am willing to undergo pathology tests which are required to be done under the provisions of the Assisted Reproductive Technology (Regulation) Act, 2021 and Rules made thereunder.",
            "I confirm that at this stage and to the best of my knowledge I am not suffering from any known infectious diseases or genetic disorders.",
            "I agree that I will donate my oocyte to the needy couple/woman and go to the ART Clinic whenever informed by ART Bank namely (MEDIYAZ ART BANK) in the event my oocyte is collected/retrieved and preserved, same may be used for the purposes specified in the Assisted Reproductive Technology (Regulation) Act, 2021.",
            "I agree and affirm that I will not try to know the identity of recipient and disclose the same to any person in the event the identity of recipient is come within my knowledge as per law.",
            "I undertake and confirm that I am registering myself for donating my oocyte with ART Bank namely (MEDIYAZ ART BANK) for the first time and have not registered with any other ART Bank before.",
            "I confirm and verify that the above-mentioned facts are true and correct to the best of my knowledge.",
          ].map((text, idx) => (
            <View style={styles.listItem} key={idx}>
              <Text style={styles.listBullet}>{idx + 1}.</Text>
              <Text style={styles.listText}>{text}</Text>
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

      {/* ========================================== */}
      {/* EGG - PAGE 2: CONTRACT */}
      {/* ========================================== */}
      <Page size="A4" style={styles.page}>
        {/* {renderHeader(2)} */}
        <Text style={styles.title}>
          Contract between the ART bank and the Oocyte Donor
        </Text>

        <Text style={styles.text}>
          The ART bank and the Donor agree to come into this contract today on
          the {DField(day)} {DField(numericMonth)} month, {DField(year)} as per
          the following conditions.
        </Text>

        <Text style={styles.text}>
          <Text style={styles.bold}>First Part</Text> being (MEDIYAZ ART BANK)
          having its office at 366/4, Govindpuri Kalka ji new Delhi 110019, and
          the registered office at 366/4, Govindpuri Kalka ji new Delhi 110019,
          herein referred to as the ART Bank.
        </Text>

        <Text style={[styles.bold, { textAlign: "center", marginBottom: 10 }]}>
          And
        </Text>

        <Text style={styles.text}>
          <Text style={styles.bold}>Second Part</Text> I{" "}
          {DField(personalInfo.fullName)} W/O{" "}
          {DField(personalInfo.spouseName || "______________")}, House no.{" "}
          {DField(formatAddress(contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode))} and Aadhar No{" "}
          {DField(personalInfo.aadhaarNumber)} date of birth{" "}
          {DField(personalInfo.dateOfBirth)} and Mobile no{" "}
          {DField(contactInfo.mobileNumber)}, herein referred to as the Donor.
        </Text>

        <Text style={[styles.bold, { textAlign: "center", marginBottom: 10 }]}>
          Whereas
        </Text>

        <View style={styles.list}>
          {[
            "The first part is ART bank that is established, amongst other purposes, to collect, screen and supply oocyte donor to ART clinics for use in ART procedures.",
            "The second part is an individual who has willingly agreed to donate her oocytes to the ART clinic against a consideration for the same.",
            "That the ART Bank and the Donor have, therefore, come to form this contract to facilitate the process with the laid down terms and conditions.",
          ].map((text, idx) => (
            <View style={styles.listItem} key={idx}>
              <Text style={styles.listBullet}>{idx + 1}.</Text>
              <Text style={styles.listText}>{text}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.bold, { marginTop: 10, marginBottom: 10 }]}>
          NOW THIS INDENTURE WITNESSETH THAT:
        </Text>

        <View style={styles.list}>
          {[
            "The ART Bank agrees to screen and select oocyte donors and to supply them to ART clinics desiring of oocyte donors as per the rules laid down in the ART (Regulation) Act.2021",
            "The Donor agrees to disclose the true facts of herself and not to suppress any personal details to the Bank, including family history, genetic background, criminal background, religion, etc.",
            "The Donor agrees to relinquish all parental rights over the child, which may be conceived from his gamete.",
            "The Donor, agrees to take consent of her husband before donating her oocytes and also produce the same before the ART bank at the time of signing this agreement.",
            "The ART Bank agrees to inform the Donor about all the tests that would be necessary for the safety and protection of the ART procedure.",
            "The Donor agrees to be assigned to ART clinic as directed by the ART Bank for the purposes of undergoing oocyte donation.",
            "The Donor agrees to undergo ovarian stimulation by taking regular medication as directed by the ART clinic and come regularly for follow up as directed.",
            "The donor has been adequately information by the ART Bank about the procedure and its potential complications.",
            "The Donor agrees not to discontinue treatment midway except on medical Advice of the ART clinic.",
          ].map((text, idx) => (
            <View style={styles.listItem} key={idx}>
              <Text style={styles.listBullet}>{idx + 1}.</Text>
              <Text style={styles.listText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.signatureBlock, { marginTop: 30 }]}>
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

      {/* ========================================== */}
      {/* EGG - PAGE 3: INFORMATION FORM */}
      {/* ========================================== */}
      <Page size="A4" style={styles.densePage}>
        <Text style={styles.denseTitle}>INFORMATION FORM FOR OOCYTE DONOR</Text>

        <Text style={styles.sectionTitle}>BASIC INFORMATION & HISTORY:</Text>

        {/* Main Table */}
        <View style={styles.denseTable}>
          {/* Row 1 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>Donor Name</Text>
            <Text style={styles.cellValue}>{personalInfo.fullName}</Text>
            <Text style={styles.cellLabel}>HISTORY:</Text>
            <Text style={styles.cellValue}></Text>
          </View>

          {/* Row 2 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>Donor ID</Text>
            <Text style={styles.cellValue}>{registrationId}</Text>
            <Text style={styles.cellLabel}>9. Obstetric History</Text>
            <Text style={styles.cellValue}>{eggDonorInfo.obstetricHistory || "No"}</Text>
          </View>

          {/* Row 3 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>1. Identification number (Donor)</Text>
            <Text style={styles.cellValue}>{personalInfo.aadhaarNumber}</Text>
            <Text style={styles.cellLabel}>a. Number of deliveries</Text>
            <Text style={styles.cellValue}>{eggDonorInfo.numberOfDeliveries || "0"}</Text>
          </View>

          {/* Row 4 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>2. Age / Date of birth</Text>
            <Text style={styles.cellValue}>{personalInfo.dateOfBirth}</Text>
            <Text style={styles.cellLabel}>b. Number of abortions</Text>
            <Text style={styles.cellValue}>{eggDonorInfo.numberOfAbortions || "0"}</Text>
          </View>

          {/* Row 5 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>3. Marital status</Text>
            <Text style={styles.cellValue}>{personalInfo.maritalStatus}</Text>
            <Text style={styles.cellLabel}>c. Other points of note</Text>
            <Text style={styles.cellValue}>{eggDonorInfo.otherPointsOfNote || "No"}</Text>
          </View>

          {/* Row 6 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>4. Education of donor</Text>
            <Text style={styles.cellValue}>{personalInfo.education}</Text>
            <Text style={styles.cellLabel}>10. Menstrual history</Text>
            <Text style={styles.cellValue}>{eggDonorInfo.menstrualCycleDetails || "Regular"}</Text>
          </View>

          {/* Row 7 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>5. Education of spouse</Text>
            <Text style={styles.cellValue}>{personalInfo.spouseEducation || "N/A"}</Text>
            <Text style={styles.cellLabel}>11. History of contraceptives</Text>
            <Text style={styles.cellValue}>{eggDonorInfo.contraceptiveHistory || "No"}</Text>
          </View>

          {/* Row 8 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>6. Occupation of donor</Text>
            <Text style={styles.cellValue}>{personalInfo.occupation}</Text>
            <Text style={styles.cellLabel}>12. Medical history</Text>
            <Text style={styles.cellValue}>{medicalInfo.medicalHistory || "No"}</Text>
          </View>

          {/* Row 9 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>7. Occupation of spouse</Text>
            <Text style={styles.cellValue}>{personalInfo.spouseOccupation || "N/A"}</Text>
            <Text style={styles.cellLabel}>13. Family history (medical)</Text>
            <Text style={styles.cellValue}>{medicalInfo.familyMedicalHistory || "No"}</Text>
          </View>

          {/* Row 10 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>6. Monthly income</Text>
            <Text style={styles.cellValue}>{personalInfo.monthlyIncome || "N/A"}</Text>
            <Text style={styles.cellLabel}>14. Abnormality in a child</Text>
            <Text style={styles.cellValue}>{medicalInfo.geneticDisorders || "No"}</Text>
          </View>

          {/* Row 11 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>7. Religion</Text>
            <Text style={styles.cellValue}>{personalInfo.religion}</Text>
            <Text style={styles.cellLabel}>15. History of blood transfusion</Text>
            <Text style={styles.cellValue}>{eggDonorInfo.bloodTransfusionHistory || "No"}</Text>
          </View>

          {/* Row 12 */}
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>8. Nationality</Text>
            <Text style={styles.cellValue}>Indian</Text>
            <Text style={styles.cellLabel}>16. History of substance abuse</Text>
            <Text style={styles.cellValue}>{eggDonorInfo.substanceAbuseHistory || "No"}</Text>
          </View>
        </View>

        {/* FEATURES */}
        <Text style={styles.sectionTitle}>FEATURES:</Text>

        <View style={styles.denseTable}>
          <View style={styles.denseRow}>
            <Text style={styles.featureCell}>17. Height</Text>
            <Text style={styles.featureCell}>{personalInfo.height}</Text>
            <Text style={styles.featureCell}>20. Colour of hair</Text>
            <Text style={styles.featureCell}>{personalInfo.hairColor}</Text>
          </View>

          <View style={styles.denseRow}>
            <Text style={styles.featureCell}>18. Weight</Text>
            <Text style={styles.featureCell}>{personalInfo.weight}</Text>
            <Text style={styles.featureCell}>21. Colour of eyes</Text>
            <Text style={styles.featureCell}>{personalInfo.eyeColor}</Text>
          </View>

          <View style={styles.denseRow}>
            <Text style={styles.featureCell}>19. Colour of skin</Text>
            <Text style={styles.featureCell}>{personalInfo.complexion}</Text>
            <Text style={styles.featureCell}></Text>
            <Text style={styles.featureCell}></Text>
          </View>
        </View>

        {/* INVESTIGATION */}
        <Text style={styles.sectionTitle}>
          INVESTIGATIONS : TO BE FILLED BY RESPECTIVE INVESTIGATOR
        </Text>

        <View style={styles.denseTable}>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>22. Blood group and Rh status</Text>
            <Text style={styles.cellValue}>{personalInfo.bloodGroup}</Text>
            <Text style={styles.cellLabel}>25. Blood urea / Serum creatinine</Text>
            <Text style={styles.cellValue}>{investigations.bloodUreaSerumCreatinine}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>23. Complete blood picture - Hb</Text>
            <Text style={styles.cellValue}>{investigations.hb}</Text>
            <Text style={styles.cellLabel}>26. SGPT</Text>
            <Text style={styles.cellValue}>{investigations.sgpt}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>b. Total RBC count</Text>
            <Text style={styles.cellValue}>{investigations.totalRbc}</Text>
            <Text style={styles.cellLabel}>27. Routine urine examination</Text>
            <Text style={styles.cellValue}>{investigations.routineUrine}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>c. Total WBC count</Text>
            <Text style={styles.cellValue}>{investigations.totalWbc}</Text>
            <Text style={styles.cellLabel}>28. HBsAg status</Text>
            <Text style={styles.cellValue}>{investigations.hbsagStatus}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>d. Differential WBC count</Text>
            <Text style={styles.cellValue}>{investigations.differentialWbc}</Text>
            <Text style={styles.cellLabel}>29. Hepatitis C status</Text>
            <Text style={styles.cellValue}>{investigations.hepatitisCStatus}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>e. Platelet count</Text>
            <Text style={styles.cellValue}>{investigations.plateletCount}</Text>
            <Text style={styles.cellLabel}>30. HIV status (with dates)</Text>
            <Text style={styles.cellValue}>{investigations.hivStatus}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>f. Peripheral smear</Text>
            <Text style={styles.cellValue}>{investigations.peripheralSmear}</Text>
            <Text style={styles.cellLabel}>31. Hemoglobin A2 status</Text>
            <Text style={styles.cellValue}>{investigations.hemoglobinA2}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>24. Random blood sugar</Text>
            <Text style={styles.cellValue}>{investigations.randomBloodSugar}</Text>
            <Text style={styles.cellLabel}>32. Any other specific test</Text>
            <Text style={styles.cellValue}>{investigations.otherSpecificTest}</Text>
          </View>
        </View>

        {/* DETAILED PHYSICAL EXAMINATION */}
        <Text style={styles.sectionTitle}>DETAILED PHYSICAL EXAMINATION:</Text>

        <View style={styles.denseTable}>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>33. Pulse</Text>
            <Text style={styles.cellValue}>{physicalExamination.pulse}</Text>
            <Text style={styles.cellLabel}>36. Respiratory system</Text>
            <Text style={styles.cellValue}>{physicalExamination.respiratorySystem}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>34. Blood pressure</Text>
            <Text style={styles.cellValue}>{physicalExamination.bloodPressure}</Text>
            <Text style={styles.cellLabel}>37. Cardiovascular system</Text>
            <Text style={styles.cellValue}>{physicalExamination.cardiovascularSystem}</Text>
          </View>
          <View style={styles.denseRow}>
            <Text style={styles.cellLabel}>35. Temperature</Text>
            <Text style={styles.cellValue}>{physicalExamination.temperature}</Text>
            <Text style={styles.cellLabel}>38. Per abdominal examination</Text>
            <Text style={styles.cellValue}>{physicalExamination.perAbdominal}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Footnotes:</Text>
        <Text style={styles.note}>
          (1) To be carried out within 15 days prior to oocyte donation
        </Text>
        <Text style={styles.note}>
          (2) Any additional test carried out on the basis of the history and examination of donor
        </Text>
      </Page>

      {/* ========================================== */}
      {/* EGG - PAGE 4: FORM 14 A & CERTIFICATE */}
      {/* ========================================== */}
      <Page size="A4" style={styles.page}>
        {/* {renderHeader(4)} */}

        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Text style={{ fontSize: 10 }}>[See rule 13 (2) (i)]</Text>
          <Text style={styles.title}>FORM 14 A</Text>
          <Text style={styles.subtitle}>For Oocyte Donors</Text>
          <Text style={styles.text}>
            Passport / ID no. {personalInfo.aadhaarNumber} (For donors recruited
            and screened by the ART bank)
          </Text>
        </View>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { flex: 2 }]}>
              <Text>ART Bank Name</Text>
            </View>
            <View
              style={[styles.tableColHeader, { flex: 2, borderRightWidth: 0 }]}
            >
              <Text>Registration No</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { flex: 2 }]}>
              <Text>MEDIYAZ ART BANK</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColLast, { flex: 2 }]}>
              <Text>DL/AB/2022/10605/AB/SEB/21</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text>Donor ID</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text>Recruit Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text>Recruiter Name</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text>Signature</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text>Supply Date</Text>
            </View>
            <View style={[styles.tableColHeader, styles.tableColLast]}>
              <Text>ART Clinic</Text>
            </View>
          </View>
          <View
            style={[
              styles.tableRow,
              { borderBottomWidth: 0, height: 40, alignItems: "center" },
            ]}
          >
            <View style={styles.tableCol}>
              <Text>{registrationId || "MAB/OD/___"}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>{consent.signatureDate}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>Imtiyaz Shaikh</Text>
            </View>
            <View style={styles.tableCol}>
              <Text></Text>
            </View>
            <View style={styles.tableCol}>
              <Text></Text>
            </View>
            <View style={[styles.tableCol, styles.tableColLast]}>
              <Text>FertiJoy IVF</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 40 }}>
          <Text
            style={[styles.bold, { textAlign: "center", marginBottom: 15 }]}
          >
            CERTIFICATE IN TERM OF RULE 10 OF THE ASSISTED REPRODUCTIVE
            TECHNOLOGY RULES, 2022
          </Text>

          <Text style={styles.text}>
            We hereby certify that Mrs, {DField(personalInfo.fullName)}{" "}
            registered Oocyte donor of (MEDIYAZ ART BANK (ART Bank Registration
            No. DL/AB/2022/10605/AB/SEB/21) Donor registration No.{" "}
            {DField(registrationId || "MAB/OD/___")} and her Records have been
            duly maintained in accordance with the assisted reproductive
            technology rules 2022.
          </Text>
          <Text style={styles.text}>
            We further certify that the said oocyte donor has been screened and
            tested for the following communicable diseases and has been found to
            be negative.
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

          <View style={{ marginTop: 30 }}>
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
        </View>
      </Page>

      <EggAffidavit 
        consent={consent}
        donor={{
          name: personalInfo.fullName,
          husbandName: personalInfo.spouseName,
          houseNo: "", 
          address: contactInfo.currentAddress,
          pincode: contactInfo.pincode,
          aadhaar: personalInfo.aadhaarNumber,
          dob: personalInfo.dateOfBirth,
          mobile: contactInfo.mobileNumber,
          verificationDate: `${day} ${month} ${year}`,
        }} 
        documents={documents} 
      />

      {attachments?.includes("stamp") && (
        <Page size="A4" style={styles.page}>
          {withHeader && (
            <Image
              src="/images/letterheaad3.png"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 600,
                height: 910,
              }}
              fixed
            />
          )}
          <View
            style={{
              marginTop: 40,
              borderWidth: 2,
              borderColor: "#008080",
              padding: 25,
              borderRadius: 10,
            }}
          >
            <Text
              style={[
                styles.title,
                { fontSize: 16, textDecoration: "none", color: "#006666" },
              ]}
            >
              OFFICIAL STAMP & CERTIFICATE SEAL
            </Text>
            <Text style={[styles.text, { marginTop: 20, textAlign: "center" }]}>
              This is to certify that this electronic dossier contains the
              verified registration records for the candidate{" "}
              {personalInfo.fullName || "N/A"}.
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 100,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 9 }}>[ PLACE SEAL HERE ]</Text>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: "#777",
                    marginTop: 10,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 8, color: "#888" }}>
                    OFFICIAL SEAL
                  </Text>
                </View>
              </View>
              <View
                style={{ alignItems: "center", justifyContent: "flex-end" }}
              >
                <Text
                  style={{
                    borderBottomWidth: 1,
                    borderColor: "#000",
                    width: 120,
                    textAlign: "center",
                  }}
                ></Text>
                <Text
                  style={{
                    fontSize: 9,
                    marginTop: 5,
                    fontFamily: "Times-Bold",
                  }}
                >
                  Authorized Signatory
                </Text>
                <Text style={{ fontSize: 8, color: "#555" }}>
                  Mediyaz ART Bank Director
                </Text>
              </View>
            </View>
          </View>
        </Page>
      )}

      {attachments?.includes("certificate") && (
        <Page size="A4" style={styles.page}>
          {withHeader && (
            <Image
              src="/images/letterheaad3.png"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 600,
                height: 910,
              }}
              fixed
            />
          )}
          <View
            style={{
              marginTop: 20,
              borderWidth: 4,
              borderStyle: "solid",
              borderColor: "#006666",
              padding: 30,
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontFamily: "Times-Bold",
                color: "#006666",
                marginTop: 20,
              }}
            >
              CERTIFICATE OF REGISTRATION
            </Text>
            <Text style={{ fontSize: 10, color: "#777", marginTop: 5 }}>
              Issued in accordance with Assisted Reproductive Technology Rules,
              2022
            </Text>

            <Text style={{ fontSize: 12, marginTop: 40, lineHeight: 1.8 }}>
              This is to officially certify that the gamete donor application
              filed by
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Times-Bold",
                color: "#003333",
                marginTop: 10,
                textDecoration: "underline",
              }}
            >
              {personalInfo.fullName || "N/A"}
            </Text>
            <Text style={{ fontSize: 12, marginTop: 10 }}>
              has been thoroughly screened, clinically evaluated, and officially
              registered in the
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Times-Bold",
                color: "#005555",
                marginTop: 5,
              }}
            >
              Mediyaz National Donor Registry Program
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: 80,
                fontSize: 10,
              }}
            >
              <View>
                <Text style={{ fontFamily: "Times-Bold" }}>Registry ID:</Text>
                <Text style={{ color: "#444" }}>{registrationId || "N/A"}</Text>
              </View>
              <View>
                <Text style={{ fontFamily: "Times-Bold" }}>Issue Date:</Text>
                <Text style={{ color: "#444" }}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 60, alignItems: "center" }}>
              <Text
                style={{
                  borderBottomWidth: 1,
                  borderColor: "#000",
                  width: 150,
                  textAlign: "center",
                }}
              ></Text>
              <Text
                style={{ fontSize: 9, marginTop: 5, fontFamily: "Times-Bold" }}
              >
                Registrar, Mediyaz ART Bank
              </Text>
            </View>
          </View>
        </Page>
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
                height: 910,
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
                height: 910,
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
    </Document>
  );
};

export default PrintableEggRegistration;
