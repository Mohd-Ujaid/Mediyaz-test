import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClinicPaymentAllocation {
  registrationId: string;
  donorType: "egg" | "sperm";
  donorName?: string;
  invoiceNumber?: string;
  billRef?: string;
  grossAmount: number;
  tdsAmount: number;
  netAmount: number;
  allocatedAt?: Date;
}

export interface IClinicPayment extends Document {
  paymentNo: string;
  hospital: mongoose.Types.ObjectId;
  hospitalName?: string;
  branch?: string;
  branchId?: string;
  amount: number;
  totalGrossSettled: number;
  totalTdsDeducted: number;
  netReceived: number;
  unallocatedAmount: number; // advance/credit for clinic
  date: Date;
  financialYear: string; // e.g. "2026-27"
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  paymentMode: "bank_transfer" | "upi" | "cheque" | "cash" | "other";
  reference: string;
  tdsSection?: string;
  notes?: string;
  allocations: IClinicPaymentAllocation[];
  isVoided: boolean;
  voidedAt?: Date | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicPaymentAllocationSchema = new Schema<IClinicPaymentAllocation>(
  {
    registrationId: { type: String, required: true },
    donorType: { type: String, enum: ["egg", "sperm"], required: true },
    donorName: { type: String, default: "" },
    invoiceNumber: { type: String, default: "" },
    billRef: { type: String, default: "" },
    grossAmount: { type: Number, required: true, default: 0 },
    tdsAmount: { type: Number, default: 0 },
    netAmount: { type: Number, required: true, default: 0 },
    allocatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ClinicPaymentSchema = new Schema<IClinicPayment>(
  {
    paymentNo: { type: String, required: true, unique: true, index: true },
    hospital: { type: Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    hospitalName: { type: String, default: "" },
    branch: { type: String, default: "" },
    branchId: { type: String, default: "" },
    amount: { type: Number, required: true, default: 0 },
    totalGrossSettled: { type: Number, default: 0 },
    totalTdsDeducted: { type: Number, default: 0 },
    netReceived: { type: Number, default: 0 },
    unallocatedAmount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now, index: true },
    financialYear: { type: String, default: "", index: true },
    quarter: { type: String, enum: ["Q1", "Q2", "Q3", "Q4"], default: "Q1", index: true },
    paymentMode: {
      type: String,
      enum: ["bank_transfer", "upi", "cheque", "cash", "other"],
      default: "bank_transfer",
    },
    reference: { type: String, default: "", index: true },
    tdsSection: { type: String, default: "194J" },
    notes: { type: String, default: "" },
    allocations: { type: [ClinicPaymentAllocationSchema], default: [] },
    isVoided: { type: Boolean, default: false, index: true },
    voidedAt: { type: Date, default: null },
    voidedBy: { type: String, default: null },
    voidReason: { type: String, default: null },
    recordedBy: { type: String, default: "Admin" },
  },
  {
    timestamps: true,
    collection: "clinic_payments",
  }
);

// Indexes for fast reports and search
ClinicPaymentSchema.index({ hospital: 1, date: -1 });
ClinicPaymentSchema.index({ financialYear: 1, quarter: 1 });
ClinicPaymentSchema.index({ isVoided: 1, date: -1 });

export const ClinicPayment: Model<IClinicPayment> =
  mongoose.models.ClinicPayment ||
  mongoose.model<IClinicPayment>("ClinicPayment", ClinicPaymentSchema);
