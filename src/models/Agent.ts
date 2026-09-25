import mongoose, { Schema, Document } from "mongoose";

export interface IAgent extends Document {
  agentCode: string; // Unique Refer Code/ID
  referName?: string; // Unique human-friendly refer name, e.g. "PRIYASHARMA"
  fullName: string;
  mobileNumber: string;
  email?: string;
  agencyName?: string;
  city?: string;
  state?: string;
  password?: string; // Hashed password/PIN for partner portal login
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  commissionRates: {
    eggDonorCommission: number; // e.g. 5000 (INR)
    spermDonorCommission: number; // e.g. 2000 (INR)
  };
  bankDetails: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  stats: {
    totalEggDonors: number;
    totalSpermDonors: number;
    approvedDonors: number;
    totalEarnings: number;
    pendingPayout: number;
    paidPayout: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    agentCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    referName: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    agencyName: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"],
      default: "ACTIVE",
    },
    commissionRates: {
      eggDonorCommission: {
        type: Number,
        default: 5000,
      },
      spermDonorCommission: {
        type: Number,
        default: 2000,
      },
    },
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
    stats: {
      totalEggDonors: { type: Number, default: 0 },
      totalSpermDonors: { type: Number, default: 0 },
      approvedDonors: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      pendingPayout: { type: Number, default: 0 },
      paidPayout: { type: Number, default: 0 },
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Agent =
  mongoose.models?.Agent || mongoose.model<IAgent>("Agent", AgentSchema);
