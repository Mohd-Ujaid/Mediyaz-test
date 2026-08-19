import mongoose, { Schema, Document } from "mongoose";

export interface IBloodInventory extends Document {
  bloodGroup: string; // e.g. O+, O-, A+, etc.
  unitsAvailable: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BloodInventorySchema = new Schema<IBloodInventory>(
  {
    bloodGroup: { type: String, required: true, unique: true },
    unitsAvailable: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const BloodInventory = mongoose.models?.BloodInventory || mongoose.model<IBloodInventory>("BloodInventory", BloodInventorySchema);
