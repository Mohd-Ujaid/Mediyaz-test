import mongoose, { Schema, Document } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  STAFF = "STAFF",
  RECEPTIONIST = "RECEPTIONIST",
  DONOR = "DONOR",
  RECIPIENT = "RECIPIENT",
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  lastLogin?: Date;
  department?: string;
  permissions?: string[];
  loginHistory?: { date: Date; ip?: string; device?: string }[];
  activityLogs?: { action: string; details?: string; timestamp: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for OAuth
    phone: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.RECIPIENT },
    avatar: { type: String },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" },
    emailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    department: { type: String, default: "General" },
    permissions: { type: [String], default: ["READ_PORTAL"] },
    loginHistory: [
      {
        date: { type: Date, default: Date.now },
        ip: { type: String },
        device: { type: String }
      }
    ],
    activityLogs: [
      {
        action: { type: String, required: true },
        details: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const User = mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);
