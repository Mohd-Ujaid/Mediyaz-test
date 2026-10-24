import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { ClinicPayment } from "@/models/ClinicPayment";
import { TdsCertificate } from "@/models/TdsCertificate";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import {
  getFinancialYear,
  getIndianQuarter,
  calculateGst,
  parseDateSafe,
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
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const view = searchParams.get("view") || "overview"; // overview | gst-summary | gst-invoices | tds-summary | tds-entries | clinic-summary
    const hospitalId = searchParams.get("hospitalId") || "";
    const branch = searchParams.get("branch") || "";
    const financialYear = searchParams.get("financialYear") || searchParams.get("fy") || "";
    const quarter = searchParams.get("quarter") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const startDateParam = searchParams.get("startDate") || "";
    const endDateParam = searchParams.get("endDate") || "";
    const donorTypeParam = searchParams.get("donorType") || "all";

    // Query all billable/invoiced records
    const eligibleQuery = {
      $or: [
        { pickupDate: { $exists: true, $nin: ["", null] } },
        { isInvoiceGenerated: true },
        { "clinicDeal.isInvoiceGenerated": true },
        { invoiceNumber: { $exists: true, $nin: ["", null] } },
        { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
      ],
    };

    const selectFields =
      "registrationId donorId donorType personalInfo.fullName assignedHospital assignedBranch assignedBranchId pickupLocation opuLocation clinicDeal isInvoiceGenerated invoiceNumber invoiceDate pickupDate createdAt";

    const fetchAll = async () => {
      let records: any[] = [];
      if (donorTypeParam === "egg" || donorTypeParam === "all") {
        const eggs = await EggDonorRegistration.find(eligibleQuery)
          .select(selectFields)
          .populate("assignedHospital", "name shortName code city state gstNumber eggDonorDealPrice eggProfileDonorDealPrice donorDealPrice spermDonorDealPrice spermProfileDonorDealPrice serviceCharge tdsPercentage wantInvoice branches")
          .lean();
        records = records.concat(eggs.map((e) => ({ ...e, donorType: "egg" })));
      }
      if (donorTypeParam === "sperm" || donorTypeParam === "all") {
        const sperms = await SpermDonorRegistration.find(eligibleQuery)
          .select(selectFields)
          .populate("assignedHospital", "name shortName code city state gstNumber eggDonorDealPrice eggProfileDonorDealPrice donorDealPrice spermDonorDealPrice spermProfileDonorDealPrice serviceCharge tdsPercentage wantInvoice branches")
          .lean();
        records = records.concat(sperms.map((s) => ({ ...s, donorType: "sperm" })));
      }
      return records;
    };

    const rawRecords = await fetchAll();

    // Normalize records
    const normalized = rawRecords.map((r: any) => {
      const hosp = typeof r.assignedHospital === "object" ? r.assignedHospital : null;
      const clinicDeal = r.clinicDeal || {};
      const donorCategory = clinicDeal.donorCategory || "normal";
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

      const serviceCharge = clinicDeal.serviceCharge !== undefined && clinicDeal.serviceCharge !== null
        ? Number(clinicDeal.serviceCharge)
        : hosp?.serviceCharge || 5000;

      const invoiceNumber = (clinicDeal.invoiceNumber || r.invoiceNumber || "").trim();
      const hasInvoice = Boolean(invoiceNumber || clinicDeal.isInvoiceGenerated || r.isInvoiceGenerated);

      const rawDate = clinicDeal.invoiceDate || r.pickupDate || r.createdAt;
      const parsedDate = parseDateSafe(rawDate) || new Date();
      const fy = getFinancialYear(parsedDate);
      const q = getIndianQuarter(parsedDate);
      const parsedYear = parsedDate.getFullYear();
      const parsedMonth = parsedDate.getMonth() + 1;

      // GST
      let gstDetails = clinicDeal.gst;
      if (!gstDetails && hasInvoice) {
        gstDetails = calculateGst(serviceCharge, hosp?.state);
      }

      // Payments & TDS
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

      const isReceived =
        clinicDeal.isPaymentReceived === true ||
        clinicDeal.paymentStatus === "RECEIVED" ||
        totalSettled >= dealPrice;

      const paymentStatus = isReceived
        ? "RECEIVED"
        : totalSettled > 0
        ? "PARTIALLY_RECEIVED"
        : "PENDING";

      const billingMode = clinicDeal.billingMode || (hasInvoice ? "INVOICED" : hosp?.wantInvoice === false ? "NO_INVOICE" : "AWAITING");

      return {
        _id: r._id?.toString(),
        registrationId: r.registrationId,
        donorType: r.donorType,
        donorName: r.personalInfo?.fullName || "Donor",
        hospitalId: hosp?._id?.toString() || "",
        hospitalName: hosp?.name || "Unassigned Clinic",
        hospitalGstin: hosp?.gstNumber || "07AANCM1124F1ZQ",
        hospitalState: hosp?.state || "Delhi",
        branchName: r.assignedBranch || hosp?.branches?.[0]?.branchName || "Main Branch",
        billingMode,
        hasInvoice,
        invoiceNumber,
        invoiceDate: formatDotDate(rawDate),
        pickupDate: r.pickupDate ? formatDotDate(r.pickupDate) : formatDotDate(rawDate),
        parsedDate,
        financialYear: fy,
        quarter: q,
        parsedYear,
        parsedMonth,
        dealPrice,
        serviceCharge,
        donorReimbursement: Math.max(0, dealPrice - serviceCharge),
        gst: gstDetails || null,
        taxableValue: hasInvoice ? (gstDetails?.taxableValue ?? serviceCharge) : 0,
        cgstAmount: hasInvoice ? (gstDetails?.cgstAmount ?? 0) : 0,
        sgstAmount: hasInvoice ? (gstDetails?.sgstAmount ?? 0) : 0,
        igstAmount: hasInvoice ? (gstDetails?.igstAmount ?? 0) : 0,
        totalGst: hasInvoice ? (gstDetails?.totalGst ?? 0) : 0,
        receivedAmount,
        tdsAmount,
        pendingAmount,
        paymentStatus,
        payments: paymentsList,
      };
    });

    // Filter by shared parameters
    let filtered = normalized;
    if (hospitalId && hospitalId !== "ALL") {
      filtered = filtered.filter((r) => r.hospitalId === hospitalId || r.hospitalName === hospitalId);
    }
    if (branch && branch !== "ALL") {
      filtered = filtered.filter((r) => r.branchName.toLowerCase() === branch.toLowerCase());
    }
    if (financialYear && financialYear !== "ALL") {
      filtered = filtered.filter((r) => r.financialYear === financialYear);
    }
    if (quarter && quarter !== "ALL") {
      filtered = filtered.filter((r) => r.quarter === quarter);
    }
    if (year && year !== "ALL") {
      filtered = filtered.filter((r) => r.parsedYear === parseInt(year, 10));
    }
    if (month && month !== "ALL") {
      filtered = filtered.filter((r) => r.parsedMonth === parseInt(month, 10));
    }
    if (startDateParam || endDateParam) {
      const s = startDateParam ? new Date(startDateParam).getTime() : 0;
      const e = endDateParam ? new Date(endDateParam + "T23:59:59.999Z").getTime() : Infinity;
      filtered = filtered.filter((r) => {
        const t = r.parsedDate.getTime();
        return t >= s && t <= e;
      });
    }

    // 1. VIEW: OVERVIEW
    if (view === "overview") {
      let totalBilled = 0;
      let totalReceived = 0;
      let totalPending = 0;
      let totalGst = 0;
      let totalTds = 0;

      const monthlyMap: Record<string, any> = {};

      filtered.forEach((r) => {
        totalBilled += r.dealPrice;
        totalReceived += r.receivedAmount;
        totalPending += r.pendingAmount;
        totalGst += r.totalGst;
        totalTds += r.tdsAmount;

        const mKey = `${r.parsedYear}-${String(r.parsedMonth).padStart(2, "0")}`;
        if (!monthlyMap[mKey]) {
          monthlyMap[mKey] = {
            monthKey: mKey,
            year: r.parsedYear,
            month: r.parsedMonth,
            billed: 0,
            received: 0,
            gst: 0,
            tds: 0,
            count: 0,
          };
        }
        monthlyMap[mKey].billed += r.dealPrice;
        monthlyMap[mKey].received += r.receivedAmount;
        monthlyMap[mKey].gst += r.totalGst;
        monthlyMap[mKey].tds += r.tdsAmount;
        monthlyMap[mKey].count++;
      });

      const monthlyTrends = Object.values(monthlyMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

      return NextResponse.json({
        success: true,
        summary: {
          totalBilled,
          totalReceived,
          totalPending,
          totalGst,
          totalTds,
          collectionRate: totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0,
          totalRecords: filtered.length,
        },
        monthlyTrends,
      });
    }

    // 2. VIEW: GST INVOICES (GSTR-1 Register)
    if (view === "gst-invoices") {
      // Only invoiced records are included in GST filing registers
      const invoicedOnly = filtered.filter((r) => r.hasInvoice && r.invoiceNumber);

      const gstInvoices = invoicedOnly.map((r, idx) => ({
        sNo: idx + 1,
        invoiceNumber: r.invoiceNumber,
        invoiceDate: r.invoiceDate,
        registrationId: r.registrationId,
        donorType: r.donorType,
        donorName: r.donorName,
        hospitalName: r.hospitalName,
        hospitalGstin: r.hospitalGstin,
        placeOfSupply: r.gst?.placeOfSupply || r.hospitalState,
        supplyType: r.gst?.supplyType || (r.hospitalState.toLowerCase().includes("delhi") ? "INTRA" : "INTER"),
        sacCode: "999321",
        taxableValue: r.taxableValue,
        cgstRate: r.gst?.cgstRate ?? 9,
        cgstAmount: r.cgstAmount,
        sgstRate: r.gst?.sgstRate ?? 9,
        sgstAmount: r.sgstAmount,
        igstRate: r.gst?.igstRate ?? 18,
        igstAmount: r.igstAmount,
        totalGst: r.totalGst,
        donorReimbursement: r.donorReimbursement,
        totalInvoiceValue: r.serviceCharge + r.totalGst + r.donorReimbursement,
        financialYear: r.financialYear,
        quarter: r.quarter,
      }));

      const totals = gstInvoices.reduce(
        (acc, i) => {
          acc.taxableValue += i.taxableValue;
          acc.cgstAmount += i.cgstAmount;
          acc.sgstAmount += i.sgstAmount;
          acc.igstAmount += i.igstAmount;
          acc.totalGst += i.totalGst;
          acc.totalInvoiceValue += i.totalInvoiceValue;
          return acc;
        },
        { taxableValue: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalGst: 0, totalInvoiceValue: 0 }
      );

      return NextResponse.json({
        success: true,
        totals,
        invoices: gstInvoices,
      });
    }

    // 3. VIEW: GST SUMMARY (Month-wise)
    if (view === "gst-summary") {
      const monthMap: Record<string, any> = {};

      filtered.filter((r) => r.hasInvoice).forEach((r) => {
        const key = `${r.parsedYear}-${String(r.parsedMonth).padStart(2, "0")}`;
        if (!monthMap[key]) {
          monthMap[key] = {
            monthKey: key,
            year: r.parsedYear,
            month: r.parsedMonth,
            financialYear: r.financialYear,
            quarter: r.quarter,
            invoiceCount: 0,
            taxableValue: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalGst: 0,
            totalBilled: 0,
          };
        }
        const m = monthMap[key];
        m.invoiceCount++;
        m.taxableValue += r.taxableValue;
        m.cgstAmount += r.cgstAmount;
        m.sgstAmount += r.sgstAmount;
        m.igstAmount += r.igstAmount;
        m.totalGst += r.totalGst;
        m.totalBilled += r.dealPrice;
      });

      const summaryList = Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      return NextResponse.json({ success: true, summary: summaryList });
    }

    // 4. VIEW: TDS SUMMARY (Hospital x Quarter reconciliation)
    if (view === "tds-summary") {
      // Fetch certificates for the filtered period/hospitals
      const certs = await TdsCertificate.find({}).lean();

      // Aggregate payments by hospital and quarter
      const hospQMap: Record<string, any> = {};

      filtered.forEach((r) => {
        if (!r.hospitalId) return;
        const key = `${r.hospitalId}_${r.financialYear}`;
        if (!hospQMap[key]) {
          hospQMap[key] = {
            hospitalId: r.hospitalId,
            hospitalName: r.hospitalName,
            financialYear: r.financialYear,
            Q1: 0,
            Q2: 0,
            Q3: 0,
            Q4: 0,
            totalTds: 0,
            certificates: { Q1: null, Q2: null, Q3: null, Q4: null },
          };
        }
        const entry = hospQMap[key];
        if (["Q1", "Q2", "Q3", "Q4"].includes(r.quarter)) {
          entry[r.quarter] += r.tdsAmount;
        }
        entry.totalTds += r.tdsAmount;
      });

      // Attach certificate reconciliation info
      certs.forEach((c: any) => {
        const key = `${c.hospital?.toString()}_${c.financialYear}`;
        if (hospQMap[key] && c.quarter) {
          hospQMap[key].certificates[c.quarter] = {
            certificateNo: c.certificateNo,
            amount: c.tdsAmountAsPerCert,
            status: c.status,
          };
        }
      });

      return NextResponse.json({
        success: true,
        tdsSummary: Object.values(hospQMap),
      });
    }

    // 5. VIEW: TDS ENTRIES (All individual TDS deductions)
    if (view === "tds-entries") {
      // Query ClinicPayment allocations where tdsAmount > 0
      const paymentFilter: any = { isVoided: false, totalTdsDeducted: { $gt: 0 } };
      if (hospitalId && hospitalId !== "ALL" && mongoose.Types.ObjectId.isValid(hospitalId)) {
        paymentFilter.hospital = new mongoose.Types.ObjectId(hospitalId);
      }
      if (financialYear && financialYear !== "ALL") {
        paymentFilter.financialYear = financialYear;
      }
      if (quarter && quarter !== "ALL") {
        paymentFilter.quarter = quarter;
      }

      const txs = await ClinicPayment.find(paymentFilter)
        .populate("hospital", "name shortName gstNumber")
        .sort({ date: -1 })
        .lean();

      const entries: any[] = [];
      txs.forEach((tx) => {
        const hospName = (tx.hospital as any)?.name || tx.hospitalName;
        tx.allocations.forEach((alloc: any) => {
          if (alloc.tdsAmount > 0) {
            entries.push({
              paymentNo: tx.paymentNo,
              paymentDate: formatDotDate(tx.date),
              reference: tx.reference,
              paymentMode: tx.paymentMode,
              hospitalName: hospName,
              registrationId: alloc.registrationId,
              donorName: alloc.donorName,
              donorType: alloc.donorType,
              invoiceNumber: alloc.invoiceNumber || alloc.billRef || "-",
              grossAmount: alloc.grossAmount,
              tdsAmount: alloc.tdsAmount,
              netAmount: alloc.netAmount,
              tdsSection: tx.tdsSection || "194J",
              financialYear: tx.financialYear,
              quarter: tx.quarter,
            });
          }
        });
      });

      return NextResponse.json({ success: true, entries });
    }

    // 6. VIEW: CLINIC-WISE REVENUE & TAX SUMMARY
    const clinicSummaryMap: Record<string, any> = {};
    filtered.forEach((r) => {
      const hId = r.hospitalId || "unassigned";
      if (!clinicSummaryMap[hId]) {
        clinicSummaryMap[hId] = {
          hospitalId: hId,
          hospitalName: r.hospitalName,
          hospitalGstin: r.hospitalGstin,
          state: r.hospitalState,
          totalCases: 0,
          totalBilled: 0,
          totalReceived: 0,
          totalTds: 0,
          totalGst: 0,
          totalPending: 0,
        };
      }
      const c = clinicSummaryMap[hId];
      c.totalCases++;
      c.totalBilled += r.dealPrice;
      c.totalReceived += r.receivedAmount;
      c.totalTds += r.tdsAmount;
      c.totalGst += r.totalGst;
      c.totalPending += r.pendingAmount;
    });

    const clinicSummary = Object.values(clinicSummaryMap).map((c: any) => ({
      ...c,
      collectionRate: c.totalBilled > 0 ? Math.round((c.totalReceived / c.totalBilled) * 100) : 0,
    }));
    clinicSummary.sort((a: any, b: any) => b.totalBilled - a.totalBilled);

    return NextResponse.json({ success: true, clinicSummary });
  } catch (error: any) {
    console.error("[TAX_REPORTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate tax report" },
      { status: 500 }
    );
  }
}
