"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Search, 
  SlidersHorizontal, 
  Heart, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Loader2, 
  ArrowRight, 
  Dna, 
  Info, 
  X, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  UserCheck,
  History as HistoryIcon
} from "lucide-react";
import { toast } from "sonner";

interface Donor {
  _id: string;
  donorId: string;
  age: number;
  gender: string;
  bloodGroup: string;
  nationality: string;
  physicalAttributes: {
    height: number;
    weight: number;
    eyeColor: string;
    hairColor: string;
    skinTone: string;
  };
  medicalInformation: {
    eligibility: boolean;
    bloodPressure: string;
    hemoglobin: number;
  };
  contactInformation: {
    city: string;
    state: string;
    country: string;
  };
  clinic: {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  } | null;
  tags?: string[];
  updatedAt: string;
  donationStatus: string;
}

interface DonorRequest {
  _id: string;
  donor: {
    _id: string;
    donorId: string;
    age: number;
    gender: string;
    bloodGroup: string;
    physicalAttributes: {
      height: number;
      weight: number;
    };
    medicalInformation: {
      eligibility: boolean;
    };
  };
  message?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export default function AvailableDonorsPage() {
  const { data: session, isPending: isAuthPending } = useSession();
  const router = useRouter();

  // Donors State
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(true);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(60);
  const [showFilters, setShowFilters] = useState(false);

  // Modal States
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [requestDonorTarget, setRequestDonorTarget] = useState<Donor | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Basic Information Form States
  const [reqFullName, setReqFullName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqAge, setReqAge] = useState("");
  const [reqBloodGroup, setReqBloodGroup] = useState("");
  const [reqContactNumber, setReqContactNumber] = useState("");
  const [reqMedicalCondition, setReqMedicalCondition] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  // Fetch Donors
  const fetchDonors = async () => {
    setLoadingDonors(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        bloodGroup,
        ageMin: ageMin.toString(),
        ageMax: ageMax.toString(),
      });

      const res = await fetch(`/api/recipient/available-donors?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDonors(data.donors);
      } else {
        toast.error(data.error || "Failed to load available donors.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoadingDonors(false);
    }
  };

  // Initial Fetch & Search/Filter effect
  useEffect(() => {
    fetchDonors();
  }, []);

  const handleApplyFilters = () => {
    fetchDonors();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSearch("");
    setBloodGroup("");
    setTagFilter("");
    setAgeMin(18);
    setAgeMax(60);
    // Directly fetch with cleared parameters
    setTimeout(() => {
      fetchDonors();
    }, 0);
  };

  const handleOpenDetails = (donor: Donor) => {
    setSelectedDonor(donor);
    setIsDetailOpen(true);
  };

  const handleOpenRequest = (donor: Donor) => {
    setRequestDonorTarget(donor);
    const isEmp = ["ADMIN", "SUPER_ADMIN", "DOCTOR", "STAFF", "RECEPTIONIST"].includes((session?.user as any)?.role);
    setReqFullName(isEmp ? "" : session?.user?.name || "");
    setReqEmail(isEmp ? "" : session?.user?.email || "");
    setReqAge("");
    setReqBloodGroup("");
    setReqContactNumber(isEmp ? "" : (session?.user as any)?.phone || "");
    setReqMedicalCondition("");
    setRequestMessage("");
    setIsRequestOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!requestDonorTarget) return;

    if (!reqFullName.trim()) {
      toast.error("Patient name is required.");
      return;
    }
    if (!reqEmail.trim() || !reqEmail.includes("@")) {
      toast.error("A valid patient email address is required.");
      return;
    }
    if (!reqAge.trim() || isNaN(Number(reqAge)) || Number(reqAge) < 18) {
      toast.error("A valid patient age (18+) is required.");
      return;
    }
    if (!reqBloodGroup) {
      toast.error("Patient blood group is required.");
      return;
    }
    if (!reqContactNumber.trim()) {
      toast.error("Patient contact number is required.");
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/recipient/donor-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: requestDonorTarget._id,
          fullName: reqFullName,
          email: reqEmail,
          age: Number(reqAge),
          bloodGroup: reqBloodGroup,
          contactNumber: reqContactNumber,
          medicalCondition: reqMedicalCondition,
          message: requestMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Donor request submitted successfully!");
        setIsRequestOpen(false);
        setIsDetailOpen(false);
        setRequestDonorTarget(null);
      } else {
        toast.error(data.error || "Request submission failed.");
      }
    } catch {
      toast.error("Network error. Please try again later.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (isAuthPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Filter clientside by tag Filter
  const filteredDonors = donors.filter(d => {
    if (tagFilter && (!d.tags || !d.tags.includes(tagFilter))) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      
      {/* Header Banner */}
      <section className="py-12 bg-gradient-to-br from-teal-500/10 via-white to-slate-50 dark:from-teal-950/20 dark:via-slate-950 dark:to-slate-900 border-b border-slate-200/50 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Available Sperm Donors
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Browse our de-identified registry of active, compliant sperm donors. All profiles are rigorously pre-screened for clinical compliance. You can securely search physical attributes, blood groups, sample preservation state, and request allocation reviews.
          </p>

          <div className="inline-flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 max-w-3xl leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold uppercase tracking-wide">Regulatory Privacy Notice:</strong> In compliance with medical privacy standards, donor names, phone numbers, email addresses, exact dates of birth, and identity cards are completely shielded. All profiles display anonymous donor IDs only.
            </div>
          </div>
        </div>
      </section>

      {/* Main Panel Content */}
      <section className="container mx-auto px-4 max-w-5xl py-8">
        <div className="space-y-6">
          {/* Search & Filter Layout */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search by Donor ID or nationality..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchDonors()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <Button 
                onClick={() => setShowFilters(!showFilters)} 
                variant="outline" 
                className="rounded-xl border-slate-200 text-xs gap-1.5 h-10 px-4 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </Button>
              <Button 
                onClick={fetchDonors} 
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs px-5 h-10 cursor-pointer"
              >
                Search
              </Button>
            </div>

            {/* Expanded Filters Drawer panel */}
            {showFilters && (
              <Card className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Blood Group filter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Blood Group</Label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      <option value="">All Groups</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sample State filter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sample State</Label>
                    <select
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      <option value="">All Sample States</option>
                      <option value="Fresh">Fresh</option>
                      <option value="Frozen">Frozen</option>
                    </select>
                  </div>

                  {/* Age Range Filter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Age Range: {ageMin} - {ageMax}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={18}
                        max={60}
                        value={ageMin}
                        onChange={(e) => setAgeMin(Number(e.target.value))}
                        className="w-1/2 text-center"
                      />
                      <Input
                        type="number"
                        min={18}
                        max={60}
                        value={ageMax}
                        onChange={(e) => setAgeMax(Number(e.target.value))}
                        className="w-1/2 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
                  <Button variant="outline" size="sm" onClick={handleClearFilters} className="rounded-lg text-xs">
                    Clear Filters
                  </Button>
                  <Button size="sm" onClick={handleApplyFilters} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs">
                    Apply Filters
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Donor Directory Grid */}
          {loadingDonors ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  </div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
                </Card>
              ))}
            </div>
          ) : filteredDonors.length === 0 ? (
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  No donors currently match your criteria
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Try adjusting your filters, clearing your search query, or contact our support desk for personalized matching assistance.
                </CardDescription>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={handleClearFilters} className="rounded-lg text-xs">
                  Clear Filters
                </Button>
                <a href="mailto:support@mediyaz.org">
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs">
                    Contact Clinic
                  </Button>
                </a>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDonors.map((donor) => (
                <Card key={donor._id} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between">
                  <div>
                    <CardHeader className="p-5 pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 mb-2">
                            Sperm Donor
                          </span>
                          {donor.tags && donor.tags.map((tag) => (
                            <span key={tag} className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 mb-2 ml-1">
                              {tag}
                            </span>
                          ))}
                          <CardTitle className="text-sm font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5">
                            <Dna className="w-4.5 h-4.5 text-teal-600" /> {donor.donorId}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3.5 text-xs">
                      <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Blood Group</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{donor.bloodGroup}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Age</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{donor.age} Years</div>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-5 pt-0">
                    <Button 
                      onClick={() => handleOpenDetails(donor)} 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs py-2 h-9 cursor-pointer"
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL 1: DONOR DETAILS */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl rounded-2xl bg-white dark:bg-slate-950 border dark:border-slate-900 max-h-[90vh] overflow-y-auto p-6 space-y-4">
          {selectedDonor && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 mb-2">
                      Sperm Donor
                    </span>
                    {selectedDonor.tags && selectedDonor.tags.map((tag) => (
                      <span key={tag} className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 mb-2 ml-1">
                        {tag}
                      </span>
                    ))}
                    <DialogTitle className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5">
                      <Dna className="w-5.5 h-5.5 text-teal-600" /> {selectedDonor.donorId}
                    </DialogTitle>
                  </div>
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Private, anonymous cryobank registration profile details.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 text-xs py-2">
                {/* 1. Basic Information */}
                <div className="space-y-2 pb-2">
                  <h4 className="font-bold text-slate-950 dark:text-white flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-teal-600" /> Basic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Age</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{selectedDonor.age} Years</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Gender</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{selectedDonor.gender}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Blood Group</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{selectedDonor.bloodGroup}</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Nationality</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{selectedDonor.nationality}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="p-2 border dark:border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400">Height</div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">{selectedDonor.physicalAttributes.height} cm</div>
                    </div>
                    <div className="p-2 border dark:border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400">Weight</div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">{selectedDonor.physicalAttributes.weight} kg</div>
                    </div>
                    <div className="p-2 border dark:border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400">Skin Tone</div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">{selectedDonor.physicalAttributes.skinTone}</div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  onClick={() => handleOpenRequest(selectedDonor)} 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs py-2.5 cursor-pointer font-bold"
                >
                  Request Donor Profile Allocation
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: REQUEST CONFIRMATION */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-slate-950 border dark:border-slate-900 p-6 space-y-4">
          {requestDonorTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-5 h-5 text-teal-600" /> Confirm Donor Request
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Please provide the patient basic details to request allocation review for Donor ID: <span className="font-mono font-bold text-teal-600">{requestDonorTarget.donorId}</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                
                {/* Patient Information Form */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="req-fullName" className="font-bold text-slate-700 dark:text-slate-300">
                      Patient Full Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="req-fullName"
                      placeholder="e.g. Jane Doe"
                      value={reqFullName}
                      onChange={(e) => setReqFullName(e.target.value)}
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="req-age" className="font-bold text-slate-700 dark:text-slate-300">
                      Patient Age <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="req-age"
                      type="number"
                      min={18}
                      max={80}
                      placeholder="e.g. 30"
                      value={reqAge}
                      onChange={(e) => setReqAge(e.target.value)}
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="req-email" className="font-bold text-slate-700 dark:text-slate-300">
                    Patient Email Address <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="req-email"
                    type="email"
                    placeholder="e.g. patient@example.com"
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    className="rounded-xl h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="req-bloodGroup" className="font-bold text-slate-700 dark:text-slate-300">
                      Patient Blood Group <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="req-bloodGroup"
                      value={reqBloodGroup}
                      onChange={(e) => setReqBloodGroup(e.target.value)}
                      className="w-full h-9 px-3 border dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none"
                    >
                      <option value="">Select Blood Group</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="req-contactNumber" className="font-bold text-slate-700 dark:text-slate-300">
                      Patient Contact Number <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="req-contactNumber"
                      placeholder="e.g. 9876543210"
                      value={reqContactNumber}
                      onChange={(e) => setReqContactNumber(e.target.value)}
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="req-medicalCondition" className="font-bold text-slate-700 dark:text-slate-300">
                    Medical Condition / Diagnosis (Optional)
                  </Label>
                  <textarea
                    id="req-medicalCondition"
                    rows={2}
                    placeholder="Brief details about recipient medical history or matching requirement..."
                    value={reqMedicalCondition}
                    onChange={(e) => setReqMedicalCondition(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-xs bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="req-message" className="font-bold text-slate-700 dark:text-slate-300">
                    Additional Message / Notes (Optional)
                  </Label>
                  <textarea
                    id="req-message"
                    rows={2}
                    placeholder="Log preferred treatment date, matching guidelines, or coordinator notes..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-xs bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 leading-normal">
                  Note: Submission of a matching request does not guarantee donor allocation. The clinical registry team will verify compatibility matches before final approval.
                </div>
              </div>

              <DialogFooter>
                <div className="flex gap-2.5 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRequestOpen(false)} 
                    className="w-1/2 rounded-xl text-xs cursor-pointer"
                    disabled={submittingRequest}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitRequest} 
                    className="w-1/2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs cursor-pointer font-bold gap-1"
                    disabled={submittingRequest}
                  >
                    {submittingRequest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
