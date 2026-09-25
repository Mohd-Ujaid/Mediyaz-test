import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Appointment } from "@/models/Appointment";
import { User, UserRole } from "@/models/User";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { sendAppointmentConfirmationUserEmail, sendAppointmentNotificationAdminEmail } from "@/features/email/services/email.service";

// GET appointments (Restricted to Admin, Staff, Doctor)
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    await connectToDatabase();
    const userRole = (session.user as any)?.role;
    const isStaff = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(userRole);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (!isStaff) {
      query.$or = [
        { user: session.user.id },
        { email: session.user.email }
      ];
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate("user", "name email phone role status")
      .populate("doctor", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      appointments,
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

// POST: Book an appointment
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, phone, date, time, notes, service } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, error: "Name, email, and phone are required." }, { status: 400 });
    }

    // Authenticate user or handle guest booking securely
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    let patient;

    if (session) {
      patient = await User.findById(session.user.id);
    } else {
      // Prevent unauthenticated guest from hijacking an existing user's email
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: "An account with this email already exists. Please sign in to book your appointment."
        }, { status: 400 });
      }

      patient = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        role: UserRole.RECIPIENT,
        status: "ACTIVE"
      });
    }

    if (!patient) {
      return NextResponse.json({ success: false, error: "Failed to resolve or create patient record." }, { status: 500 });
    }

    // Find doctor User or use lead doctor
    let doctor = await User.findOne({ name: { $regex: body.doctor || "", $options: "i" }, role: UserRole.DOCTOR });
    if (!doctor) {
      doctor = await User.findOne({ role: UserRole.DOCTOR });
    }

    if (!doctor) {
      return NextResponse.json({ success: false, error: "No active doctor found." }, { status: 400 });
    }

    // Create Appointment
    const appointment = await Appointment.create({
      user: patient._id,
      doctor: doctor._id,
      date: new Date(date || Date.now()),
      time: time || "10:30 AM",
      notes: notes || service || "Clinical Consultation",
      status: "SCHEDULED"
    });

    // Trigger appointment email notifications
    try {
      await sendAppointmentConfirmationUserEmail(
        email,
        name,
        new Date(date || Date.now()),
        time || "10:30 AM",
        notes || service || "Clinical Consultation"
      );
      await sendAppointmentNotificationAdminEmail(
        appointment,
        name,
        email
      );
    } catch (emailErr) {
      console.error("Failed to send appointment notifications:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Appointment successfully saved to database!",
      appointment
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update appointment status (Restricted to Admin, Staff, Doctor)
export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized. Staff privileges required." }, { status: 401 });
    }

    await connectToDatabase();
    const { appointmentId, status } = await req.json();

    if (!appointmentId || !status) {
      return NextResponse.json({ success: false, error: "Appointment ID and status are required." }, { status: 400 });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    );

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
