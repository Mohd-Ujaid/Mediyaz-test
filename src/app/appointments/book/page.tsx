"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Calendar, User, Stethoscope, CheckCircle2, ArrowLeft, ArrowRight, 
  Heart, ClipboardCheck, Loader2, Copy, PartyPopper
} from "lucide-react";
import Link from "next/link";

const STEPS = ["Personal Details", "Medical Information", "Schedule", "Review & Submit"];

export default function BookConsultation() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [treatments, setTreatments] = useState<any[]>([]);

  const [form, setForm] = useState({
    // Personal
    fullName: "", email: "", phone: "", age: "", country: "", city: "",
    // Medical
    fertilityConcern: "", previousTreatments: "", medicalHistory: "",
    preferredTreatment: "", additionalNotes: "",
    // Schedule
    preferredDate: "", preferredTime: "", consultationType: "In-Clinic"
  });

  useEffect(() => {
    async function loadTreatments() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        if (data.treatments) setTreatments(data.treatments);
      } catch (err) {
        console.error(err);
      }
    }
    loadTreatments();
  }, []);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 0) return form.fullName && form.email && form.phone;
    if (step === 1) return true;
    if (step === 2) return form.preferredDate && form.preferredTime;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalDetails: {
            fullName: form.fullName, email: form.email, phone: form.phone,
            age: form.age ? parseInt(form.age) : undefined,
            country: form.country, city: form.city
          },
          medicalInfo: {
            fertilityConcern: form.fertilityConcern,
            previousTreatments: form.previousTreatments,
            medicalHistory: form.medicalHistory,
            preferredTreatment: form.preferredTreatment,
            additionalNotes: form.additionalNotes
          },
          appointmentDetails: {
            preferredDate: form.preferredDate,
            preferredTime: form.preferredTime,
            consultationType: form.consultationType
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setReferenceId(data.referenceId);
        setSubmitted(true);
        toast.success("Consultation request submitted!");
      } else {
        toast.error(data.error || "Failed to submit.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card className="max-w-md w-full border-0 shadow-2xl">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Request Submitted!</h2>
              <p className="text-slate-500 mt-3">Our team will contact you within 24 hours to confirm your consultation.</p>
              
              <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Reference ID</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-2xl font-mono font-extrabold text-blue-600">{referenceId}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(referenceId); toast.success("Copied!"); }}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Save this ID to track your consultation status</p>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Link href="/track">
                  <Button className="w-full rounded-xl">Track Your Request</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full rounded-xl">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Calendar className="w-12 h-12 mx-auto mb-4 text-teal-300" />
            <h1 className="text-3xl md:text-4xl font-extrabold">Book a Consultation</h1>
            <p className="mt-3 text-blue-100/70 max-w-lg mx-auto">
              Schedule your free initial consultation with one of our fertility specialists.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 relative z-10 max-w-2xl pb-20">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800">
          {STEPS.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                idx < step ? "bg-emerald-500 text-white" :
                idx === step ? "bg-blue-600 text-white shadow-md" :
                "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}>
                {idx < step ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`hidden sm:inline text-xs font-medium ${idx === step ? "text-blue-600" : "text-slate-400"}`}>{s}</span>
              {idx < STEPS.length - 1 && <div className="hidden sm:block w-6 h-px bg-slate-200 dark:bg-slate-700" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {/* Step 0: Personal */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Details</h3>
                  </div>
                  <Input placeholder="Full Name *" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="rounded-xl" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Email Address *" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="rounded-xl" />
                    <Input placeholder="Phone Number *" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input placeholder="Age" type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} className="rounded-xl" />
                    <Input placeholder="City" value={form.city} onChange={(e) => updateField("city", e.target.value)} className="rounded-xl" />
                    <Input placeholder="Country" value={form.country} onChange={(e) => updateField("country", e.target.value)} className="rounded-xl" />
                  </div>
                </motion.div>
              )}

              {/* Step 1: Medical */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Medical Information</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fertility Concern</label>
                    <textarea placeholder="Briefly describe your fertility concern..." value={form.fertilityConcern} onChange={(e) => updateField("fertilityConcern", e.target.value)} rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <Input placeholder="Previous treatments (if any)" value={form.previousTreatments} onChange={(e) => updateField("previousTreatments", e.target.value)} className="rounded-xl" />
                  <Input placeholder="Relevant medical history" value={form.medicalHistory} onChange={(e) => updateField("medicalHistory", e.target.value)} className="rounded-xl" />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preferred Treatment</label>
                    <select value={form.preferredTreatment} onChange={(e) => updateField("preferredTreatment", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">I'm not sure yet</option>
                      {treatments.map((t: any) => (
                        <option key={t._id} value={t.title}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                  <textarea placeholder="Additional notes for the doctor..." value={form.additionalNotes} onChange={(e) => updateField("additionalNotes", e.target.value)} rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </motion.div>
              )}

              {/* Step 2: Schedule */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Your Visit</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preferred Date *</label>
                      <Input type="date" value={form.preferredDate} onChange={(e) => updateField("preferredDate", e.target.value)} className="rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preferred Time *</label>
                      <select value={form.preferredTime} onChange={(e) => updateField("preferredTime", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select time</option>
                        {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Consultation Type</label>
                    <div className="flex gap-3">
                      {["In-Clinic", "Virtual", "Phone"].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateField("consultationType", type)}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                            form.consultationType === type
                              ? "bg-blue-600 text-white border-blue-600 shadow-md"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Your Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Personal Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-900 dark:text-white">{form.fullName}</span></div>
                        <div><span className="text-slate-400">Email:</span> <span className="font-medium text-slate-900 dark:text-white">{form.email}</span></div>
                        <div><span className="text-slate-400">Phone:</span> <span className="font-medium text-slate-900 dark:text-white">{form.phone}</span></div>
                        {form.age && <div><span className="text-slate-400">Age:</span> <span className="font-medium text-slate-900 dark:text-white">{form.age}</span></div>}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Medical Information</h4>
                      <div className="space-y-1 text-sm">
                        {form.fertilityConcern && <div><span className="text-slate-400">Concern:</span> <span className="font-medium text-slate-900 dark:text-white">{form.fertilityConcern}</span></div>}
                        {form.preferredTreatment && <div><span className="text-slate-400">Preferred:</span> <span className="font-medium text-slate-900 dark:text-white">{form.preferredTreatment}</span></div>}
                        {form.previousTreatments && <div><span className="text-slate-400">Previous:</span> <span className="font-medium text-slate-900 dark:text-white">{form.previousTreatments}</span></div>}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Schedule</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-400">Date:</span> <span className="font-medium text-slate-900 dark:text-white">{form.preferredDate}</span></div>
                        <div><span className="text-slate-400">Time:</span> <span className="font-medium text-slate-900 dark:text-white">{form.preferredTime}</span></div>
                        <div><span className="text-slate-400">Type:</span> <span className="font-medium text-slate-900 dark:text-white">{form.consultationType}</span></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
                className="rounded-xl gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 gap-1"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 px-8"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Heart className="w-4 h-4" /> Submit Request</>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
