import mongoose, { Schema, Document } from "mongoose";

export interface IDonor extends Document {
  user: mongoose.Types.ObjectId;
  donorId: string;
  personalInformation: {
    dateOfBirth: Date;
    gender: string;
    bloodGroup: string;
    nationality: string;
    address: string;
    maritalStatus?: string;
  };
  physicalAttributes: {
    height: number;
    weight: number;
    eyeColor?: string;
    hairColor?: string;
    skinTone?: string;
  };
  contactInformation?: {
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    city?: string;
    state?: string;
    country?: string;
    pinCode?: string;
  };
  medicalInformation?: {
    eligibility?: boolean;
    hemoglobin?: number;
    bloodPressure?: string;
    allergies?: string;
    diseases?: string;
    medications?: string;
    medicalNotes?: string;
  };
  donationInformation?: {
    totalDonations?: number;
    lastDonationDate?: Date;
    nextEligibleDate?: Date;
    certificates?: { name: string; url: string; issuedAt: Date }[];
  };
  education?: string;
  occupation?: string;
  medicalHistory?: string;
  familyHistory?: string;
  lifestyleInformation?: string;
  geneticInformation?: string;
  donationStatus: "PENDING" | "ACTIVE" | "COMPLETED" | "REJECTED";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  tags?: string[];
  documents: {
    type: string;
    url: string;
    name?: string;
    uploadedAt?: Date;
  }[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonorSchema = new Schema<IDonor>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    donorId: { type: String, required: true, unique: true },
    personalInformation: {
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, required: true },
      bloodGroup: { type: String, required: true },
      nationality: { type: String, required: true },
      address: { type: String, required: true },
      maritalStatus: { type: String, default: "Single" },
    },
    physicalAttributes: {
      height: { type: Number },
      weight: { type: Number },
      eyeColor: { type: String },
      hairColor: { type: String },
      skinTone: { type: String },
    },
    contactInformation: {
      emergencyContactName: { type: String },
      emergencyContactPhone: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      pinCode: { type: String },
    },
    medicalInformation: {
      eligibility: { type: Boolean, default: true },
      hemoglobin: { type: Number },
      bloodPressure: { type: String },
      allergies: { type: String },
      diseases: { type: String },
      medications: { type: String },
      medicalNotes: { type: String },
    },
    donationInformation: {
      totalDonations: { type: Number, default: 0 },
      lastDonationDate: { type: Date },
      nextEligibleDate: { type: Date },
      certificates: [
        {
          name: { type: String },
          url: { type: String },
          issuedAt: { type: Date, default: Date.now },
        }
      ],
    },
    education: { type: String },
    occupation: { type: String },
    medicalHistory: { type: String },
    familyHistory: { type: String },
    lifestyleInformation: { type: String },
    geneticInformation: { type: String },
    donationStatus: { type: String, enum: ["PENDING", "ACTIVE", "COMPLETED", "REJECTED"], default: "PENDING" },
    approvalStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    tags: { type: [String], default: ["Frozen"] },
    documents: [
      {
        type: { type: String },
        url: { type: String },
        name: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

// Add scalable indices for frequent queries
DonorSchema.index({ approvalStatus: 1, donationStatus: 1 });
DonorSchema.index({ "personalInformation.bloodGroup": 1 });
DonorSchema.index({ createdAt: -1 });

export const Donor = mongoose.models?.Donor || mongoose.model<IDonor>("Donor", DonorSchema);
