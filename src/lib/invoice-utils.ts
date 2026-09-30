export interface ServicePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  hsnSac: string;
  defaultPrice: number;
  taxRate: number;
}

export const ART_SERVICE_PRESETS: ServicePreset[] = [
  {
    id: "semen_sample_standard",
    name: "Donor Semen Cryovial (Standard)",
    category: "Semen Sample",
    description: "Normozoospermic donor semen cryovial (0.5ml) — motility >40%, concentration >20M/ml, washed and ready for IUI/ICSI.",
    hsnSac: "9993",
    defaultPrice: 8500,
    taxRate: 0,
  },
  {
    id: "semen_sample_premium",
    name: "Donor Semen Cryovial (Premium Tested)",
    category: "Semen Sample",
    description: "Donor semen cryovial (0.5ml) with NGS expanded genetic carrier screening (300+ genes) & high post-thaw survival.",
    hsnSac: "9993",
    defaultPrice: 14500,
    taxRate: 0,
  },
  {
    id: "egg_donor_normal",
    name: "Egg Donor Allocation (Standard Package)",
    category: "Egg Donor Package",
    description: "Standard proven egg donor allocation, hormonal profiling, infectious disease screening, ovarian stimulation & oocyte pick-up (OPU).",
    hsnSac: "9993",
    defaultPrice: 95000,
    taxRate: 0,
  },
  {
    id: "egg_donor_profile",
    name: "Egg Donor Allocation (Premium Profile Matching)",
    category: "Egg Donor Package",
    description: "Premium curated donor matching (physical traits, education, hobbies, high AFC) with full legal affidavit, karyotype & ICSI clearance.",
    hsnSac: "9993",
    defaultPrice: 145000,
    taxRate: 0,
  },
  {
    id: "rule14_affidavit",
    name: "Statutory ART Affidavit & Compliance (Rule 14)",
    category: "Legal & Compliance",
    description: "Statutory affidavit execution under ART (Regulation) Act 2021 Rule 14, notary clearance, and registration dossier documentation.",
    hsnSac: "9993",
    defaultPrice: 5000,
    taxRate: 18,
  },
  {
    id: "cryo_shipping",
    name: "Dry Shipper Cryo-Transport (Cold Chain)",
    category: "Cryo-Shipping",
    description: "Dedicated liquid nitrogen (-196°C) dry-shipper dispatch to ART clinic with continuous data-logging temperature tracker.",
    hsnSac: "9993",
    defaultPrice: 6500,
    taxRate: 18,
  },
  {
    id: "genetic_screening",
    name: "Comprehensive Infectious & Genetic Screening Panel",
    category: "Lab Screening",
    description: "Viral markers (HIV 1/2, HBsAg, Anti-HCV, VDRL), Thalassemia electrophoresis, Karyotyping and clinical fitness certificate.",
    hsnSac: "9993",
    defaultPrice: 12000,
    taxRate: 0,
  },
  {
    id: "clinic_handling",
    name: "ART Bank Processing & Allocation Administration Fee",
    category: "Administrative",
    description: "Statutory registry entry, donor quarantine record maintenance, and clinical file handover fee.",
    hsnSac: "9993",
    defaultPrice: 4000,
    taxRate: 18,
  },
];

/**
 * Converts a positive number to Indian Currency Words (e.g. 1,25,000 -> "One Lakh Twenty Five Thousand Rupees Only")
 */
export function numberToWordsIndian(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";

  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ",
    "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  function convertTwoDigits(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
  }

  function convertSection(n: number): string {
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
      if (n > 0) str += "and ";
    }
    str += convertTwoDigits(n);
    return str;
  }

  let n = integerPart;
  let words = "";

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  if (crore > 0) {
    words += convertSection(crore) + "Crore ";
  }
  if (lakh > 0) {
    words += convertSection(lakh) + "Lakh ";
  }
  if (thousand > 0) {
    words += convertSection(thousand) + "Thousand ";
  }
  if (remainder > 0) {
    words += convertSection(remainder);
  }

  words = words.trim() + " Rupees";

  if (decimalPart > 0) {
    words += " and " + convertSection(decimalPart).trim() + " Paise";
  }

  return words + " Only";
}

export function formatINR(val: number): string {
  if (isNaN(val)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatINRPdf(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "Rs. 0.00";
  return (
    "Rs. " +
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  );
}

export function formatDotDate(val: string | Date | null | undefined): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    // If it's already in DD.MM.YYYY format
    if (typeof val === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(val)) {
      return val;
    }
    return String(val);
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}


