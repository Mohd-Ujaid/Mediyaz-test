"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { User, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  image?: string;
  author?: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function SingleBlogPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    async function loadArticle() {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        const data = await res.json();
        if (data.success && data.article) {
          setPost(data.article);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching blog article:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    loadArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>
          <div className="text-slate-500">Loading article...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950 px-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Article Not Found</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          The research article or medical insight you are looking for does not exist or has been removed.
        </p>
        <Button onClick={() => router.push("/blog")} className="rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
        </Button>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white dark:bg-slate-950 pb-20">
      {/* Hero Header */}
      <header className="relative w-full h-[40vh] sm:h-[50vh] bg-slate-900 overflow-hidden">
        {post.image ? (
          <Image 
            src={post.image} 
            alt={post.title} 
            fill
            priority
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-slate-900 opacity-90"></div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 md:p-16 lg:px-24">
          <div className="max-w-4xl space-y-4">
            <span className="inline-block px-3 py-1 bg-blue-500/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-full">
              {post.category}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-300 text-sm font-medium pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600 relative">
                  {post.author?.avatar ? (
                    <Image src={post.author.avatar} alt="Author" fill className="object-cover" sizes="32px" />
                  ) : (
                    <User className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <span>{post.author?.name || "Dr. Elena Rostova"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-24 py-12">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/blog")} 
          className="mb-8 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to all articles
        </Button>

        <div className="max-w-3xl prose prose-slate dark:prose-invert prose-lg lg:prose-xl mx-auto prose-headings:font-bold prose-a:text-brand-600 dark:prose-a:text-brand-400 hover:prose-a:text-brand-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
