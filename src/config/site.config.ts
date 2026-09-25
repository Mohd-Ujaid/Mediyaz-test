/**
 * ==============================================================================
 * MEDIYAZ ART BANK - PRODUCTION SITE & BRANDING CONFIGURATION
 * ==============================================================================
 * Central configuration file for white-label enterprise deployment.
 * All brand names, logos, contact info, accreditations, and legal notices
 * are managed here and can be overridden via environment variables.
 */

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Mediyaz Art Bank",
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME || "Mediyaz",
  tagline: "Seeds for Life",
  description:
    "Mediyaz Art Bank – Seeds for Life. A premium international donor-access and donor-coordination platform connecting clinics, hospitals and individuals with sperm and egg donor programs.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Brand Assets & Styling
  logo: {
    text: "Mediyaz Art Bank",
    mark: "M",
    symbolUrl: "/images/logo.webp",
    fullUrl: "/images/logo.webp",
  },

  // Contact Information
  contact: {
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91 9667780807",
    emergencyHotline:
      process.env.NEXT_PUBLIC_EMERGENCY_HOTLINE || "+91 9667780807",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@mediyazartbank.com",
    supportEmail:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info@mediyazartbank.com",
    clinicalDeskEmail: "info@mediyazartbank.com",
    address: {
      street: "336 Gali No. 4, Govindpuri",
      city: "Kalkaji, South Delhi",
      state: "Delhi",
      zip: "110019",
      country: "India",
    },
    hours: "10:00 AM-06:00PM | Monday - Saturday",
  },

  // Clinical Accreditations & Compliance Badges
  accreditations: [
    {
      name: "SART Member",
      detail: "Society for Assisted Reproductive Technology",
      icon: "ShieldCheck",
    },
    {
      name: "ASRM Certified",
      detail: "American Society for Reproductive Medicine",
      icon: "Award",
    },
    {
      name: "CAP Accredited",
      detail: "College of American Pathologists Laboratory",
      icon: "FileCheck",
    },
    {
      name: "HIPAA Compliant",
      detail: "256-Bit Encrypted Patient Data Governance",
      icon: "Lock",
    },
  ],

  // Clinical Metrics
  metrics: {
    ivfSuccessRate: "72%",
    babiesBorn: "3,500+",
    donorsMatched: "1,200+",
    yearsExperience: "15+",
    countriesServed: "40+",
  },

  // Social & Reference Links
  links: {
    twitter: "https://twitter.com/mediyazfertility",
    linkedin: "https://linkedin.com/company/mediyazfertility",
    facebook: "https://facebook.com/mediyazfertility",
  },
};

export type SiteConfig = typeof siteConfig;
