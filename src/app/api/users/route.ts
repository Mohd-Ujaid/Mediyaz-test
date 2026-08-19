import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole } from "@/models/User";
import { Donor } from "@/models/Donor";
import { Employee } from "@/models/Employee";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

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

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;
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

    const { name, email, phone, role, department, permissions } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required." }, { status: 400 });
    }

    // Check duplicate
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email is already registered." }, { status: 400 });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      role: role || UserRole.RECIPIENT,
      department: department || "General",
      permissions: permissions || ["READ_PORTAL"],
      status: "ACTIVE",
    });

    return NextResponse.json({ success: true, user });
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
    const { userId, ...updateFields } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    // Hash password if updating password
    if (updateFields.password) {
      // Better-auth uses its own hashing, but if admin updates password we can handle it or omit
      delete updateFields.password;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    // Synchronize updates to linked Donor/Employee status
    const statusUpdate = updateFields.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    if (updateFields.status) {
      await Donor.findOneAndUpdate({ user: userId }, { donationStatus: statusUpdate });
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
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    // 1. Delete associated profile records
    await Donor.deleteOne({ user: userId });
    await Employee.deleteOne({ user: userId });

    // 2. Delete user
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User and linked profile records deleted successfully!"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
