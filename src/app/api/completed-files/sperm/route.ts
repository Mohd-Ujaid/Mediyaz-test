import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const permissions = (session.user as any)?.permissions || [];
    const isAllowed =
      ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role) ||
      permissions.includes("VIEW_REGISTRATIONS") ||
      permissions.includes("VIEW_REG_CHECKS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const _forceRegister = Hospital.modelName;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {
      donorType: "sperm",
      status: "FILE_COMPLETED",
    };

    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { registrationId: { $regex: safeSearch, $options: "i" } },
        { donorId: { $regex: safeSearch, $options: "i" } },
        { "personalInfo.fullName": { $regex: safeSearch, $options: "i" } },
        { "contactInfo.mobileNumber": { $regex: safeSearch, $options: "i" } },
        { "contactInfo.city": { $regex: safeSearch, $options: "i" } },
      ];
    }

    const total = await SpermDonorRegistration.countDocuments(query);
    const completedFiles = await SpermDonorRegistration.find(query)
      .populate("assignedHospital")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      files: completedFiles,
    });
  } catch (error: any) {
    console.error("Error fetching completed sperm donor files:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
