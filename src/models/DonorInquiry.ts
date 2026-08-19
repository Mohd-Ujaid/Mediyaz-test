import mongoose, { Schema, Document } from "mongoose";

export interface IDonorInquiry extends Document {
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  gender: string;
  dateOfBirth: string;
  age?: number;
  donationInterest: "sperm" | "egg";
  height?: number;
  weight?: number;
  hairColor?: string;
  eyeColor?: string;
  skinTone?: string;
  city: string;
  state: string;
  preferredContactTime: string;
  message?: string;
  consent: boolean;
  status:
    | "New Inquiry"
    | "Contact Attempted"
    | "Consultation Scheduled"
    | "Consultation Completed"
    | "Registration Pending"
    | "Registered"
    | "Rejected";
  adminNotes?: string;
  registrationId?: string; // Links inquiry to final registration
  statusHistory: {
    status: string;
    notes?: string;
    updatedBy?: string;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const DonorInquirySchema = new Schema<IDonorInquiry>(
  {
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    emailAddress: { type: String, required: true },
    gender: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    age: { type: Number },
    donationInterest: { type: String, enum: ["sperm", "egg"], required: true },
    height: { type: Number },
    weight: { type: Number },
    hairColor: { type: String },
    eyeColor: { type: String },
    skinTone: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    preferredContactTime: { type: String, required: true },
    message: { type: String },
    consent: { type: Boolean, required: true },
    status: {
      type: String,
      enum: [
        "New Inquiry",
        "Contact Attempted",
        "Consultation Scheduled",
        "Consultation Completed",
        "Registration Pending",
        "Registered",
        "Rejected",
      ],
      default: "New Inquiry",
    },
    adminNotes: { type: String, default: "" },
    registrationId: { type: String },
    statusHistory: [
      {
        status: { type: String, required: true },
        notes: { type: String },
        updatedBy: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const DonorInquiry =
  mongoose.models?.DonorInquiry ||
  mongoose.model<IDonorInquiry>("DonorInquiry", DonorInquirySchema);
