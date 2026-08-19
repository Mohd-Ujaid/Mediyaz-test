"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Star, Heart, ArrowRight, ArrowLeft, Upload, 
  Video, CheckCircle2, ShieldAlert, Loader2, Trash2, X
} from "lucide-react";
import { toast } from "sonner";

const treatmentsList = [
  "IVF (In Vitro Fertilization)",
  "IUI (Intrauterine Insemination)",
  "ICSI (Sperm Injection)",
  "Egg Freezing",
  "Donor Programs (Egg/Sperm)",
  "Other Treatments"
];

export default function ShareStoryPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    name: "",
    title: "",
    rating: 5,
    treatment: "IVF (In Vitro Fertilization)",
    review: "",
    imageUrls: [] as string[],
    videoUrls: [] as string[]
  });

  // Media Upload States
  const [uploading, setUploading] = useState(false);

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    // Loop and upload
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate type
      if (type === "image" && !file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not a valid image file. Skipped.`);
        continue;
      }
      if (type === "video" && !file.type.startsWith("video/")) {
        toast.error(`"${file.name}" is not a valid video file. Skipped.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "stories");

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success && data.media?.url) {
          newUrls.push(data.media.url);
        } else {
          toast.error(`Failed to upload "${file.name}": ${data.error || "Unknown error"}`);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Connection error uploading "${file.name}".`);
      }
    }

    if (newUrls.length > 0) {
      setForm(prev => ({
        ...prev,
        [type === "image" ? "imageUrls" : "videoUrls"]: [
          ...prev[type === "image" ? "imageUrls" : "videoUrls"],
          ...newUrls
        ]
      }));
      toast.success(`Successfully uploaded ${newUrls.length} ${type}(s).`);
    }

    setUploading(false);
    
    // Clear input
    e.target.value = "";
  };

  const removeMedia = (index: number, type: "image" | "video") => {
    setForm(prev => {
      const targetArray = type === "image" ? "imageUrls" : "videoUrls";
      const updated = [...prev[targetArray]];
      updated.splice(index, 1);
      return {
        ...prev,
        [targetArray]: updated
      };
    });
    toast.info(`Removed ${type}.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.title || !form.review) {
      toast.error("Please complete all required fields (Name, Title, and Story).");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        toast.success("Story submitted successfully!");
      } else {
        toast.error(data.error || "Failed to submit story.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/stories" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Stories
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-lg overflow-hidden">
                
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-teal-400 blur-2xl" />
                  </div>
                  <Heart className="w-8 h-8 text-rose-500 mx-auto mb-3 animate-pulse fill-rose-500" />
                  <h1 className="text-2xl md:text-3xl font-extrabold">Share Your Miracle</h1>
                  <p className="text-xs text-blue-100/70 mt-2 max-w-md mx-auto">
                    Your journey can serve as a guiding light of hope for thousands of intended parents starting theirs.
                  </p>
                </div>

                <CardContent className="p-6 md:p-8 space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Name Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Full Name / Couple's Names <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Sarah & Robert Mitchell"
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        className="rounded-xl border-slate-200 dark:border-slate-800"
                        required
                      />
                    </div>

                    {/* Catchy Title */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Story Headline <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Our Miracle Baby boy Leo is Here!"
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        className="rounded-xl border-slate-200 dark:border-slate-800"
                        required
                      />
                    </div>

                    {/* Grid of Treatment & Rating */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Treatment Type Dropdown */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          Treatment Received <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.treatment}
                          onChange={e => setForm(prev => ({ ...prev, treatment: e.target.value }))}
                          className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          {treatmentsList.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Interactive Rating */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          Overall Experience Rating <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-1.5 h-10">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, rating: star }))}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star className={`w-6 h-6 ${star <= form.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Story Text */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Your Story / Testimonial <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        placeholder="Tell us about your fertility journey, the experience with our specialists, and the moment you held your baby..."
                        value={form.review}
                        onChange={e => setForm(prev => ({ ...prev, review: e.target.value }))}
                        rows={6}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none leading-relaxed"
                        required
                      />
                    </div>

                    {/* Media Upload Options (Multiple files supported) */}
                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Family/Baby Photo */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Upload Family / Baby Photos
                          </label>
                          <div className="relative border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 transition-colors">
                            <label className="flex flex-col items-center gap-1.5 cursor-pointer w-full py-2">
                              {uploading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                              ) : (
                                <Upload className="w-5 h-5 text-slate-400" />
                              )}
                              <span className="text-[10px] font-semibold text-slate-500 text-center">
                                {uploading ? "Uploading files..." : "Select Images (multiple)"}
                              </span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                multiple
                                className="hidden" 
                                onChange={e => handleFilesUpload(e, "image")}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Video Diary / Testimonial */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            Upload Video Diaries
                          </label>
                          <div className="relative border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 transition-colors">
                            <label className="flex flex-col items-center gap-1.5 cursor-pointer w-full py-2">
                              {uploading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                              ) : (
                                <video preload="none" playsInline className="w-5 h-5 text-slate-400" />
                              )}
                              <span className="text-[10px] font-semibold text-slate-500 text-center">
                                {uploading ? "Uploading files..." : "Select Videos (multiple)"}
                              </span>
                              <input 
                                type="file" 
                                accept="video/*" 
                                multiple
                                className="hidden" 
                                onChange={e => handleFilesUpload(e, "video")}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                        </div>

                      </div>

                      {/* Display Uploaded Previews */}
                      {(form.imageUrls.length > 0 || form.videoUrls.length > 0) && (
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Media Queue ({form.imageUrls.length + form.videoUrls.length} files)</h4>
                          
                          {/* Images grid */}
                          {form.imageUrls.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-[9px] font-bold text-slate-500 uppercase">Images</h5>
                              <div className="grid grid-cols-4 gap-2">
                                {form.imageUrls.map((url, index) => (
                                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white group">
                                    <img loading="lazy" src={url} alt="Thumbnail" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => removeMedia(index, "image")}
                                      className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Videos grid */}
                          {form.videoUrls.length > 0 && (
                            <div className="space-y-1.5">
                              <h5 className="text-[9px] font-bold text-slate-500 uppercase">Videos</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {form.videoUrls.map((url, index) => (
                                  <div key={url} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black group">
                                    <video preload="none" playsInline src={url} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => removeMedia(index, "video")}
                                      className="absolute top-1.5 right-1.5 bg-red-600/85 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    </div>

                    {/* Disclaimer */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        <strong>Privacy Consent:</strong> By submitting this story, you grant Mediyaz Fertility Clinic authorization to share your names, rating, testimonial text, and uploaded media on our public website. All submissions undergo compliance review before appearing live.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={submitting || uploading}
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting Story...
                        </>
                      ) : (
                        <>
                          Submit Your Miracle Story
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>

                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-xl space-y-6">
                
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8 fill-emerald-500 text-white" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Story Submitted for Review!</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                    Thank you so much for sharing your story. To ensure patient privacy compliance and clinical standard guidelines, our administration team will review your post shortly before it goes live.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/stories">
                    <Button size="lg" className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 w-full sm:w-auto">
                      View Success Stories
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button size="lg" variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 font-bold px-8 w-full sm:w-auto">
                      Go to Landing Page
                    </Button>
                  </Link>
                </div>

              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
