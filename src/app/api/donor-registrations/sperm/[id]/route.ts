import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { Hospital } from "@/models/Hospital";

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
    await connectToDatabase();
    const _forceRegister = Hospital.modelName;

    let registration = await SpermDonorRegistration.findOne({
      $or: [{ registrationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
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
    const body = await req.json();

    let existing = await SpermDonorRegistration.findOne({
      $or: [{ registrationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    const userName = (session.user as any)?.name || (session.user as any)?.email || "Admin";

    // Audit and review attribution
    if (body.status && body.status !== existing.status) {
      body.reviewedBy = userName;
      body.reviewedAt = new Date();
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

    if (body.status && body.status !== existing.status) {
      body.reviewedBy = userName;
      body.reviewedAt = new Date();
    }

    const registration = await SpermDonorRegistration.findOneAndUpdate(
      { _id: existing._id },
      { $set: body },
      { returnDocument: 'after' }
    ).populate("assignedHospital");

    // AUTO-GENERATE DONOR ID ON APPROVAL (IF NOT ALREADY ASSIGNED)
    let donorIdToUse = registration?.donorId || existing.donorId;
    if (body.status === "APPROVED" && !donorIdToUse) {
      const { Donor } = await import("@/models/Donor");
      const count = await Donor.countDocuments();
      const currentYear = new Date().getFullYear();
      const formattedDonorId = `D-${currentYear}-${String(count + 1).padStart(4, "0")}`;

      await SpermDonorRegistration.collection.updateOne(
        { _id: existing._id },
        { $set: { donorId: formattedDonorId } }
      );
      donorIdToUse = formattedDonorId;
    }
    if (body.status && body.status !== existing.status) {
      try {
        const { createAuditLog } = await import("@/features/audit-logs/services/audit-log.service");
        await createAuditLog(
          null,
          body.status === "APPROVED" ? "Sperm Donor Approved with Deals" : "Registration Status Changed",
          "SpermDonorRegistration",
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

    const reg = await SpermDonorRegistration.findOneAndDelete({
      $or: [{ registrationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    return NextResponse.json({ success: true, message: "Registration deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
