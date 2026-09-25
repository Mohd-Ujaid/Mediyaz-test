import { z } from "zod";

// ============================================================
// STEP 1 — PERSONAL INFORMATION
// ============================================================
export const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  fatherName: z.string().optional().or(z.literal("")),
  motherName: z.string().optional().or(z.literal("")),
  husbandName: z.string().optional().or(z.literal("")),
  husbandOccupation: z.string().optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"], { message: "Gender is required" }).or(z.string()),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().optional(),
  maritalStatus: z.string().min(1, "Marital status is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  education: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  height: z.string().optional().or(z.literal("")),
  weight: z.string().optional().or(z.literal("")),
  eyeColor: z.string().optional().or(z.literal("")),
  hairColor: z.string().optional().or(z.literal("")),
  complexion: z.string().optional().or(z.literal("")),
  aadhaarNumber: z.string().optional().or(z.literal("")),
  panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN format").optional().or(z.literal("")),
  spouseName: z.string().optional().or(z.literal("")),
  religion: z.string().optional().or(z.literal("")),
  monthlyIncome: z.string().optional().or(z.literal("")),
  spouseEducation: z.string().optional().or(z.literal("")),
  spouseOccupation: z.string().optional().or(z.literal("")),
  hobby: z.string().optional().or(z.literal("")),
});

export const spermPersonalInfoSchema = personalInfoSchema.extend({
  gender: z.literal("Male"),
});

export const eggPersonalInfoSchema = personalInfoSchema.extend({
  gender: z.literal("Female"),
  husbandName: z.string().optional().or(z.literal("")),
  husbandOccupation: z.string().optional().or(z.literal("")),
});


// ============================================================
// STEP 2 — CONTACT INFORMATION
// ============================================================
export const contactInfoSchema = z.object({
  mobileNumber: z.string().min(10, "Mobile number is required"),
  alternateMobile: z.string().optional().default(""),
  emailAddress: z.string().email("Invalid email address").optional().or(z.literal("")).default(""),
  currentAddress: z.string().optional().default(""),
  permanentAddress: z.string().optional().default(""),
  country: z.string().default("India"),
  state: z.string().default(""),
  district: z.string().default(""),
  city: z.string().default(""),
  pincode: z.string().default(""),
});

// ============================================================
// STEP 3 — MEDICAL INFORMATION
// ============================================================
export const medicalInfoSchema = z.object({
  medicalHistory: z.string().optional().or(z.literal("")),
  familyMedicalHistory: z.string().optional().or(z.literal("")),
  previousSurgeries: z.string().optional().or(z.literal("")),
  allergies: z.string().optional().or(z.literal("")),
  currentMedications: z.string().optional().or(z.literal("")),
  diabetes: z.string().optional().default("No"),
  hypertension: z.string().optional().default("No"),
  smokingStatus: z.string().optional().default("Never"),
  alcoholConsumption: z.string().optional().default("Never"),
  drugUse: z.string().optional().default("Never"),
  geneticDisorders: z.string().optional().or(z.literal("")),
  psychologicalHistory: z.string().optional().or(z.literal("")),
  infectiousDiseases: z.string().optional().or(z.literal("")),
  fertilityHistory: z.string().optional().or(z.literal("")),
});

// ============================================================
// STEP 4 — DONOR-SPECIFIC INFORMATION
// ============================================================
export const spermDonorInfoSchema = z.object({
  semenAnalysis: z.string().optional(),
  previousDonationHistory: z.enum(["Yes", "No"]).optional().or(z.literal("")),
  numberOfDonations: z.string().optional(),
  lastDonationDate: z.string().optional(),
  abstinencePeriod: z.string().optional(),
});

export const eggDonorInfoSchema = z.object({
  menstrualCycleDetails: z.string().optional(),
  pregnancyHistory: z.string().optional(),
  previousEggDonation: z.enum(["Yes", "No"]).optional().or(z.literal("")),
  ivfHistory: z.string().optional(),
  ovarianReserve: z.string().optional(),
  hormonalTestDetails: z.string().optional(),
  numberOfDeliveries: z.string().optional().or(z.literal("")),
  numberOfAbortions: z.string().optional().or(z.literal("")),
  obstetricHistory: z.string().optional().or(z.literal("")),
  otherPointsOfNote: z.string().optional().or(z.literal("")),
  contraceptiveHistory: z.string().optional().or(z.literal("")),
  bloodTransfusionHistory: z.string().optional().or(z.literal("")),
  substanceAbuseHistory: z.string().optional().or(z.literal("")),
});

export const investigationsSchema = z.object({
  hb: z.string().optional().or(z.literal("")),
  totalRbc: z.string().optional().or(z.literal("")),
  totalWbc: z.string().optional().or(z.literal("")),
  differentialWbc: z.string().optional().or(z.literal("")),
  plateletCount: z.string().optional().or(z.literal("")),
  peripheralSmear: z.string().optional().or(z.literal("")),
  randomBloodSugar: z.string().optional().or(z.literal("")),
  bloodUreaSerumCreatinine: z.string().optional().or(z.literal("")),
  sgpt: z.string().optional().or(z.literal("")),
  routineUrine: z.string().optional().or(z.literal("")),
  hbsagStatus: z.string().optional().or(z.literal("")),
  hepatitisCStatus: z.string().optional().or(z.literal("")),
  hivStatus: z.string().optional().or(z.literal("")),
  hemoglobinA2: z.string().optional().or(z.literal("")),
  otherSpecificTest: z.string().optional().or(z.literal("")),
  vdrl: z.string().optional().or(z.literal("")),
});

export const physicalExaminationSchema = z.object({
  pulse: z.string().optional().or(z.literal("")),
  bloodPressure: z.string().optional().or(z.literal("")),
  temperature: z.string().optional().or(z.literal("")),
  respiratorySystem: z.string().optional().or(z.literal("")),
  cardiovascularSystem: z.string().optional().or(z.literal("")),
  perAbdominal: z.string().optional().or(z.literal("")),
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
  })).optional().nullable(),
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
  contactPersonName: z.string().optional().or(z.literal("")),
  relationship: z.string().optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
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
  signatureDate: z.string().optional().or(z.literal("")).transform(val => val || new Date().toISOString().split("T")[0]),
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
  investigations: investigationsSchema.optional(),
  physicalExamination: physicalExaminationSchema.optional(),
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
export type Investigations = z.infer<typeof investigationsSchema>;
export type PhysicalExamination = z.infer<typeof physicalExaminationSchema>;
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
