import mongoose, { Schema, Document } from "mongoose";

export interface IAffidavitTemplate extends Document {
  name: string;
  fileId: string; // DOCX fileId
  pdfFileId?: string; // PDF fileId
  url: string; // DOCX URL
  pdfUrl: string; // Converted PDF URL
  version: string;
  isActive: boolean;
  donorType: "sperm" | "egg";
  createdAt: Date;
  updatedAt: Date;
}

const AffidavitTemplateSchema = new Schema<IAffidavitTemplate>(
  {
    name: { type: String, required: true },
    fileId: { type: String, required: true },
    pdfFileId: { type: String },
    url: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    version: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    donorType: { type: String, enum: ["sperm", "egg"], required: true },
  },
  { timestamps: true }
);

export const AffidavitTemplate =
  mongoose.models?.AffidavitTemplate ||
  mongoose.model<IAffidavitTemplate>("AffidavitTemplate", AffidavitTemplateSchema);
