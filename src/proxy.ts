import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";

// Short-lived in-memory session cache (5 seconds) to eliminate duplicate internal HTTP roundtrips
const sessionCache = new Map<string, { session: any; expiresAt: number }>();

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Pass pathname to Server Components/layouts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", path);

  // Print pages should bypass auth/layout processing for embedded iframe printing
  const isPrintPage =
    path.endsWith("/print") ||
    path.includes("/print/") ||
    /^\/(admin\/)?(manage-registrations|manage-sperm-registrations|completed-files|ledger|laser|invoices)\/.*print\/?$/.test(
      path
    );

  if (isPrintPage) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  let session: any = null;
  const cookieHeader = request.headers.get("cookie") || "";

  // Performance optimization: only fetch session if auth cookies are present
  const hasSessionCookie =
    cookieHeader.includes("session_token") ||
    cookieHeader.includes("mediyaz-admin") ||
    cookieHeader.includes("better-auth");

  if (hasSessionCookie) {
    const cached = sessionCache.get(cookieHeader);
    if (cached && Date.now() < cached.expiresAt) {
      session = cached.session;
    } else {
      try {
        const { data } = await betterFetch<any>("/api/auth/get-session", {
          baseURL: request.nextUrl.origin,
          headers: {
            cookie: cookieHeader,
          },
        });
        session = data;
        if (session) {
          sessionCache.set(cookieHeader, { session, expiresAt: Date.now() + 5000 });
          if (sessionCache.size > 200) sessionCache.clear();
        }
      } catch {
        session = null;
      }
    }
  }

  const isAuthPage =
    path === "/login" ||
    path === "/signup" ||
    path === "/admin" ||
    path === "/secure/login" ||
    path === "/secure/setup" ||
    path.startsWith("/accept-invite") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password");
  const isPublicApi = path.startsWith("/api/auth");

  if (isPublicApi) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 1. Unauthenticated Access Protection
  if (!session) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }
    if (!isAuthPage) {
      if (path.startsWith("/secure")) {
        return NextResponse.redirect(new URL("/secure/login", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Extract Session User & Role
  const user = session?.user as any;
  const role = user?.role;
  const isSuperAdminRole = role === "SUPER_ADMIN";
  const isAllowedStaff = [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
    "EMPLOYEE",
    "DOCTOR",
    "STAFF",
    "RECEPTIONIST",
  ].includes(role);

  // 3. Strict Super Admin Portal Isolation
  // Non-Super Admins cannot access /secure routes
  if (path.startsWith("/secure") && !isSuperAdminRole) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: High-security console restricted to Super Administrator." },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/login?error=super_admin_only", request.url));
  }

  // 4. Global Deletion Restriction (Strictly Super Admin Only)
  // Admins, Managers, and Employees CANNOT execute HTTP DELETE requests anywhere
  if (request.method === "DELETE") {
    if (!isSuperAdminRole) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: Direct deletion is restricted exclusively to the Super Administrator. Administrators may submit a Deletion Request for review.",
        },
        { status: 403 }
      );
    }
  }

  // 5. Non-Staff Access Restriction (Donors or Recipients cannot enter the staff portal)
  if (!isAllowedStaff) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Staff credentials required to access this system.",
        },
        { status: 403 }
      );
    }
    if (isAuthPage) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  // 6. Authenticated Staff on auth pages or root redirected to dashboard
  if (isAuthPage || path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icon.png|images|sound|fonts|.*\\.).*)",
  ],
};

export default proxy;
export { proxy as middleware };

