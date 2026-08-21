"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Mail, 
  User, 
  Check, 
  Loader2, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { CustomPagination } from "@/components/ui/custom-pagination";

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [replyEmailText, setReplyEmailText] = useState("");
  const [newStatus, setNewStatus] = useState<"PENDING" | "REPLIED" | "COMPLETED">("PENDING");

  async function loadMessages() {
    setLoading(true);
    try {
      let query = `/api/contact?page=${currentPage}&limit=10`;
      const res = await fetch(query);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if (data.pagination) setTotalPages(data.pagination.pages);
      } else {
        toast.error(data.error || "Failed to fetch contact messages.");
      }
    } catch (err) {
      toast.error("Failed to load contact messages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [currentPage]);

  const getParsedChatFeed = (msg: any) => {
    if (!msg) return [];
    const feed: any[] = [];
    
    // Add user initial message
    feed.push({
      sender: "User",
      senderName: msg.name,
      message: msg.message,
      createdAt: msg.createdAt
    });

    // Add replies from array
    if (msg.replies && msg.replies.length > 0) {
      feed.push(...msg.replies);
    } else if (msg.adminNotes) {
      // Parse legacy emailed replies from adminNotes
      const lines = msg.adminNotes.split("\n");
      for (const line of lines) {
        if (line.includes("[Emailed Reply]:")) {
          const splitMsg = line.split("[Emailed Reply]:")[1]?.trim();
          if (splitMsg) {
            feed.push({
              sender: "Admin",
              senderName: "Admin Support",
              message: splitMsg,
              createdAt: msg.updatedAt
            });
          }
        }
      }
    }
    return feed;
  };

  const handleSendEmailReply = async () => {
    if (!selectedMessage || !replyEmailText.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMessage._id,
          replyEmailText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Reply email sent successfully.`);
        setReplyEmailText("");
        setSelectedMessage(data.contact);
        loadMessages();
      } else {
        toast.error(data.error || "Failed to send email reply.");
      }
    } catch (err) {
      toast.error("Network error during reply dispatch.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedMessage) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMessage._id,
          adminNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Internal notes saved privately.`);
        setSelectedMessage(data.contact);
        loadMessages();
      } else {
        toast.error(data.error || "Failed to save notes.");
      }
    } catch (err) {
      toast.error("Network error saving notes.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatusOnly = async (status: "PENDING" | "REPLIED" | "COMPLETED") => {
    if (!selectedMessage) return;
    setNewStatus(status);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMessage._id,
          status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to ${status}.`);
        setSelectedMessage(data.contact);
        loadMessages();
      } else {
        toast.error(data.error || "Failed to update status.");
      }
    } catch (err) {
      toast.error("Network error updating status.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
      case "REPLIED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300";
    }
  };

  // Client side search and filter
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(search.toLowerCase()) ||
      msg.email.toLowerCase().includes(search.toLowerCase()) ||
      msg.message.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter ? msg.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Contact Form Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View and manage all customer inquiries and support messages submitted via the website contact form.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="REPLIED">Replied</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <Card className="rounded-[10px] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Sender Details</th>
                <th className="py-4 px-6">Message Preview</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Submitted At</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-650" />
                    Loading messages...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    No contact messages found.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {msg.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-450" />
                        {msg.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-md">
                      <p className="line-clamp-2 text-slate-650 dark:text-slate-350 leading-relaxed">
                        {msg.message}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(msg.status)}`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-550 dark:text-slate-450">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedMessage(msg);
                          setNewStatus(msg.status);
                          setAdminNotes(msg.adminNotes || "");
                          setReplyEmailText("");
                          setIsDetailOpen(true);
                        }}
                        className="rounded-xl h-8 px-3 text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                      >
                        View & Reply
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Message details & status update modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-650" />
              Contact Message Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review message details and update communication state.
            </DialogDescription>
          </DialogHeader>

           {selectedMessage && (
            <div className="space-y-4 pt-3">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-550">
                  <div>
                    <span>Sender</span>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200 normal-case mt-0.5">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <span>Email Address</span>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200 normal-case mt-0.5">{selectedMessage.email}</p>
                  </div>
                </div>
              </div>

              {/* Chat Conversation History Thread */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">Conversation Feed</label>
                <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl p-4 max-h-[280px] overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
                  
                  {getParsedChatFeed(selectedMessage).map((rep: any, idx: number) => {
                    const isAdmin = rep.sender === "Admin";
                    const displayName = isAdmin ? (rep.senderName || "Admin Support") : selectedMessage.name;
                    return (
                      <div 
                        key={idx} 
                        className={`flex gap-2.5 items-start max-w-[85%] ${isAdmin ? "ml-auto flex-row-reverse" : ""}`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isAdmin 
                            ? "bg-teal-650 text-white" 
                            : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350"
                        }`}>
                          {isAdmin ? "AD" : selectedMessage.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={`space-y-1 ${isAdmin ? "text-right" : ""}`}>
                          <div className={`p-3 rounded-2xl shadow-sm text-xs leading-relaxed text-left whitespace-pre-wrap ${
                            isAdmin
                              ? "bg-teal-600 text-white rounded-tr-none"
                              : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                          }`}>
                            {rep.message}
                          </div>
                          <div className="text-[9px] text-slate-400 px-1">
                            {displayName} • {new Date(rep.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>

              <div className="space-y-4 border-t dark:border-slate-800 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Communication State</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["PENDING", "REPLIED", "COMPLETED"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleUpdateStatusOnly(s)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedMessage.status === s
                            ? "bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {selectedMessage.status === s && <Check className="w-3.5 h-3.5" />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Reply Message (Sent to Customer's Email)</label>
                  <div className="space-y-2">
                    <textarea
                      placeholder="Type the message that will be emailed to the sender..."
                      value={replyEmailText}
                      onChange={(e) => setReplyEmailText(e.target.value)}
                      className="w-full min-h-[90px] p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 dark:text-white"
                    />
                    <div className="flex justify-between items-center text-[10px]">
                      <p className="text-slate-400">
                        Will be sent to: <span className="font-semibold text-slate-600 dark:text-slate-350">{selectedMessage.email}</span>
                      </p>
                      <Button
                        type="button"
                        onClick={handleSendEmailReply}
                        disabled={actionLoading || !replyEmailText.trim()}
                        className="rounded-xl text-xs h-8.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Email Reply"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t dark:border-slate-800 pt-4">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Internal Admin Notes (Private)</label>
                  <div className="space-y-2">
                    <textarea
                      placeholder="Add internal notes about responses, actions taken or follow-up details..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full min-h-[60px] p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 dark:text-white"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleSaveAdminNotes}
                        disabled={actionLoading}
                        className="rounded-xl text-xs h-8.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 border dark:border-slate-800 cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Private Notes"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
