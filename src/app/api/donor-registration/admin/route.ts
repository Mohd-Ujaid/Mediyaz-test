import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { Hospital } from "@/models/Hospital";

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
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
    const _forceRegisterHospital = Hospital.modelName;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const donorType = searchParams.get("donorType") || "";
    const status = searchParams.get("status") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const hospital = searchParams.get("hospital") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const skip = (page - 1) * limit;
    
    const query: any = {};
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

    let registrations: any[] = [];
    let total = 0;

    if (donorType === "egg") {
      total = await EggDonorRegistration.countDocuments(query);
      registrations = await EggDonorRegistration.find(query)
        .populate("assignedHospital")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } else if (donorType === "sperm") {
      total = await SpermDonorRegistration.countDocuments(query);
      registrations = await SpermDonorRegistration.find(query)
        .populate("assignedHospital")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } else {
      const [eggTotal, spermTotal] = await Promise.all([
        EggDonorRegistration.countDocuments(query),
        SpermDonorRegistration.countDocuments(query),
      ]);
      total = eggTotal + spermTotal;

      const [eggDocs, spermDocs] = await Promise.all([
        EggDonorRegistration.find(query).populate("assignedHospital").sort({ createdAt: -1 }).limit(skip + limit).lean(),
        SpermDonorRegistration.find(query).populate("assignedHospital").sort({ createdAt: -1 }).limit(skip + limit).lean(),
      ]);

      const combined = [...eggDocs, ...spermDocs].sort(
        (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      registrations = combined.slice(skip, skip + limit);
    }

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
