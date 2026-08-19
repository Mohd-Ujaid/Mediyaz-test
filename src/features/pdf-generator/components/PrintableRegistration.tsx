/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import PrintableDonorRegistration from "./PrintableDonorRegistration";
import PrintableEggRegistration from "./PrintableEggRegistration";
import { Document, Page, Image } from "@react-pdf/renderer";

interface PdfDocumentProps {
  registration: any;
  qrCodeUrl: string;
  withHeader?: boolean;
  attachments?: string[];
  sections?: string[];
  extraDocUrl?: string;
  overrides?: Record<string, any>;
}

function PrintableRegistrationDocument({
  registration,
  qrCodeUrl,
  withHeader = false,
  attachments = [],
  sections,
  extraDocUrl,
  overrides,
}: PdfDocumentProps) {
  const { donorType } = registration || {};
  const isSperm = donorType === "sperm" || !donorType;

  const baseDoc = isSperm ? (
    <PrintableDonorRegistration
      registration={registration}
      qrCodeUrl={qrCodeUrl}
      withHeader={withHeader}
      attachments={attachments}
      sections={sections}
      overrides={overrides}
    />
  ) : (
    <PrintableEggRegistration
      registration={registration}
      qrCodeUrl={qrCodeUrl}
      withHeader={withHeader}
      attachments={attachments}
      sections={sections}
      overrides={overrides}
    />
  );

  return isSperm ? (
    <PrintableDonorRegistration
      registration={registration}
      qrCodeUrl={qrCodeUrl}
      withHeader={withHeader}
      attachments={attachments}
      sections={sections}
      overrides={overrides}
      extraDocUrl={extraDocUrl}
    />
  ) : (
    <PrintableEggRegistration
      registration={registration}
      qrCodeUrl={qrCodeUrl}
      withHeader={withHeader}
      attachments={attachments}
      sections={sections}
      overrides={overrides}
      extraDocUrl={extraDocUrl}
    />
  );
}

export default PrintableRegistrationDocument;
