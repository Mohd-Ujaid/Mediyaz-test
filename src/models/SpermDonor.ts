import mongoose from "mongoose";

const SpermDonorSchema = new mongoose.Schema({
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
    bloodGroup: { type: String, default: "" },
    medicalHistory: { type: String, default: "" },
    familyHistory: { type: String, default: "" },
    lifestyle: { type: String, default: "" }
  },
  profileInfo: {
    education: { type: String, default: "" },
    occupation: { type: String, default: "" },
    physicalCharacteristics: { type: String, default: "" },
    interests: { type: String, default: "" }
  },
  consentAgreed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["PENDING_REVIEW", "APPROVED", "MATCHED", "COMPLETED", "REJECTED"],
    default: "PENDING_REVIEW"
  },
  adminNotes: { type: String, default: "" }
}, { timestamps: true });

if (mongoose.models && mongoose.models.SpermDonor) {
  delete mongoose.models.SpermDonor;
}

export const SpermDonor = mongoose.model("SpermDonor", SpermDonorSchema);
