/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 40,
    paddingHorizontal: 45,
    fontSize: 11,
    fontFamily: "Times-Roman",
    lineHeight: 1.4,
  },

  title: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Times-Bold",
    marginBottom: 20,
    textDecoration: "underline",
  },

  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },

  bold: {
    fontFamily: "Times-Bold",
  },

  row: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },

  number: {
    width: 18,
  },

  content: {
    flex: 1,
    textAlign: "justify",
  },

  signature: {
    marginTop: 25,
    textAlign: "right",
    fontFamily: "Times-Bold",
  },

  verification: {
    marginTop: 40,
  },

  verificationTitle: {
    fontFamily: "Times-Bold",
    marginBottom: 10,
  },

  footerRow: {
    marginTop: 12,
  },
});

const AffidavitPdf = () => (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>AFFIDAVIT</Text>

      <Text style={styles.paragraph}>
        I, Mr Rizvan age 28 years, R/o House no. Vill Ibrahimpur, Darpur (17),
        Yamuna Nagar, Haryana - 135103; having Aadhar Card No.
        910346744877 and date of birth 01/01/1998 do hereby solemn depose as
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
          110019 having Registration No.
          DL/AB/2022/10605/AB/SEB/21.
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

      <Text style={styles.signature}>DEPONENT</Text>

      <View style={styles.verification}>
        <Text style={styles.verificationTitle}>VERIFICATION</Text>

        <Text style={styles.paragraph}>
          Verified at New Delhi on the 29th day of May 2026 that the contents
          of the affidavit are true and correct to the best of my knowledge and
          nothing has been concealed there from.
        </Text>

        <Text style={styles.footerRow}>
          <Text style={styles.bold}>Date:</Text> 29/05/2026
        </Text>

        <Text style={styles.footerRow}>
          <Text style={styles.bold}>Place:</Text> New Delhi
        </Text>

        <Text style={styles.signature}>DEPONENT</Text>
      </View>
    </Page>
);

export default AffidavitPdf;
