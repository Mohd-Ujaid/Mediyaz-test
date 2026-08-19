"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Search, TestTubes, Heart, Snowflake, Dna, UserCheck, HeartHandshake } from "lucide-react";
import { Input } from "@/components/ui/input";

const categoryIcons: Record<string, any> = {
  "IVF": TestTubes,
  "IUI": Heart,
  "ICSI": Dna,
  "Fertility Preservation": Snowflake,
  "Donor Programs": UserCheck,
};

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        if (data.treatments) setTreatments(data.treatments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = ["All", ...new Set(treatments.map(t => t.category))];
  
  const filtered = treatments.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "All" || t.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-slate-950 text-white py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-[2.5rem] font-extrabold tracking-tight leading-tight">Fertility Treatment Options</h1>
            <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Explore our range of fertility treatments and reproductive services, each backed by clinical excellence and compassionate care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search treatments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-[10px] border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500 text-xs h-9 bg-white dark:bg-slate-950"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 ${
                    activeCategory === cat
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Grid */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <TestTubes className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">No treatments found</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((treatment, idx) => {
                const Icon = categoryIcons[treatment.category] || TestTubes;
                return (
                  <motion.div
                    key={treatment._id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                  >
                    <div className="h-full group rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col justify-between transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-950">
                      {(() => {
                        const slug = treatment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                        return (
                          <Link href={`/services/${slug}`} className="flex-1 flex flex-col focus:outline-none">
                            {treatment.image && (
                              <div className="h-44 overflow-hidden shrink-0">
                                <img
                                  src={treatment.image}
                                  alt={treatment.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-6 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                  </div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{treatment.category}</span>
                                </div>
                                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                  {treatment.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">{treatment.description}</p>
                                
                                {treatment.benefits && treatment.benefits.length > 0 && (
                                  <div className="mt-4 space-y-1">
                                    {treatment.benefits.slice(0, 3).map((b: string, i: number) => (
                                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                        {b}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })()}

                      <div className="px-6 pb-6 pt-4 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 mt-auto">
                        {treatment.costInfo && (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{treatment.costInfo}</span>
                        )}
                        <Link href={`/appointments/book?serviceId=${treatment._id}`}>
                          <Button size="sm" className="bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-[10px] text-xs font-semibold gap-1.5 px-4 h-8 transition-colors duration-200">
                            <Calendar className="w-3.5 h-3.5" /> Book Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Not Sure Which Treatment Is Right for You?</h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">Our fertility specialists will guide you through the options and create a personalized treatment plan.</p>
          <Link href="/appointments/book" className="inline-block mt-8">
            <Button size="lg" className="rounded-[10px] bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-8 gap-2 transition-colors duration-200">
              <Calendar className="w-5 h-5" /> Book Free Consultation
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
