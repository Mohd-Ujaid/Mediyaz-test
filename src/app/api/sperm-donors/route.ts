import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SpermDonor } from "@/models/SpermDonor";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

function generateAppId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SD-${dateStr}-${rand}`;
}

// GET: Admin gets all, public can query by applicationId (returns sanitized data)
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");

    if (applicationId) {
      const donor = await SpermDonor.findOne({ applicationId });
      if (!donor) return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });

      // Check authorization (Admin/Staff or Owner gets full data)
      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      const role = session?.user?.role || "";
      const isAdminOrStaff = session && ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
      const isOwner = session && (
        (session.user.email && donor.personalInfo?.email && session.user.email.toLowerCase() === donor.personalInfo.email.toLowerCase()) ||
        ((session.user as any).phone && donor.personalInfo?.phone && (session.user as any).phone === donor.personalInfo.phone)
      );

      if (isAdminOrStaff || isOwner) {
        return NextResponse.json({ success: true, donor });
      }

      // Guest: return sanitized profile to prevent sensitive PII leakage
      const sanitized = {
        applicationId: donor.applicationId,
        status: donor.status,
        createdAt: donor.createdAt,
        updatedAt: donor.updatedAt,
        adminNotes: donor.adminNotes,
        personalInfo: {
          fullName: donor.personalInfo?.fullName ? donor.personalInfo.fullName.replace(/(?<=.).(?=.)/g, "*") : "Sperm Donor Applicant",
          bloodGroup: (donor as any).healthInfo?.bloodGroup || "TBD",
        }
      };

      return NextResponse.json({ success: true, donor: sanitized });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const donors = await SpermDonor.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, donors });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.personalInfo?.fullName || !body.personalInfo?.email || !body.personalInfo?.phone) {
      return NextResponse.json({ success: false, error: "Name, email, and phone are required." }, { status: 400 });
    }
    if (!body.consentAgreed) {
      return NextResponse.json({ success: false, error: "Consent agreement is required." }, { status: 400 });
    }

    const applicationId = generateAppId();
    const donor = await SpermDonor.create({ ...body, applicationId, status: "PENDING_REVIEW" });

    return NextResponse.json({ success: true, applicationId, donor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const { id, status, adminNotes } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "ID required." }, { status: 400 });

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;

    const donor = await SpermDonor.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!donor) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });

    return NextResponse.json({ success: true, donor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID required." }, { status: 400 });

    await SpermDonor.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Application deleted." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
