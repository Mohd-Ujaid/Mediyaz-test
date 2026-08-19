import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ContactMessage } from "@/models/ContactMessage";
import { Notification } from "@/models/Notification";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { sendContactFormUserAutoReply, sendContactFormAdminNotification } from "@/features/email/services/email.service";

// GET messages (Admin Only)
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const total = await ContactMessage.countDocuments({});
    const messages = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      success: true, 
      messages,
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

// POST: Guest submits message
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const contact = await ContactMessage.create({
      name,
      email,
      message,
      status: "PENDING"
    });

    // Trigger contact email notifications (auto-reply to visitor, alert to admin)
    try {
      await sendContactFormUserAutoReply(email, name);
      await sendContactFormAdminNotification({ name, email, message });
    } catch (emailErr) {
      console.error("Failed to send contact notifications:", emailErr);
    }

    const notif = await Notification.create({
      title: "New Contact Message",
      message: `${name} has sent a new contact inquiry.`,
      type: "INQUIRY",
      referenceId: contact._id.toString(),
    });

    try {
      const { pusherServer } = await import("@/lib/pusher");
      await pusherServer.trigger("notifications", "new_notification", notif);
    } catch (pushErr) {
      console.error("Failed to push notification via Pusher:", pushErr);
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Reply / Update Status (Admin Only)
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
      return NextResponse.json({ success: false, error: "Message ID is required." }, { status: 400 });
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;

    const contact = await ContactMessage.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact log not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
