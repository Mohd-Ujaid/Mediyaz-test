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
  Check, 
  X,
  Shield,
  Clock,
  History,
  FileText,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface LoginRecord {
  date: string;
  ip?: string;
  device?: string;
}

interface ActivityRecord {
  action: string;
  details?: string;
  timestamp: string;
}

interface MongoUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  status: string;
  lastLogin?: string;
  department?: string;
  permissions?: string[];
  loginHistory?: LoginRecord[];
  activityLogs?: ActivityRecord[];
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<MongoUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Pagination & Sorting State
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [selectedUser, setSelectedUser] = useState<MongoUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [editForm, setEditForm] = useState<any>({});
  const [createForm, setCreateForm] = useState<any>({
    name: "", email: "", phone: "", role: "RECIPIENT", department: "General", permissions: "READ_PORTAL"
  });

  // Bulk state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function loadUsers() {
    setLoading(true);
    try {
      let query = `/api/users?search=${search}`;
      if (roleFilter) query += `&role=${roleFilter}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (deptFilter) query += `&department=${deptFilter}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      toast.error("Failed to load users from database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, deptFilter]);

  // Sorting
  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const getSortedUsers = () => {
    return [...users].sort((a, b) => {
      let valA: any = a[sortField as keyof MongoUser] || "";
      let valB: any = b[sortField as keyof MongoUser] || "";

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Pagination
  const sortedUsers = getSortedUsers();
  const pageCount = Math.ceil(sortedUsers.length / limit);
  const paginatedUsers = sortedUsers.slice((page - 1) * limit, page * limit);

  // Bulk operation handlers
  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedIds(paginatedUsers.map(u => u._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (userId: string) => {
    setSelectedIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) return;

    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await fetch(`/api/users?userId=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) successCount++;
      }
      toast.success(`Deleted ${successCount} user records.`);
      setSelectedIds([]);
      loadUsers();
    } catch (err) {
      toast.error("Error performing bulk delete.");
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id, status })
        });
        const data = await res.json();
        if (data.success) successCount++;
      }
      toast.success(`Updated ${successCount} users to ${status}.`);
      setSelectedIds([]);
      loadUsers();
    } catch (err) {
      toast.error("Error performing bulk status update.");
    }
  };

  // CRUD actions
  const handleEditOpen = (user: MongoUser) => {
    setEditForm({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      department: user.department || "General",
      permissions: user.permissions ? user.permissions.join(", ") : "READ_PORTAL"
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editForm.userId,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          role: editForm.role,
          department: editForm.department,
          permissions: editForm.permissions.split(",").map((p: string) => p.trim())
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User account saved successfully!");
        setIsEditOpen(false);
        loadUsers();
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
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          phone: createForm.phone,
          role: createForm.role,
          department: createForm.department,
          permissions: createForm.permissions.split(",").map((p: string) => p.trim())
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User account created!");
        setIsCreateOpen(false);
        setCreateForm({ name: "", email: "", phone: "", role: "RECIPIENT", department: "General", permissions: "READ_PORTAL" });
        loadUsers();
      } else {
        toast.error(data.error || "Creation failed.");
      }
    } catch (err) {
      toast.error("Network error creating user.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user account?")) return;
    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted successfully.");
        loadUsers();
      } else {
        toast.error(data.error || "Failed to delete user.");
      }
    } catch (err) {
      toast.error("Error executing deletion.");
    }
  };

  // Exports
  const handleExportCSV = () => {
    const headers = ["User ID", "Name", "Email", "Phone", "Role", "Department", "Status", "Last Login"];
    const rows = users.map(u => [
      u._id,
      u.name,
      u.email,
      u.phone || "N/A",
      u.role,
      u.department || "General",
      u.status,
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${Date.now()}.csv`);
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
            <Shield className="w-6 h-6 text-blue-500 fill-blue-500/10" /> User Credentials Console
          </h1>
          <p className="text-xs text-slate-500">
            Control center to modify platform roles, RBAC access groups, departments, and inspect login histories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadUsers} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Accounts
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-bold shadow-md shadow-blue-600/20">
            <UserPlus className="w-4 h-4" /> Add User Account
          </Button>
        </div>
      </div>

      {/* Bulk Operations Panel */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 print:hidden">
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            Selected {selectedIds.length} Accounts for Bulk Processing
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => handleBulkStatus("ACTIVE")} variant="outline" className="h-8 rounded-lg text-emerald-600 border-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10 text-xs">
              Bulk Activate
            </Button>
            <Button size="sm" onClick={() => handleBulkStatus("SUSPENDED")} variant="outline" className="h-8 rounded-lg text-amber-600 border-amber-200 bg-amber-500/5 hover:bg-amber-500/10 text-xs">
              Bulk Suspend
            </Button>
            <Button size="sm" onClick={handleBulkDelete} className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
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
              placeholder="Search by candidate name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Role selection */}
          <div>
            <select
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">Role (All)</option>
              {["SUPER_ADMIN", "ADMIN", "DOCTOR", "STAFF", "RECEPTIONIST", "DONOR", "RECIPIENT"].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              className="w-full h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">Status (All)</option>
              <option value="ACTIVE">Active Users</option>
              <option value="INACTIVE">Inactive Users</option>
              <option value="SUSPENDED">Suspended Users</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-900">
          <div className="text-xs font-semibold text-slate-500">
            Displaying {paginatedUsers.length} of {sortedUsers.length} matches
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="h-8 rounded-lg text-xs gap-1 border-slate-200">
              <Download className="w-3.5 h-3.5" /> Export CSV / Excel
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="h-8 rounded-lg text-xs gap-1 border-slate-200">
              <Printer className="w-3.5 h-3.5" /> Print Records
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            Connecting to database & loading profiles...
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No matching user accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 print:bg-slate-100">
                <tr>
                  <th className="p-3.5 w-10 text-center print:hidden">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={selectedIds.length === paginatedUsers.length}
                      className="rounded accent-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-16">Profile</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("name")}>Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Phone Mobile</th>
                  <th className="p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => handleSort("role")}>Role (RBAC)</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Last Login</th>
                  <th className="p-3.5 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 group">
                    <td className="p-3.5 text-center print:hidden">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(user._id)}
                        onChange={() => handleSelectOne(user._id)}
                        className="rounded accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5">
                      <img loading="lazy" 
                        src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                      />
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{user.name}</td>
                    <td className="p-3.5 text-slate-600">{user.email}</td>
                    <td className="p-3.5 text-slate-500 font-medium">{user.phone || "N/A"}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-semibold">{user.department || "General"}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        user.status === "SUSPENDED" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}>
                        {user.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                    </td>
                    <td className="p-3.5 text-right print:hidden">
                      <div className="flex justify-end">
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
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}
                              className="cursor-pointer gap-2 text-xs font-semibold py-2"
                            >
                              <Eye className="w-4 h-4 text-sky-500" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditOpen(user)}
                              className="cursor-pointer gap-2 text-xs font-semibold py-2"
                            >
                              <Edit3 className="w-4 h-4 text-amber-500" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(user._id)}
                              className="cursor-pointer gap-2 text-xs font-semibold py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                              Delete User
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

      {/* Detailed Credentials View */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-2xl max-w-3xl bg-white dark:bg-slate-950 border dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto">
          {selectedUser && (
            <div className="space-y-6">
              
              {/* Header profile info */}
              <div className="flex items-center gap-5 border-b pb-5 border-slate-100 dark:border-slate-900">
                <img loading="lazy" 
                  src={selectedUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"} 
                  alt={selectedUser.name}
                  className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedUser.name}
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 text-[10px] font-bold">
                      {selectedUser.role}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">User ID: {selectedUser._id}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Status: <span className="text-emerald-500">{selectedUser.status}</span></p>
                </div>
              </div>

              {/* Grid content sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* 1. Personal & Account */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Account Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400">Email Address:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobile Phone:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.phone || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Department Assign:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.department || "General"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Registration Date:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Role & Permissions */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm">Roles & Key Permissions</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400">Role level:</span>
                      <p className="font-bold text-blue-600 mt-0.5">{selectedUser.role}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Access Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                          selectedUser.permissions.map((p) => (
                            <span key={p} className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[9px]">
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No custom permissions.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Login History */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" /> Recent Logins History
                  </h3>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {selectedUser.loginHistory && selectedUser.loginHistory.length > 0 ? (
                      selectedUser.loginHistory.map((hist, idx) => (
                        <div key={idx} className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{hist.device || "Browser Session"}</p>
                            <span className="text-[10px] text-slate-400">{hist.ip || "127.0.0.1"}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(hist.date).toLocaleDateString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic py-2">No login logs recorded.</div>
                    )}
                  </div>
                </div>

                {/* 4. Activity Logs */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white border-b pb-1 border-slate-100 dark:border-slate-800 text-sm flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-blue-500" /> User Activity Logs
                  </h3>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {selectedUser.activityLogs && selectedUser.activityLogs.length > 0 ? (
                      selectedUser.activityLogs.map((log, idx) => (
                        <div key={idx} className="space-y-0.5 pb-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <p className="font-bold text-slate-700 dark:text-slate-300 leading-tight">{log.action}</p>
                          <p className="text-[10px] text-slate-400 leading-none">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic py-2">No activities logged yet.</div>
                    )}
                  </div>
                </div>

              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setIsDetailOpen(false)} className="rounded-xl text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                  Close panel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit User Details</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Update account credentials or security roles.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <Input type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
              <Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Role</label>
                <select 
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                  value={editForm.role || ""}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  {["SUPER_ADMIN", "ADMIN", "DOCTOR", "STAFF", "RECEPTIONIST", "DONOR", "RECIPIENT"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Department</label>
                <Input value={editForm.department || ""} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Access Permissions (Comma Separated)</label>
              <Input value={editForm.permissions || ""} onChange={(e) => setEditForm({ ...editForm, permissions: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl text-xs">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs">Save Account Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Register User Account</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Manually insert new user credentials into database.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold">Full Name</label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Email Address</label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Phone Number</label>
              <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold">Role</label>
                <select 
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 focus:outline-none"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  {["SUPER_ADMIN", "ADMIN", "DOCTOR", "STAFF", "RECEPTIONIST", "DONOR", "RECIPIENT"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Department</label>
                <Input value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold">Access Permissions (Comma Separated)</label>
              <Input value={createForm.permissions} onChange={(e) => setCreateForm({ ...createForm, permissions: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs">Create Account</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
