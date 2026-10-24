import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { formatDotDate } from "@/lib/invoice-utils";
import {
  getFinancialYear,
  getIndianQuarter,
  calculateGst,
  parseDateSafe,
  generateBillRef,
} from "@/lib/tax-finance-utils";

function parseYearAndMonth(dateVal: any, fallbackDate?: any): { year: number; month: number } {
  const tryVal = dateVal || fallbackDate;
  if (!tryVal) return { year: 0, month: 0 };
  const dt = parseDateSafe(tryVal);
  if (dt) {
    return { year: dt.getFullYear(), month: dt.getMonth() + 1 };
  }
  return { year: 0, month: 0 };
}

function isClinicSelfName(val: string, hosp: any): boolean {
  if (!val || !hosp) return false;
  const v = val.trim().toLowerCase();
  const hName = (hosp.name || "").trim().toLowerCase();
  const hShort = (hosp.shortName || "").trim().toLowerCase();
  return v === hName || v === hShort;
}

function resolveHospitalBranch(r: any, hosp: any): string {
  // 1. Explicit assignedBranch on donor record (if not just repeating clinic name)
  if (r.assignedBranch && r.assignedBranch.trim() && !isClinicSelfName(r.assignedBranch, hosp)) {
    return r.assignedBranch.trim();
  }

  // 2. Explicit branch ID from hospital.branches
  if (r.assignedBranchId && hosp?.branches && Array.isArray(hosp.branches)) {
    const matched = hosp.branches.find(
      (b: any) =>
        (b._id && b._id.toString() === r.assignedBranchId) ||
        b.branchId === r.assignedBranchId ||
        b.branchName === r.assignedBranchId
    );
    if (matched?.branchName && !isClinicSelfName(matched.branchName, hosp)) {
      return matched.branchName.trim();
    }
  }

  // 3. First branch configured in hospital profile
  if (hosp?.branches && Array.isArray(hosp.branches) && hosp.branches.length > 0) {
    const firstB = hosp.branches[0];
    const bName = typeof firstB === "string" ? firstB : firstB.branchName || firstB.name;
    if (bName && !isClinicSelfName(bName, hosp)) {
      return bName.trim();
    }
  }

  // 4. Specific OPU / pickup location (if not just repeating clinic name)
  if (r.opuLocation && r.opuLocation.trim() && !isClinicSelfName(r.opuLocation, hosp)) {
    return r.opuLocation.trim();
  }
  if (r.pickupLocation && r.pickupLocation.trim() && !isClinicSelfName(r.pickupLocation, hosp)) {
    return r.pickupLocation.trim();
  }

  // 5. Special known clinic locations in shortName
  if (hosp?.shortName && hosp.shortName.toLowerCase().includes("saket")) {
    return "Saket Branch";
  }

  // 6. City-based branch name (e.g. "New Delhi Branch", "Gurugram Branch")
  if (hosp?.city && hosp.city.trim()) {
    const c = hosp.city.trim();
    return c.toLowerCase().endsWith("branch") ? c : `${c} Branch`;
  }

  return "Main Branch";
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
    const branch = (searchParams.get("branch") || "").trim();
    const year = (searchParams.get("year") || "").trim();
    const month = (searchParams.get("month") || "").trim();
    const financialYearParam = searchParams.get("financialYear") || searchParams.get("fy") || "";
    const quarterParam = searchParams.get("quarter") || "";
    const startDateParam = searchParams.get("startDate") || "";
    const endDateParam = searchParams.get("endDate") || "";
    const billingModeFilter = (searchParams.get("mode") || searchParams.get("billingMode") || "ALL").toUpperCase(); // ALL | AWAITING | INVOICED | NO_INVOICE
    const paymentStatusFilter = searchParams.get("status") || "ALL"; // ALL | PAID | PENDING | PARTIALLY_RECEIVED
    const donorTypeParam = searchParams.get("donorType") || "all"; // all | egg | sperm
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "25"));

    // Eligible records for Billing & Invoice Management:
    // Any record with a pickupDate entered AND assignedHospital, OR an invoice was generated.
    const eligibleQuery = {
      $or: [
        {
          pickupDate: { $exists: true, $nin: ["", null] },
          assignedHospital: { $exists: true, $ne: null },
        },
        { isInvoiceGenerated: true },
        { "clinicDeal.isInvoiceGenerated": true },
        { invoiceNumber: { $exists: true, $nin: ["", null] } },
        { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
      ],
    };

    const fetchAndNormalize = async (model: any, defaultType: "egg" | "sperm") => {
      const records = await model
        .find(eligibleQuery)
        .select(
          "registrationId donorId donorType personalInfo.fullName personalInfo.husbandName contactInfo.mobileNumber assignedHospital assignedBranch assignedBranchId pickupLocation opuLocation clinicDeal donorDeal isInvoiceGenerated invoiceNumber invoiceDate pickupDate isDonorPaid paidAt createdAt updatedAt"
        )
        .populate("assignedHospital", "name shortName code city state gstNumber addressLine1 eggDonorDealPrice eggProfileDonorDealPrice profiledonorDealPrice donorDealPrice spermDonorDealPrice spermProfileDonorDealPrice serviceCharge tdsPercentage wantInvoice branches")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      return records.map((r: any, index: number) => {
        const hosp = typeof r.assignedHospital === "object" ? r.assignedHospital : null;
        const clinicDeal = r.clinicDeal || {};
        const donorCategory = clinicDeal.donorCategory || r.donorDeal?.donorCategory || "normal";
        const isSperm = r.donorType === "sperm" || defaultType === "sperm";

        // Deal Price
        const dealPrice =
          clinicDeal.hospitalDealPrice ||
          (hosp
            ? isSperm
              ? donorCategory === "profile"
                ? hosp.spermProfileDonorDealPrice || 25000
                : hosp.spermDonorDealPrice || 15000
              : donorCategory === "profile"
              ? hosp.eggProfileDonorDealPrice || hosp.profiledonorDealPrice || 85000
              : hosp.eggDonorDealPrice || hosp.donorDealPrice || 65000
            : isSperm
            ? 15000
            : 65000);

        // Service charge & Reimbursement
        const serviceCharge = clinicDeal.serviceCharge !== undefined && clinicDeal.serviceCharge !== null
          ? Number(clinicDeal.serviceCharge)
          : hosp?.serviceCharge || 5000;
        const donorReimbursement = clinicDeal.donorReimbursement !== undefined && clinicDeal.donorReimbursement !== null
          ? Number(clinicDeal.donorReimbursement)
          : Math.max(0, dealPrice - serviceCharge);

        // Branch matching for wantInvoice flag
        const assignedBranch = resolveHospitalBranch(r, hosp);
        let branchWantInvoice = hosp?.wantInvoice !== false;
        if (hosp?.branches && Array.isArray(hosp.branches)) {
          const matchedB = hosp.branches.find(
            (b: any) =>
              (b._id && b._id.toString() === r.assignedBranchId) ||
              b.branchName === assignedBranch ||
              b.branchName === r.assignedBranch
          );
          if (matchedB && matchedB.wantInvoice !== undefined) {
            branchWantInvoice = Boolean(matchedB.wantInvoice);
          }
        }

        // Invoice Number & Dates
        const invoiceNumber = (clinicDeal.invoiceNumber || r.invoiceNumber || "").trim();
        const hasInvoice = Boolean(invoiceNumber || clinicDeal.isInvoiceGenerated || r.isInvoiceGenerated);

        // Determine billingMode:
        // Explicitly set > has actual invoice -> INVOICED > clinic does not want invoice -> NO_INVOICE > else AWAITING
        let billingMode: "AWAITING" | "INVOICED" | "NO_INVOICE" = "AWAITING";
        if (clinicDeal.billingMode) {
          billingMode = clinicDeal.billingMode;
        } else if (hasInvoice) {
          billingMode = "INVOICED";
        } else if (!branchWantInvoice) {
          billingMode = "NO_INVOICE";
        } else {
          billingMode = "AWAITING";
        }

        // Bill Reference for non-invoiced items
        const billRef =
          clinicDeal.billRef ||
          (billingMode === "NO_INVOICE" ? generateBillRef(index + 1, parseDateSafe(r.pickupDate) || new Date()) : "");

        // Dates & Periods
        const rawDate = clinicDeal.invoiceDate || r.pickupDate || r.createdAt;
        const { year: parsedYear, month: parsedMonth } = parseYearAndMonth(rawDate, r.createdAt);
        const parsedDate = parseDateSafe(rawDate) || new Date();
        const financialYear = getFinancialYear(parsedDate);
        const quarter = getIndianQuarter(parsedDate);

        const invoiceDate = clinicDeal.invoiceDate
          ? formatDotDate(clinicDeal.invoiceDate)
          : r.pickupDate
          ? formatDotDate(r.pickupDate)
          : formatDotDate(r.createdAt || new Date());

        const pickupDateStr = r.pickupDate ? formatDotDate(r.pickupDate) : invoiceDate;

        // GST calculation / snapshot
        let gstDetails = clinicDeal.gst;
        if (!gstDetails && hasInvoice) {
          gstDetails = calculateGst(serviceCharge, hosp?.state);
        }
        const gstAmount = gstDetails?.totalGst || 0;

        // Payments and TDS tracking
        const paymentsList: any[] = Array.isArray(clinicDeal.payments) ? clinicDeal.payments : [];
        let receivedAmount = 0;
        let tdsAmount = 0;

        if (paymentsList.length > 0) {
          receivedAmount = paymentsList.reduce((acc, p) => acc + Number(p.netAmount ?? p.amount ?? 0), 0);
          tdsAmount = paymentsList.reduce((acc, p) => acc + Number(p.tdsAmount ?? 0), 0);
        } else {
          receivedAmount = Number(clinicDeal.receivedAmount || 0);
          tdsAmount = Number(clinicDeal.tdsAmount || clinicDeal.tdsTotal || 0);
        }

        const totalSettled = receivedAmount + tdsAmount;
        const isReceived =
          clinicDeal.isPaymentReceived === true ||
          clinicDeal.paymentStatus === "RECEIVED" ||
          totalSettled >= dealPrice;

        const isPartial =
          !isReceived &&
          (clinicDeal.paymentStatus === "PARTIALLY_RECEIVED" ||
            (totalSettled > 0 && totalSettled < dealPrice));

        const finalReceived = isReceived ? (receivedAmount || dealPrice) : receivedAmount;
        const pendingAmount = Math.max(0, dealPrice - (finalReceived + tdsAmount));

        const paymentStatus: "RECEIVED" | "PENDING" | "PARTIALLY_RECEIVED" = isReceived
          ? "RECEIVED"
          : isPartial
          ? "PARTIALLY_RECEIVED"
          : "PENDING";

        // Donor deal info
        const donorDeal = r.donorDeal || {};
        const donorComp = donorDeal.compensationAmount || clinicDeal.donorReimbursement || (donorCategory === "profile" ? 60000 : 55000);
        const isDonorPaid = r.isDonorPaid === true || donorDeal.paymentStatus === "PAID";

        const opuLocationStr = (r.opuLocation && !isClinicSelfName(r.opuLocation, hosp))
          ? r.opuLocation
          : (r.pickupLocation && !isClinicSelfName(r.pickupLocation, hosp))
          ? r.pickupLocation
          : assignedBranch;

        return {
          _id: r._id?.toString(),
          registrationId: r.registrationId,
          donorId: r.donorId || r.registrationId,
          donorType: defaultType,
          status: r.status,
          donorName: r.personalInfo?.fullName || "Donor",
          donorPhone: r.contactInfo?.mobileNumber || "",
          assignedHospital: hosp
            ? {
                _id: hosp._id?.toString(),
                name: hosp.name,
                shortName: hosp.shortName || hosp.name,
                code: hosp.code || "",
                city: hosp.city || "",
                state: hosp.state || "",
                gstNumber: hosp.gstNumber || "07AANCM1124F1ZQ",
                addressLine1: hosp.addressLine1 || "",
                wantInvoice: hosp.wantInvoice !== false,
                tdsPercentage: hosp.tdsPercentage || 10,
                branches: Array.isArray(hosp.branches) ? hosp.branches : [],
              }
            : null,
          assignedBranch,
          assignedBranchId: r.assignedBranchId || "",
          branchName: assignedBranch,
          opuLocation: opuLocationStr,
          billingMode,
          billRef,
          hasInvoice,
          invoiceNumber,
          invoiceDate,
          parsedYear,
          parsedMonth,
          parsedDate,
          financialYear,
          quarter,
          pickupDate: pickupDateStr,
          rawPickupDate: r.pickupDate || "",
          dealPrice,
          serviceCharge,
          donorReimbursement,
          gst: gstDetails || null,
          gstAmount,
          tdsAmount,
          totalAmountAfterTax: serviceCharge + gstAmount + donorReimbursement,
          receivedAmount: finalReceived,
          pendingAmount,
          paymentStatus,
          isPaymentReceived: isReceived,
          paymentReference: clinicDeal.paymentReference || "",
          receivedAt: clinicDeal.receivedAt || null,
          payments: paymentsList,
          donorDeal: {
            compensationAmount: donorComp,
            advanceAmount: donorDeal.advanceAmount || 0,
            balanceAmount: isDonorPaid ? 0 : Math.max(0, donorComp - (donorDeal.advanceAmount || 0)),
            paymentStatus: isDonorPaid ? "PAID" : donorDeal.paymentStatus || "PENDING",
            isDonorPaid,
            paymentMethod: donorDeal.paymentMethod || "bank_transfer",
            paidAt: donorDeal.paidAt || r.paidAt || null,
          },
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
      });
    };

    let allItems: any[] = [];
    if (donorTypeParam === "egg" || donorTypeParam === "all") {
      const eggItems = await fetchAndNormalize(EggDonorRegistration, "egg");
      allItems = allItems.concat(eggItems);
    }
    if (donorTypeParam === "sperm" || donorTypeParam === "all") {
      const spermItems = await fetchAndNormalize(SpermDonorRegistration, "sperm");
      allItems = allItems.concat(spermItems);
    }

    // Sort descending by date
    allItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Extract available years across all items
    const yearsSet = new Set<number>();
    const currentYr = new Date().getFullYear();
    yearsSet.add(currentYr);
    allItems.forEach((i) => {
      if (i.parsedYear && i.parsedYear > 2000) yearsSet.add(i.parsedYear);
    });
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Extract available branches across all records and registered hospitals
    const branchSet = new Set<string>();
    allItems.forEach((i) => {
      if (i.assignedBranch) branchSet.add(i.assignedBranch);
    });

    const allHospitals = await Hospital.find({}).select("name shortName branches city wantInvoice").lean();
    allHospitals.forEach((h: any) => {
      if (Array.isArray(h.branches) && h.branches.length > 0) {
        h.branches.forEach((b: any) => {
          const name = typeof b === "string" ? b : b.branchName || b.name;
          if (name && !isClinicSelfName(name, h)) branchSet.add(name);
        });
      }
    });
    const availableBranches = Array.from(branchSet).filter(Boolean).sort();

    // Mode counts across all loaded items (before mode/status filter)
    let awaitingCount = 0;
    let invoicedCount = 0;
    let noInvoiceCount = 0;

    allItems.forEach((item) => {
      if (item.billingMode === "AWAITING") awaitingCount++;
      else if (item.billingMode === "INVOICED") invoicedCount++;
      else if (item.billingMode === "NO_INVOICE") noInvoiceCount++;
    });

    // Clinic-wise aggregation
    const clinicMap: Record<string, any> = {};

    allItems.forEach((item) => {
      const hosp = item.assignedHospital;
      const hId = hosp?._id || "unassigned";
      const hName = hosp?.name || "Unassigned Clinic";
      const hCode = hosp?.code || "";
      const hCity = hosp?.city || "";
      const hState = hosp?.state || "";

      if (!clinicMap[hId]) {
        clinicMap[hId] = {
          hospitalId: hId,
          hospitalName: hName,
          hospitalCode: hCode,
          city: hCity,
          state: hState,
          branches: [],
          totalCount: 0,
          awaitingCount: 0,
          invoicedCount: 0,
          noInvoiceCount: 0,
          paidCount: 0,
          pendingCount: 0,
          partialCount: 0,
          totalBilled: 0,
          totalReceived: 0,
          totalTds: 0,
          totalGst: 0,
          totalPending: 0,
        };
      }

      const c = clinicMap[hId];
      c.totalCount++;
      c.totalBilled += item.dealPrice;
      c.totalReceived += item.receivedAmount;
      c.totalTds += item.tdsAmount;
      c.totalGst += item.gstAmount;
      c.totalPending += item.pendingAmount;

      if (item.billingMode === "AWAITING") c.awaitingCount++;
      else if (item.billingMode === "INVOICED") c.invoicedCount++;
      else if (item.billingMode === "NO_INVOICE") c.noInvoiceCount++;

      if (item.paymentStatus === "RECEIVED") c.paidCount++;
      else if (item.paymentStatus === "PARTIALLY_RECEIVED") c.partialCount++;
      else c.pendingCount++;

      const itemBranch = item.assignedBranch;
      if (itemBranch && !c.branches.some((b: any) => b.branchName === itemBranch)) {
        c.branches.push({
          branchId: item.assignedBranchId || itemBranch,
          branchName: itemBranch,
          city: hCity,
        });
      }
    });

    const clinicBreakdown = Object.values(clinicMap).map((c: any) => ({
      ...c,
      collectionRate: c.totalBilled > 0 ? Math.round((c.totalReceived / c.totalBilled) * 100) : 0,
    }));
    clinicBreakdown.sort((a: any, b: any) => b.totalBilled - a.totalBilled);

    // Apply Active Filters
    let filteredItems = allItems;

    // Billing Mode Filter
    if (billingModeFilter && billingModeFilter !== "ALL") {
      filteredItems = filteredItems.filter((i) => i.billingMode === billingModeFilter);
    }

    // Search Query
    if (search) {
      const q = search.toLowerCase();
      filteredItems = filteredItems.filter((i) =>
        Boolean(
          i.invoiceNumber?.toLowerCase().includes(q) ||
          i.billRef?.toLowerCase().includes(q) ||
          i.registrationId?.toLowerCase().includes(q) ||
          i.donorId?.toLowerCase().includes(q) ||
          i.donorName?.toLowerCase().includes(q) ||
          i.donorPhone?.toLowerCase().includes(q) ||
          i.assignedHospital?.name?.toLowerCase().includes(q) ||
          i.assignedHospital?.shortName?.toLowerCase().includes(q) ||
          i.assignedHospital?.code?.toLowerCase().includes(q) ||
          i.assignedBranch?.toLowerCase().includes(q)
        )
      );
    }

    if (donorTypeParam && donorTypeParam !== "all") {
      filteredItems = filteredItems.filter((i) => i.donorType === donorTypeParam);
    }

    if (hospitalId && hospitalId !== "ALL") {
      filteredItems = filteredItems.filter(
        (i) =>
          i.assignedHospital?._id === hospitalId ||
          i.assignedHospital?.name === hospitalId ||
          i.assignedHospital?.code === hospitalId
      );
    }

    if (branch && branch !== "ALL") {
      const target = branch.trim().toLowerCase();
      filteredItems = filteredItems.filter((i) => {
        const b = (i.assignedBranch || i.branchName || "").trim().toLowerCase();
        if (b === target) return true;
        if (i.assignedBranchId && i.assignedBranchId.trim().toLowerCase() === target) return true;
        if (i.assignedHospital?.branches && Array.isArray(i.assignedHospital.branches)) {
          return i.assignedHospital.branches.some((hb: any) => {
            const hbName = typeof hb === "string" ? hb : hb.branchName || hb.name || "";
            return hbName.trim().toLowerCase() === target;
          });
        }
        return false;
      });
    }

    // Financial Year filter (e.g. "2026-27")
    if (financialYearParam && financialYearParam !== "ALL") {
      filteredItems = filteredItems.filter((i) => i.financialYear === financialYearParam);
    }

    // Quarter filter (e.g. "Q1", "Q2")
    if (quarterParam && quarterParam !== "ALL") {
      filteredItems = filteredItems.filter((i) => i.quarter === quarterParam);
    }

    // Date range filter
    if (startDateParam || endDateParam) {
      const startDt = startDateParam ? new Date(startDateParam).getTime() : 0;
      const endDt = endDateParam ? new Date(endDateParam + "T23:59:59.999Z").getTime() : Infinity;
      filteredItems = filteredItems.filter((i) => {
        const t = new Date(i.parsedDate || i.createdAt).getTime();
        return t >= startDt && t <= endDt;
      });
    }

    if (year && year !== "ALL") {
      const yNum = parseInt(year, 10);
      filteredItems = filteredItems.filter((i) => i.parsedYear === yNum);
    }

    if (month && month !== "ALL") {
      const mNum = parseInt(month, 10);
      filteredItems = filteredItems.filter((i) => i.parsedMonth === mNum);
    }

    if (paymentStatusFilter === "PAID") {
      filteredItems = filteredItems.filter((i) => i.paymentStatus === "RECEIVED");
    } else if (paymentStatusFilter === "PENDING") {
      filteredItems = filteredItems.filter((i) => i.paymentStatus === "PENDING");
    } else if (paymentStatusFilter === "PARTIALLY_RECEIVED") {
      filteredItems = filteredItems.filter((i) => i.paymentStatus === "PARTIALLY_RECEIVED");
    }

    // Paginate
    const totalFiltered = filteredItems.length;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;
    const paginatedInvoices = filteredItems.slice((page - 1) * limit, page * limit);

    // Compute metrics on filtered result set
    let filterBilled = 0;
    let filterReceived = 0;
    let filterPending = 0;
    let filterTds = 0;
    let filterGst = 0;
    let filterPaidCount = 0;
    let filterPendingCount = 0;
    let filterPartialCount = 0;

    filteredItems.forEach((i) => {
      filterBilled += i.dealPrice;
      filterReceived += i.receivedAmount;
      filterPending += i.pendingAmount;
      filterTds += i.tdsAmount;
      filterGst += i.gstAmount;
      if (i.paymentStatus === "RECEIVED") filterPaidCount++;
      else if (i.paymentStatus === "PARTIALLY_RECEIVED") filterPartialCount++;
      else filterPendingCount++;
    });

    const paidPercentage =
      filterBilled > 0 ? Math.round((filterReceived / filterBilled) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalInvoices: totalFiltered,
        awaitingCount,
        invoicedCount,
        noInvoiceCount,
        paidInvoicesCount: filterPaidCount,
        pendingInvoicesCount: filterPendingCount,
        partialInvoicesCount: filterPartialCount,
        totalBilledAmount: filterBilled,
        totalReceivedAmount: filterReceived,
        totalTdsAmount: filterTds,
        totalGstAmount: filterGst,
        totalPendingAmount: filterPending,
        paidPercentage,
      },
      clinicBreakdown,
      availableYears,
      availableBranches,
      invoices: paginatedInvoices,
      allMatchingInvoices: filteredItems,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("[INVOICES_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load invoices" },
      { status: 500 }
    );
  }
}

// PATCH handler to update billing mode or payment receipt status
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
    const { action = "record-payment" } = body;

    await connectToDatabase();

    // ACTION 1: Set Billing Mode (single or bulk)
    if (action === "set-billing-mode") {
      const { registrationIds, billingMode, donorType } = body;
      const ids: string[] = Array.isArray(registrationIds)
        ? registrationIds
        : body.registrationId
        ? [body.registrationId]
        : [];

      if (ids.length === 0 || !billingMode) {
        return NextResponse.json(
          { success: false, error: "registrationIds and billingMode are required" },
          { status: 400 }
        );
      }

      if (!["AWAITING", "INVOICED", "NO_INVOICE"].includes(billingMode)) {
        return NextResponse.json({ success: false, error: "Invalid billingMode" }, { status: 400 });
      }

      const updateData: any = {
        "clinicDeal.billingMode": billingMode,
        "clinicDeal.billingDecidedBy": userName,
        "clinicDeal.billingDecidedAt": new Date(),
        updatedBy: userName,
        updatedAt: new Date(),
      };

      if (billingMode === "NO_INVOICE") {
        updateData["clinicDeal.billRef"] = generateBillRef(Date.now() % 10000);
      }

      await EggDonorRegistration.updateMany({ registrationId: { $in: ids } }, { $set: updateData });
      await SpermDonorRegistration.updateMany({ registrationId: { $in: ids } }, { $set: updateData });

      return NextResponse.json({
        success: true,
        message: `Billing mode updated to ${billingMode} for ${ids.length} registration(s)`,
      });
    }

    // ACTION 2: Direct Single Payment Update (Backwards compatible)
    const { registrationId, donorType = "egg", paymentStatus, receivedAmount, paymentReference, notes, tdsAmount } = body;

    if (!registrationId) {
      return NextResponse.json({ success: false, error: "registrationId is required" }, { status: 400 });
    }

    let targetModel: any = donorType === "sperm" ? SpermDonorRegistration : EggDonorRegistration;
    let existing = await targetModel.findOne({ registrationId });

    if (!existing) {
      const oppositeModel = donorType === "sperm" ? EggDonorRegistration : SpermDonorRegistration;
      existing = await oppositeModel.findOne({ registrationId });
      if (existing) {
        targetModel = oppositeModel;
      }
    }

    if (!existing) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }

    const prevClinic = existing.clinicDeal || {};
    const dealPrice = prevClinic.hospitalDealPrice || 65000;
    const isPaid = paymentStatus === "RECEIVED" || paymentStatus === "PAID";

    const finalReceivedAmt =
      receivedAmount !== undefined
        ? Number(receivedAmount)
        : isPaid
        ? dealPrice
        : prevClinic.receivedAmount || 0;

    const finalTds = tdsAmount !== undefined ? Number(tdsAmount) : prevClinic.tdsAmount || 0;
    const totalCovered = finalReceivedAmt + finalTds;

    const newPaymentStatus: "RECEIVED" | "PENDING" | "PARTIALLY_RECEIVED" =
      isPaid || totalCovered >= dealPrice
        ? "RECEIVED"
        : totalCovered > 0
        ? "PARTIALLY_RECEIVED"
        : "PENDING";

    // Append to payments array if amount changed
    const existingPayments = Array.isArray(prevClinic.payments) ? [...prevClinic.payments] : [];
    if (finalReceivedAmt > 0 && existingPayments.length === 0) {
      existingPayments.push({
        paymentId: new mongoose.Types.ObjectId().toString(),
        paymentNo: `MANUAL-${Date.now().toString().slice(-4)}`,
        grossAmount: totalCovered,
        tdsAmount: finalTds,
        netAmount: finalReceivedAmt,
        amount: finalReceivedAmt,
        date: new Date(),
        paymentMode: "bank_transfer",
        reference: paymentReference || prevClinic.paymentReference || "",
        notes: notes || "Direct payment update",
        recordedBy: userName,
      });
    }

    const updatePayload = {
      clinicDeal: {
        ...prevClinic,
        hospitalDealPrice: dealPrice,
        isPaymentReceived: newPaymentStatus === "RECEIVED",
        paymentStatus: newPaymentStatus,
        receivedAmount: finalReceivedAmt,
        tdsAmount: finalTds,
        tdsTotal: finalTds,
        receivedAt: newPaymentStatus === "RECEIVED" ? new Date() : prevClinic.receivedAt || null,
        paymentReference: paymentReference !== undefined ? paymentReference : prevClinic.paymentReference || "",
        notes: notes !== undefined ? notes : prevClinic.notes || "",
        agreedBy: prevClinic.agreedBy || userName,
        payments: existingPayments,
      },
      updatedBy: userName,
      updatedAt: new Date(),
    };

    await targetModel.updateOne({ registrationId }, { $set: updatePayload });

    return NextResponse.json({
      success: true,
      message: "Invoice payment status updated successfully",
      updatedStatus: newPaymentStatus,
      receivedAmount: finalReceivedAmt,
    });
  } catch (error: any) {
    console.error("[INVOICES_PATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update invoice payment" },
      { status: 500 }
    );
  }
}
