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
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Briefcase,
  Star,
  Clock,
  Award,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomPagination } from "@/components/ui/custom-pagination";

interface EmployeeDoc {
  name: string;
  url: string;
  uploadedAt: string;
}

interface MongoEmployee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  department: string;
  designation: string;
  qualification: string;
  experienceYears: number;
  salary: number;
  shift: string;
  attendanceRate: number;
  performanceRating: number;
  status: string;
  documents: EmployeeDoc[];
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    permissions?: string[];
  };
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<MongoEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [selectedEmp, setSelectedEmp] = useState<MongoEmployee | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [editForm, setEditForm] = useState<any>({});
  const [createForm, setCreateForm] = useState<any>({
    name: "", email: "", phone: "", designation: "Nurse", department: "Clinical Services",
    qualification: "", experienceYears: 1, salary: 45000, shift: "Morning", password: "",
    permissions: ["VIEW_DASHBOARD"]
  });

  // Bulk state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function loadEmployees() {
    setLoading(true);
    try {
      let query = `/api/employees?page=${page}&limit=${limit}&search=${search}`;
      if (designationFilter) query += `&designation=${designationFilter}`;
      if (shiftFilter) query += `&shift=${shiftFilter}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
        if (data.pagination) setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      toast.error("Failed to load staff profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [search, designationFilter, shiftFilter, statusFilter, page]);

  // Sorting
  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const getSortedEmployees = () => {
    return [...employees].sort((a, b) => {
      let valA: any = a[sortField as keyof MongoEmployee] || "";
      let valB: any = b[sortField as keyof MongoEmployee] || "";

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Pagination
  const paginatedEmployees = employees;

  // Bulk operation handlers
  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedIds(paginatedEmployees.map(emp => emp.employeeId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (employeeId: string) => {
    setSelectedIds(prev => 
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} staff records?`)) return;

    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await fetch(`/api/employees?employeeId=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) successCount++;
      }
      toast.success(`Deactivated ${successCount} employee records successfully.`);
      setSelectedIds([]);
      loadEmployees();
    } catch (err) {
      toast.error("Error performing bulk status deactivation.");
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await fetch("/api/employees", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: id, status })
        });
        const data = await res.json();
        if (data.success) successCount++;
      }
      toast.success(`Updated ${successCount} employees to ${status}.`);
      setSelectedIds([]);
      loadEmployees();
    } catch (err) {
      toast.error("Error performing bulk status update.");
    }
  };

  // CRUD actions
  const handleEditOpen = (emp: MongoEmployee) => {
    setEditForm({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      designation: emp.designation,
      department: emp.department,
      qualification: emp.qualification,
      experienceYears: emp.experienceYears,
      salary: emp.salary,
      shift: emp.shift,
      attendanceRate: emp.attendanceRate,
      performanceRating: emp.performanceRating,
      permissions: emp.user?.permissions || []
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Employee profile details saved!");
        setIsEditOpen(false);
        loadEmployees();
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
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("New employee registered in system database!");
        setIsCreateOpen(false);
        setCreateForm({ name: "", email: "", phone: "", designation: "Nurse", department: "Clinical Services", qualification: "", experienceYears: 1, salary: 45000, shift: "Morning", password: "" });
        loadEmployees();
      } else {
        toast.error(data.error || "Registration failed.");
      }
    } catch (err) {
      toast.error("Network error registering employee.");
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm("Are you sure you want to toggle status of this employee?")) return;
    try {
      const res = await fetch(`/api/employees?employeeId=${employeeId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Employee status updated.");
        loadEmployees();
      } else {
        toast.error(data.error || "Deactivation toggle failed.");
      }
    } catch (err) {
      toast.error("Error executing deactivation.");
    }
  };

  // Exports
  const handleExportCSV = () => {
    const headers = ["Employee ID", "Name", "Email", "Phone", "Designation", "Department", "Shift", "Salary", "Attendance Rate", "Performance", "Status"];
    const rows = employees.map(emp => [
      emp.employeeId,
      emp.name,
      emp.email,
      emp.phone,
      emp.designation,
      emp.department,
      emp.shift,
      `$${emp.salary.toLocaleString()}`,
      `${emp.attendanceRate}%`,
      `${emp.performanceRating}/5`,
      emp.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  return (
    <div className="space-y-6 pb-12 print:bg-white print:p-0 print:space-y-4">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-teal-600 fill-teal-600/10" /> Staff & Employee Directory
          </h1>
          <p className="text-xs text-slate-500">
            Secure administrative control interface to search, screen, and audit blood donor credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadEmployees} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 font-bold shadow-md shadow-teal-600/20">
            <UserPlus className="w-4 h-4" /> Add Staff Profile
          </Button>
        </div>
      </div>

      {/* Bulk Operations Panel */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 print:hidden">
          <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
            Selected {selectedIds.length} Staff records for Bulk processing
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => handleBulkStatus("ACTIVE")} variant="outline" className="h-8 rounded-lg text-emerald-600 border-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10 text-xs">
              Bulk Activate
            </Button>
            <Button size="sm" onClick={() => handleBulkStatus("INACTIVE")} variant="outline" className="h-8 rounded-lg text-amber-600 border-amber-200 bg-amber-500/5 hover:bg-amber-500/10 text-xs">
              Bulk Deactivate
            </Button>
            <Button size="sm" onClick={handleBulkDelete} className="h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Deactivate Selected
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Global search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Employee ID, name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Designation filter */}
          <div>
            <select
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              value={designationFilter}
              onChange={(e) => { setDesignationFilter(e.target.value); setPage(1); }}
            >
              <option value="">Designation (All)</option>
              {["Admin", "Doctor", "Nurse", "Receptionist", "Embryology Staff", "Lab Technician", "Volunteer", "Driver"].map(des => (
                <option key={des} value={des}>{des}</option>
              ))}
            </select>
          </div>

          {/* Shift filter */}
          <div>
            <select
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              value={shiftFilter}
              onChange={(e) => { setShiftFilter(e.target.value); setPage(1); }}
            >
              <option value="">Shift (All)</option>
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
              <option value="Night">Night Shift</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-900">
          <div className="text-xs font-semibold text-slate-500">
            Displaying {paginatedEmployees.length} employees on this page
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="h-8 rounded-lg text-xs gap-1 border-slate-200">
              <Download className="w-3.5 h-3.5" /> Export CSV / Excel
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="h-8 rounded-lg text-xs gap-1 border-slate-200">
              <Printer className="w-3.5 h-3.5" /> Print Registry
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-2" />
            Connecting to database & loading staff...
          </div>
        ) : paginatedEmployees.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No matching employee records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 print:bg-slate-100">
                <tr>
                  <th className="p-3.5 w-10 text-center print:hidden">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={selectedIds.length === paginatedEmployees.length}
                      className="rounded accent-teal-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-16">Photo</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("employeeId")}>Employee ID</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("name")}>Name</th>
                  <th className="p-3.5">Designation</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("shift")}>Shift</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("salary")}>Salary</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Rating</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {paginatedEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 group">
                    <td className="p-3.5 text-center print:hidden">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(emp.employeeId)}
                        onChange={() => handleSelectOne(emp.employeeId)}
                        className="rounded accent-teal-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5">
                      <img loading="lazy" 
                        src={emp.photo || "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=80&h=80&q=80"} 
                        alt={emp.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                      />
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{emp.employeeId}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{emp.name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                        {emp.designation}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-semibold">{emp.department}</td>
                    <td className="p-3.5 text-slate-500">{emp.shift}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-300">${emp.salary.toLocaleString()}</td>
                    <td className="p-3.5 font-semibold text-emerald-600">{emp.attendanceRate}%</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {emp.performanceRating}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right print:hidden">
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
                              onClick={() => handleEditOpen(emp)}
                              className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2"
                            >
                              <Edit3 className="w-4 h-4 text-emerald-600" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(emp.employeeId)}
                              className="text-xs font-medium cursor-pointer flex items-center gap-2 py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" /> Toggle Status
                            </DropdownMenuItem>
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

        {/* Pagination */}
        {!loading && employees.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-900 print:hidden">
            <CustomPagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>

      {/* Detailed Profile View */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-2xl max-w-2xl bg-white dark:bg-slate-950 border dark:border-slate-800 p-6">
          {selectedEmp && (
            <div className="space-y-6">
              
              {/* Header profile */}
              <div className="flex items-center gap-5 border-b pb-5 border-slate-100 dark:border-slate-900">
                <img loading="lazy" 
                  src={selectedEmp.photo || "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&h=150&q=80"} 
                  alt={selectedEmp.name}
                  className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedEmp.name}
                    <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                      {selectedEmp.designation}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">Employee ID: {selectedEmp.employeeId} • Status: <span className="text-emerald-500">{selectedEmp.status}</span></p>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* 1. Contact & Credentials */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Contact details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400">Email Address:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmp.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone Mobile:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmp.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Department:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmp.department}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Professional & Shift */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Professional Profile</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400">Qualifications:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                        <Award className="w-3.5 h-3.5 text-teal-600" /> {selectedEmp.qualification}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Salary & Shift:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3.5 mt-0.5">
                        <span className="flex items-center gap-0.5 text-emerald-600"><DollarSign className="w-3.5 h-3.5" /> {selectedEmp.salary.toLocaleString()}/yr</span>
                        <span className="flex items-center gap-0.5 text-slate-500"><Clock className="w-3.5 h-3.5" /> {selectedEmp.shift}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Years of Experience:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmp.experienceYears} Years</p>
                    </div>
                  </div>
                </div>

                {/* 3. Performance & Attendance */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3 md:col-span-2">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Performance Indicators</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <span className="text-slate-400">Attendance Rate</span>
                      <p className="text-lg font-extrabold text-emerald-600 mt-1">{selectedEmp.attendanceRate}%</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <span className="text-slate-400">Performance Rating</span>
                      <p className="text-lg font-extrabold text-amber-500 mt-1 flex items-center justify-center gap-0.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {selectedEmp.performanceRating}/5
                      </p>
                    </div>
                  </div>
                </div>

              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setIsDetailOpen(false)} className="rounded-xl text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                  Close profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Employee Profile</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Update professional records or shifts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                <Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Designation</label>
                <select 
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                  value={editForm.designation || ""}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                >
                  {["Admin", "Doctor", "Nurse", "Receptionist", "Embryology Staff", "Lab Technician", "Volunteer", "Driver"].map(des => (
                    <option key={des} value={des}>{des}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Department</label>
                <Input value={editForm.department || ""} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Shift</label>
                <select 
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                  value={editForm.shift || ""}
                  onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Qualification</label>
              <Input value={editForm.qualification || ""} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Experience (Years)</label>
                <Input type="number" value={editForm.experienceYears || ""} onChange={(e) => setEditForm({ ...editForm, experienceYears: parseInt(e.target.value) })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Salary ($)</label>
                <Input type="number" value={editForm.salary || ""} onChange={(e) => setEditForm({ ...editForm, salary: parseInt(e.target.value) })} required />
              </div>
            </div>
            <div className="space-y-1.5 border-t pt-3 dark:border-slate-800">
              <label className="font-bold text-slate-800 dark:text-slate-200">Panel Access Permissions</label>
              <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border dark:border-slate-850">
                {[
                  { key: "VIEW_DASHBOARD", label: "Dashboard" },
                  { key: "VIEW_REPORTS", label: "Analytics & Reports" },
                  { key: "VIEW_DONOR_REQUESTS", label: "Donor Requests" },
                  { key: "VIEW_INQUIRIES", label: "Inquiries" },
                  { key: "VIEW_REGISTRATIONS", label: "Registrations" },
                  { key: "VIEW_REQUIREMENTS", label: "Requirements" },
                  { key: "VIEW_HOSPITALS", label: "Hospitals" },
                  { key: "VIEW_REG_CHECKS", label: "Registration Checks" },
                  { key: "VIEW_REFERRALS", label: "Agents & Partners" },
                  { key: "MANAGE_STAFF", label: "Staff Management" },
                ].map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={editForm.permissions?.includes(perm.key) || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const currentPerms = editForm.permissions || [];
                        const updatedPerms = checked 
                          ? [...currentPerms, perm.key] 
                          : currentPerms.filter((p: string) => p !== perm.key);
                        setEditForm({ ...editForm, permissions: updatedPerms });
                      }}
                      className="rounded text-teal-650"
                    />
                    <span className="text-[11px] text-slate-650 dark:text-slate-400">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl text-xs">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Register Staff Member</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Insert employee metadata and create User credentials.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold">Full Legal Name</label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Email Address</label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Phone Mobile</label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Login Password</label>
              <Input type="password" placeholder="Set login password..." value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Designation</label>
                <select 
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                  value={createForm.designation}
                  onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                >
                  {["Admin", "Doctor", "Nurse", "Receptionist", "Embryology Staff", "Lab Technician", "Volunteer", "Driver"].map(des => (
                    <option key={des} value={des}>{des}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Department</label>
                <Input value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Qualification</label>
              <Input value={createForm.qualification} onChange={(e) => setCreateForm({ ...createForm, qualification: e.target.value })} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Exp (Yrs)</label>
                <Input type="number" value={createForm.experienceYears} onChange={(e) => setCreateForm({ ...createForm, experienceYears: parseInt(e.target.value) })} required />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="font-semibold">Salary ($/year)</label>
                <Input type="number" value={createForm.salary} onChange={(e) => setCreateForm({ ...createForm, salary: parseInt(e.target.value) })} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Shift Schedule</label>
              <select 
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                value={createForm.shift}
                onChange={(e) => setCreateForm({ ...createForm, shift: e.target.value })}
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
            
            <div className="space-y-1.5 border-t pt-3 dark:border-slate-800">
              <label className="font-bold text-slate-800 dark:text-slate-200">Panel Access Permissions</label>
              <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border dark:border-slate-850">
                {[
                  { key: "VIEW_DASHBOARD", label: "Dashboard" },
                  { key: "VIEW_REPORTS", label: "Analytics & Reports" },
                  { key: "VIEW_DONOR_REQUESTS", label: "Donor Requests" },
                  { key: "VIEW_INQUIRIES", label: "Inquiries" },
                  { key: "VIEW_REGISTRATIONS", label: "Registrations" },
                  { key: "VIEW_REQUIREMENTS", label: "Requirements" },
                  { key: "VIEW_HOSPITALS", label: "Hospitals" },
                  { key: "VIEW_REG_CHECKS", label: "Registration Checks" },
                  { key: "VIEW_REFERRALS", label: "Agents & Partners" },
                  { key: "MANAGE_STAFF", label: "Staff Management" },
                ].map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={createForm.permissions?.includes(perm.key) || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const currentPerms = createForm.permissions || [];
                        const updatedPerms = checked 
                          ? [...currentPerms, perm.key] 
                          : currentPerms.filter((p: string) => p !== perm.key);
                        setCreateForm({ ...createForm, permissions: updatedPerms });
                      }}
                      className="rounded text-teal-650"
                    />
                    <span className="text-[11px] text-slate-650 dark:text-slate-400">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs">Register Staff</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
