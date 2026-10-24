import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

/**
 * Returns current date formatted as YYYY-MM-DD in IST (Asia/Kolkata).
 */
export function getTodayISTDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const permissions = (session.user as any)?.permissions || [];
    const isAllowed =
      ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role) ||
      permissions.includes("VIEW_REGISTRATIONS") ||
      permissions.includes("MANAGE_REGISTRATIONS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden: Access Denied." }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("excludeId");

    const today = getTodayISTDateString();

    const filter: any = {
      recruitmentDate: { $exists: true, $ne: "", $lte: today, $regex: /^\d{4}-\d{2}-\d{2}/ },
    };

    if (excludeId) {
      const isObjectId = mongoose.Types.ObjectId.isValid(excludeId) && /^[0-9a-fA-F]{24}$/.test(excludeId);
      filter.$nor = [
        { registrationId: excludeId },
        ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(excludeId) }] : []),
      ];
    }

    const latestEgg = await EggDonorRegistration.findOne(filter)
      .sort({ recruitmentDate: -1 })
      .select("recruitmentDate")
      .lean();

    const lastRecruitmentDate = latestEgg?.recruitmentDate
      ? String(latestEgg.recruitmentDate).slice(0, 10)
      : null;

    let minDate = lastRecruitmentDate;
    if (minDate && minDate > today) {
      minDate = today;
    }

    const maxDate = today;

    return NextResponse.json({
      success: true,
      lastRecruitmentDate,
      minDate,
      maxDate,
      today,
    });
  } catch (error: any) {
    console.error("Error fetching recruitment date bounds:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
