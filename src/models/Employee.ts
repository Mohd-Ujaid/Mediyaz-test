import mongoose, { Schema, Document } from "mongoose";

export enum EmployeeDesignation {
  ADMIN = "Admin",
  DOCTOR = "Doctor",
  NURSE = "Nurse",
  RECEPTIONIST = "Receptionist",
  EMBRYOLOGY_STAFF = "Embryology Staff",
  LAB_TECHNICIAN = "Lab Technician",
  VOLUNTEER = "Volunteer",
  DRIVER = "Driver",
}

export interface IEmployee extends Document {
  user?: mongoose.Types.ObjectId; // References User if they have an active account
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  department: string;
  designation: EmployeeDesignation;
  qualification: string;
  experienceYears: number;
  salary: number;
  shift: "Morning" | "Evening" | "Night";
  attendanceRate: number; // 0 to 100
  performanceRating: number; // 1 to 5
  status: "ACTIVE" | "INACTIVE";
  documents: {
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    photo: { type: String },
    department: { type: String, default: "Clinical Services" },
    designation: { 
      type: String, 
      enum: Object.values(EmployeeDesignation), 
      required: true 
    },
    qualification: { type: String, required: true },
    experienceYears: { type: Number, required: true },
    salary: { type: Number, required: true },
    shift: { 
      type: String, 
      enum: ["Morning", "Evening", "Night"], 
      default: "Morning" 
    },
    attendanceRate: { type: Number, default: 100 },
    performanceRating: { type: Number, default: 5 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Employee = mongoose.models?.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);
