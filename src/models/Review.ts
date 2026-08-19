import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  name: string;
  rating: number;
  review: string;
  approved: boolean;
  title?: string;
  treatment?: string;
  imageUrl?: string;
  videoUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true },
    approved: { type: Boolean, default: false },
    title: { type: String },
    treatment: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    imageUrls: { type: [String], default: [] },
    videoUrls: { type: [String], default: [] },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Review) {
  delete mongoose.models.Review;
}

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
