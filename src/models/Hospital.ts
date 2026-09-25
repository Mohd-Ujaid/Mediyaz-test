import mongoose, { Schema, Document } from "mongoose";

export interface IPricingSnapshot {
  donorDealPrice: number;
  profiledonorDealPrice: number;
  // serviceCharge: number;
  // processingFee: number;
  // registrationFee: number;
  // commission: number;
  // additionalCharges: number;
  currency: string;
  changedBy: string;
  changedAt: Date;
}

export interface IHospital extends Document {
  name: string;
  address: string;
  contactInfo: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED";

  // Basic Information
  shortName: string;
  // code: string;
  registrationNumber: string;
  // licenseNumber: string;
  gstNumber?: string;
  // panNumber?: string;

  // Contact
  contactPerson: string;
  email: string;
  mobileNumber: string;
  telephone?: string;
  emergencyNumber?: string;

  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;

  // Medical Information
  hospitalType: string; // e.g. "Public", "Private", "Trust"
  specializations: string[];
  // organTypesSupported: string[];
  // icuAvailability: boolean;
  // transplantLicenseNumber: string;

  // Pricing & Financials (Admin Only)
  donorDealPrice: number;
  profiledonorDealPrice: number;
  // serviceCharge: number;
  // processingFee: number;
  // registrationFee: number;
  // commission: number;
  // additionalCharges: number;
  currency: string;
  pricingHistory: IPricingSnapshot[];

  createdAt: Date;
  updatedAt: Date;
}

const PricingSnapshotSchema = new Schema<IPricingSnapshot>(
  {
    donorDealPrice: { type: Number, required: true },
    profiledonorDealPrice: { type: Number, required: true },
    // serviceCharge: { type: Number, required: true },
    // processingFee: { type: Number, required: true },
    // registrationFee: { type: Number, required: true },
    // commission: { type: Number, required: true },
    // additionalCharges: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const HospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true, unique: true },
    address: { type: String }, // Pre-save hook populated
    contactInfo: { type: String }, // Pre-save hook populated
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"], default: "ACTIVE" },

    // Basic
    shortName: { type: String, required: true },
    // code: { type: String, required: true, unique: true },
    registrationNumber: { type: String, required: true },
    // licenseNumber: { type: String, required: true },
    gstNumber: { type: String, default: "" },
    // panNumber: { type: String, default: "" },

    // Contact
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    telephone: { type: String, default: "" },
    emergencyNumber: { type: String, default: "" },

    // Address
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    pincode: { type: String, required: true },

    // Medical
    hospitalType: { type: String, required: true },
    specializations: { type: [String], default: [] },
    // organTypesSupported: { type: [String], default: [] },
    // icuAvailability: { type: Boolean, default: false },
    // transplantLicenseNumber: { type: String, required: true },

    // Pricing
    donorDealPrice: { type: Number, required: true, default: 0 },
    profiledonorDealPrice: { type: Number, required: true, default: 0 },
    // serviceCharge: { type: Number, required: true, default: 0 },
    // processingFee: { type: Number, required: true, default: 0 },
    // registrationFee: { type: Number, required: true, default: 0 },
    // commission: { type: Number, required: true, default: 0 },
    // additionalCharges: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "INR" },
    pricingHistory: { type: [PricingSnapshotSchema], default: [] }
  },
  { timestamps: true }
);

HospitalSchema.pre("save", function () {
  this.address = `${this.addressLine1 || ""}, ${this.addressLine2 || ""}, ${this.city || ""}, ${this.state || ""} - ${this.pincode || ""}, ${this.country || ""}`.replace(/^[,\s]+|[,\s]+$/g, "").replace(/\s*,\s*,/g, ",");
  this.contactInfo = `${this.contactPerson || ""} (${this.email || ""}, Mob: ${this.mobileNumber || ""})`;
});

if (mongoose.models && mongoose.models.Hospital) {
  delete (mongoose.models as any).Hospital;
}

export const Hospital = mongoose.model<IHospital>("Hospital", HospitalSchema);
