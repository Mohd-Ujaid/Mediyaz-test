import mongoose, { Schema, Document } from "mongoose";

export interface IPricingSnapshot {
  donorDealPrice: number;
  profiledonorDealPrice: number;
  eggDonorDealPrice?: number;
  eggProfileDonorDealPrice?: number;
  spermDonorDealPrice?: number;
  spermProfileDonorDealPrice?: number;
  serviceCharge?: number;
  currency: string;
  changedBy: string;
  changedAt: Date;
}

export interface ITreatingDoctor {
  _id?: any;
  name: string;
  specialization?: string; // e.g. "Senior IVF Consultant", "Embryologist", "Gynecologist"
  phone?: string;
  email?: string;
  regNumber?: string;
  isPrimary?: boolean;
  status?: "ACTIVE" | "INACTIVE";
}

export interface IHospitalBranch {
  _id?: any;
  branchName: string;
  branchCode?: string;
  registrationNumber?: string;
  gstNumber?: string;
  contactPerson?: string;
  email?: string;
  mobileNumber?: string;
  telephone?: string;
  doctorName?: string;
  doctors?: ITreatingDoctor[];
  pickupLocation?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  isMainBranch?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  // Financial info per branch
  eggDonorDealPrice?: number;
  eggProfileDonorDealPrice?: number;
  spermDonorDealPrice?: number;
  spermProfileDonorDealPrice?: number;
  serviceCharge?: number;
  tdsPercentage?: number;
  wantInvoice?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHospital extends Document {
  name: string;
  address: string;
  contactInfo: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED";

  // Basic Information
  shortName: string;
  registrationNumber?: string;
  gstNumber?: string;
  doctorName?: string;
  doctors?: ITreatingDoctor[];
  pickupLocation?: string;
  wantInvoice?: boolean;
  tdsPercentage?: number;

  // Contact
  contactPerson?: string;
  email?: string;
  mobileNumber?: string;
  telephone?: string;
  emergencyNumber?: string;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Medical Information
  hospitalType: string; // e.g. "Public", "Private", "Trust"
  specializations: string[];

  // Branches
  branches: IHospitalBranch[];

  // Pricing & Financials (Admin Only)
  donorDealPrice: number;
  profiledonorDealPrice: number;
  eggDonorDealPrice: number;
  eggProfileDonorDealPrice: number;
  spermDonorDealPrice: number;
  spermProfileDonorDealPrice: number;
  serviceCharge: number;
  currency: string;
  pricingHistory: IPricingSnapshot[];

  createdAt: Date;
  updatedAt: Date;
}

const PricingSnapshotSchema = new Schema<IPricingSnapshot>(
  {
    donorDealPrice: { type: Number, required: true },
    profiledonorDealPrice: { type: Number, required: true },
    eggDonorDealPrice: { type: Number, default: 65000 },
    eggProfileDonorDealPrice: { type: Number, default: 85000 },
    spermDonorDealPrice: { type: Number, default: 15000 },
    spermProfileDonorDealPrice: { type: Number, default: 25000 },
    serviceCharge: { type: Number, default: 5000 },
    currency: { type: String, default: "INR" },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const TreatingDoctorSchema = new Schema<ITreatingDoctor>(
  {
    name: { type: String, required: true },
    specialization: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    regNumber: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
  },
  { _id: true, timestamps: true }
);

const HospitalBranchSchema = new Schema<IHospitalBranch>(
  {
    branchName: { type: String, required: true },
    branchCode: { type: String, default: "" },
    registrationNumber: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    telephone: { type: String, default: "" },
    doctorName: { type: String, default: "" },
    doctors: { type: [TreatingDoctorSchema], default: [] },
    pickupLocation: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    pincode: { type: String, default: "" },
    isMainBranch: { type: Boolean, default: false },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    eggDonorDealPrice: { type: Number, default: 65000 },
    eggProfileDonorDealPrice: { type: Number, default: 85000 },
    spermDonorDealPrice: { type: Number, default: 15000 },
    spermProfileDonorDealPrice: { type: Number, default: 25000 },
    serviceCharge: { type: Number, default: 5000 },
    tdsPercentage: { type: Number, default: 2 },
    wantInvoice: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const HospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true, unique: true },
    address: { type: String, default: "" },
    contactInfo: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"], default: "ACTIVE" },

    // Basic
    shortName: { type: String, required: true },
    registrationNumber: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    doctorName: { type: String, default: "" },
    doctors: { type: [TreatingDoctorSchema], default: [] },
    pickupLocation: { type: String, default: "" },
    wantInvoice: { type: Boolean, default: true },
    tdsPercentage: { type: Number, default: 2 },

    // Contact
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    telephone: { type: String, default: "" },
    emergencyNumber: { type: String, default: "" },

    // Address
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    pincode: { type: String, default: "" },

    // Medical
    hospitalType: { type: String, required: true },
    specializations: { type: [String], default: [] },

    // Branches
    branches: { type: [HospitalBranchSchema], default: [] },

    // Pricing
    eggDonorDealPrice: { type: Number, required: true, default: 65000 },
    eggProfileDonorDealPrice: { type: Number, required: true, default: 85000 },
    spermDonorDealPrice: { type: Number, required: true, default: 15000 },
    spermProfileDonorDealPrice: { type: Number, required: true, default: 25000 },
    serviceCharge: { type: Number, required: true, default: 5000 },

    donorDealPrice: { type: Number, required: true, default: 65000 },
    profiledonorDealPrice: { type: Number, required: true, default: 85000 },
    currency: { type: String, required: true, default: "INR" },
    pricingHistory: { type: [PricingSnapshotSchema], default: [] }
  },
  { timestamps: true }
);

HospitalSchema.pre("save", function () {
  // If hospital has branches, synchronize main branch (or first branch) to top-level legacy fields
  if (Array.isArray(this.branches) && this.branches.length > 0) {
    const mainBranch = this.branches.find((b: any) => b.isMainBranch) || this.branches[0];
    if (mainBranch) {
      if (mainBranch.registrationNumber) this.registrationNumber = mainBranch.registrationNumber;
      if (mainBranch.gstNumber !== undefined) this.gstNumber = mainBranch.gstNumber;
      if (mainBranch.doctorName !== undefined) this.doctorName = mainBranch.doctorName;
      if (Array.isArray(mainBranch.doctors) && mainBranch.doctors.length > 0) {
        this.doctors = mainBranch.doctors;
        const primaryDoc = mainBranch.doctors.find((d: any) => d.isPrimary) || mainBranch.doctors[0];
        if (primaryDoc) this.doctorName = primaryDoc.name;
      }
      if (mainBranch.contactPerson) this.contactPerson = mainBranch.contactPerson;
      if (mainBranch.email) this.email = mainBranch.email;
      if (mainBranch.mobileNumber) this.mobileNumber = mainBranch.mobileNumber;
      if (mainBranch.telephone !== undefined) this.telephone = mainBranch.telephone;
      if (mainBranch.pickupLocation !== undefined) this.pickupLocation = mainBranch.pickupLocation;
      if (mainBranch.addressLine1) this.addressLine1 = mainBranch.addressLine1;
      if (mainBranch.addressLine2 !== undefined) this.addressLine2 = mainBranch.addressLine2;
      if (mainBranch.city) this.city = mainBranch.city;
      if (mainBranch.state) this.state = mainBranch.state;
      if (mainBranch.pincode) this.pincode = mainBranch.pincode;
      if (mainBranch.country) this.country = mainBranch.country;
    }
  }

  // If doctors array exists on top-level and doctorName is empty, populate doctorName
  if (Array.isArray(this.doctors) && this.doctors.length > 0 && !this.doctorName) {
    const primaryDoc = this.doctors.find((d: any) => d.isPrimary) || this.doctors[0];
    if (primaryDoc) this.doctorName = primaryDoc.name;
  }

  this.address = `${this.addressLine1 || ""}, ${this.addressLine2 || ""}, ${this.city || ""}, ${this.state || ""} - ${this.pincode || ""}, ${this.country || "India"}`.replace(/^[,\s]+|[,\s]+$/g, "").replace(/\s*,\s*,/g, ",");
  this.contactInfo = `${this.contactPerson || ""} (${this.email || ""}, Mob: ${this.mobileNumber || ""})`;

  // Keep legacy fields synchronized
  if (this.eggDonorDealPrice !== undefined && this.eggDonorDealPrice !== null) {
    this.donorDealPrice = this.eggDonorDealPrice;
  } else if (this.donorDealPrice !== undefined && this.donorDealPrice !== null) {
    this.eggDonorDealPrice = this.donorDealPrice;
  }
  if (this.eggProfileDonorDealPrice !== undefined && this.eggProfileDonorDealPrice !== null) {
    this.profiledonorDealPrice = this.eggProfileDonorDealPrice;
  } else if (this.profiledonorDealPrice !== undefined && this.profiledonorDealPrice !== null) {
    this.eggProfileDonorDealPrice = this.profiledonorDealPrice;
  }
});

if (mongoose.models && mongoose.models.Hospital) {
  delete (mongoose.models as any).Hospital;
}

export const Hospital = mongoose.model<IHospital>("Hospital", HospitalSchema);

