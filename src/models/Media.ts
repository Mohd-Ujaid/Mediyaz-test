import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
  fileId: string;
  url: string;
  path?: string;
  fileType?: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  folder: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    fileId: { type: String, required: true },
    url: { type: String, required: true },
    path: { type: String },
    fileType: { type: String },
    fileName: { type: String, required: true },
    folder: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Media = mongoose.models?.Media || mongoose.model<IMedia>("Media", MediaSchema);
