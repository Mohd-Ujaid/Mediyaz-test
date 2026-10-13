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
    const canViewRegistrations =
      isFullAdmin ||
      permissions.includes("VIEW_REGISTRATIONS") ||
      permissions.includes("VIEW_REG_CHECKS") ||
      ["STAFF", "DOCTOR"].includes(role);

    if (!isFullAdmin && !permissions.includes("VIEW_HOSPITALS") && !canViewRegistrations) {
      return NextResponse.json({ success: false, error: "Forbidden. Access Denied." }, { status: 403 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";
    const status = searchParams.get("status") || "";
    const hospitalType = searchParams.get("type") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    const query: any = {};

    // Soft delete filter: default filter out ARCHIVED unless specifically queried
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: "ARCHIVED" };
    }

    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    if (city) query.city = { $regex: escapeRegex(city), $options: "i" };
    if (state) query.state = { $regex: escapeRegex(state), $options: "i" };
    if (hospitalType) query.hospitalType = hospitalType;
    // if (organ) query.organTypesSupported = organ;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        query.createdAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.createdAt.$lte = e;
      }
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { code: { $regex: safeSearch, $options: "i" } },
        { contactPerson: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const total = await Hospital.countDocuments(query);
    const rawHospitals = await Hospital.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // RBAC Sanitization: Allow registration review staff to access clinic deal prices
    const canSeeDealPrices = isFullAdmin || canViewRegistrations;
    const hospitals = rawHospitals.map(h => {
      const obj: any = h.toObject();
      if (!canSeeDealPrices) {
        delete obj.donorDealPrice;
        delete obj.profiledonorDealPrice;
        delete obj.eggDonorDealPrice;
        delete obj.eggProfileDonorDealPrice;
        delete obj.spermDonorDealPrice;
        delete obj.spermProfileDonorDealPrice;
        delete obj.currency;
      }
      if (!isFullAdmin) {
        delete obj.pricingHistory;
      }
      return obj;
    });

    const [totalAll, totalActive, totalInactive, totalArchived] = await Promise.all([
      Hospital.countDocuments({ status: { $ne: "ARCHIVED" } }),
      Hospital.countDocuments({ status: "ACTIVE" }),
      Hospital.countDocuments({ status: "INACTIVE" }),
      Hospital.countDocuments({ status: "ARCHIVED" }),
    ]);

    return NextResponse.json({
      success: true,
      hospitals,
      stats: {
        total: totalAll,
        active: totalActive,
        inactive: totalInactive,
        archived: totalArchived,
      },
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
      registrationNumber,
      gstNumber,
      doctorName = "",
      pickupLocation = "",
      wantInvoice = true,
      tdsPercentage = 2,
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
      branches = [],
      doctors = [],
      eggDonorDealPrice = 65000,
      eggProfileDonorDealPrice = 85000,
      spermDonorDealPrice = 15000,
      spermProfileDonorDealPrice = 25000,
      serviceCharge = 5000,
      donorDealPrice,
      profiledonorDealPrice,
      currency = "INR",
      status = "ACTIVE"
    } = body;

    // Validate inputs - Clinic Entity
    if (!name || !shortName || !hospitalType) {
      return NextResponse.json(
        { success: false, error: "Hospital Name, Short Name, and Hospital Type are required." },
        { status: 400 }
      );
    }

    const primaryBranch = Array.isArray(branches) && branches.length > 0
      ? (branches.find((b: any) => b.isMainBranch) || branches[0])
      : null;

    const finalRegNo = registrationNumber || primaryBranch?.registrationNumber || "";
    const finalGst = gstNumber || primaryBranch?.gstNumber || "";
    const finalDoctor = doctorName || primaryBranch?.doctorName || "";
    const finalPickup = pickupLocation || primaryBranch?.pickupLocation || "";
    const finalContactPerson = contactPerson || primaryBranch?.contactPerson || "";
    const finalEmail = email || primaryBranch?.email || "";
    const finalMobile = mobileNumber || primaryBranch?.mobileNumber || "";
    const finalTelephone = telephone || primaryBranch?.telephone || "";
    const finalAddress1 = addressLine1 || primaryBranch?.addressLine1 || "";
    const finalAddress2 = addressLine2 || primaryBranch?.addressLine2 || "";
    const finalCity = city || primaryBranch?.city || "";
    const finalState = state || primaryBranch?.state || "";
    const finalCountry = country || primaryBranch?.country || "India";
    const finalPincode = pincode || primaryBranch?.pincode || "";

    const finalEggNormal = Number(eggDonorDealPrice ?? (donorDealPrice ?? 65000));
    const finalEggProfile = Number(eggProfileDonorDealPrice ?? (profiledonorDealPrice ?? 85000));
    const finalSpermNormal = Number(spermDonorDealPrice ?? 15000);
    const finalSpermProfile = Number(spermProfileDonorDealPrice ?? 25000);
    const finalServiceCharge = Number(serviceCharge ?? 5000);
    const finalTdsPct = Number(tdsPercentage ?? 2);

    const address = [finalAddress1, finalAddress2, finalCity, finalState, finalPincode, finalCountry].filter(Boolean).join(", ");
    const contactInfo = finalContactPerson ? `${finalContactPerson} (${finalEmail || ""}, Mob: ${finalMobile || ""})` : (finalEmail || finalMobile || "");

    // Set pricing history log initial snapshot
    const initialPricingLog = {
      donorDealPrice: finalEggNormal,
      profiledonorDealPrice: finalEggProfile,
      eggDonorDealPrice: finalEggNormal,
      eggProfileDonorDealPrice: finalEggProfile,
      spermDonorDealPrice: finalSpermNormal,
      spermProfileDonorDealPrice: finalSpermProfile,
      serviceCharge: finalServiceCharge,
      currency,
      changedBy: session.user.name || session.user.email,
      changedAt: new Date()
    };

    const hospital = await Hospital.create({
      name,
      address,
      contactInfo,
      shortName,
      registrationNumber: finalRegNo,
      gstNumber: finalGst,
      doctorName: finalDoctor,
      pickupLocation: finalPickup,
      wantInvoice: wantInvoice !== false,
      tdsPercentage: finalTdsPct,
      contactPerson: finalContactPerson,
      email: finalEmail,
      mobileNumber: finalMobile,
      telephone: finalTelephone,
      emergencyNumber,
      addressLine1: finalAddress1,
      addressLine2: finalAddress2,
      city: finalCity,
      state: finalState,
      country: finalCountry,
      pincode: finalPincode,
      hospitalType,
      specializations: specializations || [],
      branches: Array.isArray(branches) ? branches : [],
      doctors: Array.isArray(doctors) ? doctors : [],
      eggDonorDealPrice: finalEggNormal,
      eggProfileDonorDealPrice: finalEggProfile,
      spermDonorDealPrice: finalSpermNormal,
      spermProfileDonorDealPrice: finalSpermProfile,
      serviceCharge: finalServiceCharge,
      donorDealPrice: finalEggNormal,
      profiledonorDealPrice: finalEggProfile,
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
