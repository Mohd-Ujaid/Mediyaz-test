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

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital/clinic not found." }, { status: 404 });
    }

    const oldValues = hospital.toObject();

    // Fields to update
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
      donorDealPrice,
      serviceCharge,
      processingFee,
      registrationFee,
      commission,
      additionalCharges,
      currency,
      status
    } = body;

    // Check if any pricing parameters changed
    const pricingChanged =
      (donorDealPrice !== undefined && donorDealPrice !== hospital.donorDealPrice) ||
      (serviceCharge !== undefined && serviceCharge !== hospital.serviceCharge) ||
      (processingFee !== undefined && processingFee !== hospital.processingFee) ||
      (registrationFee !== undefined && registrationFee !== hospital.registrationFee) ||
      (commission !== undefined && commission !== hospital.commission) ||
      (additionalCharges !== undefined && additionalCharges !== hospital.additionalCharges) ||
      (currency !== undefined && currency !== hospital.currency);

    // If pricing changed, add a pricing history log snapshot
    if (pricingChanged) {
      const newPricingSnapshot = {
        donorDealPrice: donorDealPrice !== undefined ? donorDealPrice : hospital.donorDealPrice,
        serviceCharge: serviceCharge !== undefined ? serviceCharge : hospital.serviceCharge,
        processingFee: processingFee !== undefined ? processingFee : hospital.processingFee,
        registrationFee: registrationFee !== undefined ? registrationFee : hospital.registrationFee,
        commission: commission !== undefined ? commission : hospital.commission,
        additionalCharges: additionalCharges !== undefined ? additionalCharges : hospital.additionalCharges,
        currency: currency !== undefined ? currency : hospital.currency,
        changedBy: session.user.name || session.user.email,
        changedAt: new Date()
      };
      hospital.pricingHistory.push(newPricingSnapshot);
    }

    // Apply updates
    if (name !== undefined) hospital.name = name;
    if (shortName !== undefined) hospital.shortName = shortName;
    if (code !== undefined) hospital.code = code;
    if (registrationNumber !== undefined) hospital.registrationNumber = registrationNumber;
    if (licenseNumber !== undefined) hospital.licenseNumber = licenseNumber;
    if (gstNumber !== undefined) hospital.gstNumber = gstNumber;
    if (panNumber !== undefined) hospital.panNumber = panNumber;
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
    if (organTypesSupported !== undefined) hospital.organTypesSupported = organTypesSupported;
    if (icuAvailability !== undefined) hospital.icuAvailability = icuAvailability;
    if (transplantLicenseNumber !== undefined) hospital.transplantLicenseNumber = transplantLicenseNumber;
    
    if (donorDealPrice !== undefined) hospital.donorDealPrice = donorDealPrice;
    if (serviceCharge !== undefined) hospital.serviceCharge = serviceCharge;
    if (processingFee !== undefined) hospital.processingFee = processingFee;
    if (registrationFee !== undefined) hospital.registrationFee = registrationFee;
    if (commission !== undefined) hospital.commission = commission;
    if (additionalCharges !== undefined) hospital.additionalCharges = additionalCharges;
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
