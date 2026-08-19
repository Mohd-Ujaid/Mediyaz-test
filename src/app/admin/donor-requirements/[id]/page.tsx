"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  User, 
  Dna, 
  FileText, 
  Loader2, 
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";

export default function AdminRequirementDetails() {
  const params = useParams();
  const router = useRouter();
  const reqId = params.id as string;

  const [reqData, setReqData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/donor-requirements/${reqId}`);
      const data = await res.json();
      if (data.success) {
        setReqData(data.requirement);
      } else {
        toast.error("Failed to load request record.");
      }
    } catch {
      toast.error("Error communicating with servers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [reqId]);

  const handleSendWhatsAppSimulated = () => {
    if (!reqData) return;
    const phone = reqData.personalDetails.whatsApp || reqData.personalDetails.phone;
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const message = `Hello ${reqData.personalDetails.fullName}, this is the Clinical Coordinator from Mediyaz Art Bank. We received your donor requirement dossier. Let us know a convenient time to schedule your consultation.`;
    
    // Open WhatsApp link in new tab
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-550 select-none">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <span>Syncing matching registry details...</span>
      </div>
    );
  }

  if (!reqData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-550 select-none p-6 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-350 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request record not found</h2>
        <Button onClick={() => router.back()} className="rounded-xl bg-primary text-white text-xs">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-16 max-w-4xl mx-auto">
      
      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <Button variant="outline" onClick={() => router.push("/admin/donor-requirements")} className="rounded-xl p-2.5 h-10 w-10 border-primary text-primary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {reqData.personalDetails.fullName}
              </h1>
              <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {reqData.treatmentRequirement.lookingFor} Donor Request
              </span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 font-mono">Dossier ID: {reqData._id} • Submitted: {new Date(reqData.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex gap-2 items-center">
          <Button onClick={handleSendWhatsAppSimulated} className="rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">
            <MessageCircle className="w-4 h-4" /> WhatsApp Patient
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Section 1: Demographics */}
        <Card className="rounded-2xl border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 text-primary">
            <User className="w-4 h-4" />
            <h3 className="text-sm font-extrabold uppercase tracking-wide">Intended Parent Demographics</h3>
          </div>
          <table className="w-full text-left text-xs">
            <tbody>
              <tr className="border-b"><td className="py-2.5 font-semibold text-slate-450 w-1/3">Gender / DOB</td><td className="py-2.5 font-medium">{reqData.personalDetails.gender} • {reqData.personalDetails.dateOfBirth}</td></tr>
              <tr className="border-b"><td className="py-2.5 font-semibold text-slate-450">Marital Status</td><td className="py-2.5 font-medium">{reqData.personalDetails.maritalStatus}</td></tr>
              <tr className="border-b"><td className="py-2.5 font-semibold text-slate-450">Primary Email</td><td className="py-2.5 font-semibold text-primary">{reqData.personalDetails.email}</td></tr>
              <tr className="border-b"><td className="py-2.5 font-semibold text-slate-450">Phone / WhatsApp</td><td className="py-2.5 font-medium">{reqData.personalDetails.phone} (WhatsApp: {reqData.personalDetails.whatsApp || "Same"})</td></tr>
              <tr className="border-b"><td className="py-2.5 font-semibold text-slate-450">Location</td><td className="py-2.5 font-medium">{reqData.personalDetails.city}, {reqData.personalDetails.state}, {reqData.personalDetails.country}</td></tr>
              <tr><td className="py-2.5 font-semibold text-slate-450">Preferred Contact</td><td className="py-2.5 font-bold text-secondary-foreground uppercase text-[10px] bg-secondary/10 px-2 py-0.5 rounded w-fit">{reqData.personalDetails.preferredContactMethod} ({reqData.personalDetails.bestTimeToContact})</td></tr>
            </tbody>
          </table>
        </Card>

        {/* Section 2: Donor Preference Matrix */}
        <Card className="rounded-2xl border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 text-primary">
            <Dna className="w-4 h-4" />
            <h3 className="text-sm font-extrabold uppercase tracking-wide">Donor Trait & Screening Criteria</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border-b sm:border-none pb-2 sm:pb-0"><span className="text-slate-450 block">Preferred Age Range:</span> <span className="font-bold">{reqData.donorPreferences.ageRange || "Any"} Years</span></div>
            <div className="border-b sm:border-none pb-2 sm:pb-0"><span className="text-slate-450 block">Blood Group Preference:</span> <span className="font-bold">{reqData.donorPreferences.bloodGroup || "Any"} ({reqData.donorPreferences.rhFactor || "Any"})</span></div>
            <div className="border-b sm:border-none pb-2 sm:pb-0"><span className="text-slate-450 block">Physical Build:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">Height: {reqData.donorPreferences.height || "Any"} • Weight: {reqData.donorPreferences.weight || "Any"}</span></div>
            <div className="border-b sm:border-none pb-2 sm:pb-0"><span className="text-slate-450 block">Complexion & Eyes:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">Skin: {reqData.donorPreferences.skinTone || "Any"} • Eyes: {reqData.donorPreferences.eyeColor || "Any"}</span></div>
            <div className="border-b sm:border-none pb-2 sm:pb-0"><span className="text-slate-450 block">Hair / Education:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">Hair: {reqData.donorPreferences.hairColor || "Any"} • Education: {reqData.donorPreferences.educationLevel || "Any"}</span></div>
            <div className="border-b sm:border-none pb-2 sm:pb-0"><span className="text-slate-450 block">Religion & Language:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">Religion: {reqData.donorPreferences.religion || "Any"} • Lang: {reqData.donorPreferences.language || "Any"}</span></div>
            <div className="border-b sm:border-none pb-2 sm:pb-0"><span className="text-slate-450 block">CMV / Lifestyle:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">CMV: {reqData.donorPreferences.cmvStatus || "Any"} • Smoke: {reqData.donorPreferences.smoking || "Any"} • Drink: {reqData.donorPreferences.drinking || "Any"}</span></div>
            <div className="pb-2 sm:pb-0"><span className="text-slate-450 block">Genetic Sequencing:</span> <span className={`font-bold ${reqData.donorPreferences.geneticScreeningRequired ? "text-primary" : "text-slate-550"}`}>{reqData.donorPreferences.geneticScreeningRequired ? "300+ Diseases NGS Panel Required" : "Standard screening sufficient"}</span></div>
          </div>
          {reqData.donorPreferences.otherPreferences && (
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border text-xs">
              <span className="font-extrabold text-[10px] text-slate-450 block uppercase tracking-wider mb-1">Additional Trait Preferences</span>
              <p className="leading-relaxed text-slate-650 dark:text-slate-450">{reqData.donorPreferences.otherPreferences}</p>
            </div>
          )}
        </Card>

        {/* Section 3: Recipient Medical File */}
        <Card className="rounded-2xl border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 text-primary">
            <FileText className="w-4 h-4" />
            <h3 className="text-sm font-extrabold uppercase tracking-wide">Intended Parent Medical Summary</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div><span className="text-slate-450 block">Medical Conditions:</span> <span className="font-bold text-slate-800 dark:text-white">{reqData.medicalInformation.medicalConditions || "None reported"}</span></div>
            <div><span className="text-slate-450 block">Genetic Disorders / Carriage:</span> <span className="font-bold text-slate-800 dark:text-white">{reqData.medicalInformation.geneticDisorders || "None"}</span></div>
            <div><span className="text-slate-450 block">Active Medications:</span> <span className="font-semibold text-slate-700 dark:text-slate-350">{reqData.medicalInformation.currentMedications || "None"}</span></div>
            <div><span className="text-slate-450 block">Allergies:</span> <span className="font-semibold text-slate-700 dark:text-slate-350">{reqData.medicalInformation.allergies || "None"}</span></div>
          </div>
          {reqData.medicalInformation.additionalComments && (
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border text-xs">
              <span className="font-extrabold text-[10px] text-slate-450 block uppercase tracking-wider mb-1">Referral Doctor Notes</span>
              <p className="leading-relaxed text-slate-650 dark:text-slate-450">{reqData.medicalInformation.additionalComments}</p>
            </div>
          )}
          
          {/* Uploaded Documents Clearance */}
          <div className="space-y-2 border-t pt-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 block">Confidential Medical Clearance Attachments</span>
            {reqData.medicalInformation.uploadedReports && reqData.medicalInformation.uploadedReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reqData.medicalInformation.uploadedReports.map((file: any) => (
                  <div key={file.fileId} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs">
                    <div className="flex items-center gap-2 truncate text-slate-750 dark:text-slate-300 pr-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate font-semibold">{file.name}</span>
                    </div>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="rounded-lg h-8 px-2 text-primary hover:bg-primary/5">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2">No medical diagnostic attachments uploaded.</div>
            )}
          </div>
        </Card>

      </div>

    </div>
  );
}
