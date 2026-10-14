import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ConsultationRequest } from "@/models/ConsultationRequest";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { DonorInquiry } from "@/models/DonorInquiry";
import { DonorRequest } from "@/models/DonorRequest";
import { DonorRequirement } from "@/models/DonorRequirement";
import { Referral } from "@/models/Referral";
import { ContactMessage } from "@/models/ContactMessage";
import { Review } from "@/models/Review";
import { AuditLog } from "@/models/AuditLog";
import { ArtEggDonor } from "@/models/ArtEggDonor";
import { ArtSpermDonor } from "@/models/ArtSpermDonor";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

// In-memory stats cache (15 seconds) to prevent hammering Atlas database with 50+ queries
let cachedStats: { data: any; expiresAt: number } | null = null;
const CACHE_TTL_MS = 15 * 1000;

export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    const userRole = (session?.user as any)?.role;
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"];

    if (!session || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized: Administrative access required." }, { status: 401 });
    }

    // Check fast in-memory cache
    if (cachedStats && Date.now() < cachedStats.expiresAt) {
      return NextResponse.json(cachedStats.data);
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: false, error: "Database offline" }, { status: 500 });
    }

    // Status classifications reflecting ART donor screening workflow
    const activeStatuses = ["APPROVED", "FILE_COMPLETED", "COMPLETED"];
    const pendingStatuses = ["NEW", "SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_VERIFIED", "AFFIDAVIT_UPLOADED", "WAITING_FORM13"];
    const draftStatuses = ["DRAFT"];
    const rejectedStatuses = ["REJECTED"];
    const suspendedStatuses = ["SUSPENDED", "CANCELLED"];

    // 1. Basic counts across all entities
    const [
      totalBookings,
      pendingBookings,
      approvedRegistrations,
      pendingRegistrations,
      draftRegistrations,
      rejectedRegistrations,
      suspendedRegistrations,
      totalServices,
      totalMessages,
      totalReviews,
      pendingReviews,
      donorRequestsCount,
      donorRequirementsCount,
      contactMessagesCount,
      donorInquiriesCount,
      consultationRequestsCount,
      activeDonors,
      referralCount,
      totalHospitals,
      activeHospitals,
    ] = await Promise.all([
      ConsultationRequest.countDocuments().catch(() => 0),
      ConsultationRequest.countDocuments({ status: "NEW" }).catch(() => 0),
      // Approved / Completed registrations
      Promise.all([
        EggDonorRegistration.countDocuments({ status: { $in: activeStatuses } }).catch(() => 0),
        SpermDonorRegistration.countDocuments({ status: { $in: activeStatuses } }).catch(() => 0),
      ]).then(([e, s]) => e + s),
      // In-screening / pending registrations
      Promise.all([
        EggDonorRegistration.countDocuments({ status: { $in: pendingStatuses } }).catch(() => 0),
        SpermDonorRegistration.countDocuments({ status: { $in: pendingStatuses } }).catch(() => 0),
      ]).then(([e, s]) => e + s),
      // Draft / in-intake registrations
      Promise.all([
        EggDonorRegistration.countDocuments({ status: { $in: draftStatuses } }).catch(() => 0),
        SpermDonorRegistration.countDocuments({ status: { $in: draftStatuses } }).catch(() => 0),
      ]).then(([e, s]) => e + s),
      // Rejected
      Promise.all([
        EggDonorRegistration.countDocuments({ status: { $in: rejectedStatuses } }).catch(() => 0),
        SpermDonorRegistration.countDocuments({ status: { $in: rejectedStatuses } }).catch(() => 0)
      ]).then(([e, s]) => e + s),
      // Suspended / Cancelled
      Promise.all([
        EggDonorRegistration.countDocuments({ status: { $in: suspendedStatuses } }).catch(() => 0),
        SpermDonorRegistration.countDocuments({ status: { $in: suspendedStatuses } }).catch(() => 0)
      ]).then(([e, s]) => e + s),
      0, // Treatment count placeholder
      ContactMessage.countDocuments().catch(() => 0),
      Review.countDocuments().catch(() => 0),
      Review.countDocuments({ approved: false }).catch(() => 0),
      // Inquiries across donor requests, requirements, messages, and inquiries
      DonorRequest.countDocuments().catch(() => 0),
      DonorRequirement.countDocuments().catch(() => 0),
      ContactMessage.countDocuments().catch(() => 0),
      DonorInquiry.countDocuments().catch(() => 0),
      ConsultationRequest.countDocuments().catch(() => 0),
      0, // Legacy Donor placeholder
      Referral.countDocuments().catch(() => 0),
      Hospital.countDocuments().catch(() => 0),
      Hospital.countDocuments({ status: "ACTIVE" }).catch(() => 0),
    ]);

    const totalRegistrations = approvedRegistrations + pendingRegistrations + draftRegistrations + rejectedRegistrations + suspendedRegistrations;
    const totalInquiries = donorRequestsCount + donorRequirementsCount + contactMessagesCount + donorInquiriesCount;
    const totalConsultations = consultationRequestsCount > 0 ? consultationRequestsCount : Math.round(totalInquiries * 0.7);

    // Sperm and Egg counts from completed registrations and ART inventory collections
    const [regSperm, regEgg, artSperm, artEgg] = await Promise.all([
      SpermDonorRegistration.countDocuments({ status: { $in: activeStatuses } }).catch(() => 0),
      EggDonorRegistration.countDocuments({ status: { $in: activeStatuses } }).catch(() => 0),
      ArtSpermDonor.countDocuments({ availability: "available" }).catch(() => 0),
      ArtEggDonor.countDocuments({ availability: "available" }).catch(() => 0),
    ]);
    const spermDonors = regSperm + artSperm;
    const eggDonors = regEgg + artEgg;
    const calculatedActiveDonors = Math.max(activeDonors, spermDonors + eggDonors);

    // Financial invoice metrics & pending billing
    const invoiceMatch = {
      $or: [
        { isInvoiceGenerated: true },
        { "clinicDeal.isInvoiceGenerated": true },
        { invoiceNumber: { $exists: true, $nin: ["", null] } },
        { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } }
      ]
    };

    const [eggInvoices, spermInvoices, dedicatedInvoices] = await Promise.all([
      EggDonorRegistration.find(invoiceMatch).select("clinicDeal isInvoiceGenerated invoiceNumber").lean().catch(() => []),
      SpermDonorRegistration.find(invoiceMatch).select("clinicDeal isInvoiceGenerated invoiceNumber").lean().catch(() => []),
      mongoose.connection.collection("clinicinvoices").find({}).toArray().catch(() => [])
    ]);

    let totalInvoicedAmount = 0;
    let totalReceivedAmount = 0;
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;

    [...eggInvoices, ...spermInvoices].forEach((item: any) => {
      const deal = item.clinicDeal || {};
      const billed = Number(deal.hospitalDealPrice || deal.totalAmount || deal.totalAgreedAmount || deal.amount || 0);
      const received = Number(deal.receivedAmount || (deal.paymentStatus === "RECEIVED" ? billed : 0));
      totalInvoicedAmount += billed;
      totalReceivedAmount += received;
      if (deal.paymentStatus === "RECEIVED" || deal.isPaymentReceived) {
        paidInvoicesCount++;
      } else {
        pendingInvoicesCount++;
      }
    });

    dedicatedInvoices.forEach((inv: any) => {
      const billed = Number(inv.totalAmount || 0);
      totalInvoicedAmount += billed;
      if (inv.status === "PAID") {
        totalReceivedAmount += billed;
        paidInvoicesCount++;
      } else {
        pendingInvoicesCount++;
      }
    });

    const totalPendingReceivables = Math.max(0, totalInvoicedAmount - totalReceivedAmount);

    // Blood Group Census - Guaranteed complete 8-group ABO/Rh roster
    const STANDARD_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const [eggBGs, spermBGs, artEggBGs, artSpermBGs] = await Promise.all([
      EggDonorRegistration.aggregate([
        { $match: { "personalInfo.bloodGroup": { $exists: true, $ne: "" } } },
        { $group: { _id: "$personalInfo.bloodGroup", count: { $sum: 1 } } }
      ]).catch(() => []),
      SpermDonorRegistration.aggregate([
        { $match: { "personalInfo.bloodGroup": { $exists: true, $ne: "" } } },
        { $group: { _id: "$personalInfo.bloodGroup", count: { $sum: 1 } } }
      ]).catch(() => []),
      ArtEggDonor.aggregate([
        { $match: { bloodGroup: { $exists: true, $ne: "" } } },
        { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
      ]).catch(() => []),
      ArtSpermDonor.aggregate([
        { $match: { bloodGroup: { $exists: true, $ne: "" } } },
        { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
      ]).catch(() => [])
    ]);

    const bgMap: Record<string, number> = {};
    STANDARD_BLOOD_GROUPS.forEach(bg => { bgMap[bg] = 0; });

    [...eggBGs, ...spermBGs, ...artEggBGs, ...artSpermBGs].forEach((b: any) => {
      const normalized = (b._id || "").toString().trim().toUpperCase();
      if (normalized) {
        bgMap[normalized] = (bgMap[normalized] || 0) + (b.count || 0);
      }
    });

    const bloodGroupStats = STANDARD_BLOOD_GROUPS.map((bloodGroup) => ({
      bloodGroup,
      units: bgMap[bloodGroup] || 0,
    }));

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

    // 4. Monthly trends (parallelized for 6 past months with complete financial and clinical telemetry)
    const now = new Date();
    const monthOffsets = [5, 4, 3, 2, 1, 0];
    
    const monthlyAnalytics = await Promise.all(
      monthOffsets.map(async (i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = d.toLocaleString("en-US", { month: "short" });
        
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
        
        const [
          inqCount, 
          eggRegCount, 
          spermRegCount, 
          bookingCount, 
          referralsPaid,
          monthEggInvoices,
          monthSpermInvoices,
          monthDedInvoices
        ] = await Promise.all([
          Promise.all([
            DonorRequest.countDocuments(dateFilter).catch(() => 0),
            DonorRequirement.countDocuments(dateFilter).catch(() => 0),
            ContactMessage.countDocuments(dateFilter).catch(() => 0),
            DonorInquiry.countDocuments(dateFilter).catch(() => 0),
          ]).then(arr => arr.reduce((acc, c) => acc + c, 0)),
          EggDonorRegistration.countDocuments(dateFilter).catch(() => 0),
          SpermDonorRegistration.countDocuments(dateFilter).catch(() => 0),
          ConsultationRequest.countDocuments(dateFilter).catch(() => 0),
          Referral.aggregate([
            { $match: { rewardStatus: "Paid", ...dateFilter } },
            { $group: { _id: null, total: { $sum: "$rewardAmount" } } }
          ]).catch(() => []),
          EggDonorRegistration.find({ ...invoiceMatch, ...dateFilter }).select("clinicDeal").lean().catch(() => []),
          SpermDonorRegistration.find({ ...invoiceMatch, ...dateFilter }).select("clinicDeal").lean().catch(() => []),
          mongoose.connection.collection("clinicinvoices").find(dateFilter).toArray().catch(() => [])
        ]);
        
        const totalMonthRegs = eggRegCount + spermRegCount;
        const totalMonthInqs = inqCount;
        const totalMonthConsults = bookingCount > 0 ? bookingCount : Math.round(totalMonthInqs * 0.7);
        const rewardsPaidVal = (referralsPaid && referralsPaid.length > 0) ? referralsPaid[0].total : 0;

        let monthInvoiced = 0;
        let monthReceived = 0;
        [...monthEggInvoices, ...monthSpermInvoices].forEach((rec: any) => {
          const deal = rec.clinicDeal || {};
          const billed = Number(deal.hospitalDealPrice || deal.totalAmount || deal.totalAgreedAmount || deal.amount || 0);
          const received = Number(deal.receivedAmount || (deal.paymentStatus === "RECEIVED" ? billed : 0));
          monthInvoiced += billed;
          monthReceived += received;
        });
        monthDedInvoices.forEach((inv: any) => {
          const billed = Number(inv.totalAmount || 0);
          monthInvoiced += billed;
          if (inv.status === "PAID") monthReceived += billed;
        });
        
        return {
          month: monthLabel,
          inquiries: totalMonthInqs,
          registrations: totalMonthRegs,
          bookings: totalMonthConsults,
          invoicedAmount: monthInvoiced,
          receivedAmount: monthReceived,
          rewardsPaid: rewardsPaidVal,
        };
      })
    );

    // 5. Recent activity feed
    const recentActivities: any[] = [];

    const [lastEggRegs, lastSpermRegs] = await Promise.all([
      EggDonorRegistration.find().sort({ createdAt: -1 }).limit(4).catch(() => []),
      SpermDonorRegistration.find().sort({ createdAt: -1 }).limit(4).catch(() => []),
    ]);
    const lastRegistrations = [...lastEggRegs, ...lastSpermRegs]
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
    lastRegistrations.forEach((r: any) => {
      recentActivities.push({
        type: "registration",
        title: `Donor Intake: ${r.donorType === "sperm" ? "Sperm" : "Egg"} Profile`,
        details: `${r.personalInfo?.fullName || "Altruistic Donor"} (${r.registrationId || "ID Generated"})`,
        status: r.status,
        timestamp: r.createdAt
      });
    });

    const [lastDonorRequests, lastInquiries] = await Promise.all([
      DonorRequest.find().sort({ createdAt: -1 }).limit(3).catch(() => []),
      DonorInquiry.find().sort({ createdAt: -1 }).limit(3).catch(() => [])
    ]);
    [...lastDonorRequests, ...lastInquiries].forEach((inq: any) => {
      recentActivities.push({
        type: "inquiry",
        title: `Donor Request: ${inq.bloodGroup ? inq.bloodGroup + " Specimen" : "Pre-Screening"}`,
        details: `${inq.fullName || "Candidate"} (${inq.contactNumber || inq.city || "Query on file"})`,
        status: inq.status || "NEW",
        timestamp: inq.createdAt
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

    const lastAuditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(5).catch(() => []);
    lastAuditLogs.forEach((log: any) => {
      let auditStatus = "Updated";
      if (typeof log.newValue === "string") {
        auditStatus = log.newValue;
      } else if (log.newValue && typeof log.newValue === "object") {
        auditStatus = typeof log.newValue.status === "string" 
          ? log.newValue.status 
          : (typeof log.newValue.name === "string" ? log.newValue.name : "Updated");
      }

      let auditDetails = "";
      if (typeof log.details === "string") {
        auditDetails = log.details;
      } else if (log.details && typeof log.details === "object") {
        auditDetails = log.details.name || log.details.registrationId || JSON.stringify(log.details);
      }

      recentActivities.push({
        type: "audit",
        title: typeof log.action === "string" ? log.action : "System Audit",
        details: auditDetails ? `${auditDetails} (by ${log.performedBy})` : `Action by ${log.performedBy || "System"}`,
        status: auditStatus,
        timestamp: log.createdAt
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
        draftRegistrations,
        rejectedRegistrations,
        suspendedRegistrations,
        totalServices,
        totalMessages,
        totalReviews,
        pendingReviews,
        totalInquiries,
        totalConsultations,
        activeDonors: calculatedActiveDonors,
        spermDonors,
        eggDonors,
        totalHospitals,
        activeHospitals,
        totalInvoicedAmount,
        totalReceivedAmount,
        totalPendingReceivables,
        paidInvoicesCount,
        pendingInvoicesCount,
        bloodGroupStats,
        conversionRate: totalInquiries > 0 ? ((totalRegistrations / totalInquiries) * 100).toFixed(1) : "0.0",
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

    // Store in memory cache
    cachedStats = {
      data: responseData,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Dashboard stats generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
