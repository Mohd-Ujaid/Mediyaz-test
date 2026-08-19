import mongoose, { Schema, Document } from "mongoose";

export interface IBloodRequest extends Document {
  user: mongoose.Types.ObjectId; // References User who made the request
  bloodGroup: string;
  units: number;
  hospitalName: string;
  contactPhone: string;
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  requiredDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true, default: 1 },
    hospitalName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    urgency: { type: String, enum: ["NORMAL", "URGENT", "CRITICAL"], default: "NORMAL" },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    requiredDate: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const BloodRequest = mongoose.models?.BloodRequest || mongoose.model<IBloodRequest>("BloodRequest", BloodRequestSchema);
