import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorInquiry } from "@/models/DonorInquiry";
import { triggerWorkflowNotifications } from "@/features/notifications/services/workflow-notification.service";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// POST — Submit a new inquiry
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const clientIp = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || reqHeaders.get("x-real-ip") || "127.0.0.1";
    const { checkRateLimit } = await import("@/lib/rate-limiter");
    const rateCheck = checkRateLimit(`inquiry_${clientIp}`, 5, 10 * 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "Too many inquiry submissions from this connection. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      fullName,
      mobileNumber,
      emailAddress,
      gender,
      dateOfBirth,
      age,
      donationInterest,
      height,
      weight,
      hairColor,
      eyeColor,
      skinTone,
      city,
      state,
      preferredContactTime,
      message,
      consent,
    } = body;

    if (!fullName || !mobileNumber || !emailAddress || !gender || !dateOfBirth || !donationInterest || !city || !state || !preferredContactTime || !consent) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required fields and accept the consent." },
        { status: 400 }
      );
    }

    const inquiry = await DonorInquiry.create({
      fullName,
      mobileNumber,
      emailAddress,
      gender,
      dateOfBirth,
      age,
      donationInterest,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      hairColor,
      eyeColor,
      skinTone,
      city,
      state,
      preferredContactTime,
      message,
      consent,
      status: "New Inquiry",
      statusHistory: [
        {
          status: "New Inquiry",
          notes: "Inquiry submitted by visitor",
          updatedAt: new Date(),
        },
      ],
    });

    // Create Admin Notification
    try {
      const { Notification } = await import("@/models/Notification");
      const notif = await Notification.create({
        title: "New Donor Inquiry",
        message: `${fullName} submitted a new ${donationInterest} inquiry.`,
        type: "INQUIRY",
        referenceId: inquiry._id.toString()
      });
      const { pusherServer } = await import("@/lib/pusher");
      await pusherServer.trigger("notifications", "new_notification", notif);
    } catch (notifErr) {
      console.error("Failed to create in-app notification:", notifErr);
    }

    // Trigger workflow notification
    try {
      await triggerWorkflowNotifications("inquiry_submitted", fullName, mobileNumber, {
        interest: donationInterest,
        email: emailAddress,
        city: city || "N/A",
        state: state || "N/A",
        preferredContactTime: preferredContactTime || "Anytime",
        message: message || ""
      });
    } catch (notifErr) {
      console.error("Workflow notification trigger error:", notifErr);
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (error: any) {
    console.error("Donor query submission error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET — List inquiries with filter/search
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const permissions = (session.user as any).permissions || [];
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

    if (!isAdmin && !permissions.includes("VIEW_INQUIRIES")) {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const interest = searchParams.get("donationInterest") || "";
    const status = searchParams.get("status") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (interest) query.donationInterest = interest;
    if (status) query.status = status;

    if (search) {
      const escapedSearch = escapeRegex(search);
      query.$or = [
        { fullName: { $regex: escapedSearch, $options: "i" } },
        { emailAddress: { $regex: escapedSearch, $options: "i" } },
        { mobileNumber: { $regex: escapedSearch, $options: "i" } },
        { city: { $regex: escapedSearch, $options: "i" } },
        { state: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const total = await DonorInquiry.countDocuments(query);
    const inquiries = await DonorInquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      success: true, 
      inquiries,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    console.error("Fetch inquiries error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
