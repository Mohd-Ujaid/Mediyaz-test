/* eslint-disable jsx-a11y/alt-text */
import { View, Text, StyleSheet, Page, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 50,
    paddingTop: 30,
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.6,
  },

  title: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Times-Bold",
    marginBottom: 25,
    textDecoration: "underline",
  },

  intro: {
    textAlign: "justify",
    marginBottom: 30,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  number: {
    width: 25,
  },

  text: {
    flex: 1,
    textAlign: "justify",
  },

  verificationTitle: {
    marginTop: 40,
    fontFamily: "Times-Bold",
    marginBottom: 10,
  },

  verificationText: {
    marginTop: 5,
    textAlign: "justify",
  },

  signature: {
    alignItems: "flex-end",
    marginTop: 40,
    paddingRight: 30,
  },

  deponent: {
    marginTop: 5,
    fontFamily: "Times-Bold",
  },

  footer: {
    marginTop: 35,
  },

  bold: {
    fontFamily: "Times-Bold",
  },
});

const EggAffidavit = ({ consent, donor, documents }: any) => {
  const donorData = donor || consent;
  return (
    <Page size="A4" style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>AFFIDAVIT OF OOCYTE DONOR</Text>

        <Text style={styles.intro}>
          I, {donorData?.name}, W/O {donorData?.husbandName}, House No.
          {donorData?.houseNo}, {donorData?.address}, {donorData?.city ? `${donorData.city}, ` : ""}{donorData?.state ? `${donorData.state}, ` : ""}{donorData?.country ? `${donorData.country} ` : ""}–{" "}
          {donorData?.pincode}, Aadhaar No. {donorData?.aadhaar}, date of birth{" "}
          {donorData?.dob} and Mobile No. {donorData?.mobile}, solemnly affirm
          and depose as under:
        </Text>

        <View style={styles.row}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.text}>
            That I am married {donorData?.husbandName}, from the last 7 years
            and have one child.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.text}>
            That this affidavit of undertaking is sworn in compliance of Section
            27(4) of Assisted Reproductive Technology (Regulation) 2021.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.text}>
            I understand and accept that the drugs that are used to stimulate
            the ovaries to raise oocytes have temporary side effects like
            nausea, headaches and abdominal bloating. Only in a small proportion
            of cases, a condition called ovarian hyper stimulation occurs where
            there is an exaggerated ovarian response. Such cases can be
            identified ahead of time but only to a limited extent. Further, at
            times the ovarian response is poor or absent in spite of using a
            high dose of drugs. Under these circumstances, the treatment cycle
            will be cancelled.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>4.</Text>
          <Text style={styles.text}>
            I understand that there will be no direct or indirect contact
            between me and the recipient/Intended Parent(s) and my personal
            identity will not be disclosed to the recipient or to the child born
            through the use of my gamete apart from being directed by a court of
            law.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>5.</Text>
          <Text style={styles.text}>
            I have agreed to donate my oocytes/eggs at my own free will and
            after understanding the legal, medical procedures and their
            associated risks and obligations involved.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>6.</Text>
          <Text style={styles.text}>
            I have not been allured by any person from the ART clinic to make
            egg donation.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>7.</Text>
          <Text style={styles.text}>
            I undertake that since commencement of Assisted Reproductive
            Technology (Regulation) 2021 I have not donated my oocytes/eggs and
            this is the first time in my life I am donating my oocytes/eggs.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.number}>8.</Text>
          <Text style={styles.text}>
            That the contents of this affidavit have been read over and
            explained to me and I have fully understood the same and nothing
            material has been concealed by me.
          </Text>
        </View>

        {/* Signature goes here */}
        <View style={styles.signature}>
          {documents?.signature?.url ? (
            <Image
              src={documents.signature.url}
              cache={false}
              style={{
                width: 120,
                height: 40,
                objectFit: "contain",
                marginBottom: 5,
              }}
            />
          ) : (
            <Text style={{ height: 40 }}>No Signature Provided</Text>
          )}
          <Text style={styles.deponent}>DEPONENT</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.bold}>VERIFICATION</Text>

          <Text style={styles.verificationText}>
            Verified at New Delhi on the {donorData?.verificationDate} that the
            contents of the affidavit are true and correct to the best of my
            knowledge and nothing has been concealed therefrom.
          </Text>

          <Text style={{ marginTop: 20 }}>
            <Text style={styles.bold}>Date:</Text> {donorData?.verificationDate}
          </Text>

          <Text style={{ marginTop: 8 }}>
            <Text style={styles.bold}>Place:</Text> New Delhi
          </Text>

          <View style={styles.signature}>
            {documents?.signature?.url ? (
              <Image
                src={documents.signature.url}
                cache={false}
                style={{
                  width: 120,
                  height: 40,
                  objectFit: "contain",
                  marginBottom: 5,
                }}
              />
            ) : (
              <Text style={{ height: 40 }}>No Signature Provided</Text>
            )}
            <Text style={styles.deponent}>DEPONENT</Text>
          </View>
        </View>
      </View>
    </Page>
  );
};

export default EggAffidavit;
