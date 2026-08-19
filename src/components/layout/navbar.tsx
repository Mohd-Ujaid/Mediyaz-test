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
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b shadow-sm"
          : "bg-background border-b border-transparent",
      )}
    >
      {/* Top Notice Bar */}
      <div className="bg-foreground text-background text-[11px] py-1.5 px-4 font-medium hidden sm:block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
            <span>
              CAP & CLIA Accredited Laboratory • FDA Registered Facility
            </span>
          </div>
          <div className="flex items-center gap-6 text-muted">
            <a
              href={`tel:${siteConfig.contact.phone}`}
              className="hover:text-brand-300 transition-colors flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-brand-400" />{" "}
              {siteConfig.contact.phone}
            </a>
            <Link
              href="/contact"
              className="hover:text-brand-300 transition-colors"
            >
              Global Support Desk
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand Logo Driven by siteConfig */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <Image
            src="/images/logo.webp"
            alt="Mediyaz Art Bank"
            width={160}
            height={48}
            className="h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            priority
          />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2 font-medium text-sm text-foreground">
          <Link
            href="/"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/" &&
                "text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10",
            )}
          >
            Home
          </Link>{" "}
          {/* Become a Donor Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setBecomeDonorMenuOpen(true)}
            onMouseLeave={() => setBecomeDonorMenuOpen(false)}
          >
            <Link
              href="/donor"
              className={cn(
                "px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 hover:bg-muted",
                becomeDonorMenuOpen &&
                  "text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10",
              )}
            >
              Become a Donor{" "}
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  becomeDonorMenuOpen && "rotate-180",
                )}
              />
            </Link>

            <AnimatePresence>
              {becomeDonorMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full pt-2 w-[280px] z-50"
                >
                  <div className="bg-background rounded-2xl shadow-2xl border p-3 space-y-1">
                    <Link
                      href="/donor?type=sperm"
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Dna className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Sperm Donor Program
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Explore sperm donation options & parameters
                        </div>
                      </div>
                    </Link>
                    <Link
                      href="/donor?type=egg"
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <Dna className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          Egg Donor Program
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Explore oocyte donation & procedures
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div
            className="relative"
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
          >
            <Link
              href="/services"
              className={cn(
                "px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 hover:bg-muted",
                pathname.startsWith("/services") &&
                  "text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10",
              )}
            >
              Fertility Services{" "}
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  megaMenuOpen && "rotate-180",
                )}
              />
            </Link>

            <AnimatePresence>
              {megaMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full pt-2 w-[600px] z-50"
                >
                  <div className="bg-background rounded-2xl shadow-2xl border p-5 grid grid-cols-2 gap-3">
                    {servicesList.map((service, idx) => (
                      <Link
                        key={idx}
                        href={service.href}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          <service.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {service.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                            {service.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link
            href="/doctors"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname.startsWith("/doctors") &&
                "text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10",
            )}
          >
            Doctors
          </Link>
          <Link
            href="/clinics"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname.startsWith("/clinics") &&
                "text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10",
            )}
          >
            Clinics & Hospitals
          </Link>
          <Link
            href="/about"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/about" &&
                "text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10",
            )}
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className={cn(
              "px-3.5 py-2 rounded-xl transition-colors hover:bg-muted",
              pathname === "/contact" &&
                "text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10",
            )}
          >
            Contact
          </Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/appointments/book">
            <Button
              variant="secondary"
              className="gap-1.5 shadow-md hover:shadow-lg font-bold"
            >
              <Calendar className="w-3.5 h-3.5" /> Book Consultation
            </Button>
          </Link>
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
                href="/donor?type=egg"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 pl-6 rounded-lg hover:bg-muted flex items-center gap-2"
              >
                <Egg className="w-4 h-4 text-rose-500" /> Egg Donor Program
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
