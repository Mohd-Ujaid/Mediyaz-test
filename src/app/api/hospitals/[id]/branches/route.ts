import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/features/audit-logs/services/audit-log.service";

// GET — List branches of a hospital
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const hospital = await Hospital.findById(id).select("name shortName branches");
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      branches: hospital.branches || []
    });
  } catch (error: any) {
    console.error("Error fetching branches:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch branches." }, { status: 500 });
  }
}

// POST — Add a branch to a hospital
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital not found." }, { status: 404 });
    }

    const {
      branchName,
      branchCode = "",
      registrationNumber = "",
      gstNumber = "",
      contactPerson = "",
      email = "",
      mobileNumber = "",
      telephone = "",
      doctorName = "",
      doctors = [],
      pickupLocation = "",
      addressLine1 = "",
      addressLine2 = "",
      city = "",
      state = "",
      country = "India",
      pincode = "",
      isMainBranch = false,
      status = "ACTIVE",
      eggDonorDealPrice = 65000,
      eggProfileDonorDealPrice = 85000,
      spermDonorDealPrice = 15000,
      spermProfileDonorDealPrice = 25000,
      serviceCharge = 5000,
      tdsPercentage = 2,
      wantInvoice = true
    } = body;

    if (!branchName?.trim()) {
      return NextResponse.json({ success: false, error: "Branch name is required." }, { status: 400 });
    }

    const isFirstBranch = !Array.isArray(hospital.branches) || hospital.branches.length === 0;
    const shouldBeMain = isFirstBranch ? true : Boolean(isMainBranch);

    if (shouldBeMain && Array.isArray(hospital.branches)) {
      hospital.branches.forEach((b: any) => {
        b.isMainBranch = false;
      });
    }

    const doctorList = Array.isArray(doctors)
      ? doctors.map((d: any) => typeof d === "string" ? { name: d.trim() } : d)
      : (doctorName ? [{ name: doctorName.trim(), isPrimary: true }] : []);
    const effectiveDoctorName = doctorName?.trim() || doctorList.map((d: any) => d.name).join(", ");

    const newBranch: any = {
      branchName: branchName.trim(),
      branchCode: branchCode.trim(),
      registrationNumber: registrationNumber.trim() || hospital.registrationNumber || "",
      gstNumber: gstNumber.trim() || hospital.gstNumber || "",
      contactPerson: contactPerson.trim() || hospital.contactPerson || "",
      email: email.trim() || hospital.email || "",
      mobileNumber: mobileNumber.trim() || hospital.mobileNumber || "",
      telephone: telephone.trim() || hospital.telephone || "",
      doctorName: effectiveDoctorName || hospital.doctorName || "",
      doctors: doctorList.length > 0 ? doctorList : (hospital.doctors || []),
      pickupLocation: pickupLocation.trim() || hospital.pickupLocation || "",
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim() || hospital.city || "",
      state: state.trim() || hospital.state || "",
      country: country.trim() || hospital.country || "India",
      pincode: pincode.trim() || hospital.pincode || "",
      isMainBranch: shouldBeMain,
      status: status || "ACTIVE",
      eggDonorDealPrice: Number(eggDonorDealPrice || hospital.eggDonorDealPrice || 65000),
      eggProfileDonorDealPrice: Number(eggProfileDonorDealPrice || hospital.eggProfileDonorDealPrice || 85000),
      spermDonorDealPrice: Number(spermDonorDealPrice || hospital.spermDonorDealPrice || 15000),
      spermProfileDonorDealPrice: Number(spermProfileDonorDealPrice || hospital.spermProfileDonorDealPrice || 25000),
      serviceCharge: Number(serviceCharge || hospital.serviceCharge || 5000),
      tdsPercentage: Number(tdsPercentage ?? (hospital.tdsPercentage ?? 2)),
      wantInvoice: wantInvoice !== undefined ? Boolean(wantInvoice) : Boolean(hospital.wantInvoice ?? true)
    };

    if (!Array.isArray(hospital.branches)) {
      hospital.branches = [];
    }
    hospital.branches.push(newBranch);
    await hospital.save();

    await createAuditLog(
      req,
      "Hospital Branch Added",
      "Hospital",
      hospital._id.toString(),
      session.user.name || session.user.email,
      null,
      newBranch
    );

    return NextResponse.json({
      success: true,
      branches: hospital.branches,
      message: "Branch added successfully."
    });
  } catch (error: any) {
    console.error("Error adding branch:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to add branch." }, { status: 500 });
  }
}

// PUT — Update an existing branch
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital not found." }, { status: 404 });
    }

    const { branchId, ...branchData } = body;
    if (!branchId) {
      return NextResponse.json({ success: false, error: "Branch ID is required." }, { status: 400 });
    }

    const branch = (hospital.branches as any).id
      ? (hospital.branches as any).id(branchId)
      : (hospital.branches as any[]).find((b: any) => b._id?.toString() === branchId);
    if (!branch) {
      return NextResponse.json({ success: false, error: "Branch not found." }, { status: 404 });
    }

    if (branchData.isMainBranch) {
      hospital.branches.forEach((b: any) => {
        if (b._id?.toString() !== branchId) {
          b.isMainBranch = false;
        }
      });
    }

    Object.assign(branch, branchData);
    await hospital.save();

    await createAuditLog(
      req,
      "Hospital Branch Updated",
      "Hospital",
      hospital._id.toString(),
      session.user.name || session.user.email,
      null,
      branch
    );

    return NextResponse.json({
      success: true,
      branches: hospital.branches,
      message: "Branch updated successfully."
    });
  } catch (error: any) {
    console.error("Error updating branch:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update branch." }, { status: 500 });
  }
}

// DELETE — Remove a branch
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json({ success: false, error: "branchId is required." }, { status: 400 });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital not found." }, { status: 404 });
    }

    const wasMain = hospital.branches.some((b: any) => b._id?.toString() === branchId && b.isMainBranch);
    hospital.branches = hospital.branches.filter((b: any) => b._id?.toString() !== branchId);
    if (wasMain && hospital.branches.length > 0) {
      hospital.branches[0].isMainBranch = true;
    }
    await hospital.save();

    await createAuditLog(
      req,
      "Hospital Branch Deleted",
      "Hospital",
      hospital._id.toString(),
      session.user.name || session.user.email,
      { branchId },
      null
    );

    return NextResponse.json({
      success: true,
      branches: hospital.branches,
      message: "Branch deleted successfully."
    });
  } catch (error: any) {
    console.error("Error deleting branch:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete branch." }, { status: 500 });
  }
}
