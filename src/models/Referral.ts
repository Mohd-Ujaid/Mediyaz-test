import mongoose, { Schema, Document } from "mongoose";

export interface IReferral extends Document {
  sourceReferralType:
    | "Existing Patient"
    | "Existing Donor"
    | "Friend / Family"
    | "Doctor / Clinic"
    | "Staff Member"
    | "Website"
    | "Google Search"
    | "Facebook"
    | "Instagram"
    | "WhatsApp"
    | "Advertisement"
    | "Walk-in"
    | "Other";
  referrerName: string; // Patient name, donor name, doctor name, friend name, staff name, etc.
  patientOrDonorId?: string; // Patient ID, Donor ID, Employee ID (if applicable)
  mobileNumber?: string;
  relationship?: string; // For Friends / Family
  clinicName?: string; // For Doctors
  department?: string; // For Staff members
  employeeId?: string; // For Staff members
  otherSourceDetails?: string; // Free text for Other
  referredRegistrationId: string; // The registered donor's registrationId
  referredDonorName: string;
  referredDonorId?: string; // Filled once registration is approved
  rewardEligible: boolean;
  rewardAmount: number;
  rewardStatus: "Pending" | "Approved" | "Paid" | "Cancelled";
  paymentDate?: Date;
  paymentMethod?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    sourceReferralType: {
      type: String,
      required: true,
      enum: [
        "Existing Patient",
        "Existing Donor",
        "Friend / Family",
        "Doctor / Clinic",
        "Staff Member",
        "Website",
        "Google Search",
        "Facebook",
        "Instagram",
        "WhatsApp",
        "Advertisement",
        "Walk-in",
        "Other",
      ],
    },
    referrerName: { type: String, required: true },
    patientOrDonorId: { type: String },
    mobileNumber: { type: String },
    relationship: { type: String },
    clinicName: { type: String },
    department: { type: String },
    employeeId: { type: String },
    otherSourceDetails: { type: String },
    referredRegistrationId: { type: String, required: true, unique: true },
    referredDonorName: { type: String, required: true },
    referredDonorId: { type: String },
    rewardEligible: { type: Boolean, default: false },
    rewardAmount: { type: Number, default: 0 },
    rewardStatus: {
      type: String,
      enum: ["Pending", "Approved", "Paid", "Cancelled"],
      default: "Pending",
    },
    paymentDate: { type: Date },
    paymentMethod: { type: String },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Referral =
  mongoose.models?.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);
