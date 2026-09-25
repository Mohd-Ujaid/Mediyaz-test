"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  Clock, 
  User, 
  Check, 
  Loader2, 
  ShieldAlert,
  Activity,
  Calendar,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  async function loadLogs() {
    setLoading(true);
    try {
      let query = `/api/audit-logs?page=${currentPage}&limit=15&search=${encodeURIComponent(search)}`;
      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        if (data.pagination) setTotalPages(data.pagination.pages);
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
  }, [search, currentPage]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Employee Activity Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete trace of status changes, print executions, and administrative records modifications across all modules.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by action, employee, details..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>
      </div>

      <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Event Action</th>
                <th className="py-4 px-6">Performed By</th>
                <th className="py-4 px-6">Description Details</th>
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-650" />
                    Loading activities...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-905 dark:text-white flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-teal-600" />
                        {log.action}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.entityType} ({log.ipAddress})</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.performedBy}
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-md">
                      <p className="line-clamp-2 text-slate-600 dark:text-slate-450 leading-relaxed">
                        {log.details}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-slate-550 dark:text-slate-450">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailOpen(true);
                        }}
                        className="rounded-xl h-8 px-3 text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                      >
                        Inspect values
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Audit log json values inspector modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-650" />
              Audit Log Details Inspector
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review state values transition logged during administrative modifications.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider">Action</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedLog.action}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider">Employee</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedLog.performedBy}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Trace Details</span>
                  <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-850 mt-1">
                    {selectedLog.details}
                  </p>
                </div>
              </div>

              {(selectedLog.oldValue !== undefined || selectedLog.newValue !== undefined) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Old State Value</span>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] overflow-auto max-h-40 leading-relaxed border dark:border-slate-800">
                      {typeof selectedLog.oldValue === "object" 
                        ? JSON.stringify(selectedLog.oldValue, null, 2) 
                        : String(selectedLog.oldValue)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">New State Value</span>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[10px] overflow-auto max-h-40 leading-relaxed border dark:border-slate-800">
                      {typeof selectedLog.newValue === "object" 
                        ? JSON.stringify(selectedLog.newValue, null, 2) 
                        : String(selectedLog.newValue)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl h-10 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 px-6 cursor-pointer"
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
