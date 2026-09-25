/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { PrintableSpermRegistration } from "../sperm";
import { PrintableEggRegistration } from "../egg";

interface PdfDocumentProps {
  registration: any;
  qrCodeUrl: string;
  withHeader?: boolean;
  attachments?: string[];
  sections?: string[];
  extraDocUrl?: string;
  overrides?: Record<string, any>;
  affidavitType?: string;
}

/**
 * Universal printable multi-section PDF delegator.
 * Routes to either PrintableSpermRegistration or PrintableEggRegistration based on registration.donorType.
 */
function PrintableRegistrationDocument({
  registration,
  qrCodeUrl,
  withHeader = false,
  attachments = [],
  sections,
  extraDocUrl,
  overrides,
  affidavitType,
}: PdfDocumentProps) {
  const { donorType } = registration || {};
  const isSperm = donorType === "sperm" || !donorType;

  if (isSperm) {
    return (
      <PrintableSpermRegistration
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

  return (
    <PrintableEggRegistration
      registration={registration}
      qrCodeUrl={qrCodeUrl}
      withHeader={withHeader}
      attachments={attachments}
      sections={sections}
      overrides={overrides}
      extraDocUrl={extraDocUrl}
      affidavitType={affidavitType}
    />
  );
}

export default PrintableRegistrationDocument;
