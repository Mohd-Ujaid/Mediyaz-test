import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtSpermDonor } from "@/models/ArtSpermDonor";
import { ArtDonor } from "@/models/ArtDonor";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

function formatHeight(heightCm: number): string {
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}" (${heightCm} cm)`;
}

function calculateBmi(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 21;
  const meters = heightCm / 100;
  return +(weightKg / (meters * meters)).toFixed(1);
}

// GET single sperm donor
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const donor = await ArtSpermDonor.findById(id);
    if (!donor) {
      return NextResponse.json({ success: false, error: "Sperm donor not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, donor });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update sperm donor
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const permissions = (session.user as any)?.permissions || [];
    const isAllowed = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role) || permissions.includes("VIEW_REGISTRATIONS");
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden: Access Denied." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    if (body.heightCm) {
      body.heightFormatted = formatHeight(Number(body.heightCm));
    }
    if (body.heightCm && body.weightKg) {
      body.bmi = calculateBmi(Number(body.heightCm), Number(body.weightKg));
    }

    const updated = await ArtSpermDonor.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Sperm donor not found" }, { status: 404 });
    }

    // Sync to art_donors
    try {
      await ArtDonor.findOneAndUpdate({ donorCode: updated.donorCode }, body);
    } catch (syncErr) {
      console.warn("Sync to art_donors error:", syncErr);
    }

    return NextResponse.json({ success: true, donor: updated });
  } catch (err: any) {
    console.error("PUT /api/art-donors/sperm/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Delete sperm donor
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const isAllowed = ["ADMIN", "SUPER_ADMIN"].includes(role);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden: Only Administrators can delete donor profiles." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const deleted = await ArtSpermDonor.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Sperm donor not found" }, { status: 404 });
    }

    // Sync deletion to art_donors
    try {
      await ArtDonor.findOneAndDelete({ donorCode: deleted.donorCode });
    } catch (syncErr) {
      console.warn("Sync delete to art_donors error:", syncErr);
    }

    return NextResponse.json({ success: true, message: "Sperm donor deleted successfully." });
  } catch (err: any) {
    console.error("DELETE /api/art-donors/sperm/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
