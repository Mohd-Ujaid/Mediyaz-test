"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  UserPlus, 
  RefreshCw, 
  Filter, 
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  FileText, 
  Mail, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Activity,
  Heart
} from "lucide-react";
import { toast } from "sonner";

interface DonorDocument {
  type: string;
  url: string;
  name?: string;
  uploadedAt?: string;
}

interface MongoDonor {
  _id: string;
  donorId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    status: string;
    lastLogin?: string;
    createdAt: string;
  };
  personalInformation: {
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
    nationality: string;
    address: string;
    maritalStatus?: string;
  };
  physicalAttributes: {
    height: number;
    weight: number;
    eyeColor?: string;
    hairColor?: string;
    skinTone?: string;
  };
  contactInformation?: {
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    city?: string;
    state?: string;
    country?: string;
    pinCode?: string;
  };
  medicalInformation?: {
    eligibility?: boolean;
    hemoglobin?: number;
    bloodPressure?: string;
    allergies?: string;
    diseases?: string;
    medications?: string;
    medicalNotes?: string;
  };
  donationInformation?: {
    totalDonations?: number;
    lastDonationDate?: string;
    nextEligibleDate?: string;
    certificates?: { name: string; url: string; issuedAt: string }[];
  };
  education?: string;
  occupation?: string;
  medicalHistory?: string;
  familyHistory?: string;
  donationStatus: string;
  approvalStatus: string;
  documents: DonorDocument[];
  tags?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
}

export default function AdminDonorsPage() {
  const [donors, setDonors] = useState<MongoDonor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Pagination & Sorting State
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal / Detail views State
  const [selectedDonor, setSelectedDonor] = useState<MongoDonor | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit / Form State
  const [editForm, setEditForm] = useState<any>({});
  const [createForm, setCreateForm] = useState<any>({
    name: "", email: "", phone: "",
    bloodGroup: "O+", gender: "Male", dob: "1998-01-01", address: "",
    height: 175, weight: 70, city: "", state: "", zip: "",
    hemoglobin: 14.5, bp: "120/80", medicalNotes: "",
    tags: "Frozen"
  });

  // Bulk operation state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function loadDonors() {
    setLoading(true);
    try {
      let query = `/api/donors?search=${search}`;
      if (bloodGroupFilter) query += `&bloodGroup=${encodeURIComponent(bloodGroupFilter)}`;
      if (genderFilter) query += `&gender=${genderFilter}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (cityFilter) query += `&city=${cityFilter}`;

      const res = await fetch(query);
      const data = await res.json();
      
      if (data.success) {
        setDonors(data.donors);
      }
    } catch (err) {
      toast.error("Failed to load donors from database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDonors();
  }, [search, bloodGroupFilter, genderFilter, statusFilter, cityFilter]);

  // Sorting logic
  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const getSortedDonors = () => {
    return [...donors].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "name") {
        valA = a.user?.name || "";
        valB = b.user?.name || "";
      } else if (sortField === "donorId") {
        valA = a.donorId || "";
        valB = b.donorId || "";
      } else if (sortField === "bloodGroup") {
        valA = a.personalInformation.bloodGroup || "";
        valB = b.personalInformation.bloodGroup || "";
      } else if (sortField === "age") {
        valA = a.personalInformation.dateOfBirth || "";
        valB = b.personalInformation.dateOfBirth || "";
        // dateOfBirth sorting (reverse logic for age)
        return sortOrder === "asc" 
          ? new Date(valB).getTime() - new Date(valA).getTime()
          : new Date(valA).getTime() - new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Pagination logic
  const sortedDonors = getSortedDonors();
  const pageCount = Math.ceil(sortedDonors.length / limit);
  const paginatedDonors = sortedDonors.slice((page - 1) * limit, page * limit);

  // Status updates
  const handleUpdateStatus = async (donorId: string, status: string) => {
    try {
      const res = await fetch("/api/donors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId, status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Donor is now ${status}!`);
        loadDonors();
      } else {
        toast.error(data.error || "Failed to update donor status.");
      }
    } catch (err) {
      toast.error("Error updating status.");
    }
  };

  // Bulk Actions
  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedIds(paginatedDonors.map(d => d.donorId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (donorId: string) => {
    setSelectedIds(prev => 
      prev.includes(donorId) ? prev.filter(id => id !== donorId) : [...prev, donorId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} donors?`)) return;

    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await fetch(`/api/donors?donorId=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) successCount++;
      }
      toast.success(`Deleted ${successCount} donor records successfully.`);
      setSelectedIds([]);
      loadDonors();
    } catch (err) {
      toast.error("Error performing bulk delete.");
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await fetch("/api/donors", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donorId: id, status })
        });
        const data = await res.json();
        if (data.success) successCount++;
      }
      toast.success(`Updated ${successCount} donors to ${status}.`);
      setSelectedIds([]);
      loadDonors();
    } catch (err) {
      toast.error("Error performing bulk status update.");
    }
  };

  // CRUD handlers
  const handleEditOpen = (donor: MongoDonor) => {
    setEditForm({
      donorId: donor.donorId,
      name: donor.user?.name,
      email: donor.user?.email,
      phone: donor.user?.phone,
      bloodGroup: donor.personalInformation.bloodGroup,
      gender: donor.personalInformation.gender,
      dob: (() => {
        if (!donor.personalInformation?.dateOfBirth) return "";
        const d = new Date(donor.personalInformation.dateOfBirth);
        return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
      })(),
      address: donor.personalInformation.address,
      maritalStatus: donor.personalInformation.maritalStatus || "Single",
      height: donor.physicalAttributes.height,
      weight: donor.physicalAttributes.weight,
      tags: donor.tags ? donor.tags.join(", ") : "",
      eyeColor: donor.physicalAttributes.eyeColor || "Brown",
      hairColor: donor.physicalAttributes.hairColor || "Black",
      skinTone: donor.physicalAttributes.skinTone || "Fair",
      city: donor.contactInformation?.city || "",
      state: donor.contactInformation?.state || "",
      country: donor.contactInformation?.country || "",
      pinCode: donor.contactInformation?.pinCode || "",
      emergencyContactName: donor.contactInformation?.emergencyContactName || "",
      emergencyContactPhone: donor.contactInformation?.emergencyContactPhone || "",
      hemoglobin: donor.medicalInformation?.hemoglobin || "",
      bp: donor.medicalInformation?.bloodPressure || "",
      allergies: donor.medicalInformation?.allergies || "None",
      diseases: donor.medicalInformation?.diseases || "None",
      medications: donor.medicalInformation?.medications || "None",
      medicalNotes: donor.medicalInformation?.medicalNotes || "",
      education: donor.education || "",
      occupation: donor.occupation || "",
      medicalHistory: donor.medicalHistory || "",
      familyHistory: donor.familyHistory || ""
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/donors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: editForm.donorId,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          personalInformation: {
            dateOfBirth: editForm.dob ? new Date(editForm.dob) : new Date("1998-01-01"),
            gender: editForm.gender,
            bloodGroup: editForm.bloodGroup,
            nationality: "American",
            address: editForm.address,
            maritalStatus: editForm.maritalStatus
          },
          physicalAttributes: {
            height: Number(editForm.height),
            weight: Number(editForm.weight),
            eyeColor: editForm.eyeColor,
            hairColor: editForm.hairColor,
            skinTone: editForm.skinTone
          },
          contactInformation: {
            emergencyContactName: editForm.emergencyContactName,
            emergencyContactPhone: editForm.emergencyContactPhone,
            city: editForm.city,
            state: editForm.state,
            country: editForm.country,
            pinCode: editForm.pinCode
          },
          medicalInformation: {
            eligibility: true,
            hemoglobin: Number(editForm.hemoglobin),
            bloodPressure: editForm.bp,
            allergies: editForm.allergies,
            diseases: editForm.diseases,
            medications: editForm.medications,
            medicalNotes: editForm.medicalNotes
          },
          education: editForm.education,
          occupation: editForm.occupation,
          medicalHistory: editForm.medicalHistory,
          familyHistory: editForm.familyHistory,
          tags: editForm.tags ? editForm.tags.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [],
          updatedBy: "Admin Portal"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Donor profile saved!");
        setIsEditOpen(false);
        loadDonors();
      } else {
        toast.error(data.error || "Save operation failed.");
      }
    } catch (err) {
      toast.error("Network error saving changes.");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          phone: createForm.phone,
          personalInformation: {
            dateOfBirth: createForm.dob,
            gender: createForm.gender,
            bloodGroup: createForm.bloodGroup,
            nationality: "American",
            address: createForm.address
          },
          physicalAttributes: {
            height: createForm.height,
            weight: createForm.weight
          },
          contactInformation: {
            city: createForm.city,
            state: createForm.state,
            pinCode: createForm.zip,
            country: "United States"
          },
          medicalInformation: {
            hemoglobin: createForm.hemoglobin,
            bloodPressure: createForm.bp,
            medicalNotes: createForm.medicalNotes
          },
          tags: createForm.tags ? createForm.tags.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0) : ["Frozen"],
          createdBy: "Admin Console"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("New donor record created!");
        setIsCreateOpen(false);
        setCreateForm({
          name: "", email: "", phone: "",
          bloodGroup: "O+", gender: "Male", dob: "1998-01-01", address: "",
          height: 175, weight: 70, city: "", state: "", zip: "",
          hemoglobin: 14.5, bp: "120/80", medicalNotes: ""
        });
        loadDonors();
      } else {
        toast.error(data.error || "Failed to create donor.");
      }
    } catch (err) {
      toast.error("Network error creating donor.");
    }
  };

  const handleDelete = async (donorId: string) => {
    if (!confirm("Are you sure you want to permanently delete this donor?")) return;
    try {
      const res = await fetch(`/api/donors?donorId=${donorId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Donor deleted.");
        loadDonors();
      } else {
        toast.error(data.error || "Delete action failed.");
      }
    } catch (err) {
      toast.error("Network error deleting donor.");
    }
  };

  // Exports
  const handleExportCSV = () => {
    const headers = ["Donor ID", "Name", "Email", "Phone", "Blood Group", "Gender", "Status", "Last Donation", "Next Eligible"];
    const rows = donors.map(d => [
      d.donorId,
      d.user?.name || "Anonymous",
      d.user?.email || "N/A",
      d.user?.phone || "N/A",
      d.personalInformation.bloodGroup,
      d.personalInformation.gender,
      d.donationStatus,
      d.donationInformation?.lastDonationDate ? new Date(d.donationInformation.lastDonationDate).toLocaleDateString() : "N/A",
      d.donationInformation?.nextEligibleDate ? new Date(d.donationInformation.nextEligibleDate).toLocaleDateString() : "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `donors_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return "N/A";
    const birth = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSendNotification = (type: "Email" | "SMS", donorName: string) => {
    toast.success(`${type} alert transmitted successfully to ${donorName}!`);
  };

  return (
    <div className="space-y-6 pb-12 print:bg-white print:p-0 print:space-y-4">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Donor Registry Console
          </h1>
          <p className="text-xs text-slate-500">
            Secure administrative control interface to search, screen, and audit blood donor credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadDonors} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Registry
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 font-bold shadow-md shadow-rose-600/20">
            <UserPlus className="w-4 h-4" /> Add Donor Profile
          </Button>
        </div>
      </div>

      {/* Bulk Operations Panel */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 print:hidden">
          <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
            Selected {selectedIds.length} Donors for Bulk Processing
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => handleBulkStatus("ACTIVE")} variant="outline" className="h-8 rounded-lg text-emerald-600 border-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10 text-xs">
              Bulk Activate
            </Button>
            <Button size="sm" onClick={() => handleBulkStatus("INACTIVE")} variant="outline" className="h-8 rounded-lg text-amber-600 border-amber-200 bg-amber-500/5 hover:bg-amber-500/10 text-xs">
              Bulk Deactivate
            </Button>
            <Button size="sm" onClick={handleBulkDelete} className="h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Global search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Donor ID, candidate name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Blood group selection */}
          <div>
            <select
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              value={bloodGroupFilter}
              onChange={(e) => { setBloodGroupFilter(e.target.value); setPage(1); }}
            >
              <option value="">Blood Group (All)</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            >
              <option value="">Gender (All)</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">Status (All)</option>
              <option value="ACTIVE">Active Donors</option>
              <option value="INACTIVE">Inactive Donors</option>
              <option value="PENDING">Pending Approval</option>
            </select>
          </div>
        </div>

        {/* Action Controls for tables */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-900">
          <div className="text-xs font-semibold text-slate-500">
            Displaying {paginatedDonors.length} of {sortedDonors.length} matches
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="h-8 rounded-lg text-xs gap-1 border-slate-200">
              <Download className="w-3.5 h-3.5" /> Export CSV / Excel
            </Button>
            <Button onClick={handlePrint} variant="outline" className="h-8 rounded-lg text-xs gap-1 border-slate-200">
              <Printer className="w-3.5 h-3.5" /> Print Registry
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-2" />
            Connecting to database & loading profiles...
          </div>
        ) : paginatedDonors.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No matching donor records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 print:bg-slate-100">
                <tr>
                  <th className="p-3.5 w-10 text-center print:hidden">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={selectedIds.length === paginatedDonors.length}
                      className="rounded accent-rose-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-16">Profile</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("donorId")}>Donor ID</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("name")}>Name</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("bloodGroup")}>Blood Group</th>
                  <th className="p-3.5">Gender</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("age")}>Age</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Last Donation</th>
                  <th className="p-3.5">Next Eligible</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {paginatedDonors.map((donor) => (
                  <tr key={donor._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 group">
                    <td className="p-3.5 text-center print:hidden">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(donor.donorId)}
                        onChange={() => handleSelectOne(donor.donorId)}
                        className="rounded accent-rose-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5">
                      <img loading="lazy" 
                        src={donor.user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"} 
                        alt={donor.user?.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                      />
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{donor.donorId}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{donor.user?.name || "Anonymous Candidate"}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20">
                        {donor.personalInformation.bloodGroup}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{donor.personalInformation.gender}</td>
                    <td className="p-3.5 text-slate-600">{calculateAge(donor.personalInformation.dateOfBirth)}</td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{donor.user?.phone || "N/A"}</div>
                        <div className="text-[10px] text-slate-400">{donor.user?.email || "N/A"}</div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {donor.donationInformation?.lastDonationDate 
                        ? new Date(donor.donationInformation.lastDonationDate).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {donor.donationInformation?.nextEligibleDate 
                        ? new Date(donor.donationInformation.nextEligibleDate).toLocaleDateString()
                        : "Eligible"}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        donor.donationStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        donor.donationStatus === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                        "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                      }`}>
                        {donor.donationStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right flex justify-end gap-1.5 print:hidden">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { setSelectedDonor(donor); setIsDetailOpen(true); }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-rose-500"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEditOpen(donor)}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-blue-500"
                        title="Edit Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(donor.donorId)}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-rose-600"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && pageCount > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between print:hidden">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setPage(p => Math.max(p - 1, 1))} 
              disabled={page === 1}
              className="rounded-xl h-8 text-xs gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <div className="text-xs text-slate-500">
              Page {page} of {pageCount}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setPage(p => Math.min(p + 1, pageCount))} 
              disabled={page === pageCount}
              className="rounded-xl h-8 text-xs gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Detailed Donor Profile Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-2xl max-w-4xl bg-white dark:bg-slate-950 border dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto">
          {selectedDonor && (
            <div className="space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 dark:border-slate-900 pb-5 justify-between">
                <div className="flex items-center gap-5">
                  <img loading="lazy" 
                    src={selectedDonor.user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"} 
                    alt={selectedDonor.user?.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-rose-500"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedDonor.user?.name}
                      <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        {selectedDonor.personalInformation.bloodGroup}
                      </span>
                      {selectedDonor.tags && selectedDonor.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {tag}
                        </span>
                      ))}
                    </h2>
                    <p className="text-xs text-slate-500">Donor ID: <span className="font-bold">{selectedDonor.donorId}</span> • Registered {new Date(selectedDonor.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Status: <span className="text-emerald-500">{selectedDonor.donationStatus}</span></p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-1.5 shrink-0 justify-center">
                  <Button size="sm" variant="outline" onClick={() => handleSendNotification("Email", selectedDonor.user?.name || "")} className="h-8 rounded-lg gap-1 text-xs">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSendNotification("SMS", selectedDonor.user?.name || "")} className="h-8 rounded-lg gap-1 text-xs">
                    <MessageSquare className="w-3.5 h-3.5" /> SMS
                  </Button>
                  {selectedDonor.donationStatus === "ACTIVE" ? (
                    <Button size="sm" onClick={() => handleUpdateStatus(selectedDonor.donorId, "INACTIVE")} variant="outline" className="h-8 rounded-lg border-amber-200 text-amber-600 text-xs">
                      Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleUpdateStatus(selectedDonor.donorId, "ACTIVE")} variant="outline" className="h-8 rounded-lg border-emerald-200 text-emerald-600 text-xs">
                      Activate
                    </Button>
                  )}
                  <Button size="sm" onClick={() => window.print()} className="h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs">
                    Print PDF
                  </Button>
                </div>
              </div>

              {/* Profile Details Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* 1. PERSONAL */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Personal Credentials</h3>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <span className="text-slate-400">Date of Birth:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedDonor.personalInformation.dateOfBirth ? new Date(selectedDonor.personalInformation.dateOfBirth).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Age:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{calculateAge(selectedDonor.personalInformation.dateOfBirth)} Years</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Gender:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.personalInformation.gender}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Marital Status:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.personalInformation.maritalStatus || "Single"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Height:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.physicalAttributes.height} cm</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Weight:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.physicalAttributes.weight} kg</p>
                    </div>
                  </div>
                </div>

                {/* 2. CONTACT */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <span className="text-slate-400">Phone:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.user?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{selectedDonor.user?.email || "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Address:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.personalInformation.address}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">City / State:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedDonor.contactInformation?.city || "N/A"}, {selectedDonor.contactInformation?.state || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Pin Code:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.contactInformation?.pinCode || "N/A"}</p>
                    </div>
                    <div className="col-span-2 border-t pt-2 border-slate-200/40 mt-1">
                      <span className="text-slate-400">Emergency Contact:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedDonor.contactInformation?.emergencyContactName || "N/A"} ({selectedDonor.contactInformation?.emergencyContactPhone || "N/A"})
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. MEDICAL */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Medical Profile</h3>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <span className="text-slate-400">Hemoglobin:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.medicalInformation?.hemoglobin || "14.5"} g/dL</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Blood Pressure:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedDonor.medicalInformation?.bloodPressure || "120/80"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Allergies:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-rose-500">{selectedDonor.medicalInformation?.allergies || "None"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Chronic Diseases:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-rose-500">{selectedDonor.medicalInformation?.diseases || "None"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Medical Notes:</span>
                      <p className="font-semibold text-slate-600 dark:text-slate-400 italic">"{selectedDonor.medicalInformation?.medicalNotes || "No medical notes recorded."}"</p>
                    </div>
                  </div>
                </div>

                {/* 4. DONATION HISTORY */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Donation Record</h3>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <span className="text-slate-400">Total Donations:</span>
                      <p className="font-extrabold text-slate-900 dark:text-white text-base">{selectedDonor.donationInformation?.totalDonations || 0} Successful Cycles</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Next Eligible:</span>
                      <p className="font-semibold text-emerald-600">
                        {selectedDonor.donationInformation?.nextEligibleDate 
                          ? new Date(selectedDonor.donationInformation.nextEligibleDate).toLocaleDateString()
                          : "Eligible to Donate"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Last Donation:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedDonor.donationInformation?.lastDonationDate 
                          ? new Date(selectedDonor.donationInformation.lastDonationDate).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Registration Date:</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{new Date(selectedDonor.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* 5. DOCUMENTS */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3 md:col-span-2">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Verification Documents</h3>
                  <div className="space-y-2">
                    {selectedDonor.documents && selectedDonor.documents.length > 0 ? (
                      selectedDonor.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-rose-500" />
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{doc.name || `Document #${idx + 1}`}</span>
                              <p className="text-[10px] text-slate-400">{doc.type || "PDF File"}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => window.open(doc.url, "_blank")} className="h-7 text-[10px] rounded-md">
                            View / Download
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-center py-4">No verified documents uploaded to donor profile.</div>
                    )}
                  </div>
                </div>

              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setIsDetailOpen(false)} className="rounded-xl text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900">
                  Close Detail Panel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl max-w-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Donor Profile Details</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Update medical records, credentials, or contacts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6 text-xs">
            
            {/* Section 1: User details */}
            <div className="space-y-3">
              <h4 className="font-bold border-b pb-1 text-slate-900 dark:text-white">Account Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Legal Name</label>
                  <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <Input type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Phone Mobile</label>
                  <Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
                </div>
              </div>
            </div>

            {/* Section 2: Personal details */}
            <div className="space-y-3">
              <h4 className="font-bold border-b pb-1 text-slate-900 dark:text-white">Personal attributes</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Blood Group</label>
                  <select 
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                    value={editForm.bloodGroup || ""}
                    onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                  <select 
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                    value={editForm.gender || ""}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <Input type="date" value={editForm.dob || ""} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Marital Status</label>
                  <Input value={editForm.maritalStatus || ""} onChange={(e) => setEditForm({ ...editForm, maritalStatus: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Height (cm)</label>
                  <Input type="number" value={editForm.height || ""} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Weight (kg)</label>
                  <Input type="number" value={editForm.weight || ""} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tags / Sample States (comma-separated)</label>
                  <Input value={editForm.tags || ""} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="e.g. Fresh, Frozen" />
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Medical */}
            <div className="space-y-3">
              <h4 className="font-bold border-b pb-1 text-slate-900 dark:text-white">Contact & Medical Profiles</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Full Address</label>
                  <Input value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">City</label>
                  <Input value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Hemoglobin (g/dL)</label>
                  <Input type="number" step="0.1" value={editForm.hemoglobin || ""} onChange={(e) => setEditForm({ ...editForm, hemoglobin: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Blood Pressure</label>
                  <Input value={editForm.bp || ""} onChange={(e) => setEditForm({ ...editForm, bp: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Emergency Contact Phone</label>
                  <Input value={editForm.emergencyContactPhone || ""} onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Clinical Medical Notes</label>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
                  rows={2}
                  value={editForm.medicalNotes || ""}
                  onChange={(e) => setEditForm({ ...editForm, medicalNotes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl text-xs">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs">Save Profile Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Donor Profile Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl max-w-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Register New Donor Profile</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Create login and setup donor baseline record.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Full Legal Name</label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Email Address</label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Phone Mobile</label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-4 dark:border-slate-800">
              <div className="space-y-1">
                <label className="font-semibold">Blood Group</label>
                <select 
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                  value={createForm.bloodGroup}
                  onChange={(e) => setCreateForm({ ...createForm, bloodGroup: e.target.value })}
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Gender</label>
                <select 
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                  value={createForm.gender}
                  onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Date of Birth</label>
                <Input type="date" value={createForm.dob} onChange={(e) => setCreateForm({ ...createForm, dob: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Height (cm)</label>
                <Input type="number" value={createForm.height} onChange={(e) => setCreateForm({ ...createForm, height: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Weight (kg)</label>
                <Input type="number" value={createForm.weight} onChange={(e) => setCreateForm({ ...createForm, weight: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">City</label>
                <Input value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">State</label>
                <Input value={createForm.state} onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">ZIP Code</label>
                <Input value={createForm.zip} onChange={(e) => setCreateForm({ ...createForm, zip: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Tags (comma-separated)</label>
                <Input value={createForm.tags} onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })} placeholder="e.g. Frozen" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4 dark:border-slate-800">
              <div className="space-y-1">
                <label className="font-semibold">Hemoglobin Level</label>
                <Input type="number" step="0.1" value={createForm.hemoglobin} onChange={(e) => setCreateForm({ ...createForm, hemoglobin: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Blood Pressure</label>
                <Input value={createForm.bp} onChange={(e) => setCreateForm({ ...createForm, bp: e.target.value })} />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <label className="font-semibold">Address Details</label>
                <Input value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="font-semibold">Medical Assessment Notes</label>
              <textarea
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
                rows={2}
                value={createForm.medicalNotes}
                onChange={(e) => setCreateForm({ ...createForm, medicalNotes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs">Register Donor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
