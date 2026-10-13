import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Hospital } from "@/models/Hospital";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

// GET /api/hospitals/[id]/cases - Fetch all donor cases assigned to this clinic
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: hospitalId } = await params;
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(hospitalId);
    const hospitalQuery = isObjectId
      ? { $or: [{ _id: new mongoose.Types.ObjectId(hospitalId) }, { code: hospitalId }] }
      : { code: hospitalId };

    const hospital = await Hospital.findOne(hospitalQuery).lean();
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital not found" }, { status: 404 });
    }

    const actualId = hospital._id;

    // Fetch assigned egg and sperm donor cases
    const [eggCases, spermCases] = await Promise.all([
      EggDonorRegistration.find({ assignedHospital: actualId })
        .select("registrationId donorId donorType personalInfo contactInfo status clinicDeal donorDeal pickupDate supplyDate assignedDoctor assignedDoctorId assignedBranch assignedBranchId createdAt updatedAt")
        .sort({ updatedAt: -1 })
        .lean(),
      SpermDonorRegistration.find({ assignedHospital: actualId })
        .select("registrationId donorId donorType personalInfo contactInfo status clinicDeal donorDeal pickupDate supplyDate assignedDoctor assignedDoctorId assignedBranch assignedBranchId createdAt updatedAt")
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const formattedEgg = eggCases.map((c: any) => ({
      _id: c._id.toString(),
      registrationId: c.registrationId,
      donorId: c.donorId || "—",
      donorType: "egg" as const,
      donorName: c.personalInfo?.fullName || "Egg Donor",
      mobileNumber: c.contactInfo?.mobileNumber || "",
      status: c.status || "IN_PROGRESS",
      assignedDoctor: c.assignedDoctor || "",
      assignedDoctorId: c.assignedDoctorId || "",
      assignedBranch: c.assignedBranch || "",
      assignedBranchId: c.assignedBranchId || "",
      pickupDate: c.pickupDate || "",
      supplyDate: c.supplyDate || "",
      hospitalDealPrice: c.clinicDeal?.hospitalDealPrice || hospital.eggDonorDealPrice || 65000,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    const formattedSperm = spermCases.map((c: any) => ({
      _id: c._id.toString(),
      registrationId: c.registrationId,
      donorId: c.donorId || "—",
      donorType: "sperm" as const,
      donorName: c.personalInfo?.fullName || "Sperm Donor",
      mobileNumber: c.contactInfo?.mobileNumber || "",
      status: c.status || "IN_PROGRESS",
      assignedDoctor: c.assignedDoctor || "",
      assignedDoctorId: c.assignedDoctorId || "",
      assignedBranch: c.assignedBranch || "",
      assignedBranchId: c.assignedBranchId || "",
      pickupDate: c.pickupDate || "",
      supplyDate: c.supplyDate || "",
      hospitalDealPrice: c.clinicDeal?.hospitalDealPrice || hospital.spermDonorDealPrice || 15000,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    const allCases = [...formattedEgg, ...formattedSperm].sort((a, b) => {
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    // Compute metrics by doctor
    const doctorStats: Record<string, number> = {
      unassigned: 0,
      total: allCases.length,
    };

    allCases.forEach((c) => {
      const docName = (c.assignedDoctor || "").trim();
      if (!docName) {
        doctorStats.unassigned = (doctorStats.unassigned || 0) + 1;
      } else {
        doctorStats[docName] = (doctorStats[docName] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        shortName: hospital.shortName,
        doctors: hospital.doctors || [],
        branches: hospital.branches || [],
      },
      cases: allCases,
      doctorStats,
      totalCases: allCases.length,
    });
  } catch (error: any) {
    console.error("Error in GET /api/hospitals/[id]/cases:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/hospitals/[id]/cases - Assign / Reassign a case to a specific treating doctor
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: hospitalId } = await params;
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userName = (session.user as any)?.name || (session.user as any)?.email || "Admin";

    await connectToDatabase();

    const body = await req.json();
    const { registrationId, donorType, assignedDoctor, assignedDoctorId, assignedBranch, assignedBranchId } = body;

    if (!registrationId) {
      return NextResponse.json({ success: false, error: "registrationId is required" }, { status: 400 });
    }

    const updatePayload: any = {
      assignedDoctor: (assignedDoctor || "").trim(),
      assignedDoctorId: assignedDoctorId || "",
      assignedBranch: assignedBranch || "",
      assignedBranchId: assignedBranchId || "",
    };

    let updatedDoc: any = null;
    let typeFound = donorType;

    // Try updating Egg first or according to donorType
    if (donorType === "egg" || !donorType) {
      updatedDoc = await EggDonorRegistration.findOneAndUpdate(
        { registrationId },
        { $set: updatePayload },
        { new: true }
      );
      if (updatedDoc) typeFound = "egg";
    }

    if (!updatedDoc && (donorType === "sperm" || !donorType)) {
      updatedDoc = await SpermDonorRegistration.findOneAndUpdate(
        { registrationId },
        { $set: updatePayload },
        { new: true }
      );
      if (updatedDoc) typeFound = "sperm";
    }

    if (!updatedDoc) {
      return NextResponse.json({ success: false, error: "Case not found" }, { status: 404 });
    }

    // Audit log
    try {
      const { createAuditLog } = await import("@/features/audit-logs/services/audit-log.service");
      await createAuditLog(
        null,
        "Case Assigned to Treating Doctor",
        typeFound === "egg" ? "EggDonorRegistration" : "SpermDonorRegistration",
        updatedDoc._id.toString(),
        userName,
        "ASSIGNED",
        "ASSIGNED",
        `Assigned case ${registrationId} to Treating Doctor: ${assignedDoctor || "Unassigned"} at clinic ${hospitalId}`
      );
    } catch (auditErr) {
      console.warn("Audit log non-fatal error:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Case successfully assigned to ${assignedDoctor || "doctor"}`,
      registration: updatedDoc,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/hospitals/[id]/cases:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
