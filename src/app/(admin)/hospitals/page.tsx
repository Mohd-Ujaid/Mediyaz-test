"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSession } from "@/lib/auth";
import type { ITreatingDoctor } from "@/models/Hospital";
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
  Receipt,
  GitBranch,
  Check,
  Star,
  AlertCircle,
  Stethoscope,
  FileText,
  Globe,
  Building,
  Users,
  UserPlus,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { confirmAction } from "@/components/ui/custom-confirm-modal";

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
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    archived: 0,
  });
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [formTab, setFormTab] = useState<"basic" | "branches" | "financial">("basic");
  const [detailTab, setDetailTab] = useState<"info" | "branches" | "financial" | "history">("info");
  

  // Dedicated Doctor Modal State
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorModalHospitalId, setDoctorModalHospitalId] = useState("");
  const [doctorModalBranchId, setDoctorModalBranchId] = useState("main");
  const [doctorForm, setDoctorForm] = useState<{
    name: string;
    specialization: string;
    regNumber: string;
    phone: string;
    email: string;
    isPrimary: boolean;
    status: "ACTIVE" | "INACTIVE";
  }>({
    name: "",
    specialization: "Infertility & IVF Specialist",
    regNumber: "",
    phone: "",
    email: "",
    isPrimary: false,
    status: "ACTIVE",
  });
  const [editingDoctorData, setEditingDoctorData] = useState<{
    hospitalId: string;
    branchId: string;
    rawName: string;
    docIndex: number;
    isHospitalLevel: boolean;
  } | null>(null);
  const [isDoctorSubmitting, setIsDoctorSubmitting] = useState(false);

  // Temporary input states for adding multiple doctors
  const [newHospitalDoctor, setNewHospitalDoctor] = useState("");
  const [newBranchDoctor, setNewBranchDoctor] = useState("");
  const [newModalBranchDoctor, setNewModalBranchDoctor] = useState("");

  // Initial Branch template
  const initialBranchForm = {
    _id: "",
    branchName: "",
    branchCode: "",
    registrationNumber: "",
    gstNumber: "",
    contactPerson: "",
    email: "",
    mobileNumber: "",
    telephone: "",
    doctorName: "",
    doctors: [] as string[],
    pickupLocation: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    isMainBranch: false,
    status: "ACTIVE"
  };

  // Branch Editor State inside Wizard
  const [branchForm, setBranchForm] = useState<any>(initialBranchForm);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);

  // Dedicated Quick Branch Manager Modal state
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchModalHospital, setBranchModalHospital] = useState<any | null>(null);
  const [isModalAddingBranch, setIsModalAddingBranch] = useState(false);
  const [modalBranchForm, setModalBranchForm] = useState<any>(initialBranchForm);
  const [editingModalBranchId, setEditingModalBranchId] = useState<string | null>(null);
  const [isBranchActionLoading, setIsBranchActionLoading] = useState(false);

  // Form Fields
  const [formFields, setFormFields] = useState<any>({
    name: "",
    shortName: "",
    registrationNumber: "",
    gstNumber: "",
    doctorName: "",
    doctors: [] as string[],
    pickupLocation: "",
    wantInvoice: true,
    tdsPercentage: 2,
    
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
    
    hospitalType: "Proprietor",
    specializations: [],
    branches: [],
    
    eggDonorDealPrice: "",
    eggProfileDonorDealPrice: "",
    spermDonorDealPrice: "",
    spermProfileDonorDealPrice: "",
    serviceCharge: 5000,
    donorDealPrice: "",
    profiledonorDealPrice: "",
    currency: "INR",
    status: "ACTIVE"
  });

  const [newSpec, setNewSpec] = useState("");
  const [newOrgan, setNewOrgan] = useState("");

  const resetForm = () => {
    setFormFields({
      name: "",
      shortName: "",
      registrationNumber: "",
      gstNumber: "",
      doctorName: "",
      doctors: [],
      pickupLocation: "",
      wantInvoice: true,
      tdsPercentage: 2,
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
      hospitalType: "Proprietor",
      specializations: [],
      branches: [],
      eggDonorDealPrice: "",
      eggProfileDonorDealPrice: "",
      spermDonorDealPrice: "",
      spermProfileDonorDealPrice: "",
      serviceCharge: 5000,
      donorDealPrice: "",
      profiledonorDealPrice: "",
      currency: "INR",
      status: "ACTIVE"
    });
    setNewHospitalDoctor("");
    setNewBranchDoctor("");
    setWizardStep(1);
    setFormTab("basic");
    setIsAddingBranch(false);
    setEditingBranchIndex(null);
    setBranchForm(initialBranchForm);
  };

  // Branch handlers for the Wizard Form
  const handleSaveBranch = () => {
    if (!branchForm.branchName?.trim()) {
      toast.error("Branch name is required.");
      return;
    }
    if (!branchForm.registrationNumber?.trim()) {
      toast.error("Branch registration number is required.");
      return;
    }
    if (!branchForm.contactPerson?.trim()) {
      toast.error("Branch contact person is required.");
      return;
    }
    if (!branchForm.mobileNumber?.trim()) {
      toast.error("Branch contact phone is required.");
      return;
    }
    if (!branchForm.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(branchForm.email?.trim())) {
      toast.error("Valid branch email address is required.");
      return;
    }
    if (!branchForm.addressLine1?.trim() || !branchForm.state?.trim() || !branchForm.city?.trim() || !branchForm.pincode?.trim()) {
      toast.error("Complete branch address (Address Line 1, State, City, Pincode) is required.");
      return;
    }

    const currentBranches = [...(formFields.branches || [])];
    const isFirstBranch = currentBranches.length === 0;
    const branchDoctors = Array.isArray(branchForm.doctors) ? branchForm.doctors : [];
    const effectiveDoctorName = branchDoctors.join(", ") || branchForm.doctorName?.trim() || "";

    const newBranch = {
      ...branchForm,
      branchName: branchForm.branchName.trim(),
      branchCode: branchForm.branchCode?.trim() || "",
      registrationNumber: branchForm.registrationNumber.trim(),
      gstNumber: branchForm.gstNumber?.trim() || "",
      doctorName: effectiveDoctorName,
      doctors: branchDoctors,
      contactPerson: branchForm.contactPerson.trim(),
      email: branchForm.email.trim(),
      mobileNumber: branchForm.mobileNumber.trim(),
      telephone: branchForm.telephone?.trim() || "",
      pickupLocation: branchForm.pickupLocation?.trim() || "",
      addressLine1: branchForm.addressLine1.trim(),
      addressLine2: branchForm.addressLine2?.trim() || "",
      city: branchForm.city.trim(),
      state: branchForm.state.trim(),
      country: branchForm.country?.trim() || "India",
      pincode: branchForm.pincode.trim(),
      isMainBranch: isFirstBranch ? true : Boolean(branchForm.isMainBranch),
      status: branchForm.status || "ACTIVE",
      _id: branchForm._id || `temp_${Date.now()}`
    };

    if (newBranch.isMainBranch) {
      currentBranches.forEach((b: any) => { b.isMainBranch = false; });
    }

    if (editingBranchIndex !== null && editingBranchIndex >= 0) {
      currentBranches[editingBranchIndex] = newBranch;
      toast.success("Branch details updated.");
    } else {
      currentBranches.push(newBranch);
      toast.success("Branch added to clinic.");
    }

    // Ensure at least one branch is designated as main
    if (!currentBranches.some((b: any) => b.isMainBranch) && currentBranches.length > 0) {
      currentBranches[0].isMainBranch = true;
    }

    setFormFields({ ...formFields, branches: currentBranches });
    setBranchForm(initialBranchForm);
    setNewBranchDoctor("");
    setIsAddingBranch(false);
    setEditingBranchIndex(null);
  };

  const handleEditBranch = (index: number) => {
    const b = formFields.branches[index];
    if (!b) return;
    const bDoctors = Array.isArray(b.doctors) && b.doctors.length > 0
      ? b.doctors.map((d: any) => typeof d === "string" ? d : d.name).filter(Boolean)
      : (b.doctorName ? b.doctorName.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
    setBranchForm({ ...b, doctors: bDoctors });
    setNewBranchDoctor("");
    setEditingBranchIndex(index);
    setIsAddingBranch(true);
  };

  const handleDeleteBranch = (index: number) => {
    const currentBranches = formFields.branches.filter((_: any, i: number) => i !== index);
    if (currentBranches.length > 0 && !currentBranches.some((b: any) => b.isMainBranch)) {
      currentBranches[0].isMainBranch = true;
    }
    setFormFields({ ...formFields, branches: currentBranches });
    toast.success("Branch removed.");
  };

  const handleSetMainBranch = (index: number) => {
    const currentBranches = formFields.branches.map((b: any, i: number) => ({
      ...b,
      isMainBranch: i === index
    }));
    setFormFields({ ...formFields, branches: currentBranches });
    toast.success("Main branch designated.");
  };

  const openBranchManager = (hosp: any, startAdding: boolean = false) => {
    setBranchModalHospital(hosp);
    setEditingModalBranchId(null);
    setNewModalBranchDoctor("");

    if (startAdding) {
      const hospDoctors = Array.isArray(hosp.doctors)
        ? hosp.doctors.map((d: any) => typeof d === "string" ? d : d.name).filter(Boolean)
        : (hosp.doctorName ? hosp.doctorName.split(",").map((s: string) => s.trim()).filter(Boolean) : []);

      setModalBranchForm({
        ...initialBranchForm,
        registrationNumber: hosp.registrationNumber || "",
        gstNumber: hosp.gstNumber || "",
        contactPerson: hosp.contactPerson || "",
        mobileNumber: hosp.mobileNumber || "",
        email: hosp.email || "",
        addressLine1: hosp.addressLine1 || "",
        addressLine2: hosp.addressLine2 || "",
        city: hosp.city || "",
        state: hosp.state || "",
        pincode: hosp.pincode || "",
        country: hosp.country || "India",
        pickupLocation: hosp.pickupLocation || "",
        doctorName: hosp.doctorName || "",
        doctors: hospDoctors,
        isMainBranch: !hosp.branches || hosp.branches.length === 0,
      });
      setIsModalAddingBranch(true);
    } else {
      setModalBranchForm(initialBranchForm);
      setIsModalAddingBranch(false);
    }
    setIsBranchModalOpen(true);
  };

  const handleModalSaveBranch = async () => {
    if (!modalBranchForm.branchName?.trim()) {
      toast.error("Branch name is required.");
      return;
    }
    if (modalBranchForm.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalBranchForm.email.trim())) {
      toast.error("Please enter a valid branch email address.");
      return;
    }
    if (!branchModalHospital) return;

    setIsBranchActionLoading(true);
    try {
      const isEdit = Boolean(editingModalBranchId);
      const method = isEdit ? "PUT" : "POST";
      const modalDoctors = Array.isArray(modalBranchForm.doctors) ? modalBranchForm.doctors : [];
      const effectiveDoctorName = modalDoctors.join(", ") || modalBranchForm.doctorName?.trim() || "";
      const payloadData = {
        ...modalBranchForm,
        doctorName: effectiveDoctorName,
        doctors: modalDoctors
      };
      const body = isEdit
        ? { ...payloadData, branchId: editingModalBranchId }
        : payloadData;

      const res = await fetch(`/api/hospitals/${branchModalHospital._id}/branches`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (isEdit ? "Branch updated successfully." : "Branch added successfully."));
        const updatedBranches = data.branches;
        setBranchModalHospital({
          ...branchModalHospital,
          branches: updatedBranches
        });
        setHospitals(prev => prev.map(h => h._id === branchModalHospital._id ? { ...h, branches: updatedBranches } : h));
        if (selectedHospital && selectedHospital._id === branchModalHospital._id) {
          setSelectedHospital({ ...selectedHospital, branches: updatedBranches });
        }
        setIsModalAddingBranch(false);
        setEditingModalBranchId(null);
        setModalBranchForm(initialBranchForm);
        setNewModalBranchDoctor("");
      } else {
        toast.error(data.error || "Failed to save branch.");
      }
    } catch (error) {
      toast.error("Network error saving branch.");
    } finally {
      setIsBranchActionLoading(false);
    }
  };

  const handleModalDeleteBranch = async (branchId: string) => {
    const confirmed = await confirmAction({
      title: "Delete Branch",
      message: "Are you sure you want to delete this branch?",
      confirmText: "Yes, Delete Branch",
      variant: "destructive",
    });
    if (!confirmed) return;
    if (!branchModalHospital) return;

    setIsBranchActionLoading(true);
    try {
      const res = await fetch(`/api/hospitals/${branchModalHospital._id}/branches?branchId=${branchId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Branch removed successfully.");
        const updatedBranches = data.branches;
        setBranchModalHospital({
          ...branchModalHospital,
          branches: updatedBranches
        });
        setHospitals(prev => prev.map(h => h._id === branchModalHospital._id ? { ...h, branches: updatedBranches } : h));
        if (selectedHospital && selectedHospital._id === branchModalHospital._id) {
          setSelectedHospital({ ...selectedHospital, branches: updatedBranches });
        }
      } else {
        toast.error(data.error || "Failed to delete branch.");
      }
    } catch (error) {
      toast.error("Network error deleting branch.");
    } finally {
      setIsBranchActionLoading(false);
    }
  };

  const handleModalSetMainBranch = async (branch: any) => {
    if (!branchModalHospital) return;
    setIsBranchActionLoading(true);
    try {
      const res = await fetch(`/api/hospitals/${branchModalHospital._id}/branches`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: branch._id, isMainBranch: true })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Designated as main branch.");
        const updatedBranches = data.branches;
        setBranchModalHospital({
          ...branchModalHospital,
          branches: updatedBranches
        });
        setHospitals(prev => prev.map(h => h._id === branchModalHospital._id ? { ...h, branches: updatedBranches } : h));
        if (selectedHospital && selectedHospital._id === branchModalHospital._id) {
          setSelectedHospital({ ...selectedHospital, branches: updatedBranches });
        }
      } else {
        toast.error(data.error || "Failed to designate main branch.");
      }
    } catch (error) {
      toast.error("Network error designating main branch.");
    } finally {
      setIsBranchActionLoading(false);
    }
  };

  // Step Validation Logic
  const isStep1Valid = Boolean(
    formFields.name?.trim() &&
    formFields.hospitalType?.trim()
  );

  const isStep2Valid = Boolean(
    selectedHospital ||
    branchForm.branchName?.trim() ||
    (formFields.branches && formFields.branches.length > 0)
  );
  const isStep3Valid = true;

  const formSteps = [
    { id: "basic", label: "Hospital / ART Clinic", icon: Building2, desc: "Clinic identity & entity", isValid: isStep1Valid },
    ...(isAdmin ? [{ id: "financial", label: "Default Deals", icon: DollarSign, desc: "Default deal pricing", isValid: isStep3Valid }] : [])
  ];

  const currentStepIndex = formSteps.findIndex(s => s.id === formTab);
  const currentStep = formSteps[currentStepIndex] || formSteps[0];
  const isCurrentStepValid = currentStep?.isValid ?? false;
  const canSubmit = isStep1Valid;

  const getMissingFieldsNote = () => {
    if (wizardStep === 1) {
      const missing = [];
      if (!formFields.name?.trim()) missing.push("Hospital Name");
      if (!formFields.hospitalType?.trim()) missing.push("Hospital Type");
      return missing.length ? `Required: ${missing.join(", ")}` : "";
    }
    return "";
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
      if (fromDateFilter) query += `&startDate=${encodeURIComponent(fromDateFilter)}`;
      if (toDateFilter) query += `&endDate=${encodeURIComponent(toDateFilter)}`;
      // if (organFilter) query += `&organ=${organFilter}`;

      const res = await fetch(query);
      const data = await res.json();

      if (data.success) {
        setHospitals(data.hospitals || []);
        if (data.stats) {
          setStats(data.stats);
        }
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
  }, [currentPage, search, cityFilter, stateFilter, typeFilter, statusFilter, fromDateFilter, toDateFilter]);

  const handleCreateOrUpdate = async (e?: React.FormEvent, skipBranch: boolean = false) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    
    // Validate required fields for the hospital / clinic
    if (!formFields.name?.trim() || !formFields.hospitalType?.trim()) {
      toast.error("Please enter Hospital / Clinic Name and Hospital Type.");
      setWizardStep(1);
      return;
    }

    // For new hospital registration, at least 1 branch is strictly mandatory
    if (!selectedHospital) {
      if (!branchForm.branchName?.trim() && (!formFields.branches || formFields.branches.length === 0)) {
        toast.error("At least 1 branch is required to register the hospital / clinic.");
        setWizardStep(2);
        return;
      }
    }

    if (!skipBranch && wizardStep === 2) {
      if (!branchForm.branchName?.trim()) {
        toast.error("Please enter Branch Name (e.g. Main Center).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const hospitalDoctorList = Array.isArray(formFields.doctors)
        ? formFields.doctors.map((d: any) => typeof d === "string" ? { name: d.trim() } : d).filter((d: any) => d.name)
        : [];
      const hospitalDoctorString = hospitalDoctorList.map((d: any) => d.name).join(", ");

      let normalizedBranches = (formFields.branches || []).map((b: any) => {
        const bDocs = Array.isArray(b.doctors)
          ? b.doctors.map((d: any) => typeof d === "string" ? { name: d.trim() } : d).filter((d: any) => d.name)
          : [];
        return {
          ...b,
          doctors: bDocs,
          doctorName: bDocs.map((d: any) => d.name).join(", ") || b.doctorName || ""
        };
      });

      const parsedEggNormal = formFields.eggDonorDealPrice !== "" && formFields.eggDonorDealPrice !== undefined
        ? Number(formFields.eggDonorDealPrice)
        : 0;
      const parsedEggProfile = formFields.eggProfileDonorDealPrice !== "" && formFields.eggProfileDonorDealPrice !== undefined
        ? Number(formFields.eggProfileDonorDealPrice)
        : 0;
      const parsedSpermNormal = formFields.spermDonorDealPrice !== "" && formFields.spermDonorDealPrice !== undefined
        ? Number(formFields.spermDonorDealPrice)
        : 0;
      const parsedSpermProfile = formFields.spermProfileDonorDealPrice !== "" && formFields.spermProfileDonorDealPrice !== undefined
        ? Number(formFields.spermProfileDonorDealPrice)
        : 0;

      // If a branch is specified in Step 2, append it
      if (!skipBranch && branchForm.branchName?.trim()) {
        const branchDoctors = Array.isArray(branchForm.doctors)
          ? branchForm.doctors.map((d: any) => typeof d === "string" ? { name: d.trim() } : d).filter((d: any) => d.name)
          : [];
        const effectiveDoctorName = branchDoctors.map((d: any) => d.name).join(", ") || branchForm.doctorName?.trim() || "";

        const { _id: branchRawId, ...cleanBranchForm } = branchForm;
        const newBranch = {
          ...cleanBranchForm,
          branchName: branchForm.branchName.trim(),
          branchCode: branchForm.branchCode?.trim() || "",
          registrationNumber: branchForm.registrationNumber?.trim() || "",
          gstNumber: branchForm.gstNumber?.trim() || "",
          doctorName: effectiveDoctorName,
          doctors: branchDoctors,
          contactPerson: branchForm.contactPerson?.trim() || "",
          email: branchForm.email?.trim() || "",
          mobileNumber: branchForm.mobileNumber?.trim() || "",
          telephone: branchForm.telephone?.trim() || "",
          pickupLocation: branchForm.pickupLocation?.trim() || "",
          addressLine1: branchForm.addressLine1?.trim() || "",
          addressLine2: branchForm.addressLine2?.trim() || "",
          city: branchForm.city?.trim() || "",
          state: branchForm.state?.trim() || "",
          country: branchForm.country?.trim() || "India",
          pincode: branchForm.pincode?.trim() || "",
          isMainBranch: normalizedBranches.length === 0 ? true : Boolean(branchForm.isMainBranch),
          status: branchForm.status || "ACTIVE",
          eggDonorDealPrice: parsedEggNormal,
          eggProfileDonorDealPrice: parsedEggProfile,
          spermDonorDealPrice: parsedSpermNormal,
          spermProfileDonorDealPrice: parsedSpermProfile,
          serviceCharge: Number(formFields.serviceCharge || 5000),
          tdsPercentage: Number(formFields.tdsPercentage || 2),
          wantInvoice: Boolean(formFields.wantInvoice !== false),
          ...(branchRawId && branchRawId.length === 24 ? { _id: branchRawId } : {})
        };

        if (newBranch.isMainBranch) {
          normalizedBranches.forEach((b: any) => { b.isMainBranch = false; });
        }
        normalizedBranches.push(newBranch);
      }

      // Ensure at least one branch is main if branches exist
      if (normalizedBranches.length > 0 && !normalizedBranches.some((b: any) => b.isMainBranch)) {
        normalizedBranches[0].isMainBranch = true;
      }

      const payload = {
        ...formFields,
        eggDonorDealPrice: parsedEggNormal,
        donorDealPrice: parsedEggNormal,
        eggProfileDonorDealPrice: parsedEggProfile,
        profiledonorDealPrice: parsedEggProfile,
        spermDonorDealPrice: parsedSpermNormal,
        spermProfileDonorDealPrice: parsedSpermProfile,
        branches: normalizedBranches,
        doctors: hospitalDoctorList,
        doctorName: hospitalDoctorString || formFields.doctorName || "",
      };

      const url = selectedHospital ? `/api/hospitals/${selectedHospital._id}` : "/api/hospitals";
      const method = selectedHospital ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        const isNewHospital = !selectedHospital;
        const createdOrUpdatedHosp = data.hospital;
        toast.success(isNewHospital ? "Hospital registered successfully!" : "Hospital details updated successfully.");
        setIsFormOpen(false);
        resetForm();
        setSelectedHospital(null);
        await loadHospitals();

        if (isNewHospital && createdOrUpdatedHosp && (!createdOrUpdatedHosp.branches || createdOrUpdatedHosp.branches.length === 0)) {
          openBranchManager(createdOrUpdatedHosp, true);
        }
      } else {
        toast.error(data.error || "Operation failed.");
      }
    } catch (error) {
      toast.error("Network error during operation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (hosp: any) => {
    setSelectedHospital(hosp);
    // Parse doctors for the hospital
    const loadedHospitalDoctors = Array.isArray(hosp.doctors) && hosp.doctors.length > 0
      ? hosp.doctors.map((d: any) => typeof d === "string" ? d : d.name).filter(Boolean)
      : (hosp.doctorName ? hosp.doctorName.split(",").map((s: string) => s.trim()).filter(Boolean) : []);

    let initialBranches = Array.isArray(hosp.branches) && hosp.branches.length > 0
      ? hosp.branches.map((b: any) => ({
          ...b,
          doctors: Array.isArray(b.doctors) && b.doctors.length > 0
            ? b.doctors.map((d: any) => typeof d === "string" ? d : d.name).filter(Boolean)
            : (b.doctorName ? b.doctorName.split(",").map((s: string) => s.trim()).filter(Boolean) : [])
        }))
      : [];

    setFormFields({
      name: hosp.name || "",
      shortName: hosp.shortName || "",
      registrationNumber: hosp.registrationNumber || "",
      gstNumber: hosp.gstNumber || "",
      doctorName: hosp.doctorName || "",
      doctors: loadedHospitalDoctors,
      pickupLocation: hosp.pickupLocation || "",
      wantInvoice: hosp.wantInvoice !== undefined ? hosp.wantInvoice : true,
      tdsPercentage: hosp.tdsPercentage !== undefined ? hosp.tdsPercentage : 2,
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
      hospitalType: hosp.hospitalType || "Proprietor",
      specializations: hosp.specializations || [],
      branches: initialBranches,
      eggDonorDealPrice: hosp.eggDonorDealPrice ?? hosp.donorDealPrice ?? "",
      eggProfileDonorDealPrice: hosp.eggProfileDonorDealPrice ?? hosp.profiledonorDealPrice ?? "",
      spermDonorDealPrice: hosp.spermDonorDealPrice ?? "",
      spermProfileDonorDealPrice: hosp.spermProfileDonorDealPrice ?? "",
      serviceCharge: hosp.serviceCharge || 5000,
      donorDealPrice: hosp.eggDonorDealPrice ?? hosp.donorDealPrice ?? "",
      profiledonorDealPrice: hosp.eggProfileDonorDealPrice ?? hosp.profiledonorDealPrice ?? "",
      currency: hosp.currency || "INR",
      status: hosp.status || "ACTIVE"
    });
    setNewHospitalDoctor("");
    setNewBranchDoctor("");
    setWizardStep(1);
    setFormTab("basic");
    setIsAddingBranch(false);
    setEditingBranchIndex(null);
    setBranchForm(initialBranchForm);
    setIsFormOpen(true);
  };

  const handleSoftDelete = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Archive Hospital",
      message: "Are you sure you want to soft delete this hospital profile? It will be archived and hidden from general assignments.",
      confirmText: "Yes, Archive Hospital",
      variant: "destructive",
    });
    if (!confirmed) return;
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

  const handleToggleHospitalStatus = (h: any) => {
    const nextStatus = h.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    handleUpdateStatus(h._id, nextStatus);
  };

  const openClinicDashboard = (h: any, tab: "info" | "branches" | "financial" | "history" = "info") => {
    setSelectedHospital(h);
    setDetailTab(tab);
    setIsDetailOpen(true);
  };

  // Multiple Doctor helpers for Hospital and Branches
  const addHospitalDoctor = () => {
    const trimmed = newHospitalDoctor.trim();
    if (!trimmed) return;
    const current = formFields.doctors || [];
    if (!current.includes(trimmed)) {
      setFormFields({ ...formFields, doctors: [...current, trimmed] });
    }
    setNewHospitalDoctor("");
  };

  const removeHospitalDoctor = (idx: number) => {
    const current = (formFields.doctors || []).filter((_: any, i: number) => i !== idx);
    setFormFields({ ...formFields, doctors: current });
  };

  const addBranchDoctor = () => {
    const trimmed = newBranchDoctor.trim();
    if (!trimmed) return;
    const current = branchForm.doctors || [];
    if (!current.includes(trimmed)) {
      setBranchForm({ ...branchForm, doctors: [...current, trimmed] });
    }
    setNewBranchDoctor("");
  };

  const removeBranchDoctor = (idx: number) => {
    const current = (branchForm.doctors || []).filter((_: any, i: number) => i !== idx);
    setBranchForm({ ...branchForm, doctors: current });
  };

  const addModalBranchDoctor = () => {
    const trimmed = newModalBranchDoctor.trim();
    if (!trimmed) return;
    const current = modalBranchForm.doctors || [];
    if (!current.includes(trimmed)) {
      setModalBranchForm({ ...modalBranchForm, doctors: [...current, trimmed] });
    }
    setNewModalBranchDoctor("");
  };

  const removeModalBranchDoctor = (idx: number) => {
    const current = (modalBranchForm.doctors || []).filter((_: any, i: number) => i !== idx);
    setModalBranchForm({ ...modalBranchForm, doctors: current });
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

  // --- DOCTOR MANAGEMENT HANDLERS ---
  const openAddDoctorModal = (prefillHospitalId?: string, prefillBranchId?: string) => {
    setEditingDoctorData(null);
    setDoctorModalHospitalId(prefillHospitalId || (hospitals[0]?._id ?? ""));
    setDoctorModalBranchId(prefillBranchId || "main");
    setDoctorForm({
      name: "",
      specialization: "Infertility & IVF Specialist",
      regNumber: "",
      phone: "",
      email: "",
      isPrimary: false,
      status: "ACTIVE",
    });
    setIsDoctorModalOpen(true);
  };

  const openEditDoctorModal = (doc: any) => {
    setEditingDoctorData({
      hospitalId: doc.hospital._id,
      branchId: doc.branchId || "main",
      rawName: doc.rawName || doc.name,
      docIndex: doc.docIndex,
      isHospitalLevel: doc.isHospitalLevel,
    });
    setDoctorModalHospitalId(doc.hospital._id);
    setDoctorModalBranchId(doc.branchId || "main");
    setDoctorForm({
      name: doc.name.replace(/^Dr\.?\s*/i, ""),
      specialization: doc.specialization === "Treating Doctor" ? "Infertility & IVF Specialist" : doc.specialization,
      regNumber: doc.regNumber === "—" ? "" : doc.regNumber,
      phone: doc.phone === "—" ? "" : doc.phone,
      email: doc.email === "—" ? "" : doc.email,
      isPrimary: Boolean(doc.isPrimary),
      status: doc.status || "ACTIVE",
    });
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name.trim()) {
      toast.error("Doctor's full name is required.");
      return;
    }
    if (!doctorModalHospitalId) {
      toast.error("Please select an ART partner clinic.");
      return;
    }

    const targetHosp = hospitals.find((h) => h._id === doctorModalHospitalId);
    if (!targetHosp) {
      toast.error("Selected clinic not found.");
      return;
    }

    setIsDoctorSubmitting(true);
    try {
      const cleanName = `Dr. ${doctorForm.name.trim().replace(/^Dr\.?\s*/i, "")}`;
      const doctorPayload: ITreatingDoctor = {
        name: cleanName,
        specialization: doctorForm.specialization.trim() || "Infertility & IVF Specialist",
        regNumber: doctorForm.regNumber.trim() || undefined,
        phone: doctorForm.phone.trim() || undefined,
        email: doctorForm.email.trim() || undefined,
        isPrimary: doctorForm.isPrimary,
        status: doctorForm.status || "ACTIVE",
      };

      let updatedHospDocs = Array.isArray(targetHosp.doctors)
        ? [...targetHosp.doctors.map((d: any) => typeof d === "string" ? { name: d } : { ...d })]
        : [];
      let updatedBranches = Array.isArray(targetHosp.branches)
        ? targetHosp.branches.map((b: any) => ({
            ...b,
            doctors: Array.isArray(b.doctors)
              ? [...b.doctors.map((d: any) => typeof d === "string" ? { name: d } : { ...d })]
              : [],
          }))
        : [];

      if (editingDoctorData) {
        if (editingDoctorData.hospitalId !== doctorModalHospitalId) {
          const oldHosp = hospitals.find((h) => h._id === editingDoctorData.hospitalId);
          if (oldHosp) {
            let oldDocs = Array.isArray(oldHosp.doctors)
              ? oldHosp.doctors.filter((d: any) => (typeof d === "string" ? d : d.name).toLowerCase() !== editingDoctorData.rawName.toLowerCase())
              : [];
            let oldBranches = (oldHosp.branches || []).map((b: any) => ({
              ...b,
              doctors: Array.isArray(b.doctors)
                ? b.doctors.filter((d: any) => (typeof d === "string" ? d : d.name).toLowerCase() !== editingDoctorData.rawName.toLowerCase())
                : [],
            }));
            await fetch(`/api/hospitals/${oldHosp._id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ doctors: oldDocs, branches: oldBranches }),
            });
          }
        } else {
          if (editingDoctorData.isHospitalLevel) {
            updatedHospDocs = updatedHospDocs.filter((d: any, idx: number) =>
              idx !== editingDoctorData.docIndex && (typeof d === "string" ? d : d.name).toLowerCase() !== editingDoctorData.rawName.toLowerCase()
            );
          } else {
            updatedBranches = updatedBranches.map((b: any) => {
              if (b._id === editingDoctorData.branchId || b.branchName === editingDoctorData.branchId) {
                return {
                  ...b,
                  doctors: (b.doctors || []).filter((d: any, idx: number) =>
                    idx !== editingDoctorData.docIndex && (typeof d === "string" ? d : d.name).toLowerCase() !== editingDoctorData.rawName.toLowerCase()
                  ),
                };
              }
              return b;
            });
          }
        }
      }

      if (doctorModalBranchId === "main") {
        updatedHospDocs.push(doctorPayload);
      } else {
        updatedBranches = updatedBranches.map((b: any) => {
          if (b._id === doctorModalBranchId || b.branchName === doctorModalBranchId) {
            return {
              ...b,
              doctors: [...(b.doctors || []), doctorPayload],
            };
          }
          return b;
        });
      }

      const res = await fetch(`/api/hospitals/${doctorModalHospitalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctors: updatedHospDocs,
          branches: updatedBranches,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingDoctorData ? "Doctor details updated successfully!" : "Doctor registered successfully!");
        setIsDoctorModalOpen(false);
        setEditingDoctorData(null);
        await loadHospitals();
      } else {
        toast.error(data.error || "Failed to save doctor.");
      }
    } catch (err) {
      toast.error("Error saving doctor details.");
    } finally {
      setIsDoctorSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (doc: any) => {
    const confirmed = await confirmAction({
      title: "Remove Doctor",
      message: `Are you sure you want to remove ${doc.name} from ${doc.hospital.name}?`,
      confirmText: "Yes, Remove Doctor",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const targetHosp = hospitals.find((h) => h._id === doc.hospital._id);
      if (!targetHosp) return;

      let updatedHospDocs = Array.isArray(targetHosp.doctors)
        ? [...targetHosp.doctors.map((d: any) => typeof d === "string" ? { name: d } : { ...d })]
        : [];
      let updatedBranches = Array.isArray(targetHosp.branches)
        ? targetHosp.branches.map((b: any) => ({
            ...b,
            doctors: Array.isArray(b.doctors)
              ? [...b.doctors.map((d: any) => typeof d === "string" ? { name: d } : { ...d })]
              : [],
          }))
        : [];

      if (doc.isHospitalLevel) {
        updatedHospDocs = updatedHospDocs.filter((d: any, idx: number) => {
          const dName = typeof d === "string" ? d : d.name;
          return idx !== doc.docIndex && dName?.toLowerCase() !== doc.rawName?.toLowerCase();
        });
      } else {
        updatedBranches = updatedBranches.map((b: any) => {
          if (b._id === doc.branchId || b.branchName === doc.branchName) {
            return {
              ...b,
              doctors: (b.doctors || []).filter((d: any, idx: number) => {
                const dName = typeof d === "string" ? d : d.name;
                return idx !== doc.docIndex && dName?.toLowerCase() !== doc.rawName?.toLowerCase();
              }),
            };
          }
          return b;
        });
      }

      const res = await fetch(`/api/hospitals/${targetHosp._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctors: updatedHospDocs,
          branches: updatedBranches,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${doc.name} removed successfully.`);
        await loadHospitals();
      } else {
        toast.error(data.error || "Failed to remove doctor.");
      }
    } catch (err) {
      toast.error("Failed to remove doctor.");
    }
  };


  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" /> ART Clinics &amp; Hospitals
          </h1>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={exportCsv}
              variant="outline"
              className="rounded-xl text-xs gap-1 border-slate-200"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button
              id="btn-add-partner-hospital"
              onClick={() => { resetForm(); setSelectedHospital(null); setIsFormOpen(true); }}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1 cursor-pointer shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" /> Add Partner Hospital
            </Button>
          </div>
        )}
      </div>
          {/* Interactive Hospital Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            key: "",
            title: "Total Clinics",
            count: stats.total || hospitals.length,
            textColor: "text-teal-600 dark:text-teal-400",
            borderHover: "hover:border-teal-300 dark:hover:border-teal-700",
            activeBorder: "border-teal-500 dark:border-teal-400 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20",
            badgeBg: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
          },
          {
            key: "ACTIVE",
            title: "Active Centers",
            count: stats.active,
            textColor: "text-emerald-600 dark:text-emerald-400",
            borderHover: "hover:border-emerald-300 dark:hover:border-emerald-700",
            activeBorder: "border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20",
            badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
          },
          {
            key: "INACTIVE",
            title: "Inactive Centers",
            count: stats.inactive,
            textColor: "text-amber-600 dark:text-amber-400",
            borderHover: "hover:border-amber-300 dark:hover:border-amber-700",
            activeBorder: "border-amber-500 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20",
            badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
          },
          {
            key: "ARCHIVED",
            title: "Archived Clinics",
            count: stats.archived,
            textColor: "text-rose-600 dark:text-rose-400",
            borderHover: "hover:border-rose-300 dark:hover:border-rose-700",
            activeBorder: "border-rose-500 dark:border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20",
            badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
          },
        ].map((item) => {
          const isSelected = statusFilter === item.key;
          return (
            <button
              key={item.key || "all"}
              type="button"
              onClick={() => {
                setStatusFilter(item.key);
                setCurrentPage(1);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left relative overflow-hidden group shadow-2xs ${
                isSelected
                  ? item.activeBorder
                  : `border-slate-200/80 dark:border-slate-800 bg-card ${item.borderHover} hover:shadow-sm`
              }`}
              title={`Click to filter by ${item.title}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[11px] font-semibold uppercase tracking-wider truncate ${item.textColor}`}>
                  {item.title}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0 animate-pulse" />
                )}
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${item.textColor}`}>
                  {item.count}
                </span>
                {isSelected && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${item.badgeBg}`}>
                    Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Advanced Filters Panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by clinic name, code, contact..."
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
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Partner</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived (Soft deleted)</option>
            </select>
          </div>

          {/* States Filter */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setCityFilter("");
              }}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">Select State (All)</option>
              {INDIAN_STATES.filter(s => s !== "Other").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">Select City (All)</option>
              {(STATE_CITIES[stateFilter] || []).filter((c) => c !== "Other").map((c) => ( 
                <option key={c} value={c}>{c}</option>
              ))} 
              {(STATE_CITIES[stateFilter] || []).includes("Other") && <option value="Other">Other</option>}
            </select>
          </div>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-900 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-500 flex items-center gap-1.5">
              Registration Date Range:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={fromDateFilter}
                onChange={(e) => setFromDateFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={toDateFilter}
                onChange={(e) => setToDateFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
            {(fromDateFilter || toDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setFromDateFilter("");
                  setToDateFilter("");
                }}
                className="text-[11px] text-rose-500 hover:text-rose-600 underline font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>

          {(search || statusFilter || stateFilter || cityFilter || fromDateFilter || toDateFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setStateFilter("");
                setCityFilter("");
                setFromDateFilter("");
                setToDateFilter("");
                setCurrentPage(1);
              }}
              className="h-8 text-xs text-slate-600 hover:text-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            >
              Reset All Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <DataTableSkeleton rows={6} hasCheckbox={false} />
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
                  <th className="p-3.5">Hospital Deal</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {hospitals.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{h.name}</span>
                          {h.shortName && <span className="text-[10px] text-slate-400 font-sans">({h.shortName})</span>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {h.branches && h.branches.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => openBranchManager(h, false)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 hover:bg-teal-100 transition-colors cursor-pointer"
                              title="Click to view and manage branches"
                            >
                              <GitBranch className="w-3 h-3 text-teal-600" />
                              <span>{h.branches.length} {h.branches.length === 1 ? "Branch" : "Branches"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openBranchManager(h, true)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                              title="No branches added yet. Click to add a branch!"
                            >
                              <Plus className="w-3 h-3 text-amber-600" />
                              <span>+ Add Branch</span>
                            </button>
                          )}

                          {h.doctors && h.doctors.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => openClinicDashboard(h, "info")}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 hover:bg-purple-100 transition-colors cursor-pointer"
                              title="Click to view clinic details"
                            >
                              <Stethoscope className="w-3 h-3 text-purple-600" />
                              <span>{h.doctors.length} {h.doctors.length === 1 ? "Doctor" : "Doctors"}</span>
                            </button>
                          ) : h.doctorName ? (
                            <button
                              type="button"
                              onClick={() => openClinicDashboard(h, "info")}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                              title="Click to view clinic details"
                            >
                              <Stethoscope className="w-2.5 h-2.5 text-purple-500" />
                              <span>Dr. {h.doctorName.replace(/^Dr\.?\s*/i, "")}</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono text-[11px]">{h.registrationNumber || "—"}</td>
                    <td className="p-3.5 text-slate-600">{h.hospitalType || "Clinic / Hospital"}</td>
                    <td className="p-3.5 text-slate-600">
                      {[h.city, h.state].filter(Boolean).join(", ") || (
                        <span className="text-slate-400 italic text-[11px]">Location unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {h.contactPerson || h.mobileNumber ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {h.contactPerson || "—"}
                          </div>
                          {h.mobileNumber && <div className="text-[10px] text-slate-400 font-mono">{h.mobileNumber}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No contact listed</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleHospitalStatus(h)}
                        disabled={!isAdmin}
                        title={isAdmin ? `Click to toggle status (Currently ${h.status || "ACTIVE"})` : `Status: ${h.status || "ACTIVE"}`}
                        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          h.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 hover:bg-emerald-100"
                            : h.status === "INACTIVE"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 hover:bg-rose-100"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 hover:bg-amber-100"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${h.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        <span>{h.status || "ACTIVE"}</span>
                        {isAdmin && <span className="opacity-0 group-hover:opacity-100 text-[9px] text-slate-400 ml-0.5">⇄</span>}
                      </button>
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1 py-0.5 rounded border border-teal-200/50">Egg</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{(h.eggDonorDealPrice || h.donorDealPrice || 65000).toLocaleString()}</span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">/ ₹{(h.eggProfileDonorDealPrice || h.profiledonorDealPrice || 85000).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded border border-blue-200/50">Sperm</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{(h.spermDonorDealPrice || 15000).toLocaleString()}</span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">/ ₹{(h.spermProfileDonorDealPrice || 25000).toLocaleString()}</span>
                        </div>
                      </div>
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
                              onClick={() => openClinicDashboard(h, "info")}
                              className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                            >
                              <Eye className="w-4 h-4 text-blue-600" /> View Clinic Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openBranchManager(h, true)}
                              className="text-xs font-semibold cursor-pointer flex items-center gap-2 py-2 text-teal-700 dark:text-teal-400"
                            >
                              <Plus className="w-4 h-4 text-teal-600" /> + Add Branch
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openBranchManager(h, false)}
                              className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-slate-700 dark:text-slate-300"
                            >
                              <GitBranch className="w-4 h-4 text-slate-500" /> Manage Branches ({h.branches?.length || 0})
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleToggleHospitalStatus(h)}
                                  className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                                >
                                  <RefreshCw className="w-4 h-4 text-slate-600" />
                                  <span>Mark as {h.status === "ACTIVE" ? "Inactive" : "Active"}</span>
                                </DropdownMenuItem>
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
          <CustomPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            itemName="hospitals"
          />
        )}
        </Card>


      {/* DIALOG 1: ADD / EDIT PARTNER CLINIC WITH 2-STEP WIZARD */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto p-0 border border-slate-200 dark:border-slate-800 shadow-2xl">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 dark:from-slate-900 dark:to-teal-950/30 p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 ring-1 ring-teal-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {selectedHospital ? "Edit Hospital / ART Clinic" : "Register Hospital / ART Clinic"}
                  </DialogTitle>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                    Step {wizardStep} of 2
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {wizardStep === 1 
                    ? "Step 1: Basic Information, Invoicing & ART Bank Donor Deals" 
                    : `Step 2: Add Branch Location for ${formFields.name || "Clinic"}`}
                </DialogDescription>
              </div>
            </div>

            {/* Step Progress Indicators */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                  wizardStep === 1
                    ? "bg-white dark:bg-slate-800 border-teal-500 shadow-sm ring-1 ring-teal-500/20"
                    : "bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  wizardStep === 1 
                    ? "bg-teal-600 text-white" 
                    : isStep1Valid 
                      ? "bg-emerald-600 text-white" 
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                  {isStep1Valid && wizardStep !== 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">1. Basic Info &amp; Deals</div>
                  <div className="text-[10px] text-slate-400">Name, Invoicing &amp; Donor Deals</div>
                </div>
              </button>

              <button
                type="button"
                disabled={!isStep1Valid}
                onClick={() => isStep1Valid && setWizardStep(2)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                  wizardStep === 2
                    ? "bg-white dark:bg-slate-800 border-teal-500 shadow-sm ring-1 ring-teal-500/20"
                    : isStep1Valid
                      ? "bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      : "opacity-50 cursor-not-allowed bg-slate-50/30 border-dashed border-slate-200 text-slate-400"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  wizardStep === 2 
                    ? "bg-teal-600 text-white" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                  2
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">2. Add Branch Center</div>
                  <div className="text-[10px] text-slate-400">Address, Contact &amp; Doctors</div>
                </div>
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (wizardStep === 1) {
                if (isStep1Valid) setWizardStep(2);
              } else {
                handleCreateOrUpdate(e, false);
              }
            }}
            className="p-6 space-y-5 text-xs"
          >
            {/* STEP 1: BASIC INFORMATION, INVOICE & SERVICE CHARGES / DEALS */}
            {wizardStep === 1 && (
              <>
                {/* Guidance banner */}
                <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 flex items-start gap-2.5 text-xs text-teal-800 dark:text-teal-300">
                  <Building2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    Fill in the hospital basic details, invoicing settings, and donor deals. Branch details (Address, Reg No, GST, and Treatment Doctors) will be added in Step 2.
                  </span>
                </div>

                {/* 1. CLINIC IDENTIFICATION & TYPE */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>1. Hospital Identification &amp; Type</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Hospital / ART Clinic Name <span className="text-red-500">*</span></span>
                        {formFields.name?.trim() && <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5"><Check className="w-3 h-3" /> Filled</span>}
                      </label>
                      <input
                        id="input-hospital-name"
                        type="text"
                        value={formFields.name}
                        onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-medium"
                        placeholder="e.g. Apollo Fertility"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        <span>Hospital Type <span className="text-red-500">*</span></span>
                      </label>
                      <select
                        id="select-hospital-type"
                        value={formFields.hospitalType}
                        onChange={(e) => setFormFields({ ...formFields, hospitalType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="Proprietor">Proprietor</option>
                        <option value="LLP">LLP</option>
                        <option value="Private Limited">Private Limited</option>
                        <option value="Trust / Society">Trust / Society</option>
                        <option value="Other Option">Other Option</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. INVOICING & TAX SETTINGS */}
                <div className="space-y-3 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <FileText className="w-3.5 h-3.5" />
                    <span>2. Invoicing &amp; Tax Settings</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Want Tax Invoice?</label>
                      <select
                        id="select-want-invoice"
                        value={formFields.wantInvoice ? "YES" : "NO"}
                        onChange={(e) => setFormFields({ ...formFields, wantInvoice: e.target.value === "YES" })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="YES">Yes (Generate Tax Invoice)</option>
                        <option value="NO">No (Direct Receipt / Voucher)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Standard TDS Rate (%)</label>
                      <div className="relative">
                        <input
                          id="input-tds-percentage"
                          type="number"
                          step="0.1"
                          min="0"
                          max="30"
                          value={formFields.tdsPercentage !== undefined && formFields.tdsPercentage !== null ? formFields.tdsPercentage : ""}
                          onChange={(e) => setFormFields({ ...formFields, tdsPercentage: e.target.value === "" ? ("" as any) : Number(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 pr-8 font-mono"
                          placeholder="Standard 2%"
                        />
                        <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Standard TDS rate is 2% (Section 194C / 194J)</div>
                    </div>
                  </div>
                </div>

                {/* 3. DONOR DEALS */}
                <div className="space-y-3 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>3. ART Bank Donor Deals</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Agreed Donor Pricing</span>
                  </div>

                  {/* Egg Donor Deals */}
                  <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-teal-950/20 dark:to-emerald-950/10 p-3.5 rounded-xl border border-teal-100 dark:border-teal-900/40 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Egg Donor Deals</h4>
                      <span className="text-[10px] text-teal-600 bg-teal-100 dark:bg-teal-950 px-1.5 py-0.5 rounded font-semibold ml-auto">Oocyte Gamete</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Normal Egg Donor Deal (₹)</label>
                        <input
                          id="input-egg-deal"
                          type="number"
                          value={formFields.eggDonorDealPrice ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setFormFields({ ...formFields, eggDonorDealPrice: val, donorDealPrice: val });
                          }}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="Enter deal amount (₹)"
                        />
                        <span className="text-[10px] text-slate-400">General egg donor deal</span>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Profile Egg Donor Deal (₹)</label>
                        <input
                          id="input-egg-profile-deal"
                          type="number"
                          value={formFields.eggProfileDonorDealPrice ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setFormFields({ ...formFields, eggProfileDonorDealPrice: val, profiledonorDealPrice: val });
                          }}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="Enter deal amount (₹)"
                        />
                        <span className="text-[10px] text-slate-400">Profile / VIP egg donor deal</span>
                      </div>
                    </div>
                  </div>

                  {/* Sperm Donor Deals */}
                  <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Sperm Donor Deals</h4>
                      <span className="text-[10px] text-blue-600 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded font-semibold ml-auto">Semen Gamete</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Normal Sperm Donor Deal (₹)</label>
                        <input
                          id="input-sperm-deal"
                          type="number"
                          value={formFields.spermDonorDealPrice ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setFormFields({ ...formFields, spermDonorDealPrice: val });
                          }}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="Enter deal amount (₹)"
                        />
                        <span className="text-[10px] text-slate-400">General sperm donor deal</span>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Profile Sperm Donor Deal (₹)</label>
                        <input
                          id="input-sperm-profile-deal"
                          type="number"
                          value={formFields.spermProfileDonorDealPrice ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setFormFields({ ...formFields, spermProfileDonorDealPrice: val });
                          }}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-blue-500 font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="Enter deal amount (₹)"
                        />
                        <span className="text-[10px] text-slate-400">Profile / specific attributes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 1 Action Footer */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-xl text-xs h-9 px-4 border-slate-200 dark:border-slate-800"
                  >
                    Cancel
                  </Button>

                  <div className="flex items-center gap-2">
                    {selectedHospital && (
                      <Button
                        id="btn-register-without-branch"
                        type="button"
                        disabled={!isStep1Valid || isSubmitting}
                        onClick={() => handleCreateOrUpdate(undefined, true)}
                        variant="outline"
                        className="rounded-xl text-xs h-9 px-4 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-900/50 dark:text-teal-300 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Save Hospital Details Only"
                        )}
                      </Button>
                    )}
                    <Button
                      id="btn-continue-step2"
                      type="button"
                      disabled={!isStep1Valid}
                      onClick={() => setWizardStep(2)}
                      className={`rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold transition-all ${
                        isStep1Valid
                          ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 cursor-pointer"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      <span>Continue to Add Branch</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: ADD BRANCH CENTER */}
            {wizardStep === 2 && (
              <>
                {/* Context Banner */}
                <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 flex items-start justify-between gap-2.5 text-xs">
                  <div className="flex items-start gap-2.5 text-teal-900 dark:text-teal-200">
                    <GitBranch className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Branch Location for {formFields.name || "Hospital"}</div>
                      <div className="text-[11px] text-teal-700/80 dark:text-teal-400 mt-0.5">
                        Enter the operational branch center details where treatments and procedures occur. (Minimum 1 branch required to register)
                      </div>
                    </div>
                  </div>
                  {formFields.branches?.length > 0 && (
                    <span className="text-[10px] font-semibold bg-teal-200/60 dark:bg-teal-900 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full shrink-0">
                      {formFields.branches.length} existing {formFields.branches.length === 1 ? "branch" : "branches"}
                    </span>
                  )}
                </div>

                {/* 1. BRANCH IDENTIFICATION */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>1. Branch Center Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Branch Name <span className="text-red-500">*</span></span>
                        {branchForm.branchName?.trim() && <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5"><Check className="w-3 h-3" /> Filled</span>}
                      </label>
                      <input
                        id="input-branch-name"
                        type="text"
                        value={branchForm.branchName}
                        onChange={(e) => setBranchForm({ ...branchForm, branchName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-medium"
                        placeholder="e.g. Main Center / South Delhi Branch / Gurugram Center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">ART Registration No.</label>
                      <input
                        id="input-branch-art-reg"
                        type="text"
                        value={branchForm.registrationNumber || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, registrationNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                        placeholder="e.g. ART-BANK-DE-2024-001"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">GSTIN (Branch Tax ID)</label>
                      <input
                        id="input-branch-gstin"
                        type="text"
                        value={branchForm.gstNumber || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, gstNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                        placeholder="e.g. 09AAACH5422A1Z9"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. PRIMARY CONTACT & MEDICAL IN-CHARGE */}
                <div className="space-y-3 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Users className="w-3.5 h-3.5" />
                    <span>2. Primary Contact &amp; Medical In-Charge</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Contact Person / In-Charge</label>
                      <input
                        id="input-branch-contact"
                        type="text"
                        value={branchForm.contactPerson || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, contactPerson: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        placeholder="e.g. Dr. Anita Gupta / Mr. Sharma"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Mobile Phone</label>
                      <input
                        id="input-branch-mobile"
                        type="text"
                        value={branchForm.mobileNumber || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, mobileNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        placeholder="e.g. +91 96939 28745"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Clinical Email</label>
                      <input
                        id="input-branch-email"
                        type="email"
                        value={branchForm.email || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        placeholder="e.g. artdesk@clinic.com"
                      />
                    </div>

                    {/* Branch Treating Doctors */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                        <span>Treating Doctors (OPU / Embryo Transfer)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="input-branch-doctor"
                          type="text"
                          value={newBranchDoctor}
                          onChange={(e) => setNewBranchDoctor(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBranchDoctor(); } }}
                          className="flex-1 px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="e.g. Dr. R. K. Singhal"
                        />
                        <Button
                          id="btn-add-branch-doctor"
                          type="button"
                          onClick={addBranchDoctor}
                          className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs px-3.5 cursor-pointer"
                        >
                          Add Doctor
                        </Button>
                      </div>

                      {/* Tag list */}
                      {branchForm.doctors && branchForm.doctors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {branchForm.doctors.map((doc: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-900 text-[11px] font-medium"
                            >
                              <Stethoscope className="w-3 h-3 text-teal-600" />
                              {doc}
                              <button
                                type="button"
                                onClick={() => removeBranchDoctor(idx)}
                                className="ml-0.5 hover:text-red-500 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. PRIMARY LOCATION & ADDRESS */}
                <div className="space-y-3 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>3. Branch Location &amp; Address</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Address Line 1</label>
                      <input
                        id="input-branch-address1"
                        type="text"
                        value={branchForm.addressLine1 || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, addressLine1: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        placeholder="e.g. Suite 100, Healthcare Boulevard"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Address Line 2 / Area</label>
                      <input
                        id="input-branch-address2"
                        type="text"
                        value={branchForm.addressLine2 || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, addressLine2: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        placeholder="e.g. Near Metro Station"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">State</label>
                      <select
                        id="select-branch-state"
                        value={branchForm.state || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value, city: "" })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">City</label>
                      {branchForm.state && STATE_CITIES[branchForm.state] ? (
                        <select
                          id="select-branch-city"
                          value={branchForm.city || ""}
                          onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        >
                          <option value="">Select City</option>
                          {STATE_CITIES[branchForm.state].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="input-branch-city"
                          type="text"
                          value={branchForm.city || ""}
                          onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="e.g. New Delhi"
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">Pincode</label>
                      <input
                        id="input-branch-pincode"
                        type="text"
                        value={branchForm.pincode || ""}
                        onChange={(e) => setBranchForm({ ...branchForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                        placeholder="e.g. 110001"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2 Action Footer */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWizardStep(1)}
                    className="rounded-xl text-xs h-9 px-4 border-slate-200 dark:border-slate-800 gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back to Hospital Info
                  </Button>

                  <div className="flex items-center gap-2">
                    {selectedHospital && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleCreateOrUpdate(undefined, true)}
                        disabled={isSubmitting}
                        className="rounded-xl text-xs h-9 px-3.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Skip Branch for Now
                      </Button>
                    )}

                    <Button
                      id="btn-complete-registration"
                      type="button"
                      disabled={isSubmitting || (!selectedHospital && !isStep2Valid)}
                      onClick={() => handleCreateOrUpdate(undefined, false)}
                      className={`rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold transition-all ${
                        (!selectedHospital && !isStep2Valid)
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                          : "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 cursor-pointer"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{selectedHospital ? "Save Changes" : "Complete Registration"}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: VIEW HOSPITAL DETAILS DASHBOARD */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl rounded-2xl overflow-y-auto max-h-[88vh]">
          {selectedHospital && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Building2 className="w-5 h-5 text-teal-600" /> {selectedHospital.name} Dashboard
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Partner clinic records, branches, contact, and financial details.
                </DialogDescription>
              </DialogHeader>

              {/* Tabs for details */}
              <div className="flex border-b border-slate-100 dark:border-slate-900 mb-4 text-xs font-semibold overflow-x-auto pb-0.5">
                <button
                  onClick={() => setDetailTab("info")}
                  className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${detailTab === "info" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  General Details
                </button>
                <button
                  onClick={() => setDetailTab("branches")}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${detailTab === "branches" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Branches ({selectedHospital.branches?.length || 0})
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setDetailTab("financial")}
                      className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${detailTab === "financial" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                    >
                      Donor Deal Info
                    </button>
                    <button
                      onClick={() => setDetailTab("history")}
                      className={`pb-2.5 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${detailTab === "history" ? "border-teal-600 text-teal-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
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
                      <div><span className="text-slate-400">Registration ID:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedHospital.registrationNumber}</span></div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-slate-400">Treating Doctors:</span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsDetailOpen(false);
                                openAddDoctorModal(selectedHospital._id, "main");
                              }}
                              className="text-[10px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add Doctor
                            </button>
                          )}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedHospital.doctors && selectedHospital.doctors.length > 0
                            ? selectedHospital.doctors.map((d: any) => typeof d === "string" ? d : d.name).join(", ")
                            : selectedHospital.doctorName || "—"}
                        </span>
                      </div>
                      <div><span className="text-slate-400">Default Pickup / OPU:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedHospital.pickupLocation || selectedHospital.city || "—"}</span></div>
                      <div>
                        <span className="text-slate-400">Tax Invoice:</span>{" "}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedHospital.wantInvoice !== false ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-amber-100 text-amber-700"}`}>
                          {selectedHospital.wantInvoice !== false ? "YES (Required)" : "NO (Direct)"}
                        </span>
                      </div>
                      <div><span className="text-slate-400">Standard TDS Rate:</span> <span className="font-bold font-mono text-orange-600">{selectedHospital.tdsPercentage ?? 2}%</span></div>
                      <div><span className="text-slate-400">GST Number:</span> <span className="font-mono">{selectedHospital.gstNumber || "—"}</span></div>
                    </div>

                    {/* Contact & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 border-b pb-0.5">Contact Details</h4>
                        <div><span className="text-slate-400">Person:</span> <span className="font-semibold">{selectedHospital.contactPerson}</span></div>
                        <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> <span>{selectedHospital.email}</span></div>
                        <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> <span>{selectedHospital.mobileNumber}</span></div>
                        {selectedHospital.emergencyNumber && (
                          <div className="text-red-500 font-semibold">Emergency: {selectedHospital.emergencyNumber}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 border-b pb-0.5">Address Location</h4>
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

                    {/* Specializations */}
                    <div className="grid grid-cols-1 gap-4 pt-2 border-t dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-700 dark:text-slate-300">Specializations:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedHospital.specializations?.map((spec: string) => (
                            <span key={spec} className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-lg text-[10px] font-semibold border border-blue-100 dark:border-blue-900/50">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: BRANCHES IN DASHBOARD */}
                {detailTab === "branches" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Active Branches & IVF Centers</div>
                        <div className="text-[10px] text-slate-400">Network centers associated with {selectedHospital.name}</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openBranchManager(selectedHospital)}
                        className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5 h-8"
                      >
                        <Plus className="w-3.5 h-3.5" /> Manage / Add Branch
                      </Button>
                    </div>

                    {(!selectedHospital.branches || selectedHospital.branches.length === 0) ? (
                      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                        <GitBranch className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300">Single Location Center</div>
                        <div className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                          This clinic currently has no additional branches registered.
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openBranchManager(selectedHospital)}
                          className="mt-3 rounded-xl text-xs gap-1 text-teal-600 border-teal-200"
                        >
                          <Plus className="w-3 h-3" /> Add Branch
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        {selectedHospital.branches.map((b: any, idx: number) => (
                          <div
                            key={b._id || idx}
                            className={`p-3 rounded-xl border ${
                              b.isMainBranch
                                ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                  {b.branchName}
                                </span>
                                {b.branchCode && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600">
                                    {b.branchCode}
                                  </span>
                                )}
                                {b.isMainBranch && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                                    ★ Main
                                  </span>
                                )}
                                {b.registrationNumber && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/50">
                                    Reg: {b.registrationNumber}
                                  </span>
                                )}
                                {b.gstNumber && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/50">
                                    GST: {b.gstNumber}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${b.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                {b.status || "ACTIVE"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                              {((b.doctors && b.doctors.length > 0) || b.doctorName) ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Stethoscope className="w-3 h-3 text-teal-600 shrink-0" />
                                  <span>
                                    {b.doctors && b.doctors.length > 0
                                      ? b.doctors.map((d: any) => typeof d === "string" ? d : d.name).join(", ")
                                      : `Dr. ${b.doctorName}`}
                                  </span>
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsDetailOpen(false);
                                        openAddDoctorModal(selectedHospital._id, b._id || b.branchName);
                                      }}
                                      className="text-[10px] text-teal-600 hover:text-teal-700 font-bold ml-1 cursor-pointer"
                                    >
                                      + Add Doctor
                                    </button>
                                  )}
                                </div>
                              ) : isAdmin ? (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <Stethoscope className="w-3 h-3 text-slate-300 shrink-0" />
                                  <span>No treating doctor assigned</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsDetailOpen(false);
                                      openAddDoctorModal(selectedHospital._id, b._id || b.branchName);
                                    }}
                                    className="text-[10px] text-teal-600 hover:text-teal-700 font-bold ml-1 cursor-pointer"
                                  >
                                    + Assign Doctor
                                  </button>
                                </div>
                              ) : null}
                              {(b.contactPerson || b.mobileNumber) && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{b.contactPerson ? `${b.contactPerson}: ` : ""}{b.mobileNumber || "—"}</span>
                                </div>
                              )}
                              {(b.city || b.state) && (
                                <div className="flex items-center gap-1.5 sm:col-span-2">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{[b.addressLine1, b.city, b.state, b.pincode].filter(Boolean).join(", ")}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: FINANCIAL DEAL INFO (Admin only) */}
                {detailTab === "financial" && isAdmin && (
                  <div className="space-y-4">
                    {/* EGG DONOR DEALS */}
                    <div className="p-3.5 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 dark:bg-slate-900 rounded-xl border border-teal-100 dark:border-teal-900/50 space-y-2">
                      <div className="font-bold text-teal-800 dark:text-teal-300 flex items-center justify-between">
                        <span>Egg Donor Deal Rates</span>
                        <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">Oocyte</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-teal-50 shadow-xs">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Normal Deal</div>
                          <div className="text-base font-bold text-teal-700 font-mono">
                            ₹{Number(selectedHospital.eggDonorDealPrice || selectedHospital.donorDealPrice || 65000).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-teal-50 shadow-xs">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Profile Deal</div>
                          <div className="text-base font-bold text-purple-700 font-mono">
                            ₹{Number(selectedHospital.eggProfileDonorDealPrice || selectedHospital.profiledonorDealPrice || 85000).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SPERM DONOR DEALS */}
                    <div className="p-3.5 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:bg-slate-900 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-2">
                      <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center justify-between">
                        <span>Sperm Donor Deal Rates</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Semen</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-blue-50 shadow-xs">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Normal Deal</div>
                          <div className="text-base font-bold text-blue-700 font-mono">
                            ₹{Number(selectedHospital.spermDonorDealPrice || 15000).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-blue-50 shadow-xs">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Profile Deal</div>
                          <div className="text-base font-bold text-purple-700 font-mono">
                            ₹{Number(selectedHospital.spermProfileDonorDealPrice || 25000).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SERVICE FEE & TAX */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Bank Service Charge & Tax Summary</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Service Charge (SAC 999321)</div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                            ₹{Number(selectedHospital.serviceCharge || 5000).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">GST Applicable (18% on SC)</div>
                          <div className="text-sm font-bold text-emerald-600 font-mono">
                            +₹{Math.round((selectedHospital.serviceCharge || 5000) * 0.18).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total Service Fee with 18% GST: ₹{(Number(selectedHospital.serviceCharge || 5000) * 1.18).toLocaleString()} | Standard TDS: {selectedHospital.tdsPercentage ?? 2}%
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

      {/* DIALOG 3: DEDICATED QUICK BRANCH MANAGER MODAL */}
      <Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[85vh] overflow-y-auto p-0 border border-slate-200 dark:border-slate-800 shadow-2xl">
          {branchModalHospital && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-50/80 via-slate-50/50 to-emerald-50/40 dark:from-slate-900 dark:to-teal-950/30 p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0 ring-1 ring-teal-500/20">
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                        {branchModalHospital.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 mt-0.5">
                        Manage clinic branches, in-charges, pickup points, and branch-specific financial deals.
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isModalAddingBranch && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const hospDoctors = Array.isArray(branchModalHospital.doctors)
                            ? branchModalHospital.doctors.map((d: any) => typeof d === "string" ? d : d.name).filter(Boolean)
                            : (branchModalHospital.doctorName ? branchModalHospital.doctorName.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
                          setModalBranchForm({
                            ...initialBranchForm,
                            registrationNumber: branchModalHospital.registrationNumber || "",
                            gstNumber: branchModalHospital.gstNumber || "",
                            contactPerson: branchModalHospital.contactPerson || "",
                            mobileNumber: branchModalHospital.mobileNumber || "",
                            email: branchModalHospital.email || "",
                            addressLine1: branchModalHospital.addressLine1 || "",
                            addressLine2: branchModalHospital.addressLine2 || "",
                            city: branchModalHospital.city || "",
                            state: branchModalHospital.state || "",
                            pincode: branchModalHospital.pincode || "",
                            pickupLocation: branchModalHospital.pickupLocation || "",
                            doctorName: branchModalHospital.doctorName || "",
                            doctors: hospDoctors,
                            isMainBranch: !branchModalHospital.branches || branchModalHospital.branches.length === 0,
                          });
                          setEditingModalBranchId(null);
                          setIsModalAddingBranch(true);
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs gap-1.5 h-8.5 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Branch
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBranchModalOpen(false)}
                      className="rounded-xl text-xs h-8.5 px-3 border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Branch Add / Edit Form */}
                {isModalAddingBranch && (
                  <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60 space-y-3.5 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-teal-900 dark:text-teal-300 text-xs flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-600" />
                        {editingModalBranchId ? "Edit Branch" : "Add New Clinic Branch"}
                      </h5>
                      <span className="text-[10px] text-teal-600 font-mono font-semibold">
                        {editingModalBranchId ? "Editing" : "New Branch"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Branch Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={modalBranchForm.branchName}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, branchName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="e.g. Indiranagar Branch or South Delhi Center"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          ART Registration No.
                        </label>
                        <input
                          type="text"
                          value={modalBranchForm.registrationNumber}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, registrationNumber: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono uppercase"
                          placeholder={branchModalHospital.registrationNumber ? `Inherits: ${branchModalHospital.registrationNumber}` : "e.g. MH/ART/2023/001"}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          GSTIN (Tax ID)
                        </label>
                        <input
                          type="text"
                          value={modalBranchForm.gstNumber}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, gstNumber: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono uppercase"
                          placeholder="e.g. 27AAAAA0000A1Z5"
                        />
                      </div>

                      {/* Multiple Doctors Input for this Branch */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Stethoscope className="w-4 h-4 text-teal-600" />
                            <span>Treating Doctors for this Branch:</span>
                          </span>
                          {modalBranchForm.doctors && modalBranchForm.doctors.length > 0 && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                              {modalBranchForm.doctors.length} {modalBranchForm.doctors.length === 1 ? "doctor" : "doctors"}
                            </span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newModalBranchDoctor}
                            onChange={(e) => setNewModalBranchDoctor(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addModalBranchDoctor();
                              }
                            }}
                            placeholder="e.g. Dr. Sunita Rao (MBBS, MS)"
                            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                          />
                          <Button
                            type="button"
                            onClick={addModalBranchDoctor}
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-9 cursor-pointer gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Doctor
                          </Button>
                        </div>
                        {modalBranchForm.doctors && modalBranchForm.doctors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {modalBranchForm.doctors.map((doc: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60"
                              >
                                <Stethoscope className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span>{doc.startsWith("Dr.") ? doc : `Dr. ${doc}`}</span>
                                <XCircle
                                  className="w-3.5 h-3.5 text-purple-400 hover:text-purple-700 cursor-pointer ml-0.5"
                                  onClick={() => removeModalBranchDoctor(idx)}
                                />
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Contact Person</label>
                        <input
                          type="text"
                          value={modalBranchForm.contactPerson}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, contactPerson: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="e.g. Center Manager"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Contact Phone</label>
                        <input
                          type="text"
                          value={modalBranchForm.mobileNumber}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, mobileNumber: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="e.g. +91 98765 43210"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Branch Email</label>
                        <input
                          type="email"
                          value={modalBranchForm.email}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, email: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="e.g. branch@clinic.com"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Address Line 1</label>
                        <input
                          type="text"
                          value={modalBranchForm.addressLine1}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, addressLine1: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="Street, building, floor"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">State</label>
                        <select
                          value={modalBranchForm.state}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, state: e.target.value, city: "" })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">City</label>
                        {modalBranchForm.state && STATE_CITIES[modalBranchForm.state] ? (
                          <select
                            value={modalBranchForm.city}
                            onChange={(e) => setModalBranchForm({ ...modalBranchForm, city: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          >
                            <option value="">Select City</option>
                            {STATE_CITIES[modalBranchForm.state].map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={modalBranchForm.city}
                            onChange={(e) => setModalBranchForm({ ...modalBranchForm, city: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            placeholder="e.g. Mumbai"
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Pincode</label>
                        <input
                          type="text"
                          value={modalBranchForm.pincode}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, pincode: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                          placeholder="e.g. 400001"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Default OPU / Pickup Location</label>
                        <input
                          type="text"
                          value={modalBranchForm.pickupLocation}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, pickupLocation: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          placeholder="e.g. OT 2"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-1 border-t border-teal-200/50">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Branch Status:</span>
                        <select
                          value={modalBranchForm.status}
                          onChange={(e) => setModalBranchForm({ ...modalBranchForm, status: e.target.value })}
                          className="px-2.5 py-1 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        >
                          <option value="ACTIVE">Active Branch</option>
                          <option value="INACTIVE">Inactive Branch</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-teal-200/60 dark:border-teal-900/40">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBranchActionLoading}
                        onClick={() => {
                          setIsModalAddingBranch(false);
                          setEditingModalBranchId(null);
                          setModalBranchForm(initialBranchForm);
                        }}
                        className="rounded-xl text-xs h-8"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isBranchActionLoading}
                        onClick={handleModalSaveBranch}
                        className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs h-8 gap-1.5 shadow-xs"
                      >
                        {isBranchActionLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            {editingModalBranchId ? "Update Branch" : "Add Branch"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Branches List */}
                {(!branchModalHospital.branches || branchModalHospital.branches.length === 0) ? (
                  <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-3 ring-1 ring-teal-500/20">
                      <GitBranch className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Branches Added Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      This clinic only has its primary address. You can add branches or IVF satellite centers now.
                    </p>
                    {!isModalAddingBranch && (
                      <Button
                        type="button"
                        onClick={() => {
                          setModalBranchForm(initialBranchForm);
                          setEditingModalBranchId(null);
                          setIsModalAddingBranch(true);
                        }}
                        variant="outline"
                        className="mt-4 rounded-xl text-xs gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add First Branch
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {branchModalHospital.branches.map((b: any, index: number) => (
                      <div
                        key={b._id || index}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500/40 transition-all shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {b.branchName}
                              </span>
                              {b.branchCode && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {b.branchCode}
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                b.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-slate-100 text-slate-500"
                              }`}>
                                {b.status || "ACTIVE"}
                              </span>
                            </div>
                            {(b.registrationNumber || b.gstNumber) && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                {b.registrationNumber && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 font-semibold">
                                    Reg: {b.registrationNumber}
                                  </span>
                                )}
                                {b.gstNumber && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-semibold">
                                    GST: {b.gstNumber}
                                  </span>
                                )}
                              </div>
                            )}
                            {((b.doctors && b.doctors.length > 0) || b.doctorName) && (
                              <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium flex items-center gap-1 mt-1 flex-wrap">
                                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {b.doctors && b.doctors.length > 0
                                    ? b.doctors.map((d: any) => typeof d === "string" ? d : d.name).join(", ")
                                    : `Dr. ${b.doctorName}`}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const bDoctors = Array.isArray(b.doctors) && b.doctors.length > 0
                                  ? b.doctors.map((d: any) => typeof d === "string" ? d : d.name).filter(Boolean)
                                  : (b.doctorName ? b.doctorName.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
                                setModalBranchForm({ ...b, doctors: bDoctors });
                                setNewModalBranchDoctor("");
                                setEditingModalBranchId(b._id);
                                setIsModalAddingBranch(true);
                              }}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600 rounded-lg cursor-pointer"
                              title="Edit Branch"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleModalDeleteBranch(b._id)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Delete Branch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                          {(b.contactPerson || b.mobileNumber) && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {b.contactPerson ? `${b.contactPerson} • ` : ""}
                                {b.mobileNumber || "—"}
                              </span>
                            </div>
                          )}
                          {b.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{b.email}</span>
                            </div>
                          )}
                          {(b.city || b.state) && (
                            <div className="flex items-center gap-1.5 sm:col-span-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {[b.addressLine1, b.city, b.state, b.pincode].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: REGISTER / EDIT TREATING DOCTOR */}
      <Dialog open={isDoctorModalOpen} onOpenChange={setIsDoctorModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto p-0 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 dark:from-slate-900 dark:to-teal-950/30 p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 ring-1 ring-teal-500/20">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {editingDoctorData ? "Edit Treating Doctor Profile" : "Register Treating Doctor"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Associate treating clinicians with partner ART centers. NMC/MCI registration numbers are tracked for statutory compliance.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveDoctor} className="p-6 space-y-4 text-xs">
            {/* Doctor Name & NMC/MCI Reg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Doctor Full Name <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-teal-600 font-medium">Auto-prefixed with "Dr."</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Dr.</span>
                  <input
                    type="text"
                    required
                    placeholder="Anita Sharma"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  NMC / MCI Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MCI-48201-MH"
                  value={doctorForm.regNumber}
                  onChange={(e) => setDoctorForm({ ...doctorForm, regNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500 text-xs font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400">Required under ART Act 2021 statutory reporting</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Clinical Specialization / Role
                </label>
                <select
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500 text-xs font-medium"
                >
                  <option value="Infertility & IVF Specialist">Infertility & IVF Specialist</option>
                  <option value="Senior IVF Consultant">Senior IVF Consultant</option>
                  <option value="Clinical Embryologist">Clinical Embryologist</option>
                  <option value="Consultant Gynecologist & Obstetrician">Consultant Gynecologist & Obstetrician</option>
                  <option value="Andrologist & Micro-Surgeon">Andrologist & Micro-Surgeon</option>
                  <option value="Reproductive Endocrinologist">Reproductive Endocrinologist</option>
                  <option value="Treating ART Physician">Treating ART Physician</option>
                </select>
              </div>
            </div>

            {/* ART Center & Branch Association */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Affiliated ART Clinic & Branch
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Partner ART Clinic <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={doctorModalHospitalId}
                    onChange={(e) => {
                      setDoctorModalHospitalId(e.target.value);
                      setDoctorModalBranchId("main");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500 text-xs font-medium"
                  >
                    <option value="">Select ART Clinic...</option>
                    {hospitals.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name} {h.city ? `(${h.city})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Clinic Center / Branch
                  </label>
                  <select
                    value={doctorModalBranchId}
                    onChange={(e) => setDoctorModalBranchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500 text-xs font-medium"
                  >
                    <option value="main">Main Center (Default)</option>
                    {(() => {
                      const curHosp = hospitals.find((h) => h._id === doctorModalHospitalId);
                      if (!curHosp || !Array.isArray(curHosp.branches)) return null;
                      return curHosp.branches.map((b: any, bIdx: number) => (
                        <option key={b._id || bIdx} value={b._id || b.branchName}>
                          Branch: {b.branchName} {b.city ? `(${b.city})` : ""}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
            </div>

            {/* Direct Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Mobile / Direct Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Direct Email Address
                </label>
                <input
                  type="email"
                  placeholder="doctor@artclinic.com"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>
            </div>

            {/* Status & Primary Checkbox */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={doctorForm.isPrimary}
                  onChange={(e) => setDoctorForm({ ...doctorForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <span>Designate as Primary Treating Doctor for this Center</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={doctorForm.status}
                  onChange={(e) => setDoctorForm({ ...doctorForm, status: e.target.value as any })}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDoctorModalOpen(false)}
                className="rounded-xl text-xs h-9 px-4 border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isDoctorSubmitting || !doctorForm.name.trim() || !doctorModalHospitalId}
                className="rounded-xl text-xs h-9 px-5 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDoctorSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingDoctorData ? "Save Changes" : "Register Doctor"}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
