"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Calendar, Search, Activity } from "lucide-react";

interface DoctorUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        let res = await fetch("/api/doctors");
        let data = await res.json();

        if (data.doctors) {
          setDoctors(data.doctors);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Hero */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" /> Dynamic MongoDB Directory
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Specialist Physician Directory
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Consult with board-certified reproductive endocrinologists, geneticists, and cryobiologists.
          </p>

          {/* Search bar */}
          <div className="pt-4 max-w-md mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by physician name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Doctor Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading live doctor profiles from database...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredDoctors.map((doc) => (
                <Card key={doc._id} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <img loading="lazy" 
                      src={doc.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80"} 
                      alt={doc.name} 
                      className="w-full h-56 object-cover object-top" 
                    />
                    <CardContent className="p-6 space-y-3">
                      <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        Board Certified Specialist
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{doc.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{doc.email}</p>
                      <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {doc.phone || "+1 (800) 555-0199"} • Mediyaz Clinical Staff
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0">
                    <Link href="/appointments/book">
                      <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Book Consultation
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
