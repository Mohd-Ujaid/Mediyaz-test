import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const donor = await ArtDonor.findById(id);
    if (!donor) {
      return NextResponse.json(
        { success: false, error: "Donor profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, donor });
  } catch (error: any) {
    console.error("GET /api/art-donors/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch donor" },
      { status: 500 }
    );
  }
}

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

    const donor = await ArtDonor.findById(id);
    if (!donor) {
      return NextResponse.json(
        { success: false, error: "Donor profile not found" },
        { status: 404 }
      );
    }

    // Recompute height formatted and BMI if height/weight changed
    if (body.heightCm || body.weightKg) {
      const heightCm = Number(body.heightCm || donor.heightCm);
      const weightKg = Number(body.weightKg || donor.weightKg);
      body.heightCm = heightCm;
      body.weightKg = weightKg;
      body.bmi = calculateBmi(heightCm, weightKg);
      if (!body.heightFormatted) {
        body.heightFormatted = formatHeight(heightCm);
      }
    }

    // Sync viral markers with infectious serology if updated
    if (body.viralMarkers) {
      body.viralMarkers = {
        ...donor.viralMarkers,
        ...body.viralMarkers,
      };
      if (body.geneticScreenings?.infectiousSerology) {
        body.geneticScreenings.infectiousSerology.hiv = body.viralMarkers.hiv;
        body.geneticScreenings.infectiousSerology.hbsAg = body.viralMarkers.hbsAg;
        body.geneticScreenings.infectiousSerology.hcv = body.viralMarkers.hcv;
        body.geneticScreenings.infectiousSerology.vdrl = body.viralMarkers.vdrl;
      }
    }

    // Update availability label if availability changed
    if (body.availability && !body.availabilityLabel) {
      body.availabilityLabel =
        body.availability === "available"
          ? "Available Immediately (Vitrified)"
          : body.availability === "quarantine"
          ? "Cryo-Quarantine Phase"
          : "Allocated";
    }

    const updatedDonor = await ArtDonor.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Donor profile updated successfully!",
      donor: updatedDonor,
    });
  } catch (error: any) {
    console.error("PUT /api/art-donors/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update donor" },
      { status: 500 }
    );
  }
}

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

    const donor = await ArtDonor.findById(id);
    if (!donor) {
      return NextResponse.json(
        { success: false, error: "Donor profile not found" },
        { status: 404 }
      );
    }

    await ArtDonor.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Donor profile ${donor.donorCode} deleted successfully!`,
    });
  } catch (error: any) {
    console.error("DELETE /api/art-donors/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete donor" },
      { status: 500 }
    );
  }
}
