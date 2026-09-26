"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getPusherClient } from "@/lib/pusher";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  getNotificationsAction,
} from "../actions/notification.actions";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// Helper to play the notification sound file from the public/sound directory
function playNotificationSound() {
  try {
    const audio = new Audio("/sound/notification_sound.mp3");
    audio.play();
  } catch (err) {
    console.error("Failed to play notification sound file:", err);
  }
}

interface NotificationBellProps {
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
}

export function NotificationBell({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith("/employee") ? "/employee" : "/admin";

  // Sync state if initial props change (e.g., on server-side navigation refresh)
  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  useEffect(() => {
    const pusher = getPusherClient();
    let channel: any;
    let pollInterval: any;

    if (pusher) {
      channel = pusher.subscribe("notifications");
      
      channel.bind("new_notification", (newNotif: Notification) => {
        setNotifications((prev) => {
          // Only add and play sound if not already present
          if (!prev.some((n) => n._id === newNotif._id)) {
            playNotificationSound();
            toast.info(newNotif.title, {
              description: newNotif.message,
            });
            return [newNotif, ...prev].slice(0, 50);
          }
          return prev;
        });
        setUnreadCount((prev) => prev + 1);
      });
    } else {
      // Fallback: poll every 10 seconds if Pusher is not available (e.g. no credentials in local dev)
      console.warn("Pusher keys are not configured or client is offline. Falling back to active Server Action polling.");
      
      const pollNotifications = async () => {
        try {
          const res = await getNotificationsAction();
          if (res.success && res.notifications) {
            setNotifications((prev) => {
              // Compare if there are any new unread notifications that were not present in local state
              const newItems = res.notifications.filter(
                (n: Notification) => !prev.some((old) => old._id === n._id)
              );
              
              if (newItems.length > 0) {
                // If there are new unread notifications, play sound and show toast
                const hasNewUnread = newItems.some((n: Notification) => !n.isRead);
                if (hasNewUnread) {
                  playNotificationSound();
                  const latestNew = newItems.find((n: Notification) => !n.isRead) || newItems[0];
                  toast.info(latestNew.title, {
                    description: latestNew.message,
                  });
                }
              }
              return res.notifications;
            });
            if (res.unreadCount !== undefined) {
              setUnreadCount(res.unreadCount);
            }
          }
        } catch (error) {
          console.error("Polling notifications failed:", error);
        }
      };

      // Poll immediately on mount
      pollNotifications();
      
      pollInterval = setInterval(pollNotifications, 120000); // Poll every 2 minutes
    }

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      // Optimistic update
      const originalNotifications = [...notifications];
      const originalUnreadCount = unreadCount;
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      const res = await markAllNotificationsAsReadAction();
      if (!res.success) {
        toast.error("Failed to mark all notifications as read: " + res.error);
        setUnreadCount(originalUnreadCount);
        setNotifications(originalNotifications);
      }
    } catch (error) {
      console.error("markAllAsRead failed:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      const originalNotifications = [...notifications];
      const originalUnreadCount = unreadCount;
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

      const res = await markNotificationAsReadAction(id);
      if (!res.success) {
        toast.error("Failed to mark notification as read: " + res.error);
        setUnreadCount(originalUnreadCount);
        setNotifications(originalNotifications);
      }
    } catch (error) {
      console.error("markAsRead failed:", error);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }

    let route = "";
    if (notif.type === "REGISTRATION") {
      route = notif.referenceId ? `${basePath}/manage-registrations?registrationId=${notif.referenceId}` : `${basePath}/manage-registrations`;
    } else if (notif.type === "INQUIRY") {
      route = notif.referenceId ? `${basePath}/inquiries?inquiryId=${notif.referenceId}` : `${basePath}/inquiries`; 
    } else if (notif.type === "BOOKING") {
      route = notif.referenceId ? `${basePath}/appointments?appointmentId=${notif.referenceId}` : `${basePath}/appointments`;
    }

    if (route) {
      router.push(route);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative group">
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 px-1.5 min-w-[20px] h-5 flex items-center justify-center text-[10px] animate-in zoom-in"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="text-sm font-bold">Notifications</div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-brand-600 hover:text-brand-700 bg-transparent hover:bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
              No notifications yet
            </div>
          ) : (
            <DropdownMenuGroup className="p-0">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif._id}
                  className={`p-4 border-b last:border-0 cursor-pointer items-start gap-3 focus:bg-muted/50 ${!notif.isRead ? "bg-brand-500/5" : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm font-medium ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 rounded-full hover:bg-brand-500/20 hover:text-brand-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif._id);
                      }}
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
