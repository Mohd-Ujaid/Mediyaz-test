import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";
import { auth } from "@/server/auth";
import { ROLE_PERMISSIONS } from "@/lib/rbac/permissions";
import { getRoleDisplayName } from "@/lib/rbac/roles";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, role, department } = body;

    // 1. Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long for administrative security." },
        { status: 400 }
      );
    }

    // 2. Strict Super Admin Protection:
    // NO ONE can self-register as Super Admin. There is strictly ONE Super Admin.
    const requestedRole = (role || "ADMIN").toUpperCase().trim();
    if (requestedRole === "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: The Super Administrator account cannot be self-registered. The system is governed by strictly one Super Admin.",
        },
        { status: 403 }
      );
    }

    // Allowable staff roles for registration
    const targetRole: UserRole =
      requestedRole === "MANAGER"
        ? UserRole.MANAGER
        : requestedRole === "EMPLOYEE"
        ? UserRole.EMPLOYEE
        : UserRole.ADMIN;

    await connectToDatabase();

    // 3. Duplicate checks
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists. Please log in." },
        { status: 400 }
      );
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: "This phone number is already registered to another account." },
          { status: 400 }
        );
      }
    }

    // 4. Register credential through Better-Auth
    const reqHeaders = await headers();
    let authUser: any = null;

    try {
      const authResult = await auth.api.signUpEmail({
        headers: reqHeaders,
        body: {
          email: normalizedEmail,
          password,
          name: name.trim(),
        },
      });
      authUser = authResult?.user;
    } catch (authErr: any) {
      console.error("Better-Auth registration error:", authErr);
      return NextResponse.json(
        { success: false, error: authErr?.message || "Failed to create security authentication credentials." },
        { status: 500 }
      );
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Authentication registration failed." },
        { status: 500 }
      );
    }

    // 5. Update user with role, permissions, and department in MongoDB
    const assignedPermissions = ROLE_PERMISSIONS[targetRole] || ["VIEW_DASHBOARD"];
    const updatedUser = await User.findByIdAndUpdate(
      authUser.id,
      {
        role: targetRole,
        department: department || (targetRole === UserRole.ADMIN ? "Administration" : "Clinical Operations"),
        permissions: assignedPermissions,
        phone: phone ? phone.trim() : "",
        status: "ACTIVE",
        emailVerified: true,
        twoFactorEnabled: false,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: `${getRoleDisplayName(targetRole)} account created successfully!`,
      user: {
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
      },
    });
  } catch (error: any) {
    console.error("Admin signup error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
