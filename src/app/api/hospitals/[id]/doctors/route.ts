import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

// GET /api/hospitals/[id]/doctors - Fetch doctors for a clinic
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: hospitalId } = await params;
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(hospitalId);
    const query = isObjectId
      ? { $or: [{ _id: new mongoose.Types.ObjectId(hospitalId) }, { code: hospitalId }] }
      : { code: hospitalId };

    const hospital = await Hospital.findOne(query).select("name shortName doctors branches").lean();
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      doctors: hospital.doctors || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/hospitals/[id]/doctors - Add a new doctor to the clinic
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await req.json();
    const { name, specialization, phone, email, regNumber, isPrimary, branchId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Doctor name is required" }, { status: 400 });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(hospitalId);
    const query = isObjectId
      ? { $or: [{ _id: new mongoose.Types.ObjectId(hospitalId) }, { code: hospitalId }] }
      : { code: hospitalId };

    const hospital = await Hospital.findOne(query);
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital not found" }, { status: 404 });
    }

    const newDoctor: any = {
      _id: new mongoose.Types.ObjectId(),
      name: name.trim().startsWith("Dr.") ? name.trim() : `Dr. ${name.trim()}`,
      specialization: (specialization || "IVF Specialist").trim(),
      phone: (phone || "").trim(),
      email: (email || "").trim(),
      regNumber: (regNumber || "").trim(),
      isPrimary: Boolean(isPrimary),
      status: "ACTIVE",
    };

    if (!Array.isArray(hospital.doctors)) {
      hospital.doctors = [];
    }

    // If marked primary, unset other primaries
    if (newDoctor.isPrimary) {
      hospital.doctors.forEach((d: any) => { d.isPrimary = false; });
      hospital.doctorName = newDoctor.name;
    }

    hospital.doctors.push(newDoctor);

    // If branchId is specified, also add to that branch
    if (branchId && Array.isArray(hospital.branches)) {
      const branch = hospital.branches.find((b: any) => String(b._id) === String(branchId));
      if (branch) {
        if (!Array.isArray(branch.doctors)) branch.doctors = [];
        branch.doctors.push(newDoctor);
        if (newDoctor.isPrimary) branch.doctorName = newDoctor.name;
      }
    }

    await hospital.save();

    return NextResponse.json({
      success: true,
      message: "Treating doctor added successfully",
      doctor: newDoctor,
      doctors: hospital.doctors,
    });
  } catch (error: any) {
    console.error("Error in POST /api/hospitals/[id]/doctors:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/hospitals/[id]/doctors - Remove a doctor from the clinic
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "doctorId is required" }, { status: 400 });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(hospitalId);
    const query = isObjectId
      ? { $or: [{ _id: new mongoose.Types.ObjectId(hospitalId) }, { code: hospitalId }] }
      : { code: hospitalId };

    const hospital = await Hospital.findOne(query);
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital not found" }, { status: 404 });
    }

    hospital.doctors = (hospital.doctors || []).filter((d: any) => String(d._id) !== String(doctorId));

    // Also remove from any branches
    if (Array.isArray(hospital.branches)) {
      hospital.branches.forEach((b: any) => {
        if (Array.isArray(b.doctors)) {
          b.doctors = b.doctors.filter((d: any) => String(d._id) !== String(doctorId));
        }
      });
    }

    await hospital.save();

    return NextResponse.json({
      success: true,
      message: "Doctor removed successfully",
      doctors: hospital.doctors,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
