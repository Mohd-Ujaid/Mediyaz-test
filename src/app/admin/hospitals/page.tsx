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
  Loader2
} from "lucide-react";
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
  const [organFilter, setOrganFilter] = useState("");
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
    code: "",
    registrationNumber: "",
    licenseNumber: "",
    gstNumber: "",
    panNumber: "",
    
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
    
    hospitalType: "Private",
    specializations: [],
    organTypesSupported: [],
    icuAvailability: false,
    transplantLicenseNumber: "",
    
    donorDealPrice: 0,
    serviceCharge: 0,
    processingFee: 0,
    registrationFee: 0,
    commission: 0,
    additionalCharges: 0,
    currency: "INR",
    status: "ACTIVE"
  });

  const [newSpec, setNewSpec] = useState("");
  const [newOrgan, setNewOrgan] = useState("");

  const resetForm = () => {
    setFormFields({
      name: "",
      shortName: "",
      code: "",
      registrationNumber: "",
      licenseNumber: "",
      gstNumber: "",
      panNumber: "",
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
      hospitalType: "Private",
      specializations: [],
      organTypesSupported: [],
      icuAvailability: false,
      transplantLicenseNumber: "",
      donorDealPrice: 0,
      serviceCharge: 0,
      processingFee: 0,
      registrationFee: 0,
      commission: 0,
      additionalCharges: 0,
      currency: "INR",
      status: "ACTIVE"
    });
    setFormTab("basic");
  };

  async function loadHospitals() {
    setLoading(true);
    try {
      let query = `/api/hospitals?search=${encodeURIComponent(search)}&page=${currentPage}&limit=${itemsPerPage}`;
      if (cityFilter) query += `&city=${encodeURIComponent(cityFilter)}`;
      if (stateFilter) query += `&state=${encodeURIComponent(stateFilter)}`;
      if (typeFilter) query += `&type=${typeFilter}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (organFilter) query += `&organ=${organFilter}`;

      const res = await fetch(query);
      const data = await res.json();
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
  }, [currentPage, search, cityFilter, stateFilter, typeFilter, statusFilter, organFilter]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formFields.name || !formFields.shortName || !formFields.code || !formFields.registrationNumber || !formFields.licenseNumber || !formFields.contactPerson || !formFields.email || !formFields.mobileNumber || !formFields.addressLine1 || !formFields.city || !formFields.state || !formFields.pincode || !formFields.transplantLicenseNumber) {
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
      code: hosp.code || "",
      registrationNumber: hosp.registrationNumber || "",
      licenseNumber: hosp.licenseNumber || "",
      gstNumber: hosp.gstNumber || "",
      panNumber: hosp.panNumber || "",
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
      hospitalType: hosp.hospitalType || "Private",
      specializations: hosp.specializations || [],
      organTypesSupported: hosp.organTypesSupported || [],
      icuAvailability: hosp.icuAvailability || false,
      transplantLicenseNumber: hosp.transplantLicenseNumber || "",
      donorDealPrice: hosp.donorDealPrice || 0,
      serviceCharge: hosp.serviceCharge || 0,
      processingFee: hosp.processingFee || 0,
      registrationFee: hosp.registrationFee || 0,
      commission: hosp.commission || 0,
      additionalCharges: hosp.additionalCharges || 0,
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

  const addOrgan = () => {
    if (newOrgan.trim() && !formFields.organTypesSupported.includes(newOrgan.trim())) {
      setFormFields({
        ...formFields,
        organTypesSupported: [...formFields.organTypesSupported, newOrgan.trim()]
      });
      setNewOrgan("");
    }
  };

  const removeOrgan = (organ: string) => {
    setFormFields({
      ...formFields,
      organTypesSupported: formFields.organTypesSupported.filter((o: string) => o !== organ)
    });
  };

  // Export CSV
  const exportCsv = () => {
    if (hospitals.length === 0) {
      toast.error("No hospitals data available to export.");
      return;
    }
    const headers = [
      "Hospital Name", "Code", "Type", "Status", "Contact Person", "Email", "Phone", "City", "State"
    ];
    const rows = hospitals.map(h => [
      h.name, h.code, h.hospitalType, h.status, h.contactPerson, h.email, h.mobileNumber, h.city, h.state
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
            <Building2 className="w-6 h-6 text-teal-600" /> Hospital Management
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
              placeholder="Search by name, code, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Hospital Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">Hospital Type (All)</option>
              <option value="Public">Public / Government</option>
              <option value="Private">Private Facility</option>
              <option value="Trust">Trust Hospital</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">Status (Active/Suspended)</option>
              <option value="ACTIVE">Active Partner</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived (Soft deleted)</option>
            </select>
          </div>

          {/* Organ Filter */}
          <div>
            <input
              type="text"
              placeholder="Organ specialty (e.g. Kidney, Egg)"
              value={organFilter}
              onChange={(e) => setOrganFilter(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>
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
                  <th className="p-3.5">Hospital Code</th>
                  <th className="p-3.5">Hospital Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Organs Supported</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {hospitals.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-white">{h.code}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {h.name} <span className="text-[10px] text-slate-400">({h.shortName})</span>
                    </td>
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
                    <td className="p-3.5">
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
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        h.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        h.status === "SUSPENDED" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" :
                        h.status === "INACTIVE" ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelectedHospital(h); setDetailTab("info"); setIsDetailOpen(true); }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                        title="View Details Dashboard"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(h)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-900"
                            title="Edit Hospital Info"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSoftDelete(h._id)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-600 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-900"
                            title="Archive / Soft Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hospital Code *</label>
                  <input
                    type="text"
                    required
                    value={formFields.code}
                    onChange={(e) => setFormFields({ ...formFields, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
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
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">License Number *</label>
                  <input
                    type="text"
                    required
                    value={formFields.licenseNumber}
                    onChange={(e) => setFormFields({ ...formFields, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">GST Number</label>
                  <input
                    type="text"
                    value={formFields.gstNumber}
                    onChange={(e) => setFormFields({ ...formFields, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">PAN Number</label>
                  <input
                    type="text"
                    value={formFields.panNumber}
                    onChange={(e) => setFormFields({ ...formFields, panNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>
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
                    <label className="font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formFields.email}
                      onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Mobile Number *</label>
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
                      <option value="Private">Private Facility</option>
                      <option value="Public">Public / Government</option>
                      <option value="Trust">Trust Clinic</option>
                      <option value="Semi-Private">Semi-Private Joint</option>
                    </select>
                  </div>
                  <div className="space-y-1">
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
                  </div>
                </div>

                {/* Tag list for Organ Supported */}
                <div className="space-y-2 border-t pt-3">
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
                </div>

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
                  <label className="font-bold text-slate-700">Donor Deal Price (INR)</label>
                  <input
                    type="number"
                    value={formFields.donorDealPrice}
                    onChange={(e) => setFormFields({ ...formFields, donorDealPrice: Number(e.target.value) })}
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
                      <div><span className="text-slate-400">Hospital Code:</span> <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedHospital.code}</span></div>
                      <div><span className="text-slate-400">License Number:</span> <span className="font-semibold">{selectedHospital.licenseNumber}</span></div>
                      <div><span className="text-slate-400">GST Number:</span> <span>{selectedHospital.gstNumber || "—"}</span></div>
                      <div><span className="text-slate-400">PAN Number:</span> <span>{selectedHospital.panNumber || "—"}</span></div>
                      <div><span className="text-slate-400">Registration ID:</span> <span>{selectedHospital.registrationNumber}</span></div>
                      <div><span className="text-slate-400">Transplant License:</span> <span className="font-semibold">{selectedHospital.transplantLicenseNumber}</span></div>
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
                      <div className="space-y-1">
                        <div className="font-bold text-slate-700">Supported Organs:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedHospital.organTypesSupported?.map((org: string) => (
                            <span key={org} className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg text-[10px] font-semibold border border-teal-100">
                              {org}
                            </span>
                          ))}
                        </div>
                      </div>
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
                                Changed by: {item.changedBy}
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
