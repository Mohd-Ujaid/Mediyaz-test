import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Hospital } from "@/models/Hospital";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

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
      permissions.includes("VIEW_HOSPITALS") ||
      permissions.includes("VIEW_REGISTRATIONS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const sortBy = searchParams.get("sortBy") || "donors"; // "donors" | "received" | "deals" | "pending" | "name" | "rate"
    const order = searchParams.get("order") || "desc"; // "desc" | "asc"
    const cityFilter = searchParams.get("city") || "";

    // 1. Fetch all hospitals
    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const hospitalQuery: any = {};
    if (search) {
      const searchRegex = { $regex: escapeRegex(search), $options: "i" };
      hospitalQuery.$or = [
        { name: searchRegex },
        { shortName: searchRegex },
        { city: searchRegex },
        { contactPerson: searchRegex },
        { registrationNumber: searchRegex },
      ];
    }
    if (cityFilter && cityFilter !== "ALL") {
      hospitalQuery.city = { $regex: escapeRegex(cityFilter), $options: "i" };
    }

    const hospitals = await Hospital.find(hospitalQuery).lean();

    // Fetch all registrations with an assigned hospital from Egg and Sperm dedicated collections
    const [eggRegs, spermRegs] = await Promise.all([
      EggDonorRegistration.find({ assignedHospital: { $exists: true, $ne: null } })
        .select("registrationId donorId donorType personalInfo contactInfo clinicDeal donorDeal isDonorPaid status pickupDate recruitmentDate supplyDate assignedHospital createdAt")
        .lean(),
      SpermDonorRegistration.find({ assignedHospital: { $exists: true, $ne: null } })
        .select("registrationId donorId donorType personalInfo contactInfo clinicDeal donorDeal status pickupDate recruitmentDate supplyDate assignedHospital createdAt")
        .lean(),
    ]);

    // Consolidate unique registrations by registrationId (sperm overrides egg if same ID, which shouldn't happen)
    const registrationMap = new Map<string, any>();
    for (const r of eggRegs) {
      if (r.registrationId) registrationMap.set(r.registrationId, { ...r, donorType: "egg" });
    }
    for (const r of spermRegs) {
      if (r.registrationId) registrationMap.set(r.registrationId, { ...r, donorType: "sperm" });
    }

    const allAssignedRegs = Array.from(registrationMap.values());

    // Group registrations by assigned hospital ID
    const hospitalRegsMap = new Map<string, any[]>();
    for (const reg of allAssignedRegs) {
      const hospId = reg.assignedHospital ? reg.assignedHospital.toString() : "";
      if (!hospId) continue;
      if (!hospitalRegsMap.has(hospId)) {
        hospitalRegsMap.set(hospId, []);
      }
      hospitalRegsMap.get(hospId)!.push(reg);
    }

    // 3. Compute metrics for each hospital
    const hospitalLeaderboard = hospitals.map((hosp: any) => {
      const hospId = hosp._id.toString();
      const regs = hospitalRegsMap.get(hospId) || [];

      let totalDonorsSent = regs.length;
      let eggDonorsCount = 0;
      let spermDonorsCount = 0;
      let completedFilesCount = 0;
      let activePipelineCount = 0;
      let totalDealValue = 0;
      let totalPaymentReceived = 0;
      let fullyPaidDonorsCount = 0;

      const detailedDonors: any[] = [];

      for (const reg of regs) {
        const dType = reg.donorType || "egg";
        if (dType === "egg") eggDonorsCount++;
        else spermDonorsCount++;

        const st = reg.status || "APPROVED";
        if (["FILE_COMPLETED", "COMPLETED"].includes(st)) {
          completedFilesCount++;
        } else if (["APPROVED", "UNDER_REVIEW"].includes(st)) {
          activePipelineCount++;
        }

        const cat = reg.clinicDeal?.donorCategory || "normal";
        const dealPrice =
          Number(reg.clinicDeal?.hospitalDealPrice) ||
          (cat === "profile"
            ? hosp.profiledonorDealPrice || hosp.donorDealPrice || 85000
            : hosp.donorDealPrice || 65000);

        totalDealValue += dealPrice;

        const isHospPaid =
          reg.clinicDeal?.isPaymentReceived === true ||
          reg.clinicDeal?.paymentStatus === "RECEIVED";

        const recAmt = isHospPaid
          ? dealPrice
          : Number(reg.clinicDeal?.receivedAmount) || 0;

        totalPaymentReceived += recAmt;
        if (isHospPaid || recAmt >= dealPrice) {
          fullyPaidDonorsCount++;
        }

        detailedDonors.push({
          registrationId: reg.registrationId,
          donorId: reg.donorId || "N/A",
          donorName: reg.personalInfo?.fullName || "Donor",
          donorType: dType,
          bloodGroup: reg.personalInfo?.bloodGroup || "N/A",
          age: reg.personalInfo?.age || null,
          category: cat,
          status: st,
          dealPrice,
          paymentStatus: isHospPaid ? "RECEIVED" : (reg.clinicDeal?.paymentStatus || "PENDING"),
          receivedAmount: recAmt,
          paymentReference: reg.clinicDeal?.paymentReference || "",
          pickupDate: reg.pickupDate || "",
          recruitmentDate: reg.recruitmentDate || "",
          supplyDate: reg.supplyDate || "",
          assignedAt: reg.createdAt,
        });
      }

      // Sort detailed donors by latest assignment date
      detailedDonors.sort((a, b) => new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime());

      const pendingBalance = Math.max(0, totalDealValue - totalPaymentReceived);
      const collectionRate = totalDealValue > 0 ? Math.round((totalPaymentReceived / totalDealValue) * 100) : 0;

      return {
        _id: hospId,
        name: hosp.name,
        shortName: hosp.shortName || hosp.name,
        registrationNumber: hosp.registrationNumber || "",
        contactPerson: hosp.contactPerson || "",
        email: hosp.email || "",
        mobileNumber: hosp.mobileNumber || "",
        city: hosp.city || "",
        state: hosp.state || "",
        status: hosp.status || "ACTIVE",
        donorDealPrice: hosp.donorDealPrice || 0,
        profiledonorDealPrice: hosp.profiledonorDealPrice || 0,
        currency: hosp.currency || "INR",
        // Leaderboard Metrics
        totalDonorsSent,
        eggDonorsCount,
        spermDonorsCount,
        completedFilesCount,
        activePipelineCount,
        totalDealValue,
        totalPaymentReceived,
        pendingBalance,
        collectionRate,
        fullyPaidDonorsCount,
        recentDonors: detailedDonors.slice(0, 5),
        allDonors: detailedDonors,
      };
    });

    // 4. Sort leaderboard based on request
    hospitalLeaderboard.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "donors") {
        comparison = b.totalDonorsSent - a.totalDonorsSent;
        if (comparison === 0) comparison = b.totalPaymentReceived - a.totalPaymentReceived;
      } else if (sortBy === "received") {
        comparison = b.totalPaymentReceived - a.totalPaymentReceived;
      } else if (sortBy === "deals") {
        comparison = b.totalDealValue - a.totalDealValue;
      } else if (sortBy === "pending") {
        comparison = b.pendingBalance - a.pendingBalance;
      } else if (sortBy === "rate") {
        comparison = b.collectionRate - a.collectionRate;
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      }
      return order === "asc" ? -comparison : comparison;
    });

    // Assign Rank index (1-indexed)
    const rankedHospitals = hospitalLeaderboard.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // 5. Global KPI Aggregates
    let globalTotalDonors = 0;
    let globalTotalDealValue = 0;
    let globalTotalReceived = 0;
    let globalTotalPending = 0;
    let activeHospitalsCount = 0;

    for (const h of hospitalLeaderboard) {
      globalTotalDonors += h.totalDonorsSent;
      globalTotalDealValue += h.totalDealValue;
      globalTotalReceived += h.totalPaymentReceived;
      globalTotalPending += h.pendingBalance;
      if (h.totalDonorsSent > 0) activeHospitalsCount++;
    }

    const overallCollectionRate =
      globalTotalDealValue > 0 ? Math.round((globalTotalReceived / globalTotalDealValue) * 100) : 0;

    const stats = {
      totalHospitals: hospitals.length,
      activeHospitalsCount,
      globalTotalDonors,
      globalTotalDealValue,
      globalTotalReceived,
      globalTotalPending,
      overallCollectionRate,
      topHospital: rankedHospitals[0] || null,
    };

    return NextResponse.json({
      success: true,
      stats,
      hospitals: rankedHospitals,
    });
  } catch (error: any) {
    console.error("Error in GET /api/hospitals/leaderboard:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
