/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ── Session helpers ──────────────────────────────────────────────────────────
const SESSION_KEY = "mediyaz_donor_otp_session";
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

interface OtpSession {
  registrationId: string;
  aadhaar: string;
  phone: string;
  expiresAt: number;
}

function getOtpSession(): OtpSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: OtpSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setOtpSession(data: Omit<OtpSession, "expiresAt">) {
  try {
    const session: OtpSession = { ...data, expiresAt: Date.now() + SESSION_TTL_MS };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

function clearOtpSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDonorFormStore } from "../store";
import { StepProgress } from "./StepProgress";
import { StepPersonalInfo } from "./StepPersonalInfo";
import { StepContactInfo } from "./StepContactInfo";
import { StepMedicalInfo } from "./StepMedicalInfo";
import { StepDonorInfo } from "./StepDonorInfo";
import { StepLabReports } from "./StepLabReports";
import { StepDocuments } from "./StepDocuments";
import { StepEmergencyContact } from "./StepEmergencyContact";
import { StepConsent } from "./StepConsent";
import { ReviewPage } from "./ReviewPage";
import { 
  STEP_SCHEMAS, 
  STEP_LABELS, 
  spermDonorInfoSchema, 
  eggDonorInfoSchema,
  personalInfoSchema,
  contactInfoSchema,
  emergencyContactSchema,
  medicalInfoSchema,
  labReportsSchema,
  documentsSchema,
  consentSchema
} from "@/features/donor-registration/validations/donor-registration";
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Loader2, Lock, ShieldAlert, ChevronRight, FileText, Edit3, ShieldCheck } from "lucide-react";
import {
  getRegistrationAction,
  updateRegistrationStepAction,
  submitRegistrationAction,
  createDraftRegistrationAction,
} from "../actions/donor-registration.actions";
import { toast } from "sonner";
import Link from "next/link";

interface RegistrationWizardProps {
  donorType: "sperm" | "egg";
  draftId?: string;
}

export function RegistrationWizard({ donorType, draftId }: RegistrationWizardProps) {
  const router = useRouter();
  const store = useDonorFormStore();
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [selectedInquiryType, setSelectedInquiryType] = useState<"sperm" | "egg">(donorType);
  const [manualRegId, setManualRegId] = useState("");

  const {
    currentStep,
    completedSteps,
    registrationId,
    setDonorType,
    setCurrentStep,
    setRegistrationId,
    markStepCompleted,
    isSaving,
    isSubmitting,
    isLoading,
    setIsSaving,
    setIsSubmitting,
    setIsLoading,
    loadFromServer,
    getAllFormData,
    resetForm,
  } = store;

  const derivedType = registrationId?.startsWith("MED-ED")
    ? "egg"
    : registrationId?.startsWith("MED-SD")
    ? "sperm"
    : donorType;

  const accentColor = derivedType === "egg" ? "rose" : "teal";
  const accentClasses = derivedType === "egg"
    ? "bg-rose-500 hover:bg-rose-400 text-white focus:ring-rose-400"
    : "bg-teal-500 hover:bg-teal-400 text-slate-950 focus:ring-teal-500";

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Restore OTP verified state from sessionStorage (survives page refresh, expires after 1 hour)
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(() => {
    const session = getOtpSession();
    return session !== null;
  });
  // 'existing' = donor has a Registration ID (online inquiry done)
  // 'walkin'   = donor walks in directly, no prior Registration ID
  const [verificationMode, setVerificationMode] = useState<"existing" | "walkin">("existing");
  const [registrationIdInput, setRegistrationIdInput] = useState<string>(() => getOtpSession()?.registrationId ?? draftId ?? "");
  const [aadhaarInput, setAadhaarInput] = useState<string>(() => getOtpSession()?.aadhaar ?? "");
  const [phoneInput, setPhoneInput] = useState<string>(() => getOtpSession()?.phone ?? "");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (store.contactInfo.mobileNumber && !phoneInput) {
      setPhoneInput(store.contactInfo.mobileNumber);
    }
    if (store.personalInfo.aadhaarNumber && !aadhaarInput) {
      setAadhaarInput(store.personalInfo.aadhaarNumber);
    }
  }, [store.contactInfo.mobileNumber, store.personalInfo.aadhaarNumber]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    if (verificationMode === "existing" && !registrationIdInput.trim()) {
      setOtpError("Please enter your Registration ID.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/donor-registration/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          phone: phoneInput,
          aadhaar: aadhaarInput,
          registrationId: verificationMode === "existing" ? registrationIdInput.trim() : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setResendCountdown(30);
        toast.success("Verification OTP sent to your phone number!");
      } else {
        setOtpError(data.error || "Failed to send OTP.");
        toast.error(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setOtpError("Network error. Please try again.");
      toast.error("Network error.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/donor-registration/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone: phoneInput, otp: otpInput })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP verified successfully!");

        if (verificationMode === "existing") {
          // Load existing registration by Registration ID
          const regId = registrationIdInput.trim();
          const loadRes = (await getRegistrationAction(regId)) as any;
          if (loadRes.success && loadRes.registration) {
            loadFromServer(loadRes.registration);
            setRegistrationId(regId);
            setOtpSession({ registrationId: regId, aadhaar: aadhaarInput, phone: phoneInput });
            setIsOtpVerified(true);
          } else {
            setOtpError("Registration ID not found. Please check and try again.");
            toast.error("Registration ID not found.");
          }
        } else {
          // Walk-in: create a new draft registration
          const draftRes = await createDraftRegistrationAction(donorType, {
            personalInfo: { aadhaarNumber: aadhaarInput.replace(/[^0-9]/g, "") },
            contactInfo: { mobileNumber: phoneInput.replace(/[^0-9+]/g, "") }
          });
          if (draftRes.success && "registration" in draftRes) {
            loadFromServer(draftRes.registration);
            const regId = draftRes.registrationId;
            setRegistrationId(regId);
            setOtpSession({ registrationId: regId, aadhaar: aadhaarInput, phone: phoneInput });
            setIsOtpVerified(true);
            toast.success(`Registration started! Your ID: ${regId}`);
          } else {
            const errMsg = "error" in draftRes ? draftRes.error : "Failed to create registration.";
            setOtpError(errMsg);
            toast.error(errMsg);
          }
        }
      } else {
        setOtpError(data.error || "OTP verification failed.");
        toast.error(data.error || "OTP verification failed.");
      }
    } catch (err) {
      setOtpError("Network error. Please try again.");
      toast.error("Network error.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Initialize or fetch draft
  useEffect(() => {
    resetForm();
    setDonorType(donorType);

    async function fetchDraft() {
      if (!draftId) {
        // Guest mode: do not block, show the security verification screen
        setIsBlocked(false);
        setIsLoading(false);
        return;
      }

      // Load existing draft if draftId is in URL
      try {
        setIsLoading(true);
        const data = (await getRegistrationAction(draftId)) as any;
        if (data.success && data.registration) {
          loadFromServer(data.registration);
          // Persist session keyed to this draftId (reuses aadhaar/phone from sessionStorage if present)
          const existingSession = getOtpSession();
          setOtpSession({
            registrationId: draftId,
            aadhaar: existingSession?.aadhaar ?? data.registration.personalInfo?.aadhaarNumber ?? "",
            phone: existingSession?.phone ?? data.registration.contactInfo?.mobileNumber ?? "",
          });
          setIsOtpVerified(true); // Bypass OTP verification if valid draftId is in URL
          toast.success("Draft loaded successfully.");
        } else {
          setIsBlocked(true);
          setBlockReason("The provided Registration ID is invalid or has expired. Please verify your invitation link.");
        }
      } catch (error) {
        setIsBlocked(true);
        setBlockReason("Failed to load your registration draft from the clinic database.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDraft();
  }, [donorType, draftId]);

  // Debounced/Manual Auto-Save
  const saveDraft = async (stepOverride?: number) => {
    if (!registrationId) return;
    setIsSaving(true);
    try {
      const allData = getAllFormData();
      const data = await updateRegistrationStepAction(registrationId, {
        ...allData,
        currentStep: stepOverride !== undefined ? stepOverride : currentStep,
      });
      if (!data.success) {
        toast.error("Failed to save draft progress.");
      }
    } catch (error) {
      console.error("Auto-save error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const tempErrors: Record<string, string> = {};

    if (step === 1) {
      const personalValid = personalInfoSchema.safeParse(store.personalInfo);
      if (!personalValid.success) {
        personalValid.error.issues.forEach((issue) => {
          tempErrors[`personalInfo.${issue.path.join(".")}`] = issue.message;
        });
      }
      const contactValid = contactInfoSchema.safeParse(store.contactInfo);
      if (!contactValid.success) {
        contactValid.error.issues.forEach((issue) => {
          tempErrors[`contactInfo.${issue.path.join(".")}`] = issue.message;
        });
      }
      const emergencyValid = emergencyContactSchema.safeParse(store.emergencyContact);
      if (!emergencyValid.success) {
        emergencyValid.error.issues.forEach((issue) => {
          tempErrors[`emergencyContact.${issue.path.join(".")}`] = issue.message;
        });
      }
      const medicalValid = medicalInfoSchema.safeParse(store.medicalInfo);
      if (!medicalValid.success) {
        medicalValid.error.issues.forEach((issue) => {
          tempErrors[`medicalInfo.${issue.path.join(".")}`] = issue.message;
        });
      }
      const donorSchema = donorType === "sperm" ? spermDonorInfoSchema : eggDonorInfoSchema;
      const donorData = donorType === "sperm" ? store.spermDonorInfo : store.eggDonorInfo;
      const donorValid = donorSchema.safeParse(donorData);
      if (!donorValid.success) {
        donorValid.error.issues.forEach((issue) => {
          const prefix = donorType === "sperm" ? "spermDonorInfo" : "eggDonorInfo";
          tempErrors[`${prefix}.${issue.path.join(".")}`] = issue.message;
        });
      }
    }

    if (step === 2) {
      const labValid = labReportsSchema.safeParse(store.labReports);
      if (!labValid.success) {
        labValid.error.issues.forEach((issue) => {
          tempErrors[`labReports.${issue.path.join(".")}`] = issue.message;
        });
      }
      const docValid = documentsSchema.safeParse(store.documents);
      if (!docValid.success) {
        docValid.error.issues.forEach((issue) => {
          tempErrors[`documents.${issue.path.join(".")}`] = issue.message;
        });
      }
    }

    if (step === 3) {
      const consentValid = consentSchema.safeParse(store.consent);
      if (!consentValid.success) {
        consentValid.error.issues.forEach((issue) => {
          tempErrors[`consent.${issue.path.join(".")}`] = issue.message;
        });
      }
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      // Find the first error category to make the toast descriptive
      const firstErrorKey = Object.keys(tempErrors)[0];
      const errorMsg = tempErrors[firstErrorKey];
      toast.error(`Please correct the errors: ${errorMsg}`);
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (currentStep === 3) return;

    const isValid = validateStep(currentStep);
    if (!isValid) return;

    markStepCompleted(currentStep);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    await saveDraft(nextStep);
  };

  const handlePrev = async () => {
    if (currentStep === 1) return;
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    await saveDraft(prevStep);
  };

  const handleStepClick = async (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      await saveDraft(step);
    } else if (step > currentStep) {
      for (let s = currentStep; s < step; s++) {
        if (!validateStep(s)) return;
        markStepCompleted(s);
      }
      setCurrentStep(step);
      await saveDraft(step);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const allData = getAllFormData();
      const data = await submitRegistrationAction(registrationId || "", allData);
      if (data.success) {
        toast.success("Registration submitted successfully!");
        router.push(`/donor/register/${registrationId}/complete`);
      } else {
        toast.error(data.error || "Submission failed.");
      }
    } catch (error) {
      toast.error("Network error during final submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Initializing donor registry portal...</p>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 md:p-10 shadow-lg space-y-8">
          
          {/* Header & Notice */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-sm">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Registration Access Restricted
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {blockReason}
            </p>
          </div>

          {/* Process Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              Required Onboarding Workflow
            </h3>
            <div className="space-y-3 text-xs pl-2 border-l border-slate-100 dark:border-slate-800">
              {[
                { label: "1. Select Donor Program", desc: "Choose either Sperm Donor or Egg Donor program details." },
                { label: "2. Submit Pre-Screening Inquiry", desc: "Submit an online form with basic medical & contact details." },
                { label: "3. Clinic Evaluation", desc: "Our specialist embryologists and coordinators review your records." },
                { label: "4. Expert Counseling", desc: "A clinical specialist conducts initial diagnostics review." },
                { label: "5. Onboarding ID Generated", desc: "Receive clinical approval and your secure Registration ID link." },
                { label: "6. Onboarding Wizard", desc: "Access the multi-step medical declarations forms." },
              ].map((step, idx) => (
                <div key={idx} className="relative pl-4 space-y-0.5">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="font-bold text-slate-800 dark:text-slate-200">{step.label}</div>
                  <div className="text-[11px] text-slate-400">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Inquiry Form Direct CTAs */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Choose a Donor Program:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInquiryType("sperm")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    selectedInquiryType === "sperm"
                      ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-400"
                      : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-500"
                  }`}
                >
                  Sperm Donor
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInquiryType("egg")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    selectedInquiryType === "egg"
                      ? "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400"
                      : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-500"
                  }`}
                >
                  Egg Donor
                </button>
              </div>
            </div>

            <Link href={`/donor/query?type=${selectedInquiryType}`} className="block w-full">
              <Button className="w-full rounded-[10px] h-10 text-xs font-bold text-slate-950 bg-teal-500 hover:bg-teal-400 shadow-md shadow-teal-500/15 flex items-center justify-center gap-1.5 cursor-pointer">
                Submit Pre-Screening Inquiry <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>

            {/* Enter Manual Onboarding ID */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Already have a Registration ID?
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If you completed pre-screening and received an approval code from clinic staff, enter it below to start your registration.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. MED-SD-2026-123456"
                  value={manualRegId}
                  onChange={(e) => setManualRegId(e.target.value.trim())}
                  className="flex-1 h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono text-slate-800 dark:text-white"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (!manualRegId) {
                      toast.error("Please enter a valid Registration ID.");
                      return;
                    }
                    // Navigate to the same route with the new draft ID search query
                    router.push(`/donor/register?id=${manualRegId}&type=${selectedInquiryType}`);
                    // Force UI to reset and load the draft
                    setIsBlocked(false);
                    setIsLoading(true);
                  }}
                  className="rounded-[10px] text-xs h-9 px-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-905 font-bold cursor-pointer shrink-0"
                >
                  Verify Code
                </Button>
              </div>
            </div>

            <Link href="/" className="block w-full">
              <Button variant="outline" className="w-full rounded-[10px] h-10 text-xs font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center gap-1">
                Return to Home Page
              </Button>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  if (!isOtpVerified) {
    const isExisting = verificationMode === "existing";
    const canSendOtp = isExisting
      ? registrationIdInput.trim().length >= 8 && aadhaarInput.length === 12 && phoneInput.length >= 10
      : aadhaarInput.length === 12 && phoneInput.length >= 10;

    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">

          {/* Header */}
          <div className="text-center space-y-2 px-8 pt-8 pb-6">
            <div className="mx-auto w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {donorType === "egg" ? "Egg Donor" : "Sperm Donor"} Registration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              How are you registering today?
            </p>
          </div>

          {/* Mode tabs */}
          <div className="grid grid-cols-2 border-t border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setVerificationMode("existing"); setOtpSent(false); setOtpInput(""); setOtpError(""); }}
              className={`py-3 text-xs font-bold transition-colors cursor-pointer ${
                isExisting
                  ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-b-2 border-teal-500"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              I have a Registration ID
            </button>
            <button
              type="button"
              onClick={() => { setVerificationMode("walkin"); setOtpSent(false); setOtpInput(""); setOtpError(""); }}
              className={`py-3 text-xs font-bold transition-colors cursor-pointer border-l border-slate-100 dark:border-slate-800 ${
                !isExisting
                  ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-b-2 border-teal-500"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              Walk-in / New Donor
            </button>
          </div>

          <div className="px-8 py-6 space-y-5">

            {/* Mode description */}
            <div className={`rounded-xl p-3 text-[11px] leading-relaxed ${
              isExisting
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900"
            }`}>
              {isExisting
                ? "You filled an inquiry form online and received a Registration ID from the clinic. Enter it below to continue."
                : "You are registering directly at the clinic without a prior inquiry form. A new Registration ID will be assigned to you after verification."
              }
            </div>

            {otpError && (
              <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl leading-relaxed">
                {otpError}
              </div>
            )}

            <div className="space-y-4">

              {/* Registration ID — only shown in 'existing' mode */}
              {isExisting && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registration ID</label>
                  <input
                    type="text"
                    placeholder="e.g. MED-SD-2026-12345678"
                    disabled={otpSent || otpLoading}
                    value={registrationIdInput}
                    onChange={(e) => setRegistrationIdInput(e.target.value.trim().toUpperCase())}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Aadhaar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">12-Digit Aadhaar Number</label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012"
                  maxLength={12}
                  disabled={otpSent || otpLoading}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  maxLength={13}
                  disabled={otpSent || otpLoading}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9+]/g, ""))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* OTP */}
              {otpSent && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">6-Digit OTP sent to your phone</label>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    maxLength={6}
                    disabled={otpLoading}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-base font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Action buttons */}
              {!otpSent ? (
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !canSendOtp}
                  className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {otpLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send OTP & Verify"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpInput.length !== 6}
                    className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {otpLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> {isExisting ? "Loading..." : "Creating..."}</>
                      : isExisting ? "Confirm OTP & Continue" : "Confirm OTP & Start Registration"
                    }
                  </Button>

                  <div className="flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpInput(""); setOtpError(""); }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      ← Change Details
                    </button>
                    {resendCountdown > 0 ? (
                      <span className="text-[11px] font-semibold text-slate-400">Resend in {resendCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="text-[11px] font-semibold text-teal-600 hover:underline cursor-pointer disabled:text-slate-400"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
              {isExisting
                ? "Registration ID is provided by clinic staff after inquiry form review."
                : "Walk-in registrations are processed on-site. Please have your Aadhaar card ready."
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col gap-6">

        {/* Verified session info strip */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs">
          <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" /> Session Verified
          </div>
          <div className="flex flex-wrap gap-4 ml-2 font-mono text-slate-700 dark:text-slate-300">
            {registrationId && (
              <span><span className="font-sans text-slate-400 mr-1">ID:</span>{registrationId}</span>
            )}
            {aadhaarInput && (
              <span><span className="font-sans text-slate-400 mr-1">Aadhaar:</span>XXXX-XXXX-{aadhaarInput.slice(-4)}</span>
            )}
            {phoneInput && (
              <span><span className="font-sans text-slate-400 mr-1">Mobile:</span>XXXXXX{phoneInput.slice(-4)}</span>
            )}
          </div>
          <span className="ml-auto text-[10px] text-slate-400">Session valid 1 hour · refreshing is safe</span>
        </div>

        {/* Progress Tracker */}
        <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
          <StepProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            donorType={donorType}
          />
        </Card>
 
        {/* Form Body */}
        <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md min-h-[500px] flex flex-col">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between py-4">
            <div>
              {currentStep !== 3 ? (
                <>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    {derivedType === "egg" ? "Egg Donor Registration" : "Sperm Donor Registration"}
                  </CardTitle>
                </>
              ) : (
                <>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    {derivedType === "egg" ? "Form Review & Submission (Oocyte Donor)" : "Form Review & Submission (Sperm Donor)"}
                  </CardTitle>
                  <CardDescription className="text-xs ml-7 mt-0.5">
                    Please review the finalized legal agreements below before printing.
                  </CardDescription>
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {currentStep === 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl text-xs gap-1.5 h-9 px-4 font-semibold text-blue-600 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Edit Document Data
                </Button>
              )}
              {isSaving ? (
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 h-9 px-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Draft...
                </span>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => saveDraft()}
                  className="rounded-xl text-xs gap-1.5 h-9 px-4 font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm cursor-pointer"
                  title="Manual Save"
                >
                  <Save className="w-4 h-4" /> Save Draft
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 flex-1 flex flex-col justify-between">
            {/* Step animation transitions */}
            <div className="flex-1 mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <div className="space-y-12">
                      <StepPersonalInfo errors={errors} />
                      <hr className="border-slate-200 dark:border-slate-800" />
                      <StepContactInfo errors={errors} />
                      <hr className="border-slate-200 dark:border-slate-800" />
                      <StepEmergencyContact errors={errors} />
                      <hr className="border-slate-200 dark:border-slate-800" />
                      <StepMedicalInfo errors={errors} />
                      <hr className="border-slate-200 dark:border-slate-800" />
                      <StepDonorInfo errors={errors} />
                    </div>
                  )}
                  {currentStep === 2 && (
                    <div className="space-y-12">
                      <StepLabReports errors={errors} />
                      <hr className="border-slate-200 dark:border-slate-800" />
                      <StepDocuments errors={errors} />
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div className="space-y-12">
                      <ReviewPage onEditStep={(step) => {
                        if ([1, 2, 3, 4, 7].includes(step)) {
                          setCurrentStep(1);
                        } else if ([5, 6].includes(step)) {
                          setCurrentStep(2);
                        } else {
                          setCurrentStep(3);
                        }
                      }} />
                      <hr className="border-slate-200 dark:border-slate-800" />
                      <StepConsent errors={errors} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step Navigation Controls (Sticky on Mobile) */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 pt-4 pb-4 -mx-6 px-6 z-10 md:static md:p-0 md:m-0 md:border-none md:pt-6 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1 || isSubmitting}
                  className="rounded-[10px] text-xs gap-1.5 h-10 px-4"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </Button>
                {currentStep < 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving}
                    onClick={() => {
                      toast.info("Saving registration draft progress...");
                      const currentSaveDraft = store.getAllFormData();
                      updateRegistrationStepAction(store.registrationId || "", currentSaveDraft)
                        .then((data) => {
                          if (data.success) {
                            toast.success("Draft saved successfully!");
                          } else {
                            toast.error("Failed to save draft.");
                          }
                        })
                        .catch(() => toast.error("Error saving draft."));
                    }}
                    className="rounded-[10px] text-xs gap-1.5 h-10 px-3 text-slate-500 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    title="Save Draft Progress"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Save Draft</span>
                  </Button>
                )}
              </div>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className={`rounded-[10px] text-xs gap-1.5 h-10 px-5 font-semibold ${accentClasses}`}
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-[10px] text-xs gap-1.5 h-10 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 animate-in fade-in"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Final Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
