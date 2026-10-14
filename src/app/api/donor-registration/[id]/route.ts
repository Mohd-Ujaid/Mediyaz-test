import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Notification } from "@/models/Notification";
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

async function checkAccess(registration: any, reqHeaders: Headers) {
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) {
    return {
      hasAccess: false,
      response: NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 }),
    };
  }

  const role = (session.user as any).role;
  const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
  
  const isOwner = 
    (session.user.email && registration.contactInfo?.emailAddress && session.user.email.toLowerCase() === registration.contactInfo.emailAddress.toLowerCase()) ||
    ((session.user as any).phone && registration.contactInfo?.mobileNumber && (session.user as any).phone === registration.contactInfo.mobileNumber);

  if (!isAdminOrStaff && !isOwner) {
    return { hasAccess: false, response: NextResponse.json({ success: false, error: "Forbidden: Access Denied." }, { status: 403 }) };
  }

  return { hasAccess: true, session };
}

// GET single registration
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { doc: registration } = await findRegistration(id);

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found." },
        { status: 404 }
      );
    }

    const access = await checkAccess(registration, await headers());
    if (!access.hasAccess) return access.response;

    return NextResponse.json({ success: true, registration });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH — Update specific step data (auto-save)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const { doc: registration, model } = await findRegistration(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found." },
        { status: 404 }
      );
    }

    const access = await checkAccess(registration, await headers());
    if (!access.hasAccess) return access.response;

    const update: any = {};

    const userAllowedKeys = [
      "personalInfo", "contactInfo", "medicalInfo", "donorInfo",
      "labReports", "documents", "emergencyContact",
      "consent", "referral", "currentStep", "semenAnalysisDetails",
    ];

    const adminOnlyKeys = ["status", "adminNotes", "reviewedBy", "reviewedAt", "assignedHospital", "assignedBy", "assignedAt", "affiliatedBy", "updatedBy", "donorId"];

    const session = access.session;
    const userRole = (session?.user as any)?.role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole);

    if (!isAdminOrStaff && registration.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Submitted registrations are locked and cannot be modified." },
        { status: 400 }
      );
    }

    const allowedKeys = isAdminOrStaff
      ? [...userAllowedKeys, ...adminOnlyKeys]
      : userAllowedKeys;

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        if (typeof body[key] === "object" && !Array.isArray(body[key]) && body[key] !== null) {
          for (const [subKey, subVal] of Object.entries(body[key])) {
            update[`${key}.${subKey}`] = subVal;
          }
        } else {
          update[key] = body[key];
        }
      }
    }

    const updatedRegistration = await model.findOneAndUpdate(
      { registrationId: id },
      { $set: update },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Registration updated successfully.",
      registration: updatedRegistration,
    });
  } catch (error: any) {
    console.error("Update donor registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT — Final submission
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const { doc: registration } = await findRegistration(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found." },
        { status: 404 }
      );
    }

    const access = await checkAccess(registration, await headers());
    if (!access.hasAccess) return access.response;

    const session = access.session;
    const userRole = (session?.user as any)?.role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole);

    if (!isAdminOrStaff && registration.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Registration is already submitted and locked." },
        { status: 400 }
      );
    }

    const allowedKeys = [
      "personalInfo", "contactInfo", "medicalInfo", "donorInfo",
      "labReports", "documents", "emergencyContact", "consent", "referral", "semenAnalysisDetails"
    ];

    for (const key of allowedKeys) {
      if (body[key]) {
        (registration as any)[key] = { ...(registration as any)[key]?.toObject?.() || (registration as any)[key], ...body[key] };
      }
    }

    registration.status = "SUBMITTED";
    registration.currentStep = 3;
    await registration.save();

    const notif = await Notification.create({
      title: "New Donor Registration",
      message: `A new ${registration.donorType} donor registration (${registration.registrationId}) has been submitted.`,
      type: "REGISTRATION",
      referenceId: registration.registrationId,
    });

    try {
      const { pusherServer } = await import("@/lib/pusher");
      await pusherServer.trigger("notifications", "new_notification", notif);
    } catch (pushErr) {
      console.error("Failed to push notification via Pusher:", pushErr);
    }

    if (body.referral && body.referral.sourceReferralType) {
      const { 
        sourceReferralType, 
        referrerName, 
        patientOrDonorId, 
        mobileNumber, 
        relationship, 
        clinicName, 
        department, 
        employeeId, 
        otherSourceDetails 
      } = body.referral;
      
      let rewardEligible = false;
      let rewardAmount = 0;
      let rewardStatus: "Pending" | "Approved" | "Paid" | "Cancelled" = "Pending";
      
      if (["Existing Patient", "Existing Donor", "Staff Member"].includes(sourceReferralType)) {
        rewardEligible = true;
        rewardAmount = 5000;
        rewardStatus = "Pending";
      } else if (["Doctor / Clinic", "Friend / Family"].includes(sourceReferralType)) {
        rewardEligible = true;
        rewardAmount = 2500;
        rewardStatus = "Pending";
      } else {
        rewardEligible = false;
        rewardAmount = 0;
        rewardStatus = "Cancelled";
      }

      const Referral = (await import("@/models/Referral")).Referral;
      await Referral.findOneAndUpdate(
        { referredRegistrationId: id },
        {
          $set: {
            sourceReferralType,
            referrerName: referrerName || "Anonymous",
            patientOrDonorId,
            mobileNumber,
            relationship,
            clinicName,
            department,
            employeeId,
            otherSourceDetails,
            referredDonorName: body.personalInfo?.fullName || registration.personalInfo?.fullName || "Altruistic Donor",
            rewardEligible,
            rewardAmount,
            rewardStatus,
          }
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration submitted successfully!",
      registration,
    });
  } catch (error: any) {
    console.error("Submit donor registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE — Delete draft
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const { doc: registration, model } = await findRegistration(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found." },
        { status: 404 }
      );
    }

    const access = await checkAccess(registration, await headers());
    if (!access.hasAccess) return access.response;

    const session = access.session;
    const userRole = (session?.user as any)?.role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole);

    if (!isAdminOrStaff && registration.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Submitted registrations are permanent medical records and cannot be deleted." },
        { status: 400 }
      );
    }

    const result = await model.deleteOne({ registrationId: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Registration not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
