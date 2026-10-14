import { auth } from "@/server/auth";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getNotificationsForUser } from "@/features/notifications/services/notification.service";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  const pathname = reqHeaders.get("x-pathname") || "";

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarCookie === "false" ? false : true;

  // Print templates render clean without sidebar
  if (/^\/(admin\/)?(manage-registrations\/[^/]+|ledger|laser)\/print\/?$/.test(pathname)) {
    return <>{children}</>;
  }

  // Allow bypass for login or direct admin root redirection if applicable
  if (pathname === "/login" || pathname === "/admin/login") {
    return <>{children}</>;
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
  const userRole = (session?.user as any)?.role;
  const isAllowedRole = session && allowedRoles.includes(userRole);

  // Server-side authentication guard: redirect immediately if unauthorized
  if (!session || !isAllowedRole) {
    redirect("/login");
  }

  let initialNotifications: any[] = [];
  let initialUnreadCount = 0;

  if (session && isAllowedRole) {
    try {
      const data = await getNotificationsForUser(session.user.id, userRole);
      initialNotifications = data.notifications;
      initialUnreadCount = data.unreadCount;
    } catch (err) {
      console.error(
        "Failed to prefetch notifications in layout server-component:",
        err,
      );
    }
  }

  // Safe serialization across RSC boundary (eliminates Date objects & prototypes)
  const safeSession = session
    ? {
        user: {
          id: session.user?.id || "",
          name: session.user?.name || "Mediyaz Administrator",
          email: session.user?.email || "admin@mediyaz.org",
          role: (session.user as any)?.role || "ADMIN",
          image: session.user?.image || null,
          permissions: (session.user as any)?.permissions || [],
        },
        session: {
          id: session.session?.id || "",
          userId: session.session?.userId || "",
        },
      }
    : null;

  const safeNotifications = JSON.parse(JSON.stringify(initialNotifications || []));

  return (
    <AdminLayoutClient
      session={safeSession}
      initialNotifications={safeNotifications}
      initialUnreadCount={initialUnreadCount}
      defaultOpen={defaultOpen}
    >
      {children}
    </AdminLayoutClient>
  );
}
