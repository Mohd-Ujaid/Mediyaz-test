import mongoose, { Schema, Document } from "mongoose";

export interface IDonation extends Document {
  referenceId: string;
  donorDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  amount: number;
  purpose: string;
  message?: string;
  anonymous: boolean;
  status: "PENDING" | "VERIFIED" | "COMPLETED" | "CANCELLED";
  paymentInfo: {
    method: string;
    transactionId?: string;
    status: string;
  };
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    referenceId: { type: String, required: true, unique: true },
    donorDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
    },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    message: { type: String, default: "" },
    anonymous: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ["PENDING", "VERIFIED", "COMPLETED", "CANCELLED"], 
      default: "PENDING" 
    },
    paymentInfo: {
      method: { type: String, required: true },
      transactionId: { type: String, default: "" },
      status: { type: String, default: "PENDING" }
    },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Donation) {
  delete mongoose.models.Donation;
}
export const Donation = mongoose.model<IDonation>("Donation", DonationSchema);
