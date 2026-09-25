import mongoose, { Schema, Document } from "mongoose";
import { IDonorFileRef } from "./DonorRegistration";

export interface IEggDonorRegistration extends Document {
  registrationId: string;
  donorId?: string;
  donorType: "egg";
  createdByEmployee?: string;
  status: "DRAFT" | "NEW" | "SUBMITTED" | "UNDER_REVIEW" | "DOCUMENTS_VERIFIED" | "AFFIDAVIT_UPLOADED" | "APPROVED" | "WAITING_FORM13" | "FILE_COMPLETED" | "REJECTED" | "SUSPENDED" | "COMPLETED" | "CANCELLED";
  currentStep: number;

  documentVerification?: {
    isVerified?: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    notes?: string;
    rejectionReason?: string;
  };

  personalInfo: {
    fullName: string;
    gender: "Female";
    husbandName?: string;
    husbandOccupation?: string;
    husbandEducation?: string;
    spouseName?: string;
    spouseOccupation?: string;
    spouseEducation?: string;
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
    religion?: string;
    monthlyIncome?: string;
    hobby?: string;
    fatherName?: string;
    motherName?: string;
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
    childAbnormalityHistory?: string;
    psychologicalHistory?: string;
    infectiousDiseases?: string;
    fertilityHistory?: string;
  };

  donorInfo: {
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

  labReports: {
    viralMarkers?: IDonorFileRef[] | IDonorFileRef;
    viralMarkersReport?: IDonorFileRef;
    bloodReport?: IDonorFileRef;
    insurance?: IDonorFileRef;
    otherReports?: IDonorFileRef[];
  };

  documents: {
    passportPhoto?: IDonorFileRef;
    aadhaarFront?: IDonorFileRef;
    aadhaarBack?: IDonorFileRef;
    signature?: IDonorFileRef;
    affidavit?: IDonorFileRef;
    insurance?: IDonorFileRef;
    form13?: IDonorFileRef;
    extraAttachment?: IDonorFileRef;
    otherDocument?: IDonorFileRef;
  };
  form13?: IDonorFileRef;

  managementDocs?: {
    viralMarkers?: IDonorFileRef;
    bloodReport?: IDonorFileRef;
    lifeInsurance?: IDonorFileRef;
    healthInsurance?: IDonorFileRef;
  };

  emergencyContact: {
    contactPersonName: string;
    relationship: string;
    phoneNumber: string;
    address: string;
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
  pickupDate?: string;
  recruitmentDate?: string;
  supplyDate?: string;
  fileNumber?: string;
  reviewedBy?: string;
  reviewedAt?: Date;

  agentCode?: string | null;
  agentId?: mongoose.Types.ObjectId | null;
  agentPayout?: {
    amount: number;
    status: "PENDING" | "UNPAID" | "APPROVED" | "PAID" | "CANCELLED";
    paidAt?: Date;
    paymentReference?: string;
    notes?: string;
  };

  hospitalDealType?: "registry" | "normal" | "profile";

  clinicDeal?: {
    donorCategory: "registry" | "normal" | "profile";
    hospitalDealPrice: number;
    currency: string;
    notes?: string;
    agreedAt?: Date;
    agreedBy?: string;
    paymentStatus?: "PENDING" | "PARTIALLY_RECEIVED" | "RECEIVED";
    isPaymentReceived?: boolean;
    receivedAmount?: number;
    receivedAt?: Date | null;
    paymentReference?: string;
  };

  donorDeal?: {
    donorCategory: "registry" | "normal" | "profile";
    compensationAmount: number;
    paymentMethod: "bank_transfer" | "upi" | "cheque" | "cash";
    paymentTerms: string;
    paymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
    advanceAmount?: number;
    balanceAmount?: number;
    paymentReference?: string;
    notes?: string;
    agreedAt?: Date;
    agreedBy?: string;
    paidAt?: Date | null;
    paidBy?: string | null;
  };

  isDonorPaid?: boolean;
  paidAt?: Date | null;
  paidBy?: string | null;

  certificateIssued?: boolean;
  certificateIssuedAt?: Date | null;
  certificateIssuedBy?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IClinicDeal {
  donorCategory: "registry" | "normal" | "profile";
  hospitalDealPrice: number;
  currency: string;
  notes?: string;
  agreedAt?: Date;
  agreedBy?: string;
  paymentStatus?: "PENDING" | "PARTIALLY_RECEIVED" | "RECEIVED";
  isPaymentReceived?: boolean;
  receivedAmount?: number;
  receivedAt?: Date | null;
  paymentReference?: string;
}

export interface IDonorDeal {
  donorCategory: "registry" | "normal" | "profile";
  compensationAmount: number;
  paymentMethod: "bank_transfer" | "upi" | "cheque" | "cash";
  paymentTerms: string;
  paymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  advanceAmount?: number;
  balanceAmount?: number;
  paymentReference?: string;
  notes?: string;
  agreedAt?: Date;
  agreedBy?: string;
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

const EggDonorRegistrationSchema = new Schema<IEggDonorRegistration>(
  {
    registrationId: { type: String, required: true, unique: true, index: true },
    donorId: { type: String, default: "", index: true },
    donorType: { type: String, default: "egg", index: true },
    createdByEmployee: { type: String, default: null },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "NEW",
        "SUBMITTED",
        "UNDER_REVIEW",
        "DOCUMENTS_VERIFIED",
        "AFFIDAVIT_UPLOADED",
        "APPROVED",
        "WAITING_FORM13",
        "FILE_COMPLETED",
        "REJECTED",
        "SUSPENDED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "DRAFT",
    },
    currentStep: { type: Number, default: 1 },

    documentVerification: {
      isVerified: { type: Boolean, default: false },
      verifiedBy: { type: String, default: null },
      verifiedAt: { type: Date, default: null },
      notes: { type: String, default: "" },
      rejectionReason: { type: String, default: "" },
    },

    personalInfo: {
      fullName: { type: String, default: "" },
      gender: { type: String, default: "Female" },
      husbandName: { type: String, default: "" },
      husbandOccupation: { type: String, default: "" },
      husbandEducation: { type: String, default: "" },
      spouseName: { type: String, default: "" },
      spouseOccupation: { type: String, default: "" },
      spouseEducation: { type: String, default: "" },
      dateOfBirth: { type: String, default: "" },
      age: { type: Number },
      maritalStatus: { type: String, default: "Married" },
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
      religion: { type: String, default: "" },
      monthlyIncome: { type: String, default: "" },
      hobby: { type: String, default: "" },
      fatherName: { type: String, default: "" },
      motherName: { type: String, default: "" },
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
      childAbnormalityHistory: { type: String, default: "No" },
      psychologicalHistory: { type: String, default: "" },
      infectiousDiseases: { type: String, default: "" },
      fertilityHistory: { type: String, default: "" },
    },

    donorInfo: {
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

    labReports: {
      viralMarkers: { type: Schema.Types.Mixed },
      viralMarkersReport: fileRefSubSchema,
      bloodReport: fileRefSubSchema,
      insurance: fileRefSubSchema,
      otherReports: [fileRefSubSchema],
    },

    documents: {
      passportPhoto: fileRefSubSchema,
      aadhaarFront: fileRefSubSchema,
      aadhaarBack: fileRefSubSchema,
      signature: fileRefSubSchema,
      affidavit: fileRefSubSchema,
      insurance: fileRefSubSchema,
      form13: fileRefSubSchema,
      extraAttachment: fileRefSubSchema,
      otherDocument: fileRefSubSchema,
    },
    form13: fileRefSubSchema,

    managementDocs: {
      viralMarkers: fileRefSubSchema,
      bloodReport: fileRefSubSchema,
      lifeInsurance: fileRefSubSchema,
      healthInsurance: fileRefSubSchema,
    },

    emergencyContact: {
      contactPersonName: { type: String, default: "" },
      relationship: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
      address: { type: String, default: "" },
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
      sourceReferralType: { type: String, default: "" },
      referrerName: { type: String, default: "" },
      patientOrDonorId: { type: String, default: "" },
      mobileNumber: { type: String, default: "" },
      relationship: { type: String, default: "" },
      clinicName: { type: String, default: "" },
      department: { type: String, default: "" },
      employeeId: { type: String, default: "" },
      otherSourceDetails: { type: String, default: "" },
    },

    assignedHospital: { type: Schema.Types.ObjectId, ref: "Hospital" },
    assignedBy: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    affiliatedBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
    assignmentHistory: [
      {
        oldHospital: { type: Schema.Types.ObjectId, ref: "Hospital" },
        newHospital: { type: Schema.Types.ObjectId, ref: "Hospital" },
        assignedBy: { type: String },
        assignedAt: { type: Date, default: Date.now },
        reason: { type: String },
      },
    ],

    adminNotes: { type: String, default: "" },
    pickupDate: { type: String, default: "" },
    recruitmentDate: { type: String, default: "" },
    supplyDate: { type: String, default: "" },
    fileNumber: { type: String, default: "" },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },

    agentCode: { type: String, uppercase: true, trim: true, default: null, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", default: null },
    agentPayout: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["PENDING", "UNPAID", "APPROVED", "PAID", "CANCELLED"],
        default: "UNPAID",
      },
      paidAt: { type: Date },
      paymentReference: { type: String },
      notes: { type: String },
    },

    hospitalDealType: {
      type: String,
      enum: ["registry", "normal", "profile"],
      default: "normal",
    },

    clinicDeal: {
      donorCategory: { type: String, enum: ["registry", "normal", "profile"], default: "normal" },
      hospitalDealPrice: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      notes: { type: String, default: "" },
      agreedAt: { type: Date },
      agreedBy: { type: String },
      paymentStatus: {
        type: String,
        enum: ["PENDING", "PARTIALLY_RECEIVED", "RECEIVED"],
        default: "PENDING",
      },
      isPaymentReceived: { type: Boolean, default: false },
      receivedAmount: { type: Number, default: 0 },
      receivedAt: { type: Date, default: null },
      paymentReference: { type: String, default: "" },
    },

    donorDeal: {
      donorCategory: { type: String, enum: ["registry", "normal", "profile"], default: "normal" },
      compensationAmount: { type: Number, default: 0 },
      paymentMethod: {
        type: String,
        enum: ["bank_transfer", "upi", "cheque", "cash"],
        default: "bank_transfer",
      },
      paymentTerms: { type: String, default: "Full on Retrieval" },
      paymentStatus: {
        type: String,
        enum: ["PENDING", "PARTIALLY_PAID", "PAID", "CANCELLED"],
        default: "PENDING",
      },
      advanceAmount: { type: Number, default: 0 },
      balanceAmount: { type: Number, default: 0 },
      paymentReference: { type: String, default: "" },
      notes: { type: String, default: "" },
      agreedAt: { type: Date },
      agreedBy: { type: String },
      paidAt: { type: Date, default: null },
      paidBy: { type: String, default: null },
    },
    isDonorPaid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    paidBy: { type: String, default: null },
    certificateIssued: { type: Boolean, default: false },
    certificateIssuedAt: { type: Date, default: null },
    certificateIssuedBy: { type: String, default: null },
  },
  {
    timestamps: true,
    strict: false,
    collection: "egg_donor_registrations",
  }
);

EggDonorRegistrationSchema.index({ "personalInfo.aadhaarNumber": 1 });
EggDonorRegistrationSchema.index({ status: 1 });
EggDonorRegistrationSchema.index({ "contactInfo.emailAddress": 1 });

if (mongoose.models && (mongoose.models as any).EggDonorRegistration) {
  delete (mongoose.models as any).EggDonorRegistration;
}

export const EggDonorRegistration =
  mongoose.models?.EggDonorRegistration ||
  mongoose.model<IEggDonorRegistration>("EggDonorRegistration", EggDonorRegistrationSchema);
