/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document,
  Image,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { siteConfig } from "@/config/site.config";
import { registryPdfStyles as styles } from "../../shared/pdf-styles";
import {
  fieldText,
  maskAadhaar,
  formatAddress,
  formatTimestamp,
} from "../../shared/pdf-utils";
import { EggPdfDocumentProps } from "../types";

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

export function EggDonorRegistrationPdfDocument({
  registration,
}: EggPdfDocumentProps) {
  const personalInfo = registration.personalInfo || {};
  const contactInfo = registration.contactInfo || {};
  const medicalInfo = registration.medicalInfo || {};
  const donorInfo = registration.donorInfo || {};
  const labReports = registration.labReports || {};
  const documents = registration.documents || {};
  const emergencyContact = registration.emergencyContact || {};
  const generatedAt = formatTimestamp(registration.updatedAt);

  return (
    <Document
      title={`Egg Donor Registration ${fieldText(registration.registrationId)}`}
      author={siteConfig.name}
      subject="Egg Donor registration record"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>{siteConfig.name}</Text>
            <Text style={styles.brandMeta}>
              ART Bank & Oocyte Cryobank Division
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
        </View>

        {/* Title Bar */}
        <View style={styles.titleBar}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.title}>
              Egg Donor Registry Record (Uniform Application Form)
            </Text>
            <Text style={styles.subtitle}>Generated on: {generatedAt}</Text>
          </View>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeEgg}>Egg Donor (Oocyte)</Text>
            <Text style={styles.regId}>
              Reg ID: {fieldText(registration.registrationId)}
            </Text>
          </View>
        </View>

        {/* Section 1: Identity & Contact Summary */}
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
                Official passport photo
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
                value={`${fieldText(personalInfo.gender, "Female")} | ${fieldText(personalInfo.dateOfBirth)} | ${fieldText(personalInfo.age)} Years`}
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
                value={formatAddress(
                  contactInfo.currentAddress,
                  contactInfo.city,
                  contactInfo.state,
                  contactInfo.country,
                  contactInfo.pincode
                )}
              />
              <InfoRow
                label="Permanent Address"
                value={formatAddress(
                  contactInfo.permanentAddress,
                  contactInfo.city,
                  contactInfo.state,
                  contactInfo.country,
                  contactInfo.pincode
                )}
              />
            </View>
          </View>
        </View>

        {/* Section 2: Emergency Contact & General Medical Summary */}
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

        {/* Section 3: Dedicated Egg Donor Clinical & Ovarian Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Egg Donor Clinical & Ovarian Reserve Profile
          </Text>
          <View style={styles.card}>
            <InfoRow
              label="Menstrual Cycle Details"
              value={donorInfo.menstrualCycleDetails || "Regular"}
            />
            <InfoRow
              label="Previous Pregnancies / Parity"
              value={donorInfo.pregnancyHistory || "None"}
            />
            <InfoRow
              label="Previous Donative Cycles"
              value={donorInfo.previousEggDonation || "None recorded"}
            />
            <InfoRow
              label="Antral Follicle Count (AFC)"
              value={donorInfo.ovarianReserve || "Not tested"}
            />
            <InfoRow
              label="Hormonal Profile (AMH/FSH/LH)"
              value={donorInfo.hormonalTestDetails || "Normal"}
            />
          </View>
        </View>

        {/* Section 4: Identity & Lab Clearance Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Identity & Lab Clearance Verification
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
              label="Form 13 / Insurance"
              present={!!documents.form13 || !!documents.otherDocument}
            />
          </View>
        </View>

        {/* Signatures */}
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
            <Text style={styles.signatureLabel}>Egg Donor Signature</Text>
          </View>
          <View style={styles.signatureCell}>
            <Text style={styles.signatureLine}>Dr. Sarah D&apos;Souza</Text>
            <Text style={styles.signatureLabel}>Consulting Gynecologist / Embryologist</Text>
          </View>
          <View style={styles.signatureCell}>
            <Text style={styles.signatureLine}>Mediyaz ART Bank Seal</Text>
            <Text style={styles.signatureLabel}>Registry Coordinator</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Mediyaz ART Bank / Oocyte Cryobank Division</Text>
          <Text>Egg Donor Registry Record</Text>
        </View>
      </Page>
    </Document>
  );
}

export default EggDonorRegistrationPdfDocument;
