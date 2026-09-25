"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSession } from "@/lib/auth";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  DollarSign,
  TrendingUp,
  History,
  Info,
  Heart,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";

export default function HospitalManagementPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // const [organFilter, setOrganFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  
  const [formTab, setFormTab] = useState<"basic" | "contact" | "medical" | "financial">("basic");
  const [detailTab, setDetailTab] = useState<"info" | "financial" | "history">("info");

  // Form Fields
  const [formFields, setFormFields] = useState<any>({
    name: "",
    shortName: "",
    // code: "",
    registrationNumber: "",
    // licenseNumber: "",
    gstNumber: "",
    // panNumber: "",
    
    contactPerson: "",
    email: "",
    mobileNumber: "",
    telephone: "",
    emergencyNumber: "",
    
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    
    hospitalType: "",
    specializations: [],
    // organTypesSupported: [],
    // icuAvailability: false,
    // transplantLicenseNumber: "",
    
    donorDealPrice: 0,
    profiledonorDealPrice: 0,
    // serviceCharge: 0,
    // processingFee: 0,
    // registrationFee: 0,
    // commission: 0,
    // additionalCharges: 0,
    currency: "INR",
    status: "ACTIVE"
  });

  const [newSpec, setNewSpec] = useState("");
  const [newOrgan, setNewOrgan] = useState("");

  const resetForm = () => {
    setFormFields({
      name: "",
      shortName: "",
      // code: "",
      registrationNumber: "",
      // licenseNumber: "",
      gstNumber: "",
      // panNumber: "",
      contactPerson: "",
      email: "",
      mobileNumber: "",
      telephone: "",
      emergencyNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      hospitalType: "",
      specializations: [],
      // organTypesSupported: [],
      // icuAvailability: false,
      // transplantLicenseNumber: "",
      donorDealPrice: 0,
      profiledonorDealPrice: 0,
      // serviceCharge: 0,
      // processingFee: 0,
      // registrationFee: 0,
      // commission: 0,
      // additionalCharges: 0,
      currency: "INR",
      status: "ACTIVE"
    });
    setFormTab("basic");
  };

  async function loadHospitals() {
    setLoading(true);
    try {
      let query = `/api/hospitals?search=${encodeURIComponent(search)}&page=${currentPage}&limit=${itemsPerPage}`;
      console.log(query);
      if (cityFilter) query += `&city=${encodeURIComponent(cityFilter)}`;
      if (stateFilter) query += `&state=${encodeURIComponent(stateFilter)}`;
      if (typeFilter) query += `&type=${typeFilter}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      // if (organFilter) query += `&organ=${organFilter}`;

      const res = await fetch(query);
      console.log("------",res);
      const data = await res.json();

      // gtemp
      console.log("HOSPITAL API RESPONSE:", data);
console.log("HOSPITALS:", data.hospitals);

data.hospitals?.forEach((h: any, index: number) => {
  console.log(`Hospital ${index}:`, h);

  console.log("hospitalType:", h.hospitalType, typeof h.hospitalType);
  console.log("contactPerson:", h.contactPerson, typeof h.contactPerson);
  console.log("email:", h.email, typeof h.email);
  console.log("address:", h.address, typeof h.address);
});
      // gtemp







      if (data.success) {
        setHospitals(data.hospitals || []);
        if (data.pagination) {
          setTotalPages(data.pagination.pages);
        }
      } else {
        toast.error(data.error || "Failed to load hospitals.");
      }
    } catch (error) {
      toast.error("Failed to fetch hospitals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHospitals();
  }, [currentPage, search, cityFilter, stateFilter, typeFilter, statusFilter]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formFields.name || !formFields.shortName ||  !formFields.registrationNumber || !formFields.contactPerson || !formFields.email || !formFields.mobileNumber || !formFields.addressLine1 || !formFields.city || !formFields.state || !formFields.pincode) {
      toast.error("Please fill in all required fields across all tabs.");
      return;
    }

    try {
      const url = selectedHospital ? `/api/hospitals/${selectedHospital._id}` : "/api/hospitals";
      const method = selectedHospital ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formFields)
      });
      const data = await res.json();
      // gtemp
      console.log("HOSPITAL API RESPONSE:", data);
console.log("HOSPITALS:", data.hospitals);

data.hospitals?.forEach((h: any, index: number) => {
  console.log(`Hospital ${index}:`, h);

  console.log("hospitalType:", h.hospitalType, typeof h.hospitalType);
  console.log("contactPerson:", h.contactPerson, typeof h.contactPerson);
  console.log("email:", h.email, typeof h.email);
  console.log("address:", h.address, typeof h.address);
});
      // gtemp
      
      if (data.success) {
        toast.success(selectedHospital ? "Hospital details updated successfully." : "Hospital registered successfully.");
        setIsFormOpen(false);
        resetForm();
        setSelectedHospital(null);
        loadHospitals();
      } else {
        toast.error(data.error || "Operation failed.");
      }
    } catch (error) {
      toast.error("Network error during operation.");
    }
  };

  const handleOpenEdit = (hosp: any) => {
    setSelectedHospital(hosp);
    setFormFields({
      name: hosp.name || "",
      shortName: hosp.shortName || "",
      // code: hosp.code || "",
      registrationNumber: hosp.registrationNumber || "",
      // licenseNumber: hosp.licenseNumber || "",
      // gstNumber: hosp.gstNumber || "",
      // panNumber: hosp.panNumber || "",
      contactPerson: hosp.contactPerson || "",
      email: hosp.email || "",
      mobileNumber: hosp.mobileNumber || "",
      telephone: hosp.telephone || "",
      emergencyNumber: hosp.emergencyNumber || "",
      addressLine1: hosp.addressLine1 || "",
      addressLine2: hosp.addressLine2 || "",
      city: hosp.city || "",
      state: hosp.state || "",
      country: hosp.country || "India",
      pincode: hosp.pincode || "",
      hospitalType: hosp.hospitalType || "",
      specializations: hosp.specializations || [],
      // organTypesSupported: hosp.organTypesSupported || [],
      // icuAvailability: hosp.icuAvailability || false,
      // transplantLicenseNumber: hosp.transplantLicenseNumber || "",
      donorDealPrice: hosp.donorDealPrice || 0,
      profiledonorDealPrice: hosp.profiledonorDealPrice || 0,
      // serviceCharge: hosp.serviceCharge || 0,
      // processingFee: hosp.processingFee || 0,
      // registrationFee: hosp.registrationFee || 0,
      // commission: hosp.commission || 0,
      // additionalCharges: hosp.additionalCharges || 0,
      currency: hosp.currency || "INR",
      status: hosp.status || "ACTIVE"
    });
    setFormTab("basic");
    setIsFormOpen(true);
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Are you sure you want to soft delete this hospital profile? It will be archived and hidden from general assignments.")) return;
    try {
      const res = await fetch(`/api/hospitals/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Hospital archived successfully.");
        loadHospitals();
      } else {
        toast.error(data.error || "Failed to delete hospital.");
      }
    } catch (error) {
      toast.error("Network error deleting hospital.");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/hospitals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Hospital status updated to ${newStatus}.`);
        loadHospitals();
      } else {
        toast.error(data.error || "Failed to update status.");
      }
    } catch (error) {
      toast.error("Failed to communicate status update.");
    }
  };

  const addSpec = () => {
    if (newSpec.trim() && !formFields.specializations.includes(newSpec.trim())) {
      setFormFields({
        ...formFields,
        specializations: [...formFields.specializations, newSpec.trim()]
      });
      setNewSpec("");
    }
  };

  const removeSpec = (spec: string) => {
    setFormFields({
      ...formFields,
      specializations: formFields.specializations.filter((s: string) => s !== spec)
    });
  };

  // const addOrgan = () => {
  //   if (newOrgan.trim() && !formFields.organTypesSupported.includes(newOrgan.trim())) {
  //     setFormFields({
  //       ...formFields,
  //       organTypesSupported: [...formFields.organTypesSupported, newOrgan.trim()]
  //     });
  //     setNewOrgan("");
  //   }
  // };

  // const removeOrgan = (organ: string) => {
  //   setFormFields({
  //     ...formFields,
  //     organTypesSupported: formFields.organTypesSupported.filter((o: string) => o !== organ)
  //   });
  // };

  // Export CSV
  const exportCsv = () => {
    if (hospitals.length === 0) {
      toast.error("No hospitals data available to export.");
      return;
    }
    const headers = [
      "Hospital Name", "Type", "Status", "Contact Person", "Email", "Phone", "City", "State"
    ];
    const rows = hospitals.map(h => [
      h.name, h.hospitalType, h.status, h.contactPerson, h.email, h.mobileNumber, h.city, h.state
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `hospitals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    toast.success("Hospitals exported to CSV.");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" /> ART Clinics Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure partner clinics, manage organ specialty lists, and verify business donor deals.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={exportCsv}
              variant="outline"
              className="rounded-xl text-xs gap-1 border-slate-200"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button
              onClick={() => { resetForm(); setSelectedHospital(null); setIsFormOpen(true); }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1"
            >
              <Plus className="w-4 h-4" /> Add Partner Hospital
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            >
              {/* <option value="">Status (Active/Suspended)</option> */}
              <option value="ACTIVE">Active Partner</option>
              <option value="INACTIVE">Inactive</option>
              {/* <option value="SUSPENDED">Suspended</option>   */}
              <option value="ARCHIVED">Archived (Soft deleted)</option>
            </select>
          </div>

          {/* states Type */}
          <div>
<select
  value={stateFilter}
  onChange={(e) => setStateFilter(e.target.value)}
  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
>
  {/* <option value="">Select State (All)</option>

  <option value="Andhra Pradesh">Andhra Pradesh</option>
  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
  <option value="Assam">Assam</option>
  <option value="Bihar">Bihar</option>
  <option value="Chhattisgarh">Chhattisgarh</option>
  <option value="Goa">Goa</option>
  <option value="Gujarat">Gujarat</option>
  <option value="Haryana">Haryana</option>
  <option value="Himachal Pradesh">Himachal Pradesh</option>
  <option value="Jharkhand">Jharkhand</option>
  <option value="Karnataka">Karnataka</option>
  <option value="Kerala">Kerala</option>
  <option value="Madhya Pradesh">Madhya Pradesh</option>
  <option value="Maharashtra">Maharashtra</option>
  <option value="Manipur">Manipur</option>
  <option value="Meghalaya">Meghalaya</option>
  <option value="Mizoram">Mizoram</option>
  <option value="Nagaland">Nagaland</option>
  <option value="Odisha">Odisha</option>
  <option value="Punjab">Punjab</option>
  <option value="Rajasthan">Rajasthan</option>
  <option value="Sikkim">Sikkim</option>
  <option value="Tamil Nadu">Tamil Nadu</option>
  <option value="Telangana">Telangana</option>
  <option value="Tripura">Tripura</option>
  <option value="Uttar Pradesh">Uttar Pradesh</option>
  <option value="Uttarakhand">Uttarakhand</option>
  <option value="West Bengal">West Bengal</option>


  <option value="Andaman and Nicobar Islands">
    Andaman and Nicobar Islands
  </option>
  <option value="Chandigarh">Chandigarh</option>
  <option value="Dadra and Nagar Haveli and Daman and Diu">
    Dadra and Nagar Haveli and Daman and Diu
  </option>
  <option value="Delhi">Delhi</option>
  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
  <option value="Ladakh">Ladakh</option>
  <option value="Lakshadweep">Lakshadweep</option>
  <option value="Puducherry">Puducherry</option> */}

  <option value="">Select State</option>
                  {INDIAN_STATES.filter(s => s !== "Other").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="Other">Other</option>
</select>


          </div>

          
          {/* city types */}

          <div>
          

<select
  value={cityFilter}
  onChange={(e) => setCityFilter(e.target.value)}
  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
>
  {/* <option value="">Select City (All)</option>

  <option value="Agartala">Agartala</option>
  <option value="Agra">Agra</option>
  <option value="Ahmedabad">Ahmedabad</option>
  <option value="Aizawl">Aizawl</option>
  <option value="Ajmer">Ajmer</option>
  <option value="Alappuzha">Alappuzha</option>
  <option value="Aligarh">Aligarh</option>
  <option value="Alwar">Alwar</option>
  <option value="Amravati">Amravati</option>
  <option value="Amritsar">Amritsar</option>
  <option value="Anand">Anand</option>
  <option value="Asansol">Asansol</option>
  <option value="Aurangabad">Aurangabad</option>
  <option value="Ayodhya">Ayodhya</option>

  <option value="Bareilly">Bareilly</option>
  <option value="Bathinda">Bathinda</option>
  <option value="Belagavi">Belagavi</option>
  <option value="Bengaluru">Bengaluru</option>
  <option value="Berhampur">Berhampur</option>
  <option value="Bhagalpur">Bhagalpur</option>
  <option value="Bhilai">Bhilai</option>
  <option value="Bhopal">Bhopal</option>
  <option value="Bhubaneswar">Bhubaneswar</option>
  <option value="Bikaner">Bikaner</option>
  <option value="Bilaspur">Bilaspur</option>
  <option value="Bokaro">Bokaro</option>

  <option value="Chandigarh">Chandigarh</option>
  <option value="Chennai">Chennai</option>
  <option value="Coimbatore">Coimbatore</option>
  <option value="Cuttack">Cuttack</option>

  <option value="Daman">Daman</option>
  <option value="Davanagere">Davanagere</option>
  <option value="Dehradun">Dehradun</option>
  <option value="Delhi">Delhi</option>
  <option value="Dhanbad">Dhanbad</option>
  <option value="Dharamshala">Dharamshala</option>
  <option value="Dibrugarh">Dibrugarh</option>
  <option value="Dimapur">Dimapur</option>
  <option value="Diu">Diu</option>
  <option value="Durg">Durg</option>
  <option value="Durgapur">Durgapur</option>

  <option value="Ernakulam">Ernakulam</option>
  <option value="Erode">Erode</option>

  <option value="Faridabad">Faridabad</option>

  <option value="Gandhinagar">Gandhinagar</option>
  <option value="Gangtok">Gangtok</option>
  <option value="Gaya">Gaya</option>
  <option value="Ghaziabad">Ghaziabad</option>
  <option value="Gorakhpur">Gorakhpur</option>
  <option value="Greater Noida">Greater Noida</option>
  <option value="Guntur">Guntur</option>
  <option value="Gurugram">Gurugram</option>
  <option value="Guwahati">Guwahati</option>
  <option value="Gwalior">Gwalior</option>

  <option value="Haldwani">Haldwani</option>
  <option value="Haridwar">Haridwar</option>
  <option value="Hisar">Hisar</option>
  <option value="Howrah">Howrah</option>
  <option value="Hubballi">Hubballi</option>

  <option value="Imphal">Imphal</option>
  <option value="Indore">Indore</option>
  <option value="Itanagar">Itanagar</option>

  <option value="Jabalpur">Jabalpur</option>
  <option value="Jaipur">Jaipur</option>
  <option value="Jalandhar">Jalandhar</option>
  <option value="Jalgaon">Jalgaon</option>
  <option value="Jammu">Jammu</option>
  <option value="Jamnagar">Jamnagar</option>
  <option value="Jamshedpur">Jamshedpur</option>
  <option value="Jhansi">Jhansi</option>
  <option value="Jodhpur">Jodhpur</option>
  <option value="Jorhat">Jorhat</option>
  <option value="Junagadh">Junagadh</option>

  <option value="Kadapa">Kadapa</option>
  <option value="Kakinada">Kakinada</option>
  <option value="Kannur">Kannur</option>
  <option value="Kanpur">Kanpur</option>
  <option value="Karnal">Karnal</option>
  <option value="Karimnagar">Karimnagar</option>
  <option value="Kavaratti">Kavaratti</option>
  <option value="Khammam">Khammam</option>
  <option value="Kochi">Kochi</option>
  <option value="Kohima">Kohima</option>
  <option value="Kolhapur">Kolhapur</option>
  <option value="Kolkata">Kolkata</option>
  <option value="Kollam">Kollam</option>
  <option value="Kota">Kota</option>
  <option value="Kozhikode">Kozhikode</option>
  <option value="Kullu">Kullu</option>
  <option value="Kurnool">Kurnool</option>

  <option value="Leh">Leh</option>
  <option value="Ludhiana">Ludhiana</option>
  <option value="Lucknow">Lucknow</option>
  <option value="Lunglei">Lunglei</option>

  <option value="Madurai">Madurai</option>
  <option value="Mandi">Mandi</option>
  <option value="Mangaluru">Mangaluru</option>
  <option value="Margao">Margao</option>
  <option value="Mathura">Mathura</option>
  <option value="Meerut">Meerut</option>
  <option value="Mohali">Mohali</option>
  <option value="Moradabad">Moradabad</option>
  <option value="Mumbai">Mumbai</option>
  <option value="Muzaffarpur">Muzaffarpur</option>
  <option value="Mysuru">Mysuru</option>

  <option value="Nagpur">Nagpur</option>
  <option value="Nainital">Nainital</option>
  <option value="Naharlagun">Naharlagun</option>
  <option value="Nashik">Nashik</option>
  <option value="Navi Mumbai">Navi Mumbai</option>
  <option value="Nellore">Nellore</option>
  <option value="Noida">Noida</option>

  <option value="Panaji">Panaji</option>
  <option value="Panipat">Panipat</option>
  <option value="Patiala">Patiala</option>
  <option value="Patna">Patna</option>
  <option value="Puducherry">Puducherry</option>
  <option value="Pune">Pune</option>
  <option value="Puri">Puri</option>
  <option value="Purnia">Purnia</option>

  <option value="Raipur">Raipur</option>
  <option value="Rajahmundry">Rajahmundry</option>
  <option value="Rajkot">Rajkot</option>
  <option value="Ranchi">Ranchi</option>
  <option value="Rewa">Rewa</option>
  <option value="Rishikesh">Rishikesh</option>
  <option value="Rohtak">Rohtak</option>
  <option value="Rourkela">Rourkela</option>

  <option value="Sagar">Sagar</option>
  <option value="Salem">Salem</option>
  <option value="Sambalpur">Sambalpur</option>
  <option value="Shillong">Shillong</option>
  <option value="Shimla">Shimla</option>
  <option value="Shivamogga">Shivamogga</option>
  <option value="Siliguri">Siliguri</option>
  <option value="Silchar">Silchar</option>
  <option value="Solan">Solan</option>
  <option value="Solapur">Solapur</option>
  <option value="Srinagar">Srinagar</option>
  <option value="Surat">Surat</option>

  <option value="Tawang">Tawang</option>
  <option value="Tezpur">Tezpur</option>
  <option value="Thane">Thane</option>
  <option value="Thiruvananthapuram">Thiruvananthapuram</option>
  <option value="Thoothukudi">Thoothukudi</option>
  <option value="Thrissur">Thrissur</option>
  <option value="Tiruchirappalli">Tiruchirappalli</option>
  <option value="Tirunelveli">Tirunelveli</option>
  <option value="Tirupati">Tirupati</option>
  <option value="Tiruppur">Tiruppur</option>
  <option value="Tura">Tura</option>

  <option value="Udaipur">Udaipur</option>
  <option value="Ujjain">Ujjain</option>

  <option value="Vadodara">Vadodara</option>
  <option value="Varanasi">Varanasi</option>
  <option value="Vasco da Gama">Vasco da Gama</option>
  <option value="Vellore">Vellore</option>
  <option value="Vijayawada">Vijayawada</option>
  <option value="Visakhapatnam">Visakhapatnam</option>

  <option value="Warangal">Warangal</option> */}

  <option value="">Select City</option>
   {(STATE_CITIES[stateFilter] || []).filter((c) => c !== "Other").map((c) => ( 
    <option key={c} value={c}> {c} </option> ))} 
    {(STATE_CITIES[stateFilter] || []).includes("Other") && ( <option value="Other">Other</option>)}

  
</select>


          </div>

          {/* Organ Filter */}
          {/* <div>
            <input
              type="text"
              placeholder="Organ specialty (e.g. Kidney, Egg)"
              value={organFilter}
              onChange={(e) => setOrganFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            />
          </div> */}
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            Loading clinics...
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No partner clinics registered in this scope.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Hospital Name</th>
                  <th className="p-3.5">Registration No.</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Status</th>
                  {/* <th className="p-3.5">Hospital Deal</th> */}
                  {/* <th className="p-3.5"></th> */}
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {hospitals.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">{h.name}</td>
                    {/* <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {h.name} <span className="text-[10px] text-slate-400">({h.shortName})</span>
                    </td> */}
                    <td className="p-3.5 text-slate-600">{h.registrationNumber}</td>
                    <td className="p-3.5 text-slate-600">{h.hospitalType}</td>
                    <td className="p-3.5 text-slate-600">
                      {h.city}, {h.state}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{h.contactPerson}</div>
                        <div className="text-[10px] text-slate-400">{h.mobileNumber}</div>
                      </div>
                    </td>
                    {/* <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {h.organTypesSupported?.slice(0, 2).map((org: string) => (
                          <span key={org} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-semibold dark:bg-slate-900 dark:text-slate-400">
                            {org}
                          </span>
                        ))}
                        {h.organTypesSupported?.length > 2 && (
                          <span className="text-[9px] text-slate-400">+{h.organTypesSupported.length - 2} more</span>
                        )}
                      </div>
                    </td> */}
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        h.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        // h.status === "SUSPENDED" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" :
                        h.status === "INACTIVE" ? "bg-red-500 text-white dark:bg-red-800 dark:text-white" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border">
                            <DropdownMenuItem
                              onClick={() => { setSelectedHospital(h); setDetailTab("info"); setIsDetailOpen(true); }}
                              className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                            >
                              <Eye className="w-4 h-4 text-blue-600" /> View Clinic Dashboard
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(h)}
                                  className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                                >
                                  <Edit className="w-4 h-4 text-emerald-600" /> Edit Clinic Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleSoftDelete(h._id)}
                                  className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" /> Archive / Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && hospitals.length > 0 && (
          <div className="p-4 border-t dark:border-slate-800">
            <CustomPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </Card>

      {/* DIALOG 1: ADD / EDIT PARTNER CLINIC */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Building2 className="w-5 h-5 text-teal-600" /> {selectedHospital ? "Edit partner hospital details" : "Register partner hospital"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide basic, medical specialization, contact, and donor deal financial configurations.
            </DialogDescription>
          </DialogHeader>

          {/* Form Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-900 mb-4 text-xs font-semibold">
            <button
              onClick={() => setFormTab("basic")}
              className={`pb-2.5 px-3 border-b-2 transition-all ${formTab === "basic" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setFormTab("contact")}
              className={`pb-2.5 px-3 border-b-2 transition-all ${formTab === "contact" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              Contact & Address
            </button>
            <button
              onClick={() => setFormTab("medical")}
              className={`pb-2.5 px-3 border-b-2 transition-all ${formTab === "medical" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              Medical Config
            </button>
            {isAdmin && (
              <button
                onClick={() => setFormTab("financial")}
                className={`pb-2.5 px-3 border-b-2 transition-all ${formTab === "financial" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Financial Settings
              </button>
            )}
          </div>

          <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-xs">
            {/* TAB 1: BASIC INFORMATION */}
            {formTab === "basic" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hospital Name *</label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Short Name *</label>
                  <input
                    type="text"
                    required
                    value={formFields.shortName}
                    onChange={(e) => setFormFields({ ...formFields, shortName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                {/* <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hospital Code *</label>
                  <input
                    type="text"
                    required
                    value={formFields.code}
                    onChange={(e) => setFormFields({ ...formFields, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div> */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={formFields.registrationNumber}
                    onChange={(e) => setFormFields({ ...formFields, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                {/* <div className="space-y-1">
                  <label className="font-bold text-slate-700">License Number *</label>
                  <input
                    type="text"
                    required
                    value={formFields.licenseNumber}
                    onChange={(e) => setFormFields({ ...formFields, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div> */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">GST Number</label>
                  <input
                    type="text"
                    value={formFields.gstNumber}
                    onChange={(e) => setFormFields({ ...formFields, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                {/* <div className="space-y-1">
                  <label className="font-bold text-slate-700">PAN Number</label>
                  <input
                    type="text"
                    value={formFields.panNumber}
                    onChange={(e) => setFormFields({ ...formFields, panNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div> */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Active Status</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: CONTACT & ADDRESS */}
            {formTab === "contact" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={formFields.contactPerson}
                      onChange={(e) => setFormFields({ ...formFields, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Email Address (Hospital) *</label>
                    <input
                      type="email"
                      required
                      value={formFields.email}
                      onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Contact Number (Hospital) *</label>
                    <input
                      type="text"
                      required
                      value={formFields.mobileNumber}
                      onChange={(e) => setFormFields({ ...formFields, mobileNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Emergency Number</label>
                    <input
                      type="text"
                      value={formFields.emergencyNumber}
                      onChange={(e) => setFormFields({ ...formFields, emergencyNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={formFields.addressLine1}
                      onChange={(e) => setFormFields({ ...formFields, addressLine1: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Address Line 2</label>
                    <input
                      type="text"
                      value={formFields.addressLine2}
                      onChange={(e) => setFormFields({ ...formFields, addressLine2: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">City *</label>
                      <input
                        type="text"
                        required
                        value={formFields.city}
                        onChange={(e) => setFormFields({ ...formFields, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">State *</label>
                      <input
                        type="text"
                        required
                        value={formFields.state}
                        onChange={(e) => setFormFields({ ...formFields, state: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Country *</label>
                      <input
                        type="text"
                        required
                        value={formFields.country}
                        onChange={(e) => setFormFields({ ...formFields, country: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={formFields.pincode}
                        onChange={(e) => setFormFields({ ...formFields, pincode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MEDICAL CONFIGURATION */}
            {formTab === "medical" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Hospital Type *</label>
                    <select
                      value={formFields.hospitalType}
                      onChange={(e) => setFormFields({ ...formFields, hospitalType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                    >
                      <option value="Proprietor">Proprietor</option>
                      <option value="LLP">LLP</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Other Option">Other Option</option>
                    </select>
                  </div>
                  {/* <div className="space-y-1">
                    <label className="font-bold text-slate-700">Transplant License Number *</label>
                    <input
                      type="text"
                      required
                      value={formFields.transplantLicenseNumber}
                      onChange={(e) => setFormFields({ ...formFields, transplantLicenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="icu"
                      checked={formFields.icuAvailability}
                      onChange={(e) => setFormFields({ ...formFields, icuAvailability: e.target.checked })}
                      className="w-4 h-4 border rounded"
                    />
                    <label htmlFor="icu" className="font-bold text-slate-700">ICU Facility Available</label>
                  </div> */}
                </div>

                {/* Tag list for Organ Supported */}
                {/* <div className="space-y-2 border-t pt-3">
                  <label className="font-bold text-slate-700">Organ Types Supported:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Oocyte, Kidney, Liver"
                      value={newOrgan}
                      onChange={(e) => setNewOrgan(e.target.value)}
                      className="px-3 py-1.5 border rounded-xl text-xs focus:outline-none"
                    />
                    <Button type="button" onClick={addOrgan} size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs">
                      + Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formFields.organTypesSupported.map((org: string) => (
                      <span key={org} className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold border border-teal-100">
                        {org} <XCircle className="w-3.5 h-3.5 text-teal-600 cursor-pointer" onClick={() => removeOrgan(org)} />
                      </span>
                    ))}
                  </div>
                </div> */}

                {/* Tag list for Specializations */}
                <div className="space-y-2 border-t pt-3">
                  <label className="font-bold text-slate-700">Specializations:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. IVF, Transplant surgery"
                      value={newSpec}
                      onChange={(e) => setNewSpec(e.target.value)}
                      className="px-3 py-1.5 border rounded-xl text-xs focus:outline-none"
                    />
                    <Button type="button" onClick={addSpec} size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs">
                      + Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formFields.specializations.map((spec: string) => (
                      <span key={spec} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold border border-blue-100">
                        {spec} <XCircle className="w-3.5 h-3.5 text-blue-600 cursor-pointer" onClick={() => removeSpec(spec)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {formTab === "financial" && isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Donor Deal (INR)</label>
                  <input
                    type="number"
                    value={formFields.donorDealPrice}
                    onChange={(e) => setFormFields({ ...formFields, donorDealPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Profile Donor Deal (INR)</label>
                  <input
                    type="number"
                    value={formFields.profiledonorDealPrice}
                    onChange={(e) => setFormFields({ ...formFields, profiledonorDealPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex gap-3 justify-end pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1">
                {selectedHospital ? "Save Changes" : "Register Clinic"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: VIEW HOSPITAL DETAILS DASHBOARD */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl rounded-2xl overflow-y-auto max-h-[85vh]">
          {selectedHospital && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Building2 className="w-5 h-5 text-teal-600" /> {selectedHospital.name} Dashboard
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Partner clinic records, deal configuration, and pricing history audit.
                </DialogDescription>
              </DialogHeader>

              {/* Tabs for details */}
              <div className="flex border-b border-slate-100 dark:border-slate-900 mb-4 text-xs font-semibold">
                <button
                  onClick={() => setDetailTab("info")}
                  className={`pb-2.5 px-3 border-b-2 transition-all ${detailTab === "info" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  General Details
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setDetailTab("financial")}
                      className={`pb-2.5 px-3 border-b-2 transition-all ${detailTab === "financial" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                    >
                      Donor Deal Info
                    </button>
                    <button
                      onClick={() => setDetailTab("history")}
                      className={`pb-2.5 px-3 border-b-2 transition-all ${detailTab === "history" ? "border-teal-600 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                    >
                      Pricing Change Log
                    </button>
                  </>
                )}
              </div>

              {/* DETAILS TABS CONTENT */}
              <div className="space-y-4 text-xs">
                {detailTab === "info" && (
                  <div className="space-y-4">
                    {/* Basic Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                      {/* <div><span className="text-slate-400">Hospital Code:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedHospital.code}</span></div> */}
                      {/* <div><span className="text-slate-400">License Number:</span> <span className="font-semibold">{selectedHospital.licenseNumber}</span></div>
                      <div><span className="text-slate-400">GST Number:</span> <span>{selectedHospital.gstNumber || "—"}</span></div>
                      <div><span className="text-slate-400">PAN Number:</span> <span>{selectedHospital.panNumber || "—"}</span></div> */}
                      <div><span className="text-slate-400">Registration ID:</span> <span>{selectedHospital.registrationNumber}</span></div>
                      {/* <div><span className="text-slate-400">Transplant License:</span> <span className="font-semibold">{selectedHospital.transplantLicenseNumber}</span></div> */}
                    </div>

                    {/* Contact & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-700 border-b pb-0.5">Contact Details</h4>
                        <div><span className="text-slate-400">Person:</span> <span className="font-semibold">{selectedHospital.contactPerson}</span></div>
                        <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> <span>{selectedHospital.email}</span></div>
                        <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> <span>{selectedHospital.mobileNumber}</span></div>
                        {selectedHospital.emergencyNumber && (
                          <div className="text-red-500 font-semibold">Emergency: {selectedHospital.emergencyNumber}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-700 border-b pb-0.5">Address Location</h4>
                        <div className="flex gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <div>{selectedHospital.addressLine1}</div>
                            {selectedHospital.addressLine2 && <div>{selectedHospital.addressLine2}</div>}
                            <div>{selectedHospital.city}, {selectedHospital.state} - {selectedHospital.pincode}</div>
                            <div className="text-[10px] text-slate-400">{selectedHospital.country}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specializations & Organs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                      {/* <div className="space-y-1">
                        <div className="font-bold text-slate-700">Supported Organs:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedHospital.organTypesSupported?.map((org: string) => (
                            <span key={org} className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg text-[10px] font-semibold border border-teal-100">
                              {org}
                            </span>
                          ))}
                        </div>
                      </div> */}
                      <div className="space-y-1">
                        <div className="font-bold text-slate-700">Clinics & Specializations:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedHospital.specializations?.map((spec: string) => (
                            <span key={spec} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-semibold border border-blue-100">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: FINANCIAL DEAL INFO (Admin only) */}
                {detailTab === "financial" && isAdmin && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Donor Deal Price</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {selectedHospital.donorDealPrice} {selectedHospital.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: PRICING HISTORY LOG */}
                {detailTab === "history" && isAdmin && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedHospital.pricingHistory?.length === 0 ? (
                      <div className="text-center py-6 text-slate-400">No pricing changes recorded yet.</div>
                    ) : (
                      <div className="divide-y border border-slate-100 dark:border-slate-900 rounded-xl">
                        {selectedHospital.pricingHistory.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 flex justify-between items-center text-[10px]">
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-700 dark:text-slate-300">
                                Deal Price: <span className="font-bold text-teal-600">{item.donorDealPrice} {item.currency}</span>
                              </div>
                              <div className="text-[9px] text-slate-400">
                                Changed by: {item.changedBy?.name || item.changedBy?._id || "Unknown"}
                              </div>
                            </div>
                            <div className="text-slate-400 font-mono text-right">
                              {new Date(item.changedAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
