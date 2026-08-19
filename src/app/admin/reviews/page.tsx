"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Trash2, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  Star, 
  RefreshCw, 
  Mail, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Pagination for Reviews
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);

  // Pagination for Messages
  const [currentMessagePage, setCurrentMessagePage] = useState(1);
  const [totalMessagePages, setTotalMessagePages] = useState(1);

  // Load reviews
  async function loadReviews() {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?page=${currentReviewPage}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        if (data.pagination) setTotalReviewPages(data.pagination.pages);
      }
    } catch (err) {
      toast.error("Failed to load reviews list.");
    } finally {
      setLoadingReviews(false);
    }
  }

  // Load contact messages
  async function loadMessages() {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/contact?page=${currentMessagePage}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        if (data.pagination) setTotalMessagePages(data.pagination.pages);
      }
    } catch (err) {
      toast.error("Failed to load contact logs.");
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [currentReviewPage]);

  useEffect(() => {
    loadMessages();
  }, [currentMessagePage]);

  const handleToggleReviewApprove = async (rev: any) => {
    const nextApproved = !rev.approved;
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rev._id, approved: nextApproved })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(nextApproved ? "Review approved and visible publicly!" : "Review hidden from homepage.");
        loadReviews();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Error updating review status.");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review deleted successfully.");
        loadReviews();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Error deleting review.");
    }
  };

  const handleUpdateMessageStatus = async (msgId: string, nextStatus: string) => {
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msgId, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Inquiry status updated to ${nextStatus}.`);
        loadMessages();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Error updating message status.");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-teal-500" /> Feedback & Inquiries Moderator
          </h1>
          <p className="text-xs text-slate-500">
            Moderate public patient feedback, check contact mail logs, and change ticket statuses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadReviews} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Reload Reviews
          </Button>
          <Button onClick={loadMessages} variant="outline" className="rounded-xl text-xs gap-1 border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Reload Mail
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* REVIEWS MODERATION PANEL */}
        <Card className="lg:col-span-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-slate-50/40 dark:bg-slate-900/10 p-5">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Reviews Moderation</CardTitle>
            <CardDescription className="text-[10px] text-slate-400">Approve patient testimonials to be showcased on the homepage catalog.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {loadingReviews ? (
              <div className="text-center py-10 text-xs text-slate-500">Loading reviews pipeline...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">No reviews submitted yet.</div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div 
                    key={rev._id} 
                    className={`p-4 rounded-xl border text-xs space-y-2 relative transition-all ${
                      rev.approved ? "border-slate-250 bg-slate-50/30" : "border-amber-250 bg-amber-50/10"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{rev.name}</div>
                        <div className="flex items-center gap-1 text-amber-500 mt-1">
                          {Array.from({ length: rev.rating }).map((_, rIdx) => (
                            <Star key={rIdx} className="w-3 h-3 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                        rev.approved ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-250"
                      }`}>
                        {rev.approved ? "Approved" : "Awaiting Review"}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{rev.review}"
                    </p>

                    <div className="flex justify-end gap-1.5 pt-2 border-t dark:border-slate-900">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleToggleReviewApprove(rev)}
                        className={`h-7 text-[10px] rounded-lg gap-1 border-slate-200 ${rev.approved ? "text-slate-600" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
                      >
                        {rev.approved ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {rev.approved ? "Hide" : "Approve"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteReview(rev._id)}
                        className="h-7 text-[10px] rounded-lg border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loadingReviews && reviews.length > 0 && (
              <div className="pt-4 mt-4 border-t dark:border-slate-800">
                <CustomPagination 
                  currentPage={currentReviewPage}
                  totalPages={totalReviewPages}
                  onPageChange={(p) => setCurrentReviewPage(p)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* CONTACT MESSAGES MAILBOX */}
        <Card className="lg:col-span-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
          <CardHeader className="border-b bg-slate-50/40 dark:bg-slate-900/10 p-5">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Mail className="w-4 h-4 text-teal-600" /> Patient Support Desk Inquiries</CardTitle>
            <CardDescription className="text-[10px] text-slate-400">Review submitted contact mail queries and manage response statuses.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {loadingMessages ? (
              <div className="text-center py-10 text-xs text-slate-500">Loading support logs...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">No messages in clinical support inbox.</div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div 
                    key={msg._id} 
                    className={`p-4 rounded-xl border text-xs space-y-2 relative transition-all ${
                      msg.status === "COMPLETED" ? "border-slate-250 bg-slate-50/30 opacity-60" : "border-slate-200 bg-white dark:bg-slate-900 shadow-xs"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="font-bold text-slate-950 dark:text-white">{msg.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{msg.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                        msg.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                        msg.status === "REPLIED" ? "bg-blue-100 text-blue-700 border-blue-200" :
                        "bg-amber-100 text-amber-700 border-amber-200"
                      }`}>
                        {msg.status}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/80 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-900 mt-1 font-mono text-[11px]">
                      {msg.message}
                    </p>

                    <div className="flex justify-end gap-1.5 pt-2 border-t dark:border-slate-900">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUpdateMessageStatus(msg._id, "REPLIED")}
                        className="h-7 text-[10px] rounded-lg border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 gap-1"
                        disabled={msg.status === "COMPLETED"}
                      >
                        <Clock className="w-3 h-3 text-slate-400" /> Mark Replied
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUpdateMessageStatus(msg._id, "COMPLETED")}
                        className="h-7 text-[10px] rounded-lg border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 gap-1"
                        disabled={msg.status === "COMPLETED"}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Mark Completed
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loadingMessages && messages.length > 0 && (
              <div className="pt-4 mt-4 border-t dark:border-slate-800">
                <CustomPagination 
                  currentPage={currentMessagePage}
                  totalPages={totalMessagePages}
                  onPageChange={(p) => setCurrentMessagePage(p)}
                />
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
