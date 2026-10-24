import mongoose, { Schema, Document } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
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
  designation?: string;
  avatar?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  managerId?: mongoose.Types.ObjectId;
  invitedBy?: mongoose.Types.ObjectId;
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
    designation: { type: String },
    avatar: { type: String },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" },
    emailVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
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

// Enforce at database level that only ONE active Super Admin can ever exist
UserSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "SUPER_ADMIN" },
    name: "single_super_admin_unique_idx"
  }
);

export const User = mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);
