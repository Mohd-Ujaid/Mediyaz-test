import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { User } from "@/models/User";
import { Hospital } from "@/models/Hospital";
import { createAuditLog } from "@/features/audit-logs/services/audit-log.service";

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    // Authorization check
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Access Denied." }, { status: 401 });
    }
    const role = (session.user as any).role;
    const permissions = (session.user as any).permissions || [];
    const isAllowed = ["ADMIN", "SUPER_ADMIN"].includes(role) || permissions.includes("VIEW_REGISTRATIONS") || permissions.includes("VIEW_REG_CHECKS");
    
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden: Admins or Authorized Staff only." }, { status: 403 });
    }

    await connectToDatabase();
    
    // Ensure Hospital model is registered to avoid populate MissingSchemaError
    const _forceRegisterHospital = Hospital.modelName;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const donorType = searchParams.get("donorType") || "";
    const status = searchParams.get("status") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const hospital = searchParams.get("hospital") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    const query: any = {};
    if (donorType) query.donorType = donorType;
    if (status) query.status = status;
    if (bloodGroup) query["personalInfo.bloodGroup"] = bloodGroup;
    if (hospital) query.assignedHospital = hospital;

    if (search) {
      query.$or = [
        { registrationId: { $regex: search, $options: "i" } },
        { "personalInfo.fullName": { $regex: search, $options: "i" } },
        { "contactInfo.emailAddress": { $regex: search, $options: "i" } },
        { "contactInfo.mobileNumber": { $regex: search, $options: "i" } },
      ];
    }

    const total = await DonorRegistration.countDocuments(query);
    const registrations = await DonorRegistration.find(query)
      .populate("assignedHospital")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      success: true, 
      registrations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    console.error("Admin fetch registrations error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
