"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  FileText, 
  Upload, 
  Settings, 
  UserCheck, 
  ShieldCheck, 
  HeartHandshake, 
  Dna, 
  ArrowRight,
  CheckCircle2,
  Lock,
  User,
  RefreshCw,
  Plus,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";

interface MongoAppointment {
  _id: string;
  user?: { name: string; email: string; phone?: string };
  doctor?: { name: string; email: string; avatar?: string };
  date: string;
  time: string;
  notes?: string;
  status: string;
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "donor-requests" | "reports" | "documents" | "settings">("overview");
  const [appointments, setAppointments] = useState<MongoAppointment[]>([]);
  const [donorRequirements, setDonorRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAppointments() {
    setLoading(true);
    try {
      let res = await fetch("/api/appointments");
      let data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Error loading patient appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDonorRequirements() {
    try {
      const res = await fetch("/api/donor-requirements");
      const data = await res.json();
      if (data.success) {
        setDonorRequirements(data.requirements || []);
      }
    } catch (err) {
      console.error("Error loading donor requirements:", err);
    }
  }

  useEffect(() => {
    loadAppointments();
    loadDonorRequirements();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <img loading="lazy" src="/images/logo.webp" alt="Mediyaz Art Bank" className="h-8 w-auto object-contain" />
          </div>

          <nav className="space-y-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "overview" ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <User className="w-4 h-4" /> Overview
            </button>

            <button
              onClick={() => setActiveTab("appointments")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "appointments" ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Calendar className="w-4 h-4" /> Appointments
            </button>

            <button
              onClick={() => setActiveTab("donor-requests")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "donor-requests" ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Dna className="w-4 h-4" /> Donor Requirements
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "reports" ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <FileText className="w-4 h-4" /> Medical Reports
            </button>

            <button
              onClick={() => setActiveTab("documents")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "documents" ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Upload className="w-4 h-4" /> Documents
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "settings" ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500">Logged in as</div>
          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {session?.user?.email || "patient@mediyaz.org"}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back, {session?.user?.name || "Patient"}
            </h1>
            <p className="text-xs text-slate-500">
              Manage your confidential fertility records, live appointments, and matching files.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadAppointments} variant="outline" className="rounded-xl text-xs gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Link href="/appointments/book">
              <Button className="rounded-xl bg-primary hover:bg-teal-700 text-white text-xs gap-2 font-medium cursor-pointer shadow-xs">
                <Plus className="w-4 h-4" /> Book New Session
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2">
                <div className="text-xs font-semibold text-slate-500">Upcoming Consultations</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {loading ? "..." : `${appointments.length} Active`}
                </div>
                <div className="text-[11px] text-primary font-medium">Synced with MongoDB Registry</div>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2">
                <div className="text-xs font-semibold text-slate-500">Donor Matching Requirements</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {donorRequirements.length} Active Dossiers
                </div>
                <div className="text-[11px] text-primary font-medium">Assigned Coordinator Review</div>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-2">
                <div className="text-xs font-semibold text-slate-500">Cryo-Storage Status</div>
                <div className="text-2xl font-bold text-primary">Active -196°C</div>
                <div className="text-[11px] text-slate-500">Vault #4 • Tank B</div>
              </Card>
            </div>

            {/* Upcoming Appointment Details */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <h3 className="text-lg font-bold">Next Scheduled Appointment</h3>
              {appointments.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-primary">{appointments[0].notes || "Clinical Consultation"}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">With {appointments[0].doctor?.name || "Dr. Sarah D'Souza"}</div>
                    <div className="text-[11px] text-slate-400">
                      Date: {new Date(appointments[0].date).toLocaleDateString()} • Time: {appointments[0].time}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toast.info("Telehealth room link will be active 15 mins before session.")} className="rounded-xl text-xs">
                    Join Telehealth Room
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-4">No upcoming appointments found in database.</div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "appointments" && (
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-bold">Live Patient Appointments</h3>
            {loading ? (
              <div className="text-xs text-slate-500 py-4">Loading from database...</div>
            ) : (
              <div className="space-y-3">
                {appointments.length > 0 ? (
                  appointments.map((item) => (
                    <div key={item._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-sm">{item.notes || "Clinical Consultation"}</div>
                        <div className="text-slate-500">{item.doctor?.name || "Dr. Sarah D'Souza"} • {new Date(item.date).toLocaleDateString()} at {item.time}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        item.status === "SCHEDULED" ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 py-4">No appointments scheduled.</div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* DONOR REQUIREMENTS TAB */}
        {activeTab === "donor-requests" && (
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">My Donor Matching Requirements</h3>
              <Link href="/recipient/find-donor">
                <Button className="rounded-xl bg-primary hover:bg-teal-700 text-white text-xs font-bold gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Submit New Requirement
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {donorRequirements.length > 0 ? (
                donorRequirements.map((req) => (
                  <div 
                    key={req._id} 
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          Matching Requirement Dossier
                        </h4>
                        <p className="text-[10px] text-slate-450 font-mono mt-0.5">Dossier ID: {req._id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          req.status === "Matched" || req.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : req.status === "Rejected" || req.status === "Closed"
                              ? "bg-red-100 text-red-700 dark:bg-red-955/50 dark:text-red-300"
                              : "bg-secondary/15 text-secondary-foreground"
                        }`}>
                          {req.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          req.priority === "High" || req.priority === "Urgent"
                            ? "bg-red-100 text-red-600"
                            : "bg-slate-200 text-slate-650 dark:bg-slate-800 dark:text-slate-450"
                        }`}>
                          {req.priority}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-3 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Looking For:</span>
                        <span className="font-bold uppercase text-primary">{req.treatmentRequirement.lookingFor} Donor</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Blood Group Preference:</span>
                        <span className="font-bold">{req.donorPreferences.bloodGroup || "Any"} ({req.donorPreferences.rhFactor || "Any"})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Assigned Coordinator:</span>
                        <span className="font-bold">{req.assignedStaff?.name || "Pending Assignment"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Date Submitted:</span>
                        <span className="font-bold">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {req.medicalInformation?.uploadedReports?.length > 0 && (
                      <div className="border-t pt-3 flex flex-wrap gap-2">
                        <span className="text-[10px] text-slate-450 w-full">Uploaded Reports:</span>
                        {req.medicalInformation.uploadedReports.map((file: any) => (
                          <a 
                            key={file.fileId} 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-medium border text-slate-700 dark:text-slate-300"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-450" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 space-y-3">
                  <Dna className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-xs">You have not submitted any donor matching requirements yet.</p>
                  <Link href="/recipient/find-donor">
                    <Button size="sm" className="rounded-xl bg-primary text-white text-xs font-bold shadow-xs cursor-pointer">
                      Create Dossier Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === "reports" && (
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-bold">Clinical Lab Reports & Certificates</h3>
            <div className="space-y-3">
              {[
                { title: "Expanded DNA Carrier Panel (300+ Diseases)", date: "July 12, 2026", doctor: "Dr. Sarah D'Souza" },
                { title: "Semen Quality & Post-Thaw Viability Report", date: "June 02, 2026", doctor: "Dr. Sarah D'Souza" }
              ].map((report, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-sm">{report.title}</div>
                    <div className="text-slate-550">Issued by {report.doctor} on {report.date}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Downloading PDF Report...")} className="rounded-xl gap-1 text-xs">
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "documents" && (
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-bold">Upload Confidential Medical Clearance / Photo ID</h3>
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <Upload className="w-8 h-8 text-slate-450 mx-auto" />
              <div className="text-xs font-semibold">Upload Photo ID or Medical Documents</div>
              <div className="text-[10px] text-slate-500">Files encrypted with 256-bit AES storage</div>
              <Button size="sm" variant="outline" onClick={() => toast.success("File upload simulated!")} className="mt-2 rounded-xl text-xs">
                Select File
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "settings" && (
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-bold">Account & Privacy Settings</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-semibold">Full Name</label>
                <Input defaultValue={session?.user?.name || "Patient Name"} />
              </div>
              <div>
                <label className="text-xs font-semibold">Email Address</label>
                <Input defaultValue={session?.user?.email || "patient@mediyaz.org"} disabled />
              </div>
              <Button onClick={() => toast.success("Settings saved.")} className="rounded-xl bg-primary hover:bg-teal-700 text-white text-xs cursor-pointer">
                Save Changes
              </Button>
            </div>
          </Card>
        )}

      </main>

    </div>
  );
}
