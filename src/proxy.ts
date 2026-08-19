import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
    let session: any = null;
    
    try {
        const { data } = await betterFetch<any>(
            "/api/auth/get-session",
            {
                baseURL: request.nextUrl.origin,
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
            }
        );
        session = data;
    } catch (e) {
        session = null;
    }

    const path = request.nextUrl.pathname;

    const isAdminPath = path.startsWith("/admin");
    const isAdminLogin = path === "/admin";
    const isEmployeePath = path.startsWith("/employee");
    const isEmployeeLogin = path === "/employee";
    const isUserAuthPath = path === "/login" || path === "/register";
    const isUserDashboard = path === "/dashboard" || path.startsWith("/dashboard/");

    // 1. Redirect authenticated users away from auth pages (login/register) to their dashboards
    if (session && isUserAuthPath) {
        const role = (session.user as any).role;
        if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
        if (["STAFF", "DOCTOR", "RECEPTIONIST"].includes(role)) {
            return NextResponse.redirect(new URL("/employee/dashboard", request.url));
        }
        if (role === "DONOR") {
            return NextResponse.redirect(new URL("/donor", request.url));
        }
        if (role === "RECIPIENT") {
            return NextResponse.redirect(new URL("/recipient", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 2. Redirect unauthenticated users away from private user dashboards
    if (!session && isUserDashboard) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 3. Unauthenticated Access Protection for Admin Panel
    if (!session) {
        if (isAdminPath && !isAdminLogin) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
        if (isEmployeePath && !isEmployeeLogin) {
            return NextResponse.redirect(new URL("/employee", request.url));
        }
        return NextResponse.next();
    }

    // 4. Authenticated Admin Authorization & Global Delete Restrictions
    const role = (session.user as any).role;

    // Global Permissions: Prevent non-admins from executing DELETE requests anywhere
    if (request.method === "DELETE") {
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { success: false, error: "Forbidden: Only Administrators can delete records." }, 
                { status: 403 }
            );
        }
    }

    if (isAdminPath) {
        if (["STAFF", "DOCTOR", "RECEPTIONIST"].includes(role)) {
            return NextResponse.redirect(new URL("/employee/dashboard", request.url));
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.redirect(new URL("/", request.url));
        }
        if (isAdminLogin) {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
    }

    if (isEmployeePath) {
        if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
        if (!["STAFF", "DOCTOR", "RECEPTIONIST"].includes(role)) {
            return NextResponse.redirect(new URL("/", request.url));
        }
        if (isEmployeeLogin) {
            return NextResponse.redirect(new URL("/employee/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|images|.*\\.).*)"],
};
