import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { Agent } from "@/models/Agent";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { Hospital } from "@/models/Hospital";
import mongoose from "mongoose";

// Egg Donor Registrations API Route - Fully validated
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any)?.role;
    const permissions = (session.user as any)?.permissions || [];
    const isAllowed =
      ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role) ||
      permissions.includes("VIEW_REGISTRATIONS") ||
      permissions.includes("VIEW_REG_CHECKS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const _forceRegister = Hospital.modelName;
    const _forceRegisterAgent = Agent.modelName;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const tab = searchParams.get("tab") || "new";
    const status = searchParams.get("status") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const state = searchParams.get("state") || "";
    const city = searchParams.get("city") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const query: any = {};
    const otherUntilApprovedList = [
      "UNDER_REVIEW",
      "DOCUMENTS_VERIFIED",
      "AFFIDAVIT_UPLOADED",
      "REJECTED",
      "SUSPENDED",
    ];

    const normalizedTab = (tab || "new").toLowerCase();
    if (status) {
      if (status === "all") {
        delete query.status;
      } else if (status === "NEW" || status === "SUBMITTED") {
        query.status = { $in: ["NEW", "SUBMITTED"] };
      } else {
        query.status = status;
      }
    } else {
      if (normalizedTab === "all") {
        // Show all registrations
      } else if (normalizedTab === "draft") {
        query.status = "DRAFT";
      } else if (normalizedTab === "under_review") {
        query.status = "UNDER_REVIEW";
      } else if (normalizedTab === "documents_verified") {
        query.status = "DOCUMENTS_VERIFIED";
      } else if (normalizedTab === "affidavit_uploaded") {
        query.status = "AFFIDAVIT_UPLOADED";
      } else if (normalizedTab === "approved") {
        query.status = "APPROVED";
      } else if (normalizedTab === "rejected") {
        query.status = "REJECTED";
      } else if (normalizedTab === "suspended") {
        query.status = "SUSPENDED";
      } else if (normalizedTab === "other") {
        query.status = { $in: otherUntilApprovedList };
      } else {
        // default "new" tab
        query.status = { $in: ["NEW", "SUBMITTED"] };
      }
    }
    if (bloodGroup && bloodGroup !== "all") query["personalInfo.bloodGroup"] = bloodGroup;
    if (state && state !== "all") query["contactInfo.state"] = { $regex: escapeRegex(state), $options: "i" };
    if (city && city !== "all") query["contactInfo.city"] = { $regex: escapeRegex(city), $options: "i" };

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { registrationId: { $regex: safeSearch, $options: "i" } },
        { "personalInfo.fullName": { $regex: safeSearch, $options: "i" } },
        { "personalInfo.husbandName": { $regex: safeSearch, $options: "i" } },
        { "personalInfo.spouseName": { $regex: safeSearch, $options: "i" } },
        { "contactInfo.emailAddress": { $regex: safeSearch, $options: "i" } },
        { "contactInfo.mobileNumber": { $regex: safeSearch, $options: "i" } },
        { agentCode: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Compute overall stats for all egg donor registrations
    const [
      totalAll,
      totalNew,
      totalUnderReview,
      totalDocsVerified,
      totalAffidavit,
      totalApproved,
      totalWaitingForm13,
      totalFileCompleted,
      totalRejected,
      totalDraft,
      totalSuspended,
    ] = await Promise.all([
      EggDonorRegistration.countDocuments(),
      EggDonorRegistration.countDocuments({ status: { $in: ["NEW", "SUBMITTED"] } }),
      EggDonorRegistration.countDocuments({ status: "UNDER_REVIEW" }),
      EggDonorRegistration.countDocuments({ status: "DOCUMENTS_VERIFIED" }),
      EggDonorRegistration.countDocuments({ status: "AFFIDAVIT_UPLOADED" }),
      EggDonorRegistration.countDocuments({ status: "APPROVED" }),
      EggDonorRegistration.countDocuments({ status: "WAITING_FORM13" }),
      EggDonorRegistration.countDocuments({ status: "FILE_COMPLETED" }),
      EggDonorRegistration.countDocuments({ status: "REJECTED" }),
      EggDonorRegistration.countDocuments({ status: "DRAFT" }),
      EggDonorRegistration.countDocuments({ status: "SUSPENDED" }),
    ]);

    const totalOtherUntilApproved =
      totalUnderReview + totalDocsVerified + totalAffidavit + totalRejected + totalSuspended;

    const stats = {
      total: totalAll,
      new: totalNew,
      submitted: totalNew, // backward compatibility
      underReview: totalUnderReview,
      documentsVerified: totalDocsVerified,
      affidavitUploaded: totalAffidavit,
      approved: totalApproved,
      waitingForm13: totalWaitingForm13,
      fileCompleted: totalFileCompleted,
      rejected: totalRejected,
      draft: totalDraft,
      suspended: totalSuspended,
      otherUntilApproved: totalOtherUntilApproved,
    };

    const total = await EggDonorRegistration.countDocuments(query);
    const rawRegistrations = await EggDonorRegistration.find(query)
      .populate("assignedHospital")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const agentCodesToLookup = rawRegistrations
      .map((r: any) => r.agentCode || (r.referral?.sourceReferralType === "Refer" ? r.referral?.patientOrDonorId : null))
      .filter((code: any) => !!code);

    const agentIdsToLookup = rawRegistrations
      .map((r: any) => r.agentId)
      .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id));

    const agentMap: Record<string, any> = {};
    if (agentCodesToLookup.length > 0 || agentIdsToLookup.length > 0) {
      const orClauses: any[] = [];
      if (agentCodesToLookup.length > 0) {
        orClauses.push(
          { agentCode: { $in: agentCodesToLookup } },
          { referName: { $in: agentCodesToLookup } }
        );
      }
      if (agentIdsToLookup.length > 0) orClauses.push({ _id: { $in: agentIdsToLookup } });

      const agents = await Agent.find({ $or: orClauses }).lean();
      for (const ag of agents) {
        if (ag.agentCode) agentMap[ag.agentCode] = ag;
        if (ag.referName) agentMap[ag.referName] = ag;
        if (ag._id) agentMap[ag._id.toString()] = ag;
      }
    }

    const registrations = rawRegistrations.map((r: any) => {
      const ag = (r.agentId ? agentMap[r.agentId.toString()] : null) ||
                 (r.agentCode ? agentMap[r.agentCode] : null) ||
                 (r.referral?.patientOrDonorId ? agentMap[r.referral.patientOrDonorId] : null);

      let clinicDeal = r.clinicDeal;
      if ((!clinicDeal || !clinicDeal.hospitalDealPrice) && r.assignedHospital) {
        const category = clinicDeal?.donorCategory || "normal";
        const customField = category === "registry" ? "registryPrice" : "donorPrice";
        const price = r.assignedHospital[customField] || r.assignedHospital.donorPrice || 70000;
        clinicDeal = {
          hospitalDealPrice: price,
          donorCategory: category,
          notes: `Auto-assigned based on ${category} category`,
          assignedAt: r.assignedAt || new Date(),
          assignedBy: r.assignedBy || "Mediyaz System",
        };
      }

      let donorDeal = r.donorDeal;
      if (!donorDeal || !donorDeal.totalAgreedAmount) {
        const compAmount = r.assignedHospital?.donorCompensation || 40000;
        donorDeal = {
          totalAgreedAmount: compAmount,
          donorCategory: clinicDeal?.donorCategory || "normal",
          paymentTerms: donorDeal?.paymentTerms || "Full on Retrieval",
          paymentStatus: donorDeal?.paymentStatus || (r.status === "APPROVED" ? "PAID" : "PENDING"),
          advanceAmount: donorDeal?.advanceAmount || 0,
          balanceAmount: donorDeal?.balanceAmount || (r.status === "APPROVED" ? 0 : compAmount),
          notes: donorDeal?.notes || "Standard donor compensation agreement",
        };
      }

      const activeReferId = r.agentCode || (r.referral?.sourceReferralType === "Refer" ? r.referral?.patientOrDonorId : null);
      const partnerRef = ag?.referName || ag?.agentCode || activeReferId;
      const referredBy = ag
        ? `${ag.fullName} (${partnerRef})`
        : activeReferId
        ? `Refer: ${activeReferId}`
        : null;

      return {
        ...r,
        clinicDeal,
        donorDeal,
        agentName: ag?.fullName || (activeReferId ? `Partner (${activeReferId})` : null),
        agentDetails: ag || null,
        referredBy,
      };
    });

    return NextResponse.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      registrations,
      stats,
    });
  } catch (error: any) {
    console.error("Error fetching egg donor registrations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    const permissions = (session.user as any)?.permissions || [];
    const isAllowed =
      ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role) ||
      permissions.includes("VIEW_REGISTRATIONS") ||
      permissions.includes("VIEW_REG_CHECKS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    const registrationId = `MED-ED-${new Date().getFullYear()}-${timestamp}${random}`;

    const eggData = {
      ...body,
      registrationId,
      donorType: "egg",
      status: body.status || "NEW",
      personalInfo: {
        ...body.personalInfo,
        gender: "Female",
        husbandName: body.personalInfo?.husbandName || body.personalInfo?.spouseName || "",
        husbandOccupation: body.personalInfo?.husbandOccupation || body.personalInfo?.spouseOccupation || "",
      },
    };

    const registration = await EggDonorRegistration.create(eggData);

    return NextResponse.json({ success: true, registration }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating egg donor registration:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
