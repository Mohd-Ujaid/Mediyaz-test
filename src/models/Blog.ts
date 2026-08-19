import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  category: string;
  image?: string;
  status: "DRAFT" | "PUBLISHED";
  tags: string[];
  seoMetadata?: {
    title: string;
    description: string;
    keywords: string[];
  };
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "PUBLISHED" },
    tags: [{ type: String }],
    seoMetadata: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Blog = mongoose.models?.Blog || mongoose.model<IBlog>("Blog", BlogSchema);
