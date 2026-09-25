import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";
import { Agent } from "@/models/Agent";
import { DonorRegistration } from "@/models/DonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

// Helper to generate next sequential Agent Code: AGT-1001, AGT-1002, etc.
async function generateNextAgentCode(): Promise<string> {
  const lastAgent = await Agent.findOne({ agentCode: /^AGT-\d+$/ })
    .sort({ createdAt: -1 })
    .lean();

  if (!lastAgent || !lastAgent.agentCode) {
    return "AGT-1001";
  }

  const match = lastAgent.agentCode.match(/^AGT-(\d+)$/);
  if (match && match[1]) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `AGT-${nextNum}`;
  }

  return `AGT-${Date.now().toString().slice(-4)}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const agentCode = searchParams.get("code")?.trim().toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    // If specific agentCode requested with full donor details
    if (agentCode) {
      const safeAgentCode = escapeRegex(agentCode);
      const agent = await Agent.findOne({ 
        $or: [
          { agentCode: new RegExp(`^${safeAgentCode}$`, "i") },
          { mobileNumber: agentCode }
        ]
      }).lean();
      if (!agent) {
        return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
      }

      const safeFoundCode = escapeRegex(agent.agentCode);
      const agentFilter = {
        $or: [
          { agentCode: new RegExp(`^${safeFoundCode}$`, "i") },
          { agentId: agent._id },
          { "referral.patientOrDonorId": new RegExp(`^${safeFoundCode}$`, "i") },
          { "referral.otherSourceDetails": new RegExp(safeFoundCode, "i") },
        ]
      };

      const selectFields = "registrationId donorType status personalInfo contactInfo createdAt updatedAt agentPayout";

      const [mainDonors, spermDonors, eggDonors] = await Promise.all([
        DonorRegistration.find(agentFilter).sort({ createdAt: -1 }).select(selectFields).lean(),
        SpermDonorRegistration.find(agentFilter).sort({ createdAt: -1 }).select(selectFields).lean(),
        EggDonorRegistration.find(agentFilter).sort({ createdAt: -1 }).select(selectFields).lean(),
      ]);

      const donorMap = new Map();
      [...mainDonors, ...spermDonors, ...eggDonors].forEach((d: any) => {
        const key = d.registrationId || String(d._id);
        if (!donorMap.has(key)) {
          donorMap.set(key, d);
        } else {
          const existing = donorMap.get(key);
          const existingSt = (existing.agentPayout?.status || "UNPAID").toUpperCase();
          const newSt = (d.agentPayout?.status || "UNPAID").toUpperCase();
          let preferredPayout = d.agentPayout || existing.agentPayout;
          if (existingSt === "PAID" && newSt !== "PAID") {
            preferredPayout = existing.agentPayout;
          } else if (newSt === "PAID") {
            preferredPayout = d.agentPayout;
          }
          donorMap.set(key, {
            ...existing,
            ...d,
            agentPayout: preferredPayout
          });
        }
      });

      const donors = Array.from(donorMap.values()).sort(
        (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      // Compute fresh live stats for this agent
      let eggCount = 0;
      let spermCount = 0;
      let approvedCount = 0;
      let totalEarnings = 0;
      let pendingPayout = 0;
      let paidPayout = 0;

      donors.forEach((d: any) => {
        const isEgg = d.donorType === "egg";
        if (isEgg) eggCount++;
        else spermCount++;

        if (d.status === "APPROVED") approvedCount++;

        const payout = d.agentPayout || {};
        const amount = Number(payout.amount) > 0 ? Number(payout.amount) : (isEgg ? agent.commissionRates?.eggDonorCommission || 5000 : agent.commissionRates?.spermDonorCommission || 2000);
        const st = (payout.status || "UNPAID").toUpperCase();

        totalEarnings += amount;
        if (st === "PAID") {
          paidPayout += amount;
        } else if (st !== "CANCELLED") {
          pendingPayout += amount;
        }
      });

      const liveStats = {
        totalDonors: donors.length,
        totalEggDonors: eggCount,
        totalSpermDonors: spermCount,
        approvedDonors: approvedCount,
        totalEarnings,
        pendingPayout,
        paidPayout,
      };

      return NextResponse.json({ success: true, agent: { ...agent, liveStats }, donors });
    }

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { fullName: { $regex: safeSearch, $options: "i" } },
        { agentCode: { $regex: safeSearch, $options: "i" } },
        { mobileNumber: { $regex: safeSearch, $options: "i" } },
        { agencyName: { $regex: safeSearch, $options: "i" } },
        { city: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const total = await Agent.countDocuments(query);
    const rawAgents = await Agent.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Attach live referred donor stats
    const agents = await Promise.all(
      rawAgents.map(async (ag: any) => {
        const safeAgCode = escapeRegex(ag.agentCode);
        const agentFilter = {
          $or: [
            { agentCode: new RegExp(`^${safeAgCode}$`, "i") },
            { agentId: ag._id },
            { "referral.patientOrDonorId": new RegExp(`^${safeAgCode}$`, "i") },
            { "referral.otherSourceDetails": new RegExp(safeAgCode, "i") },
          ]
        };

        const [mainDonors, spermDonors, eggDonors] = await Promise.all([
          DonorRegistration.find(agentFilter).select("registrationId donorType status agentPayout").lean(),
          SpermDonorRegistration.find(agentFilter).select("registrationId donorType status agentPayout").lean(),
          EggDonorRegistration.find(agentFilter).select("registrationId donorType status agentPayout").lean(),
        ]);

        const donorMap = new Map();
        [...mainDonors, ...spermDonors, ...eggDonors].forEach((d: any) => {
          const key = d.registrationId || String(d._id);
          if (!donorMap.has(key)) {
            donorMap.set(key, d);
          } else {
            const existing = donorMap.get(key);
            const existingSt = (existing.agentPayout?.status || "UNPAID").toUpperCase();
            const newSt = (d.agentPayout?.status || "UNPAID").toUpperCase();
            let preferredPayout = d.agentPayout || existing.agentPayout;
            if (existingSt === "PAID" && newSt !== "PAID") {
              preferredPayout = existing.agentPayout;
            } else if (newSt === "PAID") {
              preferredPayout = d.agentPayout;
            }
            donorMap.set(key, {
              ...existing,
              ...d,
              agentPayout: preferredPayout
            });
          }
        });

        const donors = Array.from(donorMap.values());

        let eggCount = 0;
        let spermCount = 0;
        let approvedCount = 0;
        let totalEarnings = 0;
        let pendingPayout = 0;
        let paidPayout = 0;

        donors.forEach((d: any) => {
          const isEgg = d.donorType === "egg";
          if (isEgg) eggCount++;
          else spermCount++;

          if (d.status === "APPROVED") approvedCount++;

          const payout = d.agentPayout || {};
          const amount = Number(payout.amount) > 0 ? Number(payout.amount) : (isEgg ? ag.commissionRates?.eggDonorCommission || 5000 : ag.commissionRates?.spermDonorCommission || 2000);
          const payoutStatus = (payout.status || "UNPAID").toUpperCase();

          totalEarnings += amount;
          if (payoutStatus === "PAID") {
            paidPayout += amount;
          } else if (payoutStatus !== "CANCELLED") {
            pendingPayout += amount;
          }
        });

        return {
          ...ag,
          liveStats: {
            totalDonors: donors.length,
            totalEggDonors: eggCount,
            totalSpermDonors: spermCount,
            approvedDonors: approvedCount,
            totalEarnings,
            pendingPayout,
            paidPayout,
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      agents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    console.error("[ADMIN AGENTS API GET ERROR]", error);
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
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      fullName,
      mobileNumber,
      email,
      agencyName,
      city,
      state,
      commissionRates,
      bankDetails,
      notes
    } = body;

    if (!fullName?.trim() || !mobileNumber?.trim()) {
      return NextResponse.json({ success: false, error: "Full Name and Mobile Phone are required." }, { status: 400 });
    }

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, "").slice(-10);
    if (cleanMobile.length < 10) {
      return NextResponse.json({ success: false, error: "Please provide a valid 10-digit mobile phone number." }, { status: 400 });
    }

    // Check if agent with this mobile already exists
    const existing = await Agent.findOne({ mobileNumber: cleanMobile });
    if (existing) {
      return NextResponse.json({
        success: false,
        error: `Agent already registered with mobile +91 ${cleanMobile} (${existing.fullName} - Code: ${existing.agentCode})`
      }, { status: 409 });
    }

    const nextCode = await generateNextAgentCode();

    const newAgent = await Agent.create({
      agentCode: nextCode,
      fullName: fullName.trim(),
      mobileNumber: cleanMobile,
      email: email?.trim() || "",
      agencyName: agencyName?.trim() || "",
      city: city?.trim() || "",
      state: state?.trim() || "",
      commissionRates: {
        eggDonorCommission: Number(commissionRates?.eggDonorCommission) || 5000,
        spermDonorCommission: Number(commissionRates?.spermDonorCommission) || 2000,
      },
      bankDetails: {
        accountHolderName: bankDetails?.accountHolderName?.trim() || fullName.trim(),
        bankName: bankDetails?.bankName?.trim() || "",
        accountNumber: bankDetails?.accountNumber?.trim() || "",
        ifscCode: bankDetails?.ifscCode?.trim()?.toUpperCase() || "",
        upiId: bankDetails?.upiId?.trim() || "",
      },
      notes: notes?.trim() || "",
      status: "ACTIVE",
    });

    return NextResponse.json({
      success: true,
      message: `Agent onboarded successfully with code ${nextCode}`,
      agent: newAgent
    }, { status: 201 });
  } catch (error: any) {
    console.error("[ADMIN AGENTS API POST ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in." }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const {
      action,
      agentId,
      status,
      commissionRates,
      bankDetails,
      fullName,
      mobileNumber,
      email,
      agencyName,
      city,
      state,
      donorRegistrationId,
      payoutStatus,
      paymentReference,
      payoutAmount,
      notes
    } = body;

    // Action: Update Agent Profile / Status / Commission / Bank Details
    if (action === "update_agent" && agentId) {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (commissionRates) updateData.commissionRates = commissionRates;
      if (bankDetails) updateData.bankDetails = bankDetails;
      if (fullName?.trim()) updateData.fullName = fullName.trim();
      if (mobileNumber?.trim()) updateData.mobileNumber = mobileNumber.replace(/[^0-9]/g, "").slice(-10);
      if (email !== undefined) updateData.email = email.trim();
      if (agencyName !== undefined) updateData.agencyName = agencyName.trim();
      if (city !== undefined) updateData.city = city.trim();
      if (state !== undefined) updateData.state = state.trim();
      if (notes !== undefined) updateData.notes = notes;

      const updatedAgent = await Agent.findByIdAndUpdate(agentId, { $set: updateData }, { new: true });
      if (!updatedAgent) {
        return NextResponse.json({ success: false, error: "Agent not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Agent profile updated successfully", agent: updatedAgent });
    }

    // Action: Process Donor Commission Payout
    if (action === "process_payout" && donorRegistrationId) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(donorRegistrationId);
      const donorQuery = {
        $or: [
          { registrationId: donorRegistrationId },
          ...(isValidObjectId ? [{ _id: new mongoose.Types.ObjectId(donorRegistrationId) }] : [])
        ]
      };

      const normalizedStatus = (payoutStatus || "PAID").toUpperCase();
      const isPaid = normalizedStatus === "PAID";

      const payoutData: any = {
        amount: Number(payoutAmount) > 0 ? Number(payoutAmount) : 2000,
        status: normalizedStatus,
        paidAt: isPaid ? new Date() : null,
        paymentReference: paymentReference?.trim() || "",
        notes: notes?.trim() || (isPaid ? "Marked as Paid by Admin" : "Marked as Unpaid by Admin")
      };

      // 1. Locate donor in any of the 3 collections to resolve registrationId
      let donor = await DonorRegistration.findOne(donorQuery).lean() ||
                  await SpermDonorRegistration.findOne(donorQuery).lean() ||
                  await EggDonorRegistration.findOne(donorQuery).lean();

      if (!donor) {
        return NextResponse.json({ success: false, error: "Donor registration not found." }, { status: 404 });
      }

      const actualRegId = donor.registrationId;
      const syncCondition = actualRegId
        ? { $or: [{ registrationId: actualRegId }, { _id: donor._id }] }
        : donorQuery;

      // Update across all three collections simultaneously with updateMany so duplicates remain 100% in sync
      await Promise.all([
        DonorRegistration.updateMany(syncCondition, { $set: { agentPayout: payoutData } }),
        SpermDonorRegistration.updateMany(syncCondition, { $set: { agentPayout: payoutData } }),
        EggDonorRegistration.updateMany(syncCondition, { $set: { agentPayout: payoutData } }),
      ]);

      // 4. Recalculate Agent payout balance and live performance
      const targetAgentCode = body.agentCode || donor.agentCode;
      const targetAgentId = body.agentId || donor.agentId;

      let agent = null;
      if (targetAgentId && mongoose.Types.ObjectId.isValid(targetAgentId)) {
        agent = await Agent.findById(targetAgentId);
      }
      if (!agent && targetAgentCode) {
        const safeTargetCode = escapeRegex(targetAgentCode);
        agent = await Agent.findOne({
          $or: [
            { agentCode: new RegExp(`^${safeTargetCode}$`, "i") },
            { mobileNumber: targetAgentCode }
          ]
        });
      }

      let updatedLiveStats = null;
      if (agent) {
        const agentFilter = {
          $or: [
            { agentCode: new RegExp(`^${agent.agentCode}$`, "i") },
            { agentId: agent._id },
            { "referral.patientOrDonorId": new RegExp(`^${agent.agentCode}$`, "i") },
            { "referral.otherSourceDetails": new RegExp(agent.agentCode, "i") },
          ]
        };

        const [mainDonors, spermDonors, eggDonors] = await Promise.all([
          DonorRegistration.find(agentFilter).select("registrationId donorType status agentPayout").lean(),
          SpermDonorRegistration.find(agentFilter).select("registrationId donorType status agentPayout").lean(),
          EggDonorRegistration.find(agentFilter).select("registrationId donorType status agentPayout").lean(),
        ]);

        const donorMap = new Map();
        [...mainDonors, ...spermDonors, ...eggDonors].forEach((d: any) => {
          const key = d.registrationId || String(d._id);
          if (!donorMap.has(key)) {
            donorMap.set(key, d);
          } else {
            const existing = donorMap.get(key);
            const existingSt = (existing.agentPayout?.status || "UNPAID").toUpperCase();
            const newSt = (d.agentPayout?.status || "UNPAID").toUpperCase();
            let preferredPayout = d.agentPayout || existing.agentPayout;
            if (existingSt === "PAID" && newSt !== "PAID") {
              preferredPayout = existing.agentPayout;
            } else if (newSt === "PAID") {
              preferredPayout = d.agentPayout;
            }
            donorMap.set(key, {
              ...existing,
              ...d,
              agentPayout: preferredPayout
            });
          }
        });

        const allDonors = Array.from(donorMap.values());

        let eggCount = 0;
        let spermCount = 0;
        let approvedCount = 0;
        let totalEarnings = 0;
        let pendingPayout = 0;
        let paidPayout = 0;

        allDonors.forEach((d: any) => {
          const isEgg = d.donorType === "egg";
          if (isEgg) eggCount++;
          else spermCount++;

          if (d.status === "APPROVED") approvedCount++;

          const payout = d.agentPayout || {};
          const amount = Number(payout.amount) > 0 ? Number(payout.amount) : (isEgg ? agent.commissionRates?.eggDonorCommission || 5000 : agent.commissionRates?.spermDonorCommission || 2000);
          const st = (payout.status || "UNPAID").toUpperCase();

          totalEarnings += amount;
          if (st === "PAID") {
            paidPayout += amount;
          } else if (st !== "CANCELLED") {
            pendingPayout += amount;
          }
        });

        updatedLiveStats = {
          totalDonors: allDonors.length,
          totalEggDonors: eggCount,
          totalSpermDonors: spermCount,
          approvedDonors: approvedCount,
          totalEarnings,
          pendingPayout,
          paidPayout,
        };

        await Agent.findByIdAndUpdate(agent._id, {
          $set: {
            "stats.totalEggDonors": eggCount,
            "stats.totalSpermDonors": spermCount,
            "stats.approvedDonors": approvedCount,
            "stats.totalEarnings": totalEarnings,
            "stats.pendingPayout": pendingPayout,
            "stats.paidPayout": paidPayout,
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Payout status updated to ${normalizedStatus} successfully.`,
        payout: payoutData,
        stats: updatedLiveStats
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action or missing parameters." }, { status: 400 });
  } catch (error: any) {
    console.error("[ADMIN AGENTS API PATCH ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
