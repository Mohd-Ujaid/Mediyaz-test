import mongoose, { Schema, Document } from "mongoose";

export interface IDonorRequest extends Document {
  recipient: mongoose.Types.ObjectId;
  donor: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  age: number;
  bloodGroup: string;
  contactNumber: string;
  medicalCondition?: string;
  message?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

const DonorRequestSchema = new Schema<IDonorRequest>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: false },
    donor: { type: Schema.Types.ObjectId, ref: "Donor", required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: Number, required: true },
    bloodGroup: { type: String, required: true },
    contactNumber: { type: String, required: true },
    medicalCondition: { type: String, default: "" },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

export const DonorRequest = mongoose.models?.DonorRequest || mongoose.model<IDonorRequest>("DonorRequest", DonorRequestSchema);
