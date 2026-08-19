import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BloodRequest } from "@/models/BloodRequest";
import { BloodInventory } from "@/models/BloodInventory";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { User } from "@/models/User";

// GET blood requests
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const status = searchParams.get("status") || "";
    const urgency = searchParams.get("urgency") || "";

    const userRole = (session.user as any).role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole);

    const query: any = {};
    if (!isAdminOrStaff) {
      // Normal patients/recipients can only see their own blood requests
      query.user = session.user.id;
    }

    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;

    const requests = await BloodRequest.find(query)
      .populate("user", "name email phone role status")
      .sort({ createdAt: -1 });

    let filtered = requests;
    if (search) {
      const reg = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
      filtered = requests.filter(r => 
        reg.test((r.user as any)?.name || "") || 
        reg.test((r.user as any)?.email || "") ||
        reg.test(r.hospitalName) ||
        reg.test(r.bloodGroup)
      );
    }

    return NextResponse.json({ success: true, requests: filtered });

  } catch (error: any) {
    console.error("Fetch blood requests error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Submit blood request
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in to request blood." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { bloodGroup, units, hospitalName, contactPhone, urgency, requiredDate, notes } = body;

    if (!bloodGroup || !units || !hospitalName || !contactPhone || !requiredDate) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const request = await BloodRequest.create({
      user: session.user.id,
      bloodGroup,
      units: Number(units),
      hospitalName,
      contactPhone,
      urgency: urgency || "NORMAL",
      status: "PENDING",
      requiredDate: new Date(requiredDate),
      notes
    });

    return NextResponse.json({ success: true, message: "Blood request submitted successfully!", request });

  } catch (error: any) {
    console.error("Create blood request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update blood request (Admin/Staff Only)
export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized. Staff privileges required." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { requestId, status, urgency, hospitalName, contactPhone, notes, requiredDate } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Request ID is required." }, { status: 400 });
    }

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return NextResponse.json({ success: false, error: "Blood request not found." }, { status: 404 });
    }

    const oldStatus = bloodRequest.status;

    // Update fields
    if (status) bloodRequest.status = status;
    if (urgency) bloodRequest.urgency = urgency;
    if (hospitalName) bloodRequest.hospitalName = hospitalName;
    if (contactPhone) bloodRequest.contactPhone = contactPhone;
    if (notes) bloodRequest.notes = notes;
    if (requiredDate) bloodRequest.requiredDate = new Date(requiredDate);

    // If request transitions to APPROVED, check inventory and deduct units
    if (oldStatus !== "APPROVED" && status === "APPROVED") {
      const stock = await BloodInventory.findOne({ bloodGroup: bloodRequest.bloodGroup });
      const available = stock ? stock.unitsAvailable : 0;

      if (available < bloodRequest.units) {
        return NextResponse.json({
          success: false,
          error: `Insufficient stock of ${bloodRequest.bloodGroup} blood group. Currently available: ${available} units.`
        }, { status: 400 });
      }

      // Deduct from stock
      stock!.unitsAvailable -= bloodRequest.units;
      stock!.lastUpdated = new Date();
      await stock!.save();
    }

    await bloodRequest.save();

    return NextResponse.json({ success: true, message: "Blood request updated successfully!", request: bloodRequest });

  } catch (error: any) {
    console.error("Update blood request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove blood request (Admin/Staff Only)
export async function DELETE(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized. Staff privileges required." }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Request ID is required." }, { status: 400 });
    }

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return NextResponse.json({ success: false, error: "Blood request not found." }, { status: 404 });
    }

    // If restoring units from an approved request that is deleted
    if (bloodRequest.status === "APPROVED") {
      await BloodInventory.findOneAndUpdate(
        { bloodGroup: bloodRequest.bloodGroup },
        { $inc: { unitsAvailable: bloodRequest.units } }
      );
    }

    await BloodRequest.findByIdAndDelete(requestId);
    return NextResponse.json({ success: true, message: "Blood request deleted." });

  } catch (error: any) {
    console.error("Delete blood request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
