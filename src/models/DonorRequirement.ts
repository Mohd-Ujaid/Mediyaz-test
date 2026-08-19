import mongoose, { Schema, Document } from "mongoose";

export interface IUploadedFile {
  fileId: string;
  url: string;
  name?: string;
  fileType?: string;
  fileName?: string;
  folder?: string;
  size?: number | string;
  type?: string;
}

export interface IInternalNote {
  author: string;
  note: string;
  createdAt: Date;
}

export interface ICommunicationLog {
  type: "Call" | "WhatsApp" | "Email";
  sender: string;
  content: string;
  createdAt: Date;
}

export interface ICRMTask {
  title: string;
  dueAt: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface IDonorRequirement extends Document {
  user?: mongoose.Types.ObjectId;
  assignedStaff?: mongoose.Types.ObjectId;
  personalDetails: {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    maritalStatus: string;
    phone: string;
    whatsApp: string;
    email: string;
    country: string;
    state: string;
    city: string;
    preferredContactMethod: string;
    bestTimeToContact: string;
  };
  treatmentRequirement: {
    lookingFor: "sperm" | "egg" | "both";
    purpose: "ivf" | "iui" | "preservation" | "other";
    previousTreatment: boolean;
    clinicName?: string;
    doctorName?: string;
    medicalNotes?: string;
  };
  donorPreferences: {
    ageRange?: string;
    bloodGroup?: string;
    rhFactor?: string;
    height?: string;
    weight?: string;
    skinTone?: string;
    eyeColor?: string;
    hairColor?: string;
    educationLevel?: string;
    religion?: string;
    ethnicity?: string;
    language?: string;
    occupation?: string;
    cmvStatus?: string;
    smoking?: string;
    drinking?: string;
    medicalHistory?: string;
    geneticScreeningRequired: boolean;
    otherPreferences?: string;
  };
  medicalInformation: {
    uploadedReports: IUploadedFile[];
    medicalConditions?: string;
    geneticDisorders?: string;
    currentMedications?: string;
    allergies?: string;
    doctorNotes?: string;
    additionalComments?: string;
  };
  consent: {
    digitalSignature: string;
    consentDate: Date;
    agreedToEligibility: boolean;
    agreedToContact: boolean;
    agreedToStorage: boolean;
    agreedToPrivacyPolicy: boolean;
  };
  status:
    | "New"
    | "Under Review"
    | "Contacted"
    | "Consultation Scheduled"
    | "Matching Process"
    | "Matched"
    | "Treatment Started"
    | "Completed"
    | "Closed"
    | "Rejected"
    | "Archived";
  priority: "Low" | "Medium" | "High" | "Urgent";
  tags: string[];
  internalNotes: IInternalNote[];
  communicationHistory: ICommunicationLog[];
  tasks: ICRMTask[];
  createdAt: Date;
  updatedAt: Date;
}

const UploadedFileSchema = new Schema<IUploadedFile>({
  fileId: { type: String, required: true },
  url: { type: String, required: true },
  name: { type: String },
  fileType: { type: String },
  fileName: { type: String },
  folder: { type: String },
  size: { type: Schema.Types.Mixed },
  type: { type: String },
});

const InternalNoteSchema = new Schema<IInternalNote>({
  author: { type: String, required: true },
  note: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CommunicationLogSchema = new Schema<ICommunicationLog>({
  type: { type: String, enum: ["Call", "WhatsApp", "Email"], required: true },
  sender: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CRMTaskSchema = new Schema<ICRMTask>({
  title: { type: String, required: true },
  dueAt: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
});

const DonorRequirementSchema = new Schema<IDonorRequirement>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    assignedStaff: { type: Schema.Types.ObjectId, ref: "User" },
    personalDetails: {
      fullName: { type: String, required: true },
      gender: { type: String, required: true },
      dateOfBirth: { type: String, required: true },
      maritalStatus: { type: String, required: true },
      phone: { type: String, required: true },
      whatsApp: { type: String, required: true },
      email: { type: String, required: true },
      country: { type: String, required: true },
      state: { type: String, required: true },
      city: { type: String, required: true },
      preferredContactMethod: { type: String, required: true },
      bestTimeToContact: { type: String, required: true },
    },
    treatmentRequirement: {
      lookingFor: { type: String, enum: ["sperm", "egg", "both"], required: true },
      purpose: { type: String, enum: ["ivf", "iui", "preservation", "other"], required: true },
      previousTreatment: { type: Boolean, default: false },
      clinicName: { type: String },
      doctorName: { type: String },
      medicalNotes: { type: String },
    },
    donorPreferences: {
      ageRange: { type: String },
      bloodGroup: { type: String },
      rhFactor: { type: String },
      height: { type: String },
      weight: { type: String },
      skinTone: { type: String },
      eyeColor: { type: String },
      hairColor: { type: String },
      educationLevel: { type: String },
      religion: { type: String },
      ethnicity: { type: String },
      language: { type: String },
      occupation: { type: String },
      cmvStatus: { type: String },
      smoking: { type: String },
      drinking: { type: String },
      medicalHistory: { type: String },
      geneticScreeningRequired: { type: Boolean, default: false },
      otherPreferences: { type: String },
    },
    medicalInformation: {
      uploadedReports: [UploadedFileSchema],
      medicalConditions: { type: String },
      geneticDisorders: { type: String },
      currentMedications: { type: String },
      allergies: { type: String },
      doctorNotes: { type: String },
      additionalComments: { type: String },
    },
    consent: {
      digitalSignature: { type: String, required: true },
      consentDate: { type: Date, default: Date.now },
      agreedToEligibility: { type: Boolean, required: true },
      agreedToContact: { type: Boolean, required: true },
      agreedToStorage: { type: Boolean, required: true },
      agreedToPrivacyPolicy: { type: Boolean, required: true },
    },
    status: {
      type: String,
      enum: [
        "New",
        "Under Review",
        "Contacted",
        "Consultation Scheduled",
        "Matching Process",
        "Matched",
        "Treatment Started",
        "Completed",
        "Closed",
        "Rejected",
        "Archived",
      ],
      default: "New",
    },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    tags: { type: [String], default: [] },
    internalNotes: [InternalNoteSchema],
    communicationHistory: [CommunicationLogSchema],
    tasks: [CRMTaskSchema],
  },
  { timestamps: true }
);

export const DonorRequirement =
  mongoose.models?.DonorRequirement ||
  mongoose.model<IDonorRequirement>("DonorRequirement", DonorRequirementSchema);
