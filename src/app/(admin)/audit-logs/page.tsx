"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Clock,
  User,
  Check,
  Loader2,
  ShieldAlert,
  Activity,
  Calendar,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCircle2,
  Copy,
  Eye,
  ArrowRight,
  Stethoscope,
  Building2,
  CreditCard,
  Printer,
  SlidersHorizontal,
  Filter,
  X,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Table UX Density
  const [tableDensity, setTableDensity] = useState<"compact" | "comfortable">("comfortable");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copiedValue, setCopiedValue] = useState<"old" | "new" | null>(null);

  async function loadLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      params.append("limit", String(pageSize));
      if (search) params.append("search", search);
      if (entityTypeFilter && entityTypeFilter !== "ALL") {
        params.append("entityType", entityTypeFilter);
      }

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      } else {
        toast.error(data.error || "Failed to fetch activity logs.");
      }
    } catch (err) {
      toast.error("Failed to load activity logs from server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [search, entityTypeFilter, currentPage, pageSize]);

  const handleCopyJson = (val: any, type: "old" | "new") => {
    const text = typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);
    navigator.clipboard.writeText(text);
    setCopiedValue(type);
    toast.success("State value copied to clipboard");
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const getActionBadgeColor = (action: string) => {
    const a = (action || "").toUpperCase();
    if (a.includes("APPROV") || a.includes("COMPLET") || a.includes("PAID") || a.includes("SUCCESS")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    }
    if (a.includes("INVOICE") || a.includes("PAYMENT") || a.includes("BILL")) {
      return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
    }
    if (a.includes("DOCTOR") || a.includes("CLINIC") || a.includes("ASSIGN")) {
      return "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800";
    }
    if (a.includes("PRINT") || a.includes("DOWNLOAD") || a.includes("EXPORT") || a.includes("VIEW")) {
      return "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
    }
    if (a.includes("REJECT") || a.includes("CANCEL") || a.includes("SUSPEND") || a.includes("DELETE")) {
      return "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
    }
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  const cellPad = tableDensity === "compact" ? "py-2 px-3 text-[11px]" : "py-3.5 px-4 text-xs";

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <History className="w-7 h-7 text-teal-600" />
              Administrative Activity Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {totalCount} Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Forensic trace of doctor assignments, invoice generation, statutory Form 13 uploads, status changes, and client print events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
            className="h-9 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-medium gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by action, actor, details..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs rounded-xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Module / Entity Filter */}
          <select
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">All Modules</option>
            <option value="EggDonorRegistration">Egg Donor Registrations</option>
            <option value="SpermDonorRegistration">Sperm Donor Registrations</option>
            <option value="Invoice">Invoices &amp; Receipts</option>
            <option value="Hospital">ART Clinics &amp; Doctors</option>
          </select>
        </div>

        {/* Density Switcher */}
        <div className="flex items-center self-end md:self-auto gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTableDensity("compact")}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                tableDensity === "compact"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Compact density"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setTableDensity("comfortable")}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                tableDensity === "comfortable"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Comfortable density"
            >
              Comfortable
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 backdrop-blur-md bg-slate-50/95 dark:bg-slate-900/95 shadow-2xs border-b border-slate-200 dark:border-slate-800">
              <tr className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className={`${cellPad} whitespace-nowrap`}>Event Action</th>
                <th className={`${cellPad} whitespace-nowrap`}>Module &amp; IP</th>
                <th className={`${cellPad} whitespace-nowrap`}>Performed By</th>
                <th className={`${cellPad} whitespace-nowrap`}>Audit Details</th>
                <th className={`${cellPad} whitespace-nowrap`}>Timestamp</th>
                <th className={`${cellPad} text-right whitespace-nowrap sticky right-0 bg-slate-50/95 dark:bg-slate-900/95 z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-teal-600" />
                    Loading audit trail activities...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <div className="font-semibold text-slate-700 dark:text-slate-300">No activity logs recorded yet.</div>
                    <div className="text-xs text-slate-500 mt-1">Actions performed on registrations, doctors, and invoices will be logged here.</div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badgeStyle = getActionBadgeColor(log.action);
                  return (
                    <tr
                      key={log._id}
                      className="group/row hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className={`${cellPad} whitespace-nowrap`}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] border shadow-2xs uppercase ${badgeStyle}`}
                          >
                            <Activity className="w-3 h-3" />
                            {log.action?.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>

                      <td className={`${cellPad} whitespace-nowrap`}>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.entityType || "General"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.ipAddress || "127.0.0.1"}
                        </div>
                      </td>

                      <td className={`${cellPad} whitespace-nowrap`}>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[10px] font-bold">
                            {(log.performedBy || "A")[0].toUpperCase()}
                          </div>
                          <span>{log.performedBy}</span>
                        </div>
                      </td>

                      <td className={`${cellPad} max-w-md`}>
                        <p className="line-clamp-2 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                          {log.details}
                        </p>
                      </td>

                      <td className={`${cellPad} whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px]`}>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      <td
                        className={`${cellPad} text-right whitespace-nowrap sticky right-0 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] bg-white group-hover/row:bg-slate-50 dark:bg-slate-950 dark:group-hover/row:bg-slate-900`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailOpen(true);
                          }}
                          className="rounded-xl h-7 px-2.5 text-[11px] gap-1 font-semibold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/50 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-teal-600" />
                          Inspect Values
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && (logs.length > 0 || totalCount > 0) && (
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 50, 100]}
            itemName="activity logs"
            loading={loading}
          />
        )}
      </Card>

      {/* Audit Log Values Inspector Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              Audit Log Details Inspector
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review state values transition logged during administrative modifications.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-3 text-xs">
              {/* Event Metadata */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Action</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedLog.action}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Performed By</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedLog.performedBy}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Entity Type</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5 font-mono">{selectedLog.entityType}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Trace Description</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mt-1">
                    {selectedLog.details}
                  </p>
                </div>
              </div>

              {/* State Transitions: Old vs New */}
              {(selectedLog.oldValue !== undefined || selectedLog.newValue !== undefined) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Old State Value</span>
                      {selectedLog.oldValue !== undefined && (
                        <button
                          type="button"
                          onClick={() => handleCopyJson(selectedLog.oldValue, "old")}
                          className="text-[10px] text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedValue === "old" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedValue === "old" ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-auto max-h-48 leading-relaxed border border-slate-800">
                      {typeof selectedLog.oldValue === "object"
                        ? JSON.stringify(selectedLog.oldValue, null, 2)
                        : String(selectedLog.oldValue ?? "None")}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">New State Value</span>
                      {selectedLog.newValue !== undefined && (
                        <button
                          type="button"
                          onClick={() => handleCopyJson(selectedLog.newValue, "new")}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedValue === "new" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedValue === "new" ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-auto max-h-48 leading-relaxed border border-slate-800">
                      {typeof selectedLog.newValue === "object"
                        ? JSON.stringify(selectedLog.newValue, null, 2)
                        : String(selectedLog.newValue ?? "None")}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl h-9 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white px-5 cursor-pointer"
                >
                  Close Trace
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
