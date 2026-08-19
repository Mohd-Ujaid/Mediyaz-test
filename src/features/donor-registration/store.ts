import { create } from "zustand";
import type {
  PersonalInfo,
  ContactInfo,
  MedicalInfo,
  SpermDonorInfo,
  EggDonorInfo,
  LabReports,
  Documents,
  EmergencyContact,
  BankDetails,
  Consent,
  FileRef,
  ReferralInfo,
} from "@/features/donor-registration/validations/donor-registration";

// Default empty states
const defaultPersonalInfo: PersonalInfo = {
  fullName: "", fatherName: "", motherName: "", gender: "Male",
  dateOfBirth: "", maritalStatus: "Single", bloodGroup: "O+",
  nationality: "Indian", education: "", occupation: "",
  height: "", weight: "", eyeColor: "", hairColor: "", complexion: "",
  aadhaarNumber: "", panNumber: "",
};

const defaultContactInfo: ContactInfo = {
  mobileNumber: "", alternateMobile: "", emailAddress: "",
  currentAddress: "", permanentAddress: "", state: "", district: "",
  city: "", pincode: "",
};

const defaultMedicalInfo: MedicalInfo = {
  medicalHistory: "", familyMedicalHistory: "", previousSurgeries: "",
  allergies: "", currentMedications: "", diabetes: "No", hypertension: "No",
  smokingStatus: "Never", alcoholConsumption: "Never", drugUse: "Never",
  geneticDisorders: "", psychologicalHistory: "", infectiousDiseases: "",
  fertilityHistory: "",
};

const defaultSpermDonorInfo: SpermDonorInfo = {
  semenAnalysis: "", previousDonationHistory: "No",
  numberOfDonations: "", lastDonationDate: "", abstinencePeriod: "",
};

const defaultEggDonorInfo: EggDonorInfo = {
  menstrualCycleDetails: "", pregnancyHistory: "",
  previousEggDonation: "No", ivfHistory: "", ovarianReserve: "",
  hormonalTestDetails: "",
};

const defaultLabReports: LabReports = {
  viralMarkers: [], bloodReport: null, otherReports: [],
};

const defaultDocuments: Documents = {
  passportPhoto: null,
  aadhaarFront: null,
  aadhaarBack: null,
  signature: null,
  otherDocument: null,
};

const defaultEmergencyContact: EmergencyContact = {
  contactPersonName: "", relationship: "", phoneNumber: "", address: "",
};

const defaultBankDetails: BankDetails = {
  accountHolderName: "", bankName: "", branch: "",
  ifscCode: "", accountNumber: "", upiId: "",
};

const defaultConsent: Consent = {
  confirmTruth: false, agreeVoluntary: false,
  consentScreening: false, allowStorage: false,
  digitalSignature: "", signatureDate: new Date().toISOString().split("T")[0],
};

const defaultReferralInfo: ReferralInfo = {
  sourceReferralType: "Website",
  referrerName: "",
  patientOrDonorId: "",
  mobileNumber: "",
  relationship: "",
  clinicName: "",
  department: "",
  employeeId: "",
  otherSourceDetails: "",
};

export interface DonorFormState {
  // Meta
  registrationId: string | null;
  donorType: "sperm" | "egg";
  currentStep: number;
  isSubmitting: boolean;
  isSaving: boolean;
  isLoading: boolean;
  assignedHospital: string | null;

  // Step data
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  medicalInfo: MedicalInfo;
  spermDonorInfo: SpermDonorInfo;
  eggDonorInfo: EggDonorInfo;
  labReports: LabReports;
  documents: Documents;
  emergencyContact: EmergencyContact;
  bankDetails: BankDetails;
  consent: Consent;
  referral: ReferralInfo;

  // Completed steps tracking
  completedSteps: Set<number>;

  // Actions
  setDonorType: (type: "sperm" | "egg") => void;
  setCurrentStep: (step: number) => void;
  setRegistrationId: (id: string) => void;
  setAssignedHospital: (id: string | null) => void;
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  updateContactInfo: (data: Partial<ContactInfo>) => void;
  updateMedicalInfo: (data: Partial<MedicalInfo>) => void;
  updateSpermDonorInfo: (data: Partial<SpermDonorInfo>) => void;
  updateEggDonorInfo: (data: Partial<EggDonorInfo>) => void;
  updateLabReports: (data: Partial<LabReports>) => void;
  updateDocuments: (data: Partial<Documents>) => void;
  updateEmergencyContact: (data: Partial<EmergencyContact>) => void;
  updateBankDetails: (data: Partial<BankDetails>) => void;
  updateConsent: (data: Partial<Consent>) => void;
  updateReferral: (data: Partial<ReferralInfo>) => void;
  markStepCompleted: (step: number) => void;
  setIsSubmitting: (v: boolean) => void;
  setIsSaving: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  loadFromServer: (data: any) => void;
  resetForm: () => void;
  getStepData: (step: number) => any;
  getAllFormData: () => any;
}

export const useDonorFormStore = create<DonorFormState>((set, get) => ({
  registrationId: null,
  donorType: "sperm",
  currentStep: 1,
  isSubmitting: false,
  isSaving: false,
  isLoading: false,
  assignedHospital: null,

  personalInfo: { ...defaultPersonalInfo },
  contactInfo: { ...defaultContactInfo },
  medicalInfo: { ...defaultMedicalInfo },
  spermDonorInfo: { ...defaultSpermDonorInfo },
  eggDonorInfo: { ...defaultEggDonorInfo },
  labReports: { ...defaultLabReports },
  documents: { ...defaultDocuments },
  emergencyContact: { ...defaultEmergencyContact },
  bankDetails: { ...defaultBankDetails },
  consent: { ...defaultConsent },
  referral: { ...defaultReferralInfo },
  completedSteps: new Set<number>(),

  setDonorType: (type) => set({ donorType: type }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setRegistrationId: (id) => set({ registrationId: id }),
  setAssignedHospital: (id) => set({ assignedHospital: id }),
  setIsSubmitting: (v) => set({ isSubmitting: v }),
  setIsSaving: (v) => set({ isSaving: v }),
  setIsLoading: (v) => set({ isLoading: v }),

  updatePersonalInfo: (data) =>
    set((s) => ({ personalInfo: { ...s.personalInfo, ...data } })),
  updateContactInfo: (data) =>
    set((s) => ({ contactInfo: { ...s.contactInfo, ...data } })),
  updateMedicalInfo: (data) =>
    set((s) => ({ medicalInfo: { ...s.medicalInfo, ...data } })),
  updateSpermDonorInfo: (data) =>
    set((s) => ({ spermDonorInfo: { ...s.spermDonorInfo, ...data } })),
  updateEggDonorInfo: (data) =>
    set((s) => ({ eggDonorInfo: { ...s.eggDonorInfo, ...data } })),
  updateLabReports: (data) =>
    set((s) => ({ labReports: { ...s.labReports, ...data } })),
  updateDocuments: (data) =>
    set((s) => ({ documents: { ...s.documents, ...data } })),
  updateEmergencyContact: (data) =>
    set((s) => ({ emergencyContact: { ...s.emergencyContact, ...data } })),
  updateBankDetails: (data) =>
    set((s) => ({ bankDetails: { ...s.bankDetails, ...data } })),
  updateConsent: (data) =>
    set((s) => ({ consent: { ...s.consent, ...data } })),
  updateReferral: (data) =>
    set((s) => ({ referral: { ...s.referral, ...data } })),

  markStepCompleted: (step) =>
    set((s) => {
      const newSet = new Set(s.completedSteps);
      newSet.add(step);
      return { completedSteps: newSet };
    }),

  loadFromServer: (data: any) => {
    if (!data) return;
    set({
      registrationId: data.registrationId || null,
      donorType: data.donorType || "sperm",
      currentStep: data.currentStep || 1,
      assignedHospital: data.assignedHospital || null,
      personalInfo: { ...defaultPersonalInfo, ...data.personalInfo },
      contactInfo: { ...defaultContactInfo, ...data.contactInfo },
      medicalInfo: { ...defaultMedicalInfo, ...data.medicalInfo },
      spermDonorInfo: {
        ...defaultSpermDonorInfo,
        semenAnalysis: data.donorInfo?.semenAnalysis || "",
        previousDonationHistory: data.donorInfo?.previousDonationHistory || "No",
        numberOfDonations: data.donorInfo?.numberOfDonations || "",
        lastDonationDate: data.donorInfo?.lastDonationDate || "",
        abstinencePeriod: data.donorInfo?.abstinencePeriod || "",
      },
      eggDonorInfo: {
        ...defaultEggDonorInfo,
        menstrualCycleDetails: data.donorInfo?.menstrualCycleDetails || "",
        pregnancyHistory: data.donorInfo?.pregnancyHistory || "",
        previousEggDonation: data.donorInfo?.previousEggDonation || "No",
        ivfHistory: data.donorInfo?.ivfHistory || "",
        ovarianReserve: data.donorInfo?.ovarianReserve || "",
        hormonalTestDetails: data.donorInfo?.hormonalTestDetails || "",
      },
      labReports: { ...defaultLabReports, ...data.labReports },
      documents: { ...defaultDocuments, ...data.documents },
      emergencyContact: { ...defaultEmergencyContact, ...data.emergencyContact },
      bankDetails: { ...defaultBankDetails, ...data.bankDetails },
      consent: { ...defaultConsent, ...data.consent },
      referral: { ...defaultReferralInfo, ...data.referral },
    });
  },

  resetForm: () =>
    set({
      registrationId: null,
      donorType: "sperm",
      currentStep: 1,
      isSubmitting: false,
      isSaving: false,
      assignedHospital: null,
      personalInfo: { ...defaultPersonalInfo },
      contactInfo: { ...defaultContactInfo },
      medicalInfo: { ...defaultMedicalInfo },
      spermDonorInfo: { ...defaultSpermDonorInfo },
      eggDonorInfo: { ...defaultEggDonorInfo },
      labReports: { ...defaultLabReports },
      documents: { ...defaultDocuments },
      emergencyContact: { ...defaultEmergencyContact },
      bankDetails: { ...defaultBankDetails },
      consent: { ...defaultConsent },
      referral: { ...defaultReferralInfo },
      completedSteps: new Set<number>(),
    }),

  getStepData: (step: number) => {
    const s = get();
    switch (step) {
      case 1: return s.personalInfo;
      case 2: return s.contactInfo;
      case 3: return s.medicalInfo;
      case 4: return s.donorType === "sperm" ? s.spermDonorInfo : s.eggDonorInfo;
      case 5: return s.labReports;
      case 6: return s.documents;
      case 7: return s.emergencyContact;
      case 8: return s.consent;
      default: return {};
    }
  },

  getAllFormData: () => {
    const s = get();
    return {
      donorType: s.donorType,
      currentStep: s.currentStep,
      assignedHospital: s.assignedHospital,
      personalInfo: s.personalInfo,
      contactInfo: s.contactInfo,
      medicalInfo: s.medicalInfo,
      donorInfo: s.donorType === "sperm"
        ? {
            semenAnalysis: s.spermDonorInfo.semenAnalysis,
            previousDonationHistory: s.spermDonorInfo.previousDonationHistory,
            numberOfDonations: s.spermDonorInfo.numberOfDonations,
            lastDonationDate: s.spermDonorInfo.lastDonationDate,
            abstinencePeriod: s.spermDonorInfo.abstinencePeriod,
          }
        : {
            menstrualCycleDetails: s.eggDonorInfo.menstrualCycleDetails,
            pregnancyHistory: s.eggDonorInfo.pregnancyHistory,
            previousEggDonation: s.eggDonorInfo.previousEggDonation,
            ivfHistory: s.eggDonorInfo.ivfHistory,
            ovarianReserve: s.eggDonorInfo.ovarianReserve,
            hormonalTestDetails: s.eggDonorInfo.hormonalTestDetails,
          },
      labReports: s.labReports,
      documents: s.documents,
      emergencyContact: s.emergencyContact,
      bankDetails: s.bankDetails,
      consent: s.consent,
      referral: s.referral,
    };
  },
}));
