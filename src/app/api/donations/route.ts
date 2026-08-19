import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Donation } from "@/models/Donation";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

// Helper to generate Donation Reference IDs
function generateDonationRefId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DN-${dateStr}-${rand}`;
}

// GET donations. Admins get all. Guests can retrieve a single donation if they provide referenceId (returns sanitized data).
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const referenceId = searchParams.get("referenceId");

    if (referenceId) {
      const donation = await Donation.findOne({ referenceId });
      if (!donation) {
        return NextResponse.json({ success: false, error: "Donation record not found." }, { status: 404 });
      }

      // Check if user is Admin/Staff or Owner
      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      const role = session?.user?.role || "";
      const isAdminOrStaff = session && ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
      const isOwner = session && (
        (session.user.email && donation.donorDetails?.email && session.user.email.toLowerCase() === donation.donorDetails.email.toLowerCase()) ||
        ((session.user as any).phone && donation.donorDetails?.phone && (session.user as any).phone === donation.donorDetails.phone)
      );

      if (isAdminOrStaff || isOwner) {
        return NextResponse.json({ success: true, donation });
      }

      // Guest tracking: sanitize response to prevent IDOR leaks
      const sanitized = {
        referenceId: donation.referenceId,
        status: donation.status,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
        adminNotes: donation.adminNotes,
        anonymous: donation.anonymous,
        donorDetails: {
          fullName: donation.anonymous 
            ? "Anonymous Donor" 
            : (donation.donorDetails?.fullName ? donation.donorDetails.fullName.replace(/(?<=.).(?=.)/g, "*") : "Donor"),
        },
        purpose: donation.purpose,
        amount: donation.amount,
        paymentInfo: {
          method: donation.paymentInfo?.method || "Online",
        }
      };

      return NextResponse.json({ success: true, donation: sanitized });
    }

    // Otherwise check Admin role
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const donations = await Donation.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, donations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Public donation submission
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { donorDetails, amount, purpose, message, anonymous, paymentInfo } = body;

    if (!donorDetails || !amount || !purpose || !paymentInfo) {
      return NextResponse.json({ success: false, error: "Missing donor, amount, purpose or payment details." }, { status: 400 });
    }

    const { fullName, email, phone, address, city, country } = donorDetails;
    const { method, transactionId } = paymentInfo;

    if (!fullName || !email || !amount || !purpose || !method) {
      return NextResponse.json({ success: false, error: "Missing required details." }, { status: 400 });
    }

    const referenceId = generateDonationRefId();

    const donation = await Donation.create({
      referenceId,
      donorDetails: { fullName, email, phone: phone || "", address: address || "", city: city || "", country: country || "" },
      amount: Number(amount),
      purpose,
      message: message || "",
      anonymous: !!anonymous,
      status: "PENDING",
      paymentInfo: {
        method,
        transactionId: transactionId || "",
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, referenceId, donation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Update donation status/notes (Admin Only)
export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { id, status, paymentStatus, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Donation ID is required." }, { status: 400 });
    }

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
    if (paymentStatus) {
      updateFields["paymentInfo.status"] = paymentStatus;
    }

    const donation = await Donation.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!donation) {
      return NextResponse.json({ success: false, error: "Donation not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, donation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
