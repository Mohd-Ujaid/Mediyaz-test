import mongoose from "mongoose";

const EggDonorSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true },
  personalInfo: {
    fullName: { type: String, required: true },
    dateOfBirth: { type: String, default: "" },
    age: { type: Number },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, default: "" }
  },
  healthInfo: {
    height: { type: String, default: "" },
    weight: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    medicalHistory: { type: String, default: "" },
    familyMedicalHistory: { type: String, default: "" },
    lifestyle: { type: String, default: "" }
  },
  additionalInfo: {
    education: { type: String, default: "" },
    interests: { type: String, default: "" },
    languages: { type: String, default: "" },
    previousPregnancy: { type: String, default: "" }
  },
  consentAgreed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["PENDING_REVIEW", "APPROVED", "MATCHED", "COMPLETED", "REJECTED"],
    default: "PENDING_REVIEW"
  },
  adminNotes: { type: String, default: "" }
}, { timestamps: true });

if (mongoose.models && mongoose.models.EggDonor) {
  delete mongoose.models.EggDonor;
}

export const EggDonor = mongoose.model("EggDonor", EggDonorSchema);
