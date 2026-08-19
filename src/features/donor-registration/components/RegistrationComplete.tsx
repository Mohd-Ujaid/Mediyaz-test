/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, ArrowLeft, Download, ShieldCheck, Home } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import QRCode from "qrcode";
import Link from "next/link";
import { getRegistrationAction } from "../actions/donor-registration.actions";

interface RegistrationCompleteProps {
  id: string;
}

export function RegistrationComplete({ id }: RegistrationCompleteProps) {
  const router = useRouter();
  const [registration, setRegistration] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegistration() {
      try {
        const data = (await getRegistrationAction(id)) as any;
        if (data.success && data.registration) {
          setRegistration(data.registration);
          QRCode.toDataURL(
            `${siteConfig.url}/donor/register/${id}`,
            { width: 150, margin: 1 },
            (err, url) => {
              if (!err) setQrCodeUrl(url);
            }
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRegistration();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Generating your registration certificate...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold text-red-500">Registration Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">We couldn&apos;t retrieve this registration profile.</p>
        <Button onClick={() => router.push("/")} className="mt-4 rounded-xl text-xs">
          Return to Home
        </Button>
      </div>
    );
  }

  const reg = registration as any;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 md:p-10 shadow-lg text-center space-y-6">
        
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Registration Submitted Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your application is now securely registered at the Mediyaz ART Bank Donor Registry database.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-3 font-mono text-xs">
          <div className="flex justify-between border-b pb-1.5">
            <span className="text-slate-500">Registration ID</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{reg.registrationId}</span>
          </div>
          <div className="flex justify-between border-b pb-1.5">
            <span className="text-slate-500">Donor Program</span>
            <span className="font-bold capitalize">{reg.donorType} Donor</span>
          </div>
          <div className="flex justify-between border-b pb-1.5">
            <span className="text-slate-500">FullName</span>
            <span className="font-bold">{reg.personalInfo?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <span className="text-blue-600 font-bold">UNDER REVIEW</span>
          </div>
        </div>

        {/* Verification QR Code */}
        {qrCodeUrl && (
          <div className="flex flex-col items-center gap-2">
            <img loading="lazy" src={qrCodeUrl} alt="QR Verification" className="w-36 h-36 object-contain border rounded-xl p-2 bg-white" />
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Registry Verification Code</span>
          </div>
        )}

        {/* Security message */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-left">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed font-semibold">
            All details and documents are encrypted. Aadhaar records are locked. We will never ask you to upload Aadhaar again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
          <Link href={`/donor/register/${reg.registrationId}/print`}>
            <Button className="w-full sm:w-auto rounded-xl text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 shadow-md shadow-blue-500/10">
              <Printer className="w-4 h-4" /> Print Registration Form
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl text-xs gap-1.5 py-2.5 px-6">
              <Home className="w-4 h-4" /> Go to Home Page
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
