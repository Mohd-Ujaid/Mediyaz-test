import mongoose, { Schema, Document } from "mongoose";

export interface IArtDonor extends Document {
  donorCode: string;
  gameteType: "egg" | "sperm";
  availability: "available" | "quarantine" | "allocated";
  availabilityLabel: string;
  age: number;
  bloodType: string;
  rhFactor: "Positive" | "Negative";
  heightCm: number;
  heightFormatted: string;
  weightKg: number;
  bmi: number;
  eyeColor: string;
  hairColor: string;
  hairTexture: string;
  skinTone: string;
  bodyBuild?: string;
  ethnicity: string;
  ancestryRegion: string;
  husbandName?: string;
  husbandOccupation?: string;
  state?: string;
  city?: string;
  religion: string;
  motherTongue: string;
  languages: string[];
  educationLevel: string;
  degree: string;
  profession: string;
  provenFertility: string;
  livingChildren: number;
  abortion: number;
  talents?: string[];
  hobbies?: string[];
  donorStatement?: string;
  avatarColor?: string;
  viralMarkers: {
    hiv: string;
    hbsAg: string;
    hcv: string;
    vdrl: string;
  };
  geneticScreenings?: {
    thalassemia?: {
      status: string;
      method?: string;
      hba2Fraction?: string;
    };
    karyotype?: {
      result: string;
      bands?: string;
      resolution?: string;
    };
    sma?: string;
    cysticFibrosis?: string;
    g6pd?: string;
    infectiousSerology?: {
      hiv: string;
      hbsAg: string;
      hcv: string;
      vdrl: string;
      chlamydiaPcr?: string;
      cmv?: string;
    };
  };
  familyPedigree: {
    maternalGrandparents: string;
    paternalGrandparents: string;
    parents: string;
    siblings: string;
  };
  statutoryCompliance: {
    artActRegistered: boolean;
    rule13InsuranceActive: boolean;
    lifetimeDonationLimitCompliant: boolean;
    registryToken: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ArtDonorSchema = new Schema<IArtDonor>(
  {
    donorCode: { type: String, required: true, unique: true, index: true },
    gameteType: { type: String, enum: ["egg", "sperm"], required: true, index: true },
    availability: {
      type: String,
      enum: ["available", "quarantine", "allocated"],
      default: "available",
      index: true,
    },
    availabilityLabel: { type: String, default: "Available Immediately (Vitrified)" },
    age: { type: Number, required: true, min: 18, max: 55 },
    bloodType: { type: String, required: true, index: true },
    rhFactor: { type: String, enum: ["Positive", "Negative"], default: "Positive" },
    heightCm: { type: Number, required: true },
    heightFormatted: { type: String, required: true },
    weightKg: { type: Number, required: true },
    bmi: { type: Number, required: true },
    eyeColor: { type: String, required: true },
    hairColor: { type: String, required: true },
    hairTexture: { type: String, default: "Straight" },
    skinTone: { type: String, required: true },
    bodyBuild: { type: String, default: "Slender / Athletic" },
    ethnicity: { type: String, required: true },
    ancestryRegion: { type: String, default: "North Indian" },
    husbandName: { type: String, default: "" },
    husbandOccupation: { type: String, default: "" },
    state: { type: String, default: "", index: true },
    city: { type: String, default: "", index: true },
    religion: { type: String, default: "Hindu" },
    motherTongue: { type: String, required: true },
    languages: { type: [String], default: [] },
    educationLevel: { type: String, default: "Bachelor's Degree" },
    degree: { type: String, required: true },
    profession: { type: String, required: true },
    provenFertility: { type: String, default: "Verified fertile" },
    livingChildren: { type: Number, default: 0 },
    abortion: { type: Number, default: 0 },
    talents: { type: [String], default: [] },
    hobbies: { type: [String], default: [] },
    donorStatement: { type: String, default: "" },
    avatarColor: { type: String, default: "#285b63" },
    viralMarkers: {
      hiv: { type: String, default: "Non-Reactive" },
      hbsAg: { type: String, default: "Non-Reactive" },
      hcv: { type: String, default: "Non-Reactive" },
      vdrl: { type: String, default: "Non-Reactive" },
    },
    geneticScreenings: {
      thalassemia: {
        status: { type: String, default: "Negative" },
        method: { type: String, default: "Automated Cation-Exchange HPLC" },
        hba2Fraction: { type: String, default: "2.4% (Normal Reference: <3.5%)" },
      },
      karyotype: {
        result: { type: String, default: "46,XX (Normal Female Karyotype)" },
        bands: { type: String, default: "550-Band Resolution" },
        resolution: { type: String, default: "No structural or numerical aberrations detected" },
      },
      sma: { type: String, default: "Non-Carrier" },
      cysticFibrosis: { type: String, default: "Non-Carrier" },
      g6pd: { type: String, default: "Normal" },
      infectiousSerology: {
        hiv: { type: String, default: "Non-Reactive" },
        hbsAg: { type: String, default: "Non-Reactive" },
        hcv: { type: String, default: "Non-Reactive" },
        vdrl: { type: String, default: "Non-Reactive" },
        chlamydiaPcr: { type: String, default: "Negative" },
        cmv: { type: String, default: "IgG Positive, IgM Negative (Low Risk)" },
      },
    },
    familyPedigree: {
      maternalGrandparents: { type: String, default: "No hereditary disorders." },
      paternalGrandparents: { type: String, default: "Good cardiovascular health." },
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
    collection: "art_donors",
  }
);

export const ArtDonor =
  mongoose.models?.ArtDonor || mongoose.model<IArtDonor>("ArtDonor", ArtDonorSchema);
