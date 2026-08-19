"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck, Award, Lock, Heart, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site.config";

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/employee")) {
    return null;
  }

  return (
    <footer className="bg-background text-muted-foreground pt-16 pb-12 border-t">
      <div className="container mx-auto px-4">
        
        {/* Accreditation Badges Banner Driven by siteConfig */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 sm:p-8 rounded-3xl bg-muted/30 border mb-16">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">CAP & CLIA Accredited</h4>
              <p className="text-xs text-muted-foreground">Highest clinical laboratory standards</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">100% Privacy Guarantee</h4>
              <p className="text-xs text-muted-foreground">256-bit encrypted health data</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">FDA Registered Facility</h4>
              <p className="text-xs text-muted-foreground">Federal cell & tissue governance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">Cell Viability 99%</h4>
              <p className="text-xs text-muted-foreground">-196°C Vapor phase nitrogen storage</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b">
          
          {/* Brand & Address */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.webp"
                alt="Mediyaz Art Bank"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              {siteConfig.description}
            </p>
            <div className="flex items-center gap-3 pt-2 text-muted-foreground text-xs">
              <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              <span>{siteConfig.contact.address.city}, {siteConfig.contact.address.state} • {siteConfig.contact.address.country}</span>
            </div>
          </div>

          {/* Programs & Patients */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Donor Programs</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/donor" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Donor Programs Overview</Link></li>
              <li><Link href="/donor?type=sperm" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Sperm Donor Program</Link></li>
              <li><Link href="/donor?type=egg" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Egg Donor Program</Link></li>
              <li><Link href="/donor/query" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Submit Donor Inquiry</Link></li>
              <li><Link href="/donor/register" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Complete Registration</Link></li>
              <li><Link href="/recipient" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Find a Donor (Intended Parents)</Link></li>
              <li><Link href="/track" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Track Pre-Screening Status</Link></li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Clinical Services</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/services" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Fertility Services</Link></li>
              <li><Link href="/doctors" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Our Specialists</Link></li>
              <li><Link href="/clinics" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Clinics & Hospitals</Link></li>
              <li><Link href="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Research & Blog</Link></li>
              <li><Link href="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact & Support</Link></li>
              <li><Link href="/admin" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Staff Console</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <div>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</Link>
            <Link href="/hipaa" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">HIPAA Compliance</Link>
            <Link href="/security" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Security Disclosure</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
