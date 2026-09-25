/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { SpermDonorRegistrationPdfDocument } from "../sperm";
import { EggDonorRegistrationPdfDocument } from "../egg";

export interface DonorRegistrationPdfDocumentProps {
  registration: any;
  qrCodeUrl?: string;
}

/**
 * Universal Donor Registration PDF delegator.
 * Cleanly routes to the dedicated Sperm or Egg PDF generator based on `registration.donorType`.
 */
export function DonorRegistrationPdfDocument({
  registration,
  qrCodeUrl,
}: DonorRegistrationPdfDocumentProps) {
  const isSperm = registration?.donorType === "sperm";

  if (isSperm) {
    return (
      <SpermDonorRegistrationPdfDocument
        registration={registration}
        qrCodeUrl={qrCodeUrl}
      />
    );
  }

  return (
    <EggDonorRegistrationPdfDocument
      registration={registration}
      qrCodeUrl={qrCodeUrl}
    />
  );
}

export default DonorRegistrationPdfDocument;

// Re-export individual document types for direct consumption
export { SpermDonorRegistrationPdfDocument, EggDonorRegistrationPdfDocument };
