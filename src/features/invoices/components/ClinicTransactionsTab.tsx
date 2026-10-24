"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Building2,
  Calendar,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ChevronRight,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { confirmAction } from "@/components/ui/custom-confirm-modal";
import { formatDotDate } from "@/lib/invoice-utils";

export function ClinicTransactionsTab({
  hospitals,
  onOpenRecordPayment,
}: {
  hospitals: any[];
  onOpenRecordPayment: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalGross: 0,
    totalTds: 0,
    totalNet: 0,
    totalCredit: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("ALL");
  const [selectedFy, setSelectedFy] = useState("ALL");
  const [selectedQuarter, setSelectedQuarter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Transaction for Detail Modal
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedHospitalId && selectedHospitalId !== "ALL") params.append("hospitalId", selectedHospitalId);
      if (selectedFy && selectedFy !== "ALL") params.append("fy", selectedFy);
      if (selectedQuarter && selectedQuarter !== "ALL") params.append("quarter", selectedQuarter);
      params.append("page", currentPage.toString());
      params.append("limit", "25");

      const res = await fetch(`/api/clinic-payments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.payments || []);
        setStats(data.stats || {});
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        toast.error(data.error || "Failed to load transactions");
      }
    } catch {
      toast.error("Network error loading transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [selectedHospitalId, selectedFy, selectedQuarter, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTransactions();
  };

  // Void Transaction
  const handleVoidTx = (tx: any) => {
    confirmAction({
      title: `Void Transaction ${tx.paymentNo}?`,
      description: `This will reverse ₹${tx.amount.toLocaleString("en-IN")} and remove all allocations from ${tx.allocations?.length || 0} donor bills. This action will be audited.`,
      confirmLabel: "Yes, Void Transaction",
      cancelLabel: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/clinic-payments", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: tx._id,
              reason: "Cancelled by Admin",
            }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success(data.message || "Transaction voided and balances reversed.");
            loadTransactions();
          } else {
            toast.error(data.error || "Failed to void transaction");
          }
        } catch {
          toast.error("Error voiding transaction");
        }
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Transfers Received
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            ₹{stats.totalAmount?.toLocaleString("en-IN") || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">{totalCount} Payment Transactions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            Gross Billed Settled
          </div>
          <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            ₹{stats.totalGross?.toLocaleString("en-IN") || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Direct bill liability cleared</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Total TDS Deducted
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ₹{stats.totalTds?.toLocaleString("en-IN") || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Tracked for Form 16A reconciliation</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Clinic Advance Credit
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            ₹{stats.totalCredit?.toLocaleString("en-IN") || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Unallocated balance for future cases</p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Payment No, UTR, Clinic, Donor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={selectedHospitalId}
            onChange={(e) => {
              setSelectedHospitalId(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Partner Clinics</option>
            {hospitals.map((h: any) => (
              <option key={h.hospitalId || h._id} value={h.hospitalId || h._id}>
                {h.hospitalName || h.name}
              </option>
            ))}
          </select>

          <select
            value={selectedFy}
            onChange={(e) => {
              setSelectedFy(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Financial Years</option>
            <option value="2027-28">FY 2027-28</option>
            <option value="2026-27">FY 2026-27</option>
            <option value="2025-26">FY 2025-26</option>
            <option value="2024-25">FY 2024-25</option>
          </select>

          <select
            value={selectedQuarter}
            onChange={(e) => {
              setSelectedQuarter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Quarters</option>
            <option value="Q1">Q1 (Apr - Jun)</option>
            <option value="Q2">Q2 (Jul - Sep)</option>
            <option value="Q3">Q3 (Oct - Dec)</option>
            <option value="Q4">Q4 (Jan - Mar)</option>
          </select>

          <Button type="submit" size="sm" variant="outline" className="h-9 text-xs">
            Filter
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onOpenRecordPayment}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
          >
            <CreditCard className="h-4 w-4" />
            + Record Clinic Payment
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No clinic payment transactions found matching the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Payment No</th>
                  <th className="p-3">Clinic Name</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Mode & UTR / Ref</th>
                  <th className="p-3 text-right">Transfer Amount</th>
                  <th className="p-3 text-right">Gross Settled</th>
                  <th className="p-3 text-right">TDS Deducted</th>
                  <th className="p-3 text-right">Advance Credit</th>
                  <th className="p-3 text-center">Donors Settled</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr
                    key={tx._id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      tx.isVoided ? "opacity-50 line-through bg-rose-50/20" : ""
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {tx.paymentNo}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      {tx.hospital?.name || tx.hospitalName}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                      {tx.date ? formatDotDate(tx.date) : "-"}
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-slate-700 dark:text-slate-300">
                        {tx.reference || "-"}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        {tx.paymentMode?.replace("_", " ")}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      ₹{tx.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right text-sky-600 dark:text-sky-400 font-semibold">
                      ₹{tx.totalGrossSettled?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-semibold">
                      ₹{tx.totalTdsDeducted?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right font-semibold text-purple-600 dark:text-purple-400">
                      ₹{tx.unallocatedAmount > 0 ? tx.unallocatedAmount.toLocaleString("en-IN") : "-"}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tx.allocations?.length || 0} Donor(s)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {tx.isVoided ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          VOIDED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          COMPLETED
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTx(tx)}
                          className="h-7 px-2 text-xs text-sky-600 hover:text-sky-700"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>

                        {!tx.isVoided && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVoidTx(tx)}
                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Void
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={25}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <Dialog open={Boolean(selectedTx)} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Transaction Details: {selectedTx.paymentNo}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500">
                    {selectedTx.hospital?.name || selectedTx.hospitalName} • Received on{" "}
                    {selectedTx.date ? formatDotDate(selectedTx.date) : "-"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Amount</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  ₹{selectedTx.amount?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gross Settled</span>
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                  ₹{selectedTx.totalGrossSettled?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">TDS Deducted</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  ₹{selectedTx.totalTdsDeducted?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Advance Left</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  ₹{selectedTx.unallocatedAmount?.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Settled Donor Allocations ({selectedTx.allocations?.length || 0})
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Donor / Reg ID</th>
                      <th className="p-2.5">Invoice / Ref</th>
                      <th className="p-2.5 text-right">Gross Settled</th>
                      <th className="p-2.5 text-right">TDS</th>
                      <th className="p-2.5 text-right font-bold">Net Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedTx.allocations?.map((a: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {a.donorName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {a.registrationId} ({a.donorType})
                          </div>
                        </td>
                        <td className="p-2.5 font-mono text-indigo-600 dark:text-indigo-400">
                          {a.invoiceNumber ? `#${a.invoiceNumber}` : a.billRef || "-"}
                        </td>
                        <td className="p-2.5 text-right text-slate-700 dark:text-slate-300">
                          ₹{a.grossAmount?.toLocaleString("en-IN")}
                        </td>
                        <td className="p-2.5 text-right text-amber-600">
                          ₹{a.tdsAmount?.toLocaleString("en-IN")}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                          ₹{a.netAmount?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
