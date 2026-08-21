"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Heart, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Clock, 
  Send, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Chandigarh", "Puducherry"
];

const STATE_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool", "Rajahmundry", "Other"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat", "Other"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur", "Nagaon", "Other"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Other"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Jagdalpur", "Other"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Other"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Other"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Other"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Hamirpur", "Other"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Hazaribagh", "Other"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Davangere", "Ballari", "Kalaburagi", "Other"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Other"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Ratlam", "Other"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Navi Mumbai", "Kolhapur", "Other"],
  "Manipur": ["Imphal", "Churachandpur", "Thoubal", "Other"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Other"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Other"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Other"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri", "Balasore", "Other"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Other"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Other"],
  "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Other"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Other"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Other"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Other"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Prayagraj", "Noida", "Other"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Durgapur", "Other"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Vasant Kunj", "Karol Bagh", "Connaught Place", "Other"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Other"],
  "Chandigarh": ["Chandigarh", "Other"],
  "Puducherry": ["Puducherry", "Karaikal", "Other"]
};

function calculateAge(dob: string): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function DonorQueryForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    emailAddress: "",
    gender: "Male",
    dateOfBirth: "",
    age: "",
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customCity, setCustomCity] = useState(() => {
    const val = form.city || "";
    const stateVal = form.state || "";
    return stateVal !== "" && val !== "" && !(STATE_CITIES[stateVal] || []).includes(val);
  });

  const validate = (): boolean => {
    const tempErrors: Record<string, string> = {};
    
    if (!form.fullName.trim()) {
      tempErrors.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 3) {
      tempErrors.fullName = "Name must be at least 3 characters";
    }

    if (!form.mobileNumber) {
      tempErrors.mobileNumber = "Mobile number is required";
    } else if (form.mobileNumber.length !== 10) {
      tempErrors.mobileNumber = "Mobile number must be exactly 10 digits";
    }

    if (!form.emailAddress) {
      tempErrors.emailAddress = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(form.emailAddress)) {
      tempErrors.emailAddress = "Invalid email format";
    }

    if (!form.dateOfBirth) {
      tempErrors.dateOfBirth = "Date of birth is required";
    } else {
      const ageNum = Number(form.age);
      if (isNaN(ageNum) || ageNum < 18) {
        tempErrors.dateOfBirth = "Candidates must be at least 18 years old";
      } else if (ageNum > 50) {
        tempErrors.dateOfBirth = "Candidates must be under 50 years old";
      }
    }

    if (!form.city.trim()) {
      tempErrors.city = "City is required";
    }

    if (!form.consent) {
      tempErrors.consent = "Consent check is required to process";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleDOBChange = (dob: string) => {
    const calculated = calculateAge(dob);
    setForm((prev) => ({
      ...prev,
      dateOfBirth: dob,
      age: calculated !== undefined ? String(calculated) : "",
    }));
    // Clear dob error if it was set
    if (errors.dateOfBirth) {
      setErrors(prev => ({ ...prev, dateOfBirth: "" }));
    }
  };

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please resolve validation errors before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/donor-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: form.age ? Number(form.age) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
      } else {
        toast.error(data.error || "Inquiry submission failed. Please try again.");
      }
    } catch (error) {
      toast.error("Network error during submission. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setForm({
      fullName: "",
      mobileNumber: "",
      emailAddress: "",
      gender: "Male",
      dateOfBirth: "",
      age: "",
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
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full space-y-8">
        
        {/* Portal Branding */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-full bg-teal-500/10 text-teal-600 mb-3 animate-pulse">
            <Heart className="w-8 h-8 fill-teal-600/10" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Donor Pre-Registration Portal
          </h2>
          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
            Take the first step to becoming a donor. Submit your initial query and our clinical team will schedule a medical consultation.
          </p>
        </div>

        {/* Query Card */}
        <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-5">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
              Submit Donor Inquiry
            </CardTitle>
            <CardDescription className="text-[11px]">
              All details will remain strictly confidential under clinical privacy regulations.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Interest Section (Radio Button Styles) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  I want to apply as an: <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Sperm Radio Box */}
                  <label className={`py-3 px-4 rounded-[10px] text-xs font-bold border transition-all flex items-center gap-3 cursor-pointer ${
                    form.donationInterest === "sperm"
                      ? "bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-400"
                      : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}>
                    <input
                      type="radio"
                      name="donationInterest"
                      value="sperm"
                      checked={form.donationInterest === "sperm"}
                      onChange={() => handleChange("donationInterest", "sperm")}
                      className="w-3.5 h-3.5 text-teal-600 focus:ring-teal-500 border-slate-300 rounded-full"
                    />
                    <span>Sperm Donor</span>
                  </label>

                  {/* Egg Radio Box */}
                  <label className={`py-3 px-4 rounded-[10px] text-xs font-bold border transition-all flex items-center gap-3 cursor-pointer ${
                    form.donationInterest === "egg"
                      ? "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400"
                      : "border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}>
                    <input
                      type="radio"
                      name="donationInterest"
                      value="egg"
                      checked={form.donationInterest === "egg"}
                      onChange={() => handleChange("donationInterest", "egg")}
                      className="w-3.5 h-3.5 text-rose-500 focus:ring-rose-500 border-slate-300 rounded-full"
                    />
                    <span>Egg Donor</span>
                  </label>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Personal Information
                </h4>
                
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      className={`pl-10 rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950 ${
                        errors.fullName ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mobile Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="10-digit number"
                        type="tel"
                        value={form.mobileNumber}
                        onChange={(e) => handleChange("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={`pl-10 rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950 ${
                          errors.mobileNumber ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.mobileNumber && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.mobileNumber}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        value={form.emailAddress}
                        onChange={(e) => handleChange("emailAddress", e.target.value)}
                        className={`pl-10 rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950 ${
                          errors.emailAddress ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.emailAddress && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.emailAddress}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Gender */}
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender <span className="text-red-500">*</span></label>
                    <select
                      value={form.gender}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => handleDOBChange(e.target.value)}
                        className={`pl-10 rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950 ${
                          errors.dateOfBirth ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.dateOfBirth}</p>
                    )}
                  </div>
                </div>

                {form.age && !errors.dateOfBirth && (
                  <div className="text-[10px] text-slate-505 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-500/10 p-2.5 rounded-md">
                    Calculated Age: <span className="font-bold text-teal-600 dark:text-teal-400">{form.age} years old</span> (Donor eligibility standard is 18 - 50 years).
                  </div>
                )}
              </div>

              {/* Physical Attributes */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Physical Characteristics
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Height (cm)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 175"
                      value={form.height}
                      onChange={(e) => handleChange("height", e.target.value)}
                      className="rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weight (kg)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 70"
                      value={form.weight}
                      onChange={(e) => handleChange("weight", e.target.value)}
                      className="rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hair Color</label>
                    <select
                      value={form.hairColor}
                      onChange={(e) => handleChange("hairColor", e.target.value)}
                      className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Black">Black</option>
                      <option value="Brown">Brown</option>
                      <option value="Blonde">Blonde</option>
                      <option value="Auburn">Auburn</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Eye Color</label>
                    <select
                      value={form.eyeColor}
                      onChange={(e) => handleChange("eyeColor", e.target.value)}
                      className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Skin Tone</label>
                    <select
                      value={form.skinTone}
                      onChange={(e) => handleChange("skinTone", e.target.value)}
                      className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Fair">Fair</option>
                      <option value="Medium">Medium</option>
                      <option value="Olive">Olive</option>
                      <option value="Dark">Dark</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Location Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">City <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      <select
                        value={customCity ? "Other" : (form.city || "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Other") {
                            setCustomCity(true);
                            handleChange("city", "");
                          } else {
                            setCustomCity(false);
                            handleChange("city", val);
                          }
                        }}
                        className={`pl-10 w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          errors.city ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                      >
                        <option value="">Select City</option>
                        {(STATE_CITIES[form.state] || []).filter(c => c !== "Other").map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {customCity && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Input
                          placeholder="Enter Custom City Name"
                          value={form.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          className={`pl-10 rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950 ${
                            errors.city ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                      </div>
                    )}
                    {errors.city && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.city}</p>
                    )}
                  </div>

                  {/* State */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">State <span className="text-red-500">*</span></label>
                    <select
                      value={form.state}
                      onChange={(e) => {
                        handleChange("state", e.target.value);
                        handleChange("city", "");
                        setCustomCity(false);
                      }}
                      className="w-full h-9 px-3 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Preferences & Message
                </h4>
                
                {/* Contact Time */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Preferred Contact Time <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <select
                      value={form.preferredContactTime}
                      onChange={(e) => handleChange("preferredContactTime", e.target.value)}
                      className="w-full h-9 pl-10 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option>Morning (9 AM - 12 PM)</option>
                      <option>Afternoon (12 PM - 4 PM)</option>
                      <option>Evening (4 PM - 8 PM)</option>
                      <option>Anytime</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message / Infertility History / Questions <span className="text-[10px] text-slate-400">(Optional)</span></label>
                  <textarea
                    placeholder="Briefly state any messages or questions you have for the medical team..."
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className="w-full min-h-[80px] p-2.5 rounded-[10px] text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-[10px] border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="consent"
                  checked={form.consent}
                  onChange={(e) => handleChange("consent", e.target.checked)}
                  className="mt-1 rounded border-slate-200 dark:border-slate-800 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <div className="space-y-0.5">
                  <label htmlFor="consent" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    I agree to be contacted regarding donor registration.
                  </label>
                  {errors.consent && (
                    <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> {errors.consent}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    By submitting this, you verify that you are interested in donor applications and permit clinic coordinators to call/email.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-[10px] h-10 text-xs font-bold text-slate-950 bg-teal-500 hover:bg-teal-400 shadow-md shadow-teal-500/20 gap-1.5 flex items-center justify-center cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Inquiry...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Inquiry <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security / Privacy compliance */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Secure HIPAA compliant data storage and transmission.
        </div>
        
      </div>

      {/* Success Dialog overlay */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Inquiry Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-xs">
              Thank you for your interest in becoming a donor with Mediyaz Fertility Clinic.
            </DialogDescription>
          </DialogHeader>
          <p className="text-[11px] text-slate-500">
            Our clinical team has received your query and will contact you within 24-48 business hours to discuss medical screening and schedule a consultation.
          </p>
          <Button
            onClick={closeSuccess}
            className="w-full rounded-[10px] text-xs h-9 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Return to Homepage
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}
