import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Employee, EmployeeDesignation } from "@/models/Employee";
import { User, UserRole } from "@/models/User";
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
    const userPermissions = (session.user as any).permissions || [];
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

    if (!isAdmin && !userPermissions.includes("MANAGE_STAFF")) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    
    // Pagination & Search Parameters
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const designation = searchParams.get("designation") || "";
    const shift = searchParams.get("shift") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};

    // 1. Text Search Filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Exact Match Filters
    if (department) query.department = department;
    if (designation) query.designation = designation;
    if (shift) query.shift = shift;
    if (status) query.status = status;

    // 3. Query Execution
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate("user", "name email role status avatar permissions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      employees,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (error: any) {
    console.error("Fetch employees error:", error);
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
    const userPermissions = (session.user as any).permissions || [];
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

    if (!isAdmin && !userPermissions.includes("MANAGE_STAFF")) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    
    const { 
      name, 
      email, 
      phone, 
      photo, 
      department, 
      designation, 
      qualification, 
      experienceYears, 
      salary, 
      shift,
      password,
      permissions
    } = body;

    // Validate fields
    if (!name || !email || !phone || !designation || !qualification || !experienceYears || !salary) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    // Check for duplicate employee
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmployee) {
      return NextResponse.json({ success: false, error: "An employee with this email already exists." }, { status: 400 });
    }

    // Register User account via Better Auth for proper password hashing and login capabilities
    let userRecord = await User.findOne({ email: email.toLowerCase() });
    if (!userRecord) {
      const empPassword = password || "password123";
      
      const reqHeaders = await headers();
      const authResult = await auth.api.signUpEmail({
        headers: reqHeaders,
        body: {
          email: email.toLowerCase(),
          password: empPassword,
          name,
        },
      });

      if (!authResult || !authResult.user) {
        return NextResponse.json({ success: false, error: "Failed to create employee authentication login." }, { status: 500 });
      }

      // Determine User Role
      let role = UserRole.STAFF;
      if (designation === EmployeeDesignation.ADMIN) role = UserRole.ADMIN;
      if (designation === EmployeeDesignation.DOCTOR) role = UserRole.DOCTOR;
      if (designation === EmployeeDesignation.RECEPTIONIST) role = UserRole.RECEPTIONIST;

      userRecord = await User.findByIdAndUpdate(
        authResult.user.id,
        {
          role,
          phone,
          avatar: photo || "",
          status: "ACTIVE",
          emailVerified: true,
          permissions: permissions || ["READ_PORTAL"]
        },
        { new: true }
      );
    }

    // Generate Employee ID
    const count = await Employee.countDocuments();
    const employeeId = `EMP-${new Date().getFullYear()}-${String(count + 101).padStart(3, "0")}`;

    // Create Employee record
    const employee = await Employee.create({
      user: userRecord?._id,
      employeeId,
      name,
      email: email.toLowerCase(),
      phone,
      photo: photo || "",
      department: department || "General Clinic",
      designation,
      qualification,
      experienceYears: Number(experienceYears),
      salary: Number(salary),
      shift: shift || "Morning",
      attendanceRate: 100,
      performanceRating: 5,
      status: "ACTIVE"
    });

    return NextResponse.json({
      success: true,
      message: "Employee profile created successfully!",
      employee
    });

  } catch (error: any) {
    console.error("Create employee error:", error);
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
    const userPermissions = (session.user as any).permissions || [];
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

    if (!isAdmin && !userPermissions.includes("MANAGE_STAFF")) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { employeeId, ...updateFields } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Employee ID is required." }, { status: 400 });
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employeeId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedEmployee) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }

    // Sync status, details, and permissions to associated User if linked
    if (updatedEmployee.user) {
      const userUpdate: any = {};
      if (updateFields.status) {
        userUpdate.status = updateFields.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
      }
      if (updateFields.permissions) {
        userUpdate.permissions = updateFields.permissions;
      }
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(updatedEmployee.user, userUpdate);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Employee profile updated successfully!",
      employee: updatedEmployee
    });

  } catch (error: any) {
    console.error("Update employee error:", error);
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
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Employee ID is required." }, { status: 400 });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found." }, { status: 404 });
    }

    // Toggle status instead of hard deletion to maintain integrity of records
    const newStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    employee.status = newStatus;
    await employee.save();

    if (employee.user) {
      await User.findByIdAndUpdate(employee.user, {
        status: newStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE"
      });
    }

    return NextResponse.json({
      success: true,
      message: `Employee status updated to ${newStatus}.`,
      employee
    });

  } catch (error: any) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
