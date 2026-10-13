import mongoose, { Schema, Document } from "mongoose";

export interface IDonorFileRef {
  fileId?: string;
  url: string;
  name?: string;
  type?: string;
  fileName?: string;
  folder?: string;
  size?: number | string;
}

export interface IPreviousDonor extends Document {
  recordCode: string;
  legacyId?: string;
  donorType: "egg" | "sperm";
  status?: string;
  donationDate?: string;
  registrationDate?: string;
  scheduleDate?: string;
  pickupDate?: string;
  hospitalOrClinic?: string;
  doctorName?: string;
  notes?: string;
  createdByEmployee?: string;

  personalInfo?: {
    fullName?: string;
    gender?: string;
    dateOfBirth?: string;
    age?: number;
    bloodGroup?: string;
    maritalStatus?: string;
    education?: string;
    occupation?: string;
    height?: string;
    weight?: string;
    complexion?: string;
    eyeColor?: string;
    hairColor?: string;
    aadhaarNumber?: string;
    panNumber?: string;
    fatherName?: string;
    motherName?: string;
    spouseName?: string;
    religion?: string;
    monthlyIncome?: string;
  };

  contactInfo?: {
    mobileNumber?: string;
    alternateMobile?: string;
    emailAddress?: string;
    currentAddress?: string;
    permanentAddress?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };

  medicalInfo?: {
    medicalHistory?: string;
    familyMedicalHistory?: string;
    previousSurgeries?: string;
    allergies?: string;
    diabetes?: string;
    hypertension?: string;
    smokingStatus?: string;
    alcoholConsumption?: string;
    drugUse?: string;
    geneticDisorders?: string;
    infectiousDiseases?: string;
  };

  eggDonorDetails?: {
    menstrualCycleDetails?: string;
    numberOfDeliveries?: string;
    numberOfAbortions?: string;
    previousDonationsCount?: string;
    ivfHistory?: string;
    ovarianReserve?: string;
    numberOfEggsRetrieved?: string;
    matureEggsCount?: string;
    compensationPaid?: string;
  };

  spermDonorDetails?: {
    semenVolume?: string;
    motility?: string;
    spermCount?: string;
    totalVials?: string;
    liquefactionTime?: string;
    morphology?: string;
    abstinencePeriod?: string;
    previousDonationsCount?: string;
    compensationPaid?: string;
  };

  viralMarkers?: {
    hiv?: string;
    hbsag?: string;
    hcv?: string;
    vdrl?: string;
    thalassemia?: string;
    screeningDate?: string;
    notes?: string;
  };

  documents?: {
    passportPhoto?: IDonorFileRef | null;
    aadhaarFront?: IDonorFileRef | null;
    aadhaarBack?: IDonorFileRef | null;
    signature?: IDonorFileRef | null;
    affidavit?: IDonorFileRef | null;
    form13?: IDonorFileRef | null;
    otherDocument?: IDonorFileRef | null;
  };

  labReports?: {
    viralMarkers?: IDonorFileRef[] | IDonorFileRef | null;
    viralMarkersReport?: IDonorFileRef | null;
    bloodReport?: IDonorFileRef | null;
    semenAnalysisReport?: IDonorFileRef | null;
    lifeInsurance?: IDonorFileRef | null;
    healthInsurance?: IDonorFileRef | null;
    insurance?: IDonorFileRef | null;
    otherReports?: IDonorFileRef[];
  };

  createdAt?: Date;
  updatedAt?: Date;
}

const FileRefSchema = new Schema<IDonorFileRef>(
  {
    fileId: { type: String, default: "" },
    url: { type: String, default: "" },
    name: { type: String, default: "" },
    type: { type: String, default: "" },
    fileName: { type: String, default: "" },
    folder: { type: String, default: "" },
    size: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const PreviousDonorSchema = new Schema<IPreviousDonor>(
  {
    recordCode: { type: String, trim: true },
    legacyId: { type: String, trim: true },
    donorType: { type: String, enum: ["egg", "sperm"], default: "egg" },
    status: { type: String, default: "ARCHIVED" },
    donationDate: { type: String, default: "" },
    registrationDate: { type: String, default: "" },
    scheduleDate: { type: String, default: "" },
    pickupDate: { type: String, default: "" },
    hospitalOrClinic: { type: String, default: "" },
    doctorName: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdByEmployee: { type: String, default: "" },

    personalInfo: {
      fullName: { type: String, default: "" },
      gender: { type: String, default: "" },
      dateOfBirth: { type: String, default: "" },
      age: { type: Number },
      bloodGroup: { type: String, default: "" },
      maritalStatus: { type: String, default: "" },
      education: { type: String, default: "" },
      occupation: { type: String, default: "" },
      height: { type: String, default: "" },
      weight: { type: String, default: "" },
      complexion: { type: String, default: "" },
      eyeColor: { type: String, default: "" },
      hairColor: { type: String, default: "" },
      aadhaarNumber: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      fatherName: { type: String, default: "" },
      motherName: { type: String, default: "" },
      spouseName: { type: String, default: "" },
      religion: { type: String, default: "" },
      monthlyIncome: { type: String, default: "" },
    },

    contactInfo: {
      mobileNumber: { type: String, default: "" },
      alternateMobile: { type: String, default: "" },
      emailAddress: { type: String, default: "" },
      currentAddress: { type: String, default: "" },
      permanentAddress: { type: String, default: "" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    medicalInfo: {
      medicalHistory: { type: String, default: "" },
      familyMedicalHistory: { type: String, default: "" },
      previousSurgeries: { type: String, default: "" },
      allergies: { type: String, default: "" },
      diabetes: { type: String, default: "" },
      hypertension: { type: String, default: "" },
      smokingStatus: { type: String, default: "" },
      alcoholConsumption: { type: String, default: "" },
      drugUse: { type: String, default: "" },
      geneticDisorders: { type: String, default: "" },
      infectiousDiseases: { type: String, default: "" },
    },

    eggDonorDetails: {
      menstrualCycleDetails: { type: String, default: "" },
      numberOfDeliveries: { type: String, default: "" },
      numberOfAbortions: { type: String, default: "" },
      previousDonationsCount: { type: String, default: "" },
      ivfHistory: { type: String, default: "" },
      ovarianReserve: { type: String, default: "" },
      numberOfEggsRetrieved: { type: String, default: "" },
      matureEggsCount: { type: String, default: "" },
      compensationPaid: { type: String, default: "" },
    },

    spermDonorDetails: {
      semenVolume: { type: String, default: "" },
      motility: { type: String, default: "" },
      spermCount: { type: String, default: "" },
      totalVials: { type: String, default: "" },
      liquefactionTime: { type: String, default: "" },
      morphology: { type: String, default: "" },
      abstinencePeriod: { type: String, default: "" },
      previousDonationsCount: { type: String, default: "" },
      compensationPaid: { type: String, default: "" },
    },

    viralMarkers: {
      hiv: { type: String, default: "" },
      hbsag: { type: String, default: "" },
      hcv: { type: String, default: "" },
      vdrl: { type: String, default: "" },
      thalassemia: { type: String, default: "" },
      screeningDate: { type: String, default: "" },
      notes: { type: String, default: "" },
    },

    documents: {
      passportPhoto: { type: FileRefSchema, default: null },
      aadhaarFront: { type: FileRefSchema, default: null },
      aadhaarBack: { type: FileRefSchema, default: null },
      signature: { type: FileRefSchema, default: null },
      affidavit: { type: FileRefSchema, default: null },
      form13: { type: FileRefSchema, default: null },
      otherDocument: { type: FileRefSchema, default: null },
    },

    labReports: {
      viralMarkers: { type: Schema.Types.Mixed, default: null },
      viralMarkersReport: { type: FileRefSchema, default: null },
      bloodReport: { type: FileRefSchema, default: null },
      semenAnalysisReport: { type: FileRefSchema, default: null },
      lifeInsurance: { type: FileRefSchema, default: null },
      healthInsurance: { type: FileRefSchema, default: null },
      insurance: { type: FileRefSchema, default: null },
      otherReports: { type: [FileRefSchema], default: [] },
    },
  },
  {
    timestamps: true,
    strict: false,
    collection: "previous_donors",
  }
);

PreviousDonorSchema.index({ "personalInfo.aadhaarNumber": 1 });
PreviousDonorSchema.index({ "contactInfo.mobileNumber": 1 });
PreviousDonorSchema.index({ donorType: 1 });
PreviousDonorSchema.index({ recordCode: 1 });
PreviousDonorSchema.index({ legacyId: 1 });

if (mongoose.models && (mongoose.models as any).PreviousDonor) {
  delete (mongoose.models as any).PreviousDonor;
}

export const PreviousDonor =
  mongoose.models?.PreviousDonor ||
  mongoose.model<IPreviousDonor>("PreviousDonor", PreviousDonorSchema);
