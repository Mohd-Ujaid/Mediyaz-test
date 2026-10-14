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
    path === "/admin" ||
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
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Authenticated Admin Authorization & Global Delete Restrictions
  const role = (session?.user as any)?.role;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(role);

  // Global Permissions: Prevent non-admins from executing DELETE requests anywhere
  if (request.method === "DELETE") {
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only Administrators can delete records.",
        },
        { status: 403 }
      );
    }
  }

  // 3. Non-admin access restriction:
  // If an employee or customer without admin role logs in, prevent administrative access
  if (!isAdmin) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Administrative privileges required.",
        },
        { status: 403 }
      );
    }
    // If they are on an auth page, allow them to view it without looping back to /dashboard
    if (isAuthPage) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  // 4. Authenticated Admin on auth pages or root redirected to dashboard
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

