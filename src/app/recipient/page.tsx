"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserCheck, 
  ShieldCheck, 
  HeartHandshake, 
  Dna, 
  ArrowRight,
  CheckCircle2,
  Calendar,
  Lock,
  Award,
  EyeOff,
  Users,
  Compass,
  FileCheck,
  Egg,
  Info,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth";

export default function RecipientPage() {
  const { data: session } = useSession();
  const chooseUsItems = [
    { title: "Verified Donor Database", desc: "Rigorous genetic screening and history validation on all prospective profiles.", icon: UserCheck },
    { title: "Confidential Process", desc: "Strictly secure and encrypted handling of personal, preference, and treatment logs.", icon: Lock },
    { title: "Medical Screening", desc: "140+ physiological parameters tested to ensure high egg and sperm count viability.", icon: ShieldCheck },
    { title: "Genetic Testing", desc: "Advanced karyotyping and sequencing to safeguard against inherited abnormalities.", icon: Dna },
    { title: "Ethical & Legal Compliance", desc: "All treatments are aligned strictly with state laws, national guidelines, and ICMR directives.", icon: FileCheck },
    { title: "Personalized Matching", desc: "Dedicated coordinator-assisted matching based on physical, genetic, and blood criteria.", icon: Compass },
    { title: "Experienced Fertility Specialists", desc: "Overseen by board-certified endocrinologists and expert clinical cryobiologists.", icon: Users },
    { title: "Complete Privacy", desc: "Intended parent identity details are completely shielded. No public profiles.", icon: EyeOff }
  ];

  const serviceCards = [
    {
      title: "Sperm Donor matching",
      desc: "Specialist matching for cryopreserved sperm samples from rigorously screened donors. Ideal for couples experiencing male factor infertility, single mothers, and LGBTQ+ family-building.",
      icon: Dna,
      badge: "Male Infertility & IUI/IVF"
    },
    {
      title: "Egg Donor Matching",
      desc: "Coordinator-assisted oocyte selection from altruistic donors. Suitable for advanced maternal age, ovarian insufficiency, or genetic concerns. Includes IVF support services.",
      icon: Egg,
      badge: "Advanced IVF Treatments"
    },
    {
      title: "Embryo Donation matching",
      desc: "Altruistic embryo matching options from completed families who wish to share the gift of life. Full counseling and legal protocols apply.",
      icon: HeartHandshake,
      badge: "Donor Embryo Cycles"
    },
    {
      title: "Donor Matching Consultation",
      desc: "A personalized 1-on-1 diagnostic review with our fertility specialists to review genetic profiles, legal documents, and sample logistics.",
      icon: Calendar,
      badge: "1-on-1 Doctor Review"
    }
  ];

  const timelineSteps = [
    { step: "01", title: "Submit donor requirement", desc: "Complete our secure preference registration wizard with your physical and genetic criteria." },
    { step: "02", title: "Coordinator Review", desc: "Our experienced fertility matching coordinator carefully evaluates your requirements and medical notes." },
    { step: "03", title: "Contact Within 24-48 Hours", desc: "A clinic representative contacts you directly to review options, legal steps, and next stages." },
    { step: "04", title: "Doctor Consultation", desc: "Schedule a formal medical review with our endocrinologists to optimize your treatment cycles." },
    { step: "05", title: "Suitable Donor Matching", desc: "We securely find and propose eligible candidates from our private, de-identified registry." },
    { step: "06", title: "Treatment Planning", desc: "Formulate cold-chain logistics and schedule insemination (IUI) or embryology cycles (IVF)." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none pb-16">
      
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/10 via-white to-secondary/5 dark:from-primary/20 dark:via-slate-950 dark:to-slate-900 border-b border-slate-100 dark:border-slate-900">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary/15 text-secondary-foreground text-[11px] font-extrabold uppercase tracking-widest">
            <HeartHandshake className="w-3.5 h-3.5" /> Coordinator Guided Matching
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
            Find the Right Sperm or Egg Donor with <span className="text-primary">Expert Guidance</span>
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Our experienced fertility specialists help you find suitable donor options based on your medical requirements, preferences, and legal guidelines. Simply submit your requirements and our dedicated team will contact you personally.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-6">
            <Link href="/recipient/find-donor" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-xl bg-primary hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-primary/10 gap-2 cursor-pointer">
                Submit Requirement <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/recipient/available-donors" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-sm shadow-md gap-2 cursor-pointer">
                <Users className="w-4 h-4" /> Browse Available Donors
              </Button>
            </Link>
            <Link href="/appointments/book" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-xl border-primary text-primary hover:bg-primary/5 font-bold text-sm gap-2">
                <Calendar className="w-4 h-4" /> Speak to an Expert
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>GDPR/HIPAA Secure Data Room • 100% Confidential Matching Process</span>
          </div>

        </div>
      </section>

      {/* Information Banner: No Public Catalog Warning */}
      <section className="py-6 bg-primary text-white border-y border-teal-800/40">
        <div className="container mx-auto px-4 max-w-4xl flex items-start sm:items-center gap-3.5 text-xs">
          <Info className="w-6 h-6 text-secondary shrink-0" />
          <p className="leading-relaxed font-semibold">
            <strong className="text-secondary uppercase">Compliance Notice:</strong> This registry is strictly private. Under national regulatory guidelines, donor details are de-identified and matching must be overseen directly by licensed clinical coordinators. Intended parents cannot browse donor catalogs or bios publicly.
          </p>
        </div>
      </section>

      {/* Why Choose Our Clinic Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-secondary">Outstanding Clinical Standards</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Why Choose Our Cryo ART Bank</h3>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {chooseUsItems.map((item, idx) => (
              <Card key={idx} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-3 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                  <item.icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* Types of Donor Services Section */}
      <section className="py-20 bg-slate-100/50 dark:bg-slate-900/20 border-y border-slate-200/50 dark:border-slate-900">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-secondary">Tailored Clinical Protocols</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Types of Donor Services</h3>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {serviceCards.map((card, idx) => (
              <Card key={idx} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 shadow-xs flex gap-5 items-start">
                <div className="p-3 rounded-2xl bg-secondary/15 text-secondary shrink-0">
                  <card.icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">{card.badge}</span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{card.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* How It Works Section (Timeline) */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl space-y-16">
          
          <div className="text-center space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-secondary">Step-By-Step Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">How the Matching Process Works</h3>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>

          {/* Timeline Elements */}
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-0 md:border-l-0 md:grid md:grid-cols-6 md:gap-4 space-y-10 md:space-y-0">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="relative pl-8 md:pl-0 md:pt-8 md:text-center space-y-2.5">
                
                {/* Visual marker */}
                <div className="absolute left-[-9px] md:left-1/2 md:top-[-9px] md:-translate-x-1/2 w-4.5 h-4.5 rounded-full bg-primary border-4 border-white dark:border-slate-950 flex items-center justify-center z-10" />
                
                <div className="text-2xl font-extrabold text-secondary font-mono leading-none md:justify-center">{step.step}</div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{step.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed md:max-w-xs md:mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <Link href="/recipient/find-donor">
              <Button size="lg" className="rounded-xl bg-primary hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-primary/10 gap-2 cursor-pointer">
                Submit Requirement Form <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>        </div>
      </section>

    </div>
  );
}
