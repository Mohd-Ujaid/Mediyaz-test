"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  User, 
  Settings, 
  Dna, 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2, 
  Trash2,
  Calendar,
  Phone,
  Mail,
  Home,
  Check,
  ChevronRight,
  ChevronLeft,
  Lock,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { siteConfig } from "@/config/site.config";

interface UploadedFile {
  fileId: string;
  url: string;
  name: string;
  fileType: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not Sure"];
const RH_FACTORS = ["Positive (+)", "Negative (-)", "Any"];

export default function FindDonorWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Core Form State
  const [formData, setFormData] = useState({
    personalDetails: {
      fullName: "",
      gender: "Female",
      dateOfBirth: "",
      maritalStatus: "Married",
      phone: "",
      whatsApp: "",
      email: "",
      country: "India",
      state: "",
      city: "",
      preferredContactMethod: "Email",
      bestTimeToContact: "Morning (9 AM - 12 PM)",
    },
    treatmentRequirement: {
      lookingFor: "sperm" as "sperm" | "egg" | "both",
      purpose: "ivf" as "ivf" | "iui" | "preservation" | "other",
      previousTreatment: false,
      clinicName: "",
      doctorName: "",
      medicalNotes: "",
    },
    donorPreferences: {
      ageRange: "21 - 30",
      bloodGroup: "O+",
      rhFactor: "Positive (+)",
      height: "",
      weight: "",
      skinTone: "Fair",
      eyeColor: "Black",
      hairColor: "Black",
      educationLevel: "Graduate",
      religion: "",
      ethnicity: "",
      language: "Hindi",
      occupation: "",
      cmvStatus: "Any",
      smoking: "No",
      drinking: "No",
      medicalHistory: "Normal / No chronic conditions",
      geneticScreeningRequired: false,
      otherPreferences: "",
    },
    medicalInformation: {
      uploadedReports: [] as UploadedFile[],
      medicalConditions: "",
      geneticDisorders: "",
      currentMedications: "",
      allergies: "",
      doctorNotes: "",
      additionalComments: "",
    },
    consent: {
      digitalSignature: "",
      consentDate: new Date().toISOString().split("T")[0],
      agreedToEligibility: false,
      agreedToContact: false,
      agreedToStorage: false,
      agreedToPrivacyPolicy: false,
    }
  });

  // 1. Auto-save Draft to localStorage with safe deep merging to prevent crashes on older drafts
  useEffect(() => {
    const saved = localStorage.getItem("mediyaz_donor_requirement_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          personalDetails: { ...prev.personalDetails, ...(parsed.personalDetails || {}) },
          treatmentRequirement: { ...prev.treatmentRequirement, ...(parsed.treatmentRequirement || {}) },
          donorPreferences: { ...prev.donorPreferences, ...(parsed.donorPreferences || {}) },
          medicalInformation: { ...prev.medicalInformation, ...(parsed.medicalInformation || {}) },
          consent: { ...prev.consent, ...(parsed.consent || {}) },
        }));
      } catch (e) {
        console.warn("Failed to load draft");
      }
    }
  }, []);

  const saveDraft = (updatedData: typeof formData) => {
    setFormData(updatedData);
    localStorage.setItem("mediyaz_donor_requirement_draft", JSON.stringify(updatedData));
  };

  // Helper nested state update
  const updateNestedState = (section: keyof typeof formData, field: string, value: any) => {
    const sectionData = { ...formData[section], [field]: value };
    const updated = { ...formData, [section]: sectionData };
    saveDraft(updated);
  };

  // 2. Report File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File exceeds the maximum limit of 20MB.");
      return;
    }

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "documents");

      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const data = await res.json();

      if (data.success) {
        const updatedReports = [
          ...formData.medicalInformation.uploadedReports,
          {
            fileId: data.media.fileId,
            url: data.media.url,
            name: data.media.fileName || file.name,
            fileName: data.media.fileName || file.name,
            fileType: data.media.type || file.type,
            type: data.media.type || file.type,
            folder: data.media.folder || "documents",
            size: data.media.size || file.size,
          }
        ];
        updateNestedState("medicalInformation", "uploadedReports", updatedReports);
        toast.success(`Report "${file.name}" uploaded successfully!`);
      } else {
        toast.error(data.error || "File upload failed.");
      }
    } catch {
      toast.error("Network error during file upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeUploadedFile = async (idx: number, fileId: string) => {
    try {
      await fetch(`/api/upload?fileId=${fileId}`, { method: "DELETE" });
      const updatedReports = formData.medicalInformation.uploadedReports.filter((_, i) => i !== idx);
      updateNestedState("medicalInformation", "uploadedReports", updatedReports);
      toast.success("File removed.");
    } catch {
      toast.error("Failed to remove file.");
    }
  };

  // 3. Step Validation Rules
  const isStepValid = () => {
    if (step === 1) {
      const { fullName, phone, email, dateOfBirth } = formData.personalDetails;
      return !!fullName && !!phone && !!email && !!dateOfBirth;
    }
    if (step === 2) {
      return true; // Optional previous details, lookingFor and purpose always have defaults
    }
    if (step === 3) {
      return true; // traits have fallback selectors
    }
    if (step === 4) {
      return true; // Uploads are optional
    }
    if (step === 5) {
      const { digitalSignature, agreedToEligibility, agreedToContact, agreedToStorage, agreedToPrivacyPolicy } = formData.consent;
      return !!digitalSignature && agreedToEligibility && agreedToContact && agreedToStorage && agreedToPrivacyPolicy;
    }
    return true;
  };

  // 4. Form Submit Handler
  const handleSubmit = async () => {
    if (!isStepValid()) {
      toast.error("Please complete all required fields and checklist consent boxes.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/donor-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedId(data.requirement._id);
        localStorage.removeItem("mediyaz_donor_requirement_draft");
        toast.success("Requirements submitted successfully!");
      } else {
        toast.error(data.error || "Submission failed.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  // Print/Download summary
  const handlePrint = () => {
    window.print();
  };

  if (submittedId) {
    // SUCCESS SCREEN
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 select-none print:bg-white print:text-black">
        <Card className="w-full max-w-2xl text-center rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl border-t-8 border-t-primary p-10 space-y-6 print:border-none print:shadow-none">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-4xl animate-bounce">
            <Check className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white print:text-black">Thank You!</h1>
            <h2 className="text-sm font-extrabold text-primary tracking-widest uppercase">Submission Confirmed</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
              Your donor matching requirement dossier has been submitted successfully to the Mediyaz ART Bank registry. Our clinical matching coordinator will review your parameters and contact you within 24–48 business hours.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-250/60 dark:border-slate-800 space-y-2 text-left max-w-md mx-auto print:bg-slate-50 print:border">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Receipt ID:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">{submittedId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Recipient Name:</span>
              <span className="font-bold text-slate-800 dark:text-white">{formData.personalDetails.fullName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Request Type:</span>
              <span className="font-extrabold uppercase text-primary text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">
                {formData.treatmentRequirement.lookingFor} Donor
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-6 print:hidden">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto rounded-xl gap-1 text-xs">
                <Home className="w-4 h-4" /> Return Home
              </Button>
            </Link>
            <Link href="/appointments/book" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto rounded-xl gap-1 text-xs border-primary text-primary">
                <Calendar className="w-4 h-4" /> Book Consultation
              </Button>
            </Link>
            <Button onClick={handlePrint} className="w-full sm:w-auto rounded-xl bg-primary text-white hover:bg-teal-700 text-xs gap-1.5 cursor-pointer font-bold shadow-md shadow-primary/15">
              <FileText className="w-4 h-4" /> Print Receipt
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const stepsHeader = [
    { num: 1, label: "Personal Details" },
    { num: 2, label: "Requirements" },
    { num: 3, label: "Preferences" },
    { num: 4, label: "Medical Data" },
    { num: 5, label: "Consents & Uploads" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 flex flex-col items-center select-none pb-24">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Page Titles */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Register Donor Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Submit your parameters to our clinic. Our fertility specialists will search the private ART bank registry securely on your behalf.
          </p>
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs flex justify-between items-center text-[10px] font-semibold text-slate-500">
          {stepsHeader.map((hdr) => (
            <div key={hdr.num} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                step === hdr.num 
                  ? "bg-secondary text-white shadow-xs" 
                  : step > hdr.num 
                    ? "bg-primary text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}>
                {step > hdr.num ? <Check className="w-3.5 h-3.5" /> : hdr.num}
              </span>
              <span className={`hidden sm:inline ${step === hdr.num ? "text-slate-900 dark:text-white font-bold" : ""}`}>
                {hdr.label}
              </span>
              {hdr.num < 5 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />}
            </div>
          ))}
        </div>

        {/* Wizard Panel Content */}
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden border-t-4 border-t-primary">
          <CardContent className="p-6 sm:p-8 space-y-6">
            
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-extrabold uppercase text-secondary">Step 1: Intended Parent Information</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Please provide your primary clinical contact and demographics details.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="Enter full legal name" 
                      value={formData.personalDetails.fullName}
                      onChange={(e) => updateNestedState("personalDetails", "fullName", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender</label>
                    <select 
                      value={formData.personalDetails.gender}
                      onChange={(e) => updateNestedState("personalDetails", "gender", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-Binary">Non-Binary / Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Birth <span className="text-red-500">*</span></label>
                    <Input 
                      type="date"
                      value={formData.personalDetails.dateOfBirth}
                      onChange={(e) => updateNestedState("personalDetails", "dateOfBirth", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Marital Status</label>
                    <select 
                      value={formData.personalDetails.maritalStatus}
                      onChange={(e) => updateNestedState("personalDetails", "maritalStatus", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="Married">Married</option>
                      <option value="Single">Single</option>
                      <option value="Partnership">Domestic Partnership</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.personalDetails.phone}
                      onChange={(e) => updateNestedState("personalDetails", "phone", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp Number</label>
                    <Input 
                      placeholder="Same as phone or custom"
                      value={formData.personalDetails.whatsApp}
                      onChange={(e) => updateNestedState("personalDetails", "whatsApp", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address <span className="text-red-500">*</span></label>
                    <Input 
                      type="email"
                      placeholder="patient@email.com"
                      value={formData.personalDetails.email}
                      onChange={(e) => updateNestedState("personalDetails", "email", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Country</label>
                    <Input 
                      value={formData.personalDetails.country}
                      onChange={(e) => updateNestedState("personalDetails", "country", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">State</label>
                      <Input 
                        placeholder="e.g. Delhi"
                        value={formData.personalDetails.state}
                        onChange={(e) => updateNestedState("personalDetails", "state", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">City</label>
                      <Input 
                        placeholder="e.g. New Delhi"
                        value={formData.personalDetails.city}
                        onChange={(e) => updateNestedState("personalDetails", "city", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Preferred Contact Method</label>
                    <select 
                      value={formData.personalDetails.preferredContactMethod}
                      onChange={(e) => updateNestedState("personalDetails", "preferredContactMethod", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="Email">Email Only</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="WhatsApp">WhatsApp Message</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Best Time to Contact</label>
                    <Input 
                      placeholder="e.g. Weekdays 2 PM - 5 PM"
                      value={formData.personalDetails.bestTimeToContact}
                      onChange={(e) => updateNestedState("personalDetails", "bestTimeToContact", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Treatment Requirements */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-extrabold uppercase text-secondary">Step 2: Treatment Requirement</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Tell us about the clinical donor matching cycles you are mapping.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">I am looking for <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "sperm", label: "Sperm Donor" },
                        { key: "egg", label: "Egg Donor" },
                        { key: "both", label: "Sperm & Egg (Both)" }
                      ].map((opt) => (
                        <div 
                          key={opt.key}
                          onClick={() => updateNestedState("treatmentRequirement", "lookingFor", opt.key)}
                          className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all text-xs font-bold ${
                            formData.treatmentRequirement.lookingFor === opt.key 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Treatment Purpose <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: "ivf", label: "In Vitro (IVF)" },
                        { key: "iui", label: "Insemination (IUI)" },
                        { key: "preservation", label: "Cryo Preservation" },
                        { key: "other", label: "Other Cycle" }
                      ].map((opt) => (
                        <div 
                          key={opt.key}
                          onClick={() => updateNestedState("treatmentRequirement", "purpose", opt.key)}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-all text-xs font-bold ${
                            formData.treatmentRequirement.purpose === opt.key 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 border-t pt-4">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        id="previousTreatment"
                        checked={formData.treatmentRequirement.previousTreatment}
                        onChange={(e) => updateNestedState("treatmentRequirement", "previousTreatment", e.target.checked)}
                        className="w-4.5 h-4.5 text-primary focus:ring-primary rounded border-slate-300"
                      />
                      <label htmlFor="previousTreatment" className="text-xs font-bold text-slate-800 dark:text-slate-250 cursor-pointer">
                        I have undergone previous fertility treatments
                      </label>
                    </div>
                  </div>

                  {formData.treatmentRequirement.previousTreatment && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2 animate-fadeIn">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Previous IVF Clinic Name</label>
                        <Input 
                          placeholder="e.g. Apollo Fertility"
                          value={formData.treatmentRequirement.clinicName}
                          onChange={(e) => updateNestedState("treatmentRequirement", "clinicName", e.target.value)}
                          className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Attending Endocrinologist / Doctor</label>
                        <Input 
                          placeholder="Dr. Rajesh Varma"
                          value={formData.treatmentRequirement.doctorName}
                          onChange={(e) => updateNestedState("treatmentRequirement", "doctorName", e.target.value)}
                          className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Treatment / Clinical Request Notes</label>
                    <textarea 
                      placeholder="Details regarding your clinical cycle recommendations, timelines, or diagnostic status."
                      value={formData.treatmentRequirement.medicalNotes}
                      onChange={(e) => updateNestedState("treatmentRequirement", "medicalNotes", e.target.value)}
                      className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: Donor Preferences */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-extrabold uppercase text-secondary">Step 3: Private Donor Profile Preferences</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Please indicate preferred traits. These criteria will be matched against our secure registry.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Preferred Age Range</label>
                    <select 
                      value={formData.donorPreferences.ageRange}
                      onChange={(e) => updateNestedState("donorPreferences", "ageRange", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="18 - 25">18 - 25 Years (Optimal Oocyte reserve)</option>
                      <option value="21 - 30">21 - 30 Years (Primary registry bracket)</option>
                      <option value="26 - 35">26 - 35 Years</option>
                      <option value="31 - 40">31 - 40 Years (Sperm donors only)</option>
                      <option value="Any">No preference</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Blood Group</label>
                      <select 
                        value={formData.donorPreferences.bloodGroup}
                        onChange={(e) => updateNestedState("donorPreferences", "bloodGroup", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rh Factor</label>
                      <select 
                        value={formData.donorPreferences.rhFactor}
                        onChange={(e) => updateNestedState("donorPreferences", "rhFactor", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        {RH_FACTORS.map((rh) => <option key={rh} value={rh}>{rh}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Height Preference</label>
                      <Input 
                        placeholder="e.g. 170-180 cm"
                        value={formData.donorPreferences.height}
                        onChange={(e) => updateNestedState("donorPreferences", "height", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Weight Preference</label>
                      <Input 
                        placeholder="e.g. 60-70 kg"
                        value={formData.donorPreferences.weight}
                        onChange={(e) => updateNestedState("donorPreferences", "weight", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Skin Tone / Complexion</label>
                    <select 
                      value={formData.donorPreferences.skinTone}
                      onChange={(e) => updateNestedState("donorPreferences", "skinTone", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="Fair">Fair</option>
                      <option value="Wheatish">Wheatish</option>
                      <option value="Dark">Dark</option>
                      <option value="Any">No Preference</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Eye Color</label>
                      <Input 
                        placeholder="e.g. Black / Brown"
                        value={formData.donorPreferences.eyeColor}
                        onChange={(e) => updateNestedState("donorPreferences", "eyeColor", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hair Color</label>
                      <Input 
                        placeholder="e.g. Black / Brown"
                        value={formData.donorPreferences.hairColor}
                        onChange={(e) => updateNestedState("donorPreferences", "hairColor", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Education Level</label>
                    <select 
                      value={formData.donorPreferences.educationLevel}
                      onChange={(e) => updateNestedState("donorPreferences", "educationLevel", e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                      <option value="Any">No preference</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Religion Preference (Optional)</label>
                    <Input 
                      placeholder="e.g. Hindu / Muslim / Christian"
                      value={formData.donorPreferences.religion}
                      onChange={(e) => updateNestedState("donorPreferences", "religion", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ethnicity / Language Preference</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Ethnicity (optional)"
                        value={formData.donorPreferences.ethnicity}
                        onChange={(e) => updateNestedState("donorPreferences", "ethnicity", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                      <Input 
                        placeholder="Language"
                        value={formData.donorPreferences.language}
                        onChange={(e) => updateNestedState("donorPreferences", "language", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Occupation Preference</label>
                    <Input 
                      placeholder="e.g. Medical / Engineer / Teaching"
                      value={formData.donorPreferences.occupation}
                      onChange={(e) => updateNestedState("donorPreferences", "occupation", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:col-span-2 border-t pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">CMV Status</label>
                      <select 
                        value={formData.donorPreferences.cmvStatus}
                        onChange={(e) => updateNestedState("donorPreferences", "cmvStatus", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="Negative">CMV Negative</option>
                        <option value="Positive">CMV Positive</option>
                        <option value="Any">No Preference (Any)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lifestyle: Smoking</label>
                      <select 
                        value={formData.donorPreferences.smoking}
                        onChange={(e) => updateNestedState("donorPreferences", "smoking", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="No">Non-Smoker Only</option>
                        <option value="Any">Any</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lifestyle: Drinking</label>
                      <select 
                        value={formData.donorPreferences.drinking}
                        onChange={(e) => updateNestedState("donorPreferences", "drinking", e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="No">Occasional / Non-Drinker</option>
                        <option value="Any">Any</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 border-t pt-4">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        id="geneticScreeningRequired"
                        checked={formData.donorPreferences.geneticScreeningRequired}
                        onChange={(e) => updateNestedState("donorPreferences", "geneticScreeningRequired", e.target.checked)}
                        className="w-4.5 h-4.5 text-primary focus:ring-primary rounded border-slate-300"
                      />
                      <label htmlFor="geneticScreeningRequired" className="text-xs font-bold text-slate-800 dark:text-slate-250 cursor-pointer">
                        Require Full 300+ Parameter Next-Generation Genetic Panel (Pre-Screening)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Other Specific Trait / Career Preferences</label>
                    <textarea 
                      placeholder="Detail any other traits or criteria you would like our matching coordinator to consider (e.g. musical background, specific athletic interests, hobbies)."
                      value={formData.donorPreferences.otherPreferences}
                      onChange={(e) => updateNestedState("donorPreferences", "otherPreferences", e.target.value)}
                      className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* STEP 4: Medical Information & Declarations */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-extrabold uppercase text-secondary">Step 4: Recipient Medical Declaration</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Please specify if there are any chronic medical conditions or genetic history.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Medical Conditions</label>
                    <Input 
                      placeholder="e.g. Thyroid, diabetes (or none)"
                      value={formData.medicalInformation.medicalConditions}
                      onChange={(e) => updateNestedState("medicalInformation", "medicalConditions", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Genetic Disorders / History</label>
                    <Input 
                      placeholder="e.g. Thalassemia carrier (or none)"
                      value={formData.medicalInformation.geneticDisorders}
                      onChange={(e) => updateNestedState("medicalInformation", "geneticDisorders", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Medications</label>
                    <Input 
                      placeholder="Specify active dosages (or none)"
                      value={formData.medicalInformation.currentMedications}
                      onChange={(e) => updateNestedState("medicalInformation", "currentMedications", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Allergies</label>
                    <Input 
                      placeholder="Drug or food allergies (or none)"
                      value={formData.medicalInformation.allergies}
                      onChange={(e) => updateNestedState("medicalInformation", "allergies", e.target.value)}
                      className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Doctor Recommendations / Diagnostics Summary</label>
                    <textarea 
                      placeholder="Any additional diagnostic summaries or recommendations from your referring gynecologist."
                      value={formData.medicalInformation.additionalComments}
                      onChange={(e) => updateNestedState("medicalInformation", "additionalComments", e.target.value)}
                      className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Consents & Document Uploads */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-extrabold uppercase text-secondary">Step 5: Document Uploads & Legal consent</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Upload previous clinical reports (max 20MB, PDF/PNG/JPG) and check the legal clearances.</p>
                </div>
                
                {/* File Uploader */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Upload Previous Medical/Fertility Reports</label>
                  
                  {/* Drag-and-drop box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-all cursor-pointer space-y-2"
                  >
                    <div className="p-3 bg-primary/10 text-primary w-fit rounded-full mx-auto">
                      <Upload className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Drag & Drop or Click to Select File</div>
                    <div className="text-[10px] text-slate-400">PDF, PNG, JPG up to 20MB limit</div>
                  </div>

                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                  />

                  {uploading && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Uploading document and updating data room...</span>
                    </div>
                  )}

                  {/* Uploaded File Previews */}
                  {formData.medicalInformation.uploadedReports.length > 0 && (
                    <div className="space-y-2 border-t pt-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block">Uploaded Documents ({formData.medicalInformation.uploadedReports.length})</span>
                      {formData.medicalInformation.uploadedReports.map((file, idx) => (
                        <div key={file.fileId} className="flex justify-between items-center p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 truncate max-w-md">
                            <FileText className="w-4 h-4 shrink-0 text-emerald-600" />
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold truncate">{file.name}</a>
                            <span className="text-[9px] text-slate-400">({file.fileType.split("/")[1]?.toUpperCase() || "PDF"})</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeUploadedFile(idx, file.fileId)}
                            className="rounded-lg h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legal Clearances Checklist */}
                <div className="space-y-3.5 border-t pt-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block">Legal Clearances & Declarations</span>
                  
                  <div className="flex items-start gap-2.5">
                    <input 
                      type="checkbox"
                      id="agreedToEligibility"
                      checked={formData.consent.agreedToEligibility}
                      onChange={(e) => updateNestedState("consent", "agreedToEligibility", e.target.checked)}
                      className="w-4.5 h-4.5 text-primary focus:ring-primary rounded border-slate-300 mt-0.5"
                    />
                    <label htmlFor="agreedToEligibility" className="text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                      I understand that donor availability depends strictly on medical eligibility, genetic matching clearance, and regional legal directives. <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <input 
                      type="checkbox"
                      id="agreedToContact"
                      checked={formData.consent.agreedToContact}
                      onChange={(e) => updateNestedState("consent", "agreedToContact", e.target.checked)}
                      className="w-4.5 h-4.5 text-primary focus:ring-primary rounded border-slate-300 mt-0.5"
                    />
                    <label htmlFor="agreedToContact" className="text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                      I agree to be contacted personally by the Mediyaz clinical coordinator team via Phone, Email, or WhatsApp. <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <input 
                      type="checkbox"
                      id="agreedToStorage"
                      checked={formData.consent.agreedToStorage}
                      onChange={(e) => updateNestedState("consent", "agreedToStorage", e.target.checked)}
                      className="w-4.5 h-4.5 text-primary focus:ring-primary rounded border-slate-300 mt-0.5"
                    />
                    <label htmlFor="agreedToStorage" className="text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                      I consent to the secure, encrypted storage of my medical files and diagnostic reports in the clinic database. <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <input 
                      type="checkbox"
                      id="agreedToPrivacyPolicy"
                      checked={formData.consent.agreedToPrivacyPolicy}
                      onChange={(e) => updateNestedState("consent", "agreedToPrivacyPolicy", e.target.checked)}
                      className="w-4.5 h-4.5 text-primary focus:ring-primary rounded border-slate-300 mt-0.5"
                    />
                    <label htmlFor="agreedToPrivacyPolicy" className="text-xs text-slate-700 dark:text-slate-350 cursor-pointer">
                      I have read, understood, and agreed to the clinic's Privacy Policy guidelines. <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {/* Digital Signature */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Intended Parent Signature (Type Name) <span className="text-red-500">*</span></label>
                      <Input 
                        placeholder="Enter full name as digital signature"
                        value={formData.consent.digitalSignature}
                        onChange={(e) => updateNestedState("consent", "digitalSignature", e.target.value)}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-50/50 dark:bg-slate-950/50 font-serif italic text-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Signature Date</label>
                      <Input 
                        type="date"
                        disabled
                        value={formData.consent.consentDate}
                        className="rounded-xl h-10 px-3 text-xs bg-slate-100 border-slate-200 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Action button panel */}
        <div className="flex justify-between items-center gap-3">
          <Button 
            disabled={step === 1 || submitting}
            onClick={() => setStep(step - 1)}
            variant="outline"
            className="rounded-xl h-10 px-4 text-xs font-bold gap-1 border-primary text-primary"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>

          {step < 5 ? (
            <Button 
              disabled={!isStepValid()}
              onClick={() => setStep(step + 1)}
              className="rounded-xl h-10 px-4 text-xs font-bold bg-primary text-white hover:bg-teal-700 gap-1 cursor-pointer shadow-md shadow-primary/10"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              disabled={!isStepValid() || submitting}
              onClick={handleSubmit}
              className="rounded-xl h-10 px-5 text-xs font-bold bg-primary text-white hover:bg-teal-700 gap-1.5 cursor-pointer shadow-md shadow-primary/15"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Requirement...
                </>
              ) : (
                <>
                  Submit Preference Dossier <CheckCircle className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
