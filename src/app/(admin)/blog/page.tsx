"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Edit, Trash2, X, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-markdown-preview/markdown.css";
import { CustomPagination } from "@/components/ui/custom-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

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
  const [category, setCategory] = useState("Clinical Research");
  const [content, setContent] = useState<string | undefined>("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  async function loadArticles() {
    setLoading(true);
    try {
      let res = await fetch(`/api/blog?page=${currentPage}&limit=10`);
      let data = await res.json();
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
    setCategory("Clinical Research");
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
    setTags(tags.filter(t => t !== tagToRemove));
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
        const imageMarkdown = `\n![${file.name}](${data.media.url})\n`;
        setContent((prev) => (prev || "") + imageMarkdown);
        toast.success("Image uploaded and inserted into editor!");
      } else {
        toast.error("Failed to upload image.");
      }
    } catch (err) {
      toast.error("Error uploading image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
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
          content,
          image,
          status,
          tags
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEditing ? "Article updated successfully!" : "New article saved to MongoDB!");
        setShowModal(false);
        loadArticles();
      } else {
        toast.error(data.error || "Failed to save article.");
      }
    } catch (err) {
      toast.error("Network error while saving article.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Article deleted successfully.");
        setArticles(prev => prev.filter(a => a._id !== id));
      } else {
        toast.error(data.error || "Failed to delete article.");
      }
    } catch (error) {
      toast.error("Network error while deleting article.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CMS Content Manager</h1>
          <p className="text-xs text-slate-500">Live MongoDB Blog Collection, Articles, & SEO Metadata.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadArticles} variant="outline" className="rounded-xl text-xs gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh CMS
          </Button>
          <Button onClick={openCreateModal} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1">
            <Plus className="w-4 h-4" /> Create New Article
          </Button>
        </div>
      </div>

      {showModal && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 space-y-4 shadow-lg">
          <h3 className="text-lg font-bold">{isEditing ? "Edit Clinical Article" : "Publish New Clinical Article"}</h3>
          <form onSubmit={handleSaveArticle} className="space-y-3">
            <div>
              <label className="text-xs font-semibold">Article Title</label>
              <Input
                placeholder="e.g. Breakthroughs in Vitrification 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Category</label>
              <Input
                placeholder="Clinical Research / Patient Care / Ethics"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                  className="w-full h-10 px-3 mt-1 rounded-md border text-sm bg-transparent"
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold">Cover Image URL</label>
                <Input
                  className="mt-1"
                  placeholder="https://..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold">Tags (Press Enter)</label>
              <Input
                className="mt-1"
                placeholder="e.g. fertility, research"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-xs px-2 py-1 rounded-md">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-slate-500 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold">Article Content (Markdown)</label>
                <div>
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    disabled={uploadingImage}
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    {uploadingImage ? "Uploading..." : "Insert Image"}
                  </Button>
                </div>
              </div>
              <div data-color-mode="light" className="dark:hidden">
                <MDEditor
                  value={content}
                  onChange={setContent}
                  height={400}
                  previewOptions={{ rehypePlugins: [] }}
                />
              </div>
              <div data-color-mode="dark" className="hidden dark:block">
                <MDEditor
                  value={content}
                  onChange={setContent}
                  height={400}
                  previewOptions={{ rehypePlugins: [] }}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-blue-600 text-white text-xs">
                {saving ? "Saving..." : "Save to MongoDB"}
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
          <div className="p-4 border-t dark:border-slate-800">
            <CustomPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
