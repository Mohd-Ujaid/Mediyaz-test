import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";
import { Employee } from "@/models/Employee";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { ROLE_PERMISSIONS } from "@/lib/rbac/permissions";

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    // Search and filters
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const department = searchParams.get("department") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};

    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    } else if (userRole !== "SUPER_ADMIN") {
      // Non-super-admins cannot view or access the Super Admin record
      query.role = { $ne: "SUPER_ADMIN" };
    }
    if (status) query.status = status;
    if (department) query.department = department;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    const { name, email, password, phone, role, department, permissions } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required." }, { status: 400 });
    }

    // Check duplicate
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email is already registered." }, { status: 400 });
    }

    // Determine initial password (provided or generated)
    let initialPassword = password;
    if (!initialPassword || String(initialPassword).trim().length < 6) {
      const { randomBytes } = await import("crypto");
      initialPassword = `Med#${randomBytes(4).toString("hex")}!`;
    }

    // Non-SUPER_ADMIN cannot create ADMIN or SUPER_ADMIN users
    let assignedRole = role || UserRole.RECIPIENT;
    if ((assignedRole === "ADMIN" || assignedRole === "SUPER_ADMIN") && userRole !== "SUPER_ADMIN") {
      assignedRole = UserRole.STAFF;
    }

    // Register account via Better-Auth
    const authResult = await auth.api.signUpEmail({
      headers: reqHeaders,
      body: {
        email: email.toLowerCase(),
        password: initialPassword,
        name,
      },
    });

    if (!authResult || !authResult.user) {
      return NextResponse.json({ success: false, error: "Failed to create user authentication login." }, { status: 500 });
    }

    const perms =
      assignedRole === "SUPER_ADMIN"
        ? ["*"]
        : assignedRole === "ADMIN"
        ? (permissions && permissions.length > 0 ? permissions : ROLE_PERMISSIONS[UserRole.ADMIN])
        : (permissions || ["READ_PORTAL"]);

    const user = await User.findByIdAndUpdate(
      authResult.user.id,
      {
        role: assignedRole,
        phone: phone || "",
        department: department || "General",
        permissions: perms,
        status: "ACTIVE",
        emailVerified: true,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      user,
      initialPassword: password ? undefined : initialPassword,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { userId, password, ...updateFields } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    // Target user check
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    // RBAC: An Admin CANNOT modify or alter the Super Administrator
    if (targetUser.role === "SUPER_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrators cannot modify the Super Administrator." },
        { status: 403 }
      );
    }

    // RBAC: An Admin CANNOT modify another Admin's role or permissions (Admin can ONLY modify staff permissions)
    if (targetUser.role === "ADMIN" && userRole !== "SUPER_ADMIN") {
      if (updateFields.role !== undefined || updateFields.permissions !== undefined) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Forbidden: Administrators cannot modify another Administrator's role or permissions. Only the Super Administrator can manage Administrator credentials." 
          },
          { status: 403 }
        );
      }
    }

    // RBAC: Non-Super-Admins CANNOT elevate anyone to ADMIN or SUPER_ADMIN
    if (userRole !== "SUPER_ADMIN" && updateFields.role) {
      if (updateFields.role === "ADMIN" || updateFields.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden: Administrators can only manage staff roles and cannot elevate accounts to Administrator." },
          { status: 403 }
        );
      }
    }

    // Whitelist allowable fields to prevent mass assignment and unauthorized privilege escalation
    const allowedKeys = ["name", "phone", "department", "status"];
    if (userRole === "SUPER_ADMIN") {
      allowedKeys.push("role", "permissions");
    } else if (userRole === "ADMIN") {
      // Admin can only update role and permissions for non-admin staff
      if (targetUser.role !== "ADMIN" && targetUser.role !== "SUPER_ADMIN") {
        allowedKeys.push("role", "permissions");
      }
    }

    const sanitizedUpdate: any = {};
    for (const key of allowedKeys) {
      if (updateFields[key] !== undefined) {
        if (key === "permissions") {
          // Normalize permissions array
          if (Array.isArray(updateFields.permissions)) {
            sanitizedUpdate.permissions = updateFields.permissions;
          } else if (typeof updateFields.permissions === "string") {
            sanitizedUpdate.permissions = updateFields.permissions
              .split(",")
              .map((p: string) => p.trim())
              .filter(Boolean);
          }
        } else {
          sanitizedUpdate[key] = updateFields[key];
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: sanitizedUpdate },
      { new: true }
    ).select("-password");

    // Update password if provided
    if (password && String(password).trim().length >= 6 && userRole === "SUPER_ADMIN") {
      const { hashPassword } = await import("better-auth/crypto");
      const passwordHash = await hashPassword(password);
      await mongoose.connection.collection("accounts").updateOne(
        { userId: user._id, providerId: "credential" },
        { $set: { password: passwordHash, updatedAt: new Date() } }
      );
    }

    // Synchronize updates to linked Employee status
    if (sanitizedUpdate.status) {
      const statusUpdate = sanitizedUpdate.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
      await Employee.findOneAndUpdate({ user: userId }, { status: statusUpdate });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }
    const userRole = (session.user as any).role;

    // STRICT: Only the Super Administrator has permission to delete users from the system
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Only the Super Administrator has permission to delete users from the system.",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    // Protect against self-deletion of root Super Admin
    if ((session.user as any).id === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own active Super Administrator account." },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    await User.findByIdAndDelete(userId);
    await Employee.findOneAndDelete({ user: userId });

    // Clean up better-auth accounts and sessions
    await mongoose.connection.collection("accounts").deleteMany({
      $or: [{ userId: targetUser._id }, { accountId: targetUser._id.toString() }],
    });
    await mongoose.connection.collection("sessions").deleteMany({
      userId: targetUser._id,
    });

    return NextResponse.json({
      success: true,
      message: "User and authentication credentials deleted successfully!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
