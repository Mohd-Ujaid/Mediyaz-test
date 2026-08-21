/* eslint-disable jsx-a11y/alt-text */
"use client";

import { Input } from "@/components/ui/input";
import { useDonorFormStore } from "../store";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

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
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj", "Bareilly", "Aligarh", "Moradabad", "Other"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Rishikesh", "Nainital", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Kharagpur", "Malda", "Other"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Narela", "Other"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Other"],
  "Chandigarh": ["Chandigarh"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam", "Other"]
};

export function StepContactInfo({ errors }: { errors?: Record<string, string> }) {
  const searchParams = useSearchParams();
  const isPrefilled = searchParams.get("prefilled") === "true";
  const { contactInfo, updateContactInfo } = useDonorFormStore();
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false);
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

  const handleSameAddress = (checked: boolean) => {
    setSameAsCurrentAddress(checked);
    if (checked) {
      updateContactInfo({ permanentAddress: contactInfo.currentAddress });
    }
  };

  const getFieldClassName = (fieldKey: string, baseStyle = "rounded-[10px] text-xs h-9 bg-white dark:bg-slate-950", isFieldPrefilled = false) => {
    const hasError = errors?.[`contactInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500/20`;
    }
    if (isFieldPrefilled) {
      return `${baseStyle} border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20 focus-visible:ring-emerald-500`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500`;
  };

  const getTextAreaClassName = (fieldKey: string, baseStyle = "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500") => {
    const hasError = errors?.[`contactInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-700`;
  };

  const getSelectClassName = (fieldKey: string, baseStyle = "w-full h-9 px-3 rounded-[10px] border bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500", isFieldPrefilled = false) => {
    const hasError = errors?.[`contactInfo.${fieldKey}`];
    if (hasError) {
      return `${baseStyle} border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500/20`;
    }
    if (isFieldPrefilled) {
      return `${baseStyle} border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20`;
    }
    return `${baseStyle} border-slate-200 dark:border-slate-800`;
  };

  const renderError = (fieldKey: string) => {
    const errorMsg = errors?.[`contactInfo.${fieldKey}`];
    if (!errorMsg) return null;
    return <p className="text-[10px] text-red-500 mt-0.5">{errorMsg}</p>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contact Information</h3>
        <p className="text-xs text-slate-500 mt-1">Please provide your contact details for communication.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Mobile Number <span className="text-red-500">*</span></span>
            {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled from Inquiry</span>}
          </label>
          <Input 
            placeholder="+91 XXXXX XXXXX" 
            value={contactInfo.mobileNumber} 
            disabled 
            className="rounded-[10px] text-xs h-9 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed text-slate-500" 
          />
          {renderError("mobileNumber")}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alternate Mobile</label>
          <Input placeholder="Optional" value={contactInfo.alternateMobile || ""} onChange={(e) => updateContactInfo({ alternateMobile: e.target.value })} className={getFieldClassName("alternateMobile")} />
          {renderError("alternateMobile")}
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Email Address <span className="text-red-500">*</span></span>
            {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled from Inquiry</span>}
          </label>
          <Input 
            type="email" 
            placeholder="your@email.com" 
            value={contactInfo.emailAddress} 
            onChange={(e) => updateContactInfo({ emailAddress: e.target.value })} 
            className={getFieldClassName("emailAddress", undefined, isPrefilled)} 
          />
          {renderError("emailAddress")}
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Address Details</h4>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Address <span className="text-red-500">*</span></label>
            <textarea
              placeholder="Full current address with house number, street, landmark..."
              value={contactInfo.currentAddress}
              onChange={(e) => updateContactInfo({ currentAddress: e.target.value })}
              rows={2}
              className={getTextAreaClassName("currentAddress")}
            />
            {renderError("currentAddress")}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sameAddress"
              checked={sameAsCurrentAddress}
              onChange={(e) => handleSameAddress(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <label htmlFor="sameAddress" className="text-xs text-slate-600 dark:text-slate-400">
              Same as current address
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Permanent Address <span className="text-red-500">*</span></label>
            <textarea
              placeholder="Full permanent address..."
              value={contactInfo.permanentAddress}
              onChange={(e) => updateContactInfo({ permanentAddress: e.target.value })}
              rows={2}
              disabled={sameAsCurrentAddress}
              className={getTextAreaClassName("permanentAddress", "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60")}
            />
            {renderError("permanentAddress")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Country */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Country <span className="text-red-500">*</span>
            </label>
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
              className={getSelectClassName("country")}
            >
              {COUNTRIES.filter(c => c !== "Other").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
            {customCountry && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  placeholder="Enter Custom Country Name"
                  value={contactInfo.country}
                  onChange={(e) => updateContactInfo({ country: e.target.value })}
                  className={getFieldClassName("country")}
                />
              </div>
            )}
            {renderError("country")}
          </div>

          {/* State */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>State <span className="text-red-500">*</span></span>
              {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled</span>}
            </label>
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
                  className={getSelectClassName("state", undefined, isPrefilled)}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.filter(s => s !== "Other").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {customState && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      placeholder="Enter Custom State Name"
                      value={contactInfo.state}
                      onChange={(e) => updateContactInfo({ state: e.target.value })}
                      className={getFieldClassName("state", undefined, isPrefilled)}
                    />
                  </div>
                )}
              </>
            ) : (
              <Input 
                placeholder="State" 
                value={contactInfo.state} 
                onChange={(e) => updateContactInfo({ state: e.target.value })} 
                className={getFieldClassName("state", undefined, isPrefilled)} 
              />
            )}
            {renderError("state")}
          </div>

          {/* District */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">District <span className="text-red-500">*</span></label>
            <Input placeholder="District" value={contactInfo.district} onChange={(e) => updateContactInfo({ district: e.target.value })} className={getFieldClassName("district")} />
            {renderError("district")}
          </div>

          {/* City */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>City <span className="text-red-500">*</span></span>
              {isPrefilled && <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded scale-90">Prefilled</span>}
            </label>
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
                  className={getSelectClassName("city", undefined, isPrefilled)}
                >
                  <option value="">Select City</option>
                  {(STATE_CITIES[contactInfo.state] || []).filter(c => c !== "Other").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {customCity && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      placeholder="Enter Custom City Name"
                      value={contactInfo.city}
                      onChange={(e) => updateContactInfo({ city: e.target.value })}
                      className={getFieldClassName("city", undefined, isPrefilled)}
                    />
                  </div>
                )}
              </>
            ) : (
              <Input
                placeholder="City"
                value={contactInfo.city}
                onChange={(e) => updateContactInfo({ city: e.target.value })}
                className={getFieldClassName("city", undefined, isPrefilled)}
              />
            )}
            {renderError("city")}
          </div>

          {/* Pincode */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pincode <span className="text-red-500">*</span></label>
            <Input placeholder="Pincode/Zip" value={contactInfo.pincode} onChange={(e) => updateContactInfo({ pincode: e.target.value })} className={getFieldClassName("pincode")} />
            {renderError("pincode")}
          </div>
        </div>
      </div>
    </div>
  );
}
