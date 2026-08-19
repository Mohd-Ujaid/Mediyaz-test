import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  type: "INQUIRY" | "BOOKING" | "SYSTEM" | "REGISTRATION";
  referenceId?: string;
  targetRoles: string[];
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["INQUIRY", "BOOKING", "SYSTEM", "REGISTRATION"],
      default: "SYSTEM",
      required: true,
    },
    referenceId: { type: String, default: null },
    targetRoles: { type: [String], default: ["ADMIN", "SUPER_ADMIN"] },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Add scalable indices for frequent queries
NotificationSchema.index({ targetRoles: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
