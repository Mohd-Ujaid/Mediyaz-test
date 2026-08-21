/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { siteConfig } from "@/config/site.config";

interface DonorRegistrationPdfDocumentProps {
  registration: any;
  qrCodeUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 28,
    paddingBottom: 24,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.35,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#14b8a6",
    paddingBottom: 12,
    marginBottom: 12,
  },
  brand: {
    flex: 1,
    paddingRight: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 2,
  },
  brandMeta: {
    fontSize: 8,
    color: "#475569",
    marginBottom: 1,
  },
  qrBlock: {
    width: 76,
    alignItems: "center",
  },
  qrImage: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
  },
  qrFallback: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: 7,
  },
  qrLabel: {
    fontSize: 6.5,
    color: "#64748b",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 7.5,
    color: "#64748b",
  },
  badgeWrap: {
    alignItems: "flex-end",
  },
  badge: {
    fontSize: 8,
    fontWeight: 700,
    color: "#0f766e",
    backgroundColor: "#ccfbf1",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    marginBottom: 2,
  },
  regId: {
    fontSize: 7.5,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 0.8,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 3,
  },
  label: {
    width: "36%",
    fontSize: 8,
    color: "#64748b",
    fontWeight: 700,
    paddingRight: 8,
  },
  value: {
    flex: 1,
    fontSize: 8,
    color: "#0f172a",
  },
  twoColGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  halfCell: {
    width: "50%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  card: {
    borderWidth: 0.75,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#ffffff",
  },
  infoGrid: {
    flexDirection: "row",
    marginHorizontal: -4,
  },
  infoLeft: {
    width: "28%",
    paddingHorizontal: 4,
  },
  infoRight: {
    width: "72%",
    paddingHorizontal: 4,
  },
  photo: {
    width: 88,
    height: 112,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    objectFit: "cover",
  },
  photoFallback: {
    width: 88,
    height: 112,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    color: "#94a3b8",
    fontSize: 7.5,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  photoCaption: {
    marginTop: 4,
    fontSize: 6.5,
    color: "#94a3b8",
    textAlign: "center",
  },
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  checklistItem: {
    width: "25%",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  checklistBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
  },
  checklistLabel: {
    fontSize: 7.5,
    color: "#475569",
    paddingRight: 6,
    flex: 1,
  },
  checklistPresent: {
    fontSize: 7,
    color: "#0f766e",
    fontWeight: 700,
  },
  checklistMissing: {
    fontSize: 7,
    color: "#dc2626",
    fontWeight: 700,
  },
  signatures: {
    flexDirection: "row",
    marginTop: 12,
  },
  signatureCell: {
    width: "33.33%",
    paddingHorizontal: 6,
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    minHeight: 22,
    borderBottomWidth: 0.75,
    borderBottomColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    fontSize: 9,
    fontStyle: "italic",
  },
  signatureLabel: {
    marginTop: 4,
    fontSize: 6.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});

function fieldText(value: unknown, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function maskAadhaar(value?: string) {
  if (!value) return "—";
  return `XXXX-XXXX-${value.slice(-4)}`;
}

function InfoRow({ label, value }: { label: string; value: unknown }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{fieldText(value)}</Text>
    </View>
  );
}

function ChecklistItem({
  label,
  present,
}: {
  label: string;
  present: boolean;
}) {
  return (
    <View style={styles.checklistItem}>
      <View style={styles.checklistBox}>
        <Text style={styles.checklistLabel}>{label}</Text>
        <Text
          style={present ? styles.checklistPresent : styles.checklistMissing}
        >
          {present ? "VERIFIED" : "MISSING"}
        </Text>
      </View>
    </View>
  );
}

export function DonorRegistrationPdfDocument({
  registration,
  qrCodeUrl,
}: DonorRegistrationPdfDocumentProps) {
  const personalInfo = registration.personalInfo || {};
  const contactInfo = registration.contactInfo || {};
  const formatAddress = (addr = "", city = "", state = "", country = "", pin = "") => {
    if (!addr) return "Not Provided";
    const parts = [addr];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    if (pin) parts.push(pin);
    return parts.join(", ");
  };
  const medicalInfo = registration.medicalInfo || {};
  const donorInfo = registration.donorInfo || {};
  const labReports = registration.labReports || {};
  const documents = registration.documents || {};
  const emergencyContact = registration.emergencyContact || {};
  const consent = registration.consent || {};
  const isSperm = registration.donorType === "sperm";
  const generatedAt = registration.updatedAt
    ? new Date(registration.updatedAt).toLocaleString()
    : "—";

  return (
    <Document
      title={`Donor Registration ${fieldText(registration.registrationId)}`}
      author={siteConfig.name}
      subject="Donor registration record"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>{siteConfig.name}</Text>
            <Text style={styles.brandMeta}>
              ART Bank & Donor Registry Division
            </Text>
            <Text style={styles.brandMeta}>
              {siteConfig.contact.address.street},{" "}
              {siteConfig.contact.address.city},{" "}
              {siteConfig.contact.address.state}
            </Text>
            <Text style={styles.brandMeta}>
              Helpline: {siteConfig.contact.phone} | Emergency:{" "}
              {siteConfig.contact.emergencyHotline}
            </Text>
            <Text style={styles.brandMeta}>
              Clinical Desk: {siteConfig.contact.clinicalDeskEmail}
            </Text>
          </View>
          <View style={styles.qrBlock}>
            {qrCodeUrl ? (
              <Image src={qrCodeUrl} style={styles.qrImage} />
            ) : (
              <View style={styles.qrFallback}>
                <Text>QR Code</Text>
              </View>
            )}
            <Text style={styles.qrLabel}>Verify Registry</Text>
          </View>
        </View>

        <View style={styles.titleBar}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.title}>
              Uniform Donor Application Form (Registry Record)
            </Text>
            <Text style={styles.subtitle}>Generated on: {generatedAt}</Text>
          </View>
          <View style={styles.badgeWrap}>
            <Text style={styles.badge}>
              {isSperm ? "Sperm Donor" : "Egg Donor"}
            </Text>
            <Text style={styles.regId}>
              Reg ID: {fieldText(registration.registrationId)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity & Contact Summary</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoLeft}>
              {documents.passportPhoto?.url ? (
                <Image src={documents.passportPhoto.url} style={styles.photo} />
              ) : (
                <View style={styles.photoFallback}>
                  <Text>Passport</Text>
                  <Text>Photo</Text>
                  <Text>Missing</Text>
                </View>
              )}
              <Text style={styles.photoCaption}>
                Official passport size photo
              </Text>
            </View>
            <View style={styles.infoRight}>
              <InfoRow label="Full Name" value={personalInfo.fullName} />
              <InfoRow
                label="Father's / Mother's Name"
                value={`${fieldText(personalInfo.fatherName)} / ${fieldText(personalInfo.motherName)}`}
              />
              <InfoRow
                label="Gender / DOB / Age"
                value={`${fieldText(personalInfo.gender)} | ${fieldText(personalInfo.dateOfBirth)} | ${fieldText(personalInfo.age)} Years`}
              />
              <InfoRow label="Blood Group" value={personalInfo.bloodGroup} />
              <InfoRow
                label="Marital Status"
                value={fieldText(personalInfo.maritalStatus)}
              />
              <InfoRow
                label="Aadhaar (Masked) / PAN"
                value={`${maskAadhaar(personalInfo.aadhaarNumber)} | ${fieldText(personalInfo.panNumber)}`}
              />
              <InfoRow
                label="Education / Occupation"
                value={`${fieldText(personalInfo.education)} | ${fieldText(personalInfo.occupation)}`}
              />
              <InfoRow
                label="Phone / Email"
                value={`${fieldText(contactInfo.mobileNumber)} | ${fieldText(contactInfo.emailAddress)}`}
              />
              <InfoRow
                label="Current Address"
                value={formatAddress(contactInfo.currentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}
              />
              <InfoRow
                label="Permanent Address"
                value={formatAddress(contactInfo.permanentAddress, contactInfo.city, contactInfo.state, contactInfo.country, contactInfo.pincode)}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Emergency Contact & Medical Summary
          </Text>
          <View style={styles.twoColGrid}>
            <View style={styles.halfCell}>
              <View style={styles.card}>
                <InfoRow
                  label="Contact Person"
                  value={`${fieldText(emergencyContact.contactPersonName)} (${fieldText(emergencyContact.relationship)})`}
                />
                <InfoRow
                  label="Contact Phone"
                  value={emergencyContact.phoneNumber}
                />
                <InfoRow
                  label="Contact Address"
                  value={emergencyContact.address}
                />
              </View>
            </View>
            <View style={styles.halfCell}>
              <View style={styles.card}>
                <InfoRow label="Diabetes" value={medicalInfo.diabetes} />
                <InfoRow
                  label="Hypertension"
                  value={medicalInfo.hypertension}
                />
                <InfoRow label="Smoking" value={medicalInfo.smokingStatus} />
                <InfoRow
                  label="Alcohol"
                  value={medicalInfo.alcoholConsumption}
                />
                <InfoRow
                  label="Allergies"
                  value={medicalInfo.allergies || "None reported"}
                />
                <InfoRow
                  label="Medications"
                  value={medicalInfo.currentMedications || "None"}
                />
                <InfoRow
                  label="Medical History"
                  value={medicalInfo.medicalHistory || "Normal / No issues"}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isSperm ? "Sperm Donor Lab Profile" : "Egg Donor Clinical Profile"}
          </Text>
          <View style={styles.card}>
            {isSperm ? (
              <>
                <InfoRow
                  label="Abstinence Period"
                  value={donorInfo.abstinencePeriod || "Not recorded"}
                />
                <InfoRow
                  label="Previous Donations"
                  value={`${fieldText(donorInfo.previousDonationHistory)} (${fieldText(donorInfo.numberOfDonations, "0")} times)`}
                />
                <InfoRow
                  label="Semen Analysis Notes"
                  value={
                    donorInfo.semenAnalysis || "Awaiting laboratory profiling"
                  }
                />
              </>
            ) : (
              <>
                <InfoRow
                  label="Cycle Details"
                  value={donorInfo.menstrualCycleDetails || "Regular"}
                />
                <InfoRow
                  label="Previous Pregnancies"
                  value={donorInfo.pregnancyHistory || "None"}
                />
                <InfoRow
                  label="Previous Donative Cycles"
                  value={donorInfo.previousEggDonation}
                />
                <InfoRow
                  label="Antral Follicle Count"
                  value={donorInfo.ovarianReserve || "Not tested"}
                />
                <InfoRow
                  label="Hormonal Profile Notes"
                  value={donorInfo.hormonalTestDetails || "Normal"}
                />
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Identity & Lab Clearance Reports
          </Text>
          <View style={styles.checklistGrid}>
            <ChecklistItem
              label="Viral Markers"
              present={(labReports.viralMarkers || []).length > 0}
            />
            <ChecklistItem
              label="Blood Report"
              present={!!labReports.bloodReport}
            />
            <ChecklistItem
              label="Aadhaar Card"
              present={!!documents.aadhaarFront}
            />
            <ChecklistItem label="Photo" present={!!documents.passportPhoto} />
            <ChecklistItem label="Signature" present={!!documents.signature} />
            <ChecklistItem
              label="Other Document"
              present={!!documents.otherDocument}
            />
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureCell}>
            {documents.signature?.url ? (
              <Image
                src={documents.signature.url}
                style={{
                  width: 100,
                  height: 35,
                  objectFit: "contain",
                  alignSelf: "center",
                  marginBottom: 3,
                }}
              />
            ) : (
              <Text style={styles.signatureLine}>No Signature Provided</Text>
            )}
            <Text style={styles.signatureLabel}>Donor Signature</Text>
          </View>
          <View style={styles.signatureCell}>
            <Text style={styles.signatureLine}>Dr. Sarah D&apos;Souza</Text>
            <Text style={styles.signatureLabel}>Consulting Embryologist</Text>
          </View>
          <View style={styles.signatureCell}>
            <Text style={styles.signatureLine}>Mediyaz ART Bank Seal</Text>
            <Text style={styles.signatureLabel}>Registry Coordinator</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Mediyaz ART Bank / Donor Registry Division</Text>
          <Text>Uniform Donor Application Form</Text>
        </View>
      </Page>
    </Document>
  );
}
