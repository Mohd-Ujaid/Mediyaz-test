import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "./User";

export interface IInvitation extends Document {
  email: string;
  role: UserRole;
  designation?: string;
  department?: string;
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    designation: { type: String },
    department: { type: String, default: "Clinical Operations" },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "REVOKED"], default: "PENDING" },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

InvitationSchema.index({ email: 1, status: 1 });
InvitationSchema.index({ token: 1 }, { unique: true });

export const Invitation =
  mongoose.models?.Invitation || mongoose.model<IInvitation>("Invitation", InvitationSchema);
