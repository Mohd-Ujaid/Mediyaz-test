import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { formatDotDate } from "@/lib/invoice-utils";

function parseYearAndMonth(dateVal: any, fallbackDate?: any): { year: number; month: number } {
  const tryVal = dateVal || fallbackDate;
  if (!tryVal) return { year: 0, month: 0 };
  if (tryVal instanceof Date && !isNaN(tryVal.getTime())) {
    return { year: tryVal.getFullYear(), month: tryVal.getMonth() + 1 };
  }
  const str = String(tryVal).trim();
  const dmy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dmy) {
    return { year: parseInt(dmy[3], 10), month: parseInt(dmy[2], 10) };
  }
  const ymd = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (ymd) {
    return { year: parseInt(ymd[1], 10), month: parseInt(ymd[2], 10) };
  }
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
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
    const paymentStatusFilter = searchParams.get("status") || "ALL"; // ALL | PAID | PENDING | PARTIALLY_RECEIVED
    const donorTypeParam = searchParams.get("donorType") || "all"; // all | egg | sperm
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "25"));

    // Only records with an explicitly generated invoice should appear in the Invoice Tracker
    const invoiceOrConditions = [
      { isInvoiceGenerated: true },
      { "clinicDeal.isInvoiceGenerated": true },
      { invoiceNumber: { $exists: true, $nin: ["", null] } },
      { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
    ];

    const queryFilter = { $or: invoiceOrConditions };

    // Helper to fetch and normalize records
    const fetchAndNormalize = async (model: any, defaultType: "egg" | "sperm") => {
      const records = await model
        .find(queryFilter)
        .select(
          "registrationId donorId donorType personalInfo.fullName personalInfo.husbandName contactInfo.mobileNumber assignedHospital assignedBranch assignedBranchId pickupLocation opuLocation clinicDeal donorDeal isInvoiceGenerated invoiceNumber invoiceDate pickupDate isDonorPaid paidAt createdAt updatedAt"
        )
        .populate("assignedHospital", "name shortName code city state gstNumber addressLine1 eggDonorDealPrice eggProfileDonorDealPrice profiledonorDealPrice donorDealPrice spermDonorDealPrice spermProfileDonorDealPrice branches")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      return records
        .filter((r: any) => {
          const invNum = (r.clinicDeal?.invoiceNumber || r.invoiceNumber || "").trim();
          return Boolean(invNum || r.clinicDeal?.isInvoiceGenerated || r.isInvoiceGenerated);
        })
        .map((r: any) => {
        const hosp = typeof r.assignedHospital === "object" ? r.assignedHospital : null;
        const clinicDeal = r.clinicDeal || {};
        const donorCategory = clinicDeal.donorCategory || r.donorDeal?.donorCategory || "normal";

        const isSperm = r.donorType === "sperm";
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

        const isReceived =
          clinicDeal.isPaymentReceived === true ||
          clinicDeal.paymentStatus === "RECEIVED" ||
          (clinicDeal.receivedAmount && clinicDeal.receivedAmount >= dealPrice);

        const isPartial =
          !isReceived &&
          (clinicDeal.paymentStatus === "PARTIALLY_RECEIVED" ||
            (clinicDeal.receivedAmount && clinicDeal.receivedAmount > 0 && clinicDeal.receivedAmount < dealPrice));

        const receivedAmount = isReceived
          ? clinicDeal.receivedAmount || dealPrice
          : clinicDeal.receivedAmount || 0;

        const pendingAmount = Math.max(0, dealPrice - receivedAmount);

        const paymentStatus: "RECEIVED" | "PENDING" | "PARTIALLY_RECEIVED" = isReceived
          ? "RECEIVED"
          : isPartial
          ? "PARTIALLY_RECEIVED"
          : "PENDING";

        // Use actual generated invoice number
        const invoiceNumber = (clinicDeal.invoiceNumber || r.invoiceNumber || "").trim();
        const rawDate = clinicDeal.invoiceDate || r.pickupDate || r.createdAt;
        const { year: parsedYear, month: parsedMonth } = parseYearAndMonth(rawDate, r.createdAt);
        const invoiceDate = clinicDeal.invoiceDate
          ? formatDotDate(clinicDeal.invoiceDate)
          : r.pickupDate
          ? formatDotDate(r.pickupDate)
          : formatDotDate(r.createdAt || new Date());

        const serviceCharge = clinicDeal.serviceCharge !== undefined && clinicDeal.serviceCharge !== null
          ? Number(clinicDeal.serviceCharge)
          : hosp?.serviceCharge || 5000;
        const donorReimbursement = clinicDeal.donorReimbursement !== undefined && clinicDeal.donorReimbursement !== null
          ? Number(clinicDeal.donorReimbursement)
          : Math.max(0, dealPrice - serviceCharge);

        // Tax details
        const isInterState = hosp?.state && !hosp.state.toLowerCase().includes("delhi");
        const taxRate = 18; // 18% IGST or 9%+9% CGST+SGST on service charge
        const taxAmount = (serviceCharge * taxRate) / 100;
        const totalAmountAfterTax = serviceCharge + taxAmount + donorReimbursement;

        // Donor deal info
        const donorDeal = r.donorDeal || {};
        const donorComp = donorDeal.compensationAmount || clinicDeal.donorReimbursement || (donorCategory === "profile" ? 60000 : 55000);
        const isDonorPaid = r.isDonorPaid === true || donorDeal.paymentStatus === "PAID";

        const assignedBranch = resolveHospitalBranch(r, hosp);
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
                branches: Array.isArray(hosp.branches) ? hosp.branches : [],
              }
            : null,
          assignedBranch,
          assignedBranchId: r.assignedBranchId || "",
          branchName: assignedBranch,
          opuLocation: opuLocationStr,
          invoiceNumber,
          invoiceDate,
          parsedYear,
          parsedMonth,
          pickupDate: r.pickupDate ? formatDotDate(r.pickupDate) : invoiceDate,
          dealPrice,
          serviceCharge,
          donorReimbursement,
          taxAmount,
          totalAmountAfterTax,
          receivedAmount,
          pendingAmount,
          paymentStatus,
          isPaymentReceived: isReceived,
          paymentReference: clinicDeal.paymentReference || "",
          receivedAt: clinicDeal.receivedAt || null,
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

    // Extract available years across all invoices
    const yearsSet = new Set<number>();
    const currentYr = new Date().getFullYear();
    yearsSet.add(currentYr);
    allItems.forEach((i) => {
      if (i.parsedYear && i.parsedYear > 2000) yearsSet.add(i.parsedYear);
    });
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Extract available branches across all invoices and registered hospital profiles
    const branchSet = new Set<string>();
    allItems.forEach((i) => {
      if (i.assignedBranch) branchSet.add(i.assignedBranch);
    });

    const allHospitals = await Hospital.find({}).select("name shortName branches city").lean();
    allHospitals.forEach((h: any) => {
      if (Array.isArray(h.branches) && h.branches.length > 0) {
        h.branches.forEach((b: any) => {
          const name = typeof b === "string" ? b : b.branchName || b.name;
          if (name && !isClinicSelfName(name, h)) branchSet.add(name);
        });
      }
    });
    const availableBranches = Array.from(branchSet).filter(Boolean).sort();

    // Compute Overall KPI Metrics across all loaded records before paymentStatus filter
    const totalInvoices = allItems.length;
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;
    let partialInvoicesCount = 0;
    let totalBilledAmount = 0;
    let totalReceivedAmount = 0;
    let totalPendingAmount = 0;

    // Clinic-wise aggregation map
    const clinicMap: Record<
      string,
      {
        hospitalId: string;
        hospitalName: string;
        hospitalCode: string;
        city: string;
        state: string;
        branches: Array<{ branchId: string; branchName: string; city?: string }>;
        invoiceCount: number;
        paidCount: number;
        pendingCount: number;
        partialCount: number;
        totalBilled: number;
        totalReceived: number;
        totalPending: number;
      }
    > = {};

    allItems.forEach((item) => {
      totalBilledAmount += item.dealPrice;
      totalReceivedAmount += item.receivedAmount;
      totalPendingAmount += item.pendingAmount;

      if (item.paymentStatus === "RECEIVED") {
        paidInvoicesCount++;
      } else if (item.paymentStatus === "PARTIALLY_RECEIVED") {
        partialInvoicesCount++;
      } else {
        pendingInvoicesCount++;
      }

      // Clinic breakdown
      const hosp = item.assignedHospital;
      const hId = hosp?._id || "unassigned";
      const hName = hosp?.name || "Unassigned Clinic";
      const hCode = hosp?.code || "";
      const hCity = hosp?.city || "";
      const hState = hosp?.state || "";

      if (!clinicMap[hId]) {
        const initialBranches: Array<{ branchId: string; branchName: string; city?: string }> = [];
        if (hosp?.branches && Array.isArray(hosp.branches)) {
          hosp.branches.forEach((b: any) => {
            const bName = typeof b === "string" ? b : b.branchName || b.name;
            const bId = b._id?.toString() || b.branchId || bName;
            if (bName && !initialBranches.some((cb) => cb.branchName === bName)) {
              initialBranches.push({
                branchId: bId,
                branchName: bName,
                city: b.city || hCity,
              });
            }
          });
        }

        clinicMap[hId] = {
          hospitalId: hId,
          hospitalName: hName,
          hospitalCode: hCode,
          city: hCity,
          state: hState,
          branches: initialBranches,
          invoiceCount: 0,
          paidCount: 0,
          pendingCount: 0,
          partialCount: 0,
          totalBilled: 0,
          totalReceived: 0,
          totalPending: 0,
        };
      }

      clinicMap[hId].invoiceCount++;
      clinicMap[hId].totalBilled += item.dealPrice;
      clinicMap[hId].totalReceived += item.receivedAmount;
      clinicMap[hId].totalPending += item.pendingAmount;

      const itemBranch = item.assignedBranch;
      if (itemBranch && !clinicMap[hId].branches.some((b) => b.branchName === itemBranch)) {
        clinicMap[hId].branches.push({
          branchId: item.assignedBranchId || itemBranch,
          branchName: itemBranch,
          city: hCity,
        });
      }

      if (item.paymentStatus === "RECEIVED") clinicMap[hId].paidCount++;
      else if (item.paymentStatus === "PARTIALLY_RECEIVED") clinicMap[hId].partialCount++;
      else clinicMap[hId].pendingCount++;
    });

    const clinicBreakdown = Object.values(clinicMap).map((c) => ({
      ...c,
      collectionRate: c.totalBilled > 0 ? Math.round((c.totalReceived / c.totalBilled) * 100) : 0,
    }));

    clinicBreakdown.sort((a, b) => b.totalBilled - a.totalBilled);

    // Apply Filters: Search, DonorType, Clinic, Branch, Year, Month, and Payment Status
    let filteredInvoices = allItems;

    if (search) {
      const q = search.toLowerCase();
      filteredInvoices = filteredInvoices.filter((i) =>
        Boolean(
          i.invoiceNumber?.toLowerCase().includes(q) ||
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
      filteredInvoices = filteredInvoices.filter((i) => i.donorType === donorTypeParam);
    }

    if (hospitalId && hospitalId !== "ALL") {
      filteredInvoices = filteredInvoices.filter(
        (i) =>
          i.assignedHospital?._id === hospitalId ||
          i.assignedHospital?.name === hospitalId ||
          i.assignedHospital?.code === hospitalId
      );
    }

    if (branch && branch !== "ALL") {
      const target = branch.trim().toLowerCase();
      filteredInvoices = filteredInvoices.filter((i) => {
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

    if (year && year !== "ALL") {
      const yNum = parseInt(year, 10);
      filteredInvoices = filteredInvoices.filter((i) => i.parsedYear === yNum);
    }

    if (month && month !== "ALL") {
      const mNum = parseInt(month, 10);
      filteredInvoices = filteredInvoices.filter((i) => i.parsedMonth === mNum);
    }

    if (paymentStatusFilter === "PAID") {
      filteredInvoices = filteredInvoices.filter((i) => i.paymentStatus === "RECEIVED");
    } else if (paymentStatusFilter === "PENDING") {
      filteredInvoices = filteredInvoices.filter((i) => i.paymentStatus === "PENDING");
    } else if (paymentStatusFilter === "PARTIALLY_RECEIVED") {
      filteredInvoices = filteredInvoices.filter((i) => i.paymentStatus === "PARTIALLY_RECEIVED");
    }

    const totalFiltered = filteredInvoices.length;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;
    const paginatedInvoices = filteredInvoices.slice((page - 1) * limit, page * limit);

    // Compute metrics matching active filters
    let filterBilled = 0;
    let filterReceived = 0;
    let filterPending = 0;
    let filterPaidCount = 0;
    let filterPendingCount = 0;
    let filterPartialCount = 0;

    filteredInvoices.forEach((i) => {
      filterBilled += i.dealPrice;
      filterReceived += i.receivedAmount;
      filterPending += i.pendingAmount;
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
        paidInvoicesCount: filterPaidCount,
        pendingInvoicesCount: filterPendingCount,
        partialInvoicesCount: filterPartialCount,
        totalBilledAmount: filterBilled,
        totalReceivedAmount: filterReceived,
        totalPendingAmount: filterPending,
        paidPercentage,
      },
      clinicBreakdown,
      availableYears,
      availableBranches,
      invoices: paginatedInvoices,
      allMatchingInvoices: filteredInvoices, // All invoices matching clinic, branch, year, month & status
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

// PATCH handler to update payment receipt status for an invoice/deal
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
    const { registrationId, donorType = "egg", paymentStatus, receivedAmount, paymentReference, notes } = body;

    if (!registrationId) {
      return NextResponse.json({ success: false, error: "registrationId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the record
    let targetModel: any = donorType === "sperm" ? SpermDonorRegistration : EggDonorRegistration;
    let existing = await targetModel.findOne({ registrationId });

    if (!existing) {
      // Fallback search in opposite model
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
    const dealPrice = prevClinic.hospitalDealPrice || 100000;
    const isPaid = paymentStatus === "RECEIVED" || paymentStatus === "PAID";

    const finalReceivedAmt =
      receivedAmount !== undefined
        ? Number(receivedAmount)
        : isPaid
        ? dealPrice
        : prevClinic.receivedAmount || 0;

    const newPaymentStatus: "RECEIVED" | "PENDING" | "PARTIALLY_RECEIVED" =
      isPaid || finalReceivedAmt >= dealPrice
        ? "RECEIVED"
        : finalReceivedAmt > 0
        ? "PARTIALLY_RECEIVED"
        : "PENDING";

    const updatePayload = {
      clinicDeal: {
        ...prevClinic,
        hospitalDealPrice: dealPrice,
        isPaymentReceived: newPaymentStatus === "RECEIVED",
        paymentStatus: newPaymentStatus,
        receivedAmount: finalReceivedAmt,
        receivedAt: newPaymentStatus === "RECEIVED" ? new Date() : prevClinic.receivedAt || null,
        paymentReference: paymentReference !== undefined ? paymentReference : prevClinic.paymentReference || "",
        notes: notes !== undefined ? notes : prevClinic.notes || "",
        agreedBy: prevClinic.agreedBy || userName,
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
