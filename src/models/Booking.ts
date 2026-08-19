import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  referenceId: string;
  customerDetails: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  serviceDetails: {
    serviceId: string;
    serviceTitle: string;
    preferredDate: Date;
    preferredTime: string;
    additionalRequirements?: string;
    notes?: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    referenceId: { type: String, required: true, unique: true },
    customerDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },
    serviceDetails: {
      serviceId: { type: String, required: true },
      serviceTitle: { type: String, required: true },
      preferredDate: { type: Date, required: true },
      preferredTime: { type: String, required: true },
      additionalRequirements: { type: String },
      notes: { type: String },
    },
    status: { 
      type: String, 
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"], 
      default: "PENDING" 
    },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Booking = mongoose.models?.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
