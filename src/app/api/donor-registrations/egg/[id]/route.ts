import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { Hospital } from "@/models/Hospital";
import {
  computeEggDonorManagementStatus,
  mergeWithDotNotation,
  hasUploadedViralMarkersReport,
  hasUploadedBloodReport,
} from "@/features/donor-registration/utils/egg-donor-status";
import mongoose from "mongoose";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      permissions.includes("VIEW_REG_CHECKS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden: Access Denied." }, { status: 403 });
    }

    const { id } = await params;
    const cleanId = decodeURIComponent(id || "").trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(cleanId) && /^[0-9a-fA-F]{24}$/.test(cleanId);

    await connectToDatabase();
    const _forceRegister = Hospital.modelName;

    let registration = await EggDonorRegistration.findOne({
      $or: [
        { registrationId: cleanId },
        { registrationId: new RegExp(`^${cleanId}$`, "i") },
        ...(isObjectId ? [{ _id: cleanId }] : []),
      ],
    }).populate("assignedHospital");

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id || "").trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(cleanId) && /^[0-9a-fA-F]{24}$/.test(cleanId);

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
    const body = await req.json();

    // Look up existing registration first to validate constraints
    let existing = await EggDonorRegistration.findOne({
      $or: [
        { registrationId: cleanId },
        { registrationId: new RegExp(`^${cleanId}$`, "i") },
        ...(isObjectId ? [{ _id: cleanId }] : []),
      ],
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    const userName = (session.user as any)?.name || (session.user as any)?.email || "Admin";

    // Validate recruitmentDate bounds (cannot be in future, cannot be earlier than last recruitment date)
    if (body.recruitmentDate && body.recruitmentDate !== existing.recruitmentDate) {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      const cleanRecruit = String(body.recruitmentDate).slice(0, 10);
      const formatDateStr = (s: string) => {
        try {
          const [y, m, d] = s.split("-").map(Number);
          return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        } catch {
          return s;
        }
      };

      if (cleanRecruit > today) {
        return NextResponse.json(
          { success: false, error: `Recruitment date cannot be in the future (not tomorrow or later). Must be on or before Today (${formatDateStr(today)}).` },
          { status: 400 }
        );
      }

      const latestEgg = await EggDonorRegistration.findOne({
        _id: { $ne: existing._id },
        registrationId: { $ne: existing.registrationId },
        recruitmentDate: { $exists: true, $ne: "", $lte: today, $regex: /^\d{4}-\d{2}-\d{2}/ },
      })
        .sort({ recruitmentDate: -1 })
        .select("recruitmentDate")
        .lean();

      const lastDate = latestEgg?.recruitmentDate ? String(latestEgg.recruitmentDate).slice(0, 10) : null;
      if (lastDate && cleanRecruit < lastDate) {
        return NextResponse.json(
          { success: false, error: `Recruitment date cannot be earlier than the last recruitment date (${formatDateStr(lastDate)}).` },
          { status: 400 }
        );
      }
    }

    // Strict validation when marking as APPROVED
    if (body.status === "APPROVED") {
      const effectiveHospital = body.assignedHospital || existing.assignedHospital;
      if (!effectiveHospital) {
        return NextResponse.json(
          {
            success: false,
            error: "A hospital/ART clinic must be assigned before approving an egg donor registration.",
          },
          { status: 400 }
        );
      }

      const isRegistry =
        body.hospitalDealType === "registry" ||
        body.clinicDeal?.donorCategory === "registry" ||
        existing.hospitalDealType === "registry" ||
        existing.clinicDeal?.donorCategory === "registry";

      const category =
        body.clinicDeal?.donorCategory ||
        existing.clinicDeal?.donorCategory ||
        body.donorDeal?.donorCategory ||
        existing.donorDeal?.donorCategory ||
        body.hospitalDealType ||
        existing.hospitalDealType ||
        "normal";

      // Ensure user-entered values are properly typed
      if (body.donorDeal && body.donorDeal.compensationAmount !== undefined) {
        body.donorDeal.compensationAmount = Number(body.donorDeal.compensationAmount) || 0;
      }
      if (body.clinicDeal && body.clinicDeal.hospitalDealPrice !== undefined) {
        body.clinicDeal.hospitalDealPrice = Number(body.clinicDeal.hospitalDealPrice) || 0;
      }
    }

    // Hospital Assignment History Tracking
    if (body.assignedHospital !== undefined) {
      const oldHospitalId = existing.assignedHospital?.toString();
      const newHospitalId = body.assignedHospital ? body.assignedHospital.toString() : null;

      if (oldHospitalId !== newHospitalId) {
        body.assignmentHistory = existing.assignmentHistory || [];
        body.assignmentHistory.push({
          oldHospital: existing.assignedHospital || null,
          newHospital: body.assignedHospital || null,
          assignedBy: userName,
          assignedAt: new Date(),
          reason: body.assignmentReason || (body.status === "APPROVED" ? "Assigned upon donor approval" : "Updated during clinical review"),
        });
        body.assignedBy = newHospitalId ? userName : null;
        body.assignedAt = newHospitalId ? new Date() : null;
      }
    }

    // Dual deals timestamps and audit attribution
    if (body.clinicDeal) {
      body.clinicDeal.agreedAt = body.clinicDeal.agreedAt || new Date();
      body.clinicDeal.agreedBy = body.clinicDeal.agreedBy || userName;
      body.clinicDeal.currency = body.clinicDeal.currency || "INR";
    }

    if (body.donorDeal) {
      body.donorDeal.agreedAt = body.donorDeal.agreedAt || new Date();
      body.donorDeal.agreedBy = body.donorDeal.agreedBy || userName;
    }

    // Merge updates with base document, correctly resolving dot-notation keys
    const mergedForStatus = mergeWithDotNotation(existing.toObject(), body);
    const autoStatusResult = computeEggDonorManagementStatus(mergedForStatus);

    // Auto-compute status if not explicitly overridden by admin
    if (!body.status) {
      if (!["REJECTED", "SUSPENDED", "CANCELLED"].includes(existing.status)) {
        body.status = autoStatusResult.status;
      }
    }

    if (body.status && body.status !== existing.status) {
      body.reviewedBy = userName;
      body.reviewedAt = new Date();
    }

    const registration = await EggDonorRegistration.findOneAndUpdate(
      { _id: existing._id },
      { $set: body },
      { returnDocument: 'after' }
    ).populate("assignedHospital");

    const directUpdates: any = {};
    let donorIdToUse = body.donorId || existing.donorId;
    if (
      (body.status === "APPROVED" || ["WAITING_FORM13", "FILE_COMPLETED"].includes(body.status)) &&
      !donorIdToUse
    ) {
      const count = await EggDonorRegistration.countDocuments({ donorId: { $exists: true, $ne: "" } });
      donorIdToUse = `MED-ED-${new Date().getFullYear()}-${String(count + 1001).padStart(4, "0")}`;
    }
    if (donorIdToUse) {
      body.donorId = donorIdToUse;
      directUpdates.donorId = donorIdToUse;
    }

    if (body.recruitmentDate !== undefined) directUpdates.recruitmentDate = body.recruitmentDate;
    if (body.supplyDate !== undefined) directUpdates.supplyDate = body.supplyDate;
    if (body.pickupDate !== undefined) directUpdates.pickupDate = body.pickupDate;
    if (body.adminNotes !== undefined) directUpdates.adminNotes = body.adminNotes;
    if (body.status !== undefined) directUpdates.status = body.status;
    if (body.certificateIssued !== undefined) directUpdates.certificateIssued = body.certificateIssued;
    if (body.certificateIssuedAt !== undefined) directUpdates.certificateIssuedAt = body.certificateIssuedAt;
    if (body.certificateIssuedBy !== undefined) directUpdates.certificateIssuedBy = body.certificateIssuedBy;
    if (body.documentVerification !== undefined) {
      directUpdates.documentVerification = {
        ...body.documentVerification,
        verifiedBy: body.documentVerification?.isVerified ? userName : null,
      };
    }

    const hasAffidavitKey = "documents.affidavit" in body || (body.documents && "affidavit" in body.documents) || "affidavit" in body;
    if (hasAffidavitKey) {
      const affidavitDoc = body["documents.affidavit"] ?? body.documents?.affidavit ?? body.affidavit ?? null;
      directUpdates["documents.affidavit"] = affidavitDoc;
      directUpdates.affidavit = affidavitDoc;
    }

    if (body.donorDeal !== undefined) directUpdates.donorDeal = body.donorDeal;
    if (body.clinicDeal !== undefined) directUpdates.clinicDeal = body.clinicDeal;
    if (body.hospitalDealType !== undefined) directUpdates.hospitalDealType = body.hospitalDealType;
    if (body.assignedHospital !== undefined) {
      directUpdates.assignedHospital = body.assignedHospital
        ? (mongoose.Types.ObjectId.isValid(body.assignedHospital) ? new mongoose.Types.ObjectId(body.assignedHospital) : body.assignedHospital)
        : null;
    }

    if (Object.keys(directUpdates).length > 0) {
      await EggDonorRegistration.collection.updateOne(
        { _id: existing._id },
        { $set: directUpdates }
      ).catch(() => {});
    }

    const freshRegistration = await EggDonorRegistration.findById(existing._id).populate("assignedHospital") || registration;

    // Create Audit Log if status changed or hospital assigned
    if (body.status && body.status !== existing.status) {
      try {
        const { createAuditLog } = await import("@/features/audit-logs/services/audit-log.service");
        await createAuditLog(
          null,
          body.status === "APPROVED" ? "Egg Donor Approved with Deals" : "Registration Status Changed",
          "EggDonorRegistration",
          existing._id.toString(),
          userName,
          existing.status,
          body.status,
          `Status updated to "${body.status}". Assigned hospital: ${freshRegistration?.assignedHospital ? (freshRegistration.assignedHospital as any).name : "None"}. Clinic Deal: ₹${freshRegistration?.clinicDeal?.hospitalDealPrice || 0}. Donor Payout: ₹${freshRegistration?.donorDeal?.compensationAmount || 0}.`
        );
      } catch (auditErr) {
        console.error("Audit log error:", auditErr);
      }
    }

    return NextResponse.json({ success: true, registration: freshRegistration });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id || "").trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(cleanId) && /^[0-9a-fA-F]{24}$/.test(cleanId);

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
      ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role) ||
      permissions.includes("VIEW_REGISTRATIONS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const reg = await EggDonorRegistration.findOneAndDelete({
      $or: [
        { registrationId: cleanId },
        { registrationId: new RegExp(`^${cleanId}$`, "i") },
        ...(isObjectId ? [{ _id: cleanId }] : []),
      ],
    });

    return NextResponse.json({ success: true, message: "Registration deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
