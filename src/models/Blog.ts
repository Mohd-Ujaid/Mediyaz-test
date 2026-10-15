import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  category: string;
  image?: string;
  coverImage?: string;
  excerpt?: string;
  readTime?: string;
  status: "DRAFT" | "PUBLISHED";
  published: boolean;
  publishedAt?: Date;
  tags: string[];
  seoMetadata?: {
    title: string;
    description: string;
    keywords: string[];
  };
  author: any;
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
    coverImage: { type: String },
    excerpt: { type: String },
    readTime: { type: String, default: "5 min read" },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "PUBLISHED" },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
    seoMetadata: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
    },
    author: { type: Schema.Types.Mixed, default: "Mediyaz Clinical Board" },
  },
  { timestamps: true }
);

export const Blog = mongoose.models?.Blog || mongoose.model<IBlog>("Blog", BlogSchema);
