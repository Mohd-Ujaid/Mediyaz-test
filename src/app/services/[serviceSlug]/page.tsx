"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ShieldCheck, 
  UserCheck, 
  Stethoscope, 
  Dna, 
  Snowflake, 
  HeartHandshake, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown,
  Tag,
  Clock
} from "lucide-react";

// Fallback visual icon mapper
function getServiceIcon(category: string, title: string) {
  const t = title.toLowerCase();
  const c = category.toLowerCase();
  if (t.includes("sperm") || t.includes("semen")) return ShieldCheck;
  if (t.includes("donor") || t.includes("match")) return UserCheck;
  if (t.includes("consult") || t.includes("care")) return Stethoscope;
  if (t.includes("gen") || t.includes("diagn")) return Dna;
  if (c.includes("cryo") || t.includes("freez")) return Snowflake;
  return HeartHandshake;
}

export default function ServiceDetailPage({ params }: { params: Promise<{ serviceSlug: string }> }) {
  const resolvedParams = use(params);
  const { serviceSlug } = resolvedParams;

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadService() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        if (data.success && data.services) {
          // Find by ID or by title-slug matches
          const found = data.services.find((s: any) => 
            s._id === serviceSlug || 
            s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === serviceSlug
          );
          setService(found || data.services[0]); // fallback to first
        }
      } catch (err) {
        console.error("Error fetching service details", err);
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [serviceSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500 text-sm">Loading service specs...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="text-slate-400 text-sm">Service not found.</div>
        <Link href="/services">
          <Button variant="outline" className="rounded-xl">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const sampleFaqs = [
    { question: "Is this service covered by clinical insurance policies?", answer: "Many diagnostic tests (like PGT-A or genetic panel tests) may have partial insurance coverage. Storing oocytes/semen for personal options is usually self-pay. Our medical desks provide complete itemized receipts." },
    { question: "How safe is the storage facility?", answer: "Our cryo vaults utilize vacuum-jacketed vapor-phase liquid nitrogen storage, backed by automated telemetry sensors, offsite backup vaults, and 24/7 technical labs." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-28 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={service.image || "https://images.unsplash.com/photo-1579154769741-62865915b820?auto=format&fit=crop&w=1000&q=80"} 
            alt={service.title} 
            className="w-full h-full object-cover opacity-10 mix-blend-overlay" 
          />
          <div className="absolute inset-0 bg-slate-950" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] bg-white/10 text-teal-400 text-xs font-semibold">
              {React.createElement(getServiceIcon(service.category, service.title), { className: "w-4 h-4 text-teal-400" })}
              <span>{service.category}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
              {service.title}
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed font-normal">
              {service.description}
            </p>

            <div className="pt-4 flex flex-wrap gap-3">
              <Link href={`/appointments/book?serviceId=${service._id}`}>
                <Button size="lg" className="h-12 px-6 rounded-[10px] bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-base gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-450 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                  <Calendar className="w-5 h-5" /> Book Service Consultation
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-12 px-6 rounded-[10px] border-white/20 text-white hover:bg-white/10 text-base">
                  Contact Clinical Desk
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Overview & Core Specs */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 max-w-5xl space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              
              {/* Overview text */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Service Overview</span>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">Why Choose {service.title}?</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                  Our banking and treatment programs employ international bioethical protocols, advanced vitrification speeds, and 24/7 automated telemetry sensors. We coordinate complete cell packaging, biological logs, and safe cryogenic courier transport to partner IVF clinics.
                </p>
              </div>

              {/* Dynamic Step Pathway for Procedure Details */}
              {(() => {
                const steps = service.procedureDetails 
                  ? service.procedureDetails.split("→").map((s: string) => s.trim())
                  : [];
                if (steps.length === 0) return null;
                return (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Treatment Pathway</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {steps.map((step: string, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 rounded-[10px] p-4 border border-slate-100 dark:border-slate-800 text-center">
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Step 0{idx + 1}</span>
                          <p className="text-xs font-bold text-slate-800 dark:text-white mt-1 leading-snug">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Eligibility checklist */}
              {(() => {
                const list = service.eligibility
                  ? service.eligibility.split(",").map((s: string) => s.trim())
                  : [];
                if (list.length === 0) return null;
                return (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Patient Eligibility</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {list.map((el: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-[10px] border border-slate-100 dark:border-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                          <span>{el}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Specifications Card */}
            <div>
              <div className="p-6 rounded-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4 shadow-xs sticky top-28">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800 pb-2">Service Specifications</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Availability</span>
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {service.availability || "Available"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Category</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{service.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Pricing</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{service.costInfo || "Variable"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Benefits List */}
          {service.benefits && service.benefits.length > 0 && (
            <div className="space-y-6 pt-8">
              <h3 className="text-xl font-bold">Key Benefits & Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {service.benefits.map((b: string, idx: number) => (
                  <div key={idx} className="rounded-[10px] bg-slate-50 dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{b}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">Quality benchmark compliance, FDA validation checks, and certified clinical logistics support.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500">Specific details regarding {service.title}.</p>
          </div>

          <div className="space-y-3">
            {sampleFaqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left bg-white dark:bg-slate-900 p-5 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                >
                  <span className="font-semibold text-sm text-slate-900 dark:text-white pr-4">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="bg-white dark:bg-slate-900 px-5 pb-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-slate-950 text-white text-center">
        <div className="container mx-auto px-4 max-w-2xl space-y-4">
          <h3 className="text-3xl font-extrabold leading-tight">Ready to Schedule {service.title}?</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">Consult with our lead medical team with complete confidentiality.</p>
          <div className="pt-4">
            <Link href={`/appointments/book?serviceId=${service._id}`}>
              <Button size="lg" className="rounded-[10px] bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm px-8 gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                <Calendar className="w-4 h-4" /> Book Appointment Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
