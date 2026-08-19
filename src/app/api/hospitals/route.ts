import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/features/audit-logs/services/audit-log.service";

// GET — List hospitals with pagination, filtering, search, and RBAC sanitization
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const role = (session.user as any).role;
    const permissions = (session.user as any).permissions || [];
    const isFullAdmin = ["ADMIN", "SUPER_ADMIN"].includes(role);

    if (!isFullAdmin && !permissions.includes("VIEW_HOSPITALS")) {
      return NextResponse.json({ success: false, error: "Forbidden. Access Denied." }, { status: 403 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";
    const status = searchParams.get("status") || "";
    const hospitalType = searchParams.get("type") || "";
    const organ = searchParams.get("organ") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    const query: any = {};

    // Soft delete filter: default filter out ARCHIVED unless specifically queried
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: "ARCHIVED" };
    }

    if (city) query.city = { $regex: city, $options: "i" };
    if (state) query.state = { $regex: state, $options: "i" };
    if (hospitalType) query.hospitalType = hospitalType;
    if (organ) query.organTypesSupported = organ;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Hospital.countDocuments(query);
    const rawHospitals = await Hospital.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // RBAC Sanitization: Omit pricing fields if the user is not ADMIN or SUPER_ADMIN
    const hospitals = rawHospitals.map(h => {
      const obj: any = h.toObject();
      if (!isFullAdmin) {
        delete obj.donorDealPrice;
        delete obj.serviceCharge;
        delete obj.processingFee;
        delete obj.registrationFee;
        delete obj.commission;
        delete obj.additionalCharges;
        delete obj.currency;
        delete obj.pricingHistory;
      }
      return obj;
    });

    return NextResponse.json({
      success: true,
      hospitals,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    console.error("Fetch hospitals error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch hospitals." },
      { status: 500 }
    );
  }
}

// POST — Create a new hospital/clinic (Admin Only)
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      name,
      shortName,
      code,
      registrationNumber,
      licenseNumber,
      gstNumber,
      panNumber,
      contactPerson,
      email,
      mobileNumber,
      telephone,
      emergencyNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      pincode,
      hospitalType,
      specializations,
      organTypesSupported,
      icuAvailability,
      transplantLicenseNumber,
      donorDealPrice = 0,
      serviceCharge = 0,
      processingFee = 0,
      registrationFee = 0,
      commission = 0,
      additionalCharges = 0,
      currency = "INR",
      status = "ACTIVE"
    } = body;

    // Validate inputs
    if (!name || !shortName || !code || !registrationNumber || !licenseNumber || !contactPerson || !email || !mobileNumber || !addressLine1 || !city || !state || !pincode || !hospitalType || !transplantLicenseNumber) {
      return NextResponse.json(
        { success: false, error: "All required basic, contact, address, medical, and status configuration fields must be provided." },
        { status: 400 }
      );
    }

    const address = `${addressLine1 || ""}, ${addressLine2 || ""}, ${city || ""}, ${state || ""} - ${pincode || ""}, ${country || "India"}`.replace(/^[,\s]+|[,\s]+$/g, "").replace(/\s*,\s*,/g, ",");
    const contactInfo = `${contactPerson || ""} (${email || ""}, Mob: ${mobileNumber || ""})`;

    // Set pricing history log initial snapshot
    const initialPricingLog = {
      donorDealPrice,
      serviceCharge,
      processingFee,
      registrationFee,
      commission,
      additionalCharges,
      currency,
      changedBy: session.user.name || session.user.email,
      changedAt: new Date()
    };

    const hospital = await Hospital.create({
      name,
      address,
      contactInfo,
      shortName,
      code,
      registrationNumber,
      licenseNumber,
      gstNumber,
      panNumber,
      contactPerson,
      email,
      mobileNumber,
      telephone,
      emergencyNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      country: country || "India",
      pincode,
      hospitalType,
      specializations: specializations || [],
      organTypesSupported: organTypesSupported || [],
      icuAvailability: !!icuAvailability,
      transplantLicenseNumber,
      donorDealPrice,
      serviceCharge,
      processingFee,
      registrationFee,
      commission,
      additionalCharges,
      currency,
      status,
      pricingHistory: [initialPricingLog]
    });

    // Write audit log
    await createAuditLog(
      req,
      "Hospital Created",
      "Hospital",
      hospital._id.toString(),
      session.user.name || session.user.email,
      null,
      hospital.toObject()
    );

    return NextResponse.json({ success: true, hospital });
  } catch (error: any) {
    console.error("Create hospital error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create hospital." },
      { status: 500 }
    );
  }
}
