"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp, 
  Filter,
  Droplet,
  Users,
  Activity,
  Heart,
  FileSpreadsheet,
  Gift,
  Award,
  Share2
} from "lucide-react";
import { toast } from "sonner";

type ReportCategory = 
  | "inventory" 
  | "donors" 
  | "employees" 
  | "donations" 
  | "requests"
  | "inquiries"
  | "registrations"
  | "referrals"
  | "rewards"
  | "marketing";

export default function AdminReportsPage() {
  const [category, setCategory] = useState<ReportCategory>("inquiries");
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [status, setStatus] = useState("");

  async function loadReportData() {
    setLoading(true);
    try {
      let endpoint = `/api/${category}`;
      
      // Map categories to endpoints
      if (category === "inventory") {
        endpoint = "/api/stats"; 
      } else if (category === "inquiries") {
        endpoint = "/api/donor-queries";
      } else if (category === "registrations") {
        endpoint = "/api/donor-registration/admin";
      } else if (category === "referrals" || category === "rewards" || category === "marketing") {
        endpoint = "/api/referrals";
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (category === "inventory") {
        if (data.success && data.stats) {
          setDataList(data.stats.bloodGroupStats || []);
        }
      } else if (category === "donors") {
        setDataList(data.donors || []);
      } else if (category === "employees") {
        setDataList(data.employees || []);
      } else if (category === "donations") {
        setDataList(data.donations || []);
      } else if (category === "requests") {
        setDataList(data.requests || []);
      } else if (category === "inquiries") {
        setDataList(data.inquiries || []);
      } else if (category === "registrations") {
        setDataList(data.registrations || []);
      } else if (category === "referrals" || category === "rewards" || category === "marketing") {
        const refs = data.referrals || [];
        if (category === "rewards") {
          setDataList(refs.filter((r: any) => r.rewardEligible));
        } else if (category === "marketing") {
          // Group by marketing source for counts
          const counts: Record<string, number> = {};
          refs.forEach((r: any) => {
            const src = r.sourceReferralType || "Website";
            counts[src] = (counts[src] || 0) + 1;
          });
          const mapped = Object.entries(counts).map(([source, count]) => ({
            source,
            count,
          }));
          setDataList(mapped);
        } else {
          setDataList(refs);
        }
      }
    } catch (err) {
      toast.error("Failed to load report data from database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportData();
  }, [category]);

  // Apply Client-Side Filters
  const getFilteredData = () => {
    let filtered = [...dataList];

    // 1. Blood Group Filter
    if (bloodGroup) {
      if (category === "inventory") {
        filtered = filtered.filter(item => item.bloodGroup === bloodGroup);
      } else if (category === "donors") {
        filtered = filtered.filter(item => item.personalInformation?.bloodGroup === bloodGroup);
      } else if (category === "donations" || category === "requests") {
        filtered = filtered.filter(item => item.bloodGroup === bloodGroup);
      } else if (category === "registrations") {
        filtered = filtered.filter(item => item.personalInfo?.bloodGroup === bloodGroup);
      }
    }

    // 2. Status Filter
    if (status) {
      if (category === "donors") {
        filtered = filtered.filter(item => item.donationStatus === status);
      } else if (category === "employees") {
        filtered = filtered.filter(item => item.status === status);
      } else if (category === "donations" || category === "requests") {
        filtered = filtered.filter(item => item.status === status);
      } else if (category === "inquiries") {
        filtered = filtered.filter(item => item.status === status);
      } else if (category === "registrations") {
        filtered = filtered.filter(item => item.status === status);
      } else if (category === "referrals" || category === "rewards") {
        filtered = filtered.filter(item => item.rewardStatus === status);
      }
    }

    // 3. Date Range Filter
    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter(item => {
        const dateVal = item.createdAt || item.donationDate || item.requiredDate;
        return dateVal ? new Date(dateVal).getTime() >= start : true;
      });
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      filtered = filtered.filter(item => {
        const dateVal = item.createdAt || item.donationDate || item.requiredDate;
        return dateVal ? new Date(dateVal).getTime() <= end : true;
      });
    }

    return filtered;
  };

  const filteredReportData = getFilteredData();

  // Export CSV
  const handleExportCSV = () => {
    if (filteredReportData.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    let headers: string[] = [];
    let rows: any[][] = [];

    if (category === "inventory") {
      headers = ["Donor Blood Group", "Cryo-vials Stored", "Status"];
      rows = filteredReportData.map(item => [
        item.bloodGroup,
        item.units,
        item.units > 15 ? "Sufficient" : item.units > 5 ? "Moderate" : "Critical Low"
      ]);
    } else if (category === "donors") {
      headers = ["Donor ID", "Name", "Blood Group", "Gender", "Total Cycles", "Last Collection", "Status"];
      rows = filteredReportData.map(d => [
        d.donorId,
        d.user?.name || "Anonymous",
        d.personalInformation?.bloodGroup || "N/A",
        d.personalInformation?.gender || "N/A",
        d.donationInformation?.totalDonations || 0,
        d.donationInformation?.lastDonationDate ? new Date(d.donationInformation.lastDonationDate).toLocaleDateString() : "Never",
        d.donationStatus
      ]);
    } else if (category === "employees") {
      headers = ["Employee ID", "Name", "Designation", "Department", "Shift", "Salary", "Status"];
      rows = filteredReportData.map(emp => [
        emp.employeeId,
        emp.name,
        emp.designation,
        emp.department,
        emp.shift,
        `₹${emp.salary.toLocaleString()}`,
        emp.status
      ]);
    } else if (category === "donations") {
      headers = ["Collection ID", "Donor Name", "Blood Group", "Vials", "Date", "Sperm Conc.", "Status"];
      rows = filteredReportData.map(don => [
        don._id,
        don.donor?.user?.name || "Anonymous",
        don.bloodGroup,
        don.units,
        new Date(don.donationDate).toLocaleDateString(),
        don.hemoglobin || "N/A",
        don.status
      ]);
    } else if (category === "requests") {
      headers = ["Request ID", "Recipient Name", "Blood Group", "Vials Requested", "IVF Clinic", "Urgency", "Status"];
      rows = filteredReportData.map(req => [
        req._id,
        req.user?.name || "Anonymous",
        req.bloodGroup,
        req.units,
        req.hospitalName,
        req.urgency,
        req.status
      ]);
    } else if (category === "inquiries") {
      headers = ["Inquiry ID", "Name", "Contact Phone", "Email", "Interest", "Height (cm)", "Weight (kg)", "Hair Color", "Eye Color", "Skin Tone", "Location", "Time Prefer", "Status", "Date Created"];
      rows = filteredReportData.map(inq => [
        inq._id,
        inq.fullName,
        inq.mobileNumber,
        inq.emailAddress,
        inq.donationInterest,
        inq.height || "N/A",
        inq.weight || "N/A",
        inq.hairColor || "N/A",
        inq.eyeColor || "N/A",
        inq.skinTone || "N/A",
        `${inq.city}, ${inq.state}`,
        inq.preferredContactTime,
        inq.status,
        new Date(inq.createdAt).toLocaleDateString()
      ]);
    } else if (category === "registrations") {
      headers = ["Registration ID", "Name", "Donor Type", "Blood Group", "Aadhaar", "Email", "Phone", "Status", "Date Submitted"];
      rows = filteredReportData.map(reg => [
        reg.registrationId,
        reg.personalInfo?.fullName || "N/A",
        reg.donorType,
        reg.personalInfo?.bloodGroup || "N/A",
        reg.personalInfo?.aadhaarNumber || "N/A",
        reg.contactInfo?.emailAddress || "N/A",
        reg.contactInfo?.mobileNumber || "N/A",
        reg.status,
        new Date(reg.createdAt).toLocaleDateString()
      ]);
    } else if (category === "referrals") {
      headers = ["Referral ID", "Source Channel", "Referrer Name", "Referrer Contact", "Referrer ID", "Referred Candidate", "Reg Status", "Reward Status"];
      rows = filteredReportData.map(ref => [
        ref._id,
        ref.sourceReferralType,
        ref.referrerName,
        ref.mobileNumber || "N/A",
        ref.patientOrDonorId || "N/A",
        ref.referredDonorName,
        ref.registrationStatus,
        ref.rewardStatus
      ]);
    } else if (category === "rewards") {
      headers = ["Referral ID", "Referrer Name", "Type", "Referred Candidate", "Reward Eligible", "Amount (₹)", "Status", "Date Paid", "Method"];
      rows = filteredReportData.map(ref => [
        ref._id,
        ref.referrerName,
        ref.sourceReferralType,
        ref.referredDonorName,
        ref.rewardEligible ? "Yes" : "No",
        ref.rewardAmount || 0,
        ref.rewardStatus,
        ref.paymentDate ? new Date(ref.paymentDate).toLocaleDateString() : "Pending",
        ref.paymentMethod || "N/A"
      ]);
    } else if (category === "marketing") {
      headers = ["Marketing Source Channel", "Referral Counts", "Percentage Share (%)"];
      const total = filteredReportData.reduce((sum, item) => sum + item.count, 0) || 1;
      rows = filteredReportData.map(item => [
        item.source,
        item.count,
        ((item.count / total) * 100).toFixed(1) + "%"
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${category}_analytical_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Successfully exported ${category.toUpperCase()} report to CSV/Excel format.`);
  };

  return (
    <div className="space-y-6 pb-12 print:bg-white print:p-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-500" /> Analytical Reporting Console
          </h1>
          <p className="text-xs text-slate-500">
            Generate, filter, and export administrative audits for donor queries, registrations, referrals, specimen stocks, and clinic roster logs.
          </p>
        </div>
        <Button onClick={loadReportData} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200">
          <RefreshCw className="w-3.5 h-3.5" /> Reload Data
        </Button>
      </div>

      {/* Switcher Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:hidden">
        {[
          { id: "inquiries", label: "Donor Inquiries", desc: "Pre-registration logs", icon: FileText, color: "text-orange-500" },
          { id: "registrations", label: "Donor Applications", desc: "Completed wizard files", icon: Users, color: "text-rose-500" },
          { id: "referrals", label: "Referrals Tracker", desc: "Patient/Donor channels", icon: Share2, color: "text-teal-500" },
          { id: "rewards", label: "Referral Rewards", desc: "Financial payouts audit", icon: Gift, color: "text-indigo-500" },
          { id: "marketing", label: "Marketing Sources", desc: "Traffic & ads share", icon: TrendingUp, color: "text-amber-500" },
          { id: "inventory", label: "Inventory Stock", desc: "Specimen cryo-vials", icon: Droplet, color: "text-rose-500 fill-rose-500/10" },
          { id: "donors", label: "Approved Donors", desc: "Active donor profiles", icon: Users, color: "text-blue-500" },
          { id: "employees", label: "Staff Roster", desc: "Staff designations", icon: Activity, color: "text-emerald-500" },
          { id: "donations", label: "Collections", desc: "Specimen cycles", icon: Heart, color: "text-pink-500" },
          { id: "requests", label: "Allocations", desc: "Clinic specimen orders", icon: FileSpreadsheet, color: "text-blue-600" }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as any)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              category === cat.id 
                ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/25 shadow-sm" 
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <cat.icon className={`w-4 h-4 mb-2.5 ${cat.color}`} />
            <div className="font-bold text-xs text-slate-900 dark:text-white leading-none">{cat.label}</div>
            <div className="text-[9px] text-slate-500 mt-1">{cat.desc}</div>
          </button>
        ))}
      </div>

      {/* Filters Dashboard */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          {["inventory", "donors", "donations", "requests", "registrations"].includes(category) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Blood Group</label>
              <select 
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">All Groups</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          )}
          {!["inventory", "marketing"].includes(category) && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Status</label>
              <select 
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {category === "inquiries" && (
                  <>
                    <option value="New Inquiry">New Inquiry</option>
                    <option value="Contact Attempted">Contact Attempted</option>
                    <option value="Consultation Scheduled">Consultation Scheduled</option>
                    <option value="Consultation Completed">Consultation Completed</option>
                    <option value="Registered">Registered</option>
                    <option value="Rejected">Rejected</option>
                  </>
                )}
                {category === "registrations" && (
                  <>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </>
                )}
                {["referrals", "rewards"].includes(category) && (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </>
                )}
                {category === "donors" && (
                  <>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </>
                )}
                {category === "employees" && (
                  <>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </>
                )}
                {["donations", "requests"].includes(category) && (
                  <>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-900">
          <div className="text-xs font-semibold text-slate-600">
            Preview matches: {filteredReportData.length} records filtered
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="h-8 rounded-lg text-xs gap-1 border-slate-200 bg-teal-500/5 hover:bg-teal-500/10 border-teal-500/35 text-teal-700 dark:text-teal-400">
              <Download className="w-3.5 h-3.5" /> Download Excel/CSV Report
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="h-8 rounded-lg text-xs gap-1 border-slate-200">
              <Printer className="w-3.5 h-3.5" /> Print PDF Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Preview Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/40 dark:bg-slate-900/10 py-3">
          <CardTitle className="text-sm font-bold capitalize">{category} Audit Logs</CardTitle>
          <CardDescription className="text-[10px] text-slate-400">Generated on {new Date().toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-20 text-xs text-slate-500">Generating report pipeline...</div>
          ) : filteredReportData.length === 0 ? (
            <div className="text-center py-20 text-xs text-slate-400">No records found matching filters.</div>
          ) : (
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left">
                
                {/* 1. DONOR INQUIRIES PREVIEW */}
                {category === "inquiries" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Candidate</th>
                        <th className="p-3">Interest</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Contact Time</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((inq, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold">{inq.fullName}</td>
                          <td className="p-3 capitalize font-semibold">{inq.donationInterest}</td>
                          <td className="p-3 space-y-0.5">
                            <div>{inq.mobileNumber}</div>
                            <div className="text-[10px] text-slate-500">{inq.emailAddress}</div>
                          </td>
                          <td className="p-3">{inq.city}, {inq.state}</td>
                          <td className="p-3">{inq.preferredContactTime}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">{inq.status}</span>
                          </td>
                          <td className="p-3">{new Date(inq.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 2. DONOR REGISTRATIONS PREVIEW */}
                {category === "registrations" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Reg ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Donor Type</th>
                        <th className="p-3">Blood Group</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((reg, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-mono font-bold text-teal-600">{reg.registrationId}</td>
                          <td className="p-3 font-bold">{reg.personalInfo?.fullName || "Draft Donor"}</td>
                          <td className="p-3 capitalize font-semibold">{reg.donorType}</td>
                          <td className="p-3 font-bold text-rose-500">{reg.personalInfo?.bloodGroup || "—"}</td>
                          <td className="p-3 space-y-0.5">
                            <div>{reg.contactInfo?.mobileNumber || "—"}</div>
                            <div className="text-[10px] text-slate-500">{reg.contactInfo?.emailAddress || "—"}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700">{reg.status}</span>
                          </td>
                          <td className="p-3">{new Date(reg.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 3. REFERRALS PREVIEW */}
                {category === "referrals" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Source Channel</th>
                        <th className="p-3">Referrer</th>
                        <th className="p-3">Referred Donor</th>
                        <th className="p-3">Reg Status</th>
                        <th className="p-3">Reward Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((ref, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-teal-600">{ref.sourceReferralType}</td>
                          <td className="p-3 space-y-0.5">
                            <div className="font-bold">{ref.referrerName}</div>
                            {ref.patientOrDonorId && <div className="text-[9px] text-slate-500">ID: {ref.patientOrDonorId}</div>}
                          </td>
                          <td className="p-3 font-semibold">{ref.referredDonorName}</td>
                          <td className="p-3 uppercase font-bold text-slate-600">{ref.registrationStatus}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700">{ref.rewardStatus}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 4. REWARDS PREVIEW */}
                {category === "rewards" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Referrer</th>
                        <th className="p-3">Referred Donor</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Payment Date</th>
                        <th className="p-3">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((ref, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold">{ref.referrerName}</td>
                          <td className="p-3 font-semibold">{ref.referredDonorName}</td>
                          <td className="p-3 font-bold text-emerald-600">₹{(ref.rewardAmount || 0).toLocaleString()}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">{ref.rewardStatus}</span>
                          </td>
                          <td className="p-3">{ref.paymentDate ? new Date(ref.paymentDate).toLocaleDateString() : "Pending"}</td>
                          <td className="p-3 font-mono">{ref.paymentMethod || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 5. MARKETING CHANNELS PREVIEW */}
                {category === "marketing" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Traffic Source Channel</th>
                        <th className="p-3">Referral Inquiries Count</th>
                        <th className="p-3">Distribution Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {(() => {
                        const total = filteredReportData.reduce((sum, item) => sum + item.count, 0) || 1;
                        return filteredReportData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{item.source}</td>
                            <td className="p-3 font-bold">{item.count} Inquiries</td>
                            <td className="p-3 font-bold text-teal-600">{((item.count / total) * 100).toFixed(1)}%</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </>
                )}

                {/* 6. INVENTORY */}
                {category === "inventory" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Donor Blood Group</th>
                        <th className="p-3">Vials Available</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold text-rose-600">{item.bloodGroup}</td>
                          <td className="p-3 font-bold">{item.units} Vials</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.units > 15 ? "bg-emerald-100 text-emerald-700" :
                              item.units > 5 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {item.units > 15 ? "Sufficient" : item.units > 5 ? "Moderate" : "Critical Stock Alert"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 7. DONORS */}
                {category === "donors" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Donor ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Blood Group</th>
                        <th className="p-3">Total Cycles</th>
                        <th className="p-3">Last Donation Date</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((d, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold">{d.donorId}</td>
                          <td className="p-3 font-semibold">{d.user?.name || "Anonymous"}</td>
                          <td className="p-3">
                            <span className="font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">{d.personalInformation?.bloodGroup}</span>
                          </td>
                          <td className="p-3">{d.donationInformation?.totalDonations || 0} Cycles</td>
                          <td className="p-3">{d.donationInformation?.lastDonationDate ? new Date(d.donationInformation.lastDonationDate).toLocaleDateString() : "N/A"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700`}>{d.donationStatus}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 8. STAFF */}
                {category === "employees" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Employee ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Designation</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Shift</th>
                        <th className="p-3">Annual Salary</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-bold">{emp.employeeId}</td>
                          <td className="p-3 font-semibold">{emp.name}</td>
                          <td className="p-3 text-teal-600 font-bold">{emp.designation}</td>
                          <td className="p-3">{emp.department}</td>
                          <td className="p-3">{emp.shift}</td>
                          <td className="p-3 font-bold">₹{emp.salary.toLocaleString()}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-150 text-emerald-700">{emp.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 9. DONATIONS */}
                {category === "donations" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Donor</th>
                        <th className="p-3">Blood Group</th>
                        <th className="p-3">Vials</th>
                        <th className="p-3">Collection Date</th>
                        <th className="p-3">Sperm Conc.</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((don, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-semibold">{don.donor?.user?.name || "Anonymous"}</td>
                          <td className="p-3"><span className="font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">{don.bloodGroup}</span></td>
                          <td className="p-3 font-bold">{don.units} Vials</td>
                          <td className="p-3">{new Date(don.donationDate).toLocaleDateString()}</td>
                          <td className="p-3">{don.hemoglobin ? `${don.hemoglobin} M/mL` : "N/A"}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{don.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 10. REQUESTS / ALLOCATIONS */}
                {category === "requests" && (
                  <>
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b dark:border-slate-800">
                      <tr>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Blood Group</th>
                        <th className="p-3">Vials Requested</th>
                        <th className="p-3">IVF Clinic</th>
                        <th className="p-3">Required Date</th>
                        <th className="p-3">Urgency</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-900">
                      {filteredReportData.map((req, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-semibold">{req.user?.name || "Anonymous"}</td>
                          <td className="p-3"><span className="font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">{req.bloodGroup}</span></td>
                          <td className="p-3 font-bold">{req.units} Vials</td>
                          <td className="p-3">{req.hospitalName}</td>
                          <td className="p-3">{new Date(req.requiredDate).toLocaleDateString()}</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{req.urgency}</span></td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{req.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
