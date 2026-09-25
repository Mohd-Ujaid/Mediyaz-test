export interface SpermPdfDocumentProps {
  registration: any;
  qrCodeUrl?: string;
  withHeader?: boolean;
  attachments?: string[];
  sections?: string[];
  overrides?: Record<string, any>;
  extraDocUrl?: string;
}

export const SPERM_SECTIONS = [
  { key: "registration", label: "Registration Form" },
  { key: "contract", label: "Contract" },
  { key: "certificate", label: "Certificate (Rule 10)" },
  { key: "consent", label: "Consent Form (Form 15)" },
  { key: "profile", label: "Semen Profile & Report" },
  { key: "affidavit", label: "Affidavit" },
];
