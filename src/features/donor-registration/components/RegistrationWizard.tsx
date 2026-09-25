/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ── Session helpers ──────────────────────────────────────────────────────────
const SESSION_KEY = "mediyaz_donor_otp_session";
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

interface OtpSession {
  registrationId: string;
  aadhaar: string;
  phone: string;
  expiresAt: number;
}

function getOtpSession(expectedType?: "sperm" | "egg"): OtpSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: OtpSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (expectedType) {
      if (expectedType === "egg" && session.registrationId && session.registrationId.startsWith("MED-SD")) return null;
      if (expectedType === "sperm" && session.registrationId && session.registrationId.startsWith("MED-ED")) return null;
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
  spermDonorInfoSchema, 
  eggDonorInfoSchema,
  personalInfoSchema,
  spermPersonalInfoSchema,
  eggPersonalInfoSchema,
  contactInfoSchema,
  emergencyContactSchema,
  medicalInfoSchema,
  labReportsSchema,
  documentsSchema,
  consentSchema
} from "@/features/donor-registration/validations/donor-registration";
import { ArrowLeft, Save, CheckCircle2, Loader2, Lock, ShieldCheck, ChevronRight } from "lucide-react";
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
  const searchParams = useSearchParams();
  const store = useDonorFormStore();
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [selectedInquiryType, setSelectedInquiryType] = useState<"sperm" | "egg">(donorType);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [manualRegId, setManualRegId] = useState("");

  const {
    registrationId,
    setDonorType,
    setRegistrationId,
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

  const derivedType = donorType;

  useEffect(() => {
    setDonorType(donorType);
  }, [donorType, setDonorType]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Restore OTP verified state from sessionStorage
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(() => {
    const session = getOtpSession(donorType);
    return session !== null;
  });

  const [registrationIdInput, setRegistrationIdInput] = useState<string>(() => getOtpSession(donorType)?.registrationId ?? draftId ?? "");
  const [aadhaarInput, setAadhaarInput] = useState<string>(() => getOtpSession(donorType)?.aadhaar ?? "");
  const [phoneInput, setPhoneInput] = useState<string>(() => getOtpSession(donorType)?.phone ?? "");
  const [agentCodeInput, setAgentCodeInput] = useState<string>(() => {
    if (donorType !== "egg") return "";
    return (searchParams?.get("agent") || searchParams?.get("agentCode") || searchParams?.get("ref") || searchParams?.get("code") || store.agentCode || "").toUpperCase();
  });
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (donorType !== "egg") {
      setAgentCodeInput("");
      store.setAgentCode("");
      return;
    }
    const urlAgent = searchParams?.get("agent") || searchParams?.get("agentCode") || searchParams?.get("ref") || searchParams?.get("code");
    if (urlAgent) {
      const clean = urlAgent.toUpperCase().trim();
      setAgentCodeInput(clean);
      store.setAgentCode(clean);
    }
  }, [searchParams, donorType]);

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
    if (!aadhaarInput || aadhaarInput.length !== 12) {
      setOtpError("Aadhaar Number must be exactly 12 digits.");
      return;
    }
    if (!phoneInput || phoneInput.length < 10) {
      setOtpError("Mobile Number must be at least 10 digits.");
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
          registrationId: draftId || undefined
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

        const cleanAgent = donorType === "egg"
          ? ((agentCodeInput || store.agentCode || "").trim().toUpperCase() || undefined)
          : undefined;

        // Direct registration: create or load a draft registration using Aadhaar + phone + optional agentCode
        const createRes = (await createDraftRegistrationAction(donorType, {
          personalInfo: { aadhaarNumber: aadhaarInput },
          contactInfo: { mobileNumber: phoneInput },
          agentCode: cleanAgent,
          registrationSource: "walk_in"
        })) as any;
        if (createRes.success && createRes.registration) {
          const regId = createRes.registrationId;

          // Merge verified Aadhaar, Phone, and Agent Code
          const mergedRegistration = {
            ...createRes.registration,
            personalInfo: {
              ...(createRes.registration.personalInfo || {}),
              aadhaarNumber: aadhaarInput
            },
            contactInfo: {
              ...(createRes.registration.contactInfo || {}),
              mobileNumber: phoneInput
            },
            agentCode: cleanAgent || createRes.registration.agentCode || undefined
          };

          // Save the merged draft to the database immediately
          await updateRegistrationStepAction(regId, mergedRegistration);

          loadFromServer(mergedRegistration);
          if (cleanAgent) store.setAgentCode(cleanAgent);
          setRegistrationId(regId);
          setOtpSession({ registrationId: regId, aadhaar: aadhaarInput, phone: phoneInput });
          setIsOtpVerified(true);
        } else {
          setOtpError(createRes.error || "Failed to initialize registration.");
          toast.error(createRes.error || "Failed to initialize registration.");
        }
        return;
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

    async function initialize() {
      // Check if they already successfully verified the OTP in this browser session (e.g. on page refresh)
      const existingSession = getOtpSession(donorType);
      if (existingSession && existingSession.registrationId) {
        try {
          setIsLoading(true);
          const data = (await getRegistrationAction(existingSession.registrationId)) as any;
          if (data.success && data.registration) {
            loadFromServer(data.registration);
            setRegistrationId(existingSession.registrationId);
            setPhoneInput(existingSession.phone);
            setAadhaarInput(existingSession.aadhaar);
            setIsOtpVerified(true);
            toast.success("Registration session restored successfully.");
          } else {
            clearOtpSession();
          }
        } catch (error) {
          console.warn("Failed to auto-restore session on refresh", error);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      if (!draftId) {
        setIsBlocked(false);
        setIsLoading(false);
        return;
      }

      // Otherwise, load details from URL draft ID to prefill the verification fields but DO NOT bypass verification
      try {
        setIsLoading(true);
        const data = (await getRegistrationAction(draftId)) as any;
        if (data.success && data.registration) {
          setRegistrationIdInput(draftId);
          if (data.registration.contactInfo?.mobileNumber) {
            setPhoneInput(data.registration.contactInfo.mobileNumber);
          }
          if (data.registration.personalInfo?.aadhaarNumber) {
            setAadhaarInput(data.registration.personalInfo.aadhaarNumber);
          }
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

    initialize();
  }, [donorType, draftId]);

  // Save Draft progress
  const saveDraft = async () => {
    if (!registrationId) return;
    setIsSaving(true);
    try {
      const allData = getAllFormData();
      const data = await updateRegistrationStepAction(registrationId, {
        ...allData,
        currentStep: 1, // default step placeholder
      });
      if (data.success) {
        toast.success("Registration progress draft saved!");
      } else {
        toast.error("Failed to save draft progress.");
      }
    } catch (error) {
      console.error("Save draft error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateStep1 = (): boolean => {
    const tempErrors: Record<string, string> = {};

    const personalSchema = derivedType === "sperm" ? spermPersonalInfoSchema : eggPersonalInfoSchema;
    const personalData = {
      ...store.personalInfo,
      aadhaarNumber: store.personalInfo.aadhaarNumber || aadhaarInput || "123456789012",
      gender: derivedType === "sperm" ? "Male" : "Female",
    };
    const personalValid = personalSchema.safeParse(personalData);
    if (!personalValid.success) {
      personalValid.error.issues.forEach((issue) => {
        tempErrors[`personalInfo.${issue.path.join(".")}`] = issue.message;
      });
    }

    const contactData = {
      ...store.contactInfo,
      mobileNumber: store.contactInfo.mobileNumber || phoneInput || "9999999999",
    };
    const contactValid = contactInfoSchema.safeParse(contactData);
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

    const donorSchema = derivedType === "sperm" ? spermDonorInfoSchema : eggDonorInfoSchema;
    const donorData = derivedType === "sperm" ? store.spermDonorInfo : store.eggDonorInfo;
    const donorValid = donorSchema.safeParse(donorData);
    if (!donorValid.success) {
      donorValid.error.issues.forEach((issue) => {
        const prefix = derivedType === "sperm" ? "spermDonorInfo" : "eggDonorInfo";
        tempErrors[`${prefix}.${issue.path.join(".")}`] = issue.message;
      });
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      const firstErrorKey = Object.keys(tempErrors)[0];
      const errorMsg = tempErrors[firstErrorKey];
      toast.error(`Please correct information errors: ${errorMsg}`);
      setTimeout(() => {
        const errorEl = document.querySelector(".border-red-500, [aria-invalid='true']");
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const tempErrors: Record<string, string> = {};

    // labReports validation removed

    const docValid = documentsSchema.safeParse(store.documents);
    if (!docValid.success) {
      docValid.error.issues.forEach((issue) => {
        tempErrors[`documents.${issue.path.join(".")}`] = issue.message;
      });
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      const firstErrorKey = Object.keys(tempErrors)[0];
      const errorMsg = tempErrors[firstErrorKey];
      toast.error(`Please upload required documents: ${errorMsg}`);
      return false;
    }
    return true;
  };

  const validateForm = (): boolean => {
    const tempErrors: Record<string, string> = {};

    const personalSchema = derivedType === "sperm" ? spermPersonalInfoSchema : eggPersonalInfoSchema;
    const personalData = {
      ...store.personalInfo,
      gender: derivedType === "sperm" ? "Male" : "Female",
    };
    const personalValid = personalSchema.safeParse(personalData);
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

    const donorSchema = derivedType === "sperm" ? spermDonorInfoSchema : eggDonorInfoSchema;
    const donorData = derivedType === "sperm" ? store.spermDonorInfo : store.eggDonorInfo;
    const donorValid = donorSchema.safeParse(donorData);
    if (!donorValid.success) {
      donorValid.error.issues.forEach((issue) => {
        const prefix = derivedType === "sperm" ? "spermDonorInfo" : "eggDonorInfo";
        tempErrors[`${prefix}.${issue.path.join(".")}`] = issue.message;
      });
    }

    // labReports validation removed

    const docValid = documentsSchema.safeParse(store.documents);
    if (!docValid.success) {
      docValid.error.issues.forEach((issue) => {
        tempErrors[`documents.${issue.path.join(".")}`] = issue.message;
      });
    }

    const consentValid = consentSchema.safeParse(store.consent);
    if (!consentValid.success) {
      consentValid.error.issues.forEach((issue) => {
        tempErrors[`consent.${issue.path.join(".")}`] = issue.message;
      });
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      const firstErrorKey = Object.keys(tempErrors)[0];
      const errorMsg = tempErrors[firstErrorKey];
      toast.error(`Please correct form validation errors: ${errorMsg}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const allData = getAllFormData();
      const cleanAgent = donorType === "egg"
        ? ((store.agentCode || agentCodeInput || "").trim().toUpperCase() || undefined)
        : undefined;
      const submitPayload = {
        ...allData,
        agentCode: cleanAgent,
      };
      let regId: string = registrationId || "";

      if (!regId) {
        // Create draft if not yet created
        const createRes = (await createDraftRegistrationAction(donorType, {
          ...submitPayload,
          registrationSource: "online"
        })) as any;
        if (createRes.success && createRes.registrationId) {
          regId = createRes.registrationId as string;
          setRegistrationId(regId);
        } else {
          toast.error(createRes.error || "Failed to initialize registration record.");
          return;
        }
      }

      const data = await submitRegistrationAction(regId, submitPayload);
      if (data.success) {
        toast.success("Registration submitted successfully!");
        clearOtpSession();
        router.push(`/register/${derivedType}?submitted=true&id=${regId}`);
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
        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-lg space-y-8">
          
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-sm">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Registration Access Restricted
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {blockReason}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Required Onboarding Workflow
            </h3>
            <div className="space-y-3 text-xs pl-2 border-l border-slate-100">
              {[
                { label: "1. Submit Pre-Screening Inquiry", desc: "Submit an online form with basic medical & contact details." },
                { label: "2. Clinic Evaluation", desc: "Our specialist embryologists and coordinators review your records." },
                { label: "3. Approved Onboarding ID Generated", desc: "Receive clinical approval and your secure Registration ID link." },
                { label: "4. Identity Verification", desc: "Access the portal using your Aadhaar number, Mobile OTP, and ID." },
              ].map((step, idx) => (
                <div key={idx} className="relative pl-4 space-y-0.5">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-200" />
                  <div className="font-bold text-slate-800">{step.label}</div>
                  <div className="text-[11px] text-slate-400">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">
                Choose a Donor Program:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInquiryType("sperm")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    selectedInquiryType === "sperm"
                      ? "bg-teal-500/10 border-teal-500 text-teal-700"
                      : "border-slate-200 bg-transparent text-slate-500"
                  }`}
                >
                  Sperm Donor
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInquiryType("egg")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    selectedInquiryType === "egg"
                      ? "bg-rose-500/10 border-rose-500 text-rose-700"
                      : "border-slate-200 bg-transparent text-slate-500"
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

            <div className="pt-4 border-t border-slate-100 space-y-3 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Already have a Registration ID?
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. MED-SD-2026-123456"
                  value={manualRegId}
                  onChange={(e) => setManualRegId(e.target.value.trim())}
                  className="flex-1 h-9 px-3 rounded-[10px] border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (!manualRegId) {
                      toast.error("Please enter a valid Registration ID.");
                      return;
                    }
                    router.push(`/donor/register?id=${manualRegId}&type=${selectedInquiryType}`);
                    setIsBlocked(false);
                    setIsLoading(true);
                  }}
                  className="rounded-[10px] text-xs h-9 px-4 bg-slate-900 text-white hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Verify Code
                </Button>
              </div>
            </div>

            <Link href="/" className="block w-full">
              <Button variant="outline" className="w-full rounded-[10px] h-10 text-xs font-medium border-slate-200 hover:bg-slate-50:bg-slate-905 flex items-center justify-center gap-1">
                Return to Home Page
              </Button>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  if (!isOtpVerified) {
    const canSendOtp = aadhaarInput.length === 12 && phoneInput.length >= 10;

    return (
      <div className="container mx-auto px-4 py-12 max-w-md animate-in fade-in duration-350">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">

          {/* Header */}
          <div className="text-center space-y-2 px-8 pt-8 pb-6 border-b border-slate-100">
            <div className="mx-auto w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {donorType === "egg" ? "Egg Donor" : "Sperm Donor"} Registration
            </h2>
            <p className="text-xs text-slate-500">
              Identity & Security Verification
            </p>
          </div>

          <div className="px-8 py-6 space-y-5">
            {otpError && (
              <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl leading-relaxed">
                {otpError}
              </div>
            )}

            <div className="space-y-4">

              {/* Aadhaar */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">12-Digit Aadhaar Number *</label>
                <input
                  type="text"
                  placeholder="Enter 12-digit Aadhaar"
                  maxLength={12}
                  disabled={otpSent || otpLoading}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                <input
                  type="text"
                  placeholder="Enter mobile number"
                  maxLength={13}
                  disabled={otpSent || otpLoading}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9+]/g, ""))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>

              {/* Agent Code (Optional - Egg Donors Only) */}
              {donorType === "egg" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Agent Code</label>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional - leave blank if direct)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. AGT-1001"
                    maxLength={15}
                    disabled={otpSent || otpLoading}
                    value={agentCodeInput}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setAgentCodeInput(val);
                      store.setAgentCode(val);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900 uppercase placeholder:normal-case"
                  />
                  {agentCodeInput && (
                    <p className="text-[10px] text-teal-600 font-medium">
                      Donor referral will be attributed to Agent: <strong>{agentCodeInput}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* OTP Input */}
              {otpSent && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <label className="text-xs font-bold text-slate-700">6-Digit OTP sent to your phone</label>
                  <input
                     type="text"
                     placeholder="Enter OTP"
                     maxLength={6}
                     disabled={otpLoading}
                     value={otpInput}
                     onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                     className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-base font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                  />
                </div>
              )}

              {/* OTP Actions */}
              {!otpSent ? (
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !canSendOtp}
                  className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs h-10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {otpLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Verify & Send OTP"}
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
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                      : "Confirm OTP & Start Registration"
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
                        className="text-[11px] font-semibold text-teal-600 hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
              <p className="text-center text-[10px] text-slate-450 leading-relaxed pt-3 border-t border-slate-100">
                Please ensure your Aadhaar card and verified mobile number match.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Step Progress Tracker */}
      <div className="bg-white border border-slate-250/60 p-4 rounded-xl shadow-xs flex justify-between items-center text-xs font-semibold text-slate-500 max-w-xl mx-auto w-full mb-6">
        {[
          { num: 1, label: "Fill Information" },
          { num: 2, label: "Upload Documents" },
          { num: 3, label: "Review & Consent" }
        ].map((hdr) => (
          <div key={hdr.num} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
              registrationStep === hdr.num 
                ? "bg-teal-500/20 text-teal-600 font-extrabold border border-teal-550" 
                : registrationStep > hdr.num 
                  ? "bg-emerald-600 text-white font-bold" 
                  : "bg-slate-100 text-slate-400"
            }`}>
              {registrationStep > hdr.num ? "✓" : hdr.num}
            </span>
            <span className={`inline text-[11px] ${registrationStep === hdr.num ? "text-slate-900 font-bold" : "text-slate-400"}`}>
              {hdr.label}
            </span>
            {hdr.num < 3 && <ChevronRight className="w-3 h-3 text-slate-350 inline" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">

        {/* Form Body */}
        <Card className="rounded-[10px] border-slate-200 bg-white shadow-md flex flex-col">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                {derivedType === "egg" ? "Egg Donor Registration" : "Sperm Donor Registration"}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Please complete all fields carefully and submit the registration form.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2.5">
              {isSaving ? (
                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 h-9 px-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Progress...
                </span>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => saveDraft()}
                  className="rounded-xl text-xs gap-1.5 h-9 px-4 font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50:bg-slate-900 transition-all shadow-sm cursor-pointer"
                  title="Manual Save"
                >
                  <Save className="w-4 h-4" /> Save Progress
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-12">
            
            {/* Step 1: Fill Information */}
            {registrationStep === 1 && (
              <div className="space-y-12 animate-in fade-in duration-200">
                {/* Section 1: Identity & Contact Details */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                    Identity & Contact Information
                  </h3>
                  <div className="space-y-8 bg-slate-50/50 p-6 rounded-2xl border border-border">
                    <StepPersonalInfo errors={errors} donorType={derivedType} />
                    <hr className="border-border/40" />
                    <StepContactInfo errors={errors} />
                    <hr className="border-border/40" />
                    <StepEmergencyContact errors={errors} />
                  </div>
                </div>

                {/* Section 2: Medical Details */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                    Medical Profile & Screening Data
                  </h3>
                  <div className="space-y-8 bg-slate-50/50 p-6 rounded-2xl border border-border">
                    <StepMedicalInfo errors={errors} />
                    <hr className="border-border/40" />
                    <StepDonorInfo errors={errors} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Upload Documents */}
            {registrationStep === 2 && (
              <div className="space-y-12 animate-in fade-in duration-200">
                {/* Section 3: Document uploads */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-primary flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                    Required Documents
                  </h3>
                  <div className="space-y-8 bg-slate-50/50 p-6 rounded-2xl border border-border">
                    {/* StepLabReports (viral markers, blood report, other reports) removed */}
                    <StepDocuments errors={errors} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Consent */}
            {registrationStep === 3 && (
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* Full Registration & Contract Review */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-6 h-6 rounded-full bg-teal-550/10 text-teal-600 flex items-center justify-center text-xs font-bold">3</span>
                    Review Registration & Legal Contract
                  </h3>
                  <div className="space-y-4">
                    <ReviewPage
                      inline={true}
                      onEditStep={(stepNum) => {
                        if (stepNum === 1 || stepNum === 2) {
                          setRegistrationStep(stepNum);
                        } else {
                          setRegistrationStep(1);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Section 4: Consent agreements */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-6 h-6 rounded-full bg-teal-550/10 text-teal-600 flex items-center justify-center text-xs font-bold">4</span>
                    Legal Declarations & Consent
                  </h3>
                  <div className="space-y-8 bg-slate-50/50 p-6 rounded-2xl border border-border">
                    <StepConsent errors={errors} />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
              {registrationStep === 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    clearOtpSession();
                    window.location.reload();
                  }}
                  className="rounded-xl text-xs gap-1.5 h-10 px-4 font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50"
                >
                  Log Out Session
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegistrationStep((prev) => prev - 1)}
                  className="rounded-xl text-xs gap-1.5 h-10 px-4 font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50:bg-slate-900 transition-all cursor-pointer"
                >
                  ← Back
                </Button>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveDraft()}
                  disabled={isSaving}
                  className="rounded-xl text-xs gap-1.5 h-10 px-4 text-slate-500"
                >
                  <Save className="w-3.5 h-3.5" /> Save Progress
                </Button>

                {registrationStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (registrationStep === 1) {
                        if (validateStep1()) {
                          saveDraft();
                          setRegistrationStep(2);
                        }
                      } else if (registrationStep === 2) {
                        if (validateStep2()) {
                          saveDraft();
                          setRegistrationStep(3);
                        }
                      }
                    }}
                    className="rounded-xl text-xs gap-1.5 h-10 px-6 font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20 cursor-pointer"
                  >
                    Next Step →
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="rounded-xl text-xs gap-1.5 h-10 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Submit Registration Application</>
                    )}
                  </Button>
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
