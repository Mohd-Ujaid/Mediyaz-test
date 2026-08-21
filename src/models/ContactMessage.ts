import mongoose, { Schema, Document } from "mongoose";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  message: string;
  status: "PENDING" | "REPLIED" | "COMPLETED";
  adminNotes?: string;
  replies?: {
    sender: "User" | "Admin";
    senderName?: string;
    message: string;
    createdAt: Date;
  }[];
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
    replies: [
      {
        sender: { type: String, enum: ["User", "Admin"], default: "User" },
        senderName: { type: String },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

if (mongoose.models && (mongoose.models as any).ContactMessage) {
  delete (mongoose.models as any).ContactMessage;
}
export const ContactMessage = mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
