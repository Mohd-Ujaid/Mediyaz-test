"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Award, 
  Heart, 
  CheckCircle2, 
  Building2, 
  Users, 
  Microscope, 
  ArrowRight,
  Globe2,
  Lock,
  Scale
} from "lucide-react";

const valuesList = [
  {
    title: "Ethical Leadership",
    description: "Strict adherence to international bioethical standards, voluntary donor protection, and transparent patient communication.",
    icon: Scale
  },
  {
    title: "Privacy & Discretion",
    description: "Encrypted, confidential handling of all reproductive donor data, genetic screening records, and medical consultations.",
    icon: Lock
  },
  {
    title: "Scientific Excellence",
    description: "Utilizing Next-Gen DNA sequencing, automated temperature telemetry, and ISO Class 5 embryology cleanrooms.",
    icon: Microscope
  },
  {
    title: "Compassionate Care",
    description: "Empathy at every stage of the family-building journey, offering dedicated fertility coordinators for every patient.",
    icon: Heart
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Hero */}
      <section className="relative pt-16 pb-20 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Pioneering International Reproductive Medicine</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight"
          >
            Advancing Fertility Science With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Integrity & Care</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg sm:text-xl leading-relaxed"
          >
            For over two decades, Mediyaz Art Bank has led the global standard in cryogenic cell banking, genetic carrier screening, and specialist fertility support.
          </motion.p>
        </div>
      </section>

      {/* Story & Vision */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Our Origins</span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Founded on Rigorous Science and Unwavering Ethics
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Established by leading reproductive endocrinologists and clinical cryobiologists, Mediyaz Art Bank was built to resolve the gap between technological capabilities and patient-first medical care.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Today, our accredited facilities serve intended parents, oncological fertility preservation patients, and partner IVF clinics across North America, Europe, and Asia.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">10,000+</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Families Supported</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">300+ Panels</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Genetic Conditions Screened</div>
                </div>
              </div>
            </div>

            <div>
              <img loading="lazy" 
                src="https://images.unsplash.com/photo-1582718664467-9000d2d6c703?auto=format&fit=crop&w=800&q=80" 
                alt="Mediyaz Laboratory Team" 
                className="rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Core Guiding Principles</h2>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Our Institutional Values</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valuesList.map((val, idx) => (
              <Card key={idx} className="rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 w-fit">
                  <val.icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{val.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{val.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Lab Showcase */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-6">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">State-of-the-Art Laboratory Infrastructure</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Our facilities feature Class 5 cleanrooms with HEPA filtration, continuous liquid nitrogen vapor monitoring, and multi-tier power generators guaranteeing continuous sample preservation.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link href="/appointments/book">
              <Button size="lg" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Schedule a Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
