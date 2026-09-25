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
  Phone,
  User,
  Egg,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/auth";
import { siteConfig } from "@/config/site.config";



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
      className={cn("sticky top-0 z-50 w-full transition-all duration-300")}
    >
      <div className="absolute top-0 h-30 left-0 z-100 w-full bg-gradient-to-b from-white/20 to-white/10 to-transparent"></div>
      <div className=" absolute top-0 left-0 container mx-auto  py-15 h-20 flex items-center justify-around  ">
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
                "text-brand font-bold bg-brand-500/10",
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
          {/* {session ? (
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
          )} */}
        </div>

        {/* Mobile Hamburger Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-red-700" />
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
            className="absolute top-0 left-0 w-full bg-white lg:hidden  border-b px-4 py-6 space-y-4 pb-40  rounded-b-full"
          >
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className=" absolute top-7.5 right-16.5 lg:hidden p-2 rounded-xl text-foreground hover:bg-muted"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-black" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
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

            <div className="pt-4 border-t flex flex-col gap-2.5 justify-center items-center ">

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex justify-center items-center"
              >
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
