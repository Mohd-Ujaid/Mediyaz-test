import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

// Lightweight in-memory cache (30 seconds) per serverless lambda instance
let cachedBadges: { data: any; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30 * 1000;

export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    const userRole = (session?.user as any)?.role;
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"];

    if (!session || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (cachedBadges && Date.now() < cachedBadges.expiresAt) {
      return NextResponse.json(cachedBadges.data);
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ success: false, error: "Database offline" }, { status: 500 });
    }

    const activeStatuses = ["APPROVED", "FILE_COMPLETED", "COMPLETED"];
    const pendingStatuses = ["NEW", "SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_VERIFIED", "AFFIDAVIT_UPLOADED", "WAITING_FORM13"];

    const invoiceMatch = {
      $or: [
        { isInvoiceGenerated: true },
        { "clinicDeal.isInvoiceGenerated": true },
        { invoiceNumber: { $exists: true, $nin: ["", null] } },
        { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
      ],
      "clinicDeal.paymentStatus": { $ne: "RECEIVED" },
      "clinicDeal.isPaymentReceived": { $ne: true },
    };

    const [
      eggPending,
      spermPending,
      eggCompleted,
      spermCompleted,
      eggInvoicesPending,
      spermInvoicesPending,
      dedicatedInvoicesPending,
    ] = await Promise.all([
      EggDonorRegistration.countDocuments({ status: { $in: pendingStatuses } }).catch(() => 0),
      SpermDonorRegistration.countDocuments({ status: { $in: pendingStatuses } }).catch(() => 0),
      EggDonorRegistration.countDocuments({ status: { $in: activeStatuses } }).catch(() => 0),
      SpermDonorRegistration.countDocuments({ status: { $in: activeStatuses } }).catch(() => 0),
      EggDonorRegistration.countDocuments(invoiceMatch).catch(() => 0),
      SpermDonorRegistration.countDocuments(invoiceMatch).catch(() => 0),
      mongoose.connection.collection("clinicinvoices").countDocuments({ status: { $ne: "PAID" } }).catch(() => 0),
    ]);

    const badges = {
      pendingInvoices: eggInvoicesPending + spermInvoicesPending + dedicatedInvoicesPending,
      eggReview: eggPending,
      spermReview: spermPending,
      completedFilesEgg: eggCompleted,
      completedFilesSperm: spermCompleted,
    };

    const responseData = {
      success: true,
      badges,
    };

    cachedBadges = {
      data: responseData,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
