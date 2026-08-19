import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorInquiry } from "@/models/DonorInquiry";
import { DonorRegistration } from "@/models/DonorRegistration";
import { triggerWorkflowNotifications } from "@/features/notifications/services/workflow-notification.service";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

function generateRegistrationId(donorType: string): string {
  const prefix = donorType === "egg" ? "MED-ED" : "MED-SD";
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ts = Date.now().toString().slice(-4);
  return `${prefix}-${year}-${rand}${ts}`;
}

// GET single inquiry
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const inquiry = await DonorInquiry.findById(id);

    if (!inquiry) {
      return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    }

    // Authorization Check: Owner or Admin/Staff
    const role = (session.user as any).role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
    const isOwner = (session.user.email && inquiry.emailAddress && session.user.email.toLowerCase() === inquiry.emailAddress.toLowerCase()) ||
                    ((session.user as any).phone && inquiry.mobileNumber && (session.user as any).phone === inquiry.mobileNumber);

    if (!isAdminOrStaff && !isOwner) {
      return NextResponse.json({ success: false, error: "Forbidden: Access Denied." }, { status: 403 });
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH — Update inquiry status or notes (Admin/Staff Only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    // Role check: Admin/Staff only
    const role = (session.user as any).role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
    if (!isAdminOrStaff) {
      return NextResponse.json({ success: false, error: "Forbidden: Administrative access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status, adminNotes, consultationDateTime } = body;

    const inquiry = await DonorInquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    }

    const updates: any = {};
    if (status) {
      updates.status = status;
      inquiry.statusHistory.push({
        status,
        notes: status === "Consultation Scheduled" && consultationDateTime 
          ? `Scheduled for ${consultationDateTime}` 
          : `Status changed to ${status}`,
        updatedBy: session.user.name || session.user.email,
        updatedAt: new Date(),
      });
      updates.statusHistory = inquiry.statusHistory;
    }

    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }

    const updated = await DonorInquiry.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    // Trigger workflow notification for specific status updates
    if (status === "Consultation Scheduled" && consultationDateTime) {
      try {
        await triggerWorkflowNotifications("consultation_scheduled", inquiry.fullName, inquiry.mobileNumber, {
          dateTime: consultationDateTime,
          email: inquiry.emailAddress,
        });
      } catch (notifErr) {
        console.error("Mock notification error:", notifErr);
      }
    }

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error: any) {
    console.error("Update inquiry error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — Convert inquiry to full registration (Admin/Staff Only)
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

    // Role check: Admin/Staff only
    const role = (session.user as any).role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
    if (!isAdminOrStaff) {
      return NextResponse.json({ success: false, error: "Forbidden: Administrative access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const inquiry = await DonorInquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    }

    if (inquiry.registrationId) {
      return NextResponse.json({
        success: true,
        message: "Inquiry already converted to registration.",
        registrationId: inquiry.registrationId,
      });
    }

    const registrationId = generateRegistrationId(inquiry.donationInterest);

    // Create Draft Donor Registration
    const registration = await DonorRegistration.create({
      registrationId,
      donorType: inquiry.donationInterest,
      status: "DRAFT",
      currentStep: 1,
      personalInfo: {
        fullName: inquiry.fullName,
        fatherName: "",
        motherName: "",
        gender: inquiry.gender,
        dateOfBirth: inquiry.dateOfBirth,
        age: inquiry.age,
        maritalStatus: "Single",
        bloodGroup: "O+",
        nationality: "Indian",
        education: "",
        occupation: "",
        height: "",
        weight: "",
        eyeColor: "",
        hairColor: "",
        complexion: "",
        aadhaarNumber: "",
        panNumber: "",
      },
      contactInfo: {
        mobileNumber: inquiry.mobileNumber,
        alternateMobile: "",
        emailAddress: inquiry.emailAddress,
        currentAddress: inquiry.city || "",
        permanentAddress: inquiry.city || "",
        state: inquiry.state || "",
        district: "",
        city: inquiry.city || "",
        pincode: "",
      },
    });

    // Update Inquiry status to Registered & save registrationId
    inquiry.status = "Registered";
    inquiry.registrationId = registrationId;
    inquiry.statusHistory.push({
      status: "Registered",
      notes: `Converted to full registration: ${registrationId}`,
      updatedBy: session.user.name || session.user.email,
      updatedAt: new Date(),
    });
    await inquiry.save();

    // Trigger email containing the Registration ID to the user's email
    try {
      const { sendRegistrationApprovedCodeEmail } = await import("@/features/email/services/email.service");
      await sendRegistrationApprovedCodeEmail(
        inquiry.emailAddress,
        inquiry.fullName,
        registrationId,
        inquiry.donationInterest
      );
    } catch (emailErr) {
      console.error("Failed to send registration ID email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully converted inquiry to donor registration draft!",
      registrationId,
      registration,
    });
  } catch (error: any) {
    console.error("Convert inquiry error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — Delete inquiry (Admin/Staff Only)
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

    // Role check: Admin/Staff only
    const role = (session.user as any).role;
    const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
    if (!isAdminOrStaff) {
      return NextResponse.json({ success: false, error: "Forbidden: Administrative access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const result = await DonorInquiry.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Inquiry deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
