import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITdsCertificate extends Document {
  hospital: mongoose.Types.ObjectId;
  hospitalName?: string;
  financialYear: string; // e.g. "2026-27"
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  certificateNo: string; // Form 16A Certificate Number
  tdsAmountAsPerCert: number;
  tdsDeductedInSystem?: number; // snapshot or calculated
  differenceAmount?: number;
  status: "MATCHED" | "SHORT" | "SURPLUS" | "PENDING";
  receivedOn?: Date;
  fileUrl?: string;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TdsCertificateSchema = new Schema<ITdsCertificate>(
  {
    hospital: { type: Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
    hospitalName: { type: String, default: "" },
    financialYear: { type: String, required: true, index: true },
    quarter: { type: String, enum: ["Q1", "Q2", "Q3", "Q4"], required: true, index: true },
    certificateNo: { type: String, default: "", trim: true },
    tdsAmountAsPerCert: { type: Number, required: true, default: 0 },
    tdsDeductedInSystem: { type: Number, default: 0 },
    differenceAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["MATCHED", "SHORT", "SURPLUS", "PENDING"],
      default: "PENDING",
    },
    receivedOn: { type: Date, default: Date.now },
    fileUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    recordedBy: { type: String, default: "Admin" },
  },
  {
    timestamps: true,
    collection: "tds_certificates",
  }
);

TdsCertificateSchema.index({ hospital: 1, financialYear: 1, quarter: 1 }, { unique: true });

export const TdsCertificate: Model<ITdsCertificate> =
  mongoose.models.TdsCertificate ||
  mongoose.model<ITdsCertificate>("TdsCertificate", TdsCertificateSchema);
