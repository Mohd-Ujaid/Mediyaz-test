"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Eye,
  Edit3,
  Trash2,
  Heart,
  Dna,
  ShieldCheck,
  Database,
  Users,
  Copy,
  Check,
  Building2,
  Calendar,
  AlertTriangle,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPreviousDonorsAction,
  deletePreviousDonorAction,
} from "@/features/previous-data/actions/previous-data.actions";
import { PreviousDonorFormDialog } from "@/features/previous-data/components/PreviousDonorFormDialog";
import { PreviousDonorViewDialog } from "@/features/previous-data/components/PreviousDonorViewDialog";
import { useSession } from "@/lib/auth";
import { UnifiedDeleteModal } from "@/components/ui/unified-delete-modal";
import { CustomPagination } from "@/components/ui/custom-pagination";

export default function PreviousDataPage() {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState<"all" | "egg" | "sperm">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, egg: 0, sperm: 0, withAadhaar: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedAadhaar, setCopiedAadhaar] = useState<string | null>(null);

  // Modals state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [recordToView, setRecordToView] = useState<any | null>(null);
  const [deleteTargetRecord, setDeleteTargetRecord] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPreviousDonorsAction({
        donorType: activeTab,
        search: searchQuery,
        page,
        limit: 20,
      });

      if (res.success) {
        setRecords(res.records);
        setPagination(res.pagination);
        setStats(res.stats);
      } else {
        toast.error(res.error || "Failed to load previous data.");
      }
    } catch {
      toast.error("Network error loading previous donor data.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCopyAadhaar = (aadhaar: string) => {
    if (!aadhaar) return;
    navigator.clipboard.writeText(aadhaar);
    setCopiedAadhaar(aadhaar);
    toast.success("Aadhaar copied to clipboard");
    setTimeout(() => setCopiedAadhaar(null), 2000);
  };

  const handleDelete = (record: any) => {
    setDeleteTargetRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.info("No records to export.");
      return;
    }

    const headers = [
      "Record Code",
      "Legacy ID",
      "Donor Type",
      "Full Name",
      "Gender",
      "Aadhaar Number",
      "Mobile Number",
      "Blood Group",
      "Age",
      "City",
      "Hospital / Clinic",
      "Registration Date",
      "Schedule Date",
      "Pickup Date",
      "HIV",
      "HBsAg",
      "HCV",
      "VDRL",
      "Notes",
    ];

    const rows = records.map((r) => [
      r.recordCode || "",
      r.legacyId || "",
      r.donorType === "sperm" ? "Sperm Donor" : "Egg Donor",
      r.personalInfo?.fullName || "",
      r.personalInfo?.gender || "",
      r.personalInfo?.aadhaarNumber ? `'${r.personalInfo.aadhaarNumber}'` : "",
      r.contactInfo?.mobileNumber || "",
      r.personalInfo?.bloodGroup || "",
      r.personalInfo?.age || "",
      r.contactInfo?.city || "",
      r.hospitalOrClinic || "",
      r.registrationDate || "",
      r.scheduleDate || "",
      r.pickupDate || "",
      r.viralMarkers?.hiv || "",
      r.viralMarkers?.hbsag || "",
      r.viralMarkers?.hcv || "",
      r.viralMarkers?.vdrl || "",
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `previous_donors_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded.");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600/10 dark:bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Previous Donor Data
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Legacy repository for prior egg & sperm donations. All records are cross-checked by Aadhaar during new registrations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setRecordToEdit(null);
              setFormDialogOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Previous Record
          </Button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Records
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {stats.total}
            </p>
          </div>
        </Card>

        <Card className="p-4 border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Previous Egg Donors
            </p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {stats.egg}
            </p>
          </div>
        </Card>

        <Card className="p-4 border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Previous Sperm Donors
            </p>
            <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
              {stats.sperm}
            </p>
          </div>
        </Card>

        <Card className="p-4 border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Aadhaar Verified
            </p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {stats.withAadhaar}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter Tabs and Search Bar */}
      <Card className="p-4 border bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => {
                setActiveTab("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All Records ({stats.total})
            </button>
            <button
              onClick={() => {
                setActiveTab("egg");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "egg"
                  ? "bg-white dark:bg-slate-900 text-rose-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Egg Donors ({stats.egg})
            </button>
            <button
              onClick={() => {
                setActiveTab("sperm");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "sperm"
                  ? "bg-white dark:bg-slate-900 text-teal-600 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Dna className="w-3.5 h-3.5 text-teal-600" />
              Sperm Donors ({stats.sperm})
            </button>
          </div>

          {/* Search box & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search Aadhaar, Name, Mobile, Code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchRecords}
              className="h-9 w-9 shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Notice Info banner */}
        <div className="p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-[11px] text-teal-800 dark:text-teal-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>Duplicate Prevention Active:</strong> When any new donor fills out the registration form, their Aadhaar is checked in real-time against this table.
            </span>
          </div>
          <span className="font-semibold hidden md:inline">
            Showing {records.length} of {pagination.total} records
          </span>
        </div>

        {/* Records Table */}
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Record / Legacy ID
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Donor Type
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Donor Name
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Aadhaar Number
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Blood Group
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hospital / Clinic
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reg / Schedule Date
                </TableHead>
                <TableHead className="text-xs font-bold text-right text-slate-700 dark:text-slate-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                      Loading previous records...
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
                      <Database className="w-8 h-8 text-slate-300 dark:text-slate-700 stroke-1" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">
                        No previous donor records found.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        Use the "Add Previous Record" button above to enter historical paperwork or offline files with zero required fields.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => {
                  const p = record.personalInfo || {};
                  const c = record.contactInfo || {};
                  const isEgg = record.donorType === "egg";
                  const aadhaar = p.aadhaarNumber || "";

                  return (
                    <TableRow
                      key={record._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition text-xs"
                    >
                      {/* Code */}
                      <TableCell className="font-mono font-medium">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {record.recordCode || "—"}
                          </span>
                          {record.legacyId && (
                            <span className="block text-[10px] text-muted-foreground font-sans">
                              Ref: {record.legacyId}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Donor Type */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isEgg
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300"
                          }
                        >
                          {isEgg ? "Egg Donor" : "Sperm Donor"}
                        </Badge>
                      </TableCell>

                      {/* Full Name */}
                      <TableCell className="font-medium">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {p.fullName || "—"}
                          </span>
                          {p.age && (
                            <span className="block text-[10px] text-muted-foreground">
                              {p.age} yrs • {p.gender || (isEgg ? "Female" : "Male")}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Aadhaar */}
                      <TableCell>
                        {aadhaar ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {aadhaar.length === 12
                                ? `XXXX-XXXX-${aadhaar.slice(-4)}`
                                : aadhaar}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyAadhaar(aadhaar)}
                              className="text-muted-foreground hover:text-slate-900 transition p-0.5 rounded cursor-pointer"
                              title="Copy full Aadhaar"
                            >
                              {copiedAadhaar === aadhaar ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">
                            Not recorded
                          </span>
                        )}
                      </TableCell>

                      {/* Mobile */}
                      <TableCell className="font-mono">
                        {c.mobileNumber || "—"}
                      </TableCell>

                      {/* Blood Group */}
                      <TableCell>
                        {p.bloodGroup ? (
                          <Badge variant="secondary" className="font-bold text-[11px]">
                            {p.bloodGroup}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Hospital / Clinic */}
                      <TableCell className="max-w-[180px] truncate">
                        {record.hospitalOrClinic || "—"}
                      </TableCell>

                      {/* Registration / Schedule Date */}
                      <TableCell>
                        {record.registrationDate || record.scheduleDate || record.pickupDate || record.donationDate || "—"}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setRecordToView(record);
                              setViewDialogOpen(true);
                            }}
                            className="h-7 w-7 text-slate-600 hover:text-slate-900"
                            title="View Record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setRecordToEdit(record);
                              setFormDialogOpen(true);
                            }}
                            className="h-7 w-7 text-blue-600 hover:text-blue-700"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteLoadingId === record._id}
                            onClick={() => handleDelete(record)}
                            className="h-7 w-7 text-rose-600 hover:text-rose-700"
                            title={isSuperAdmin ? "Permanently Delete Record" : "Request Record Deletion"}
                          >
                            {deleteLoadingId === record._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {!loading && (records.length > 0 || pagination.total > 0) && (
          <CustomPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(p) => setPage(p)}
            itemName="records"
            loading={loading}
          />
        )}
      </Card>

      {/* Form Dialog (Add / Edit) */}
      <PreviousDonorFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        recordToEdit={recordToEdit}
        defaultDonorType={activeTab === "sperm" ? "sperm" : "egg"}
        onSuccess={fetchRecords}
      />

      {/* View Dialog */}
      <PreviousDonorViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        record={recordToView}
        onEdit={(rec) => {
          setRecordToEdit(rec);
          setFormDialogOpen(true);
        }}
      />

      {/* Unified Role-Aware Delete / Deletion Request Modal */}
      {deleteTargetRecord && (
        <UnifiedDeleteModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          resourceType="PREVIOUS_DATA"
          resourceTitle={`Record: ${deleteTargetRecord.recordCode} (${deleteTargetRecord.personalInfo?.fullName || "Donor"})`}
          resourceId={deleteTargetRecord._id}
          deleteEndpoint={`/api/previous-donors/${deleteTargetRecord._id}`}
          onSuccess={fetchRecords}
          requireIdConfirmation={isSuperAdmin}
        />
      )}
    </div>
  );
}
