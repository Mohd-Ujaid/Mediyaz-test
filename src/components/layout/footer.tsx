"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck, Award, Lock, Heart, MapPin, Phone, Mail, FileCheck, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/site.config";

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/employee")) {
    return null;
  }

  return (
    <footer className="relative z-40 bg-[#112023] text-teal-100/70 pt-16 pb-12 border-t border-teal-950/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-teal-900/40">
          
          {/* Brand & Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block bg-white/5 hover:bg-white/10 p-2.5 rounded-xl transition-colors">
              <Image
                src="/images/logo.webp"
                alt="Mediyaz Art Bank"
                width={200}
                height={55}
                className="h-9 w-auto object-contain brightness-0 invert"
                priority
              />
            </Link>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed max-w-md">
              Mediyaz is a professional donor access and coordination platform. We supply cryo-preserved oocytes and semen samples to authorized fertility clinics and hospitals under strict ethical standards.
            </p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-teal-50/90">
                <MapPin className="w-4 h-4 text-[#e7ae08] shrink-0 mt-0.5" />
                <span>{siteConfig.contact.address.street}, {siteConfig.contact.address.city}, {siteConfig.contact.address.country}</span>
              </div>
              <div className="flex items-center gap-2.5 text-teal-50/90">
                <Phone className="w-4 h-4 text-[#e7ae08] shrink-0" />
                <span>{siteConfig.contact.phone} (Coordinated Desk)</span>
              </div>
              <div className="flex items-center gap-2.5 text-teal-50/90">
                <Mail className="w-4 h-4 text-[#e7ae08] shrink-0" />
                <span>{siteConfig.contact.email}</span>
              </div>
            </div>
          </div>

          {/* Clinics & Partners */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#faf9f6] uppercase tracking-wider">Clinics & Hospitals</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/recipient/find-donor" className="hover:text-white font-semibold text-[#e7ae08] transition-colors flex items-center gap-1">REQUEST A DONOR <ArrowUpRight className="w-3 h-3 text-teal-200/60" /></Link></li>
              <li><Link href="/recipient/available-donors" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Our Partner Networks</Link></li>
              <li><Link href="/clinics" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Clinical Hubs</Link></li>
              <li><Link href="/track" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Track Shipment Status</Link></li>
            </ul>
          </div>

          {/* Intended Parents */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#faf9f6] uppercase tracking-wider">Intended Parents</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/recipient/available-donors" className="hover:text-white font-semibold text-[#e7ae08] transition-colors flex items-center gap-1">FIND A DONOR <ArrowUpRight className="w-3 h-3 text-teal-200/60" /></Link></li>
              <li><Link href="/recipient/find-donor" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Submit Matching Preference</Link></li>
              <li><Link href="/recipient/available-donors" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Private Registry Lookup</Link></li>
              <li><Link href="/track" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Track Coordination Request</Link></li>
            </ul>
          </div>

          {/* Donors & Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#faf9f6] uppercase tracking-wider">Donors & Company</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/donor" className="hover:text-white font-semibold text-[#e7ae08] transition-colors flex items-center gap-1">BECOME A DONOR <ArrowUpRight className="w-3 h-3 text-teal-200/60" /></Link></li>
              <li><Link href="/donor/register" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Apply Online</Link></li>
              <li><Link href="/about" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">About Mediyaz</Link></li>
              <li><Link href="/doctors" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Physician Directory</Link></li>
              <li><Link href="/contact" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Contact Clinical Support</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-teal-200/60 gap-4">
          <div className="max-w-2xl text-center sm:text-left">
            &copy; {new Date().getFullYear()} {siteConfig.name}. Mediyaz coordinates donor access. Surgical procedures, IVF treatments, and medical diagnostics are provided independently by authorized clinical partners.
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
            <Link href="/about" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Ethical Code</Link>
            <Link href="/contact" className="hover:text-[#e7ae08] text-teal-100/80 transition-colors">Privacy Governance</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
