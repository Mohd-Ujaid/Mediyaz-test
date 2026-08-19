import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ConsultationRequest } from "@/models/ConsultationRequest";
import { DonorRegistration } from "@/models/DonorRegistration";
import { DonorInquiry } from "@/models/DonorInquiry";
import { Referral } from "@/models/Referral";
import { Donor } from "@/models/Donor";
import { Treatment } from "@/models/Treatment";
import { ContactMessage } from "@/models/ContactMessage";
import { Review } from "@/models/Review";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized: Admins only." }, { status: 401 });
    }

    const { redis } = await import("@/lib/redis");
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const cachedStats = await redis.get("api:stats:dashboard");
      if (cachedStats) {
        return NextResponse.json({ success: true, stats: cachedStats });
      }
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: false, error: "Database offline" }, { status: 500 });
    }

    // 1. Basic counts
    const [
      totalBookings,
      pendingBookings,
      totalRegistrations,
      pendingRegistrations,
      approvedRegistrations,
      rejectedRegistrations,
      suspendedRegistrations,
      totalServices,
      totalMessages,
      totalReviews,
      pendingReviews,
      totalInquiries,
      totalConsultations,
      activeDonors,
      referralCount
    ] = await Promise.all([
      ConsultationRequest.countDocuments().catch(() => 0),
      ConsultationRequest.countDocuments({ status: "NEW" }).catch(() => 0),
      DonorRegistration.countDocuments().catch(() => 0),
      DonorRegistration.countDocuments({ status: "SUBMITTED" }).catch(() => 0),
      DonorRegistration.countDocuments({ status: "APPROVED" }).catch(() => 0),
      DonorRegistration.countDocuments({ status: "REJECTED" }).catch(() => 0),
      DonorRegistration.countDocuments({ status: "SUSPENDED" }).catch(() => 0),
      Treatment.countDocuments().catch(() => 0),
      ContactMessage.countDocuments().catch(() => 0),
      Review.countDocuments().catch(() => 0),
      Review.countDocuments({ approved: false }).catch(() => 0),
      DonorInquiry.countDocuments().catch(() => 0),
      DonorInquiry.countDocuments({ status: { $in: ["Consultation Scheduled", "Consultation Completed"] } }).catch(() => 0),
      Donor.countDocuments({ donationStatus: "ACTIVE" }).catch(() => 0),
      Referral.countDocuments().catch(() => 0),
    ]);

    // Sperm and Egg counts from registrations
    const spermDonors = await DonorRegistration.countDocuments({ donorType: "sperm", status: "APPROVED" }).catch(() => 0);
    const eggDonors = await DonorRegistration.countDocuments({ donorType: "egg", status: "APPROVED" }).catch(() => 0);

    // Referral rewards financial stats
    const paidReferrals = await Referral.find({ rewardStatus: "Paid" }).catch(() => []);
    const pendingReferralRewards = await Referral.find({ rewardStatus: "Approved" }).catch(() => []);
    
    const totalRewardsPaid = paidReferrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    const pendingRewards = pendingReferralRewards.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    // 2. Referral Source Distribution
    const referrals = await Referral.find().catch(() => []);
    const sourceTypes = [
      "Existing Patient", "Existing Donor", "Friend / Family", "Doctor / Clinic", 
      "Staff Member", "Website", "Google Search", "Facebook", "Instagram", 
      "WhatsApp", "Advertisement", "Walk-in", "Other"
    ];
    const referralDistribution = sourceTypes.map(type => ({
      name: type,
      value: referrals.filter(r => r.sourceReferralType === type).length
    })).filter(item => item.value > 0);

    // 3. Top Referrers
    const getTopReferrers = (type: string) => {
      const filtered = referrals.filter(r => r.sourceReferralType === type);
      const counts: Record<string, { count: number; name: string; id?: string }> = {};
      
      filtered.forEach(r => {
        const key = r.patientOrDonorId || r.referrerName;
        if (!counts[key]) {
          counts[key] = { count: 0, name: r.referrerName, id: r.patientOrDonorId };
        }
        counts[key].count += 1;
      });

      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    };

    const topPatients = getTopReferrers("Existing Patient");
    const topDonors = getTopReferrers("Existing Donor");
    const topStaff = getTopReferrers("Staff Member");
    const topDoctors = getTopReferrers("Doctor / Clinic");

    // 4. Monthly trends (calculated dynamically from actual database records for the trailing 6 months)
    const monthlyAnalytics = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString("en-US", { month: "short" });
      
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const [inqCount, regCount, bookingCount, referralsPaid] = await Promise.all([
        DonorInquiry.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).catch(() => 0),
        DonorRegistration.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).catch(() => 0),
        ConsultationRequest.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }).catch(() => 0),
        Referral.aggregate([
          { $match: { rewardStatus: "Paid", createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
          { $group: { _id: null, total: { $sum: "$rewardAmount" } } }
        ]).catch(() => [])
      ]);
      
      const rewardsPaidVal = (referralsPaid && referralsPaid.length > 0) ? referralsPaid[0].total : 0;
      
      monthlyAnalytics.push({
        month: monthLabel,
        inquiries: inqCount,
        registrations: regCount,
        bookings: bookingCount,
        rewardsPaid: rewardsPaidVal,
      });
    }

    // 5. Recent activity feed
    const recentActivities: any[] = [];

    const lastInquiries = await DonorInquiry.find().sort({ createdAt: -1 }).limit(3).catch(() => []);
    lastInquiries.forEach((inq: any) => {
      recentActivities.push({
        type: "inquiry",
        title: `New Inquiry: ${inq.donationInterest === "sperm" ? "Sperm" : "Egg"} Donor`,
        details: `${inq.fullName} (${inq.city})`,
        status: inq.status,
        timestamp: inq.createdAt
      });
    });

    const lastRegistrations = await DonorRegistration.find().sort({ createdAt: -1 }).limit(3).catch(() => []);
    lastRegistrations.forEach((r: any) => {
      recentActivities.push({
        type: "registration",
        title: `New ${r.donorType === "sperm" ? "Sperm" : "Egg"} Application`,
        details: `${r.personalInfo?.fullName || "Altruistic Donor"} (${r.registrationId})`,
        status: r.status,
        timestamp: r.createdAt
      });
    });

    const lastReferrals = await Referral.find().sort({ createdAt: -1 }).limit(3).catch(() => []);
    lastReferrals.forEach((ref: any) => {
      recentActivities.push({
        type: "referral",
        title: `Referral Rewards: ${ref.rewardStatus}`,
        details: `${ref.referrerName} referred ${ref.referredDonorName}`,
        status: ref.rewardStatus,
        timestamp: ref.createdAt
      });
    });

    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const responseData = {
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        rejectedRegistrations,
        suspendedRegistrations,
        totalServices,
        totalMessages,
        totalReviews,
        pendingReviews,
        // New statistics fields
        totalInquiries,
        totalConsultations,
        activeDonors,
        spermDonors,
        eggDonors,
        referralCount,
        totalRewardsPaid,
        pendingRewards,
        referralDistribution,
        topReferrers: {
          patients: topPatients,
          donors: topDonors,
          staff: topStaff,
          doctors: topDoctors,
        },
        monthlyAnalytics,
        recentActivities: recentActivities.slice(0, 8)
      }
    };

    if (process.env.UPSTASH_REDIS_REST_URL) {
      await redis.setex("api:stats:dashboard", 120, JSON.stringify(responseData.stats));
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Dashboard stats generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

