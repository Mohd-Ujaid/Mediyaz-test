"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Edit, Trash2, X, MoreHorizontal, Globe, Eye, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { confirmAction } from "@/components/ui/custom-confirm-modal";

// Dynamic Tiptap Editor (client-only to avoid hydration mismatches)
const TiptapEditor = dynamic(
  () => import("@/components/blog/TiptapEditor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
        Loading Tiptap Editor Suite...
      </div>
    ),
  }
);

interface MongoBlog {
  _id: string;
  title: string;
  category: string;
  content: string;
  image?: string;
  status: "DRAFT" | "PUBLISHED";
  tags: string[];
  author?: {
    name: string;
  };
  createdAt: string;
}

const CLINICAL_CATEGORIES = [
  "Egg Donation Guide",
  "Legal & Regulatory",
  "Clinical Procedures",
  "Embryo & Cryopreservation",
  "Donor Care & Health",
  "Clinical Quality & Screening",
];

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<MongoBlog[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form States
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Egg Donation Guide");
  const [content, setContent] = useState<string>("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadArticles() {
    setLoading(true);
    try {
      let res = await fetch(`/api/blog?page=${currentPage}&limit=10`);
      let data = await res.json();
      console.log("[loadArticles] status:", res.status, "count:", data.articles?.length, "first:", data.articles?.[0]?.title);
      if (data.articles) {
        setArticles(data.articles);
        if (data.pagination) setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error("Error loading articles:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, [currentPage]);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle("");
    setCategory("Egg Donation Guide");
    setContent("");
    setImage("");
    setStatus("PUBLISHED");
    setTags([]);
    setShowModal(true);
  };

  const openEditModal = (article: MongoBlog) => {
    setIsEditing(true);
    setEditId(article._id);
    setTitle(article.title);
    setCategory(article.category);
    setContent(article.content || "");
    setImage(article.image || "");
    setStatus(article.status || "PUBLISHED");
    setTags(article.tags || []);
    setShowModal(true);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blog");
      
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      
      if (data.success && data.media?.url) {
        setImage(data.media.url);
        toast.success("Image uploaded to ImageKit CDN!");
      } else {
        toast.error("Failed to upload image.");
      }
    } catch (err) {
      toast.error("Error uploading image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveArticle = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    const htmlFromDom = typeof document !== "undefined" ? document.getElementById("tiptap-content-editor")?.innerHTML || "" : "";
    const activeContent = (content && content.trim() !== "" && content.trim() !== "<p></p>") ? content : htmlFromDom;

    console.log("[CMS] handleSaveArticle called with:", { title, hasContent: !!activeContent, contentLen: activeContent.length });
    if (!title || !activeContent || activeContent.trim() === "" || activeContent.trim() === "<p></p>") {
      toast.error("Please provide both an article title and content.");
      return;
    }
    setSaving(true);

    try {
      const url = isEditing ? `/api/blog/${editId}` : "/api/blog";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          content: activeContent,
          image,
          status,
          tags,
        }),
      });
      const data = await res.json();
      console.log("[CMS] Save response:", data);
      if (data.success) {
        toast.success(isEditing ? "Article updated successfully!" : "New article published via Tiptap!");
        setShowModal(false);
        loadArticles();
      } else {
        toast.error(data.error || "Failed to save article.");
      }
    } catch (err: any) {
      console.error("[CMS] Save error:", err);
      toast.error("Network error while saving article.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction({
      title: "Delete Article",
      message: "Are you sure you want to delete this article?",
      confirmText: "Yes, Delete Article",
      variant: "destructive",
    });
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Article deleted successfully.");
        setArticles((prev) => prev.filter((a) => a._id !== id));
      } else {
        toast.error(data.error || "Failed to delete article.");
      }
    } catch (error) {
      toast.error("Network error while deleting article.");
    }
  };

  const generatedSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  // Strip HTML for SERP snippet
  const plainTextContent = content.replace(/<[^>]+>/g, " ").trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clinical Editorial Suite</h1>
            <span className="rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 border border-teal-200">
              Tiptap 3.x Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-featured WYSIWYG clinical article editor with ART Act 2021 compliance callouts &amp; live SERP preview.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={process.env.NEXT_PUBLIC_USER_APP_URL || "https://mediyaz-art-bank.vercel.app/blogs"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-teal-700 hover:border-teal-300 text-xs font-bold transition shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>View Public Blog</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <Button onClick={loadArticles} variant="outline" className="rounded-xl text-xs gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Articles
          </Button>
          <Button id="compose-article-btn" onClick={openCreateModal} className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Compose Article
          </Button>
        </div>
      </div>

      {showModal && (
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-teal-600" />
                {isEditing ? "Edit Clinical Article" : "Compose New Clinical Article"}
              </h3>
              <p className="text-xs text-slate-500">Live MongoDB synchronization across Mediyaz User &amp; Admin portals.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                id="top-publish-article-btn"
                type="button"
                onClick={handleSaveArticle}
                disabled={saving}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-4 py-2 font-bold shadow-sm cursor-pointer"
              >
                {saving ? "Publishing..." : isEditing ? "Update Article" : "Publish Article"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSaveArticle} className="space-y-5">
            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="article-title-input"
                  placeholder="e.g. How Do I Become an Egg Donor in India? Complete ART Act 2021 Guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveArticle();
                    }
                  }}
                  className="mt-1.5 h-11 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Clinical Taxonomy / Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium bg-white dark:bg-slate-900"
                >
                  {CLINICAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status & Cover Image */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Publishing Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                  className="w-full h-11 px-3 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium bg-white dark:bg-slate-900"
                >
                  <option value="PUBLISHED">Published (Live on Public Portal)</option>
                  <option value="DRAFT">Draft (Internal Only)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cover Image (URL or ImageKit CDN)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    {uploadingImage ? "Uploading to CDN..." : "Upload from Device"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
                <Input
                  className="mt-1.5 h-11 text-xs"
                  placeholder="https://ik.imagekit.io/mediyaz/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Medical &amp; Statutory Tags (Type &amp; Press Enter)
              </label>
              <Input
                className="mt-1.5 h-10 text-xs"
                placeholder="e.g. egg-donation, art-act-2021, screening-protocol, icmr"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tiptap WYSIWYG Editor Suite */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Article Body Content (Interactive Tiptap WYSIWYG)
              </label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                onImageUpload={() => fileInputRef.current?.click()}
                placeholder="Write the clinical guide or regulatory explanation here... Insert headings, checklists, callouts, or clinical citations."
              />
            </div>

            {/* Live Google Search Snippet Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span>Google SERP Live Snippet Preview</span>
              </div>
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 font-sans">
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <span>https://mediyaz-art-bank.vercel.app</span>
                  <span>›</span>
                  <span>blogs</span>
                  <span>›</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{generatedSlug || "article-slug"}</span>
                </div>
                <h4 className="text-base text-blue-700 dark:text-blue-400 hover:underline cursor-pointer font-medium mt-1 truncate">
                  {title || "Article Title | Mediyaz ART Bank"}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {plainTextContent.slice(0, 160) ||
                    "Expert clinical articles on Assisted Reproductive Technology (ART) regulations, gamete cryopreservation protocols, donor health safeguards, and genetic screening in India."}
                  ...
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="rounded-xl text-xs px-4"
              >
                Cancel
              </Button>
              <Button
                id="publish-article-submit-btn"
                type="submit"
                onClick={handleSaveArticle}
                disabled={saving}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-6 font-bold shadow-sm cursor-pointer"
              >
                {saving ? "Saving to MongoDB..." : isEditing ? "Update Article" : "Publish Article"}
              </Button>
            </div>
          </form>
        </Card>
      )}


      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading live articles from MongoDB...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Article Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Published Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {articles.map((art) => (
                  <tr key={art._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{art.title}</td>
                    <td className="p-3 text-slate-600">{art.category}</td>
                    <td className="p-3 text-slate-600">{art.author?.name || "Dr. Elena Rostova"}</td>
                    <td className="p-3 text-slate-400">{new Date(art.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Actions"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => openEditModal(art)}
                              className="cursor-pointer gap-2 text-xs font-semibold py-2"
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                              Edit Article
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const slug = art.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                                window.open(`https://mediyaz-art-bank.vercel.app/blogs/${slug}`, "_blank");
                              }}
                              className="cursor-pointer gap-2 text-xs font-semibold py-2"
                            >
                              <Eye className="w-4 h-4 text-teal-600" />
                              View on Public Site
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(art._id)}
                              className="cursor-pointer gap-2 text-xs font-semibold py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                              Delete Article
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && articles.length > 0 && (
          <CustomPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
            itemName="articles"
          />
        )}
      </Card>
    </div>
  );
}
