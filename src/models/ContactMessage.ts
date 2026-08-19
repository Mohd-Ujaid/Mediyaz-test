import mongoose, { Schema, Document } from "mongoose";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  message: string;
  status: "PENDING" | "REPLIED" | "COMPLETED";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "REPLIED", "COMPLETED"], default: "PENDING" },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.models?.ContactMessage || mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
