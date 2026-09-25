export interface EggPdfDocumentProps {
  registration: any;
  qrCodeUrl?: string;
  withHeader?: boolean;
  attachments?: string[];
  sections?: string[];
  overrides?: Record<string, any>;
  extraDocUrl?: string;
}

export const EGG_SECTIONS = [
  {
    key: "registration",
    label: "Registration Form",
    desc: "Donor intake details & physical examination",
  },
  {
    key: "contract",
    label: "Contract",
    desc: "Terms and conditions agreement",
  },
  {
    key: "profile",
    label: "Information Form",
    desc: "Medical and reproductive history profile",
  },
  {
    key: "form14a",
    label: "Form 14A (Consent)",
    desc: "Statutory Consent Form under ART Act",
  },
  {
    key: "certificate",
    label: "Certificate (Rule 10)",
    desc: "Screening clearance under Rule 10 ART Rules, 2022",
  },
  {
    key: "affidavit",
    label: "Affidavit",
    desc: "Legal affidavit of oocyte donor (3 pages)",
  },
  {
    key: "aadhaar",
    label: "Aadhaar Card",
    desc: "Verified Aadhaar Card copy with signature",
  },
];

