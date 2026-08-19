import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Referral } from "@/models/Referral";
import { DonorRegistration } from "@/models/DonorRegistration";
import { triggerWorkflowNotifications } from "@/features/notifications/services/workflow-notification.service";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

// GET — List referral records with search and filters
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("referralType") || "";
    const status = searchParams.get("rewardStatus") || "";
    const search = searchParams.get("search") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = {};
    if (type) query.sourceReferralType = type;
    if (status) query.rewardStatus = status;

    if (search) {
      query.$or = [
        { referrerName: { $regex: search, $options: "i" } },
        { referredDonorName: { $regex: search, $options: "i" } },
        { patientOrDonorId: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Referral.countDocuments(query);
    const referrals = await Referral.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Fetch registration statuses for each referred registration
    const enrichedReferrals = await Promise.all(
      referrals.map(async (ref: any) => {
        const registration = await DonorRegistration.findOne({ registrationId: ref.referredRegistrationId })
          .select("status")
          .catch(() => null);
        return {
          ...ref.toObject(),
          registrationStatus: registration ? registration.status : "PENDING_REVIEW",
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      referrals: enrichedReferrals,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    console.error("Fetch referrals error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH — Update referral reward eligibility, amount, status, payment details, and admin notes
export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Authorized access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const {
      referralId,
      rewardEligible,
      rewardAmount,
      rewardStatus,
      paymentMethod,
      adminNotes,
    } = body;

    if (!referralId) {
      return NextResponse.json({ success: false, error: "Referral ID is required." }, { status: 400 });
    }

    const referral = await Referral.findById(referralId);
    if (!referral) {
      return NextResponse.json({ success: false, error: "Referral record not found." }, { status: 404 });
    }

    const updates: any = {};
    if (rewardEligible !== undefined) updates.rewardEligible = rewardEligible;
    if (rewardAmount !== undefined) updates.rewardAmount = rewardAmount;
    if (rewardStatus !== undefined) updates.rewardStatus = rewardStatus;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    // Transitioning status to PAID
    if (rewardStatus === "Paid") {
      updates.paymentDate = new Date();
    }

    const updated = await Referral.findByIdAndUpdate(
      referralId,
      { $set: updates },
      { new: true }
    );

    // Trigger workflow notifications on status change
    try {
      if (rewardStatus === "Approved" && referral.rewardStatus !== "Approved") {
        await triggerWorkflowNotifications("referral_approved", referral.referrerName, referral.mobileNumber || "", {
          amount: String(rewardAmount || referral.rewardAmount),
          referredDonor: referral.referredDonorName,
        });
      } else if (rewardStatus === "Paid" && referral.rewardStatus !== "Paid") {
        await triggerWorkflowNotifications("referral_paid", referral.referrerName, referral.mobileNumber || "", {
          amount: String(rewardAmount || referral.rewardAmount),
          method: paymentMethod || "Bank Transfer",
          date: new Date().toLocaleDateString(),
        });
      }
    } catch (notifErr) {
      console.error("Mock notification error during reward update:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Referral reward updated successfully.",
      referral: updated,
    });
  } catch (error: any) {
    console.error("Update referral error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
