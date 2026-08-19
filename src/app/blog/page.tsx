"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Calendar, User, ArrowRight, BookOpen } from "lucide-react";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  image?: string;
  tags?: string[];
  author?: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        let res = await fetch("/api/blog?status=PUBLISHED");
        let data = await res.json();
        if (data.articles) {
          setPosts(data.articles);
        }
      } catch (err) {
        console.error("Error fetching blog articles:", err);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, []);

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.tags && p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Hero */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" /> Dynamic CMS Articles from MongoDB
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Fertility Insights & Medical Research
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Articles authored by world-class embryologists, geneticists, and reproductive endocrinologists.
          </p>

          <div className="pt-4 max-w-md mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search research topics or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading live articles from MongoDB...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card key={post._id} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="relative h-52 w-full">
                      <Image
                        src={post.image || "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80"}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        {post.category}
                      </span>
                      <h3 className="text-xl font-bold leading-tight">{post.title}</h3>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {post.author?.name || "Dr. Elena Rostova"}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </div>
                  <div className="p-6 pt-0">
                    <Link href={`/blog/${post.slug}`} className="w-full">
                      <Button variant="outline" className="w-full rounded-xl gap-1 text-xs font-semibold">
                        Read Article <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
