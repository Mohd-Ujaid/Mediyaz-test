"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Egg, User, Heart, FileCheck, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Copy, PartyPopper } from "lucide-react";
import Link from "next/link";

const STEPS = ["Personal Info", "Health Info", "Additional Info", "Consent & Submit"];

export default function EggDonorApplication() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");

  const [form, setForm] = useState({
    fullName: "", dateOfBirth: "", age: "", email: "", phone: "", location: "",
    height: "", weight: "", bloodGroup: "", medicalHistory: "", familyMedicalHistory: "", lifestyle: "",
    education: "", interests: "", languages: "", previousPregnancy: "",
    consentAgreed: false
  });

  const u = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 0) return form.fullName && form.email && form.phone;
    if (step === 3) return form.consentAgreed;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/egg-donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo: { fullName: form.fullName, dateOfBirth: form.dateOfBirth, age: form.age ? parseInt(form.age) : undefined, email: form.email, phone: form.phone, location: form.location },
          healthInfo: { height: form.height, weight: form.weight, bloodGroup: form.bloodGroup, medicalHistory: form.medicalHistory, familyMedicalHistory: form.familyMedicalHistory, lifestyle: form.lifestyle },
          additionalInfo: { education: form.education, interests: form.interests, languages: form.languages, previousPregnancy: form.previousPregnancy },
          consentAgreed: form.consentAgreed
        })
      });
      const data = await res.json();
      if (data.success) { setApplicationId(data.applicationId); setSubmitted(true); toast.success("Application submitted!"); }
      else toast.error(data.error || "Failed.");
    } catch { toast.error("Network error."); } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-950 via-rose-950 to-purple-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="max-w-md w-full border-0 shadow-2xl">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold">Application Submitted!</h2>
              <p className="text-slate-500 mt-3">Thank you for your interest in becoming an egg donor. Our team will review your application and contact you within 5-7 business days.</p>
              <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Application ID</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-2xl font-mono font-extrabold text-rose-600">{applicationId}</span>
                  <button onClick={() => { navigator.clipboard.writeText(applicationId); toast.success("Copied!"); }} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Link href="/track"><Button className="w-full rounded-xl">Track Application</Button></Link>
                <Link href="/"><Button variant="outline" className="w-full rounded-xl">Back to Home</Button></Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <section className="bg-gradient-to-br from-pink-950 via-rose-950 to-purple-950 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Egg className="w-12 h-12 mx-auto mb-4 text-pink-300" />
            <h1 className="text-3xl md:text-4xl font-extrabold">Become an Egg Donor</h1>
            <p className="mt-3 text-pink-100/70 max-w-lg mx-auto">Help women and families who cannot produce their own eggs achieve their dream of parenthood.</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 relative z-10 max-w-2xl pb-20">
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800">
          {STEPS.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${idx < step ? "bg-emerald-500 text-white" : idx === step ? "bg-rose-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                {idx < step ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`hidden sm:inline text-xs font-medium ${idx === step ? "text-rose-600" : "text-slate-400"}`}>{s}</span>
              {idx < STEPS.length - 1 && <div className="hidden sm:block w-6 h-px bg-slate-200 dark:bg-slate-700" />}
            </div>
          ))}
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4"><User className="w-5 h-5 text-rose-600" /><h3 className="text-lg font-bold">Personal Information</h3></div>
                  <Input placeholder="Full Name *" value={form.fullName} onChange={(e) => u("fullName", e.target.value)} className="rounded-xl" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Email *" type="email" value={form.email} onChange={(e) => u("email", e.target.value)} className="rounded-xl" />
                    <Input placeholder="Phone *" value={form.phone} onChange={(e) => u("phone", e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input placeholder="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => u("dateOfBirth", e.target.value)} className="rounded-xl" />
                    <Input placeholder="Age" type="number" value={form.age} onChange={(e) => u("age", e.target.value)} className="rounded-xl" />
                    <Input placeholder="Location" value={form.location} onChange={(e) => u("location", e.target.value)} className="rounded-xl" />
                  </div>
                </motion.div>
              )}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4"><Heart className="w-5 h-5 text-rose-600" /><h3 className="text-lg font-bold">Health Information</h3></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input placeholder="Height" value={form.height} onChange={(e) => u("height", e.target.value)} className="rounded-xl" />
                    <Input placeholder="Weight" value={form.weight} onChange={(e) => u("weight", e.target.value)} className="rounded-xl" />
                    <select value={form.bloodGroup} onChange={(e) => u("bloodGroup", e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                      <option value="">Blood Group</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <textarea placeholder="Medical history (if any)..." value={form.medicalHistory} onChange={(e) => u("medicalHistory", e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none focus:ring-2 focus:ring-rose-500 outline-none" />
                  <textarea placeholder="Family medical history..." value={form.familyMedicalHistory} onChange={(e) => u("familyMedicalHistory", e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none focus:ring-2 focus:ring-rose-500 outline-none" />
                  <Input placeholder="Lifestyle (exercise, diet, smoking status)" value={form.lifestyle} onChange={(e) => u("lifestyle", e.target.value)} className="rounded-xl" />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4"><FileCheck className="w-5 h-5 text-rose-600" /><h3 className="text-lg font-bold">Additional Information</h3></div>
                  <Input placeholder="Education level" value={form.education} onChange={(e) => u("education", e.target.value)} className="rounded-xl" />
                  <Input placeholder="Interests & hobbies" value={form.interests} onChange={(e) => u("interests", e.target.value)} className="rounded-xl" />
                  <Input placeholder="Languages spoken" value={form.languages} onChange={(e) => u("languages", e.target.value)} className="rounded-xl" />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Previous Pregnancy</label>
                    <div className="flex gap-3">
                      {["No", "Yes"].map(opt => (
                        <button key={opt} type="button" onClick={() => u("previousPregnancy", opt)}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${form.previousPregnancy === opt ? "bg-rose-600 text-white border-rose-600" : "bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center gap-2 mb-4"><FileCheck className="w-5 h-5 text-rose-600" /><h3 className="text-lg font-bold">Consent & Submit</h3></div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p className="font-semibold text-slate-900 dark:text-white mb-2">By submitting this application, you agree to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Undergo comprehensive medical and psychological screening</li>
                      <li>Provide truthful information about your health and background</li>
                      <li>Allow Mediyaz Fertility Clinic to contact you for follow-up</li>
                      <li>Understand that acceptance into the program is not guaranteed</li>
                      <li>Maintain confidentiality about intended parents if matched</li>
                    </ul>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.consentAgreed} onChange={(e) => u("consentAgreed", e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">I have read and agree to the terms above and consent to proceed with my egg donor application.</span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0} className="rounded-xl gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="rounded-xl bg-rose-600 hover:bg-rose-700 gap-1">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting || !form.consentAgreed} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 gap-2 px-8">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Egg className="w-4 h-4" /> Submit Application</>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
