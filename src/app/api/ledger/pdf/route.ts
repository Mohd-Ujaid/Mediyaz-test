import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import ClinicLedgerPdfDocument, {
  ClinicLedgerPdfData,
  ClinicLedgerEntry,
} from "@/features/pdf-generator/ledger/ClinicLedgerPdfDocument";
import DonorLedgerPdfDocument, {
  DonorLedgerPdfData,
  DonorLedgerEntry,
} from "@/features/pdf-generator/ledger/DonorLedgerPdfDocument";
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

export const maxDuration = 30;

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

    await connectToDatabase();
    const _forceHosp = Hospital.modelName;

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "clinic").toLowerCase(); // "clinic" | "donor"
    const hospitalId = searchParams.get("hospitalId") || "";
    const donorType = searchParams.get("donorType") || "all";
    const statusParam = searchParams.get("status") || "ALL";
    const branchParam = searchParams.get("branch") || "ALL";
    const startDateParam = searchParams.get("startDate") || "";
    const endDateParam = searchParams.get("endDate") || "";
    const yearParam = searchParams.get("year") || "ALL";
    const monthParam = searchParams.get("month") || "ALL";
    const search = (searchParams.get("search") || "").trim();
    const preview = searchParams.get("preview") === "true";

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

    let filterClinicName = "";
    if (hospitalId && hospitalId !== "ALL") {
      if (mongoose.Types.ObjectId.isValid(hospitalId)) {
        baseQuery.assignedHospital = new mongoose.Types.ObjectId(hospitalId);
        const hospDoc = await Hospital.findById(hospitalId).select("name").lean();
        if (hospDoc) filterClinicName = (hospDoc as any).name;
      } else {
        baseQuery.assignedHospital = hospitalId;
      }
    }

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

    let rawRecords: any[] = [];
    if (donorType === "egg" || donorType === "all") {
      const eggs = await EggDonorRegistration.find(queryEgg)
        .populate("assignedHospital")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
      rawRecords = rawRecords.concat(eggs.map((e) => ({ ...e, donorType: "egg" })));
    }
    if (donorType === "sperm" || donorType === "all") {
      const sperms = await SpermDonorRegistration.find(querySperm)
        .populate("assignedHospital")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
      rawRecords = rawRecords.concat(sperms.map((s) => ({ ...s, donorType: "sperm" })));
    }

    rawRecords.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const generatedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const generatedBy = session.user?.name || "Authorized Accounts Officer";

    // Build Clinic Ledger PDF (Only include donors where invoice has actually been generated)
    if (type === "clinic") {
      let sNo = 1;
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

      let clinicEntries: ClinicLedgerEntry[] = invoicedClinicRecords.map((r: any) => {
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

        // Standard TDS rate is 2% automatically applied
        const tdsPercentage =
          clinicDeal.tdsPercentage && Number(clinicDeal.tdsPercentage) > 0
            ? Number(clinicDeal.tdsPercentage)
            : hosp?.tdsPercentage && Number(hosp.tdsPercentage) > 0
            ? Number(hosp.tdsPercentage)
            : 2;

        const tdsAmount =
          clinicDeal.tdsAmount && Number(clinicDeal.tdsAmount) > 0
            ? Number(clinicDeal.tdsAmount)
            : Math.round(dealPrice * (tdsPercentage / 100));

        const netAmount =
          clinicDeal.netReceivableAmount && Number(clinicDeal.netReceivableAmount) > 0
            ? Number(clinicDeal.netReceivableAmount)
            : Math.max(0, dealPrice - tdsAmount + gstAmount);

        const isReceived =
          clinicDeal.isPaymentReceived === true ||
          clinicDeal.paymentStatus === "RECEIVED" ||
          (clinicDeal.receivedAmount && clinicDeal.receivedAmount >= (netAmount > 0 ? netAmount : dealPrice));

        const isPartial =
          !isReceived &&
          (clinicDeal.paymentStatus === "PARTIALLY_RECEIVED" ||
            (clinicDeal.receivedAmount && clinicDeal.receivedAmount > 0 && clinicDeal.receivedAmount < netAmount));

        const receivedAmount = isReceived
          ? (clinicDeal.receivedAmount && clinicDeal.receivedAmount > 0 ? clinicDeal.receivedAmount : netAmount)
          : clinicDeal.receivedAmount || 0;

        const creditAmount = receivedAmount;

        const pendingAmount = isReceived
          ? 0
          : Math.max(0, netAmount - receivedAmount);

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

        return {
          sNo: sNo++,
          donorName: r.personalInfo?.fullName || "Donor",
          registrationId: r.registrationId,
          clinicName: hosp?.name || "Unassigned ART Clinic",
          hospitalName: hosp?.name || "Unassigned ART Clinic",
          location: hospitalLocationStr,
          hospitalLocation: hospitalLocationStr,
          hospitalCity: hosp?.city || "",
          hospitalCode: hosp?.code || "",
          donorOpuLocation: opuLocationStr,
          opuLocation: opuLocationStr,
          donorOpuDate: opuDateStr,
          opuDate: opuDateStr,
          pickupDate: opuDateStr,
          invoiceDate,
          invoiceNumber,
          amount: dealPrice,
          dealPrice,
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
          recruitmentDate: r.recruitmentDate ? formatDotDate(r.recruitmentDate) : "-",
          supplyDate: r.supplyDate ? formatDotDate(r.supplyDate) : (r.pickupDate ? formatDotDate(r.pickupDate) : "-"),
          parsedYear: parseYearAndMonth(clinicDeal.invoiceDate || r.invoiceDate, r.pickupDate || r.createdAt).year,
          parsedMonth: parseYearAndMonth(clinicDeal.invoiceDate || r.invoiceDate, r.pickupDate || r.createdAt).month,
        };
      });

      if (statusParam === "RECEIVED" || statusParam === "PAID") {
        clinicEntries = clinicEntries.filter((e) => e.paymentStatus === "RECEIVED");
      } else if (statusParam === "PENDING") {
        clinicEntries = clinicEntries.filter((e) => e.paymentStatus === "PENDING");
      } else if (statusParam === "PARTIAL") {
        clinicEntries = clinicEntries.filter((e) => e.paymentStatus === "PARTIALLY_RECEIVED");
      }

      if (branchParam && branchParam !== "ALL") {
        const bLower = branchParam.toLowerCase().trim();
        clinicEntries = clinicEntries.filter((e) =>
          (e.donorOpuLocation && e.donorOpuLocation.toLowerCase().includes(bLower)) ||
          (e.opuLocation && e.opuLocation.toLowerCase().includes(bLower)) ||
          (e.location && e.location.toLowerCase().includes(bLower)) ||
          (e.hospitalLocation && e.hospitalLocation.toLowerCase().includes(bLower)) ||
          (e.hospitalCity && e.hospitalCity.toLowerCase().includes(bLower))
        );
      }

      if (yearParam && yearParam !== "ALL") {
        const targetYear = parseInt(yearParam, 10);
        clinicEntries = clinicEntries.filter((e: any) => e.parsedYear === targetYear);
      }

      if (monthParam && monthParam !== "ALL") {
        const targetMonth = parseInt(monthParam, 10);
        clinicEntries = clinicEntries.filter((e: any) => e.parsedMonth === targetMonth);
      }

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

        clinicEntries = clinicEntries.filter((e) => {
          const t = parseEntryTime(e.pickupDate) || parseEntryTime(e.opuDate) || parseEntryTime(e.invoiceDate) || parseEntryTime(e.date);
          if (!t) return true;
          if (startMs && t < startMs) return false;
          if (endMs && t > endMs) return false;
          return true;
        });
      }

      clinicEntries = clinicEntries.map((e, idx) => ({ ...e, sNo: idx + 1 }));

      const totalDealPrice = clinicEntries.reduce((sum, e) => sum + (e.amount || e.dealPrice || 0), 0);
      const totalTdsAmount = clinicEntries.reduce((sum, e) => sum + (e.tdsAmount || 0), 0);
      const totalGstAmount = clinicEntries.reduce((sum, e) => sum + (e.gstAmount || 0), 0);
      const totalNetAmount = clinicEntries.reduce((sum, e) => sum + (e.netAmount || 0), 0);
      const totalReceived = clinicEntries.reduce((sum, e) => sum + (e.creditAmount || e.receivedAmount || 0), 0);
      const totalPending = clinicEntries.reduce((sum, e) => sum + (e.pendingAmount || 0), 0);
      const collectionRate = totalNetAmount > 0 ? Math.round((totalReceived / totalNetAmount) * 100) : totalDealPrice > 0 ? Math.round((totalReceived / totalDealPrice) * 100) : 0;

      if (!filterClinicName && clinicEntries.length > 0) {
        const uniqueHospNames = Array.from(new Set(clinicEntries.map((e) => e.hospitalName).filter(Boolean)));
        if (uniqueHospNames.length === 1 && uniqueHospNames[0] !== "Unassigned ART Clinic") {
          filterClinicName = uniqueHospNames[0];
        }
      }

      const pdfData: ClinicLedgerPdfData = {
        reportTitle: filterClinicName
          ? `MEDIYAZ ART BANK LEDGER - ${filterClinicName.toUpperCase()}`
          : "MEDIYAZ ART BANK LEDGER",
        generatedAt,
        generatedBy,
        filterClinicName,
        donorTypeFilter: donorType,
        statusFilter: statusParam,
        entries: clinicEntries,
        totals: {
          totalRecords: clinicEntries.length,
          totalDealPrice,
          totalAmount: totalDealPrice,
          totalTdsAmount,
          totalGstAmount,
          totalNetAmount,
          totalReceived,
          totalCreditAmount: totalReceived,
          totalPending,
          collectionRate,
        },
      };

      const ClinicComponent =
        (ClinicLedgerPdfDocument as any).default || ClinicLedgerPdfDocument;
      const pdfBuffer = await renderToBuffer(
        React.createElement(ClinicComponent, {
          data: pdfData,
        }) as React.ReactElement<any>
      );

      const filename = `Mediyaz_Clinic_Ledger_${new Date().toISOString().split("T")[0]}.pdf`;

      return new Response(pdfBuffer as any, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // Build Donor Ledger PDF
    let donorSNo = 1;
    let donorEntries: DonorLedgerEntry[] = rawRecords.map((r: any) => {
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

      const paidAmount = isPaid ? compensationAmount : donorDeal.advanceAmount || 0;
      const balancePending = isPaid ? 0 : Math.max(0, compensationAmount - paidAmount);

      const paymentStatus: "PAID" | "PENDING" | "PARTIALLY_PAID" = isPaid
        ? "PAID"
        : isPartial
        ? "PARTIALLY_PAID"
        : "PENDING";

      const dateStr = r.pickupDate ? formatDotDate(r.pickupDate) : formatDotDate(r.createdAt || new Date());
      const recruitmentDateStr = r.recruitmentDate
        ? formatDotDate(r.recruitmentDate)
        : (r.createdAt ? formatDotDate(r.createdAt) : "-");
      const supplyDateStr = r.supplyDate
        ? formatDotDate(r.supplyDate)
        : (r.pickupDate ? formatDotDate(r.pickupDate) : "-");
      const paidAtStr = donorDeal.paidAt || r.paidAt ? formatDotDate(donorDeal.paidAt || r.paidAt) : undefined;

      return {
        sNo: donorSNo++,
        registrationId: r.registrationId,
        donorId: r.donorId || r.registrationId,
        donorName: r.personalInfo?.fullName || "Donor",
        donorType: r.donorType as "egg" | "sperm",
        hospitalName: hosp?.name || "Unassigned ART Clinic",
        compensationAmount,
        advanceAmount: donorDeal.advanceAmount || 0,
        paidAmount,
        balancePending,
        paymentMethod: donorDeal.paymentMethod || "bank_transfer",
        paymentStatus,
        date: dateStr,
        recruitmentDate: recruitmentDateStr,
        supplyDate: supplyDateStr,
        paidAt: paidAtStr,
        paymentRef: donorDeal.paymentReference || "",
        parsedYear: parseYearAndMonth(r.pickupDate, r.createdAt).year,
        parsedMonth: parseYearAndMonth(r.pickupDate, r.createdAt).month,
      };
    });

    if (statusParam === "RECEIVED" || statusParam === "PAID") {
      donorEntries = donorEntries.filter((e) => e.paymentStatus === "PAID");
    } else if (statusParam === "PENDING") {
      donorEntries = donorEntries.filter((e) => e.paymentStatus === "PENDING");
    } else if (statusParam === "PARTIAL") {
      donorEntries = donorEntries.filter((e) => e.paymentStatus === "PARTIALLY_PAID");
    }

    if (yearParam && yearParam !== "ALL") {
      const targetYear = parseInt(yearParam, 10);
      donorEntries = donorEntries.filter((e: any) => e.parsedYear === targetYear);
    }

    if (monthParam && monthParam !== "ALL") {
      const targetMonth = parseInt(monthParam, 10);
      donorEntries = donorEntries.filter((e: any) => e.parsedMonth === targetMonth);
    }

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

      donorEntries = donorEntries.filter((e) => {
        const t = parseEntryTime(e.date);
        if (!t) return true;
        if (startMs && t < startMs) return false;
        if (endMs && t > endMs) return false;
        return true;
      });
    }

    donorEntries = donorEntries.map((e, idx) => ({ ...e, sNo: idx + 1 }));

    const totalCompensation = donorEntries.reduce((sum, e) => sum + e.compensationAmount, 0);
    const totalPaid = donorEntries.reduce((sum, e) => sum + e.paidAmount, 0);
    const totalPending = donorEntries.reduce((sum, e) => sum + e.balancePending, 0);
    const settlementRate = totalCompensation > 0 ? Math.round((totalPaid / totalCompensation) * 100) : 0;

    if (!filterClinicName && donorEntries.length > 0) {
      const uniqueHospNames = Array.from(new Set(donorEntries.map((e) => e.hospitalName).filter(Boolean)));
      if (uniqueHospNames.length === 1 && uniqueHospNames[0] !== "Unassigned") {
        filterClinicName = uniqueHospNames[0];
      }
    }

    const donorPdfData: DonorLedgerPdfData = {
      reportTitle: filterClinicName
        ? `MEDIYAZ ART BANK LEDGER - ${filterClinicName.toUpperCase()}`
        : "MEDIYAZ ART BANK LEDGER",
      generatedAt,
      generatedBy,
      filterClinicName,
      donorTypeFilter: donorType,
      statusFilter: statusParam,
      entries: donorEntries,
      totals: {
        totalDonors: donorEntries.length,
        totalCompensation,
        totalPaid,
        totalPending,
        settlementRate,
      },
    };

    const DonorComponent =
      (DonorLedgerPdfDocument as any).default || DonorLedgerPdfDocument;
    const pdfBuffer = await renderToBuffer(
      React.createElement(DonorComponent, {
        data: donorPdfData,
      }) as React.ReactElement<any>
    );

    const filename = `Mediyaz_Donor_Payout_Ledger_${new Date().toISOString().split("T")[0]}.pdf`;

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[LEDGER_PDF_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate ledger PDF" },
      { status: 500 }
    );
  }
}
