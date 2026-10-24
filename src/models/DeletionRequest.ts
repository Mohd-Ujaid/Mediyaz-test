import mongoose, { Schema, Document } from "mongoose";

export interface IDeletionRequest extends Document {
  resourceType: "DONOR" | "EGG_REGISTRATION" | "SPERM_REGISTRATION" | "HOSPITAL" | "INQUIRY" | "EMPLOYEE" | "USER" | "INVOICE" | "OTHER";
  resourceId: string;
  resourceTitle: string;
  reason: string;
  requestedBy: mongoose.Types.ObjectId;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeletionRequestSchema = new Schema<IDeletionRequest>(
  {
    resourceType: { type: String, required: true },
    resourceId: { type: String, required: true },
    resourceTitle: { type: String, required: true },
    reason: { type: String, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

DeletionRequestSchema.index({ status: 1, createdAt: -1 });

export const DeletionRequest =
  mongoose.models?.DeletionRequest ||
  mongoose.model<IDeletionRequest>("DeletionRequest", DeletionRequestSchema);
