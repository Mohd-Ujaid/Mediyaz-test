"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Activity, 
  Tag, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog States
  const [isOpen, setIsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [targetId, setTargetId] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    category: "Cryopreservation",
    pricing: 0,
    availability: "Available",
    benefitsText: "" // Comma separated benefits
  });

  async function loadServices() {
    try {
      const res = await fetch(`/api/services?page=${currentPage}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
        if (data.pagination) setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, [currentPage]);

  const openCreate = () => {
    setForm({
      title: "",
      description: "",
      image: "",
      category: "Cryopreservation",
      pricing: 0,
      availability: "Available",
      benefitsText: ""
    });
    setEditMode(false);
    setIsOpen(true);
  };

  const openEdit = (srv: any) => {
    setForm({
      title: srv.title,
      description: srv.description,
      image: srv.image || "",
      category: srv.category,
      pricing: srv.pricing,
      availability: srv.availability || "Available",
      benefitsText: srv.benefits ? srv.benefits.join(", ") : ""
    });
    setTargetId(srv._id);
    setEditMode(true);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const benefits = form.benefitsText.split(",").map(b => b.trim()).filter(Boolean);

    try {
      const payload = {
        ...form,
        benefits,
        id: editMode ? targetId : undefined
      };

      const res = await fetch("/api/services", {
        method: editMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editMode ? "Service updated successfully!" : "Service created successfully!");
        setIsOpen(false);
        loadServices();
      } else {
        toast.error(data.error || "Failed to save service.");
      }
    } catch (err) {
      toast.error("Network error saving service.");
    }
  };

  const handleToggleStatus = async (srv: any) => {
    const nextStatus = srv.status === "ENABLED" ? "DISABLED" : "ENABLED";
    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: srv._id, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Service status set to ${nextStatus}`);
        loadServices();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Network error toggling status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service listing?")) return;

    try {
      const res = await fetch(`/api/services?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Service deleted.");
        loadServices();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Network error deleting service.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" /> Services Configuration Manager
          </h1>
          <p className="text-xs text-slate-500">
            Configure clinic service listings, modify prices, update categories, and toggle online visibility.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
          <Plus className="w-4 h-4" /> Add Clinical Service
        </Button>
      </div>

      {/* Grid of services */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-500">Loading catalog pipeline...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 text-xs text-slate-400">No services catalogued. Click 'Add Service' to create one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <Card key={srv._id} className={`rounded-2xl border bg-white dark:bg-slate-950 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all ${srv.status === "DISABLED" ? "opacity-60 border-dashed" : "border-slate-200 dark:border-slate-800"}`}>
              <div>
                <img loading="lazy" 
                  src={srv.image || "https://images.unsplash.com/photo-1579154769741-62865915b820?auto=format&fit=crop&w=600&q=80"} 
                  alt={srv.title} 
                  className="w-full h-40 object-cover" 
                />
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-[9px] font-extrabold uppercase text-slate-500">
                      <Tag className="w-3.5 h-3.5" /> {srv.category}
                    </span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      srv.status === "ENABLED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                    }`}>
                      {srv.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{srv.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{srv.description}</p>
                  
                  <div className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    Pricing: {srv.pricing > 0 ? `₹${srv.pricing.toLocaleString()}` : "Free/Variable"}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2 border-t dark:border-slate-900 pt-3">
                <Button 
                  onClick={() => openEdit(srv)} 
                  variant="outline" 
                  className="flex-1 rounded-xl text-xs gap-1 border-slate-200"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button 
                  onClick={() => handleToggleStatus(srv)} 
                  variant="outline" 
                  className="rounded-xl text-xs"
                >
                  {srv.status === "ENABLED" ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                </Button>
                <Button 
                  onClick={() => handleDelete(srv._id)} 
                  variant="outline" 
                  className="rounded-xl text-xs border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && services.length > 0 && (
        <div className="mt-8 pt-4 border-t dark:border-slate-800">
          <CustomPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editMode ? "Modify Service Listing" : "Catalogue New Service"}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Fill in clinical details to publish on the public service index.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Service Title</label>
              <Input 
                placeholder="e.g. Pre-Implantation Genetic Screening" 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Description</label>
              <textarea 
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Explain the clinical diagnostics, laboratory vitrification thaws or courier logistics..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Category</label>
                <select
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-xs focus:outline-none"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="Cryopreservation">Cryopreservation</option>
                  <option value="Diagnostics">Diagnostics</option>
                  <option value="Consultations">Consultations</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Pricing (₹)</label>
                <Input 
                  type="number" 
                  min={0}
                  value={form.pricing} 
                  onChange={(e) => setForm({ ...form, pricing: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Availability</label>
                <Input 
                  placeholder="e.g. Mon - Fri, 8AM - 5PM" 
                  value={form.availability} 
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Image URL</label>
                <Input 
                  placeholder="https://..." 
                  value={form.image} 
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Key Benefits (Comma separated)</label>
              <Input 
                placeholder="e.g. 99% Cell Viability, Dual Vaults, FDA Approved" 
                value={form.benefitsText} 
                onChange={(e) => setForm({ ...form, benefitsText: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl text-xs">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs">
                {editMode ? "Save Changes" : "Create Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
