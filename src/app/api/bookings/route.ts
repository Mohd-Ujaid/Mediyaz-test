import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ConsultationRequest } from "@/models/ConsultationRequest";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { sendConsultationConfirmationUserEmail, sendConsultationNotificationAdminEmail } from "@/features/email/services/email.service";

function generateRefId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CN-${dateStr}-${rand}`;
}

// GET consultations. Guests can query by referenceId (returns sanitized data). Admins get all.
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const referenceId = searchParams.get("referenceId");

    if (referenceId) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(referenceId);
      const query = isObjectId ? { _id: referenceId } : { referenceId };
      const consultation = await ConsultationRequest.findOne(query);
      if (!consultation) {
        return NextResponse.json({ success: false, error: "Consultation not found." }, { status: 404 });
      }

      // Check if user is Admin/Staff or Owner
      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      const role = session?.user?.role || "";
      const isAdminOrStaff = session && ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
      const isOwner = session && (
        (session.user.email && consultation.personalDetails?.email && session.user.email.toLowerCase() === consultation.personalDetails.email.toLowerCase()) ||
        ((session.user as any).phone && consultation.personalDetails?.phone && (session.user as any).phone === consultation.personalDetails.phone)
      );

      if (isAdminOrStaff || isOwner) {
        return NextResponse.json({ success: true, consultation });
      }

      // Guest: return sanitized response to prevent IDOR leaks
      const sanitized = {
        referenceId: consultation.referenceId,
        status: consultation.status,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
        adminNotes: consultation.adminNotes,
        personalDetails: {
          fullName: consultation.personalDetails?.fullName ? consultation.personalDetails.fullName.replace(/(?<=.).(?=.)/g, "*") : "Patient",
        },
        medicalInfo: {
          preferredTreatment: consultation.medicalInfo?.preferredTreatment || "General Consultation",
        },
        appointmentDetails: {
          consultationType: consultation.appointmentDetails?.consultationType || "General Consultation",
          preferredDate: consultation.appointmentDetails?.preferredDate,
          preferredTime: consultation.appointmentDetails?.preferredTime,
        }
      };

      return NextResponse.json({ success: true, booking: sanitized, consultation: sanitized });
    }

    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    const userRole = (session?.user as any)?.role;
    const permissions = (session?.user as any)?.permissions || [];
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

    if (!session || (!isAdmin && !permissions.includes("VIEW_BOOKINGS"))) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const total = await ConsultationRequest.countDocuments({});
    const consultations = await ConsultationRequest.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      success: true, 
      consultations,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Public submission of a consultation request
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { personalDetails, medicalInfo, appointmentDetails } = body;

    if (!personalDetails?.fullName || !personalDetails?.email || !personalDetails?.phone) {
      return NextResponse.json({ success: false, error: "Name, email, and phone are required." }, { status: 400 });
    }

    const referenceId = generateRefId();

    const consultation = await ConsultationRequest.create({
      referenceId,
      personalDetails,
      medicalInfo: medicalInfo || {},
      appointmentDetails: appointmentDetails || {},
      status: "NEW"
    });

    // Create Admin Notification
    try {
      const { Notification } = await import("@/models/Notification");
      const notif = await Notification.create({
        title: "New Booking Request",
        message: `${personalDetails.fullName} requested a ${appointmentDetails?.consultationType || "consultation"}.`,
        type: "BOOKING",
        referenceId: consultation._id.toString()
      });
      const { pusherServer } = await import("@/lib/pusher");
      await pusherServer.trigger("notifications", "new_notification", notif);
    } catch (notifErr) {
      console.error("Failed to create in-app notification:", notifErr);
    }

    // Trigger consultation email notifications (confirmation to patient, alert to admin)
    try {
      await sendConsultationConfirmationUserEmail(
        personalDetails.email,
        personalDetails.fullName,
        referenceId,
        body
      );
      await sendConsultationNotificationAdminEmail(consultation);
    } catch (emailErr) {
      console.error("Failed to send consultation notifications:", emailErr);
    }

    return NextResponse.json({ success: true, referenceId, consultation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update status/notes (Admin Only)
export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Consultation ID is required." }, { status: 400 });
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;

    const consultation = await ConsultationRequest.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!consultation) {
      return NextResponse.json({ success: false, error: "Consultation not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, consultation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
