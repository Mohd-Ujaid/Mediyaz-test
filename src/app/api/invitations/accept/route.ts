import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { Invitation } from "@/models/Invitation";
import { User } from "@/models/User";
import { auth } from "@/server/auth";
import { ROLE_PERMISSIONS } from "@/lib/rbac/permissions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, name, password, phone } = body;

    if (!token || !name || !password) {
      return NextResponse.json(
        { success: false, error: "Token, full name, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const invitation = await Invitation.findOne({ token });

    if (!invitation || invitation.status !== "PENDING" || new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Invalid, expired, or previously used invitation." },
        { status: 400 }
      );
    }

    // Register user through Better-Auth
    const reqHeaders = await headers();
    let authUser: any = null;

    try {
      const authResult = await auth.api.signUpEmail({
        headers: reqHeaders,
        body: {
          email: invitation.email.toLowerCase().trim(),
          password,
          name: name.trim(),
        },
      });
      authUser = authResult?.user;
    } catch (authErr: any) {
      console.error("Better-Auth signup error:", authErr);
      return NextResponse.json(
        { success: false, error: authErr?.message || "Failed to create security credentials." },
        { status: 500 }
      );
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "User credential registration failed." },
        { status: 500 }
      );
    }

    // Set exact role, permissions, and metadata on User document
    const assignedPermissions =
      ROLE_PERMISSIONS[invitation.role as import("@/models/User").UserRole] || ["VIEW_DASHBOARD"];
    await User.findByIdAndUpdate(authUser.id, {
      role: invitation.role,
      designation: invitation.designation,
      department: invitation.department,
      permissions: assignedPermissions,
      phone: phone || "",
      invitedBy: invitation.invitedBy,
      status: "ACTIVE",
      emailVerified: true,
      twoFactorEnabled: false,
    });

    // Mark invitation as accepted
    invitation.status = "ACCEPTED";
    invitation.acceptedAt = new Date();
    await invitation.save();

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      email: invitation.email,
    });
  } catch (error: any) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
