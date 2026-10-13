import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/features/audit-logs/services/audit-log.service";

// PUT — Update a hospital/clinic (Admin Only)
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

    const hospital: any = await Hospital.findById(id);
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital/clinic not found." }, { status: 404 });
    }

    const oldValues = hospital.toObject();

    // Fields to update
    const {
      name,
      shortName,
      registrationNumber,
      gstNumber,
      doctorName,
      pickupLocation,
      wantInvoice,
      tdsPercentage,
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
      branches,
      doctors,
      eggDonorDealPrice,
      eggProfileDonorDealPrice,
      spermDonorDealPrice,
      spermProfileDonorDealPrice,
      donorDealPrice,
      profiledonorDealPrice,
      serviceCharge,
      currency,
      status
    } = body;

    // Check if any pricing parameters changed
    const effectiveEggNormal = eggDonorDealPrice !== undefined ? Number(eggDonorDealPrice) : donorDealPrice !== undefined ? Number(donorDealPrice) : undefined;
    const effectiveEggProfile = eggProfileDonorDealPrice !== undefined ? Number(eggProfileDonorDealPrice) : profiledonorDealPrice !== undefined ? Number(profiledonorDealPrice) : undefined;

    const pricingChanged =
      (effectiveEggNormal !== undefined && effectiveEggNormal !== hospital.eggDonorDealPrice) ||
      (effectiveEggProfile !== undefined && effectiveEggProfile !== hospital.eggProfileDonorDealPrice) ||
      (spermDonorDealPrice !== undefined && Number(spermDonorDealPrice) !== hospital.spermDonorDealPrice) ||
      (spermProfileDonorDealPrice !== undefined && Number(spermProfileDonorDealPrice) !== hospital.spermProfileDonorDealPrice) ||
      (serviceCharge !== undefined && Number(serviceCharge) !== hospital.serviceCharge) ||
      (currency !== undefined && currency !== hospital.currency);

    // If pricing changed, add a pricing history log snapshot
    if (pricingChanged) {
      const newPricingSnapshot = {
        donorDealPrice: effectiveEggNormal !== undefined ? effectiveEggNormal : hospital.eggDonorDealPrice,
        profiledonorDealPrice: effectiveEggProfile !== undefined ? effectiveEggProfile : hospital.eggProfileDonorDealPrice,
        eggDonorDealPrice: effectiveEggNormal !== undefined ? effectiveEggNormal : hospital.eggDonorDealPrice,
        eggProfileDonorDealPrice: effectiveEggProfile !== undefined ? effectiveEggProfile : hospital.eggProfileDonorDealPrice,
        spermDonorDealPrice: spermDonorDealPrice !== undefined ? Number(spermDonorDealPrice) : hospital.spermDonorDealPrice,
        spermProfileDonorDealPrice: spermProfileDonorDealPrice !== undefined ? Number(spermProfileDonorDealPrice) : hospital.spermProfileDonorDealPrice,
        serviceCharge: serviceCharge !== undefined ? Number(serviceCharge) : hospital.serviceCharge,
        currency: currency !== undefined ? currency : hospital.currency,
        changedBy: session.user.name || session.user.email,
        changedAt: new Date()
      };
      hospital.pricingHistory.push(newPricingSnapshot);
    }

    // Apply updates
    if (name !== undefined) hospital.name = name;
    if (shortName !== undefined) hospital.shortName = shortName;
    if (registrationNumber !== undefined) hospital.registrationNumber = registrationNumber;
    if (gstNumber !== undefined) hospital.gstNumber = gstNumber;
    if (doctorName !== undefined) hospital.doctorName = doctorName;
    if (pickupLocation !== undefined) hospital.pickupLocation = pickupLocation;
    if (wantInvoice !== undefined) hospital.wantInvoice = Boolean(wantInvoice);
    if (tdsPercentage !== undefined) hospital.tdsPercentage = Number(tdsPercentage);
    if (contactPerson !== undefined) hospital.contactPerson = contactPerson;
    if (email !== undefined) hospital.email = email;
    if (mobileNumber !== undefined) hospital.mobileNumber = mobileNumber;
    if (telephone !== undefined) hospital.telephone = telephone;
    if (emergencyNumber !== undefined) hospital.emergencyNumber = emergencyNumber;
    if (addressLine1 !== undefined) hospital.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) hospital.addressLine2 = addressLine2;
    if (city !== undefined) hospital.city = city;
    if (state !== undefined) hospital.state = state;
    if (country !== undefined) hospital.country = country;
    if (pincode !== undefined) hospital.pincode = pincode;
    if (hospitalType !== undefined) hospital.hospitalType = hospitalType;
    if (specializations !== undefined) hospital.specializations = specializations;
    if (branches !== undefined) hospital.branches = Array.isArray(branches) ? branches : [];
    if (doctors !== undefined) hospital.doctors = Array.isArray(doctors) ? doctors : [];

    if (effectiveEggNormal !== undefined) {
      hospital.eggDonorDealPrice = effectiveEggNormal;
      hospital.donorDealPrice = effectiveEggNormal;
    }
    if (effectiveEggProfile !== undefined) {
      hospital.eggProfileDonorDealPrice = effectiveEggProfile;
      hospital.profiledonorDealPrice = effectiveEggProfile;
    }
    if (spermDonorDealPrice !== undefined) hospital.spermDonorDealPrice = Number(spermDonorDealPrice);
    if (spermProfileDonorDealPrice !== undefined) hospital.spermProfileDonorDealPrice = Number(spermProfileDonorDealPrice);
    if (serviceCharge !== undefined) hospital.serviceCharge = Number(serviceCharge);
    if (currency !== undefined) hospital.currency = currency;
    
    if (status !== undefined) hospital.status = status;

    // Explicitly compute and set address and contactInfo to bypass caching validation issues
    const finalAddressLine1 = addressLine1 !== undefined ? addressLine1 : hospital.addressLine1;
    const finalAddressLine2 = addressLine2 !== undefined ? addressLine2 : hospital.addressLine2;
    const finalCity = city !== undefined ? city : hospital.city;
    const finalState = state !== undefined ? state : hospital.state;
    const finalPincode = pincode !== undefined ? pincode : hospital.pincode;
    const finalCountry = country !== undefined ? country : hospital.country;
    
    hospital.address = `${finalAddressLine1 || ""}, ${finalAddressLine2 || ""}, ${finalCity || ""}, ${finalState || ""} - ${finalPincode || ""}, ${finalCountry || "India"}`.replace(/^[,\s]+|[,\s]+$/g, "").replace(/\s*,\s*,/g, ",");
    
    const finalContactPerson = contactPerson !== undefined ? contactPerson : hospital.contactPerson;
    const finalEmail = email !== undefined ? email : hospital.email;
    const finalMobileNumber = mobileNumber !== undefined ? mobileNumber : hospital.mobileNumber;
    
    hospital.contactInfo = `${finalContactPerson || ""} (${finalEmail || ""}, Mob: ${finalMobileNumber || ""})`;

    await hospital.save();

    // Log administrative action in audit trail
    await createAuditLog(
      req,
      "Hospital Updated",
      "Hospital",
      hospital._id.toString(),
      session.user.name || session.user.email,
      oldValues,
      hospital.toObject()
    );

    return NextResponse.json({ success: true, hospital });
  } catch (error: any) {
    console.error("Update hospital error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update hospital." },
      { status: 500 }
    );
  }
}

// DELETE — Soft Delete a hospital/clinic (Admin Only)
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

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital/clinic not found." }, { status: 404 });
    }

    const oldValues = hospital.toObject();

    // Perform soft delete by setting status to ARCHIVED
    hospital.status = "ARCHIVED";
    await hospital.save();

    // Log soft deletion to Audit trail
    await createAuditLog(
      req,
      "Hospital Soft Deleted",
      "Hospital",
      hospital._id.toString(),
      session.user.name || session.user.email,
      oldValues,
      hospital.toObject()
    );

    return NextResponse.json({ success: true, message: "Hospital soft deleted successfully." });
  } catch (error: any) {
    console.error("Delete hospital error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete hospital." },
      { status: 500 }
    );
  }
}
