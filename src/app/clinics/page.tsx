"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  MapPin, 
  Clock, 
  Phone, 
  Activity, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Snowflake,
  Truck
} from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";

const clinicHubs = [
  {
    name: "Mediyaz New Delhi Central Bank",
    type: "Central Repository & Cryo-Storage",
    city: "New Delhi",
    address: "Gali No 4, Okhla Phase III, New Delhi, Delhi 110020",
    phone: "+91 (11) 5550-0199",
    hours: "Mon - Sat: 8:00 AM - 8:00 PM",
    features: ["ISO Class 5 Cleanroom", "24/7 LN2 Telemetry Monitoring", "Pre-Screening Consultations"]
  },
  {
    name: "Mumbai Extraction Clinic",
    type: "Collection & Specialist Facility",
    city: "Mumbai",
    address: "Plot 12, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
    phone: "+91 (22) 5550-0145",
    hours: "Mon - Fri: 9:00 AM - 6:00 PM",
    features: ["Semen Analysis Suite", "Egg Retrieval Procedures", "Donor Consultation Desks"]
  },
  {
    name: "Bengaluru Cryo-Station",
    type: "Logistics Hub & Retrieval Clinic",
    city: "Bengaluru",
    address: "80 Feet Road, Koramangala, Bengaluru, Karnataka 560034",
    phone: "+91 (80) 5550-0177",
    hours: "Mon - Sat: 9:00 AM - 7:00 PM",
    features: ["Cold-Chain Logistics Terminal", "Genetic Sample Collection", "Board-Certified Staff"]
  }
];

const partnerHospitals = [
  {
    name: "Apollo Fertility Center",
    type: "Affiliate High-Acuity Hospital",
    city: "New Delhi",
    address: "Jasola Vihar, New Delhi, Delhi 110025",
    procedures: ["IVF Micro-Transfers", "ICSI Microinjection", "Surgical Sperm Retrieval"]
  },
  {
    name: "Lilavati Hospital & Research Centre",
    type: "Affiliate Multi-Specialty Hospital",
    city: "Mumbai",
    address: "A.S. Dixit Road, Bandra West, Mumbai, Maharashtra 400050",
    procedures: ["Oocyte Extraction Cycles", "Advanced Embryo Transplants"]
  }
];

export default function ClinicsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Hero Header */}
      <section className="relative py-20 bg-slate-900 text-white overflow-hidden">
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950" />
        
        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Secondary Clinical Network</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
          >
            Our Clinics & Partner Hospitals
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed"
          >
            We manage cryogenic cell preservation, initial counseling, and Aadhaar pre-screenings across our central hubs, partnering with leading hospitals for high-acuity surgical operations.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-5xl space-y-16">
        
        {/* Logistics strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3 shadow-xs">
            <div className="mx-auto w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <Snowflake className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Vapor Phase LN2 Storage</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Continuous storage at -196°C utilizing automated nitrogen refills and telemetry tracking.</p>
          </Card>
          
          <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3 shadow-xs">
            <div className="mx-auto w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">GPS Cold-Chain Logistics</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Real-time GPS tracked shipments in cryogenic dry shippers to any accredited laboratory globally.</p>
          </Card>

          <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3 shadow-xs">
            <div className="mx-auto w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Aadhaar Secured Access</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Strict identity mapping, genetic verification locks, and HIPAA patient data privacy.</p>
          </Card>
        </div>

        {/* Central Clinics List */}
        <div className="space-y-6">
          <div className="border-b dark:border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Central Clinical Onboarding Hubs</h2>
            <p className="text-xs text-slate-500 mt-1">Our primary locations for pre-screenings, diagnostics, and counseling consultation desk meetings.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clinicHubs.map((hub, idx) => (
              <Card key={idx} className="rounded-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">{hub.type}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{hub.name}</h3>
                  </div>
                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{hub.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{hub.hours}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{hub.phone}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facility Capabilities:</span>
                    <div className="space-y-1">
                      {hub.features.map((feat, fidx) => (
                        <div key={fidx} className="text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Activity className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <Link href="/appointments/book" className="w-full">
                    <Button variant="outline" className="w-full rounded-[10px] text-xs h-9 font-semibold gap-1 cursor-pointer">
                      <Calendar className="w-3.5 h-3.5" /> Book Hub Consultation
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Affiliate Hospitals Network */}
        <div className="space-y-6">
          <div className="border-b dark:border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Affiliate Hospitals & Extraction Centers</h2>
            <p className="text-xs text-slate-500 mt-1">Our accredited third-party hospitals for high-acuity surgical procedures and specialized laboratory interventions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {partnerHospitals.map((hosp, idx) => (
              <Card key={idx} className="rounded-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{hosp.type}</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{hosp.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hosp.address}</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Associated Surgical Procedures:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hosp.procedures.map((proc, pidx) => (
                      <div key={pidx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {proc}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Global CTA */}
        <section className="p-8 rounded-[10px] bg-slate-900 text-white text-center space-y-4">
          <h3 className="text-xl font-bold">Have Questions About Our Facility Locations?</h3>
          <p className="text-xs text-slate-305 max-w-lg mx-auto leading-relaxed">
            Our specialized coordinators help sync cryo-samples directly to your chosen local IVF facility. Connect with a clinic representative to discuss your location needs.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/contact">
              <Button className="rounded-[10px] text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 h-10 flex items-center gap-1.5 cursor-pointer">
                Contact Global Support <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

      </div>

    </div>
  );
}
