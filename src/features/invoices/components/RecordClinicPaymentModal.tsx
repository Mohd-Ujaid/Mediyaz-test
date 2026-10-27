"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Building2,
  Calendar,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Receipt,
  ArrowRight,
  RefreshCw,
  Wallet,
} from "lucide-react";

interface RecordClinicPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hospitals: Array<{ hospitalId: string; hospitalName: string; shortName?: string; wantInvoice?: boolean }>;
  preselectedHospitalId?: string;
  preselectedRegistrationId?: string;
}

export function RecordClinicPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  hospitals,
  preselectedHospitalId,
  preselectedRegistrationId,
}: RecordClinicPaymentModalProps) {
  const [selectedHospId, setSelectedHospId] = useState(preselectedHospitalId || "");
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [tdsSection, setTdsSection] = useState("194J");
  const [notes, setNotes] = useState("");

  // Outstanding Donors & Allocations
  const [donors, setDonors] = useState<any[]>([]);
  const [availableCredit, setAvailableCredit] = useState(0);
  const [hospInfo, setHospInfo] = useState<any>(null);

  // Allocations mapping: registrationId -> { checked, gross, tds, net }
  const [allocations, setAllocations] = useState<
    Record<string, { checked: boolean; gross: number; tds: number; net: number }>
  >({});

  useEffect(() => {
    if (preselectedHospitalId) {
      setSelectedHospId(preselectedHospitalId);
    }
  }, [preselectedHospitalId]);

  // Fetch outstanding donors whenever selected hospital changes
  useEffect(() => {
    if (!isOpen || !selectedHospId || selectedHospId === "ALL") {
      setDonors([]);
      setAllocations({});
      return;
    }

    async function fetchOutstanding() {
      setLoadingDonors(true);
      try {
        const res = await fetch(`/api/clinic-payments?action=outstanding-donors&hospitalId=${selectedHospId}`);
        const data = await res.json();
        if (data.success) {
          setDonors(data.outstandingDonors || []);
          setAvailableCredit(data.availableCredit || 0);
          setHospInfo(data.hospital);

          // Initial allocations map
          const initialMap: Record<string, any> = {};
          (data.outstandingDonors || []).forEach((d: any) => {
            const isPreselected = preselectedRegistrationId === d.registrationId;
            initialMap[d.registrationId] = {
              checked: isPreselected,
              gross: isPreselected ? d.pendingAmount : 0,
              tds: isPreselected ? d.suggestedTds : 0,
              net: isPreselected ? Math.max(0, d.pendingAmount - d.suggestedTds) : 0,
            };
          });
          setAllocations(initialMap);

          if (preselectedRegistrationId) {
            const match = (data.outstandingDonors || []).find(
              (d: any) => d.registrationId === preselectedRegistrationId
            );
            if (match) {
              setAmount(match.pendingAmount);
            }
          }
        } else {
          toast.error(data.error || "Failed to load clinic outstanding bills");
        }
      } catch (err) {
        toast.error("Network error while loading clinic bills");
      } finally {
        setLoadingDonors(false);
      }
    }

    fetchOutstanding();
  }, [isOpen, selectedHospId, preselectedRegistrationId]);

  // Auto-allocate amount across donors (oldest pickup date first)
  const handleAutoAllocate = () => {
    const totalAmount = Number(amount);
    if (!totalAmount || totalAmount <= 0) {
      toast.error("Please enter a valid payment amount first");
      return;
    }

    let remainingMoney = totalAmount;
    const newAlloc: Record<string, any> = {};

    donors.forEach((d) => {
      if (remainingMoney <= 0) {
        newAlloc[d.registrationId] = { checked: false, gross: 0, tds: 0, net: 0 };
        return;
      }

      // Can settle up to d.pendingAmount
      const needGross = d.pendingAmount;
      const suggestedTds = d.suggestedTds || 0;
      const needNet = Math.max(0, needGross - suggestedTds);

      if (remainingMoney >= needNet) {
        // Full settlement of this donor
        newAlloc[d.registrationId] = {
          checked: true,
          gross: needGross,
          tds: suggestedTds,
          net: needNet,
        };
        remainingMoney -= needNet;
      } else {
        // Partial settlement
        const partialNet = remainingMoney;
        const partialTds = Math.round(partialNet * 0.1);
        newAlloc[d.registrationId] = {
          checked: true,
          gross: partialNet + partialTds,
          tds: partialTds,
          net: partialNet,
        };
        remainingMoney = 0;
      }
    });

    setAllocations(newAlloc);
    toast.success("Amount automatically allocated to oldest outstanding bills!");
  };

  // Update allocation for specific donor
  const updateDonorAllocation = (
    registrationId: string,
    field: "gross" | "tds" | "net" | "checked",
    val: any
  ) => {
    setAllocations((prev) => {
      const cur = prev[registrationId] || { checked: false, gross: 0, tds: 0, net: 0 };
      const updated = { ...cur };

      if (field === "checked") {
        updated.checked = Boolean(val);
        if (updated.checked && updated.gross === 0) {
          const donor = donors.find((d) => d.registrationId === registrationId);
          if (donor) {
            updated.gross = donor.pendingAmount;
            updated.tds = donor.suggestedTds || 0;
            updated.net = Math.max(0, updated.gross - updated.tds);
          }
        }
      } else if (field === "gross") {
        updated.gross = Math.max(0, Number(val) || 0);
        updated.net = Math.max(0, updated.gross - updated.tds);
      } else if (field === "tds") {
        updated.tds = Math.max(0, Number(val) || 0);
        updated.net = Math.max(0, updated.gross - updated.tds);
      } else if (field === "net") {
        updated.net = Math.max(0, Number(val) || 0);
        updated.gross = updated.net + updated.tds;
      }

      return { ...prev, [registrationId]: updated };
    });
  };

  // Compute live allocation totals
  const totalGrossAllocated = Object.entries(allocations).reduce(
    (sum, [_, a]) => sum + (a.checked ? a.gross : 0),
    0
  );
  const totalTdsAllocated = Object.entries(allocations).reduce(
    (sum, [_, a]) => sum + (a.checked ? a.tds : 0),
    0
  );
  const totalNetAllocated = Object.entries(allocations).reduce(
    (sum, [_, a]) => sum + (a.checked ? a.net : 0),
    0
  );

  const parsedTxAmount = Number(amount) || 0;
  const unallocatedCredit = Math.max(0, parsedTxAmount - totalNetAllocated);
  const isOverAllocated = totalNetAllocated > parsedTxAmount;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospId) {
      toast.error("Please select a clinic");
      return;
    }
    if (!parsedTxAmount || parsedTxAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    if (isOverAllocated) {
      toast.error("Allocated amount cannot exceed the received transaction amount");
      return;
    }

    const payloadAllocations = Object.entries(allocations)
      .filter(([_, a]) => a.checked && a.gross > 0)
      .map(([regId, a]) => {
        const d = donors.find((x) => x.registrationId === regId);
        return {
          registrationId: regId,
          donorType: d?.donorType || "egg",
          donorName: d?.donorName || "",
          invoiceNumber: d?.invoiceNumber || "",
          billRef: d?.billRef || "",
          grossAmount: a.gross,
          tdsAmount: a.tds,
          netAmount: a.net,
        };
      });

    setSubmitting(true);
    try {
      const res = await fetch("/api/clinic-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: selectedHospId,
          amount: parsedTxAmount,
          paymentMode,
          reference,
          date: txDate,
          tdsSection,
          notes,
          allocations: payloadAllocations,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Payment recorded successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Failed to record payment");
      }
    } catch {
      toast.error("Network error while recording transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Record Clinic Payment Transaction
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-0.5">
                Record a single transfer or split one transaction across multiple donor bills with automatic TDS reconciliation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Top Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Clinic Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ART Clinic / Hospital *
              </label>
              <select
                value={selectedHospId}
                onChange={(e) => setSelectedHospId(e.target.value)}
                disabled={Boolean(preselectedHospitalId)}
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              >
                <option value="">Select Clinic...</option>
                {hospitals.some((h) => h.wantInvoice !== false) && (
                  <optgroup label="📋 CLINICS WITH TAX INVOICE">
                    {hospitals
                      .filter((h) => h.wantInvoice !== false)
                      .map((h) => (
                        <option key={h.hospitalId} value={h.hospitalId}>
                          {h.hospitalName} {h.shortName ? `(${h.shortName})` : ""}
                        </option>
                      ))}
                  </optgroup>
                )}
                {hospitals.some((h) => h.wantInvoice === false) && (
                  <optgroup label="📄 CLINICS WITHOUT INVOICE">
                    {hospitals
                      .filter((h) => h.wantInvoice === false)
                      .map((h) => (
                        <option key={h.hospitalId} value={h.hospitalId}>
                          {h.hospitalName} {h.shortName ? `(${h.shortName})` : ""}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              {availableCredit > 0 && (
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 mt-1">
                  <Wallet className="h-3 w-3" />
                  Available Advance Credit: ₹{availableCredit.toLocaleString("en-IN")}
                </p>
              )}
            </div>

            {/* Total Received Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Transaction Net Cash Received (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 195000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                min="1"
                required
                className="text-base font-semibold"
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Received Date *
              </label>
              <Input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
              />
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Reference (UTR/Cheque) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                UTR / Reference / Cheque No.
              </label>
              <Input
                type="text"
                placeholder="e.g. UTR123456789"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* TDS Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                TDS Section
              </label>
              <select
                value={tdsSection}
                onChange={(e) => setTdsSection(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="194J">194J (Professional / Tech Services - 10%)</option>
                <option value="194C">194C (Contractor - 1% / 2%)</option>
                <option value="none">No TDS</option>
              </select>
            </div>
          </div>

          {/* Allocation Table Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-sky-600" />
                  Split Across Outstanding Donor Bills
                </h3>
                <p className="text-xs text-slate-500">
                  Select which donors this transaction covers (sorted oldest pickup date first).
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoAllocate}
                disabled={!parsedTxAmount || donors.length === 0}
                className="bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 gap-1.5 text-xs font-semibold"
              >
                <Calculator className="h-3.5 w-3.5 text-sky-600" />
                Auto-Allocate (Oldest First)
              </Button>
            </div>

            {loadingDonors ? (
              <div className="py-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
                Loading clinic&apos;s outstanding cases...
              </div>
            ) : donors.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-sm">
                {selectedHospId
                  ? "No outstanding bills found for this clinic! All completed pickups are fully paid."
                  : "Please choose a clinic above to view its outstanding donor bills."}
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 z-10 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-8">#</th>
                      <th className="p-2.5">Donor / Reg ID</th>
                      <th className="p-2.5">Pickup Date</th>
                      <th className="p-2.5">Doc / Ref</th>
                      <th className="p-2.5 text-right">Pending Balance</th>
                      <th className="p-2.5 text-right w-24">Gross Settled</th>
                      <th className="p-2.5 text-right w-20">TDS</th>
                      <th className="p-2.5 text-right w-24 font-bold">Net Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {donors.map((d) => {
                      const alloc = allocations[d.registrationId] || {
                        checked: false,
                        gross: 0,
                        tds: 0,
                        net: 0,
                      };
                      return (
                        <tr
                          key={d.registrationId}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                            alloc.checked ? "bg-sky-50/40 dark:bg-sky-950/20" : ""
                          }`}
                        >
                          <td className="p-2.5">
                            <input
                              type="checkbox"
                              checked={alloc.checked}
                              onChange={(e) =>
                                updateDonorAllocation(d.registrationId, "checked", e.target.checked)
                              }
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                            />
                          </td>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {d.donorName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {d.registrationId} ({d.donorType})
                            </div>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300 font-medium">
                            {d.pickupDate || "-"}
                          </td>
                          <td className="p-2.5">
                            {d.invoiceNumber ? (
                              <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                #{d.invoiceNumber}
                              </span>
                            ) : d.billRef ? (
                              <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400">
                                {d.billRef}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                Awaiting Inv
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                            ₹{d.pendingAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              type="number"
                              disabled={!alloc.checked}
                              value={alloc.gross || ""}
                              onChange={(e) =>
                                updateDonorAllocation(d.registrationId, "gross", e.target.value)
                              }
                              className="h-7 text-xs text-right font-medium p-1 w-24"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              type="number"
                              disabled={!alloc.checked}
                              value={alloc.tds || ""}
                              onChange={(e) =>
                                updateDonorAllocation(d.registrationId, "tds", e.target.value)
                              }
                              className="h-7 text-xs text-right text-amber-600 font-medium p-1 w-20"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            ₹{alloc.net.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reconciliation Summary Footer */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-md">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Transaction Amount
                </span>
                <span className="text-base font-bold text-white">
                  ₹{parsedTxAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Gross Settled
                </span>
                <span className="text-base font-bold text-sky-400">
                  ₹{totalGrossAllocated.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  TDS Deducted
                </span>
                <span className="text-base font-bold text-amber-400">
                  ₹{totalTdsAllocated.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Advance / Credit Left
                </span>
                <span className="text-base font-bold text-emerald-400">
                  ₹{unallocatedCredit.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !parsedTxAmount || isOverAllocated}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
