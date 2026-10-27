import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { ClinicPayment } from "@/models/ClinicPayment";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { normalizeRecordToFinancial, IStandardCaseFinancial } from "@/lib/finance-calc";
import { formatDotDate } from "@/lib/invoice-utils";
import { parseDateSafe, getFinancialYear } from "@/lib/tax-finance-utils";

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

    const basis = searchParams.get("basis") || "cash"; // "cash" | "accrual"
    const view = searchParams.get("view") || "monthly"; // "monthly" | "yearly" | "fy" | "clinic" | "donor" | "transactions"
    const hospitalId = searchParams.get("hospitalId") || "ALL";
    const donorTypeParam = searchParams.get("donorType") || "all";
    const yearParam = searchParams.get("year") || "ALL";
    const fyParam = searchParams.get("fy") || "ALL";
    const monthParam = searchParams.get("month") || "ALL";
    const startDateParam = searchParams.get("startDate") || "";
    const endDateParam = searchParams.get("endDate") || "";

    // 1. Fetch eligible donor records (both Egg and Sperm)
    const baseQuery = {
      $or: [
        { status: { $in: ["FILE_COMPLETED", "COMPLETED", "APPROVED"] } },
        { pickupDate: { $exists: true, $nin: ["", null] } },
        { isInvoiceGenerated: true },
        { "clinicDeal.isInvoiceGenerated": true },
        { invoiceNumber: { $exists: true, $nin: ["", null] } },
        { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
        { isDonorPaid: true },
        { "donorDeal.paymentStatus": { $in: ["PAID", "PARTIALLY_PAID"] } },
        { "clinicDeal.paymentStatus": { $in: ["RECEIVED", "PARTIALLY_RECEIVED"] } },
      ],
    };

    const selectFields =
      "registrationId donorId donorType status personalInfo.fullName assignedHospital assignedBranch pickupLocation opuLocation clinicDeal donorDeal isInvoiceGenerated invoiceNumber invoiceDate pickupDate isDonorPaid paidAt createdAt updatedAt";
    const hospitalFields =
      "name shortName code city state address gstNumber branches eggDonorDealPrice eggProfileDonorDealPrice donorDealPrice spermDonorDealPrice spermProfileDonorDealPrice serviceCharge tdsPercentage";

    let rawRecords: any[] = [];
    if (donorTypeParam === "egg" || donorTypeParam === "all") {
      const eggs = await EggDonorRegistration.find(baseQuery)
        .select(selectFields)
        .populate("assignedHospital", hospitalFields)
        .lean();
      rawRecords = rawRecords.concat(eggs.map((e) => ({ ...e, donorType: "egg" })));
    }
    if (donorTypeParam === "sperm" || donorTypeParam === "all") {
      const sperms = await SpermDonorRegistration.find(baseQuery)
        .select(selectFields)
        .populate("assignedHospital", hospitalFields)
        .lean();
      rawRecords = rawRecords.concat(sperms.map((s) => ({ ...s, donorType: "sperm" })));
    }

    // Deduplicate records strictly by registrationId to guarantee 0 repeats
    const seenRegIds = new Set<string>();
    const deduplicatedRecords: any[] = [];
    for (const r of rawRecords) {
      const regId = r.registrationId?.trim();
      if (regId && !seenRegIds.has(regId)) {
        seenRegIds.add(regId);
        deduplicatedRecords.push(r);
      }
    }

    // 2. Normalize every unique record
    const allCases: IStandardCaseFinancial[] = deduplicatedRecords.map(normalizeRecordToFinancial);

    // Also fetch standalone ClinicPayments to augment cash-in if available
    const clinicPaymentsDoc = await ClinicPayment.find({ isVoided: false })
      .populate("hospital", "name shortName")
      .lean();

    // 3. Assemble Cash Transactions Book (IN and OUT)
    interface ICashTransaction {
      id: string;
      date: Date;
      dateStr: string;
      type: "IN" | "OUT";
      category: "CLINIC_COLLECTION" | "DONOR_PAYOUT";
      entityName: string; // Hospital Name or Donor Name
      hospitalId?: string;
      registrationId: string;
      donorType: "egg" | "sperm";
      reference: string;
      method: string;
      amount: number;
      financialYear: string;
      year: number;
      month: number;
    }

    const cashBook: ICashTransaction[] = [];

    allCases.forEach((c) => {
      // Cash IN: From Clinic Payments
      c.clinicPayments.forEach((cp, idx) => {
        if (cp.amount > 0) {
          const d = cp.date || c.caseDate;
          cashBook.push({
            id: `IN-${c.registrationId}-${idx}`,
            date: d,
            dateStr: formatDotDate(d),
            type: "IN",
            category: "CLINIC_COLLECTION",
            entityName: c.hospitalName,
            hospitalId: c.hospitalId,
            registrationId: c.registrationId,
            donorType: c.donorType,
            reference: cp.reference || c.clinicPaymentReference || "-",
            method: cp.mode || "bank_transfer",
            amount: cp.amount,
            financialYear: getFinancialYear(d),
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          });
        }
      });

      // Cash OUT: To Donor Payments
      c.donorPayments.forEach((dp, idx) => {
        if (dp.amount > 0) {
          const d = dp.date || c.caseDate;
          cashBook.push({
            id: `OUT-${c.registrationId}-${idx}`,
            date: d,
            dateStr: formatDotDate(d),
            type: "OUT",
            category: "DONOR_PAYOUT",
            entityName: `${c.donorName} (${c.registrationId})`,
            hospitalId: c.hospitalId,
            registrationId: c.registrationId,
            donorType: c.donorType,
            reference: dp.reference || c.donorPaymentReference || "-",
            method: dp.mode || "bank_transfer",
            amount: dp.amount,
            financialYear: getFinancialYear(d),
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          });
        }
      });
    });

    // 4. Filtering according to User query params
    const filterCase = (c: IStandardCaseFinancial) => {
      if (hospitalId !== "ALL" && c.hospitalId !== hospitalId && c.hospitalName !== hospitalId) return false;
      if (yearParam !== "ALL" && c.year !== parseInt(yearParam, 10)) return false;
      if (fyParam !== "ALL" && c.financialYear !== fyParam) return false;
      if (monthParam !== "ALL" && c.month !== parseInt(monthParam, 10)) return false;

      if (startDateParam || endDateParam) {
        const start = startDateParam ? new Date(startDateParam).getTime() : 0;
        const end = endDateParam ? new Date(endDateParam + "T23:59:59.999Z").getTime() : Infinity;
        const t = c.caseDate.getTime();
        if (t < start || t > end) return false;
      }
      return true;
    };

    const filterTx = (tx: ICashTransaction) => {
      if (hospitalId !== "ALL" && tx.hospitalId !== hospitalId && tx.entityName !== hospitalId) return false;
      if (donorTypeParam !== "all" && tx.donorType !== donorTypeParam) return false;
      if (yearParam !== "ALL" && tx.year !== parseInt(yearParam, 10)) return false;
      if (fyParam !== "ALL" && tx.financialYear !== fyParam) return false;
      if (monthParam !== "ALL" && tx.month !== parseInt(monthParam, 10)) return false;

      if (startDateParam || endDateParam) {
        const start = startDateParam ? new Date(startDateParam).getTime() : 0;
        const end = endDateParam ? new Date(endDateParam + "T23:59:59.999Z").getTime() : Infinity;
        const t = tx.date.getTime();
        if (t < start || t > end) return false;
      }
      return true;
    };

    const filteredCases = allCases.filter(filterCase);
    const filteredCashBook = cashBook.filter(filterTx);

    // 5. Global Available Years and FYs for dropdowns
    const availableYearsSet = new Set<number>();
    const availableFysSet = new Set<string>();

    allCases.forEach((c) => {
      availableYearsSet.add(c.year);
      availableFysSet.add(c.financialYear);
    });
    cashBook.forEach((tx) => {
      availableYearsSet.add(tx.year);
      availableFysSet.add(tx.financialYear);
    });

    const currentYr = new Date().getFullYear();
    availableYearsSet.add(currentYr);
    availableFysSet.add(getFinancialYear(new Date()));

    const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);
    const availableFys = Array.from(availableFysSet).sort().reverse();

    // 6. Aggregate High-Level Metrics (KPIs)
    let totalBilled = 0;
    let totalClinicReceived = 0;
    let totalClinicPending = 0;
    let totalDonorCompensation = 0;
    let totalDonorPaid = 0;
    let totalDonorPending = 0;
    let totalServiceMargin = 0;
    let totalGstAmount = 0;
    let totalTdsAmount = 0;

    filteredCases.forEach((c) => {
      totalBilled += c.dealPrice;
      totalClinicPending += c.clinicPendingAmount;
      totalDonorCompensation += c.donorCompensation;
      totalDonorPending += c.donorPendingAmount;
      totalServiceMargin += c.serviceCharge;
      totalGstAmount += c.gstAmount;
      totalTdsAmount += c.tdsAmount;
    });

    // In cash basis, cash-in and cash-out come directly from transactions in the selected period
    let totalCashIn = 0;
    let totalCashOut = 0;

    filteredCashBook.forEach((tx) => {
      if (tx.type === "IN") totalCashIn += tx.amount;
      if (tx.type === "OUT") totalCashOut += tx.amount;
    });

    // For accrual basis, cash in is case-based settled amount
    if (basis === "accrual") {
      filteredCases.forEach((c) => {
        totalClinicReceived += c.clinicReceivedAmount;
        totalDonorPaid += c.donorPaidAmount;
      });
    } else {
      totalClinicReceived = totalCashIn;
      totalDonorPaid = totalCashOut;
    }

    const netCashFlow = totalCashIn - totalCashOut;
    const netAccrualEarnings = totalServiceMargin;

    // 7. Monthly Aggregations
    const monthMap: Record<string, any> = {};

    // Helper month key generator
    const getMonthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

    if (basis === "cash") {
      filteredCashBook.forEach((tx) => {
        const key = getMonthKey(tx.year, tx.month);
        if (!monthMap[key]) {
          monthMap[key] = {
            periodKey: key,
            year: tx.year,
            month: tx.month,
            financialYear: tx.financialYear,
            billed: 0,
            cashIn: 0,
            cashOut: 0,
            netCash: 0,
            serviceMargin: 0,
            caseCount: 0,
            txCount: 0,
          };
        }
        if (tx.type === "IN") monthMap[key].cashIn += tx.amount;
        if (tx.type === "OUT") monthMap[key].cashOut += tx.amount;
        monthMap[key].txCount++;
      });

      // Also compute margin/billed aligned to that month's cases
      filteredCases.forEach((c) => {
        const key = getMonthKey(c.year, c.month);
        if (!monthMap[key]) {
          monthMap[key] = {
            periodKey: key,
            year: c.year,
            month: c.month,
            financialYear: c.financialYear,
            billed: 0,
            cashIn: 0,
            cashOut: 0,
            netCash: 0,
            serviceMargin: 0,
            caseCount: 0,
            txCount: 0,
          };
        }
        monthMap[key].billed += c.dealPrice;
        monthMap[key].serviceMargin += c.serviceCharge;
        monthMap[key].caseCount++;
      });
    } else {
      // Accrual basis: strictly by case date
      filteredCases.forEach((c) => {
        const key = getMonthKey(c.year, c.month);
        if (!monthMap[key]) {
          monthMap[key] = {
            periodKey: key,
            year: c.year,
            month: c.month,
            financialYear: c.financialYear,
            billed: 0,
            cashIn: 0,
            cashOut: 0,
            netCash: 0,
            serviceMargin: 0,
            caseCount: 0,
            txCount: 0,
          };
        }
        monthMap[key].billed += c.dealPrice;
        monthMap[key].cashIn += c.clinicReceivedAmount;
        monthMap[key].cashOut += c.donorPaidAmount;
        monthMap[key].serviceMargin += c.serviceCharge;
        monthMap[key].caseCount++;
      });
    }

    const monthlyBreakdown = Object.values(monthMap)
      .map((m: any) => ({
        ...m,
        netCash: m.cashIn - m.cashOut,
        marginRate: m.billed > 0 ? Math.round((m.serviceMargin / m.billed) * 100) : 0,
      }))
      .sort((a, b) => b.periodKey.localeCompare(a.periodKey));

    // 8. Yearly and Financial-Year Aggregations
    const fyMap: Record<string, any> = {};
    const calendarYearMap: Record<string, any> = {};

    monthlyBreakdown.forEach((m) => {
      // Financial Year Grouping
      const fyKey = m.financialYear;
      if (!fyMap[fyKey]) {
        fyMap[fyKey] = {
          fy: fyKey,
          billed: 0,
          cashIn: 0,
          cashOut: 0,
          netCash: 0,
          serviceMargin: 0,
          caseCount: 0,
        };
      }
      fyMap[fyKey].billed += m.billed;
      fyMap[fyKey].cashIn += m.cashIn;
      fyMap[fyKey].cashOut += m.cashOut;
      fyMap[fyKey].serviceMargin += m.serviceMargin;
      fyMap[fyKey].caseCount += m.caseCount;

      // Calendar Year Grouping
      const calYr = String(m.year);
      if (!calendarYearMap[calYr]) {
        calendarYearMap[calYr] = {
          year: m.year,
          billed: 0,
          cashIn: 0,
          cashOut: 0,
          netCash: 0,
          serviceMargin: 0,
          caseCount: 0,
        };
      }
      calendarYearMap[calYr].billed += m.billed;
      calendarYearMap[calYr].cashIn += m.cashIn;
      calendarYearMap[calYr].cashOut += m.cashOut;
      calendarYearMap[calYr].serviceMargin += m.serviceMargin;
      calendarYearMap[calYr].caseCount += m.caseCount;
    });

    const fyBreakdown = Object.values(fyMap)
      .map((f: any) => ({
        ...f,
        netCash: f.cashIn - f.cashOut,
        marginRate: f.billed > 0 ? Math.round((f.serviceMargin / f.billed) * 100) : 0,
      }))
      .sort((a, b) => b.fy.localeCompare(a.fy));

    const yearlyBreakdown = Object.values(calendarYearMap)
      .map((y: any) => ({
        ...y,
        netCash: y.cashIn - y.cashOut,
        marginRate: y.billed > 0 ? Math.round((y.serviceMargin / y.billed) * 100) : 0,
      }))
      .sort((a, b) => b.year - a.year);

    // 9. Clinic-wise Breakdown
    const clinicAgg: Record<string, any> = {};
    filteredCases.forEach((c) => {
      const hId = c.hospitalId || "unassigned";
      if (!clinicAgg[hId]) {
        clinicAgg[hId] = {
          hospitalId: hId,
          hospitalName: c.hospitalName,
          state: c.hospitalState,
          casesCount: 0,
          totalBilled: 0,
          cashReceived: 0,
          pendingAmount: 0,
          serviceMargin: 0,
          tdsDeducted: 0,
          gstBilled: 0,
        };
      }
      clinicAgg[hId].casesCount++;
      clinicAgg[hId].totalBilled += c.dealPrice;
      clinicAgg[hId].cashReceived += c.clinicReceivedAmount;
      clinicAgg[hId].pendingAmount += c.clinicPendingAmount;
      clinicAgg[hId].serviceMargin += c.serviceCharge;
      clinicAgg[hId].tdsDeducted += c.tdsAmount;
      clinicAgg[hId].gstBilled += c.gstAmount;
    });

    const clinicBreakdown = Object.values(clinicAgg)
      .map((c: any) => ({
        ...c,
        recoveryRate: c.totalBilled > 0 ? Math.round((c.cashReceived / c.totalBilled) * 100) : 0,
      }))
      .sort((a, b) => b.totalBilled - a.totalBilled);

    // 10. Complete Donor Deal & Profit Audit (Clinic Deal vs Donor Payout vs Net Margin)
    // When basis is cash, remove completely unpaid cases (where 0 cash was received and 0 cash was disbursed)
    const casesForBreakdown =
      basis === "cash"
        ? filteredCases.filter((c) => (c.clinicReceivedAmount || 0) > 0 || (c.donorPaidAmount || 0) > 0)
        : filteredCases;

    const donorBreakdown = casesForBreakdown.map((c, idx) => ({
      sNo: idx + 1,
      registrationId: c.registrationId,
      donorName: c.donorName,
      donorType: c.donorType,
      hospitalName: c.hospitalName,
      caseDate: formatDotDate(c.caseDate),
      // Clinic Side
      dealPrice: c.dealPrice,
      clinicReceivedAmount: c.clinicReceivedAmount,
      clinicPendingAmount: c.clinicPendingAmount,
      clinicPaymentStatus: c.clinicPaymentStatus,
      // Donor Side
      agreedCompensation: c.donorCompensation,
      paidAmount: c.donorPaidAmount,
      balancePending: c.donorPendingAmount,
      paymentStatus: c.donorPaymentStatus,
      paidAt: c.donorPaidAt ? formatDotDate(c.donorPaidAt) : "-",
      reference: c.donorPaymentReference || "-",
      // Company Margin & Realized Profit
      serviceCharge: c.serviceCharge,
      gstAmount: c.gstAmount,
      tdsAmount: c.tdsAmount,
      netRealizedMargin: c.clinicReceivedAmount - c.donorPaidAmount,
      marginRate: c.dealPrice > 0 ? Math.round((c.serviceCharge / c.dealPrice) * 100) : 0,
    }));

    // 11. Sorted Cash Book with Running Net Balance
    filteredCashBook.sort((a, b) => a.date.getTime() - b.date.getTime());
    let cumulative = 0;
    const cashBookWithBalance = filteredCashBook.map((tx, idx) => {
      if (tx.type === "IN") cumulative += tx.amount;
      else cumulative -= tx.amount;
      return {
        ...tx,
        sNo: idx + 1,
        runningBalance: cumulative,
      };
    });

    // Reverse for latest first display in UI
    const latestCashBook = [...cashBookWithBalance].reverse();

    // Clinics list for dropdown filter
    const hospitalsList = await Hospital.find({}).select("name shortName code").lean();

    const effectiveCashIn = basis === "accrual" ? totalClinicReceived : totalCashIn;
    const effectiveCashOut = basis === "accrual" ? totalDonorPaid : totalCashOut;
    const effectiveNetCashFlow = basis === "accrual" ? (totalClinicReceived - totalDonorPaid) : (totalCashIn - totalCashOut);

    return NextResponse.json({
      success: true,
      meta: {
        basis,
        availableYears,
        availableFys,
      },
      summary: {
        basis,
        totalBilled,
        cashIn: effectiveCashIn,
        cashOut: effectiveCashOut,
        netCashFlow: effectiveNetCashFlow,
        totalClinicReceived,
        totalDonorPaid,
        totalDonorCompensation,
        realCashIn: totalCashIn,
        realCashOut: totalCashOut,
        serviceMargin: totalServiceMargin,
        gstPayable: totalGstAmount,
        tdsCredit: totalTdsAmount,
        clinicReceivable: totalClinicPending,
        donorPayable: totalDonorPending,
        collectionRate: totalBilled > 0 ? Math.round((effectiveCashIn / totalBilled) * 100) : 0,
        totalCases: filteredCases.length,
        totalTransactions: filteredCashBook.length,
      },
      monthlyBreakdown,
      fyBreakdown,
      yearlyBreakdown,
      clinicBreakdown,
      donorBreakdown,
      transactions: latestCashBook,
      hospitals: hospitalsList,
    });
  } catch (error: any) {
    console.error("[CASHFLOW_API_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate revenue and cash flow" },
      { status: 500 }
    );
  }
}
