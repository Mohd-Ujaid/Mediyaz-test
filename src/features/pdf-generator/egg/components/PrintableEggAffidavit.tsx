/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { View, Text, StyleSheet, Page, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 45,
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.35,
    color: "#000",
  },

  title: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    marginBottom: 12,
    textDecoration: "underline",
    letterSpacing: 0.5,
  },

  intro: {
    textAlign: "justify",
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 1.35,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  number: {
    width: 20,
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    fontSize: 12,
  },

  content: {
    flex: 1,
    textAlign: "justify",
    fontSize: 12,
    lineHeight: 1.35,
  },

  deponentLabel: {
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },

  verificationSection: {
    marginTop: 24,
    paddingTop: 8,
    marginBottom: 10,
  },

  verificationTitle: {
    fontFamily: "Times-Bold",
    fontWeight: "bold",
    fontSize: 12.5,
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  verificationText: {
    textAlign: "justify",
    fontSize: 12,
    lineHeight: 1.35,
    marginBottom: 10,
  },

  verificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  metaText: {
    fontSize: 12,
    lineHeight: 1.35,
  },

  bold: {
    fontFamily: "Times-Bold",
    fontWeight: "bold",
  },

  pageNumber: {
    position: "absolute",
    bottom: 18,
    right: 40,
    fontSize: 10,
    color: "#777",
  },
});

const EggAffidavit = ({ consent, donor, documents, withHeader = false }: any) => {
  const donorData = donor || consent || {};

  const formatAddress = (
    addr = "",
    city = "",
    state = "",
    country = "",
    pin = ""
  ) => {
    const parts = [addr, city, state, country].filter(Boolean);
    let str = parts.join(", ");
    if (pin) str += ` – ${pin}`;
    return str;
  };

  const addressText =
    donorData.fullAddress ||
    formatAddress(
      donorData.address,
      donorData.city,
      donorData.state,
      donorData.country,
      donorData.pincode
    );

  const currentAddressText =
    donorData.currentAddressText ||
    formatAddress(
      donorData.currentAddress || donorData.address,
      donorData.city,
      donorData.state,
      donorData.country,
      donorData.pincode
    );

  const permanentAddressText =
    donorData.permanentAddressText ||
    formatAddress(
      donorData.permanentAddress || donorData.currentAddress || donorData.address,
      donorData.city,
      donorData.state,
      donorData.country,
      donorData.pincode
    );

  const signatureUrl = documents?.signature?.url;

  return (
    <>
      {/* ========================================== */}
      {/* AFFIDAVIT - PAGE 1 OF 3: BLANK A4 PAGE FOR NOTARY STAMP / E-STAMP WITH SIGNATURE */}
      {/* ========================================== */}
      <Page size="A4" style={[styles.page, { padding: 0 }]}>
        <View style={{ position: "absolute", bottom: 65, right: 40, alignItems: "flex-end" }}>
          {signatureUrl ? (
            <Image
              src={signatureUrl}
              cache={false}
              style={{
                width: 110,
                height: 40,
                objectFit: "contain",
              }}
            />
          ) : (
            <View style={{ height: 35, width: 120, borderBottomWidth: 1, borderBottomColor: "#666" }} />
          )}
        </View>
      </Page>

      {/* ========================================== */}
      {/* AFFIDAVIT - PAGE 2 OF 3: AFFIDAVIT TEXT (PART 1 - POINTS 1 TO 6) */}
      {/* ========================================== */}
      <Page
        size="A4"
        style={[
          styles.page,
          withHeader
            ? { paddingTop: 70, paddingBottom: 60 }
            : { paddingTop: 40, paddingBottom: 40 },
        ]}
      >
        <Text style={styles.title}>AFFIDAVIT OF OOCYTE DONOR</Text>

        <Text style={styles.intro}>
          I, <Text style={styles.bold}>{donorData.name || ""}</Text>, W/O{" "}
          <Text style={styles.bold}>{donorData.husbandName || ""}</Text>
          {donorData.husbandEducation ? ` (Education: ${donorData.husbandEducation})` : ""}, Residential Address (as per Aadhaar card):{" "}
          <Text style={styles.bold}>{permanentAddressText || addressText || ""}</Text>, Current Address:{" "}
          <Text style={styles.bold}>{currentAddressText || addressText || ""}</Text>, Aadhaar No.{" "}
          <Text style={styles.bold}>{donorData.aadhaar || ""}</Text>, date of birth{" "}
          <Text style={styles.bold}>{donorData.dob || ""}</Text> and Mobile No.{" "}
          <Text style={styles.bold}>{donorData.mobile || ""}</Text>, solemnly affirm and
          depose as under:
        </Text>

        <View style={styles.row}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.content}>
            That I am married to <Text style={styles.bold}>{donorData.husbandName || "my spouse"}</Text>
            {donorData.husbandEducation ? ` (Education: ${donorData.husbandEducation})` : ""}
            {donorData.deliveries
              ? ` and have ${donorData.deliveries} ${Number(donorData.deliveries) === 1 ? "child" : "children"}`
              : ""}.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.content}>
            That this affidavit of undertaking is sworn in compliance of Section
            27(4) of Assisted Reproductive Technology (Regulation) 2021.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.content}>
            I understand and accept that the drugs that are used to stimulate the
            ovaries to raise oocytes have temporary side effects like nausea,
            headaches and abdominal bloating. Only in a small proportion of cases,
            a condition called ovarian hyper stimulation occurs where there is an
            exaggerated ovarian response. Such cases can be identified ahead of
            time but only to a limited extent. Further, at times the ovarian
            response is poor or absent in spite of using a high dose of drugs.
            Under these circumstances, the treatment cycle will be cancelled.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>4.</Text>
          <Text style={styles.content}>
            I understand that there will be no direct or indirect contact between
            me and the recipient/Intended Parent(s) and my personal identity will
            not be disclosed to the recipient or to the child born through the use
            of my gamete apart from being directed by a court of law.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>5.</Text>
          <Text style={styles.content}>
            I have agreed to donate my oocytes/eggs at my own free will and after
            understanding the legal, medical procedures and their associated risks
            and obligations involved.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>6.</Text>
          <Text style={styles.content}>
            I have not been allured by any person from the ART clinic to make egg
            donation.
          </Text>
        </View>

        {/* Page 2 Bottom: Deponent Signature */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            marginTop: 15,
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
                }}
              />
            ) : (
              <View style={{ height: 30 }} />
            )}
          </View>
        </View>
      </Page>

      {/* ========================================== */}
      {/* AFFIDAVIT - PAGE 3 OF 3: AFFIDAVIT TEXT (PART 2 & VERIFICATION) */}
      {/* ========================================== */}
      <Page
        size="A4"
        style={[
          styles.page,
          withHeader
            ? { paddingTop: 70, paddingBottom: 60 }
            : { paddingTop: 40, paddingBottom: 40 },
        ]}
      >
        <View style={styles.row}>
          <Text style={styles.number}>7.</Text>
          <Text style={styles.content}>
            I undertake that since commencement of Assisted Reproductive
            Technology (Regulation) 2021 I have not donated my oocytes/eggs and
            this is the first time in my life I am donating my oocytes/eggs.
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
        <View style={{ alignItems: "flex-end", marginTop: 10, marginBottom: 16 }}>
          {signatureUrl ? (
            <Image
              src={signatureUrl}
              cache={false}
              style={{
                width: 95,
                height: 32,
                objectFit: "contain",
              }}
            />
          ) : (
            <View style={{ height: 26 }} />
          )}
        </View>

        {/* Verification Section */}
        <View style={styles.verificationSection}>
          <Text style={styles.verificationText}>
            Verified at <Text style={styles.bold}>{donorData.city || "New Delhi"}</Text> on the{" "}
            <Text style={styles.bold}>{donorData.verificationDate || " "}</Text> that the contents of
            the affidavit are true and correct to the best of my knowledge and
            nothing has been concealed therefrom.
          </Text>

          <View style={styles.verificationFooter}>
            <View>
              <Text style={styles.metaText}>
                <Text style={styles.bold}>Date: </Text>
                {donorData.verificationDate || "__________"}
              </Text>
              <Text style={[styles.metaText, { marginTop: 3 }]}>
                <Text style={styles.bold}>Place: </Text>
                {donorData.city || "New Delhi"}
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
                  }}
                />
              ) : (
                <View style={{ height: 26 }} />
              )}
            </View>
          </View>
        </View>
      </Page>
    </>
  );
};

export default EggAffidavit;


