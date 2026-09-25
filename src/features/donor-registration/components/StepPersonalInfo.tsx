/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useDonorFormStore } from "../store";
import { Loader2, Search, Gift } from "lucide-react";
import { useSearchParams } from "next/navigation";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const MARITAL_STATUSES = ["Married", "Divorced", "Widowed"] as const;
const GENDERS = ["Male", "Female", "Other"] as const;

const COUNTRIES = ["India", "United States", "United Kingdom", "United Arab Emirates", "Canada", "Australia", "Singapore", "Other"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Chandigarh", "Puducherry", "Other"
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

const REFERRAL_SOURCES = [
  "Website",
  "Google Search",
  "Facebook",
  "Instagram",
  "WhatsApp",
  "Advertisement",
  "Walk-in",
  "Agent / Referral Partner",
  "Existing Patient",
  "Existing Donor",
  "Friend / Family",
  "Doctor / Clinic",
  "Staff Member",
  "Other"
] as const;

function calculateAge(dob: string): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function StepPersonalInfo({ errors, donorType: propDonorType }: { errors?: Record<string, string>; donorType?: "sperm" | "egg"; }) {
  const searchParams = useSearchParams();
  const isPrefilled = searchParams.get("prefilled") === "true";
  const store = useDonorFormStore();
  const { personalInfo, updatePersonalInfo, contactInfo, updateContactInfo, referral, updateReferral, assignedHospital, setAssignedHospital, donorType } = store;
  const [searchQuery, setSearchQuery] = useState("");
  const [customCountry, setCustomCountry] = useState(() => {
    const val = contactInfo.country || "India";
    return val !== "India" && !COUNTRIES.includes(val);
  });
  const [customState, setCustomState] = useState(() => {
    const val = contactInfo.state || "";
    return contactInfo.country === "India" && val !== "" && !INDIAN_STATES.includes(val);
  });
  const [customCity, setCustomCity] = useState(() => {
    const val = contactInfo.city || "";
    const stateVal = contactInfo.state || "";
    return contactInfo.country === "India" && stateVal !== "" && val !== "" && !(STATE_CITIES[stateVal] || []).includes(val);
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    async function fetchHospitals() {
      try {
        const res = await fetch("/api/hospitals");
        const data = await res.json();
        if (data.success) {
          setHospitals(data.hospitals.filter((h: any) => h.status === "ACTIVE"));
        }
      } catch (err) {
        console.error("Failed to load clinics", err);
      }
    }
    fetchHospitals();
  }, []);

  const handleDOBChange = (value: string) => {
    const age = calculateAge(value);
    updatePersonalInfo({ dateOfBirth: value, age });
  };

  const effectiveDonorType = propDonorType || donorType;
  const filteredReferralSources = effectiveDonorType === "egg"
    ? REFERRAL_SOURCES
    : REFERRAL_SOURCES.filter((src) => src !== "Agent / Referral Partner");

  useEffect(() => {
    if (effectiveDonorType !== "egg" && referral?.sourceReferralType === "Agent / Referral Partner") {
      updateReferral({ sourceReferralType: "Website" as any });
      store.setAgentCode("");
    }
  }, [effectiveDonorType, referral?.sourceReferralType]);

  useEffect(() => {
    if (!MARITAL_STATUSES.includes(personalInfo.maritalStatus as any)) {
      updatePersonalInfo({ maritalStatus: "Married" });
    }
  }, [personalInfo.maritalStatus]);

  const handleSourceChange = (source: string) => {
    if (effectiveDonorType !== "egg" && source === "Agent / Referral Partner") {
      source = "Website";
    }
    if (source !== "Agent / Referral Partner") {
      store.setAgentCode("");
    }
    // Reset specific referral fields first
    updateReferral({
      sourceReferralType: source as any,
      referrerName: "",
      patientOrDonorId: "",
      mobileNumber: "",
      relationship: "",
      clinicName: "",
      department: "",
      employeeId: "",
      otherSourceDetails: "",
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleReferrerSearch = async (query: string, searchType: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/referrals/search?type=${searchType}&query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const selectReferrer = (item: any, type: string) => {
    if (type === "patient") {
      updateReferral({
        referrerName: item.name,
        patientOrDonorId: item.id,
        mobileNumber: item.mobile,
      });
    } else if (type === "donor") {
      updateReferral({
        referrerName: item.name,
        patientOrDonorId: item.id,
        mobileNumber: item.mobile,
      });
    } else if (type === "doctor") {
      updateReferral({
        referrerName: item.name,
        patientOrDonorId: item.id,
        clinicName: item.clinicName || "Private Clinic",
        mobileNumber: item.mobile || "",
      });
    } else if (type === "staff") {
      updateReferral({
        referrerName: item.name,
        patientOrDonorId: item.id,
        employeeId: item.id,
        department: item.department || "Clinical",
      });
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const currentSource = referral?.sourceReferralType || "Website";

  const getFieldClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-955 text-xs focus-visible:ring-teal-500", isFieldPrefilled = false) => {
    const hasError = errors?.[`personalInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 ring-1 ring-red-500/20`;
    }
    if (isFieldPrefilled) {
      return `${baseStyle} border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800`;
  };

  const getSelectClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-955 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500", isFieldPrefilled = false) => {
    const hasError = errors?.[`personalInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    if (isFieldPrefilled) {
      return `${baseStyle} border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800`;
  };

  const getContactFieldClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-955 text-xs focus-visible:ring-teal-500") => {
    const hasError = errors?.[`contactInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800`;
  };

  const getContactSelectClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-955 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500") => {
    const hasError = errors?.[`contactInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800`;
  };

  const renderError = (fieldKey: string) => {
    const errorMsg = errors?.[`personalInfo.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  const renderContactError = (fieldKey: string) => {
    const errorMsg = errors?.[`contactInfo.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
        <p className="text-xs text-slate-500 mt-1">Please fill in your personal details accurately as per government-issued ID.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Full Name <span className="text-red-500">*</span></span>
            {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled from Inquiry</span>}
          </label>
          <Input 
            placeholder="Enter full name" 
            value={personalInfo.fullName} 
            onChange={(e) => updatePersonalInfo({ fullName: e.target.value })} 
            className={getFieldClassName("fullName", undefined, isPrefilled)} 
          />
          {renderError("fullName")}
        </div>

        {/* Father Name */}
        {/* <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Father&apos;s Name <span className="text-red-500">*</span></label>
          <Input placeholder="Enter father's name" value={personalInfo.fatherName} onChange={(e) => updatePersonalInfo({ fatherName: e.target.value })} className={getFieldClassName("fatherName")} />
          {renderError("fatherName")}
        </div> */}

        {/* Mother Name */}
        {/* <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mother&apos;s Name <span className="text-red-500">*</span></label>
          <Input placeholder="Enter mother's name" value={personalInfo.motherName} onChange={(e) => updatePersonalInfo({ motherName: e.target.value })} className={getFieldClassName("motherName")} />
          {renderError("motherName")}
        </div> */}

        {/* Gender */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Gender <span className="text-red-500">*</span></span>
            {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled from Inquiry</span>}
          </label>
          <select 
            value={personalInfo.gender || ""} 
            onChange={(e) => updatePersonalInfo({ gender: e.target.value as any })}
            className={getSelectClassName("gender", undefined, isPrefilled)}
          >
            <option value="" disabled>Select Gender</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {renderError("gender")}
        </div>

        {/* Date of Birth */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Date of Birth <span className="text-red-500">*</span></span>
            {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled from Inquiry</span>}
          </label>
          <Input 
            type="date" 
            value={personalInfo.dateOfBirth} 
            onChange={(e) => handleDOBChange(e.target.value)} 
            className={getFieldClassName("dateOfBirth", undefined, isPrefilled)} 
          />
          {renderError("dateOfBirth")}
        </div>

        {/* Age (Auto-calculated) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Age <span className="text-[10px] text-slate-400">(Auto)</span></span>
            {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled from Inquiry</span>}
          </label>
          <Input 
            value={personalInfo.age ?? ""} 
            readOnly 
            className={getFieldClassName("age", "rounded-[10px] text-xs h-9 bg-slate-50 dark:bg-slate-900 text-slate-800", isPrefilled)} 
          />
          {renderError("age")}
        </div>

        {/* Marital Status */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Marital Status <span className="text-red-500">*</span></label>
          <select 
            value={personalInfo.maritalStatus || ""} 
            onChange={(e) => {
              const val = e.target.value as any;
              if (val !== "Married") {
                updatePersonalInfo({ maritalStatus: val, spouseName: "" });
              } else {
                updatePersonalInfo({ maritalStatus: val });
              }
            }}
            className={getSelectClassName("maritalStatus")}
          >
            <option value="" disabled>Select Marital Status</option>
            {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {renderError("maritalStatus")}
        </div>

        {/* Husband Name, Education, Occupation (Only for Egg Donors when Married) */}
        {donorType === "egg" && (personalInfo.maritalStatus === "Married" || personalInfo.maritalStatus === "Divorced" || personalInfo.maritalStatus === "Widowed") && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Husband&apos;s Name <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
              <Input 
                placeholder="Enter husband's name" 
                value={personalInfo.spouseName || personalInfo.husbandName || ""} 
                onChange={(e) => updatePersonalInfo({ spouseName: e.target.value, husbandName: e.target.value })} 
                className={getFieldClassName("spouseName")} 
              />
              {renderError("spouseName")}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Husband&apos;s Education <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
              <Input 
                placeholder="e.g. 10th, Graduate" 
                value={personalInfo.spouseEducation || ""} 
                onChange={(e) => updatePersonalInfo({ spouseEducation: e.target.value })} 
                className={getFieldClassName("spouseEducation")} 
              />
              {renderError("spouseEducation")}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Husband&apos;s Occupation <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></label>
              <Input 
                placeholder="e.g. Job, Business" 
                value={personalInfo.spouseOccupation || personalInfo.husbandOccupation || ""} 
                onChange={(e) => updatePersonalInfo({ spouseOccupation: e.target.value, husbandOccupation: e.target.value })} 
                className={getFieldClassName("spouseOccupation")} 
              />
              {renderError("spouseOccupation")}
            </div>
          </>
        )}

        {/* Blood Group */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blood Group <span className="text-red-500">*</span></label>
          <select value={personalInfo.bloodGroup || ""} onChange={(e) => updatePersonalInfo({ bloodGroup: e.target.value as any })}
            className={getSelectClassName("bloodGroup")}>
            <option value="" disabled>Select Blood Group</option>
            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          {renderError("bloodGroup")}
        </div>

        {/* Religion */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Religion <span className="text-red-500">*</span></label>
          <select value={personalInfo.religion || ""} onChange={(e) => updatePersonalInfo({ religion: e.target.value })}
            className={getSelectClassName("religion")}>
            <option value="">Select Religion</option>
            <option value="Hindu">Hindu</option>
            <option value="Muslim">Muslim</option>
            <option value="Christian">Christian</option>
            <option value="Sikh">Sikh</option>
            <option value="Buddhist">Buddhist</option>
            <option value="Jain">Jain</option>
            <option value="Other">Other</option>
          </select>
          {renderError("religion")}
        </div>

        {/* Monthly Income */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Monthly Income <span className="text-[10px] text-slate-400">(Optional)</span></label>
          <Input placeholder="e.g. 15k or 15000" value={personalInfo.monthlyIncome || ""} onChange={(e) => updatePersonalInfo({ monthlyIncome: e.target.value })} className={getFieldClassName("monthlyIncome")} />
          {renderError("monthlyIncome")}
        </div>

        {/* Hobby (Only for Sperm Donors) */}
        {donorType === "sperm" && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hobby <span className="text-[10px] text-slate-400">(Optional)</span></label>
            <Input placeholder="e.g. Listening Music, Reading" value={personalInfo.hobby || ""} onChange={(e) => updatePersonalInfo({ hobby: e.target.value })} className={getFieldClassName("hobby")} />
            {renderError("hobby")}
          </div>
        )}



        {/* Education */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Education <span className="text-red-500">*</span></label>
          <Input placeholder="Highest qualification" value={personalInfo.education} onChange={(e) => updatePersonalInfo({ education: e.target.value })} className={getFieldClassName("education")} />
          {renderError("education")}
        </div>

        {/* Occupation */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Occupation <span className="text-red-500">*</span></label>
          <Input placeholder="Current profession" value={personalInfo.occupation} onChange={(e) => updatePersonalInfo({ occupation: e.target.value })} className={getFieldClassName("occupation")} />
          {renderError("occupation")}
        </div>

        {/* Height */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Height <span className="text-red-500">*</span></label>
          <Input placeholder="e.g. 175 cm" value={personalInfo.height} onChange={(e) => updatePersonalInfo({ height: e.target.value })} className={getFieldClassName("height")} />
          {renderError("height")}
        </div>

        {/* Weight */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weight <span className="text-red-500">*</span></label>
          <Input placeholder="e.g. 70 kg" value={personalInfo.weight} onChange={(e) => updatePersonalInfo({ weight: e.target.value })} className={getFieldClassName("weight")} />
          {renderError("weight")}
        </div>

        {/* Eye Color */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Eye Color</label>
          <Input placeholder="Brown / Blue / Green" value={personalInfo.eyeColor || ""} onChange={(e) => updatePersonalInfo({ eyeColor: e.target.value })} className={getFieldClassName("eyeColor")} />
          {renderError("eyeColor")}
        </div>

        {/* Hair Color */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hair Color</label>
          <Input placeholder="Black / Brown / Blonde" value={personalInfo.hairColor || ""} onChange={(e) => updatePersonalInfo({ hairColor: e.target.value })} className={getFieldClassName("hairColor")} />
          {renderError("hairColor")}
        </div>

        {/* Complexion */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Skin Colour</label>
          <Input placeholder="Fair / Wheatish / Dark" value={personalInfo.complexion || ""} onChange={(e) => updatePersonalInfo({ complexion: e.target.value })} className={getFieldClassName("complexion")} />
          {renderError("complexion")}
        </div>

        {/* Aadhaar Number */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aadhaar Number <span className="text-red-500">*</span></label>
          <Input 
            placeholder="12-digit Aadhaar number" 
            maxLength={12} 
            value={personalInfo.aadhaarNumber} 
            disabled 
            className="rounded-[10px] text-xs h-9 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed text-slate-500" 
          />
          {renderError("aadhaarNumber")}
        </div>

        {/* PAN Number */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">PAN Number <span className="text-[10px] text-slate-400">(Optional)</span></label>
          <Input placeholder="ABCDE1234F" maxLength={10} value={personalInfo.panNumber || ""} onChange={(e) => updatePersonalInfo({ panNumber: e.target.value.toUpperCase() })} className={getFieldClassName("panNumber")} />
          {renderError("panNumber")}
        </div>

        {/* Country */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Country <span className="text-red-500">*</span></label>
          <select
            value={customCountry ? "Other" : (contactInfo.country || "India")}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "Other") {
                setCustomCountry(true);
                updateContactInfo({ country: "", state: "", city: "" });
                setCustomState(false);
                setCustomCity(false);
              } else {
                setCustomCountry(false);
                updateContactInfo({ country: val, state: "", city: "" });
                setCustomState(false);
                setCustomCity(false);
              }
            }}
            className={getContactSelectClassName("country")}
          >
            {COUNTRIES.filter(c => c !== "Other").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          {customCountry && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Input
                placeholder="Enter Custom Country Name"
                value={contactInfo.country}
                onChange={(e) => updateContactInfo({ country: e.target.value })}
                className={getContactFieldClassName("country")}
              />
            </div>
          )}
          {renderContactError("country")}
        </div>

        {/* State */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">State <span className="text-red-500">*</span></label>
          {!customCountry && contactInfo.country === "India" ? (
            <>
              <select
                value={customState ? "Other" : (contactInfo.state || "")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Other") {
                    setCustomState(true);
                    updateContactInfo({ state: "", city: "" });
                    setCustomCity(false);
                  } else {
                    setCustomState(false);
                    updateContactInfo({ state: val, city: "" });
                    setCustomCity(false);
                  }
                }}
                className={getContactSelectClassName("state")}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.filter(s => s !== "Other").map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {customState && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    placeholder="Enter Custom State Name"
                    value={contactInfo.state}
                    onChange={(e) => updateContactInfo({ state: e.target.value })}
                    className={getContactFieldClassName("state")}
                  />
                </div>
              )}
            </>
          ) : (
            <Input 
              placeholder="State" 
              value={contactInfo.state} 
              onChange={(e) => updateContactInfo({ state: e.target.value })} 
              className={getContactFieldClassName("state")} 
            />
          )}
          {renderContactError("state")}
        </div>

        {/* City */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">City <span className="text-red-500">*</span></label>
          {!customCountry && contactInfo.country === "India" && !customState ? (
            <>
              <select
                value={customCity ? "Other" : (contactInfo.city || "")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Other") {
                    setCustomCity(true);
                    updateContactInfo({ city: "" });
                  } else {
                    setCustomCity(false);
                    updateContactInfo({ city: val });
                  }
                }}
                className={getContactSelectClassName("city")}
              >
                <option value="">Select City</option>
                {(STATE_CITIES[contactInfo.state] || []).filter(c => c !== "Other").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {customCity && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    placeholder="Enter Custom City Name"
                    value={contactInfo.city}
                    onChange={(e) => updateContactInfo({ city: e.target.value })}
                    className={getContactFieldClassName("city")}
                  />
                </div>
              )}
            </>
          ) : (
            <Input
              placeholder="City"
              value={contactInfo.city}
              onChange={(e) => updateContactInfo({ city: e.target.value })}
              className={getContactFieldClassName("city")}
            />
          )}
          {renderContactError("city")}
        </div>
      </div>

      {/* Optional Sourcing Coordinator / Agent Code */}
      {effectiveDonorType === "egg" && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-2">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Agent / Coordinator Code <span className="text-slate-400 font-normal">(Optional)</span>
            </h4>
            <p className="text-[11px] text-slate-500">If you are working with an authorized coordinator, enter their code.</p>
          </div>
          <div className="max-w-xs">
            <Input
              placeholder="e.g. AGT-1001"
              value={store.agentCode || ""}
              onChange={(e) => {
                const code = e.target.value.toUpperCase().trim();
                store.setAgentCode(code);
                updateReferral({ patientOrDonorId: code, sourceReferralType: "Agent / Referral Partner" });
              }}
              className="rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950 font-mono uppercase font-bold text-teal-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
