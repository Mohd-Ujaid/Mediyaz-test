import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";
import { auth } from "@/server/auth";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    const db = conn.connection.db;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
    }

    const superAdminCount = await db.collection("users").countDocuments({ role: UserRole.SUPER_ADMIN });

    return NextResponse.json({
      success: true,
      hasSuperAdmin: superAdminCount > 0,
      count: superAdminCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Super Admin password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const conn = await connectToDatabase();
    const db = conn.connection.db;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
    }

    // 1. Strict Check: Is there already a Super Admin?
    const existingCount = await db.collection("users").countDocuments({ role: UserRole.SUPER_ADMIN });
    if (existingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: A Super Administrator has already been initialized for this database. Only one Super Admin is permitted.",
        },
        { status: 403 }
      );
    }

    // 2. Ensure the partial unique index exists
    try {
      const indexes = await db.collection("users").indexes();
      const hasIndex = indexes.some((idx: any) => idx.name === "single_super_admin_unique_idx");
      if (!hasIndex) {
        await db.collection("users").createIndex(
          { role: 1 },
          {
            unique: true,
            partialFilterExpression: { role: "SUPER_ADMIN" },
            name: "single_super_admin_unique_idx",
          }
        );
      }
    } catch (idxErr: any) {
      console.warn("Index verification notice:", idxErr.message);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Register user via Better-Auth
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
      console.error("Better-Auth Super Admin signup error:", authErr);
      return NextResponse.json(
        { success: false, error: authErr?.message || "Failed to register credentials." },
        { status: 500 }
      );
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Failed to create Super Admin authentication entity." },
        { status: 500 }
      );
    }

    // 4. Elevate to SUPER_ADMIN with root permissions
    const updatedUser = await User.findByIdAndUpdate(
      authUser.id,
      {
        role: UserRole.SUPER_ADMIN,
        department: "Executive Administration",
        permissions: ["*"],
        status: "ACTIVE",
        emailVerified: true,
        twoFactorEnabled: false,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Super Administrator successfully initialized!",
      user: {
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
      },
    });
  } catch (error: any) {
    console.error("Setup Super Admin error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
