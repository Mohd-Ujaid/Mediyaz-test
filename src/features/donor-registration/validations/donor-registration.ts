import { z } from "zod";

// ============================================================
// STEP 1 — PERSONAL INFORMATION
// ============================================================
export const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Gender is required" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(18, "Must be at least 18 years old").max(50, "Must be under 50").optional(),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"], { message: "Marital status is required" }),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], { message: "Blood group is required" }),
  nationality: z.string().min(2, "Nationality is required"),
  education: z.string().min(1, "Education is required"),
  occupation: z.string().min(1, "Occupation is required"),
  height: z.string().min(1, "Height is required"),
  weight: z.string().min(1, "Weight is required"),
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  complexion: z.string().optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be a 12-digit number"),
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN format").optional().or(z.literal("")),
});

// ============================================================
// STEP 2 — CONTACT INFORMATION
// ============================================================
export const contactInfoSchema = z.object({
  mobileNumber: z.string().min(10, "Mobile number is required"),
  alternateMobile: z.string().optional(),
  emailAddress: z.string().email("Invalid email address"),
  currentAddress: z.string().min(5, "Current address is required"),
  permanentAddress: z.string().min(5, "Permanent address is required"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
});

// ============================================================
// STEP 3 — MEDICAL INFORMATION
// ============================================================
export const medicalInfoSchema = z.object({
  medicalHistory: z.string().optional(),
  familyMedicalHistory: z.string().optional(),
  previousSurgeries: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  diabetes: z.enum(["Yes", "No", "Pre-Diabetic"], { message: "Select diabetes status" }),
  hypertension: z.enum(["Yes", "No", "Borderline"], { message: "Select hypertension status" }),
  smokingStatus: z.enum(["Never", "Former", "Current"], { message: "Select smoking status" }),
  alcoholConsumption: z.enum(["Never", "Occasional", "Regular"], { message: "Select alcohol status" }),
  drugUse: z.enum(["Never", "Former", "Current"], { message: "Select drug use status" }),
  geneticDisorders: z.string().optional(),
  psychologicalHistory: z.string().optional(),
  infectiousDiseases: z.string().optional(),
  fertilityHistory: z.string().optional(),
});

// ============================================================
// STEP 4 — DONOR-SPECIFIC INFORMATION
// ============================================================
export const spermDonorInfoSchema = z.object({
  semenAnalysis: z.string().optional(),
  previousDonationHistory: z.enum(["Yes", "No"]),
  numberOfDonations: z.string().optional(),
  lastDonationDate: z.string().optional(),
  abstinencePeriod: z.string().optional(),
});

export const eggDonorInfoSchema = z.object({
  menstrualCycleDetails: z.string().optional(),
  pregnancyHistory: z.string().optional(),
  previousEggDonation: z.enum(["Yes", "No"]),
  ivfHistory: z.string().optional(),
  ovarianReserve: z.string().optional(),
  hormonalTestDetails: z.string().optional(),
});

// ============================================================
// STEP 5 — LABORATORY REPORTS (file references)
// ============================================================
const fileRefSchema = z.object({
  fileId: z.string(),
  url: z.string(),
  name: z.string().optional(),
  type: z.string().optional(),
  fileName: z.string().optional(),
  folder: z.string().optional(),
  size: z.union([z.string(), z.number()]).optional(),
}).optional().nullable();

export const labReportsSchema = z.object({
  viralMarkers: z.array(z.object({
    fileId: z.string(),
    url: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
    fileName: z.string().optional(),
    folder: z.string().optional(),
    size: z.union([z.string(), z.number()]).optional(),
  })).optional().nullable(),
  bloodReport: fileRefSchema,
  otherReports: z.array(z.object({
    fileId: z.string(),
    url: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
    fileName: z.string().optional(),
    folder: z.string().optional(),
    size: z.union([z.string(), z.number()]).optional(),
  })).optional(),
});

// ============================================================
// STEP 6 — DOCUMENT UPLOAD
// ============================================================
export const documentsSchema = z.object({
  passportPhoto: fileRefSchema,
  aadhaarFront: fileRefSchema,
  aadhaarBack: fileRefSchema,
  signature: fileRefSchema,
  otherDocument: fileRefSchema.optional().nullable(),
});

// ============================================================
// STEP 7 — EMERGENCY CONTACT
// ============================================================
export const emergencyContactSchema = z.object({
  contactPersonName: z.string().min(2, "Contact person name is required"),
  relationship: z.string().min(2, "Relationship is required"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  address: z.string().min(5, "Address is required"),
});

// ============================================================
// STEP 8 — BANK DETAILS
// ============================================================
export const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(2, "Account holder name is required"),
  bankName: z.string().min(2, "Bank name is required"),
  branch: z.string().min(2, "Branch is required"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  accountNumber: z.string().min(8, "Account number is required"),
  upiId: z.string().optional(),
});

// ============================================================
// STEP 9 — CONSENT & DECLARATION
// ============================================================
export const consentSchema = z.object({
  confirmTruth: z.boolean().refine(v => v === true, "You must confirm all information is true"),
  agreeVoluntary: z.boolean().refine(v => v === true, "You must agree to voluntary donation"),
  consentScreening: z.boolean().refine(v => v === true, "You must consent to medical screening"),
  allowStorage: z.boolean().refine(v => v === true, "You must allow secure storage of records"),
  digitalSignature: z.string().optional().nullable(),
  signatureDate: z.string().min(1, "Date is required"),
});

export const referralSchema = z.object({
  sourceReferralType: z.string().default("Website"),
  referrerName: z.string().optional().default(""),
  patientOrDonorId: z.string().optional().default(""),
  mobileNumber: z.string().optional().default(""),
  relationship: z.string().optional().default(""),
  clinicName: z.string().optional().default(""),
  department: z.string().optional().default(""),
  employeeId: z.string().optional().default(""),
  otherSourceDetails: z.string().optional().default(""),
});

// ============================================================
// FULL REGISTRATION SCHEMA
// ============================================================
export const donorRegistrationSchema = z.object({
  donorType: z.enum(["sperm", "egg"]),
  personalInfo: personalInfoSchema,
  contactInfo: contactInfoSchema,
  medicalInfo: medicalInfoSchema,
  donorInfo: z.union([spermDonorInfoSchema, eggDonorInfoSchema]),
  labReports: labReportsSchema,
  documents: documentsSchema,
  emergencyContact: emergencyContactSchema,
  bankDetails: bankDetailsSchema.optional(),
  consent: consentSchema,
  referral: referralSchema.optional(),
});

// ============================================================
// TYPE EXPORTS
// ============================================================
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type MedicalInfo = z.infer<typeof medicalInfoSchema>;
export type SpermDonorInfo = z.infer<typeof spermDonorInfoSchema>;
export type EggDonorInfo = z.infer<typeof eggDonorInfoSchema>;
export type LabReports = z.infer<typeof labReportsSchema>;
export type Documents = z.infer<typeof documentsSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type BankDetails = z.infer<typeof bankDetailsSchema>;
export type Consent = z.infer<typeof consentSchema>;
export type ReferralInfo = z.infer<typeof referralSchema>;
export type DonorRegistration = z.infer<typeof donorRegistrationSchema>;

// File reference type
export type FileRef = {
  fileId: string;
  url: string;
  name?: string;
  type?: string;
  fileName?: string;
  folder?: string;
  size?: number | string;
} | null | undefined;

// Step validation map
export const STEP_SCHEMAS = {
  1: null,
  2: null,
  3: consentSchema,
};

export const STEP_LABELS = [
  "Profile Information",
  "Document Uploads",
  "Review & Consent",
];
