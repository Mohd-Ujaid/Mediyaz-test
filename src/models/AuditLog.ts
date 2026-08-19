import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string; // e.g., "Registration Approved", "Hospital Assigned", "Hospital Changed", "PDF Generated", "PDF Printed", "Export Downloaded", "Admin Updated Registration"
  entityType: string; // e.g., "DonorRegistration", "Hospital"
  entityId: string;
  performedBy: string; // user name or email
  ipAddress?: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    performedBy: { type: String, required: true },
    ipAddress: { type: String, default: "unknown" },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    details: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog =
  mongoose.models?.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
