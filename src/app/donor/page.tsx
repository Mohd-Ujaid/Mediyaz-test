"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Dna, 
  Award, 
  Heart, 
  ArrowRight, 
  Egg,
  Info,
  Clock,
  Coins
} from "lucide-react";
import Link from "next/link";

type DonorType = "sperm" | "egg";

const donorContent = {
  sperm: {
    badge: "Become an Altruistic Sperm Donor",
    heroTitle: "Help Build Families & Empower Lives",
    heroDescription: "Join Mediyaz ART Bank's elite sperm donor program. Earn compensation while receiving comprehensive health and genetic evaluations in our clinical facility.",
    gradient: "from-blue-950 via-indigo-950 to-slate-900",
    accentColor: "blue",
    eligibility: [
      "Aged between 18 and 38 years old",
      "In excellent overall physical and mental health",
      "Non-smoker and no history of drug abuse",
      "Able to commit to weekly lab visits for 3–6 months",
      "Legally authorized to reside in the country",
      "No personal or family history of genetic disorders"
    ],
    compensation: "Earn up to ₹4,000+ per donation cycle to compensate for your time, commitment, and travel.",
    screening: "Receive complimentary full 300+ panel DNA testing, infectious disease screening, and semen analysis.",
  },
  egg: {
    badge: "Become an Altruistic Egg Donor",
    heroTitle: "Give the Gift of Life & Hope",
    heroDescription: "Join Mediyaz ART Bank's dedicated egg donor program. Help women and families fulfill their dream of parenthood while receiving top-tier medical care.",
    gradient: "from-rose-950 via-pink-950 to-slate-900",
    accentColor: "rose",
    eligibility: [
      "Aged between 21 and 32 years old",
      "In excellent overall physical and reproductive health",
      "Non-smoker with a healthy BMI (19–29)",
      "Regular menstrual cycles and no reproductive disorders",
      "No personal or family history of genetic disorders",
      "Willing to undergo hormone stimulation and egg retrieval"
    ],
    compensation: "Earn up to ₹8,000+ per donation cycle as compensation for your generosity, time, and commitment.",
    screening: "Receive complimentary full hormonal panel, genetic screening, psychological evaluation, and fertility assessment.",
  }
};

function DonorPageContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as DonorType) || "sperm";

  const [donorType, setDonorType] = useState<DonorType>(initialType);

  const content = donorContent[donorType];
  const accent = content.accentColor;

  // Update donorType when URL query changes
  useEffect(() => {
    const typeParam = searchParams.get("type") as DonorType;
    if (typeParam && (typeParam === "sperm" || typeParam === "egg")) {
      setDonorType(typeParam);
    }
  }, [searchParams]);

  const accentColorClass = accent === "rose" ? "text-rose-500 border-rose-500" : "text-blue-500 border-blue-500";
  const btnClass = accent === "rose" 
    ? "bg-rose-600 hover:bg-rose-700 text-white" 
    : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Hero Banner */}
      <section className={`py-20 bg-gradient-to-br ${content.gradient} text-white relative overflow-hidden`}>
        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6">
          
          {/* Donor Type Toggle */}
          <div className="flex justify-center mb-4">
            <div className="p-1 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex gap-1">
              <button
                onClick={() => setDonorType("sperm")}
                className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  donorType === "sperm" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Dna className="w-4 h-4" /> Sperm Donor Program
              </button>
              <button
                onClick={() => setDonorType("egg")}
                className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  donorType === "egg" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Egg className="w-4 h-4" /> Egg Donor Program
              </button>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold`}>
            {donorType === "sperm" ? <Heart className="w-3.5 h-3.5 text-blue-400" /> : <Egg className="w-3.5 h-3.5 text-rose-400" />}
            {content.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            {content.heroTitle}
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
            {content.heroDescription}
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Link href={`/donor/query?type=${donorType}`}>
              <Button size="lg" className={`rounded-2xl ${btnClass} font-bold shadow-lg gap-2 px-8 py-6 text-sm`}>
                Submit Pre-Screening Inquiry <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Overview & Eligibility details */}
      <div className="container mx-auto px-4 py-16 max-w-5xl space-y-16">
        
        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 w-fit">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Time Compensation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {content.compensation}
            </p>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 w-fit">
              <Dna className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Complimentary Screening</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {content.screening}
            </p>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Confidential & Protected</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your security and privacy are fully protected. All data uploads, physical attributes, and details are encrypted securely.
            </p>
          </Card>
        </div>

        {/* Eligibility Checklist */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Info className={`w-6 h-6 ${accentColorClass.split(" ")[0]}`} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {donorType === "egg" ? "Egg Donor" : "Sperm Donor"} Eligibility Criteria
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.eligibility.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className={`w-4 h-4 ${accent === "rose" ? "text-rose-500" : "text-blue-500"} shrink-0`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 text-center">
            <Link href={`/donor/query?type=${donorType}`}>
              <Button size="lg" className={`rounded-xl ${btnClass} font-bold px-8`}>
                Submit Pre-Screening Inquiry Form
              </Button>
            </Link>
          </div>
        </Card>

        {/* Enforced 6-Step Workflow */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold">Donor Onboarding Workflow</h3>
            <p className="text-xs text-slate-500 mt-1">Our mandatory 6-stage clinical integration process</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
            {[
              { step: "01", title: "Select Program", desc: "Choose between altruistic Sperm Donor or Egg Donor programs." },
              { step: "02", title: "Submit Inquiry", desc: "Complete our secure online pre-screening inquiry form with basic health details." },
              { step: "03", title: "Clinic Review", desc: "Our embryologists and clinical coordinators evaluate your submission details." },
              { step: "04", title: "Clinic Contact", desc: "A clinical specialist contacts you to perform preliminary phone screening." },
              { step: "05", title: "Registry Approval", desc: "Receive clinical approval and your unique secure Registration ID." },
              { step: "06", title: "Profile Registration", desc: "Access the multi-step medical declarations wizard to join the active match repository." },
            ].map((flow, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative shadow-sm flex flex-col justify-between text-left">
                <div>
                  <span className="text-3xl font-extrabold text-slate-100 dark:text-slate-800 select-none block text-right">{flow.step}</span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">{flow.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{flow.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>

    </div>
  );
}

export default function DonorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <p className="text-sm font-semibold">Loading donor portal...</p>
      </div>
    }>
      <DonorPageContent />
    </Suspense>
  );
}
