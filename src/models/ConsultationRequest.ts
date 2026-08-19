import mongoose from "mongoose";

const ConsultationRequestSchema = new mongoose.Schema({
  referenceId: { type: String, required: true, unique: true },
  personalDetails: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number },
    country: { type: String, default: "" },
    city: { type: String, default: "" }
  },
  medicalInfo: {
    fertilityConcern: { type: String, default: "" },
    previousTreatments: { type: String, default: "" },
    medicalHistory: { type: String, default: "" },
    preferredTreatment: { type: String, default: "" },
    additionalNotes: { type: String, default: "" }
  },
  appointmentDetails: {
    preferredDate: { type: Date },
    preferredTime: { type: String, default: "" },
    consultationType: { type: String, default: "In-Clinic" } // In-Clinic, Virtual, Phone
  },
  status: {
    type: String,
    enum: ["NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CANCELLED"],
    default: "NEW"
  },
  adminNotes: { type: String, default: "" }
}, { timestamps: true });

if (mongoose.models && mongoose.models.ConsultationRequest) {
  delete mongoose.models.ConsultationRequest;
}

export const ConsultationRequest = mongoose.model("ConsultationRequest", ConsultationRequestSchema);
