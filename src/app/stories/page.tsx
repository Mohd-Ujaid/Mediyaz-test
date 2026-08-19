"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Play, Star, Heart, ArrowRight, X, Filter, 
  Search, Video, Calendar, Quote, ShieldCheck, HeartHandshake, Baby,
  ChevronLeft, ChevronRight, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";

const categories = ["All", "IVF", "IUI", "Egg Freezing", "Donor Programs"];

export default function StoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Carousel Lightbox Modal State
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    mediaList: { type: "image" | "video"; url: string }[];
    index: number;
    storyTitle: string;
  }>({
    isOpen: false,
    mediaList: [],
    index: 0,
    storyTitle: ""
  });

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        if (data.success && data.reviews) {
          const approved = data.reviews.filter((r: any) => r.approved);
          setStories(approved);
        } else {
          toast.error("Failed to load success stories.");
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        toast.error("Failed to fetch reviews.");
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, []);

  const getStoryMedia = (story: any) => {
    const list: { type: "image" | "video"; url: string }[] = [];
    
    // 1. Process videos
    if (story.videoUrls && story.videoUrls.length > 0) {
      story.videoUrls.forEach((url: string) => {
        if (url && !list.some(m => m.url === url)) list.push({ type: "video", url });
      });
    } else if (story.videoUrl) {
      list.push({ type: "video", url: story.videoUrl });
    }

    // 2. Process images
    if (story.imageUrls && story.imageUrls.length > 0) {
      story.imageUrls.forEach((url: string) => {
        if (url && !list.some(m => m.url === url)) list.push({ type: "image", url });
      });
    } else if (story.imageUrl) {
      list.push({ type: "image", url: story.imageUrl });
    }

    return list;
  };

  const openLightbox = (story: any, initialIndex: number = 0) => {
    const mediaList = getStoryMedia(story);
    if (mediaList.length === 0) return;
    setLightbox({
      isOpen: true,
      mediaList,
      index: initialIndex,
      storyTitle: story.title || story.name || "Testimonial Gallery"
    });
  };

  const handlePrev = () => {
    setLightbox(prev => ({
      ...prev,
      index: prev.index === 0 ? prev.mediaList.length - 1 : prev.index - 1
    }));
  };

  const handleNext = () => {
    setLightbox(prev => ({
      ...prev,
      index: prev.index === prev.mediaList.length - 1 ? 0 : prev.index + 1
    }));
  };

  const filteredStories = stories.filter((story) => {
    const matchesCategory = selectedCategory === "All" || 
      story.treatment?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (selectedCategory === "Donor Programs" && story.treatment?.toLowerCase().includes("donor"));
      
    const matchesSearch = story.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.review?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.title?.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-6xl space-y-12">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              Families We've Helped Create
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Success Stories
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed"
          >
            Read inspiring testimonials and watch emotional video diaries from families who walked the path to parenthood with Mediyaz.
          </motion.p>

          {/* Quick Metrics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-3 gap-4 max-w-xl mx-auto pt-4 text-center border-y border-slate-200 dark:border-slate-800 py-6"
          >
            <div>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">72%</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mt-1">IVF Success Rate</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-rose-500">1,200+</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mt-1">Miracle Babies</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">100%</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mt-1">Dedicated Support</div>
            </div>
          </motion.div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat 
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search families or treatments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white"
            />
          </div>
        </div>

        {/* Testimonial Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-t-blue-600 border-slate-200 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Loading inspiring stories...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <Baby className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No stories found</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
              Try adjusting your filter or search query, or be the first to share your journey!
            </p>
            <div className="mt-6">
              <Link href="/stories/share">
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold">
                  Share Your Story
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredStories.map((story, idx) => {
                const mediaList = getStoryMedia(story);
                const firstMedia = mediaList[0];
                const hasAdditionalMedia = mediaList.length > 1;

                return (
                  <motion.div
                    key={story._id || idx}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="h-full flex"
                  >
                    <Card className="w-full flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl">
                      
                      {/* Media Header Grid */}
                      {firstMedia && (
                        <div className="space-y-1 flex flex-col shrink-0">
                          {/* Main Cover (First Media) */}
                          <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden group cursor-pointer" onClick={() => openLightbox(story, 0)}>
                            {firstMedia.type === "image" ? (
                              <img loading="lazy" 
                                src={firstMedia.url} 
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <video preload="none" playsInline src={firstMedia.url} className="w-full h-full object-cover" />
                            )}
                            
                            {/* Video Play Overlay */}
                            {firstMedia.type === "video" && (
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-colors text-white">
                                <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-all shadow-lg">
                                  <Play className="w-6 h-6 fill-white ml-1" />
                                </div>
                              </div>
                            )}

                            {/* Badges */}
                            <span className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-white/25">
                              {story.treatment}
                            </span>
                            {mediaList.length > 1 && (
                              <span className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-900/70 text-white text-[9px] font-bold px-2.5 py-1 rounded-full border border-white/10 shadow backdrop-blur-sm">
                                <ImageIcon className="w-3.5 h-3.5" /> +{mediaList.length - 1} More
                              </span>
                            )}
                          </div>

                          {/* Thumbnails Row if multi-media */}
                          {hasAdditionalMedia && (
                            <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                              {mediaList.slice(0, 4).map((m, mIdx) => (
                                <div 
                                  key={m.url} 
                                  onClick={() => openLightbox(story, mIdx)}
                                  className="relative aspect-square rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer hover:opacity-85 transition-opacity"
                                >
                                  {m.type === "image" ? (
                                    <img loading="lazy" src={m.url} alt="thumbnail" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-slate-950 flex items-center justify-center text-white">
                                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                                    </div>
                                  )}
                                  {/* Last thumbnail showing overflow */}
                                  {mIdx === 3 && mediaList.length > 4 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold">
                                      +{mediaList.length - 4}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      )}

                      <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        
                        {/* Rating and Title */}
                        <div className="space-y-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: story.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          {story.title && (
                            <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-tight">
                              "{story.title}"
                            </h3>
                          )}
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                            "{story.review}"
                          </p>
                        </div>

                        {/* User Info & Avatar */}
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          {story.avatarUrl ? (
                            <img loading="lazy" 
                              src={story.avatarUrl} 
                              alt={story.name} 
                              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                              {story.name?.charAt(0) || "?"}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{story.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{story.treatment} Success</p>
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Footer CTAs */}
        <div className="bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl text-center space-y-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-teal-400 blur-[80px]" />
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-500 blur-[100px]" />
          </div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <Heart className="w-8 h-8 text-rose-500 mx-auto animate-pulse fill-rose-500" />
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Begin Your Success Story?</h2>
            <p className="text-sm text-blue-100/70 leading-relaxed">
              We understand that the fertility journey is deeply personal. Our experienced specialists and state-of-the-art laboratory are here to guide and support you every step of the way.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/appointments/book">
                <Button size="lg" className="rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold px-8 gap-2">
                  <Calendar className="w-4 h-4" /> Book Free Consultation
                </Button>
              </Link>
              <Link href="/stories/share">
                <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 font-bold px-8">
                  Share Your Story
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Advanced Carousel Lightbox Modal */}
      <AnimatePresence>
        {lightbox.isOpen && lightbox.mediaList.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
            
            {/* Overlay Close Area */}
            <div className="absolute inset-0" onClick={() => setLightbox(prev => ({ ...prev, isOpen: false }))} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col items-center justify-center z-10"
            >
              
              {/* Top Details & Close */}
              <div className="absolute top-0 inset-x-0 bg-slate-900/80 backdrop-blur border-b border-white/5 p-4 flex justify-between items-center text-white z-20">
                <div className="text-xs font-bold uppercase tracking-wider">{lightbox.storyTitle}</div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-semibold uppercase">
                    {lightbox.mediaList[lightbox.index].type} ({lightbox.index + 1} of {lightbox.mediaList.length})
                  </span>
                  <button 
                    onClick={() => setLightbox(prev => ({ ...prev, isOpen: false }))} 
                    className="p-1 rounded-full bg-white/5 hover:bg-white/20 text-white/80 hover:text-white transition-all hover:scale-105"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Media Player Slide */}
              <div className="relative w-full aspect-video flex items-center justify-center p-8 bg-slate-950 mt-12 mb-16">
                
                {/* Left Navigation */}
                {lightbox.mediaList.length > 1 && (
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-25 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Media Item */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lightbox.index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {lightbox.mediaList[lightbox.index].type === "image" ? (
                      <img loading="lazy" 
                        src={lightbox.mediaList[lightbox.index].url} 
                        alt="Success gallery zoom"
                        className="max-h-[60vh] max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <video preload="none" playsInline 
                        src={lightbox.mediaList[lightbox.index].url} 
                        controls 
                        autoPlay 
                        className="max-h-[60vh] w-auto aspect-video object-contain bg-black rounded-lg"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Right Navigation */}
                {lightbox.mediaList.length > 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-25 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

              </div>

              {/* Bottom Thumbnails Navigation inside modal */}
              {lightbox.mediaList.length > 1 && (
                <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur border-t border-white/5 p-3 flex gap-2 justify-center z-20">
                  {lightbox.mediaList.map((m, idx) => (
                    <button
                      key={m.url}
                      onClick={() => setLightbox(prev => ({ ...prev, index: idx }))}
                      className={`relative w-12 h-8 rounded overflow-hidden border-2 transition-all ${
                        lightbox.index === idx ? "border-blue-500 scale-105" : "border-transparent opacity-60"
                      }`}
                    >
                      {m.type === "image" ? (
                        <img loading="lazy" src={m.url} className="w-full h-full object-cover" alt="thumb" />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[8px] font-bold uppercase">
                          Video
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
