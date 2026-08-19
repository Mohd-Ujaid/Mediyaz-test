import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

// GET a single registration by registrationId
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const registration = await DonorRegistration.findOne({ registrationId: id });
    if (!registration) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH — partial field update (for print-time edits and document upload)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    const permissions = (session.user as any).permissions || [];
    const isAllowed = ["ADMIN", "SUPER_ADMIN"].includes(role) || permissions.includes("VIEW_REGISTRATIONS");
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    // Only allow safe fields to be updated via this endpoint
    const allowedFields = [
      "personalInfo.fullName",
      "personalInfo.dateOfBirth",
      "personalInfo.aadhaarNumber",
      "personalInfo.age",
      "contactInfo.currentAddress",
      "contactInfo.mobileNumber",
      "consent.signatureDate",
      "documents.extraAttachment",
    ];

    const updateObj: Record<string, any> = {};
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        updateObj[key] = body[key];
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await DonorRegistration.findOneAndUpdate(
      { registrationId: id },
      { $set: updateObj },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Registration not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
