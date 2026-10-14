import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

async function findRegistration(id: string) {
  let doc: any = await EggDonorRegistration.findOne({ registrationId: id });
  let model: any = EggDonorRegistration;
  if (!doc) {
    doc = await SpermDonorRegistration.findOne({ registrationId: id });
    model = SpermDonorRegistration;
  }
  return { doc, model };
}

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
    const { doc: registration } = await findRegistration(id);
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

    const allowedFields = [
      "personalInfo.fullName",
      "personalInfo.fatherName",
      "personalInfo.motherName",
      "personalInfo.husbandName",
      "personalInfo.spouseName",
      "personalInfo.dateOfBirth",
      "personalInfo.bloodGroup",
      "personalInfo.education",
      "personalInfo.occupation",
      "personalInfo.height",
      "personalInfo.weight",
      "personalInfo.eyeColor",
      "personalInfo.hairColor",
      "personalInfo.complexion",
      "personalInfo.aadhaarNumber",
      "personalInfo.panNumber",
      "contactInfo.mobileNumber",
      "contactInfo.emailAddress",
      "contactInfo.currentAddress",
      "contactInfo.permanentAddress",
      "contactInfo.city",
      "contactInfo.state",
      "contactInfo.pincode",
      "adminNotes",
      "status",
      "assignedHospital",
      "clinicDeal",
      "semenAnalysisDetails",
    ];

    const update: any = {};
    for (const field of allowedFields) {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        if (body[parent] && body[parent][child] !== undefined) {
          update[field] = body[parent][child];
        }
      } else if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    // Direct path updates
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        update[key] = body[key];
      }
    }

    const { doc: registration, model } = await findRegistration(id);
    if (!registration) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const updated = await model.findOneAndUpdate(
      { registrationId: id },
      { $set: update },
      { new: true }
    );

    return NextResponse.json({ success: true, registration: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
