/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 13.5,
    fontFamily: "Times-Roman",
    lineHeight: 1.35,
    color: "#000",
  },

  title: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    marginBottom: 16,
    textDecoration: "underline",
    letterSpacing: 0.5,
  },

  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
    fontSize: 13.5,
    lineHeight: 1.35,
  },

  bold: {
    fontFamily: "Times-Bold",
    fontWeight: "bold",
  },

  row: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },

  number: {
    width: 22,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    fontSize: 13.5,
  },

  content: {
    flex: 1,
    textAlign: "justify",
    fontSize: 13.5,
    lineHeight: 1.35,
  },

  deponentLabel: {
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },

  verification: {
    marginTop: 6,
    borderTopWidth: 0.8,
    borderColor: "#333",
    paddingTop: 8,
    marginBottom: 12,
  },

  verificationTitle: {
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  pageNumber: {
    position: "absolute",
    bottom: 18,
    right: 40,
    fontSize: 10,
    color: "#777",
  },
});

interface SpermAffidavitProps {
  personalInfo?: any;
  contactInfo?: any;
  documents?: any;
  registrationDate?: string;
}

export const PrintableSpermAffidavit = ({
  personalInfo = {},
  contactInfo = {},
  documents = {},
  registrationDate = "",
}: SpermAffidavitProps) => {
  const formatAddress = (addr = "", city = "", state = "", country = "", pin = "") => {
    if (!addr) return "";
    const parts = [addr];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    if (pin) parts.push(pin);
    return parts.join(", ");
  };

  const addressStr = formatAddress(
    contactInfo.currentAddress,
    contactInfo.city,
    contactInfo.state,
    contactInfo.country,
    contactInfo.pincode
  );

  const signatureUrl = documents?.signature?.url;

  return (
    <>
      {/* ========================================== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>AFFIDAVIT</Text>

        <Text style={styles.paragraph}>
          I, Mr <Text style={styles.bold}>{personalInfo.fullName || "__________"}</Text>
          {personalInfo.age ? ` age ${personalInfo.age} years` : ""}, R/o{" "}
          <Text style={styles.bold}>{addressStr || "__________"}</Text>; having Aadhar Card No.{" "}
          <Text style={styles.bold}>{personalInfo.aadhaarNumber || "__________"}</Text> and date of birth{" "}
          <Text style={styles.bold}>{personalInfo.dateOfBirth || "__________"}</Text> do hereby solemn depose as
          under:
        </Text>

        <View style={styles.row}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.content}>
            That I am giving this affidavit according to the requirement of ART
            law for the purpose of an authorization of the artificial
            insemination of sperm.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.content}>
            I have donated my sperm for the purpose of authorization of the
            artificial insemination with my sperm. I have agreed to donate my
            sperm at my own free will and understanding the legal, medical
            procedures and their associated obligations involved.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.content}>
            I have been counselled by Counsellor{" "}
            <Text style={styles.bold}>Dr. Md Sanaul Haque Hashmi</Text> of ART
            Bank Mediyaz Art Bank Address 366/4, Govindpuri Kalkaji in new Delhi
            110019 having Registration No. DL/AB/2022/10605/AB/SEB/21.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>4.</Text>
          <Text style={styles.content}>
            I understand that there will be no direct or indirect contact between
            the recipient/Intended Parents and my personal identity will not be
            disclosed to the recipient or to the child born through the use of my
            sperm apart from being directed by a court of law.
          </Text>
        </View>

        {/* Page 1 Bottom: Clean Deponent Signature with open space for physical Notary Stamps */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            marginTop: 40,
            paddingTop: 10,
          }}
        >
          <View style={{ alignItems: "flex-end" }}>
            {signatureUrl ? (
              <Image
                src={signatureUrl}
                cache={false}
                style={{
                  width: 100,
                  height: 35,
                  objectFit: "contain",
                  marginBottom: 3,
                }}
              />
            ) : (
              <View style={{ height: 30 }} />
            )}
            <Text style={styles.deponentLabel}>DEPONENT</Text>
          </View>
        </View>
      </Page>

      {/* ========================================== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <Text style={styles.number}>5.</Text>
          <Text style={styles.content}>
            I have not been allured by any person from the ART clinic or ART Bank
            for sperm donation.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>6.</Text>
          <Text style={styles.content}>
            I undertake that since commencement of Assisted Reproductive
            Technology (Regulation) 2021 I have not donated my sperm and this is
            the first time in my life I donated my sperm.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>7.</Text>
          <Text style={styles.content}>
            I agree to disclose the true facts of myself and not to suppress any
            details to the bank, including family history, genetic background,
            religion etc. The bank agrees to keep all the information of the
            donor confidential. If any information is suppressed by the donor and
            causes any damage in the ART procedure then the bank will not be
            responsible for it but only the donor will be responsible and
            punishable under the provisions of law.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>8.</Text>
          <Text style={styles.content}>
            That the contents of this affidavit have been read over and explained
            to me and I have fully understood the same and nothing material has
            been concealed by me.
          </Text>
        </View>

        {/* Deponent Signature for Undertaking */}
        <View style={{ alignItems: "flex-end", marginTop: 8, marginBottom: 16 }}>
          {signatureUrl ? (
            <Image
              src={signatureUrl}
              cache={false}
              style={{
                width: 95,
                height: 32,
                objectFit: "contain",
                marginBottom: 3,
              }}
            />
          ) : (
            <View style={{ height: 26 }} />
          )}
          <Text style={styles.deponentLabel}>DEPONENT</Text>
        </View>

        {/* Verification Section */}
        <View style={styles.verification}>
          <Text style={styles.verificationTitle}>VERIFICATION</Text>

          <Text style={styles.paragraph}>
            Verified at <Text style={styles.bold}>{contactInfo.city || "New Delhi"}</Text> on the{" "}
            <Text style={styles.bold}>{registrationDate || new Date().toLocaleDateString("en-IN")}</Text> that the contents
            of the affidavit are true and correct to the best of my knowledge and
            nothing has been concealed there from.
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View>
              <Text style={{ fontSize: 13 }}>
                <Text style={styles.bold}>Date:</Text> {registrationDate || new Date().toLocaleDateString("en-IN")}
              </Text>
              <Text style={{ fontSize: 13, marginTop: 3 }}>
                <Text style={styles.bold}>Place:</Text> {contactInfo.city || "New Delhi"}
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              {signatureUrl ? (
                <Image
                  src={signatureUrl}
                  cache={false}
                  style={{
                    width: 95,
                    height: 32,
                    objectFit: "contain",
                    marginBottom: 3,
                  }}
                />
              ) : (
                <View style={{ height: 26 }} />
              )}
              <Text style={styles.deponentLabel}>DEPONENT</Text>
            </View>
          </View>
        </View>
      </Page>
    </>
  );
};

export default PrintableSpermAffidavit;
