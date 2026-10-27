import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { formatDotDate } from "@/lib/invoice-utils";

function parseYearAndMonth(dateVal: any, fallbackDate: any = null): { year: number | null; month: number | null } {
  const tryParse = (d: any): { year: number | null; month: number | null } => {
    if (!d) return { year: null, month: null };
    if (typeof d === "string") {
      const trimmed = d.trim();
      if (trimmed.includes(".")) {
        const parts = trimmed.split(".");
        if (parts.length === 3) {
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (!isNaN(year) && !isNaN(month)) return { year, month };
        }
      }
      if (trimmed.includes("-")) {
        const parts = trimmed.split("-");
        if (parts.length >= 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          if (!isNaN(year) && !isNaN(month)) return { year, month };
        }
      }
    }
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) {
      return { year: dt.getFullYear(), month: dt.getMonth() + 1 };
    }
    return { year: null, month: null };
  };

  const res = tryParse(dateVal);
  if (res.year && res.month) return res;
  if (fallbackDate) return tryParse(fallbackDate);
  return { year: null, month: null };
}

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
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin or staff access required." }, { status: 403 });
    }

    await connectToDatabase();
    const _forceHosp = Hospital.modelName;

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const hospitalId = searchParams.get("hospitalId") || "";
    const donorType = searchParams.get("donorType") || "all"; // egg | sperm | all
    const statusParam = searchParams.get("status") || "ALL"; // ALL | RECEIVED/PAID | PENDING | PARTIAL
    const branchParam = searchParams.get("branch") || "ALL";
    const startDateParam = searchParams.get("startDate") || "";
    const endDateParam = searchParams.get("endDate") || "";
    const yearParam = searchParams.get("year") || "ALL";
    const monthParam = searchParams.get("month") || "ALL";

    const baseQuery: any = {
      $or: [
        { status: { $in: ["FILE_COMPLETED", "COMPLETED", "APPROVED"] } },
        { pickupDate: { $exists: true, $nin: ["", null] } },
        { isInvoiceGenerated: true },
        { "clinicDeal.isInvoiceGenerated": true },
        { invoiceNumber: { $exists: true, $nin: ["", null] } },
        { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
      ],
    };

    if (hospitalId && hospitalId !== "ALL") {
      if (mongoose.Types.ObjectId.isValid(hospitalId)) {
        baseQuery.assignedHospital = new mongoose.Types.ObjectId(hospitalId);
      } else {
        baseQuery.assignedHospital = hospitalId;
      }
    }

    // Search query
    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    let orClauses: any[] = [];
    if (search) {
      const searchRegex = { $regex: escapeRegex(search), $options: "i" };
      const matchedHospitals = await Hospital.find({
        $or: [{ name: searchRegex }, { shortName: searchRegex }, { city: searchRegex }, { code: searchRegex }],
      }).select("_id").lean();
      const matchedHospIds = matchedHospitals.map((h) => h._id);

      orClauses = [
        { registrationId: searchRegex },
        { donorId: searchRegex },
        { "personalInfo.fullName": searchRegex },
        { "personalInfo.husbandName": searchRegex },
      ];

      if (matchedHospIds.length > 0) {
        orClauses.push({ assignedHospital: { $in: matchedHospIds } });
      }
    }

    const queryEgg = { ...baseQuery };
    const querySperm = { ...baseQuery };
    if (orClauses.length > 0) {
      queryEgg.$or = orClauses;
      querySperm.$or = orClauses;
    }

    const ledgerFields =
      "_id registrationId donorId donorType status personalInfo.fullName contactInfo.mobileNumber assignedHospital assignedBranch assignedBranchId pickupLocation opuLocation clinicDeal donorDeal isInvoiceGenerated invoiceNumber invoiceDate pickupDate isDonorPaid paidAt createdAt updatedAt";
    const hospitalFields =
      "name shortName code city state address addressLine1 gstNumber branches eggDonorDealPrice eggProfileDonorDealPrice profiledonorDealPrice donorDealPrice spermDonorDealPrice spermProfileDonorDealPrice";

    // Fetch records
    let rawRecords: any[] = [];
    if (donorType === "egg" || donorType === "all") {
      const eggs = await EggDonorRegistration.find(queryEgg)
        .select(ledgerFields)
        .populate("assignedHospital", hospitalFields)
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
      rawRecords = rawRecords.concat(eggs.map((e) => ({ ...e, donorType: "egg" })));
    }
    if (donorType === "sperm" || donorType === "all") {
      const sperms = await SpermDonorRegistration.find(querySperm)
        .select(ledgerFields)
        .populate("assignedHospital", hospitalFields)
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
      rawRecords = rawRecords.concat(sperms.map((s) => ({ ...s, donorType: "sperm" })));
    }

    rawRecords.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // 1. Map into Clinic Ledger Entries (Include donors where clinic is assigned and either pickupDate is entered, invoice is generated, or file is completed)
    const invoicedClinicRecords = rawRecords.filter((r: any) => {
      const hasHospital = Boolean(r.assignedHospital);
      const hasPickup = Boolean(r.pickupDate && String(r.pickupDate).trim() !== "");
      const isCompleted = r.status === "FILE_COMPLETED" || r.status === "COMPLETED";
      const hasInvoice = Boolean(
        r.clinicDeal?.isInvoiceGenerated === true ||
        r.isInvoiceGenerated === true ||
        (r.clinicDeal?.invoiceNumber && r.clinicDeal.invoiceNumber.trim() !== "") ||
        (r.invoiceNumber && r.invoiceNumber.trim() !== "")
      );
      return hasHospital && (hasPickup || hasInvoice || isCompleted);
    });

    let sNoCounter = 1;
    const clinicEntries = invoicedClinicRecords.map((r: any) => {
      const hosp = typeof r.assignedHospital === "object" ? r.assignedHospital : null;
      const clinicDeal = r.clinicDeal || {};
      const isSperm = r.donorType === "sperm";
      const category = clinicDeal.donorCategory || r.donorDeal?.donorCategory || "normal";
      const defaultHospPrice = hosp
        ? isSperm
          ? category === "profile"
            ? hosp.spermProfileDonorDealPrice || 25000
            : hosp.spermDonorDealPrice || 15000
          : category === "profile"
          ? hosp.eggProfileDonorDealPrice || hosp.profiledonorDealPrice || 85000
          : hosp.eggDonorDealPrice || hosp.donorDealPrice || 65000
        : isSperm
        ? (category === "profile" ? 25000 : 15000)
        : (category === "profile" ? 85000 : 65000);

      const dealPrice =
        clinicDeal.totalAmount ||
        clinicDeal.hospitalDealPrice ||
        defaultHospPrice;

      const serviceCharge =
        clinicDeal.serviceCharge && Number(clinicDeal.serviceCharge) > 0
          ? Number(clinicDeal.serviceCharge)
          : hosp?.serviceCharge && Number(hosp.serviceCharge) > 0
          ? Number(hosp.serviceCharge)
          : isSperm
          ? 3000
          : 5000;

      // 18% GST applies to Service Charge (SAC 999321)
      const gstAmount =
        clinicDeal.gstAmount && Number(clinicDeal.gstAmount) > 0
          ? Number(clinicDeal.gstAmount)
          : Math.round(serviceCharge * 0.18);

      const paymentsList: any[] = Array.isArray(clinicDeal.payments) ? clinicDeal.payments : [];
      let receivedAmount = 0;
      let tdsAmount = 0;

      if (paymentsList.length > 0) {
        receivedAmount = paymentsList.reduce((acc: number, p: any) => acc + Number(p.netAmount ?? p.amount ?? 0), 0);
        tdsAmount = paymentsList.reduce((acc: number, p: any) => acc + Number(p.tdsAmount ?? 0), 0);
      } else {
        receivedAmount = Number(clinicDeal.receivedAmount || 0);
        tdsAmount = Number(clinicDeal.tdsAmount || clinicDeal.tdsTotal || 0);
      }

      const tdsPercentage =
        clinicDeal.tdsPercentage && Number(clinicDeal.tdsPercentage) > 0
          ? Number(clinicDeal.tdsPercentage)
          : hosp?.tdsPercentage && Number(hosp.tdsPercentage) > 0
          ? Number(hosp.tdsPercentage)
          : (dealPrice > 0 && tdsAmount > 0 ? Math.round((tdsAmount / dealPrice) * 100) : 2);

      const totalSettled = receivedAmount + tdsAmount;
      const isReceived =
        clinicDeal.isPaymentReceived === true ||
        clinicDeal.paymentStatus === "RECEIVED" ||
        (dealPrice > 0 && totalSettled >= dealPrice);

      const isPartial =
        !isReceived &&
        (clinicDeal.paymentStatus === "PARTIALLY_RECEIVED" ||
          (totalSettled > 0 && totalSettled < dealPrice));

      const finalReceived = isReceived ? (receivedAmount || dealPrice) : receivedAmount;
      const creditAmount = finalReceived;
      const pendingAmount = isReceived ? 0 : Math.max(0, dealPrice - (finalReceived + tdsAmount));
      const netAmount = dealPrice;

      const paymentStatus: "RECEIVED" | "PENDING" | "PARTIALLY_RECEIVED" = isReceived
        ? "RECEIVED"
        : isPartial
        ? "PARTIALLY_RECEIVED"
        : "PENDING";

      const numOnly = r.registrationId?.replace(/\D/g, "");
      const autoInvNum = numOnly ? `INV-${numOnly.slice(-3)}` : "INV-054";
      const invoiceNumber = (clinicDeal.invoiceNumber || r.invoiceNumber || autoInvNum).trim();
      const invoiceDate = clinicDeal.invoiceDate
        ? formatDotDate(clinicDeal.invoiceDate)
        : r.invoiceDate
        ? formatDotDate(r.invoiceDate)
        : (r.pickupDate ? formatDotDate(r.pickupDate) : (r.createdAt ? formatDotDate(r.createdAt) : "-"));

      const opuDateStr = r.pickupDate ? formatDotDate(r.pickupDate) : "-";
      const opuLocationStr = r.opuLocation || r.pickupLocation || hosp?.shortName || hosp?.name || "-";
      const hospitalLocationStr = hosp
        ? [hosp.city, hosp.state].filter(Boolean).join(", ") || hosp.address || hosp.city || "-"
        : "-";

      const creditDateStr = clinicDeal.receivedAt
        ? formatDotDate(clinicDeal.receivedAt)
        : (clinicDeal.receivedDate ? formatDotDate(clinicDeal.receivedDate) : isReceived ? (r.pickupDate ? formatDotDate(r.pickupDate) : "-") : "-");

      const recruitmentDateStr = r.recruitmentDate
        ? formatDotDate(r.recruitmentDate)
        : (r.createdAt ? formatDotDate(r.createdAt) : "-");
      const supplyDateStr = r.supplyDate
        ? formatDotDate(r.supplyDate)
        : (r.pickupDate ? formatDotDate(r.pickupDate) : "-");

      const assignedBranchStr = r.assignedBranch || clinicDeal.assignedBranch || hosp?.branches?.[0]?.branchName || "";
      const { year: parsedYear, month: parsedMonth } = parseYearAndMonth(
        clinicDeal.invoiceDate || r.invoiceDate,
        r.pickupDate || r.createdAt
      );

      return {
        _id: r._id?.toString() || r.registrationId,
        sNo: sNoCounter++,
        donorName: r.personalInfo?.fullName || "Donor",
        registrationId: r.registrationId,
        clinicName: hosp?.name || "Unassigned ART Clinic",
        hospitalName: hosp?.name || "Unassigned ART Clinic",
        location: hospitalLocationStr,
        hospitalLocation: hospitalLocationStr,
        hospitalCity: hosp?.city || "",
        donorOpuLocation: opuLocationStr,
        opuLocation: opuLocationStr,
        donorOpuDate: opuDateStr,
        opuDate: opuDateStr,
        pickupDate: opuDateStr,
        invoiceDate,
        invoiceNumber,
        amount: dealPrice,
        dealPrice,
        serviceCharge,
        donorReimbursement: Math.max(0, dealPrice - serviceCharge),
        assignedHospital: hosp,
        assignedBranch: assignedBranchStr,
        assignedBranchId: r.assignedBranchId || "",
        parsedYear,
        parsedMonth,
        tdsPercentage,
        tdsAmount,
        gstAmount,
        netAmount,
        creditDate: creditDateStr,
        receivedDate: creditDateStr,
        creditAmount,
        receivedAmount,
        pendingAmount,
        paymentStatus,
        paymentRef: clinicDeal.paymentReference || "",
        donorId: r.donorId || r.registrationId,
        donorType: r.donorType as "egg" | "sperm",
        hospitalId: hosp?._id?.toString() || "",
        hospitalCode: hosp?.code || "",
        recruitmentDate: recruitmentDateStr,
        supplyDate: supplyDateStr,
        date: opuDateStr !== "-" ? opuDateStr : invoiceDate,
      };
    });

    // 2. Map into Donor Ledger Entries
    let donorSNoCounter = 1;
    const donorEntries = rawRecords.map((r: any) => {
      const hosp = typeof r.assignedHospital === "object" ? r.assignedHospital : null;
      const donorDeal = r.donorDeal || {};
      const clinicDeal = r.clinicDeal || {};
      const category = donorDeal.donorCategory || clinicDeal.donorCategory || "normal";
      const isSperm = r.donorType === "sperm";

      const compensationAmount =
        donorDeal.compensationAmount ||
        clinicDeal.donorReimbursement ||
        (clinicDeal.hospitalDealPrice && clinicDeal.serviceCharge
          ? Math.max(0, clinicDeal.hospitalDealPrice - clinicDeal.serviceCharge)
          : category === "profile"
          ? isSperm ? 10000 : 60000
          : isSperm ? 5000 : 55000);

      const isPaid = r.isDonorPaid === true || donorDeal.paymentStatus === "PAID";
      const isPartial =
        !isPaid &&
        (donorDeal.paymentStatus === "PARTIALLY_PAID" ||
          (donorDeal.advanceAmount && donorDeal.advanceAmount > 0));

      const paidAmount = isPaid
        ? compensationAmount
        : donorDeal.advanceAmount || 0;

      const balancePending = isPaid ? 0 : Math.max(0, compensationAmount - paidAmount);

      const paymentStatus: "PAID" | "PENDING" | "PARTIALLY_PAID" = isPaid
        ? "PAID"
        : isPartial
        ? "PARTIALLY_PAID"
        : "PENDING";

      const dateStr = r.pickupDate ? formatDotDate(r.pickupDate) : formatDotDate(r.createdAt || new Date());
      const paidAtStr = donorDeal.paidAt || r.paidAt ? formatDotDate(donorDeal.paidAt || r.paidAt) : undefined;
      const { year: parsedYear, month: parsedMonth } = parseYearAndMonth(
        r.pickupDate,
        r.createdAt
      );

      return {
        _id: r._id?.toString() || r.registrationId,
        sNo: donorSNoCounter++,
        registrationId: r.registrationId,
        donorId: r.donorId || r.registrationId,
        donorName: r.personalInfo?.fullName || "Donor",
        donorType: r.donorType as "egg" | "sperm",
        hospitalId: hosp?._id?.toString() || "",
        hospitalName: hosp?.name || "Unassigned ART Clinic",
        compensationAmount,
        advanceAmount: donorDeal.advanceAmount || 0,
        paidAmount,
        balancePending,
        paymentMethod: donorDeal.paymentMethod || "bank_transfer",
        paymentStatus,
        date: dateStr,
        paidAt: paidAtStr,
        paymentRef: donorDeal.paymentReference || "",
        parsedYear,
        parsedMonth,
      };
    });

    // Apply status filter if set
    let filteredClinicEntries = clinicEntries;
    if (statusParam === "RECEIVED" || statusParam === "PAID") {
      filteredClinicEntries = clinicEntries.filter((e) => e.paymentStatus === "RECEIVED");
    } else if (statusParam === "PENDING") {
      filteredClinicEntries = clinicEntries.filter((e) => e.paymentStatus === "PENDING");
    } else if (statusParam === "PARTIAL") {
      filteredClinicEntries = clinicEntries.filter((e) => e.paymentStatus === "PARTIALLY_RECEIVED");
    }

    // Filter by branch if selected
    if (branchParam && branchParam !== "ALL") {
      const bLower = branchParam.toLowerCase().trim();
      filteredClinicEntries = filteredClinicEntries.filter((e) =>
        (e.assignedBranch && e.assignedBranch.toLowerCase().includes(bLower)) ||
        (e.donorOpuLocation && e.donorOpuLocation.toLowerCase().includes(bLower)) ||
        (e.opuLocation && e.opuLocation.toLowerCase().includes(bLower)) ||
        (e.location && e.location.toLowerCase().includes(bLower)) ||
        (e.hospitalLocation && e.hospitalLocation.toLowerCase().includes(bLower)) ||
        (e.hospitalCity && e.hospitalCity.toLowerCase().includes(bLower))
      );
    }

    // Filter by Year if selected
    if (yearParam && yearParam !== "ALL") {
      const targetYear = parseInt(yearParam, 10);
      filteredClinicEntries = filteredClinicEntries.filter((e) => e.parsedYear === targetYear);
    }

    // Filter by Month if selected
    if (monthParam && monthParam !== "ALL") {
      const targetMonth = parseInt(monthParam, 10);
      filteredClinicEntries = filteredClinicEntries.filter((e) => e.parsedMonth === targetMonth);
    }

    // Filter by date range if provided
    if (startDateParam || endDateParam) {
      const parseEntryTime = (dStr?: string) => {
        if (!dStr || dStr === "-") return null;
        if (dStr.includes(".")) {
          const parts = dStr.split(".");
          if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
          }
        }
        const t = new Date(dStr).getTime();
        return isNaN(t) ? null : t;
      };

      const startMs = startDateParam ? new Date(startDateParam).setHours(0, 0, 0, 0) : null;
      const endMs = endDateParam ? new Date(endDateParam).setHours(23, 59, 59, 999) : null;

      filteredClinicEntries = filteredClinicEntries.filter((e) => {
        const t = parseEntryTime(e.pickupDate) || parseEntryTime(e.opuDate) || parseEntryTime(e.invoiceDate) || parseEntryTime(e.date);
        if (!t) return true;
        if (startMs && t < startMs) return false;
        if (endMs && t > endMs) return false;
        return true;
      });
    }

    // Re-index S.No
    filteredClinicEntries = filteredClinicEntries.map((e, idx) => ({ ...e, sNo: idx + 1 }));

    let filteredDonorEntries = donorEntries;
    if (statusParam === "RECEIVED" || statusParam === "PAID") {
      filteredDonorEntries = donorEntries.filter((e) => e.paymentStatus === "PAID");
    } else if (statusParam === "PENDING") {
      filteredDonorEntries = donorEntries.filter((e) => e.paymentStatus === "PENDING");
    } else if (statusParam === "PARTIAL") {
      filteredDonorEntries = donorEntries.filter((e) => e.paymentStatus === "PARTIALLY_PAID");
    }

    // Filter donor by Year if selected
    if (yearParam && yearParam !== "ALL") {
      const targetYear = parseInt(yearParam, 10);
      filteredDonorEntries = filteredDonorEntries.filter((e) => e.parsedYear === targetYear);
    }

    // Filter donor by Month if selected
    if (monthParam && monthParam !== "ALL") {
      const targetMonth = parseInt(monthParam, 10);
      filteredDonorEntries = filteredDonorEntries.filter((e) => e.parsedMonth === targetMonth);
    }

    // Calculate Available Years dynamically
    const yearsSet = new Set<number>();
    clinicEntries.forEach((e) => {
      if (e.parsedYear) yearsSet.add(e.parsedYear);
    });
    donorEntries.forEach((e) => {
      if (e.parsedYear) yearsSet.add(e.parsedYear);
    });
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear());
    }
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Totals calculations
    const totalClinicDeal = filteredClinicEntries.reduce((sum, e) => sum + (e.dealPrice || e.amount || 0), 0);
    const totalClinicTds = filteredClinicEntries.reduce((sum, e) => sum + (e.tdsAmount || 0), 0);
    const totalClinicGst = filteredClinicEntries.reduce((sum, e) => sum + (e.gstAmount || 0), 0);
    const totalClinicNet = filteredClinicEntries.reduce((sum, e) => sum + (e.netAmount || 0), 0);
    const totalClinicRecv = filteredClinicEntries.reduce((sum, e) => sum + (e.creditAmount || e.receivedAmount || 0), 0);
    const totalClinicPend = filteredClinicEntries.reduce((sum, e) => sum + (e.pendingAmount || 0), 0);

    const clinicTotals = {
      totalRecords: filteredClinicEntries.length,
      totalDealPrice: totalClinicDeal,
      totalAmount: totalClinicDeal,
      totalTdsAmount: totalClinicTds,
      totalGstAmount: totalClinicGst,
      totalNetAmount: totalClinicNet,
      totalReceived: totalClinicRecv,
      totalCreditAmount: totalClinicRecv,
      totalPending: totalClinicPend,
      collectionRate:
        totalClinicNet > 0
          ? Math.round((totalClinicRecv / totalClinicNet) * 100)
          : totalClinicDeal > 0
          ? Math.round((totalClinicRecv / totalClinicDeal) * 100)
          : 0,
    };

    const donorTotals = {
      totalDonors: filteredDonorEntries.length,
      totalCompensation: filteredDonorEntries.reduce((sum, e) => sum + e.compensationAmount, 0),
      totalPaid: filteredDonorEntries.reduce((sum, e) => sum + e.paidAmount, 0),
      totalPending: filteredDonorEntries.reduce((sum, e) => sum + e.balancePending, 0),
      settlementRate:
        filteredDonorEntries.reduce((sum, e) => sum + e.compensationAmount, 0) > 0
          ? Math.round(
              (filteredDonorEntries.reduce((sum, e) => sum + e.paidAmount, 0) /
                filteredDonorEntries.reduce((sum, e) => sum + e.compensationAmount, 0)) *
                100
            )
          : 0,
    };

    // Grouping by clinic for Clinic Accounts View
    const clinicAccountsMap: Record<
      string,
      {
        hospitalId: string;
        hospitalName: string;
        hospitalCode: string;
        city: string;
        totalCases: number;
        totalDealPrice: number;
        totalReceived: number;
        totalPending: number;
        collectionRate: number;
        items: any[];
      }
    > = {};

    filteredClinicEntries.forEach((entry) => {
      const hId = entry.hospitalId || "unassigned";
      if (!clinicAccountsMap[hId]) {
        clinicAccountsMap[hId] = {
          hospitalId: hId,
          hospitalName: entry.hospitalName,
          hospitalCode: entry.hospitalCode || "",
          city: entry.hospitalCity || "",
          totalCases: 0,
          totalDealPrice: 0,
          totalReceived: 0,
          totalPending: 0,
          collectionRate: 0,
          items: [],
        };
      }
      clinicAccountsMap[hId].totalCases++;
      clinicAccountsMap[hId].totalDealPrice += entry.dealPrice;
      clinicAccountsMap[hId].totalReceived += entry.receivedAmount;
      clinicAccountsMap[hId].totalPending += entry.pendingAmount;
      clinicAccountsMap[hId].items.push(entry);
    });

    const clinicAccounts = Object.values(clinicAccountsMap).map((c) => ({
      ...c,
      collectionRate: c.totalDealPrice > 0 ? Math.round((c.totalReceived / c.totalDealPrice) * 100) : 0,
    }));
    clinicAccounts.sort((a, b) => b.totalDealPrice - a.totalDealPrice);

    // Fetch all hospitals with their branches for branch filtering
    const allHospitals = await Hospital.find({}).select("name shortName branches code").lean();

    return NextResponse.json({
      success: true,
      hospitals: allHospitals,
      availableYears,
      clinicLedger: {
        entries: filteredClinicEntries,
        totals: clinicTotals,
        clinicAccounts,
      },
      donorLedger: {
        entries: filteredDonorEntries,
        totals: donorTotals,
      },
    });
  } catch (error: any) {
    console.error("[LEDGER_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load ledger records" },
      { status: 500 }
    );
  }
}

// PATCH handler to update payment from clinic or payout to donor
export async function PATCH(req: Request) {
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
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin or staff access required." }, { status: 403 });
    }

    const userName = session.user?.name || session.user?.email || "Admin";
    const body = await req.json();
    const {
      registrationId,
      donorType = "egg",
      target = "clinic",
      status,
      amount,
      reference,
      method,
      notes,
      invoiceNumber,
      invoiceDate,
      receivedDate,
      tdsPercentage,
      tdsAmount,
      dealPrice: reqDealPrice,
    } = body;

    if (!registrationId) {
      return NextResponse.json({ success: false, error: "registrationId is required" }, { status: 400 });
    }

    await connectToDatabase();
    let targetModel: any = donorType === "sperm" ? SpermDonorRegistration : EggDonorRegistration;
    let existing = await targetModel.findOne({ registrationId });

    if (!existing) {
      const opposite = donorType === "sperm" ? EggDonorRegistration : SpermDonorRegistration;
      existing = await opposite.findOne({ registrationId });
      if (existing) targetModel = opposite;
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    const updatePayload: any = {
      updatedBy: userName,
      updatedAt: new Date(),
    };

    if (target === "clinic") {
      const prevClinic = existing.clinicDeal || {};
      const dealPrice =
        reqDealPrice !== undefined && Number(reqDealPrice) > 0
          ? Number(reqDealPrice)
          : prevClinic.hospitalDealPrice || 65000;

      const tdsRate =
        tdsPercentage !== undefined && tdsPercentage !== null
          ? Number(tdsPercentage)
          : prevClinic.tdsPercentage !== undefined
          ? Number(prevClinic.tdsPercentage)
          : 2;

      const computedTdsAmt =
        tdsAmount !== undefined && tdsAmount !== null
          ? Number(tdsAmount)
          : Math.round(dealPrice * (tdsRate / 100));

      const serviceCharge = prevClinic.serviceCharge || 5000;
      const gstAmount = prevClinic.gstAmount || Math.round(serviceCharge * 0.18);
      const netReceivable = Math.max(0, dealPrice - computedTdsAmt + gstAmount);

      const isPaid = status === "RECEIVED" || status === "PAID";
      const recAmount =
        amount !== undefined
          ? Number(amount)
          : isPaid
          ? netReceivable
          : prevClinic.receivedAmount || 0;

      const paymentStatus =
        isPaid || recAmount >= netReceivable
          ? "RECEIVED"
          : recAmount > 0
          ? "PARTIALLY_RECEIVED"
          : "PENDING";

      const parsedReceivedDate = receivedDate
        ? new Date(receivedDate)
        : paymentStatus === "RECEIVED"
        ? prevClinic.receivedAt || new Date()
        : prevClinic.receivedAt || null;

      const parsedInvoiceDate = invoiceDate
        ? new Date(invoiceDate)
        : prevClinic.invoiceDate || null;

      updatePayload.clinicDeal = {
        ...prevClinic,
        hospitalDealPrice: dealPrice,
        isPaymentReceived: paymentStatus === "RECEIVED",
        paymentStatus,
        receivedAmount: recAmount,
        receivedAt: parsedReceivedDate,
        invoiceNumber: invoiceNumber !== undefined ? invoiceNumber : prevClinic.invoiceNumber || "",
        invoiceDate: parsedInvoiceDate,
        tdsPercentage: tdsRate,
        tdsAmount: computedTdsAmt,
        paymentReference: reference !== undefined ? reference : prevClinic.paymentReference || "",
        notes: notes !== undefined ? notes : prevClinic.notes || "",
      };
    } else if (target === "donor") {
      const prevDonor = existing.donorDeal || {};
      const compAmount = prevDonor.compensationAmount || 40000;
      const isPaid = status === "PAID";
      const paidAmount = amount !== undefined ? Number(amount) : isPaid ? compAmount : prevDonor.advanceAmount || 0;
      const paymentStatus = isPaid || paidAmount >= compAmount ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "PENDING";
      const payDate = receivedDate ? new Date(receivedDate) : new Date();

      const existingPayments: any[] = Array.isArray(prevDonor.payments) ? [...prevDonor.payments] : [];
      if (paidAmount > 0) {
        existingPayments.push({
          amount: paidAmount,
          date: payDate,
          method: method || prevDonor.paymentMethod || "bank_transfer",
          reference: reference !== undefined ? reference : prevDonor.paymentReference || "",
          notes: notes || "",
          paidBy: userName,
        });
      }

      updatePayload.donorDeal = {
        ...prevDonor,
        paymentStatus,
        advanceAmount: paymentStatus === "PARTIALLY_PAID" ? paidAmount : 0,
        balanceAmount: paymentStatus === "PAID" ? 0 : Math.max(0, compAmount - paidAmount),
        paymentMethod: method || prevDonor.paymentMethod || "bank_transfer",
        paymentReference: reference !== undefined ? reference : prevDonor.paymentReference || "",
        paidAt: paymentStatus === "PAID" ? payDate : prevDonor.paidAt || null,
        paidBy: userName,
        payments: existingPayments,
      };
      updatePayload.isDonorPaid = paymentStatus === "PAID";
      updatePayload.paidAt = paymentStatus === "PAID" ? payDate : null;
      updatePayload.paidBy = paymentStatus === "PAID" ? userName : null;
    }

    await targetModel.updateOne({ registrationId }, { $set: updatePayload });

    return NextResponse.json({
      success: true,
      message: `${target === "clinic" ? "Clinic" : "Donor"} ledger transaction updated successfully`,
    });
  } catch (error: any) {
    console.error("[LEDGER_PATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update ledger transaction" },
      { status: 500 }
    );
  }
}
