import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Pass pathname to Server Components/layouts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", path);

  // Print pages should bypass auth/layout processing for embedded iframe printing
  const isPrintPage = /^\/(admin\/)?manage-registrations\/[^/]+\/print\/?$/.test(
    path,
  );

  if (isPrintPage) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  let session: any = null;

  try {
    const { data } = await betterFetch<any>("/api/auth/get-session", {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    session = data;
  } catch (e) {
    session = null;
  }

  const isAuthPage = path === "/login" || path === "/admin";
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
  const role = (session.user as any)?.role;
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(role);

  // Global Permissions: Prevent non-admins from executing DELETE requests anywhere
  if (request.method === "DELETE") {
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only Administrators can delete records.",
        },
        { status: 403 },
      );
    }
  }

  // 3. Non-admin access restriction:
  // If an employee or customer logs into the Admin panel, they cannot access admin management
  if (!isAdmin) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  // 4. Authenticated Admin on login page redirected to dashboard
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icon.png|images|.*\\.).*)",
  ],
};
