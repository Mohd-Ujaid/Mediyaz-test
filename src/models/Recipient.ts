import mongoose, { Schema, Document } from "mongoose";

export interface IRecipient extends Document {
  user: mongoose.Types.ObjectId;
  personalInformation: {
    dateOfBirth: Date;
    gender: string;
    nationality: string;
    address: string;
  };
  medicalHistory: string;
  fertilityInformation: string;
  preferences: string;
  appointments: mongoose.Types.ObjectId[];
  treatmentStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED";
  createdAt: Date;
  updatedAt: Date;
}

const RecipientSchema = new Schema<IRecipient>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    personalInformation: {
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, required: true },
      nationality: { type: String, required: true },
      address: { type: String, required: true },
    },
    medicalHistory: { type: String },
    fertilityInformation: { type: String },
    preferences: { type: String },
    appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
    treatmentStatus: { 
      type: String, 
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PAUSED"], 
      default: "NOT_STARTED" 
    },
  },
  { timestamps: true }
);

export const Recipient = mongoose.models?.Recipient || mongoose.model<IRecipient>("Recipient", RecipientSchema);
