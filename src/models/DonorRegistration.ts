import mongoose, { Schema, Document } from "mongoose";

export interface IDonorFileRef {
  fileId: string;
  url: string;
  name?: string;
  type?: string;
  fileName?: string;
  folder?: string;
  size?: number | string;
}

export interface IDonorRegistration extends Document {
  registrationId: string;
  donorType: "sperm" | "egg";
  registrationSource: "online_inquiry" | "walk_in" | "admin_created";
  createdByEmployee?: string; // employeeId of staff who created this registration
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
  currentStep: number;

  personalInfo: {
    fullName: string;
    fatherName: string;
    motherName: string;
    gender: string;
    dateOfBirth: string;
    age?: number;
    maritalStatus: string;
    bloodGroup: string;
    education: string;
    occupation: string;
    height: string;
    weight: string;
    eyeColor?: string;
    hairColor?: string;
    complexion?: string;
    aadhaarNumber: string;
    panNumber?: string;
    spouseName?: string;
    religion?: string;
    monthlyIncome?: string;
    spouseEducation?: string;
    spouseOccupation?: string;
    hobby?: string;
  };

  contactInfo: {
    mobileNumber: string;
    alternateMobile?: string;
    emailAddress: string;
    currentAddress: string;
    permanentAddress: string;
    country?: string;
    state: string;
    district: string;
    city: string;
    pincode: string;
  };

  medicalInfo: {
    medicalHistory?: string;
    familyMedicalHistory?: string;
    previousSurgeries?: string;
    allergies?: string;
    currentMedications?: string;
    diabetes: string;
    hypertension: string;
    smokingStatus: string;
    alcoholConsumption: string;
    drugUse: string;
    geneticDisorders?: string;
    psychologicalHistory?: string;
    infectiousDiseases?: string;
    fertilityHistory?: string;
  };

  donorInfo: {
    // Sperm donor fields
    semenAnalysis?: string;
    previousDonationHistory?: string;
    numberOfDonations?: string;
    lastDonationDate?: string;
    abstinencePeriod?: string;
    // Egg donor fields
    menstrualCycleDetails?: string;
    pregnancyHistory?: string;
    previousEggDonation?: string;
    ivfHistory?: string;
    ovarianReserve?: string;
    hormonalTestDetails?: string;
    numberOfDeliveries?: string;
    numberOfAbortions?: string;
    obstetricHistory?: string;
    otherPointsOfNote?: string;
    contraceptiveHistory?: string;
    bloodTransfusionHistory?: string;
    substanceAbuseHistory?: string;
  };

  investigations?: {
    hb?: string;
    totalRbc?: string;
    totalWbc?: string;
    differentialWbc?: string;
    plateletCount?: string;
    peripheralSmear?: string;
    randomBloodSugar?: string;
    bloodUreaSerumCreatinine?: string;
    sgpt?: string;
    routineUrine?: string;
    hbsagStatus?: string;
    hepatitisCStatus?: string;
    hivStatus?: string;
    hemoglobinA2?: string;
    otherSpecificTest?: string;
    vdrl?: string;
  };

  physicalExamination?: {
    pulse?: string;
    bloodPressure?: string;
    temperature?: string;
    respiratorySystem?: string;
    cardiovascularSystem?: string;
    perAbdominal?: string;
  };

  labReports: {
    viralMarkers?: IDonorFileRef[];
    bloodReport?: IDonorFileRef;
    otherReports?: IDonorFileRef[];
  };

  documents: {
    passportPhoto?: IDonorFileRef;
    aadhaarFront?: IDonorFileRef;
    aadhaarBack?: IDonorFileRef;
    signature?: IDonorFileRef;
    otherDocument?: IDonorFileRef;
  };

  emergencyContact: {
    contactPersonName: string;
    relationship: string;
    phoneNumber: string;
    address: string;
  };

  bankDetails: {
    accountHolderName: string;
    bankName: string;
    branch: string;
    ifscCode: string;
    accountNumber: string;
    upiId?: string;
  };

  consent: {
    confirmTruth: boolean;
    agreeVoluntary: boolean;
    consentScreening: boolean;
    allowStorage: boolean;
    digitalSignature: string;
    signatureDate: string;
  };

  referral?: {
    sourceReferralType: string;
    referrerName: string;
    patientOrDonorId?: string;
    mobileNumber?: string;
    relationship?: string;
    clinicName?: string;
    department?: string;
    employeeId?: string;
    otherSourceDetails?: string;
  };

  assignedHospital?: mongoose.Types.ObjectId;
  assignedBy?: string;
  assignedAt?: Date;
  affiliatedBy?: string;
  updatedBy?: string;
  assignmentHistory?: {
    oldHospital?: mongoose.Types.ObjectId;
    newHospital?: mongoose.Types.ObjectId;
    assignedBy: string;
    assignedAt: Date;
    reason?: string;
  }[];

  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fileRefSubSchema = {
  fileId: { type: String },
  url: { type: String },
  name: { type: String },
  type: { type: String },
  fileName: { type: String },
  folder: { type: String },
  size: { type: Schema.Types.Mixed },
};

const DonorRegistrationSchema = new Schema<IDonorRegistration>(
  {
    registrationId: { type: String, required: true, unique: true },
    donorType: { type: String, enum: ["sperm", "egg"], required: true },
    registrationSource: {
      type: String,
      enum: ["online_inquiry", "walk_in", "admin_created"],
      default: "walk_in",
    },
    createdByEmployee: { type: String, default: null },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "DRAFT",
    },
    currentStep: { type: Number, default: 1 },

    personalInfo: {
      fullName: { type: String, default: "" },
      fatherName: { type: String, default: "" },
      motherName: { type: String, default: "" },
      gender: { type: String, default: "" },
      dateOfBirth: { type: String, default: "" },
      age: { type: Number },
      maritalStatus: { type: String, default: "" },
      bloodGroup: { type: String, default: "" },
      education: { type: String, default: "" },
      occupation: { type: String, default: "" },
      height: { type: String, default: "" },
      weight: { type: String, default: "" },
      eyeColor: { type: String, default: "" },
      hairColor: { type: String, default: "" },
      complexion: { type: String, default: "" },
      aadhaarNumber: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      spouseName: { type: String, default: "" },
      religion: { type: String, default: "" },
      monthlyIncome: { type: String, default: "" },
      spouseEducation: { type: String, default: "" },
      spouseOccupation: { type: String, default: "" },
      hobby: { type: String, default: "" },
    },

    contactInfo: {
      mobileNumber: { type: String, default: "" },
      alternateMobile: { type: String, default: "" },
      emailAddress: { type: String, default: "" },
      currentAddress: { type: String, default: "" },
      permanentAddress: { type: String, default: "" },
      country: { type: String, default: "India" },
      state: { type: String, default: "" },
      district: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    medicalInfo: {
      medicalHistory: { type: String, default: "" },
      familyMedicalHistory: { type: String, default: "" },
      previousSurgeries: { type: String, default: "" },
      allergies: { type: String, default: "" },
      currentMedications: { type: String, default: "" },
      diabetes: { type: String, default: "No" },
      hypertension: { type: String, default: "No" },
      smokingStatus: { type: String, default: "Never" },
      alcoholConsumption: { type: String, default: "Never" },
      drugUse: { type: String, default: "Never" },
      geneticDisorders: { type: String, default: "" },
      psychologicalHistory: { type: String, default: "" },
      infectiousDiseases: { type: String, default: "" },
      fertilityHistory: { type: String, default: "" },
    },

    donorInfo: {
      semenAnalysis: { type: String, default: "" },
      previousDonationHistory: { type: String, default: "No" },
      numberOfDonations: { type: String, default: "" },
      lastDonationDate: { type: String, default: "" },
      abstinencePeriod: { type: String, default: "" },
      menstrualCycleDetails: { type: String, default: "" },
      pregnancyHistory: { type: String, default: "" },
      previousEggDonation: { type: String, default: "No" },
      ivfHistory: { type: String, default: "" },
      ovarianReserve: { type: String, default: "" },
      hormonalTestDetails: { type: String, default: "" },
      numberOfDeliveries: { type: String, default: "" },
      numberOfAbortions: { type: String, default: "" },
      obstetricHistory: { type: String, default: "" },
      otherPointsOfNote: { type: String, default: "" },
      contraceptiveHistory: { type: String, default: "" },
      bloodTransfusionHistory: { type: String, default: "" },
      substanceAbuseHistory: { type: String, default: "" },
    },

    investigations: {
      hb: { type: String, default: "" },
      totalRbc: { type: String, default: "" },
      totalWbc: { type: String, default: "" },
      differentialWbc: { type: String, default: "" },
      plateletCount: { type: String, default: "" },
      peripheralSmear: { type: String, default: "" },
      randomBloodSugar: { type: String, default: "" },
      bloodUreaSerumCreatinine: { type: String, default: "" },
      sgpt: { type: String, default: "" },
      routineUrine: { type: String, default: "" },
      hbsagStatus: { type: String, default: "" },
      hepatitisCStatus: { type: String, default: "" },
      hivStatus: { type: String, default: "" },
      hemoglobinA2: { type: String, default: "" },
      otherSpecificTest: { type: String, default: "" },
      vdrl: { type: String, default: "" },
    },

    physicalExamination: {
      pulse: { type: String, default: "" },
      bloodPressure: { type: String, default: "" },
      temperature: { type: String, default: "" },
      respiratorySystem: { type: String, default: "" },
      cardiovascularSystem: { type: String, default: "" },
      perAbdominal: { type: String, default: "" },
    },

    labReports: {
      viralMarkers: [fileRefSubSchema],
      bloodReport: fileRefSubSchema,
      otherReports: [fileRefSubSchema],
    },

    documents: {
      passportPhoto: fileRefSubSchema,
      aadhaarFront: fileRefSubSchema,
      aadhaarBack: fileRefSubSchema,
      signature: fileRefSubSchema,
      otherDocument: fileRefSubSchema,
    },

    emergencyContact: {
      contactPersonName: { type: String, default: "" },
      relationship: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    bankDetails: {
      accountHolderName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      branch: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },

    consent: {
      confirmTruth: { type: Boolean, default: false },
      agreeVoluntary: { type: Boolean, default: false },
      consentScreening: { type: Boolean, default: false },
      allowStorage: { type: Boolean, default: false },
      digitalSignature: { type: String, default: "" },
      signatureDate: { type: String, default: "" },
    },

    referral: {
      sourceReferralType: { type: String, default: "Website" },
      referrerName: { type: String, default: "" },
      patientOrDonorId: { type: String, default: "" },
      mobileNumber: { type: String, default: "" },
      relationship: { type: String, default: "" },
      clinicName: { type: String, default: "" },
      department: { type: String, default: "" },
      employeeId: { type: String, default: "" },
      otherSourceDetails: { type: String, default: "" },
    },

    assignedHospital: { type: Schema.Types.ObjectId, ref: "Hospital", default: null },
    assignedBy: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    affiliatedBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
    assignmentHistory: [
      {
        oldHospital: { type: Schema.Types.ObjectId, ref: "Hospital", default: null },
        newHospital: { type: Schema.Types.ObjectId, ref: "Hospital", default: null },
        assignedBy: { type: String, required: true },
        assignedAt: { type: Date, default: Date.now },
        reason: { type: String, default: "" }
      }
    ],

    adminNotes: { type: String, default: "" },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for high-frequency queries
DonorRegistrationSchema.index({ "personalInfo.aadhaarNumber": 1 });
DonorRegistrationSchema.index({ status: 1, donorType: 1 });
DonorRegistrationSchema.index({ "contactInfo.emailAddress": 1 });

export const DonorRegistration =
  mongoose.models?.DonorRegistration ||
  mongoose.model<IDonorRegistration>("DonorRegistration", DonorRegistrationSchema);

