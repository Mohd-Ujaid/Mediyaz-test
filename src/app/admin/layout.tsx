import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { getNotificationsForUser } from "@/features/notifications/services/notification.service";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"];
  const userRole = (session?.user as any)?.role;
  const isAllowedRole = session && allowedRoles.includes(userRole);

  let initialNotifications: any[] = [];
  let initialUnreadCount = 0;

  if (session && isAllowedRole) {
    try {
      const data = await getNotificationsForUser(session.user.id, userRole);
      initialNotifications = data.notifications;
      initialUnreadCount = data.unreadCount;
    } catch (err) {
      console.error("Failed to prefetch notifications in layout server-component:", err);
    }
  }

  return (
    <AdminLayoutClient
      session={session}
      initialNotifications={initialNotifications}
      initialUnreadCount={initialUnreadCount}
    >
      {children}
    </AdminLayoutClient>
  );
}
