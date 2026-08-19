"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Clock, 
  FileText, 
  ShieldCheck, 
  HelpCircle,
  Activity,
  User,
  Heart,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

function TrackingPageContent() {
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id") || "";

  const [queryId, setQueryId] = useState(urlId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [type, setType] = useState<"booking" | "donation" | "registration" | null>(null);

  useEffect(() => {
    if (urlId) {
      handleSearch(urlId);
    }
  }, [urlId]);

  async function handleSearch(targetId: string) {
    if (!targetId || !targetId.trim()) {
      toast.error("Please enter a valid Reference ID.");
      return;
    }

    const cleanId = targetId.trim();
    setLoading(true);
    setResult(null);
    setType(null);

    try {
      if (cleanId.startsWith("BK-") || cleanId.startsWith("CN-")) {
        const res = await fetch(`/api/bookings?referenceId=${cleanId}`);
        const data = await res.json();
        if (data.success) {
          setResult(data.booking || data.consultation);
          setType("booking");
        } else {
          toast.error(data.error || "No booking record found for this ID.");
        }
      } else if (cleanId.startsWith("DN-")) {
        const res = await fetch(`/api/donations?referenceId=${cleanId}`);
        const data = await res.json();
        if (data.success) {
          setResult(data.donation);
          setType("donation");
        } else {
          toast.error(data.error || "No donation record found for this ID.");
        }
      } else if (cleanId.startsWith("MED-ED-") || cleanId.startsWith("MED-SD-")) {
        const res = await fetch(`/api/donor-registration?registrationId=${cleanId}`);
        const data = await res.json();
        if (data.success && data.registration) {
          setResult(data.registration);
          setType("registration");
        } else {
          toast.error(data.error || "No registration profile found for this ID.");
        }
      } else {
        toast.error("Reference ID must start with 'CN-'/'BK-' (Booking), 'DN-' (Donation), or 'MED-ED-'/'MED-SD-' (Donor Registry).");
      }
    } catch (err) {
      toast.error("Error querying tracking logs.");
    } finally {
      setLoading(false);
    }
  }

  // Get status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
      case "DRAFT":
      case "SUBMITTED":
      case "UNDER_REVIEW":
      case "NEW":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "APPROVED":
      case "VERIFIED":
      case "COMPLETED":
      case "CONTACTED":
      case "SCHEDULED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "REJECTED":
      case "CANCELLED":
      case "SUSPENDED":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-xl space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Public Submission Tracking</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Check the real-time status of your laboratory booking, altruistic donation, or donor registry application.
          </p>
        </div>

        {/* Search Panel */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-md">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(queryId); }} 
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input 
                placeholder="Enter Reference ID (CN-..., DN-..., MED-...)" 
                className="pl-9 text-xs h-10 rounded-xl"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-5"
              disabled={loading}
            >
              {loading ? "Searching..." : "Track"}
            </Button>
          </form>
        </Card>

        {/* Results display */}
        {result && type && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-lg">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 p-5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {type === "booking" ? "Consultation Booking" : type === "donation" ? "Altruistic Donation" : "Donor Registry Profile"}
                    </span>
                    <CardTitle className="text-lg font-bold tracking-wider mt-0.5">{result.referenceId || result.registrationId}</CardTitle>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4 text-xs">
                
                {/* 1. If Booking */}
                {type === "booking" && (
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center text-blue-600 dark:text-blue-400 font-bold border-b pb-1">
                      <Activity className="w-4 h-4" /> Consultation Details
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Consultation Topic</div>
                        <div className="font-semibold">{result.medicalInfo?.preferredTreatment || result.appointmentDetails?.consultationType || "General Consultation"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Patient Name</div>
                        <div className="font-semibold">{result.personalDetails?.fullName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Schedule Date</div>
                        <div className="font-semibold">{result.appointmentDetails?.preferredDate ? new Date(result.appointmentDetails.preferredDate).toLocaleDateString() : "TBD"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Schedule Time</div>
                        <div className="font-semibold">{result.appointmentDetails?.preferredTime || "TBD"}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. If Donation */}
                {type === "donation" && (
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center text-rose-500 font-bold border-b pb-1">
                      <Heart className="w-4 h-4 fill-rose-500" /> Donation Details
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Contributor</div>
                        <div className="font-semibold">{result.anonymous ? "Anonymous Donor" : result.donorDetails?.fullName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Purpose/Fund</div>
                        <div className="font-semibold">{result.purpose}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Contributed Amount</div>
                        <div className="font-bold text-rose-600">₹{result.amount?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Payment Method</div>
                        <div className="font-semibold">{result.paymentInfo?.method}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. If Donor Registry Profile */}
                {type === "registration" && (
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center text-teal-600 dark:text-teal-400 font-bold border-b pb-1">
                      <User className="w-4 h-4" /> Application Details
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Donor Program</div>
                        <div className="font-semibold capitalize">{result.donorType} Donor</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Applicant Name</div>
                        <div className="font-semibold">{result.personalInfo?.fullName || "Altruistic Donor"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Blood Group</div>
                        <div className="font-semibold">{result.personalInfo?.bloodGroup || "TBD"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Application Date</div>
                        <div className="font-semibold">{new Date(result.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Common Admin Notes & Pipeline status */}
                <div className="border-t pt-4 space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
                  <div className="flex gap-2 items-center text-slate-600 dark:text-slate-300 font-bold">
                    <Clock className="w-4 h-4 text-slate-400" /> Administrative Updates
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    {result.adminNotes || "No comments have been posted yet. Verification in progress."}
                  </p>
                  <div className="text-[9px] text-slate-400">Last updated: {new Date(result.updatedAt).toLocaleString()}</div>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <p className="text-sm font-semibold">Loading tracker...</p>
      </div>
    }>
      <TrackingPageContent />
    </Suspense>
  );
}
