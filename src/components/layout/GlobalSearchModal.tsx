"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Heart,
  Dna,
  Receipt,
  Building2,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Command,
  Loader2,
  BookOpen,
  FileCheck,
  Award,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  badge: string;
  status?: string;
  link: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    donors: SearchResultItem[];
    invoices: SearchResultItem[];
    clinics: SearchResultItem[];
    doctors: SearchResultItem[];
  }>({
    donors: [],
    invoices: [],
    clinics: [],
    doctors: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ donors: [], invoices: [], clinics: [], doctors: [] });
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ donors: [], invoices: [], clinics: [], doctors: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && data.results) {
          setResults(data.results);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  const totalResults =
    results.donors.length +
    results.invoices.length +
    results.clinics.length +
    results.doctors.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search Console</DialogTitle>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search donors (name, ID, mobile), invoices (#), clinics, doctors..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-slate-200/60 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Search Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Quick Actions / Shortcuts when query is empty */}
          {!query.trim() && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Frequent Destinations
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "Egg Donors", desc: "Manage pipeline", icon: Heart, url: "/manage-registrations", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
                  { label: "Sperm Donors", desc: "Manage pipeline", icon: Dna, url: "/manage-sperm-registrations", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
                  { label: "Invoice Tracker", desc: "Payments & tax inv", icon: Receipt, url: "/invoices", color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40" },
                  { label: "Accounts Ledger", desc: "Clinic & donor laser", icon: BookOpen, url: "/ledger", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" },
                  { label: "Completed Files", desc: "Egg & sperm dossiers", icon: FileCheck, url: "/completed-files/egg", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
                  { label: "ART Clinics", desc: "Hospitals & doctors", icon: Building2, url: "/hospitals", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNavigate(item.url)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer group"
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 truncate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results State */}
          {query.trim().length >= 2 && !loading && totalResults === 0 && (
            <div className="py-10 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No matching results for &ldquo;{query}&rdquo;
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Try searching by Registration ID (e.g. MED-ED-...), Invoice (#...), or Clinic name.
              </div>
            </div>
          )}

          {/* 1. Donors Results */}
          {results.donors.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                <span>Donor Registrations</span>
                <span>{results.donors.length} found</span>
              </div>
              <div className="space-y-1">
                {results.donors.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.link)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/60 dark:hover:bg-teal-950/40 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                        {item.badge === "EGG DONOR" ? <Heart className="w-4 h-4" /> : <Dna className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.status || item.badge}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Invoices Results */}
          {results.invoices.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                <span>Invoices & Billing</span>
                <span>{results.invoices.length} found</span>
              </div>
              <div className="space-y-1">
                {results.invoices.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.link)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/60 dark:hover:bg-teal-950/40 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100/70 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "PARTIALLY_RECEIVED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.status || "PENDING"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Clinics Results */}
          {results.clinics.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                <span>ART Clinics</span>
                <span>{results.clinics.length} found</span>
              </div>
              <div className="space-y-1">
                {results.clinics.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.link)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/60 dark:hover:bg-teal-950/40 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Doctors Results */}
          {results.doctors.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                <span>Treating Doctors</span>
                <span>{results.doctors.length} found</span>
              </div>
              <div className="space-y-1">
                {results.doctors.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.link)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/60 dark:hover:bg-teal-950/40 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono text-slate-600 dark:text-slate-300">↵</kbd> to select</span>
            <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono text-slate-600 dark:text-slate-300">esc</kbd> to dismiss</span>
          </div>
          <span className="text-teal-700 dark:text-teal-400 font-semibold">Mediyaz ART Bank Console</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
