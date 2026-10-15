"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Dna,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  Phone,
  Activity,
  Building2,
  FileText,
  Upload,
  Shield,
  FileCheck,
  Info,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { checkAadhaarInPreviousDataAction, savePreviousDonorAction } from "../actions/previous-data.actions";
import { FileUploadField } from "@/features/file-upload/components/FileUploadField";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed", "Separated"] as const;
const COMPLEXIONS = ["Fair", "Very Fair", "Wheatish", "Medium", "Olive", "Brown", "Dark"] as const;
const HAIR_COLORS = ["Black", "Dark Brown", "Brown", "Light Brown", "Blonde", "Other"] as const;
const EYE_COLORS = ["Black", "Dark Brown", "Brown", "Hazel", "Green", "Blue", "Grey", "Other"] as const;
const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi", "Jewish", "Other"] as const;
const EDUCATION_OPTIONS = [
  "Below 10th",
  "10th Pass",
  "12th Pass",
  "Diploma",
  "Graduate",
  "Post Graduate",
  "Doctorate",
  "Other"
] as const;

const HEIGHT_OPTIONS = [
  "4 ft 6 in", "4 ft 7 in", "4 ft 8 in", "4 ft 9 in", "4 ft 10 in", "4 ft 11 in",
  "5 ft 0 in", "5 ft 1 in", "5 ft 2 in", "5 ft 3 in", "5 ft 4 in", "5 ft 5 in",
  "5 ft 6 in", "5 ft 7 in", "5 ft 8 in", "5 ft 9 in", "5 ft 10 in", "5 ft 11 in",
  "6 ft 0 in", "6 ft 1 in", "6 ft 2 in", "6 ft 3 in", "6 ft 4 in", "6 ft 5 in", "6 ft 6 in", "6 ft 7 in"
] as const;

const WEIGHT_OPTIONS = Array.from({ length: 81 }, (_, i) => `${40 + i} kg`);

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Chandigarh", "Puducherry", "Other"
] as const;

const OCCUPATION_OPTIONS = [
  "Private Service",
  "Government Service",
  "Self Employed / Business",
  "Homemaker",
  "Student",
  "Daily Wage / Labor",
  "Farmer / Agriculture",
  "Unemployed",
  "Other"
] as const;

const MONTHLY_INCOME_OPTIONS = [
  "Less than ₹15,000",
  "₹15,000 - ₹25,000",
  "₹25,000 - ₹50,000",
  "₹50,000 - ₹1,00,000",
  "Above ₹1,00,000"
] as const;

const SURGERY_OPTIONS = [
  "None",
  "Caesarean Section (C-Section)",
  "Appendectomy",
  "Laparoscopy",
  "Tubectomy",
  "Gallbladder Surgery",
  "Other Minor Surgery",
  "Other Major Surgery"
] as const;

const GENETIC_DISORDER_OPTIONS = [
  "None / No Known Disorder",
  "Thalassemia Carrier",
  "Sickle Cell Trait",
  "G6PD Deficiency",
  "Hemophilia",
  "Other Genetic Condition"
] as const;

const MENSTRUAL_CYCLE_OPTIONS = [
  "Regular (28-30 days)",
  "Regular (26-28 days)",
  "Regular (30-35 days)",
  "Irregular",
  "PCOD / PCOS History",
  "Other"
] as const;

const OVARIAN_RESERVE_OPTIONS = [
  "Normal (> 2.0 ng/mL)",
  "Optimal (2.0 - 3.5 ng/mL)",
  "High (> 3.5 ng/mL)",
  "Low (< 1.5 ng/mL)",
  "PCO Pattern"
] as const;

const SEMEN_VOLUME_OPTIONS = [
  "1.5 ml", "2.0 ml", "2.5 ml", "3.0 ml", "3.5 ml", "4.0 ml", "4.5 ml", "5.0 ml", "5.5 ml+"
] as const;

const SPERM_MOTILITY_OPTIONS = [
  "> 70% (Rapid Progressive)",
  "60% - 70%",
  "50% - 60%",
  "40% - 50%",
  "< 40%"
] as const;

const SPERM_COUNT_OPTIONS = [
  "> 80 million/ml",
  "60 - 80 million/ml",
  "40 - 60 million/ml",
  "20 - 40 million/ml",
  "< 20 million/ml"
] as const;

const ABSTINENCE_PERIOD_OPTIONS = [
  "2 days", "3 days", "4 days", "5 days", "6 days", "7 days"
] as const;

const TOTAL_VIALS_OPTIONS = [
  "1 vial", "2 vials", "3 vials", "4 vials", "5 vials", "6 vials", "8 vials", "10 vials"
] as const;

const VIRAL_STATUS_OPTIONS = [
  "Non-Reactive",
  "Negative",
  "Reactive (Positive)",
  "Pending",
  "Not Recorded"
] as const;

const THALASSEMIA_OPTIONS = [
  "Normal (Hb A2 < 3.5%)",
  "Trait / Carrier (Hb A2 > 3.5%)",
  "Major",
  "Negative",
  "Pending",
  "Not Recorded"
] as const;

interface PreviousDonorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordToEdit?: any | null;
  defaultDonorType?: "egg" | "sperm";
  onSuccess: () => void;
}

export function PreviousDonorFormDialog({
  open,
  onOpenChange,
  recordToEdit,
  defaultDonorType = "egg",
  onSuccess,
}: PreviousDonorFormDialogProps) {
  const [activeTab, setActiveTab] = useState("identity");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aadhaarChecking, setAadhaarChecking] = useState(false);
  const [aadhaarCheckResult, setAadhaarCheckResult] = useState<any>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: direction === "left" ? -240 : 240,
        behavior: "smooth",
      });
    }
  };

  // Form State - ZERO mandatory fields
  const [donorType, setDonorType] = useState<"egg" | "sperm">(defaultDonorType);
  const [recordCode, setRecordCode] = useState("");
  const [legacyId, setLegacyId] = useState("");
  const [status, setStatus] = useState("ARCHIVED");
  const [registrationDate, setRegistrationDate] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [hospitalOrClinic, setHospitalOrClinic] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");

  // Personal Info
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [age, setAge] = useState<string | number>("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [complexion, setComplexion] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [religion, setReligion] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");

  // Contact Info
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Medical Info
  const [medicalHistory, setMedicalHistory] = useState("");
  const [familyMedicalHistory, setFamilyMedicalHistory] = useState("");
  const [previousSurgeries, setPreviousSurgeries] = useState("");
  const [allergies, setAllergies] = useState("");
  const [diabetes, setDiabetes] = useState("");
  const [hypertension, setHypertension] = useState("");
  const [smokingStatus, setSmokingStatus] = useState("");
  const [alcoholConsumption, setAlcoholConsumption] = useState("");
  const [drugUse, setDrugUse] = useState("");
  const [geneticDisorders, setGeneticDisorders] = useState("");
  const [infectiousDiseases, setInfectiousDiseases] = useState("");

  // Egg Donor Specific
  const [menstrualCycleDetails, setMenstrualCycleDetails] = useState("");
  const [numberOfDeliveries, setNumberOfDeliveries] = useState("");
  const [numberOfAbortions, setNumberOfAbortions] = useState("");
  const [eggPreviousDonationsCount, setEggPreviousDonationsCount] = useState("");
  const [ivfHistory, setIvfHistory] = useState("");
  const [ovarianReserve, setOvarianReserve] = useState("");
  const [numberOfEggsRetrieved, setNumberOfEggsRetrieved] = useState("");
  const [matureEggsCount, setMatureEggsCount] = useState("");
  const [eggCompensationPaid, setEggCompensationPaid] = useState("");

  // Sperm Donor Specific
  const [semenVolume, setSemenVolume] = useState("");
  const [motility, setMotility] = useState("");
  const [spermCount, setSpermCount] = useState("");
  const [totalVials, setTotalVials] = useState("");
  const [liquefactionTime, setLiquefactionTime] = useState("");
  const [morphology, setMorphology] = useState("");
  const [abstinencePeriod, setAbstinencePeriod] = useState("");
  const [spermPreviousDonationsCount, setSpermPreviousDonationsCount] = useState("");
  const [spermCompensationPaid, setSpermCompensationPaid] = useState("");

  // Viral Markers
  const [hiv, setHiv] = useState("");
  const [hbsag, setHbsag] = useState("");
  const [hcv, setHcv] = useState("");
  const [vdrl, setVdrl] = useState("");
  const [thalassemia, setThalassemia] = useState("");
  const [screeningDate, setScreeningDate] = useState("");
  const [screeningNotes, setScreeningNotes] = useState("");

  // Documents & Uploads (Zero required)
  const [passportPhoto, setPassportPhoto] = useState<any>(null);
  const [aadhaarFront, setAadhaarFront] = useState<any>(null);
  const [aadhaarBack, setAadhaarBack] = useState<any>(null);
  const [signature, setSignature] = useState<any>(null);
  const [affidavit, setAffidavit] = useState<any>(null);
  const [form13, setForm13] = useState<any>(null);
  const [otherDocument, setOtherDocument] = useState<any>(null);

  // Lab Reports & Insurance Policies (Zero required)
  const [viralMarkersReport, setViralMarkersReport] = useState<any>(null);
  const [lifeInsurance, setLifeInsurance] = useState<any>(null);
  const [healthInsurance, setHealthInsurance] = useState<any>(null);
  const [bloodReport, setBloodReport] = useState<any>(null);
  const [semenAnalysisReport, setSemenAnalysisReport] = useState<any>(null);

  // Reset or initialize from recordToEdit
  useEffect(() => {
    if (recordToEdit) {
      setDonorType(recordToEdit.donorType || "egg");
      setRecordCode(recordToEdit.recordCode || "");
      setLegacyId(recordToEdit.legacyId || "");
      setStatus(recordToEdit.status || "ARCHIVED");
      setRegistrationDate(recordToEdit.registrationDate || "");
      setScheduleDate(recordToEdit.scheduleDate || "");
      setPickupDate(recordToEdit.pickupDate || "");
      setHospitalOrClinic(recordToEdit.hospitalOrClinic || "");
      setDoctorName(recordToEdit.doctorName || "");
      setNotes(recordToEdit.notes || "");

      const p = recordToEdit.personalInfo || {};
      setFullName(p.fullName || "");
      setGender(p.gender || (recordToEdit.donorType === "sperm" ? "Male" : "Female"));
      setDateOfBirth(p.dateOfBirth || "");
      setAge(p.age ?? "");
      setBloodGroup(p.bloodGroup || "");
      setMaritalStatus(p.maritalStatus || "");
      setEducation(p.education || "");
      setOccupation(p.occupation || "");
      setHeight(p.height || "");
      setWeight(p.weight || "");
      setComplexion(p.complexion || "");
      setEyeColor(p.eyeColor || "");
      setHairColor(p.hairColor || "");
      setAadhaarNumber(p.aadhaarNumber || "");
      setPanNumber(p.panNumber || "");
      setFatherName(p.fatherName || "");
      setMotherName(p.motherName || "");
      setSpouseName(p.spouseName || "");
      setReligion(p.religion || "");
      setMonthlyIncome(p.monthlyIncome || "");

      const c = recordToEdit.contactInfo || {};
      setMobileNumber(c.mobileNumber || "");
      setAlternateMobile(c.alternateMobile || "");
      setEmailAddress(c.emailAddress || "");
      setCurrentAddress(c.currentAddress || "");
      setPermanentAddress(c.permanentAddress || "");
      setCity(c.city || "");
      setDistrict(c.district || "");
      setState(c.state || "");
      setPincode(c.pincode || "");

      const m = recordToEdit.medicalInfo || {};
      setMedicalHistory(m.medicalHistory || "");
      setFamilyMedicalHistory(m.familyMedicalHistory || "");
      setPreviousSurgeries(m.previousSurgeries || "");
      setAllergies(m.allergies || "");
      setDiabetes(m.diabetes || "");
      setHypertension(m.hypertension || "");
      setSmokingStatus(m.smokingStatus || "");
      setAlcoholConsumption(m.alcoholConsumption || "");
      setDrugUse(m.drugUse || "");
      setGeneticDisorders(m.geneticDisorders || "");
      setInfectiousDiseases(m.infectiousDiseases || "");

      const egg = recordToEdit.eggDonorDetails || {};
      setMenstrualCycleDetails(egg.menstrualCycleDetails || "");
      setNumberOfDeliveries(egg.numberOfDeliveries || "");
      setNumberOfAbortions(egg.numberOfAbortions || "");
      setEggPreviousDonationsCount(egg.previousDonationsCount || "");
      setIvfHistory(egg.ivfHistory || "");
      setOvarianReserve(egg.ovarianReserve || "");
      setNumberOfEggsRetrieved(egg.numberOfEggsRetrieved || "");
      setMatureEggsCount(egg.matureEggsCount || "");
      setEggCompensationPaid(egg.compensationPaid || "");

      const sperm = recordToEdit.spermDonorDetails || {};
      setSemenVolume(sperm.semenVolume || "");
      setMotility(sperm.motility || "");
      setSpermCount(sperm.spermCount || "");
      setTotalVials(sperm.totalVials || "");
      setLiquefactionTime(sperm.liquefactionTime || "");
      setMorphology(sperm.morphology || "");
      setAbstinencePeriod(sperm.abstinencePeriod || "");
      setSpermPreviousDonationsCount(sperm.previousDonationsCount || "");
      setSpermCompensationPaid(sperm.compensationPaid || "");

      const v = recordToEdit.viralMarkers || {};
      setHiv(v.hiv || "");
      setHbsag(v.hbsag || "");
      setHcv(v.hcv || "");
      setVdrl(v.vdrl || "");
      setThalassemia(v.thalassemia || "");
      setScreeningDate(v.screeningDate || "");
      setScreeningNotes(v.notes || "");

      // Documents
      const docs = recordToEdit.documents || {};
      setPassportPhoto(docs.passportPhoto || null);
      setAadhaarFront(docs.aadhaarFront || null);
      setAadhaarBack(docs.aadhaarBack || null);
      setSignature(docs.signature || null);
      setAffidavit(docs.affidavit || null);
      setForm13(docs.form13 || null);
      setOtherDocument(docs.otherDocument || null);

      // Lab Reports & Insurance
      const labs = recordToEdit.labReports || {};
      setViralMarkersReport(labs.viralMarkersReport || (Array.isArray(labs.viralMarkers) ? labs.viralMarkers[0] : labs.viralMarkers) || null);
      setLifeInsurance(labs.lifeInsurance || labs.insurance || docs.insurance || null);
      setHealthInsurance(labs.healthInsurance || null);
      setBloodReport(labs.bloodReport || null);
      setSemenAnalysisReport(labs.semenAnalysisReport || null);
    } else {
      // New record defaults
      setDonorType(defaultDonorType);
      setRecordCode("");
      setLegacyId("");
      setStatus("ARCHIVED");
      setRegistrationDate("");
      setScheduleDate("");
      setPickupDate("");
      setHospitalOrClinic("");
      setDoctorName("");
      setNotes("");

      setFullName("");
      setGender(defaultDonorType === "sperm" ? "Male" : "Female");
      setDateOfBirth("");
      setAge("");
      setBloodGroup("");
      setMaritalStatus("");
      setEducation("");
      setOccupation("");
      setHeight("");
      setWeight("");
      setComplexion("");
      setEyeColor("");
      setHairColor("");
      setAadhaarNumber("");
      setPanNumber("");
      setFatherName("");
      setMotherName("");
      setSpouseName("");
      setReligion("");
      setMonthlyIncome("");

      setMobileNumber("");
      setAlternateMobile("");
      setEmailAddress("");
      setCurrentAddress("");
      setPermanentAddress("");
      setCity("");
      setDistrict("");
      setState("");
      setPincode("");

      setMedicalHistory("");
      setFamilyMedicalHistory("");
      setPreviousSurgeries("");
      setAllergies("");
      setDiabetes("");
      setHypertension("");
      setSmokingStatus("");
      setAlcoholConsumption("");
      setDrugUse("");
      setGeneticDisorders("");
      setInfectiousDiseases("");

      setMenstrualCycleDetails("");
      setNumberOfDeliveries("");
      setNumberOfAbortions("");
      setEggPreviousDonationsCount("");
      setIvfHistory("");
      setOvarianReserve("");
      setNumberOfEggsRetrieved("");
      setMatureEggsCount("");
      setEggCompensationPaid("");

      setSemenVolume("");
      setMotility("");
      setSpermCount("");
      setTotalVials("");
      setLiquefactionTime("");
      setMorphology("");
      setAbstinencePeriod("");
      setSpermPreviousDonationsCount("");
      setSpermCompensationPaid("");

      setHiv("");
      setHbsag("");
      setHcv("");
      setVdrl("");
      setThalassemia("");
      setScreeningDate("");
      setScreeningNotes("");

      setPassportPhoto(null);
      setAadhaarFront(null);
      setAadhaarBack(null);
      setSignature(null);
      setAffidavit(null);
      setForm13(null);
      setOtherDocument(null);

      setViralMarkersReport(null);
      setLifeInsurance(null);
      setHealthInsurance(null);
      setBloodReport(null);
      setSemenAnalysisReport(null);
    }
    setAadhaarCheckResult(null);
    setActiveTab("identity");
  }, [recordToEdit, defaultDonorType, open]);

  // Aadhaar live cross-check
  useEffect(() => {
    const clean = aadhaarNumber.replace(/\D/g, "");
    if (clean.length === 12) {
      setAadhaarChecking(true);
      const timer = setTimeout(async () => {
        const res = await checkAadhaarInPreviousDataAction(clean, recordToEdit?._id);
        setAadhaarCheckResult(res);
        setAadhaarChecking(false);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setAadhaarCheckResult(null);
      setAadhaarChecking(false);
    }
  }, [aadhaarNumber, recordToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        _id: recordToEdit?._id,
        donorType,
        recordCode: recordCode.trim() || undefined,
        legacyId: legacyId.trim() || undefined,
        status,
        registrationDate: registrationDate || undefined,
        scheduleDate: scheduleDate || undefined,
        pickupDate: pickupDate || undefined,
        hospitalOrClinic: hospitalOrClinic.trim() || undefined,
        doctorName: doctorName.trim() || undefined,
        notes: notes.trim() || undefined,
        personalInfo: {
          fullName: fullName.trim() || undefined,
          gender: gender || (donorType === "sperm" ? "Male" : "Female"),
          dateOfBirth: dateOfBirth || undefined,
          age: age ? Number(age) : undefined,
          bloodGroup: bloodGroup || undefined,
          maritalStatus: maritalStatus || undefined,
          education: education || undefined,
          occupation: occupation || undefined,
          height: height || undefined,
          weight: weight || undefined,
          complexion: complexion || undefined,
          eyeColor: eyeColor || undefined,
          hairColor: hairColor || undefined,
          aadhaarNumber: aadhaarNumber.trim() || undefined,
          panNumber: panNumber.trim() || undefined,
          fatherName: fatherName.trim() || undefined,
          motherName: motherName.trim() || undefined,
          spouseName: spouseName.trim() || undefined,
          religion: religion || undefined,
          monthlyIncome: monthlyIncome || undefined,
        },
        contactInfo: {
          mobileNumber: mobileNumber.trim() || undefined,
          alternateMobile: alternateMobile.trim() || undefined,
          emailAddress: emailAddress.trim() || undefined,
          currentAddress: currentAddress.trim() || undefined,
          permanentAddress: permanentAddress.trim() || undefined,
          city: city.trim() || undefined,
          district: district.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
        },
        medicalInfo: {
          medicalHistory: medicalHistory || undefined,
          familyMedicalHistory: familyMedicalHistory || undefined,
          previousSurgeries: previousSurgeries || undefined,
          allergies: allergies || undefined,
          diabetes: diabetes || undefined,
          hypertension: hypertension || undefined,
          smokingStatus: smokingStatus || undefined,
          alcoholConsumption: alcoholConsumption || undefined,
          drugUse: drugUse || undefined,
          geneticDisorders: geneticDisorders || undefined,
          infectiousDiseases: infectiousDiseases || undefined,
        },
        eggDonorDetails: donorType === "egg" ? {
          menstrualCycleDetails: menstrualCycleDetails || undefined,
          numberOfDeliveries: numberOfDeliveries || undefined,
          numberOfAbortions: numberOfAbortions || undefined,
          previousDonationsCount: eggPreviousDonationsCount || undefined,
          ivfHistory: ivfHistory || undefined,
          ovarianReserve: ovarianReserve || undefined,
          numberOfEggsRetrieved: numberOfEggsRetrieved || undefined,
          matureEggsCount: matureEggsCount || undefined,
          compensationPaid: eggCompensationPaid || undefined,
        } : undefined,
        spermDonorDetails: donorType === "sperm" ? {
          semenVolume: semenVolume || undefined,
          motility: motility || undefined,
          spermCount: spermCount || undefined,
          totalVials: totalVials || undefined,
          liquefactionTime: liquefactionTime || undefined,
          morphology: morphology || undefined,
          abstinencePeriod: abstinencePeriod || undefined,
          previousDonationsCount: spermPreviousDonationsCount || undefined,
          compensationPaid: spermCompensationPaid || undefined,
        } : undefined,
        viralMarkers: {
          hiv: hiv || undefined,
          hbsag: hbsag || undefined,
          hcv: hcv || undefined,
          vdrl: vdrl || undefined,
          thalassemia: thalassemia || undefined,
          screeningDate: screeningDate || undefined,
          notes: screeningNotes || undefined,
        },
        documents: {
          passportPhoto: passportPhoto || null,
          aadhaarFront: aadhaarFront || null,
          aadhaarBack: aadhaarBack || null,
          signature: signature || null,
          affidavit: affidavit || null,
          form13: form13 || null,
          otherDocument: otherDocument || null,
        },
        labReports: {
          viralMarkersReport: viralMarkersReport || null,
          viralMarkers: viralMarkersReport ? [viralMarkersReport] : null,
          lifeInsurance: donorType === "egg" ? (lifeInsurance || null) : null,
          healthInsurance: donorType === "egg" ? (healthInsurance || null) : null,
          insurance: donorType === "egg" ? (lifeInsurance || null) : null,
          bloodReport: bloodReport || null,
          semenAnalysisReport: donorType === "sperm" ? (semenAnalysisReport || null) : null,
        },
      };

      const res = await savePreviousDonorAction(payload);
      if (res.success) {
        toast.success(res.message || "Saved successfully!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to save record.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] xl:max-w-7xl max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border shadow-2xl">
        <DialogHeader className="p-5 border-b bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {recordToEdit ? "Edit Previous Donor Record" : "Add Previous Donor Record"}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={
                    donorType === "egg"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                      : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300"
                  }
                >
                  {donorType === "egg" ? "Egg Donor" : "Sperm Donor"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Zero required fields. Fill details and upload available legacy documents as needed.</span>
              </DialogDescription>
            </div>

            {/* Donor Type Switcher */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setDonorType("egg");
                  if (!gender || gender === "Male") setGender("Female");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  donorType === "egg"
                    ? "bg-white dark:bg-slate-900 text-rose-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Egg Donor
              </button>
              <button
                type="button"
                onClick={() => {
                  setDonorType("sperm");
                  if (!gender || gender === "Female") setGender("Male");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  donorType === "sperm"
                    ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Dna className="w-3.5 h-3.5 text-teal-600" />
                Sperm Donor
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Custom Tab Bar - Fully visible, vertically centered, no clipping */}
            <div className="shrink-0 border-b bg-slate-50/90 dark:bg-slate-900/90 px-3 py-2 flex items-center gap-1.5 min-h-[54px]">
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                aria-label="Scroll tabs left"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={tabsRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 px-0.5 scroll-smooth"
              >
                {[
                  { id: "identity", label: "Personal & Identity", icon: User },
                  { id: "contact", label: "Contact & Address", icon: Phone },
                  { id: "clinical", label: "Health & Medical", icon: Activity },
                  { id: "specific", label: donorType === "egg" ? "Egg Details" : "Semen Details", icon: Dna },
                  { id: "viral", label: "Viral & Screening", icon: FileText },
                  { id: "documents", label: "Upload Documents & Reports", icon: Upload },
                  { id: "archive", label: "Clinic & Notes", icon: Building2 },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 whitespace-nowrap inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none ${
                        isActive
                          ? "bg-teal-600 text-white shadow-sm font-bold ring-2 ring-teal-600/30 dark:bg-teal-500 dark:text-white"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 shadow-2xs"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollTabs("right")}
                aria-label="Scroll tabs right"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: PERSONAL & IDENTITY */}
              <div className={activeTab === "identity" ? "space-y-4" : "hidden"}>
                {/* 1. Basic Identity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Name
                    </Label>
                    <Input
                      placeholder="Full Name as on records"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Gender
                    </Label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Blood Group
                    </Label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent font-medium"
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                      {bloodGroup && !BLOOD_GROUPS.includes(bloodGroup as any) && (
                        <option value={bloodGroup}>{bloodGroup}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* 2. Age, Marital Status & Religion */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Date of Birth
                    </Label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        if (e.target.value) {
                          const birth = new Date(e.target.value);
                          const calculatedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
                          if (calculatedAge > 0 && calculatedAge < 100) setAge(calculatedAge);
                        }
                      }}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Age (Years)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Marital Status
                    </Label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Marital Status</option>
                      {MARITAL_STATUSES.map((ms) => (
                        <option key={ms} value={ms}>{ms}</option>
                      ))}
                      {maritalStatus && !MARITAL_STATUSES.includes(maritalStatus as any) && (
                        <option value={maritalStatus}>{maritalStatus}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Religion
                    </Label>
                    <select
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Religion</option>
                      {RELIGIONS.map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                      {religion && !RELIGIONS.includes(religion as any) && (
                        <option value={religion}>{religion}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* 3. Statutory Government Identifiers (Aadhaar & PAN) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Aadhaar Number (12 Digits)
                      </Label>
                      {aadhaarChecking && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                          Checking...
                        </span>
                      )}
                      {!aadhaarChecking && aadhaarCheckResult && (
                        aadhaarCheckResult.exists ? (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Already Found
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Unique
                          </span>
                        )
                      )}
                    </div>
                    <Input
                      placeholder="12-digit Aadhaar number"
                      maxLength={12}
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                      className={`text-xs font-mono ${
                        aadhaarCheckResult?.exists ? "border-amber-400 focus-visible:ring-amber-400 bg-amber-50/30" : ""
                      }`}
                    />
                    {aadhaarCheckResult?.exists && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        {aadhaarCheckResult.message} ({aadhaarCheckResult.name} - {aadhaarCheckResult.donorType?.toUpperCase()})
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      PAN Card Number
                    </Label>
                    <Input
                      placeholder="e.g. ABCDE1234F"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="text-xs font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Education / Qualification
                    </Label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Education</option>
                      {EDUCATION_OPTIONS.map((edu) => (
                        <option key={edu} value={edu}>{edu}</option>
                      ))}
                      {education && !EDUCATION_OPTIONS.includes(education as any) && (
                        <option value={education}>{education}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* 4. Physical Characteristics (All Dropdowns) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Height
                    </Label>
                    <select
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Height</option>
                      {HEIGHT_OPTIONS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                      {height && !HEIGHT_OPTIONS.includes(height as any) && (
                        <option value={height}>{height}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Weight (kg)
                    </Label>
                    <select
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Weight</option>
                      {WEIGHT_OPTIONS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                      {weight && !WEIGHT_OPTIONS.includes(weight as any) && (
                        <option value={weight}>{weight}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Complexion
                    </Label>
                    <select
                      value={complexion}
                      onChange={(e) => setComplexion(e.target.value)}
                      className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Complexion</option>
                      {COMPLEXIONS.map((comp) => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                      {complexion && !COMPLEXIONS.includes(complexion as any) && (
                        <option value={complexion}>{complexion}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Eye Color
                    </Label>
                    <select
                      value={eyeColor}
                      onChange={(e) => setEyeColor(e.target.value)}
                      className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Eye Color</option>
                      {EYE_COLORS.map((ec) => (
                        <option key={ec} value={ec}>{ec}</option>
                      ))}
                      {eyeColor && !EYE_COLORS.includes(eyeColor as any) && (
                        <option value={eyeColor}>{eyeColor}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Hair Color
                    </Label>
                    <select
                      value={hairColor}
                      onChange={(e) => setHairColor(e.target.value)}
                      className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Hair Color</option>
                      {HAIR_COLORS.map((hc) => (
                        <option key={hc} value={hc}>{hc}</option>
                      ))}
                      {hairColor && !HAIR_COLORS.includes(hairColor as any) && (
                        <option value={hairColor}>{hairColor}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* 5. Family & Financial Information */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Father's Name
                    </Label>
                    <Input
                      placeholder="Father's full name"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mother's Name
                    </Label>
                    <Input
                      placeholder="Mother's full name"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Spouse / Husband Name
                    </Label>
                    <Input
                      placeholder="Spouse / Husband name"
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Occupation
                    </Label>
                    <select
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Occupation</option>
                      {OCCUPATION_OPTIONS.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                      {occupation && !OCCUPATION_OPTIONS.includes(occupation as any) && (
                        <option value={occupation}>{occupation}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Monthly Income
                    </Label>
                    <select
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="w-full text-xs h-9 px-2.5 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Monthly Income</option>
                      {MONTHLY_INCOME_OPTIONS.map((inc) => (
                        <option key={inc} value={inc}>{inc}</option>
                      ))}
                      {monthlyIncome && !MONTHLY_INCOME_OPTIONS.includes(monthlyIncome as any) && (
                        <option value={monthlyIncome}>{monthlyIncome}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* TAB 2: CONTACT & ADDRESS */}
              <div className={activeTab === "contact" ? "space-y-4" : "hidden"}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mobile Number
                    </Label>
                    <Input
                      placeholder="10-digit mobile"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Alternate Mobile
                    </Label>
                    <Input
                      placeholder="Alternate phone"
                      value={alternateMobile}
                      onChange={(e) => setAlternateMobile(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      placeholder="donor@example.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Current Address
                    </Label>
                    <textarea
                      rows={2}
                      placeholder="House/Street/Area"
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-input bg-transparent resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Permanent Address
                    </Label>
                    <textarea
                      rows={2}
                      placeholder="Permanent address"
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-input bg-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      City / Town
                    </Label>
                    <Input
                      placeholder="e.g. New Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      District
                    </Label>
                    <Input
                      placeholder="District"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      State
                    </Label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                      {state && !INDIAN_STATES.includes(state as any) && (
                        <option value={state}>{state}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Pincode
                    </Label>
                    <Input
                      placeholder="6-digit pincode"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* TAB 3: HEALTH & MEDICAL */}
              <div className={activeTab === "clinical" ? "space-y-4" : "hidden"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Personal Medical History
                    </Label>
                    <textarea
                      rows={2}
                      placeholder="Chronic illnesses, past admissions..."
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-input bg-transparent resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Family Medical History
                    </Label>
                    <textarea
                      rows={2}
                      placeholder="Hereditary conditions, diabetes in family..."
                      value={familyMedicalHistory}
                      onChange={(e) => setFamilyMedicalHistory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-md border border-input bg-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Previous Surgeries
                    </Label>
                    <select
                      value={previousSurgeries}
                      onChange={(e) => setPreviousSurgeries(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Previous Surgeries</option>
                      {SURGERY_OPTIONS.map((surg) => (
                        <option key={surg} value={surg}>{surg}</option>
                      ))}
                      {previousSurgeries && !SURGERY_OPTIONS.includes(previousSurgeries as any) && (
                        <option value={previousSurgeries}>{previousSurgeries}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Known Allergies
                    </Label>
                    <Input
                      placeholder="Drug or food allergies (or None)"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Genetic Disorders
                    </Label>
                    <select
                      value={geneticDisorders}
                      onChange={(e) => setGeneticDisorders(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Select Genetic Disorder</option>
                      {GENETIC_DISORDER_OPTIONS.map((gd) => (
                        <option key={gd} value={gd}>{gd}</option>
                      ))}
                      {geneticDisorders && !GENETIC_DISORDER_OPTIONS.includes(geneticDisorders as any) && (
                        <option value={geneticDisorders}>{geneticDisorders}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Diabetes
                    </Label>
                    <select
                      value={diabetes}
                      onChange={(e) => setDiabetes(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Not Recorded</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Hypertension
                    </Label>
                    <select
                      value={hypertension}
                      onChange={(e) => setHypertension(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Not Recorded</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Smoking Status
                    </Label>
                    <select
                      value={smokingStatus}
                      onChange={(e) => setSmokingStatus(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Not Recorded</option>
                      <option value="Never">Never</option>
                      <option value="Occasionally">Occasionally</option>
                      <option value="Regularly">Regularly</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Alcohol Consumption
                    </Label>
                    <select
                      value={alcoholConsumption}
                      onChange={(e) => setAlcoholConsumption(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                    >
                      <option value="">Not Recorded</option>
                      <option value="Never">Never</option>
                      <option value="Socially">Socially</option>
                      <option value="Regularly">Regularly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TAB 4: DONOR SPECIFIC DETAILS */}
              <div className={activeTab === "specific" ? "space-y-4" : "hidden"}>
                {donorType === "egg" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Menstrual Cycle Details
                        </Label>
                        <select
                          value={menstrualCycleDetails}
                          onChange={(e) => setMenstrualCycleDetails(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Menstrual Pattern</option>
                          {MENSTRUAL_CYCLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          {menstrualCycleDetails && !MENSTRUAL_CYCLE_OPTIONS.includes(menstrualCycleDetails as any) && (
                            <option value={menstrualCycleDetails}>{menstrualCycleDetails}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Number of Deliveries (Living Children)
                        </Label>
                        <select
                          value={numberOfDeliveries}
                          onChange={(e) => setNumberOfDeliveries(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Deliveries</option>
                          {["0", "1", "2", "3", "4+"].map((num) => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                          {numberOfDeliveries && !["0", "1", "2", "3", "4+"].includes(numberOfDeliveries) && (
                            <option value={numberOfDeliveries}>{numberOfDeliveries}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Number of Abortions / Miscarriages
                        </Label>
                        <select
                          value={numberOfAbortions}
                          onChange={(e) => setNumberOfAbortions(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Abortions</option>
                          {["0", "1", "2", "3+"].map((num) => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                          {numberOfAbortions && !["0", "1", "2", "3+"].includes(numberOfAbortions) && (
                            <option value={numberOfAbortions}>{numberOfAbortions}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Previous Egg Donations Count
                        </Label>
                        <select
                          value={eggPreviousDonationsCount}
                          onChange={(e) => setEggPreviousDonationsCount(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Previous Cycles</option>
                          {["0 (First Time)", "1 Previous Donation", "2 Previous Donations", "3+ Previous Donations"].map((cnt) => (
                            <option key={cnt} value={cnt}>{cnt}</option>
                          ))}
                          {eggPreviousDonationsCount && !["0 (First Time)", "1 Previous Donation", "2 Previous Donations", "3+ Previous Donations"].includes(eggPreviousDonationsCount) && (
                            <option value={eggPreviousDonationsCount}>{eggPreviousDonationsCount}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Ovarian Reserve / AMH
                        </Label>
                        <select
                          value={ovarianReserve}
                          onChange={(e) => setOvarianReserve(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Ovarian Reserve</option>
                          {OVARIAN_RESERVE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          {ovarianReserve && !OVARIAN_RESERVE_OPTIONS.includes(ovarianReserve as any) && (
                            <option value={ovarianReserve}>{ovarianReserve}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          IVF History Notes
                        </Label>
                        <Input
                          placeholder="Notes on previous cycles"
                          value={ivfHistory}
                          onChange={(e) => setIvfHistory(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Eggs Retrieved Count
                        </Label>
                        <Input
                          placeholder="e.g. 14 eggs"
                          value={numberOfEggsRetrieved}
                          onChange={(e) => setNumberOfEggsRetrieved(e.target.value)}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Mature (MII) Eggs Count
                        </Label>
                        <Input
                          placeholder="e.g. 12 mature"
                          value={matureEggsCount}
                          onChange={(e) => setMatureEggsCount(e.target.value)}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Honorarium / Compensation (₹)
                        </Label>
                        <Input
                          placeholder="e.g. 45000"
                          value={eggCompensationPaid}
                          onChange={(e) => setEggCompensationPaid(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Semen Volume (ml)
                        </Label>
                        <select
                          value={semenVolume}
                          onChange={(e) => setSemenVolume(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Volume</option>
                          {SEMEN_VOLUME_OPTIONS.map((vol) => (
                            <option key={vol} value={vol}>{vol}</option>
                          ))}
                          {semenVolume && !SEMEN_VOLUME_OPTIONS.includes(semenVolume as any) && (
                            <option value={semenVolume}>{semenVolume}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Sperm Motility (%)
                        </Label>
                        <select
                          value={motility}
                          onChange={(e) => setMotility(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Motility</option>
                          {SPERM_MOTILITY_OPTIONS.map((mot) => (
                            <option key={mot} value={mot}>{mot}</option>
                          ))}
                          {motility && !SPERM_MOTILITY_OPTIONS.includes(motility as any) && (
                            <option value={motility}>{motility}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Sperm Count (million/ml)
                        </Label>
                        <select
                          value={spermCount}
                          onChange={(e) => setSpermCount(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Sperm Count</option>
                          {SPERM_COUNT_OPTIONS.map((cnt) => (
                            <option key={cnt} value={cnt}>{cnt}</option>
                          ))}
                          {spermCount && !SPERM_COUNT_OPTIONS.includes(spermCount as any) && (
                            <option value={spermCount}>{spermCount}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Total Vials Cryopreserved
                        </Label>
                        <select
                          value={totalVials}
                          onChange={(e) => setTotalVials(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Total Vials</option>
                          {TOTAL_VIALS_OPTIONS.map((vial) => (
                            <option key={vial} value={vial}>{vial}</option>
                          ))}
                          {totalVials && !TOTAL_VIALS_OPTIONS.includes(totalVials as any) && (
                            <option value={totalVials}>{totalVials}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Liquefaction Time
                        </Label>
                        <Input
                          placeholder="e.g. 25 mins"
                          value={liquefactionTime}
                          onChange={(e) => setLiquefactionTime(e.target.value)}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Morphology
                        </Label>
                        <Input
                          placeholder="e.g. >4% normal forms"
                          value={morphology}
                          onChange={(e) => setMorphology(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Abstinence Period (Days)
                        </Label>
                        <select
                          value={abstinencePeriod}
                          onChange={(e) => setAbstinencePeriod(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Abstinence</option>
                          {ABSTINENCE_PERIOD_OPTIONS.map((period) => (
                            <option key={period} value={period}>{period}</option>
                          ))}
                          {abstinencePeriod && !ABSTINENCE_PERIOD_OPTIONS.includes(abstinencePeriod as any) && (
                            <option value={abstinencePeriod}>{abstinencePeriod}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Previous Donations Count
                        </Label>
                        <select
                          value={spermPreviousDonationsCount}
                          onChange={(e) => setSpermPreviousDonationsCount(e.target.value)}
                          className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent"
                        >
                          <option value="">Select Previous Donations</option>
                          {["0 (First Time)", "1 Previous Donation", "2 Previous Donations", "3+ Previous Donations"].map((cnt) => (
                            <option key={cnt} value={cnt}>{cnt}</option>
                          ))}
                          {spermPreviousDonationsCount && !["0 (First Time)", "1 Previous Donation", "2 Previous Donations", "3+ Previous Donations"].includes(spermPreviousDonationsCount) && (
                            <option value={spermPreviousDonationsCount}>{spermPreviousDonationsCount}</option>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Honorarium / Compensation (₹)
                        </Label>
                        <Input
                          placeholder="e.g. 5000"
                          value={spermCompensationPaid}
                          onChange={(e) => setSpermCompensationPaid(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* TAB 5: VIRAL & SCREENING */}
              <div className={activeTab === "viral" ? "space-y-4" : "hidden"}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      HIV I & II Status
                    </Label>
                    <select
                      value={hiv}
                      onChange={(e) => setHiv(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent font-medium"
                    >
                      <option value="">Not Recorded</option>
                      <option value="Non-Reactive">Non-Reactive</option>
                      <option value="Negative">Negative</option>
                      <option value="Reactive">Reactive (Positive)</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      HBsAg (Hepatitis B)
                    </Label>
                    <select
                      value={hbsag}
                      onChange={(e) => setHbsag(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent font-medium"
                    >
                      <option value="">Not Recorded</option>
                      <option value="Non-Reactive">Non-Reactive</option>
                      <option value="Negative">Negative</option>
                      <option value="Reactive">Reactive (Positive)</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      HCV (Hepatitis C)
                    </Label>
                    <select
                      value={hcv}
                      onChange={(e) => setHcv(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent font-medium"
                    >
                      <option value="">Not Recorded</option>
                      <option value="Non-Reactive">Non-Reactive</option>
                      <option value="Negative">Negative</option>
                      <option value="Reactive">Reactive (Positive)</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      VDRL / Syphilis
                    </Label>
                    <select
                      value={vdrl}
                      onChange={(e) => setVdrl(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent font-medium"
                    >
                      <option value="">Not Recorded</option>
                      <option value="Non-Reactive">Non-Reactive</option>
                      <option value="Negative">Negative</option>
                      <option value="Reactive">Reactive (Positive)</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Thalassemia Screening
                    </Label>
                    <select
                      value={thalassemia}
                      onChange={(e) => setThalassemia(e.target.value)}
                      className="w-full text-xs h-9 px-3 rounded-md border border-input bg-transparent font-medium"
                    >
                      <option value="">Select Thalassemia Status</option>
                      {THALASSEMIA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {thalassemia && !THALASSEMIA_OPTIONS.includes(thalassemia as any) && (
                        <option value={thalassemia}>{thalassemia}</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Screening / Lab Test Date
                    </Label>
                    <Input
                      type="date"
                      value={screeningDate}
                      onChange={(e) => setScreeningDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Clinical / Pathology Notes
                  </Label>
                  <textarea
                    rows={2}
                    placeholder="General lab test observations, hemoglobin level, etc."
                    value={screeningNotes}
                    onChange={(e) => setScreeningNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-md border border-input bg-transparent resize-none"
                  />
                </div>
              </div>

              {/* TAB 6: DOCUMENT UPLOADS & INSURANCE */}
              <div className={activeTab === "documents" ? "space-y-6" : "hidden"}>
                <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    Upload available documents and reports from physical or scanned files. <strong>All uploads are optional.</strong>
                  </span>
                </div>

                {/* Section A: Lab Reports & Insurance Policies */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                    <Shield className="w-3.5 h-3.5 text-teal-600" />
                    {donorType === "egg" ? "Clinical Reports & Insurance Policies" : "Clinical & Lab Reports"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadField
                      label="Viral Marker Report (PDF / Image)"
                      value={viralMarkersReport}
                      onChange={setViralMarkersReport}
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      folder="documents"
                      description="HIV, HBsAg, HCV, VDRL lab report"
                    />

                    <FileUploadField
                      label="Blood Report (CBC / Thalassemia)"
                      value={bloodReport}
                      onChange={setBloodReport}
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      folder="documents"
                      description="Complete blood count & biochemistry"
                    />

                    {donorType === "egg" && (
                      <>
                        <FileUploadField
                          label="Life Insurance Policy (Rule 13)"
                          value={lifeInsurance}
                          onChange={setLifeInsurance}
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          folder="documents"
                          description="Mandatory statutory life insurance copy"
                        />

                        <FileUploadField
                          label="Health Insurance Policy"
                          value={healthInsurance}
                          onChange={setHealthInsurance}
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          folder="documents"
                          description="Statutory health insurance policy copy"
                        />
                      </>
                    )}

                    {donorType === "sperm" && (
                      <FileUploadField
                        label="Semen Analysis Report"
                        value={semenAnalysisReport}
                        onChange={setSemenAnalysisReport}
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        folder="documents"
                        description="Semen analysis & cryopreservation report"
                      />
                    )}
                  </div>
                </div>

                {/* Section B: Identity & Statutory Documents */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    Identity & Statutory Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadField
                      label="Donor Photo / Passport Photo"
                      value={passportPhoto}
                      onChange={setPassportPhoto}
                      accept=".png,.jpg,.jpeg,.webp"
                      folder="profile-images"
                      enableCrop={true}
                      cropMode="photo"
                      description="Clear passport-sized photo"
                    />

                    <FileUploadField
                      label="Aadhaar Card (Front)"
                      value={aadhaarFront}
                      onChange={setAadhaarFront}
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      folder="documents"
                      enableCrop={true}
                      cropMode="document"
                      description="Aadhaar front face"
                    />

                    <FileUploadField
                      label="Aadhaar Card (Back)"
                      value={aadhaarBack}
                      onChange={setAadhaarBack}
                      accept=".png,.jpg,.jpeg,.webp,.pdf"
                      folder="documents"
                      enableCrop={true}
                      cropMode="document"
                      description="Aadhaar back address face"
                    />

                    <FileUploadField
                      label="Donor Signature"
                      value={signature}
                      onChange={setSignature}
                      accept=".png,.jpg,.jpeg,.webp"
                      folder="documents"
                      enableCrop={true}
                      cropMode="signature"
                      description="Scanned signature specimen"
                    />

                    <FileUploadField
                      label="Affidavit (Signed / Notarized)"
                      value={affidavit}
                      onChange={setAffidavit}
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      folder="affidavit"
                      description="Statutory legal donor affidavit"
                    />

                    <FileUploadField
                      label="Form 13 (Consent & Fitness PDF)"
                      value={form13}
                      onChange={setForm13}
                      accept=".pdf"
                      folder="form13"
                      description="Rule 13 statutory consent file"
                    />

                    <FileUploadField
                      label="Other Supporting Document"
                      value={otherDocument}
                      onChange={setOtherDocument}
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      folder="documents"
                      description="Any additional file or slip"
                    />
                  </div>
                </div>
              </div>

              {/* TAB 7: CLINIC & ARCHIVE NOTES */}
              <div className={activeTab === "archive" ? "space-y-4" : "hidden"}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Hospital / ART Clinic
                      </Label>
                      <Input
                        placeholder="e.g. City Fertility & ART Centre"
                        value={hospitalOrClinic}
                        onChange={(e) => setHospitalOrClinic(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Treating Doctor Name
                      </Label>
                      <Input
                        placeholder="e.g. Dr. A. Sharma"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Registration Date
                      </Label>
                      <Input
                        type="date"
                        value={registrationDate}
                        onChange={(e) => setRegistrationDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Schedule Date
                      </Label>
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pickup Date
                      </Label>
                      <Input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    General Archival Notes / Box / Remarks
                  </Label>
                  <textarea
                    rows={4}
                    placeholder="Additional details from previous records, binder reference number, physical folder location..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-md border border-input bg-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <DialogFooter className="p-4 border-t bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between sm:justify-between">
              <div className="text-xs text-slate-500 hidden sm:block">
                All fields optional • Safe to save partial legacy records & documents
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {recordToEdit ? "Update Record" : "Save Previous Record"}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
