import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { Hospital } from "@/models/Hospital";
import { computeEggDonorManagementStatus } from "@/features/donor-registration/utils/egg-donor-status";
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

      const effectiveClinicDeal = body.clinicDeal || existing.clinicDeal;
      if (!effectiveClinicDeal || !effectiveClinicDeal.hospitalDealPrice || effectiveClinicDeal.hospitalDealPrice <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Deal with clinic must be applied before approving this egg donor.",
          },
          { status: 400 }
        );
      }

      if (!isRegistry) {
        const effectiveDonorDeal = body.donorDeal || existing.donorDeal;
        if (!effectiveDonorDeal || !effectiveDonorDeal.compensationAmount || effectiveDonorDeal.compensationAmount <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Deal with donor (compensation amount and payment terms) must be filled before approving this egg donor.",
            },
            { status: 400 }
          );
        }
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

    // Auto-compute status if not explicitly overridden, or if in management pipeline
    if (!body.status && ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(existing.status)) {
      const mergedForStatus = {
        ...existing.toObject(),
        ...body,
        labReports: {
          ...(existing.labReports?.toObject ? existing.labReports.toObject() : existing.labReports || {}),
          ...(body.labReports || {}),
        },
        documents: {
          ...(existing.documents?.toObject ? existing.documents.toObject() : existing.documents || {}),
          ...(body.documents || {}),
        },
      };
      body.status = computeEggDonorManagementStatus(mergedForStatus).status;
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
    if (body.status === "APPROVED" && !donorIdToUse) {
      const { Donor } = await import("@/models/Donor");
      const count = await Donor.countDocuments();
      donorIdToUse = `DON-${new Date().getFullYear()}-${String(count + 1001).padStart(4, "0")}`;
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

    if (Object.keys(directUpdates).length > 0) {
      await EggDonorRegistration.collection.updateOne(
        { _id: existing._id },
        { $set: directUpdates }
      ).catch(() => {});
    }

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
          `Status updated to "${body.status}". Assigned hospital: ${registration?.assignedHospital ? (registration.assignedHospital as any).name : "None"}. Clinic Deal: ₹${registration?.clinicDeal?.hospitalDealPrice || 0}. Donor Payout: ₹${registration?.donorDeal?.compensationAmount || 0}.`
        );
      } catch (auditErr) {
        console.error("Audit log error:", auditErr);
      }
    }

    return NextResponse.json({ success: true, registration });
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
