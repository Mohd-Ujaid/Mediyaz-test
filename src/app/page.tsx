"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ShieldCheck,
  Dna,
  Lock,
  Award,
  Snowflake,
  Stethoscope,
  UserCheck,
  Heart,
  HeartHandshake,
  Calendar,
  ArrowRight,
  Microscope,
  ChevronDown,
  Star,
  FileCheck,
  ChevronRight,
  Baby,
  Egg,
  TestTubes,
  CircleDot,
  Play,
  X,
  Video,
  ChevronLeft,
  MapPin,
  Send,
  Loader2,
  Phone,
  AlertCircle,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";

// =====================================================================
// SENSORY DATA & ASSETS
// =====================================================================

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

const whyChooseUsData = [
  {
    title: "Expert Clinical Team",
    desc: "Directed by board-certified endocrinologists and cryobiologists with extensive cell vitrification training.",
    icon: Stethoscope,
  },
  {
    title: "Ethical Donor Sourcing",
    desc: "Strictly altruistic, non-commercially motivated donor selection adhering to national ART guidelines.",
    icon: HeartHandshake,
  },
  {
    title: "Safe Medical Screening",
    desc: "Comprehensive 140+ genetic, psychological, and physiological screening panels for absolute safety.",
    icon: ShieldCheck,
  },
  {
    title: "Confidentiality & Privacy",
    desc: "Encrypted, HIPAA-compliant storage of identity, genetic profiles, and diagnostic documents.",
    icon: Lock,
  },
  {
    title: "Personalized Patient Care",
    desc: "Dedicated fertility caseworkers mapping cryogenic logistics directly to your local IVF facility.",
    icon: Heart,
  },
  {
    title: "Transparent Procedures",
    desc: "Explicit compliance documentation, certified cell counts, and real-time transit telemetry tracking.",
    icon: Award,
  },
];

const secondaryServices = [
  {
    title: "In Vitro Fertilization (IVF)",
    desc: "Comprehensive laboratory support, culture monitoring, and embryo blastocyst transfers.",
    icon: TestTubes,
    slug: "in-vitro-fertilization-ivf",
  },
  {
    title: "Intrauterine Insemination (IUI)",
    desc: "Minimally invasive clinical insemination cycle tracking with optimized semen preps.",
    icon: CircleDot,
    slug: "intrauterine-insemination-iui",
  },
  {
    title: "Intracytoplasmic Sperm Injection (ICSI)",
    desc: "Advanced micromanipulation microinjecting a single viable sperm directly into the oocyte.",
    icon: Microscope,
    slug: "intracytoplasmic-sperm-injection-icsi",
  },
  {
    title: "Cryopreservation & Storage",
    desc: "Liquid nitrogen vapor phase vitrification preserving oocytes, sperm, and embryos at -196°C.",
    icon: Snowflake,
    slug: "cryopreservation",
  },
  {
    title: "Genetic Panel Screening",
    desc: "Next-generation pre-implantation testing for chromosomal aneuploidies and gene mutations.",
    icon: Dna,
    slug: "genetic-screening",
  },
  {
    title: "Fertility Consultations",
    desc: "Specialist diagnostics mapping reproductive health markers and counseling timelines.",
    icon: Calendar,
    slug: "consultation",
  },
];

const partnerHospitals = [
  { name: "Apollo Fertility", location: "New Delhi", initial: "AF" },
  { name: "Lilavati IVF Lab", location: "Mumbai", initial: "LH" },
  { name: "Mediyaz Central Hub", location: "Bengaluru", initial: "MH" },
  { name: "Manipal Hospital", location: "Chennai", initial: "MP" },
  { name: "Cloudnine Clinic", location: "Kolkata", initial: "CC" },
];

const fallbackDoctors = [
  {
    name: "Dr. Ananya Sharma",
    specialty: "Reproductive Endocrinologist",
    experience: "12+ Years",
    qualifications: "MD, Fellowship in REI",
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80",
    email: "a.sharma@mediyaz.org",
  },
  {
    name: "Dr. Rajesh Varma",
    specialty: "Chief Cryobiologist",
    experience: "15+ Years",
    qualifications: "PhD in Cell Biology",
    avatar:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80",
    email: "r.varma@mediyaz.org",
  },
  {
    name: "Dr. Sarah D'Souza",
    specialty: "Clinical Embryologist",
    experience: "8+ Years",
    qualifications: "MS in Embryology",
    avatar:
      "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=600&q=80",
    email: "s.dsouza@mediyaz.org",
  },
  {
    name: "Dr. Amit Patel",
    specialty: "Genetic Screening Specialist",
    experience: "10+ Years",
    qualifications: "MD, PhD in Genetics",
    avatar:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80",
    email: "a.patel@mediyaz.org",
  },
];

const faqs = [
  {
    question: "What is the success rate for IVF matches at Mediyaz?",
    answer:
      "Our IVF matching success rate is 72% per transfer cycle for intended parents under 35. Our cryopreservation survival rate stands at 99%, which guarantees cell count viability post-thaw.",
  },
  {
    question: "How does the clinic protect donor anonymity?",
    answer:
      "All donor identities and sensitive documents are encrypted in our databases. Releasing cell samples to intended parents occurs strictly on a de-identified key code basis, adhering to national legal compliance standard regulations.",
  },
  {
    question: "What is the pre-screening criteria for sperm and egg donors?",
    answer:
      "Donors must be between 18-50 years old for sperm and 18-35 years old for eggs, with clean genetic profiles, no history of communicable or chronic illnesses, and verified physical health panels checked by clinical advisors.",
  },
  {
    question:
      "How long does it take from inquiry submission to registration ID code?",
    answer:
      "Once you submit your initial inquiry, a coordinator reviews it and contacts you within 24-48 business hours. Following physical diagnostics at a local hub, you are assigned a Registration ID code to join the matching registry catalog.",
  },
  {
    question:
      "Are the cell samples tracked during transport to partner hospitals?",
    answer:
      "Yes, every cryogenic shipper is sealed with lock tags and monitored using GPS cellular temperature telemetry, tracking real-time LN2 vapor levels from extraction hubs directly to local surgical tables.",
  },
];

// =====================================================================
// SUB-COMPONENTS
// =====================================================================

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          let start = 0;
          const end = value;
          const duration = 2000;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.1 },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={elementRef}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// =====================================================================
// MAIN HOMEPAGE REDESIGN
// =====================================================================

export default function Home() {
  const formRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Doctors & reviews dynamic state
  const [doctors, setDoctors] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Inquiry form state
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    emailAddress: "",
    gender: "Male",
    dateOfBirth: "",
    donationInterest: "sperm",
    height: "",
    weight: "",
    hairColor: "Black",
    eyeColor: "Black",
    skinTone: "Fair",
    city: "",
    state: "Maharashtra",
    preferredContactTime: "Morning (9 AM - 12 PM)",
    message: "",
    consent: false,
  });

  // Lightbox testimonial state
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    mediaList: { type: "image" | "video"; url: string }[];
    index: number;
    storyTitle: string;
  }>({
    isOpen: false,
    mediaList: [],
    index: 0,
    storyTitle: "",
  });

  // Calculate age for pre-screening verification
  const calculatedAge = (() => {
    if (!form.dateOfBirth) return null;
    const birth = new Date(form.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  })();

  // Track scroll properties
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch reviews & doctors
  useEffect(() => {
    async function loadData() {
      try {
        const resDoctors = await fetch("/api/doctors");
        const dataDoctors = await resDoctors.json();
        setDoctors(dataDoctors.doctors || []);

        const resReviews = await fetch("/api/reviews");
        const dataReviews = await resReviews.json();
        setReviews(dataReviews.reviews || []);
      } catch (err) {
        console.error("Error loading homepage dynamic assets:", err);
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadData();
  }, []);

  // Handle inquiry form validations
  const validateForm = () => {
    const temp: Record<string, string> = {};
    if (!form.fullName.trim()) temp.fullName = "Full name is required";
    if (!form.mobileNumber) {
      temp.mobileNumber = "Phone number is required";
    } else if (form.mobileNumber.length !== 10) {
      temp.mobileNumber = "Must be exactly 10 digits";
    }
    if (!form.emailAddress) {
      temp.emailAddress = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.emailAddress)) {
      temp.emailAddress = "Invalid email format";
    }
    if (!form.dateOfBirth) {
      temp.dateOfBirth = "Date of birth is required";
    } else if (calculatedAge !== null) {
      if (calculatedAge < 18 || calculatedAge > 50) {
        temp.dateOfBirth = "Eligibility requires age 18 to 50";
      }
    }
    if (!form.city.trim()) temp.city = "City is required";
    if (!form.consent) temp.consent = "Consent checkbox is required";

    setFormErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all fields correctly.");
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/donor-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: calculatedAge,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormSuccess(true);
        toast.success("Donor Pre-Screening inquiry submitted successfully!");
        setForm({
          fullName: "",
          mobileNumber: "",
          emailAddress: "",
          gender: "Male",
          dateOfBirth: "",
          donationInterest: "sperm",
          height: "",
          weight: "",
          hairColor: "Black",
          eyeColor: "Black",
          skinTone: "Fair",
          city: "",
          state: "Maharashtra",
          preferredContactTime: "Morning (9 AM - 12 PM)",
          message: "",
          consent: false,
        });
      } else {
        toast.error(
          data.error || "Failed to submit inquiry. Please try again.",
        );
      }
    } catch (err) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getStoryMedia = (story: any) => {
    const list: { type: "image" | "video"; url: string }[] = [];
    if (story.videoUrl) list.push({ type: "video", url: story.videoUrl });
    if (story.imageUrl) list.push({ type: "image", url: story.imageUrl });
    return list;
  };

  const openLightbox = (story: any) => {
    const media = getStoryMedia(story);
    if (media.length === 0) return;
    setLightbox({
      isOpen: true,
      mediaList: media,
      index: 0,
      storyTitle: story.title || story.name || "Donor Story",
    });
  };

  return (
    <main className="min-h-screen bg-muted/30  transition-colors duration-300 relative">
      {/* Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-blue-500 z-[60] transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Floating CTA WhatsApp & Back-To-Top */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a
          href="https://wa.me/9667780807"
          target="_blank"
          rel="noreferrer"
          className="p-3.5 bg-brand-500 hover:bg-brand-400 text-white rounded-full shadow-lg shadow-brand-500/20 hover:scale-105 transition-all duration-200"
          title="Chat on WhatsApp"
        >
          <Phone className="w-5.5 h-5.5" />
        </a>
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="p-3 bg-foreground dark:bg-white text-white dark:text-foreground rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
              title="Back to Top"
            >
              <ChevronDown className="w-5 h-5 rotate-180" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Bottom CTA for Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background/95 border-t border-border dark:border-border p-3 z-45 flex gap-2 backdrop-blur-md">
        <Button
          onClick={scrollToForm}
          className="w-full bg-brand-500 text-foreground font-bold rounded-[10px] text-xs h-10 shadow-md"
        >
          Apply as Donor
        </Button>
        <Link href="/recipient" className="w-full">
          <Button className="w-full bg-foreground dark:bg-white text-white dark:text-foreground font-bold rounded-[10px] text-xs h-10 border dark:border-border">
            Find a Donor
          </Button>
        </Link>
      </div>

      {/* ================================================================
          1. HERO SECTION
      ================================================================ */}
      <section className="relative bg-background text-white overflow-hidden border-b border-border pt-24 pb-28 md:pt-32 md:pb-36 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]">
        {/* Ambient Glow Orbs */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-gradient-to-br from-brand-500/10 to-blue-500/10 blur-3xl opacity-70 animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-gradient-to-tr from-indigo-500/5 to-brand-500/5 blur-3xl opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold"
              >
                <Dna className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  India's Premier Cryogenic ART Donor Registry & Clinic
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white"
              >
                Pioneering{" "}
                <span className="bg-gradient-to-r from-brand-400 via-emerald-350 to-blue-400 bg-clip-text text-transparent">
                  Sperm & Egg
                </span>{" "}
                <br />
                Donor Programs
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed"
              >
                Providing highly-screened, legally-compliant sperm and egg donor
                matchings for intended parents. Backed by expert cryobiologists,
                state-of-the-art cold-chain logistics, and complete patient
                confidentiality.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center gap-4 pt-4"
              >
                <Link href="/recipient" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-brand-500 hover:bg-brand-400 text-foreground font-bold text-sm h-12 px-8 rounded-[10px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 cursor-pointer"
                  >
                    Find a Donor <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  onClick={scrollToForm}
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-muted text-foreground font-bold text-sm h-12 px-8 rounded-[10px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Become a Donor <ArrowRight className="w-4 h-4" />
                </Button>
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full text-white border-slate-700 hover:bg-foreground font-bold text-sm h-12 px-8 rounded-[10px] flex items-center justify-center cursor-pointer"
                  >
                    Contact Our Experts
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-6 pt-10 border-t border-border text-left"
              >
                <div>
                  <div className="text-2xl md:text-3xl font-extrabold text-brand-400">
                    15+
                  </div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">
                    Years Experience
                  </div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-extrabold text-brand-400">
                    4,800+
                  </div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">
                    Donor Matches
                  </div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-extrabold text-brand-400">
                    18+
                  </div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">
                    Expert Specialists
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Side Hero Image Container */}
            <div className="lg:col-span-5 hidden lg:block relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-square w-full rounded-[10px] overflow-hidden border border-border shadow-2xl"
              >
                {/* Visual overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                <img
                  src="/images/hero_bg.png"
                  alt="Mediyaz Premium Cryogenic ART Laboratory"
                  className="w-full h-full object-cover"
                />

                {/* Floating clinical authentication badge */}
                <div className="absolute bottom-6 left-6 right-6 z-20 p-4 rounded-[10px] bg-background/80 backdrop-blur-md border border-border flex items-center gap-3 text-left">
                  <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                      Accredited ART Bank
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ISMS ISO 27001 & ICMR Registered Bank
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          2. TRUST BAR
      ================================================================ */}
      <section className="border-b border-border dark:border-border bg-white  transition-colors">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {[
              { text: "Certified Clinic", icon: ShieldCheck },
              { text: "Confidential Process", icon: Lock },
              { text: "Experienced Specialists", icon: Stethoscope },
              { text: "Secure & Private", icon: Award },
              { text: "High Success Rate", icon: Heart },
              { text: "24/7 Clinical Support", icon: Phone },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 text-foreground dark:text-muted-foreground"
              >
                <item.icon className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          3. WHY CHOOSE US
      ================================================================ */}
      <section className="py-24 bg-white  transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Why Choose Mediyaz
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground  leading-tight">
              Uncompromising Standards of Reproductive Excellence
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground max-w-md mx-auto leading-relaxed">
              We coordinate ethical cell donations, rigorous clinical reviews,
              and secure storage to build healthy, growing families.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUsData.map((item, idx) => (
              <Card
                key={idx}
                className="rounded-[10px] border border-border dark:border-border bg-white  p-6 space-y-4 hover:border-brand-500/25 dark:hover:border-brand-400/20 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="p-3 bg-brand-500/10 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-[10px] w-fit group-hover:scale-105 transition-transform duration-200">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground ">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          4. DONOR PROGRAMS (Sperm & Egg core showcase)
      ================================================================ */}
      <section className="py-24 bg-muted/30  border-y border-border dark:border-border transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Active Registry Portals
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground ">
              Primary Reproductive Donation Programs
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground max-w-md mx-auto leading-relaxed">
              We host fully-screened oocyte and cryogenic sperm matches under
              strict confidentiality codes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sperm Donor Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group border border-border dark:border-border rounded-[10px] bg-white  overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="p-4 rounded-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                    <Dna className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wide">
                    Sperm Donor Program
                  </span>
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-xl font-bold text-foreground  group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Altruistic Sperm Matching
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed">
                    Help prospective parents grow. Our donor matching maintains
                    detailed files, genetic panel clearance, and complete
                    identity protection.
                  </p>
                </div>

                <div className="border-t border-border dark:border-border pt-4 space-y-3.5 text-left text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium">
                      Benefits:
                    </span>
                    <p className="text-foreground dark:text-muted-foreground text-[11px] mt-0.5">
                      Complimentary genetic carrier panel & physical health
                      logs.
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">
                      Eligibility:
                    </span>
                    <p className="text-foreground dark:text-muted-foreground text-[11px] mt-0.5">
                      Age 18 - 50, non-smoker, clean health declarations.
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">
                      Success Rate:
                    </span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      72% Cycle Viability
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    setForm((prev) => ({ ...prev, donationInterest: "sperm" }));
                    scrollToForm();
                  }}
                  className="flex-1 w-full rounded-[10px] h-11 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 gap-1.5 flex items-center justify-center cursor-pointer"
                >
                  Submit Inquiry <Send className="w-3.5 h-3.5" />
                </Button>
                <Link href="/donor?type=sperm" className="flex-1 w-full block">
                  <Button
                    variant="outline"
                    className="w-full rounded-[10px] h-11 text-xs font-bold border-border dark:border-border cursor-pointer"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Egg Donor Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group border border-border dark:border-border rounded-[10px] bg-white  overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-rose-500/5 hover:border-rose-500/30 transition-all duration-300"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="p-4 rounded-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                    <Egg className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wide">
                    Egg Donor Program
                  </span>
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-xl font-bold text-foreground  group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Altruistic Egg Donation
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed">
                    Provide the ultimate gift of life to women facing medical
                    ovarian blocks. Coordinate collection cycles safely with
                    board-certified physicians.
                  </p>
                </div>

                <div className="border-t border-border dark:border-border pt-4 space-y-3.5 text-left text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium">
                      Benefits:
                    </span>
                    <p className="text-foreground dark:text-muted-foreground text-[11px] mt-0.5">
                      Complimentary fertility reserves profiling & hormonal
                      logs.
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">
                      Eligibility:
                    </span>
                    <p className="text-foreground dark:text-muted-foreground text-[11px] mt-0.5">
                      Age 18 - 35, healthy BMI reserves, no genetic mutations.
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">
                      Cryo Survival:
                    </span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      99% Survival Vitrification
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    setForm((prev) => ({ ...prev, donationInterest: "egg" }));
                    scrollToForm();
                  }}
                  className="flex-1 w-full rounded-[10px] h-11 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 gap-1.5 flex items-center justify-center cursor-pointer"
                >
                  Submit Inquiry <Send className="w-3.5 h-3.5" />
                </Button>
                <Link href="/donor?type=egg" className="flex-1 w-full block">
                  <Button
                    variant="outline"
                    className="w-full rounded-[10px] h-11 text-xs font-bold border-border dark:border-border cursor-pointer"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          5. HOW IT WORKS
      ================================================================ */}
      <section className="py-24 bg-white  transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Process Overview
            </span>
            <h2 className="text-3xl font-extrabold text-foreground ">
              The Path to Verified Donation
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground max-w-lg mx-auto leading-relaxed">
              We guide donors and intended families step-by-step through a
              medically secured process.
            </p>
          </motion.div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Submit Online Inquiry",
                desc: "Complete the secure inquiry form sharing basic health indicators.",
                icon: FileCheck,
              },
              {
                step: "02",
                title: "Specialist Consultation",
                desc: "Consult with a clinical officer regarding eligibility, compensation, and screening logistics.",
                icon: Stethoscope,
              },
              {
                step: "03",
                title: "Medical Evaluation",
                desc: "Perform detailed genetic panel screenings, physiological labs, and diagnostic scans.",
                icon: ShieldCheck,
              },
              {
                step: "04",
                title: "Matching Process",
                desc: "Match securely with recipient families under de-identified, anonymous clinical keys.",
                icon: Dna,
              },
              {
                step: "05",
                title: "Clinical Treatment",
                desc: "Initiate extraction and cryogenic vitrification cycles directed by lab experts.",
                icon: Microscope,
              },
              {
                step: "06",
                title: "Ongoing Care Support",
                desc: "Post-donation recovery tracking, counseling desks support, and legal followups.",
                icon: Award,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-muted/30  p-6 rounded-[10px] border border-border dark:border-border flex flex-col justify-between hover:border-brand-500/30 dark:hover:border-brand-400/20 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-[10px] bg-white dark:bg-muted flex items-center justify-center shadow-xs">
                      <item.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <span className="text-2xl font-extrabold text-slate-200 dark:text-foreground select-none">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground  mb-2 text-left">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed text-left">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          6. MEET OUR SPECIALISTS
      ================================================================ */}
      <section className="py-24 bg-muted/30  border-y border-border dark:border-border transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Our Experts
            </span>
            <h2 className="text-3xl font-extrabold text-foreground ">
              Reproductive Medicine & Cryo Specialists
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground max-w-md mx-auto leading-relaxed">
              Consult with board-certified physicians, embryologists, and
              genetic coordinators.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(doctors.length > 0 ? doctors.slice(0, 4) : fallbackDoctors).map(
              (doc, idx) => (
                <Card
                  key={idx}
                  className="group rounded-[10px] border border-border dark:border-border bg-white  overflow-hidden flex flex-col justify-between hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    <div className="relative h-56 bg-muted dark:bg-foreground overflow-hidden">
                      <img
                        src={
                          doc.avatar ||
                          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80"
                        }
                        alt={doc.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-550"
                      />
                    </div>
                    <CardContent className="p-5 space-y-2 text-left">
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        {doc.specialty || "Board Certified Specialist"}
                      </span>
                      <h3 className="text-base font-extrabold text-foreground  leading-tight">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {doc.qualifications || "MD, Fellow of REI"} •{" "}
                        {doc.experience || "10+ Yrs Exp"}
                      </p>
                    </CardContent>
                  </div>
                  <div className="p-5 pt-0">
                    <Link href="/appointments/book">
                      <Button className="w-full rounded-[10px] text-xs h-9 bg-foreground dark:bg-white text-white dark:text-foreground font-bold hover:bg-muted dark:hover:bg-muted flex items-center gap-1.5 cursor-pointer">
                        <Calendar className="w-3.5 h-3.5" /> Book Consultation
                      </Button>
                    </Link>
                  </div>
                </Card>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ================================================================
          7. PARTNER CLINICS & HOSPITALS (Responsive Carousel)
      ================================================================ */}
      <section className="py-12 bg-white  border-b border-border dark:border-border overflow-hidden transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="text-left shrink-0">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                Clinical Networks
              </span>
              <div className="text-sm font-bold text-foreground  mt-0.5">
                Accredited Affiliate Hospitals
              </div>
            </div>

            {/* Carousel track */}
            <div className="flex-1 w-full overflow-hidden relative">
              <div className="flex items-center gap-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap">
                {partnerHospitals
                  .concat(partnerHospitals)
                  .map((partner, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2.5 px-5 py-3 rounded-[10px] bg-muted/30  border border-border dark:border-border shrink-0 select-none text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 font-extrabold flex items-center justify-center text-xs shrink-0">
                        {partner.initial}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground ">
                          {partner.name}
                        </div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          {partner.location}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          8. STATISTICS SECTION (Animated Counters)
      ================================================================ */}
      <section className="py-20 bg-foreground text-white transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-brand-400">
                <Counter value={4800} suffix="+" />
              </div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1.5">
                Successful Matches
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-brand-400">
                <Counter value={3200} suffix="+" />
              </div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1.5">
                Happy Families
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-brand-400">
                <Counter value={18} suffix="+" />
              </div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1.5">
                Expert Doctors
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-brand-400">
                <Counter value={15} suffix="+" />
              </div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1.5">
                Years Cryo Experience
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-brand-400">
                <Counter value={24} suffix="+" />
              </div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1.5">
                Partner Clinics
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          9. ADDITIONAL FERTILITY SERVICES (Secondary Cap)
      ================================================================ */}
      <section className="py-24 bg-white  border-b border-border dark:border-border transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Supporting Capabilities
            </span>
            <h2 className="text-3xl font-extrabold text-foreground  mt-1">
              Secondary Fertility Treatments & Laboratory Support
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground max-w-lg mx-auto leading-relaxed">
              We provide comprehensive embryology assays and clinical storage as
              secondary clinical services.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryServices.map((treatment, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link href={`/services/${treatment.slug}`}>
                  <div className="group relative bg-white  border border-border dark:border-border rounded-[10px] p-6 cursor-pointer hover:border-brand-500/20 hover:shadow-xs transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-[10px] bg-muted/30 dark:bg-muted flex items-center justify-center shrink-0 shadow-xs">
                        <treatment.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-bold text-foreground  text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {treatment.title}
                        </h3>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1.5 leading-relaxed">
                          {treatment.desc}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/services">
              <Button
                variant="outline"
                className="rounded-[10px] text-xs font-bold gap-2 border-border dark:border-border h-10 px-6 cursor-pointer"
              >
                Explore All Supporting Services{" "}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          10. SUCCESS STORIES (Testimonials & Lightbox)
      ================================================================ */}
      <section className="py-24 bg-muted/30  transition-colors">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <h2 className="text-3xl font-extrabold text-foreground ">
              Patient Testimonials & Success Stories
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground max-w-md mx-auto leading-relaxed">
              Real families sharing stories from their cell matching journeys
              with our clinical teams.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews
              .filter((r) => r.approved)
              .slice(0, 3)
              .map((review, idx) => {
                const media = getStoryMedia(review);
                const firstMedia = media[0];

                return (
                  <div
                    key={idx}
                    className="w-full flex flex-col bg-white  border border-border dark:border-border rounded-[10px] overflow-hidden hover:shadow-md transition-all duration-300"
                  >
                    {firstMedia && (
                      <div
                        className="relative aspect-video bg-muted dark:bg-foreground overflow-hidden cursor-pointer"
                        onClick={() => openLightbox(review)}
                      >
                        {firstMedia.type === "image" ? (
                          <img
                            src={firstMedia.url}
                            alt={review.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={firstMedia.url}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-background/20 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-2.5 right-2.5 bg-foreground/60 backdrop-blur-sm text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm">
                          {review.treatment}
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col justify-between text-left space-y-4">
                      <div className="space-y-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.rating || 5 }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                              />
                            ),
                          )}
                        </div>
                        {review.title && (
                          <h4 className="font-bold text-sm text-foreground  leading-snug">
                            "{review.title}"
                          </h4>
                        )}
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed">
                          "
                          {review.review.length > 150
                            ? review.review.substring(0, 150) + "..."
                            : review.review}
                          "
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-border dark:border-border">
                        <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {review.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground ">
                            {review.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {review.treatment}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* ================================================================
          11. FREQUENTLY ASKED QUESTIONS
      ================================================================ */}
      <section className="py-24 bg-white  border-t border-border dark:border-border transition-colors">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14 space-y-2"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground ">
              Questions we hear most.
            </h2>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              Essential answers regarding donor selection and safety protocols.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left bg-muted/30  border border-border dark:border-border rounded-[10px] p-5 transition-colors duration-250 hover:bg-muted dark:hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground  pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${openFaq === idx ? "rotate-180" : ""}`}
                    />
                  </div>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          12. HIGH-CONVERTING INLINE INQUIRY FORM SECTION
      ================================================================ */}
      <section
        ref={formRef}
        className="py-24 bg-muted/30  border-y border-border dark:border-border transition-colors"
      >
        <div className="container mx-auto px-4 max-w-xl">
          <div className="text-center space-y-4 mb-10">
            <div className="inline-flex p-3 rounded-full bg-brand-500/10 text-brand-600 mb-1">
              <Heart className="w-8 h-8 fill-brand-600/10" />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground  tracking-tight">
              Submit Donor Pre-Screening Inquiry
            </h2>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Complete the secure online inquiry form sharing basic physical &
              health declarations. Registration only happens after clinic review
              and contact.
            </p>
          </div>

          <Card className="rounded-[10px] border border-border dark:border-border bg-white  shadow-md p-6 sm:p-8">
            {formSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-brand-600 rounded-full w-fit mx-auto animate-bounce">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-foreground ">
                  Inquiry Received Successfully
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Our case managers will review your physiological details and
                  contact you within 24-48 business hours to schedule hub
                  diagnostics.
                </p>
                <Button
                  onClick={() => setFormSuccess(false)}
                  className="rounded-[10px] bg-foreground text-white hover:bg-muted dark:bg-white dark:text-foreground dark:hover:bg-muted text-xs px-6"
                >
                  Submit Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Donation Program Select Option */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-foreground ">
                    Interested Program: <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`py-3 px-4 rounded-[10px] text-xs font-bold border transition-all flex items-center gap-3 cursor-pointer ${
                        form.donationInterest === "sperm"
                          ? "bg-brand-500/10 border-brand-500 text-teal-750 dark:text-brand-400"
                          : "border-border dark:border-border bg-transparent text-slate-655 dark:text-muted-foreground hover:bg-muted/30 dark:hover:bg-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="donationInterest"
                        value="sperm"
                        checked={form.donationInterest === "sperm"}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            donationInterest: "sperm",
                            gender: "Male",
                          }))
                        }
                        className="w-3.5 h-3.5 text-brand-600 focus:ring-brand-500 border-slate-300 rounded-full cursor-pointer"
                      />
                      <span>Sperm Donor</span>
                    </label>

                    <label
                      className={`py-3 px-4 rounded-[10px] text-xs font-bold border transition-all flex items-center gap-3 cursor-pointer ${
                        form.donationInterest === "egg"
                          ? "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400"
                          : "border-border dark:border-border bg-transparent text-slate-655 dark:text-muted-foreground hover:bg-muted/30 dark:hover:bg-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="donationInterest"
                        value="egg"
                        checked={form.donationInterest === "egg"}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            donationInterest: "egg",
                            gender: "Female",
                          }))
                        }
                        className="w-3.5 h-3.5 text-rose-500 focus:ring-rose-500 border-slate-300 rounded-full cursor-pointer"
                      />
                      <span>Egg Donor</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground ">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      className={`w-full px-3 h-9 rounded-[10px] border text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white  text-foreground  ${
                        formErrors.fullName
                          ? "border-red-500"
                          : "border-border dark:border-border"
                      }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />{" "}
                        {formErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mobile Number */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit phone number"
                        value={form.mobileNumber}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            mobileNumber: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          }))
                        }
                        className={`w-full px-3 h-9 rounded-[10px] border text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white  text-foreground  ${
                          formErrors.mobileNumber
                            ? "border-red-500"
                            : "border-border dark:border-border"
                        }`}
                      />
                      {formErrors.mobileNumber && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {formErrors.mobileNumber}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={form.emailAddress}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            emailAddress: e.target.value,
                          }))
                        }
                        className={`w-full px-3 h-9 rounded-[10px] border text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white  text-foreground  ${
                          formErrors.emailAddress
                            ? "border-red-500"
                            : "border-border dark:border-border"
                        }`}
                      />
                      {formErrors.emailAddress && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {formErrors.emailAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Gender select */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            gender: e.target.value,
                          }))
                        }
                        className="w-full px-3 h-9 rounded-[10px] border border-border dark:border-border text-xs focus:outline-none bg-white  text-foreground "
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* DOB */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            dateOfBirth: e.target.value,
                          }))
                        }
                        className={`w-full px-3 h-9 rounded-[10px] border text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white  text-foreground  ${
                          formErrors.dateOfBirth
                            ? "border-red-500"
                            : "border-border dark:border-border"
                        }`}
                      />
                      {formErrors.dateOfBirth && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {formErrors.dateOfBirth}
                        </p>
                      )}
                    </div>
                  </div>

                  {calculatedAge !== null && !formErrors.dateOfBirth && (
                    <div className="text-[10px] text-muted-foreground bg-brand-500/5 border border-brand-500/10 p-2 rounded-md">
                      Age Screened:{" "}
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {calculatedAge} years
                      </span>{" "}
                      (Elligible range 18 - 50 years).
                    </div>
                  )}

                  {/* Physical Attributes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 175"
                        value={form.height}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            height: e.target.value,
                          }))
                        }
                        className="w-full px-3 h-9 rounded-[10px] border border-border dark:border-border text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white  text-foreground "
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 70"
                        value={form.weight}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            weight: e.target.value,
                          }))
                        }
                        className="w-full px-3 h-9 rounded-[10px] border border-border dark:border-border text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white  text-foreground "
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Hair Color
                      </label>
                      <select
                        value={form.hairColor}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            hairColor: e.target.value,
                          }))
                        }
                        className="w-full px-3 h-9 rounded-[10px] border border-border dark:border-border text-xs focus:outline-none bg-white  text-foreground "
                      >
                        <option value="Black">Black</option>
                        <option value="Brown">Brown</option>
                        <option value="Blonde">Blonde</option>
                        <option value="Auburn">Auburn</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Eye Color
                      </label>
                      <select
                        value={form.eyeColor}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            eyeColor: e.target.value,
                          }))
                        }
                        className="w-full px-3 h-9 rounded-[10px] border border-border dark:border-border text-xs focus:outline-none bg-white  text-foreground "
                      >
                        <option value="Black">Black</option>
                        <option value="Brown">Brown</option>
                        <option value="Blue">Blue</option>
                        <option value="Green">Green</option>
                        <option value="Hazel">Hazel</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        Skin Tone
                      </label>
                      <select
                        value={form.skinTone}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            skinTone: e.target.value,
                          }))
                        }
                        className="w-full px-3 h-9 rounded-[10px] border border-border dark:border-border text-xs focus:outline-none bg-white  text-foreground "
                      >
                        <option value="Fair">Fair</option>
                        <option value="Medium">Medium</option>
                        <option value="Olive">Olive</option>
                        <option value="Dark">Dark</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* City */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Your City"
                        value={form.city}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, city: e.target.value }))
                        }
                        className={`w-full px-3 h-9 rounded-[10px] border text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white  text-foreground  ${
                          formErrors.city
                            ? "border-red-500"
                            : "border-border dark:border-border"
                        }`}
                      />
                      {formErrors.city && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" /> {formErrors.city}
                        </p>
                      )}
                    </div>

                    {/* State select */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground ">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.state}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                        className="w-full px-3 h-9 rounded-[10px] border border-border dark:border-border text-xs focus:outline-none bg-white  text-foreground "
                      >
                        {STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground ">
                      Message / Comments{" "}
                      <span className="text-[10px] text-muted-foreground">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      placeholder="Briefly state any questions or additional details..."
                      value={form.message}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 min-h-[80px] rounded-[10px] border border-border dark:border-border bg-white  text-foreground  text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Consent checkbox */}
                  <div className="flex items-start gap-2.5 p-3 rounded-[10px] bg-muted/30 dark:bg-foreground/60 border border-border dark:border-border">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={form.consent}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          consent: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 rounded border-slate-250 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <label
                        htmlFor="consent"
                        className="text-xs font-bold text-foreground dark:text-muted-foreground cursor-pointer select-none"
                      >
                        I permit clinic coordinators to contact me regarding
                        pre-screening.
                      </label>
                      {formErrors.consent && (
                        <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />{" "}
                          {formErrors.consent}
                        </p>
                      )}
                      <p className="text-[9px] text-muted-foreground leading-tight">
                        By checking this, you agree to secure data transmission
                        compliance logs under HIPAA protocols.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full rounded-[10px] h-10 text-xs font-bold text-foreground bg-brand-500 hover:bg-brand-400 shadow-md shadow-brand-500/20 gap-1.5 flex items-center justify-center cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting
                      Inquiry...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Inquiry{" "}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>

      {/* ================================================================
          13. FINAL CTA
      ================================================================ */}
      <section className="py-24 bg-background text-white border-t border-border transition-colors">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 max-w-xl mx-auto"
          >
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Start Your Parenthood Journey Today
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Take the first step to becoming an active donor or finding
              matches. Our specialized medical coordinators provide full
              guidance, logistics security, and support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={scrollToForm}
                size="lg"
                className="w-full sm:w-auto bg-brand-500 hover:bg-brand-400 text-foreground font-bold text-sm h-12 px-8 rounded-[10px] cursor-pointer"
              >
                Submit Donor Inquiry
              </Button>
              <Link href="/recipient" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-white border-slate-700 hover:bg-foreground font-bold text-sm h-12 px-8 rounded-[10px] cursor-pointer"
                >
                  Talk to Our Expert
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          LIGHTBOX MODAL (Success Stories Gallery)
      ================================================================ */}
      <AnimatePresence>
        {lightbox.isOpen && lightbox.mediaList.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-md">
            <div
              className="absolute inset-0"
              onClick={() =>
                setLightbox((prev) => ({ ...prev, isOpen: false }))
              }
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-background rounded-[10px] overflow-hidden flex flex-col items-center justify-center z-10 border border-border shadow-xl"
            >
              {/* Top Title Bar */}
              <div className="absolute top-0 inset-x-0 bg-foreground/90 backdrop-blur p-4 flex justify-between items-center text-white z-20 border-b border-border">
                <div className="text-xs font-semibold">
                  {lightbox.storyTitle}
                </div>
                <button
                  onClick={() =>
                    setLightbox((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="p-1.5 rounded-lg bg-muted hover:bg-slate-700 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Media Player Area */}
              <div className="relative w-full aspect-video flex items-center justify-center p-8 bg-background mt-14">
                {lightbox.mediaList[lightbox.index].type === "image" ? (
                  <img
                    src={lightbox.mediaList[lightbox.index].url}
                    alt="Success Story Gallery"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <video
                    src={lightbox.mediaList[lightbox.index].url}
                    controls
                    autoPlay
                    className="max-h-[60vh] w-auto aspect-video object-contain bg-black rounded-lg"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
