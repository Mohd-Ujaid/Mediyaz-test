import mongoose, { Schema, Document } from "mongoose";
import { IArtDonor } from "./ArtDonor";

export interface IArtEggDonor extends IArtDonor {}

const ArtEggDonorSchema = new Schema<IArtEggDonor>(
  {
    donorCode: { type: String, required: true, unique: true, index: true },
    gameteType: { type: String, default: "egg", index: true },
    availability: {
      type: String,
      enum: ["available", "quarantine", "allocated"],
      default: "available",
      index: true,
    },
    availabilityLabel: { type: String, default: "Available Immediately (Vitrified)" },
    age: { type: Number, required: true, min: 21, max: 35 },
    bloodType: { type: String, required: true, index: true },
    rhFactor: { type: String, enum: ["Positive", "Negative"], default: "Positive" },
    heightCm: { type: Number, required: true, index: true },
    heightFormatted: { type: String, required: true },
    weightKg: { type: Number, required: true },
    bmi: { type: Number, required: true },
    eyeColor: { type: String, required: true, index: true },
    hairColor: { type: String, required: true, index: true },
    hairTexture: { type: String, default: "Straight" },
    skinTone: { type: String, required: true, index: true },
    bodyBuild: { type: String, default: "Medium / Average" },
    ethnicity: { type: String, required: true, index: true },
    ancestryRegion: { type: String, default: "North Indian" },
    husbandName: { type: String, default: "" },
    husbandOccupation: { type: String, default: "" },
    state: { type: String, default: "", index: true },
    city: { type: String, default: "", index: true },
    religion: { type: String, default: "Hindu" },
    motherTongue: { type: String, default: "Hindi" },
    languages: { type: [String], default: ["Hindi", "English"] },
    educationLevel: { type: String, default: "Bachelor's Degree", index: true },
    degree: { type: String, required: true },
    profession: { type: String, required: true },
    provenFertility: { type: String, default: "Mother of 1 healthy child (3 years old)" },
    livingChildren: { type: Number, default: 1 },
    abortion: { type: Number, default: 0 },
    talents: { type: [String], default: [] },
    hobbies: { type: [String], default: [] },
    donorStatement: { type: String, default: "" },
    avatarColor: { type: String, default: "#ff7468" },
    viralMarkers: {
      hiv: { type: String, default: "Non-Reactive" },
      hbsAg: { type: String, default: "Non-Reactive" },
      hcv: { type: String, default: "Non-Reactive" },
      vdrl: { type: String, default: "Non-Reactive" },
    },
    geneticScreenings: {
      thalassemia: {
        status: { type: String, default: "Negative (Normal HbA2 <3.5%)" },
        method: { type: String, default: "HPLC (High Performance Liquid Chromatography)" },
        hba2Fraction: { type: String, default: "2.4%" },
      },
      karyotype: {
        result: { type: String, default: "46,XX (Normal Female)" },
        bands: { type: String, default: "550 Bands G-Banding" },
        resolution: { type: String, default: "Normal Cytogenetic Structure" },
      },
      sma: { type: String, default: "Negative / Non-Carrier" },
      cysticFibrosis: { type: String, default: "Negative" },
      g6pd: { type: String, default: "Normal Activity" },
    },
    familyPedigree: {
      maternalGrandparents: { type: String, default: "Healthy with no history of hereditary disorders." },
      paternalGrandparents: { type: String, default: "Good cardiovascular health and longevity." },
      parents: { type: String, default: "Both parents active and healthy." },
      siblings: { type: String, default: "Siblings healthy with no chronic diseases." },
    },
    statutoryCompliance: {
      artActRegistered: { type: Boolean, default: true },
      rule13InsuranceActive: { type: Boolean, default: true },
      lifetimeDonationLimitCompliant: { type: Boolean, default: true },
      registryToken: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    collection: "art_egg_donors",
  }
);

export const ArtEggDonor =
  mongoose.models?.ArtEggDonor || mongoose.model<IArtEggDonor>("ArtEggDonor", ArtEggDonorSchema);
