import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ClinicPayment } from "@/models/ClinicPayment";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import {
  getFinancialYear,
  getIndianQuarter,
  generatePaymentNo,
  parseDateSafe,
  calculateTds,
} from "@/lib/tax-finance-utils";
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
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "list";
    const hospitalId = searchParams.get("hospitalId") || "";

    // ACTION: OUTSTANDING DONORS FOR PAYMENT ALLOCATION
    if (action === "outstanding-donors") {
      if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId)) {
        return NextResponse.json({ success: false, error: "Valid hospitalId is required" }, { status: 400 });
      }

      const hospObjectId = new mongoose.Types.ObjectId(hospitalId);
      const hosp = await Hospital.findById(hospObjectId).lean();
      if (!hosp) {
        return NextResponse.json({ success: false, error: "Hospital not found" }, { status: 404 });
      }

      const query = {
        assignedHospital: hospObjectId,
        $or: [
          { pickupDate: { $exists: true, $nin: ["", null] } },
          { isInvoiceGenerated: true },
          { "clinicDeal.isInvoiceGenerated": true },
          { invoiceNumber: { $exists: true, $nin: ["", null] } },
          { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
        ],
      };

      const selectFields =
        "registrationId donorId donorType personalInfo.fullName contactInfo.mobileNumber assignedHospital assignedBranch assignedBranchId pickupLocation opuLocation clinicDeal isInvoiceGenerated invoiceNumber invoiceDate pickupDate createdAt";

      const [eggs, sperms] = await Promise.all([
        EggDonorRegistration.find(query).select(selectFields).lean(),
        SpermDonorRegistration.find(query).select(selectFields).lean(),
      ]);

      const normalizeDonor = (r: any, defaultType: "egg" | "sperm") => {
        const clinicDeal = r.clinicDeal || {};
        const donorCategory = clinicDeal.donorCategory || "normal";
        const isSperm = defaultType === "sperm";

        const dealPrice =
          clinicDeal.hospitalDealPrice ||
          (isSperm
            ? donorCategory === "profile"
              ? hosp.spermProfileDonorDealPrice || 25000
              : hosp.spermDonorDealPrice || 15000
            : donorCategory === "profile"
            ? hosp.eggProfileDonorDealPrice || hosp.profiledonorDealPrice || 85000
            : hosp.eggDonorDealPrice || hosp.donorDealPrice || 65000);

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
        const pendingAmount = Math.max(0, dealPrice - totalSettled);

        const invoiceNumber = (clinicDeal.invoiceNumber || r.invoiceNumber || "").trim();
        const billRef = clinicDeal.billRef || "";
        const branchName = r.assignedBranch || hosp.branches?.[0]?.branchName || "Main Branch";

        // Suggested TDS based on clinic TDS percentage on service charge or deal
        const serviceCharge = clinicDeal.serviceCharge || hosp.serviceCharge || 5000;
        const clinicTdsPct = hosp.tdsPercentage || 10;
        const suggestedTds = calculateTds(serviceCharge, clinicTdsPct);

        return {
          registrationId: r.registrationId,
          donorId: r.donorId || r.registrationId,
          donorType: defaultType,
          donorName: r.personalInfo?.fullName || "Donor",
          donorPhone: r.contactInfo?.mobileNumber || "",
          pickupDate: r.pickupDate ? formatDotDate(r.pickupDate) : "",
          rawPickupDate: r.pickupDate || r.createdAt,
          branchName,
          invoiceNumber,
          billRef,
          billingMode: clinicDeal.billingMode || (invoiceNumber ? "INVOICED" : "AWAITING"),
          dealPrice,
          receivedAmount,
          tdsAmount,
          pendingAmount,
          suggestedTds: Math.min(suggestedTds, pendingAmount),
        };
      };

      const allDonors = [
        ...eggs.map((e) => normalizeDonor(e, "egg")),
        ...sperms.map((s) => normalizeDonor(s, "sperm")),
      ];

      // Filter only those with pending balance > 0
      const outstanding = allDonors.filter((d) => d.pendingAmount > 0);

      // Sort oldest pickup date first (so oldest bills get settled first)
      outstanding.sort((a, b) => {
        const tA = parseDateSafe(a.rawPickupDate)?.getTime() || 0;
        const tB = parseDateSafe(b.rawPickupDate)?.getTime() || 0;
        return tA - tB;
      });

      // Calculate total credit balance for this hospital
      const creditAgg = await ClinicPayment.aggregate([
        { $match: { hospital: hospObjectId, isVoided: false } },
        { $group: { _id: null, totalCredit: { $sum: "$unallocatedAmount" } } },
      ]);
      const availableCredit = creditAgg[0]?.totalCredit || 0;

      return NextResponse.json({
        success: true,
        hospital: {
          _id: hosp._id,
          name: hosp.name,
          shortName: hosp.shortName,
          tdsPercentage: hosp.tdsPercentage || 10,
          serviceCharge: hosp.serviceCharge || 5000,
        },
        availableCredit,
        outstandingDonors: outstanding,
      });
    }

    // ACTION: DEFAULT LIST OF PAYMENTS
    const search = (searchParams.get("search") || "").trim();
    const branch = (searchParams.get("branch") || "").trim();
    const fy = searchParams.get("financialYear") || searchParams.get("fy") || "";
    const quarter = searchParams.get("quarter") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "25"));

    const filter: any = {};
    if (hospitalId && hospitalId !== "ALL") {
      filter.hospital = new mongoose.Types.ObjectId(hospitalId);
    }
    if (branch && branch !== "ALL") {
      filter.branch = branch;
    }
    if (fy && fy !== "ALL") {
      filter.financialYear = fy;
    }
    if (quarter && quarter !== "ALL") {
      filter.quarter = quarter;
    }
    if (search) {
      filter.$or = [
        { paymentNo: { $regex: search, $options: "i" } },
        { reference: { $regex: search, $options: "i" } },
        { hospitalName: { $regex: search, $options: "i" } },
        { "allocations.registrationId": { $regex: search, $options: "i" } },
        { "allocations.donorName": { $regex: search, $options: "i" } },
      ];
    }

    const clinicInvoiceType = (searchParams.get("clinicInvoiceType") || searchParams.get("clinicInvoice") || "ALL").toUpperCase();
    if (clinicInvoiceType !== "ALL" && (!hospitalId || hospitalId === "ALL")) {
      const matchCondition = clinicInvoiceType === "WITHOUT_INVOICE" ? { wantInvoice: false } : { wantInvoice: { $ne: false } };
      const matchingHospitals = await Hospital.find(matchCondition).select("_id").lean();
      const hospIds = matchingHospitals.map((h: any) => h._id);
      filter.hospital = { $in: hospIds };
    }

    const totalCount = await ClinicPayment.countDocuments(filter);
    const payments = await ClinicPayment.find(filter)
      .populate("hospital", "name shortName code city state gstNumber wantInvoice")
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Summary totals for active filter
    const statsAgg = await ClinicPayment.aggregate([
      { $match: { ...filter, isVoided: false } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalGross: { $sum: "$totalGrossSettled" },
          totalTds: { $sum: "$totalTdsDeducted" },
          totalNet: { $sum: "$netReceived" },
          totalCredit: { $sum: "$unallocatedAmount" },
        },
      },
    ]);

    const stats = statsAgg[0] || {
      totalAmount: 0,
      totalGross: 0,
      totalTds: 0,
      totalNet: 0,
      totalCredit: 0,
    };

    return NextResponse.json({
      success: true,
      payments,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("[CLINIC_PAYMENTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch clinic payments" },
      { status: 500 }
    );
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
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin or staff access required." }, { status: 403 });
    }

    const userName = session.user?.name || session.user?.email || "Admin";
    const body = await req.json();

    const {
      hospitalId,
      branch = "",
      amount,
      paymentMode = "bank_transfer",
      reference = "",
      date: txDateStr,
      tdsSection = "194J",
      notes = "",
      allocations = [],
    } = body;

    if (!hospitalId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "hospitalId and positive transaction amount are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const hosp = await Hospital.findById(hospitalId);
    if (!hosp) {
      return NextResponse.json({ success: false, error: "Hospital not found" }, { status: 404 });
    }

    const txDate = txDateStr ? new Date(txDateStr) : new Date();
    const financialYear = getFinancialYear(txDate);
    const quarter = getIndianQuarter(txDate);

    // Generate unique payment number
    const count = await ClinicPayment.countDocuments({});
    const paymentNo = generatePaymentNo(count + 1, txDate);

    // Calculate totals across allocations
    let totalGrossSettled = 0;
    let totalTdsDeducted = 0;
    let netAllocated = 0;

    const validatedAllocations: any[] = [];

    for (const alloc of allocations) {
      const gross = Math.max(0, Number(alloc.grossAmount || 0));
      const tds = Math.max(0, Number(alloc.tdsAmount || 0));
      const net = Math.max(0, Number(alloc.netAmount ?? (gross - tds)));

      if (gross > 0 || net > 0) {
        totalGrossSettled += gross;
        totalTdsDeducted += tds;
        netAllocated += net;

        validatedAllocations.push({
          registrationId: alloc.registrationId,
          donorType: alloc.donorType || "egg",
          donorName: alloc.donorName || "",
          invoiceNumber: alloc.invoiceNumber || "",
          billRef: alloc.billRef || "",
          grossAmount: gross,
          tdsAmount: tds,
          netAmount: net,
          allocatedAt: txDate,
        });
      }
    }

    const totalTransactionAmt = Number(amount);
    if (netAllocated > totalTransactionAmt) {
      return NextResponse.json(
        {
          success: false,
          error: `Total net allocations (₹${netAllocated.toLocaleString("en-IN")}) exceed the transaction amount (₹${totalTransactionAmt.toLocaleString("en-IN")})`,
        },
        { status: 400 }
      );
    }

    const unallocatedAmount = Math.max(0, totalTransactionAmt - netAllocated);

    // Create the master ClinicPayment record
    const clinicPayment = new ClinicPayment({
      paymentNo,
      hospital: hosp._id,
      hospitalName: hosp.name,
      branch: branch || "",
      amount: totalTransactionAmt,
      totalGrossSettled,
      totalTdsDeducted,
      netReceived: netAllocated,
      unallocatedAmount,
      date: txDate,
      financialYear,
      quarter,
      paymentMode,
      reference,
      tdsSection,
      notes,
      allocations: validatedAllocations,
      recordedBy: userName,
    });

    await clinicPayment.save();

    // Now distribute allocations into individual donor registrations
    for (const alloc of validatedAllocations) {
      const targetModel: any = alloc.donorType === "sperm" ? SpermDonorRegistration : EggDonorRegistration;
      let donor = await targetModel.findOne({ registrationId: alloc.registrationId });

      if (!donor) {
        const altModel = alloc.donorType === "sperm" ? EggDonorRegistration : SpermDonorRegistration;
        donor = await altModel.findOne({ registrationId: alloc.registrationId });
      }

      if (donor) {
        const prevClinic = donor.clinicDeal || {};
        const paymentsList = Array.isArray(prevClinic.payments) ? [...prevClinic.payments] : [];

        // Append this payment entry
        paymentsList.push({
          paymentId: clinicPayment._id.toString(),
          paymentNo: clinicPayment.paymentNo,
          grossAmount: alloc.grossAmount,
          tdsAmount: alloc.tdsAmount,
          netAmount: alloc.netAmount,
          amount: alloc.netAmount,
          date: txDate,
          paymentMode,
          reference,
          notes: notes || `Settled via ${clinicPayment.paymentNo}`,
          recordedBy: userName,
        });

        // Recalculate totals
        const newReceivedAmount = paymentsList.reduce((acc, p) => acc + Number(p.netAmount ?? p.amount ?? 0), 0);
        const newTdsTotal = paymentsList.reduce((acc, p) => acc + Number(p.tdsAmount ?? 0), 0);
        const dealPrice = prevClinic.hospitalDealPrice || (alloc.donorType === "sperm" ? 15000 : 65000);

        const totalSettled = newReceivedAmount + newTdsTotal;
        const isReceived = totalSettled >= dealPrice;
        const isPartial = !isReceived && totalSettled > 0;

        const newPaymentStatus: "RECEIVED" | "PENDING" | "PARTIALLY_RECEIVED" = isReceived
          ? "RECEIVED"
          : isPartial
          ? "PARTIALLY_RECEIVED"
          : "PENDING";

        await donor.updateOne({
          $set: {
            "clinicDeal.payments": paymentsList,
            "clinicDeal.receivedAmount": newReceivedAmount,
            "clinicDeal.tdsAmount": newTdsTotal,
            "clinicDeal.tdsTotal": newTdsTotal,
            "clinicDeal.isPaymentReceived": isReceived,
            "clinicDeal.paymentStatus": newPaymentStatus,
            "clinicDeal.receivedAt": isReceived ? txDate : prevClinic.receivedAt || null,
            "clinicDeal.paymentReference": reference || prevClinic.paymentReference || "",
            updatedBy: userName,
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${paymentNo} for ₹${totalTransactionAmt.toLocaleString("en-IN")} recorded successfully`,
      payment: clinicPayment,
    });
  } catch (error: any) {
    console.error("[CLINIC_PAYMENTS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record clinic payment" },
      { status: 500 }
    );
  }
}

// VOID PAYMENT ACTION
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
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Super Admin or Admin access required to void transactions." }, { status: 403 });
    }

    const userName = session.user?.name || session.user?.email || "Admin";
    const body = await req.json();
    const { paymentId, reason = "Voided by admin" } = body;

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "paymentId is required" }, { status: 400 });
    }

    await connectToDatabase();

    const payment = await ClinicPayment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    if (payment.isVoided) {
      return NextResponse.json({ success: false, error: "Transaction is already voided" }, { status: 400 });
    }

    // Rollback allocations from each donor registration
    for (const alloc of payment.allocations) {
      const targetModel: any = alloc.donorType === "sperm" ? SpermDonorRegistration : EggDonorRegistration;
      let donor = await targetModel.findOne({ registrationId: alloc.registrationId });

      if (!donor) {
        const altModel = alloc.donorType === "sperm" ? EggDonorRegistration : SpermDonorRegistration;
        donor = await altModel.findOne({ registrationId: alloc.registrationId });
      }

      if (donor) {
        const prevClinic = donor.clinicDeal || {};
        const paymentsList: any[] = (prevClinic.payments || []).filter(
          (p: any) => p.paymentId !== paymentId && p.paymentNo !== payment.paymentNo
        );

        const newReceivedAmount = paymentsList.reduce((acc, p) => acc + Number(p.netAmount ?? p.amount ?? 0), 0);
        const newTdsTotal = paymentsList.reduce((acc, p) => acc + Number(p.tdsAmount ?? 0), 0);
        const dealPrice = prevClinic.hospitalDealPrice || (alloc.donorType === "sperm" ? 15000 : 65000);

        const totalSettled = newReceivedAmount + newTdsTotal;
        const isReceived = totalSettled >= dealPrice;
        const isPartial = !isReceived && totalSettled > 0;

        const newPaymentStatus: "RECEIVED" | "PENDING" | "PARTIALLY_RECEIVED" = isReceived
          ? "RECEIVED"
          : isPartial
          ? "PARTIALLY_RECEIVED"
          : "PENDING";

        await donor.updateOne({
          $set: {
            "clinicDeal.payments": paymentsList,
            "clinicDeal.receivedAmount": newReceivedAmount,
            "clinicDeal.tdsAmount": newTdsTotal,
            "clinicDeal.tdsTotal": newTdsTotal,
            "clinicDeal.isPaymentReceived": isReceived,
            "clinicDeal.paymentStatus": newPaymentStatus,
            updatedBy: userName,
            updatedAt: new Date(),
          },
        });
      }
    }

    payment.isVoided = true;
    payment.voidedAt = new Date();
    payment.voidedBy = userName;
    payment.voidReason = reason;
    await payment.save();

    return NextResponse.json({
      success: true,
      message: `Transaction ${payment.paymentNo} has been voided and donor allocations reversed.`,
      payment,
    });
  } catch (error: any) {
    console.error("[CLINIC_PAYMENTS_VOID_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to void transaction" },
      { status: 500 }
    );
  }
}
