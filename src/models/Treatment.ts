import mongoose from "mongoose";

const TreatmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // IVF, IUI, ICSI, Egg Freezing, etc.
  procedureDetails: { type: String, default: "" },
  benefits: [{ type: String }],
  eligibility: { type: String, default: "" },
  duration: { type: String, default: "" },
  costInfo: { type: String, default: "" },
  image: { type: String, default: "" },
  status: { type: String, enum: ["ENABLED", "DISABLED"], default: "ENABLED" }
}, { timestamps: true });

if (mongoose.models && mongoose.models.Treatment) {
  delete mongoose.models.Treatment;
}

export const Treatment = mongoose.model("Treatment", TreatmentSchema);
