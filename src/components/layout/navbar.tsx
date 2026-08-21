"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Menu,
  X,
  Dna,
  Snowflake,
  Shield,
  UserCheck,
  Stethoscope,
  HeartHandshake,
  Calendar,
  Phone,
  User,
  Egg,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth";
import { siteConfig } from "@/config/site.config";

const servicesList = [
  {
    title: "Sperm Banking & Storage",
    description:
      "Advanced ultra-cold cryogenic storage with 24/7 telemetry monitoring.",
    href: "/services/sperm-banking",
    icon: Shield,
  },
  {
    title: "Donor Program",
    description:
      "Rigorous 140+ parameter genetic and infectious disease screening.",
    href: "/services/sperm-donation",
    icon: UserCheck,
  },
  {
    title: "Fertility Consultation",
    description:
      "Personalized specialist guidance with leading endocrinologists.",
    href: "/services/consultation",
    icon: Stethoscope,
  },
  {
    title: "Genetic Screening",
    description: "Next-generation sequencing for 300+ hereditary conditions.",
    href: "/services/genetic-screening",
    icon: Dna,
  },
  {
    title: "Cryopreservation",
    description: "Vitrification technology ensuring 99% cell survival rate.",
    href: "/services/cryopreservation",
    icon: Snowflake,
  },
  {
    title: "IVF Support & Care",
    description:
      "Comprehensive laboratory & logistical support for IVF centers.",
    href: "/services/ivf-support",
    icon: HeartHandshake,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [donorMenuOpen, setDonorMenuOpen] = useState(false);
  const [becomeDonorMenuOpen, setBecomeDonorMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/employee")) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 bg-[#f0f6f6]",
        isScrolled ? "bg-transparent" : "bg-[#f0f6f6]",
      )}
    >
      <div className="container mx-auto pb-4  pt-10 h-20 flex items-center justify-around">
        {/* Brand Logo Driven by siteConfig */}
        <Link
          href="/"
          className="flex items-center gap-3 group shrink-0 top-20"
        >
          <Image
            src="/images/logo.webp"
            alt="Mediyaz Art Bank"
            width={320}
            height={100}
            className="h-18 w-auto object-contain transition-transform group-hover:scale-[1.2]"
            priority
          />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2 font-semibold text-sm text-foreground">
          <Link
            href="/recipient"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/recipient" &&
                "text-brand-650 font-bold bg-brand-500/10",
            )}
          >
            Aspiring Parents
          </Link>
          <Link
            href="/donor"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/donor" &&
                "text-brand-650 font-bold bg-brand-500/10",
            )}
          >
            Donors
          </Link>
          <Link
            href="/clinics"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/clinics" &&
                "text-brand-650 font-bold bg-brand-500/10",
            )}
          >
            Clinics
          </Link>
          <Link
            href="/about"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/about" &&
                "text-brand-650 font-bold bg-brand-500/10",
            )}
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/contact" &&
                "text-brand-650 font-bold bg-brand-500/10",
            )}
          >
            Contact Us
          </Link>
          <Link
            href="/blog"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/blog" &&
                "text-brand-650 font-bold bg-brand-500/10",
            )}
          >
            Blog
          </Link>
        </nav>

        {/* Top Right Action Buttons */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Link href="/recipient">
            <Button className="bg-[#ff6f61] hover:bg-[#e65c50] text-white font-bold text-xs h-9 px-5 rounded-full transition-colors cursor-pointer shadow-sm">
              Find A Donor
            </Button>
          </Link>
          <Link href="/donor/register">
            <Button className="bg-[#2f4f57] hover:bg-[#21373d] text-white font-bold text-xs h-9 px-5 rounded-full transition-colors cursor-pointer shadow-sm">
              Donor Application
            </Button>
          </Link>
          {session ? (
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold text-xs h-9 px-5 rounded-full cursor-pointer"
              >
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="bg-[#8e8e93] hover:bg-[#7a7a7f] text-white font-bold text-xs h-9 px-5 rounded-full transition-colors cursor-pointer shadow-sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b px-4 py-6 space-y-4"
          >
            <div className="flex flex-col space-y-1 font-medium text-foreground text-sm">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-muted"
              >
                Home
              </Link>
              <div className="py-1 px-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Become a Donor
                </span>
              </div>
              <Link
                href="/donor?type=sperm"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 pl-6 rounded-lg hover:bg-muted flex items-center gap-2"
              >
                <Dna className="w-4 h-4 text-blue-500" /> Sperm Donor Program
              </Link>
              <Link
                href="/donor/register?type=sperm"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 pl-8 rounded-lg hover:bg-muted flex items-center gap-2 text-xs text-muted-foreground"
              >
                <FileText className="w-3.5 h-3.5 text-teal-500" /> Sperm
                Registration Form
              </Link>
              <Link
                href="/donor?type=egg"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 pl-6 rounded-lg hover:bg-muted flex items-center gap-2"
              >
                <Egg className="w-4 h-4 text-rose-500" /> Egg Donor Program
              </Link>
              <Link
                href="/donor/register?type=egg"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 pl-8 rounded-lg hover:bg-muted flex items-center gap-2 text-xs text-muted-foreground"
              >
                <FileText className="w-3.5 h-3.5 text-pink-500" /> Egg
                Registration Form
              </Link>
              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-muted font-semibold"
              >
                Fertility Services
              </Link>
              <Link
                href="/doctors"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-muted"
              >
                Doctors
              </Link>
              <Link
                href="/clinics"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-muted"
              >
                Clinics & Hospitals
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-muted"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-muted"
              >
                Contact
              </Link>
            </div>

            <div className="pt-4 border-t flex flex-col gap-2.5">
              <Link
                href="/appointments/book"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full gap-2 font-bold bg-brand-600 hover:bg-brand-700 text-white">
                  <Calendar className="w-4 h-4" /> Book Consultation
                </Button>
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full font-bold">
                  Contact Our Team
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
