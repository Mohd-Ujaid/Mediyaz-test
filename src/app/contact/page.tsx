"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `[Subject: ${formData.subject}] ${formData.message}`
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Message sent successfully! Our support desk will respond shortly.");
        setSubmitted(true);
      } else {
        toast.error(data.error || "Failed to dispatch message.");
      }
    } catch (err) {
      toast.error("Network error sending message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Hero */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Contact Global Patient Care
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Our clinical team is available 24/7 to provide confidential guidance and appointment scheduling.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">Toll-Free Hotline</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">+1 (800) 555-0199</div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">Confidential Email</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">support@mediyaz.org</div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">Global Headquarters</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Boston Medical Center District • Boston, MA</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-lg">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h3 className="text-2xl font-bold">Thank You!</h3>
                    <p className="text-xs text-slate-500">Your message has been dispatched to our clinical support team.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Send a Message</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold">Your Name</label>
                        <Input 
                          placeholder="John Doe" 
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold">Email Address</label>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold">Subject / Inquiry Type</label>
                      <Input 
                        placeholder="e.g. Donor Program, Sperm Banking, IVF Logistics" 
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold">Message</label>
                      <textarea
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                        rows={4}
                        placeholder="Write your message or inquiry here with complete confidentiality..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
                      disabled={loading}
                    >
                      <Send className="w-4 h-4" /> {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </Card>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
