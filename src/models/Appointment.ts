import mongoose, { Schema, Document } from "mongoose";

export interface IAppointment extends Document {
  user: mongoose.Types.ObjectId; // Could be Donor or Recipient
  doctor: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"], 
      default: "SCHEDULED" 
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Appointment = mongoose.models?.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);
