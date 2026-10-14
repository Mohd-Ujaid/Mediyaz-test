import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { formatDotDate } from "@/lib/invoice-utils";

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
    const paymentStatusFilter = searchParams.get("status") || "ALL"; // ALL | PAID | PENDING | PARTIALLY_RECEIVED
    const donorTypeParam = searchParams.get("donorType") || "all"; // all | egg | sperm
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "15"));

    // Only records with an explicitly generated invoice should appear in the Invoice Tracker
    const invoiceOrConditions = [
      { isInvoiceGenerated: true },
      { "clinicDeal.isInvoiceGenerated": true },
      { invoiceNumber: { $exists: true, $nin: ["", null] } },
      { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
    ];

    const andConditions: any[] = [{ $or: invoiceOrConditions }];

    if (hospitalId && hospitalId !== "ALL") {
      if (mongoose.Types.ObjectId.isValid(hospitalId)) {
        andConditions.push({ assignedHospital: new mongoose.Types.ObjectId(hospitalId) });
      } else {
        andConditions.push({ assignedHospital: hospitalId });
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
        { invoiceNumber: searchRegex },
        { "clinicDeal.invoiceNumber": searchRegex },
        { "personalInfo.fullName": searchRegex },
        { "personalInfo.husbandName": searchRegex },
        { "contactInfo.mobileNumber": searchRegex },
      ];

      if (matchedHospIds.length > 0) {
        orClauses.push({ assignedHospital: { $in: matchedHospIds } });
      }
      andConditions.push({ $or: orClauses });
    }

    const queryFilter = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

    // Helper to fetch and normalize records
    const fetchAndNormalize = async (model: any, defaultType: "egg" | "sperm") => {
      const records = await model
        .find(queryFilter)
        .select(
          "registrationId donorId donorType personalInfo.fullName personalInfo.husbandName contactInfo.mobileNumber assignedHospital clinicDeal donorDeal isInvoiceGenerated invoiceNumber invoiceDate pickupDate isDonorPaid paidAt createdAt updatedAt"
        )
        .populate("assignedHospital", "name shortName code city state gstNumber addressLine1 eggDonorDealPrice eggProfileDonorDealPrice profiledonorDealPrice donorDealPrice spermDonorDealPrice spermProfileDonorDealPrice")
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
              }
            : null,
          invoiceNumber,
          invoiceDate,
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
        clinicMap[hId] = {
          hospitalId: hId,
          hospitalName: hName,
          hospitalCode: hCode,
          city: hCity,
          state: hState,
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

      if (item.paymentStatus === "RECEIVED") clinicMap[hId].paidCount++;
      else if (item.paymentStatus === "PARTIALLY_RECEIVED") clinicMap[hId].partialCount++;
      else clinicMap[hId].pendingCount++;
    });

    const clinicBreakdown = Object.values(clinicMap).map((c) => ({
      ...c,
      collectionRate: c.totalBilled > 0 ? Math.round((c.totalReceived / c.totalBilled) * 100) : 0,
    }));

    clinicBreakdown.sort((a, b) => b.totalBilled - a.totalBilled);

    // Apply Payment Status Filter to the invoices list
    let filteredInvoices = allItems;
    if (paymentStatusFilter === "PAID") {
      filteredInvoices = allItems.filter((i) => i.paymentStatus === "RECEIVED");
    } else if (paymentStatusFilter === "PENDING") {
      filteredInvoices = allItems.filter((i) => i.paymentStatus === "PENDING");
    } else if (paymentStatusFilter === "PARTIALLY_RECEIVED") {
      filteredInvoices = allItems.filter((i) => i.paymentStatus === "PARTIALLY_RECEIVED");
    }

    const totalFiltered = filteredInvoices.length;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;
    const paginatedInvoices = filteredInvoices.slice((page - 1) * limit, page * limit);

    const paidPercentage =
      totalBilledAmount > 0 ? Math.round((totalReceivedAmount / totalBilledAmount) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalInvoices,
        paidInvoicesCount,
        pendingInvoicesCount,
        partialInvoicesCount,
        totalBilledAmount,
        totalReceivedAmount,
        totalPendingAmount,
        paidPercentage,
      },
      clinicBreakdown,
      invoices: paginatedInvoices,
      allMatchingInvoices: filteredInvoices, // Helpful for client-side export
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
