import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const reqHeaders = await headers();
    let session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    if (!session) {
      session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Query pending review status
    const pendingStatuses = ["NEW", "SUBMITTED", "UNDER_REVIEW", "WAITING_FORM13"];

    const [
      pendingEggReviews,
      pendingSpermReviews,
      completedEggFiles,
      completedSpermFiles,
      unpaidEggInvoices,
      unpaidSpermInvoices,
    ] = await Promise.all([
      EggDonorRegistration.countDocuments({ status: { $in: pendingStatuses } }).catch(() => 0),
      SpermDonorRegistration.countDocuments({ status: { $in: pendingStatuses } }).catch(() => 0),
      EggDonorRegistration.countDocuments({ status: "FILE_COMPLETED" }).catch(() => 0),
      SpermDonorRegistration.countDocuments({ status: "FILE_COMPLETED" }).catch(() => 0),
      // Invoices needing collection
      EggDonorRegistration.countDocuments({
        $and: [
          {
            $or: [
              { isInvoiceGenerated: true },
              { "clinicDeal.isInvoiceGenerated": true },
              { invoiceNumber: { $exists: true, $nin: ["", null] } },
              { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
            ],
          },
          {
            $or: [
              { "clinicDeal.paymentStatus": { $in: ["PENDING", "PARTIALLY_RECEIVED"] } },
              { "clinicDeal.isPaymentReceived": { $ne: true } },
            ],
          },
        ],
      }).catch(() => 0),
      SpermDonorRegistration.countDocuments({
        $and: [
          {
            $or: [
              { isInvoiceGenerated: true },
              { "clinicDeal.isInvoiceGenerated": true },
              { invoiceNumber: { $exists: true, $nin: ["", null] } },
              { "clinicDeal.invoiceNumber": { $exists: true, $nin: ["", null] } },
            ],
          },
          {
            $or: [
              { "clinicDeal.paymentStatus": { $in: ["PENDING", "PARTIALLY_RECEIVED"] } },
              { "clinicDeal.isPaymentReceived": { $ne: true } },
            ],
          },
        ],
      }).catch(() => 0),
    ]);

    return NextResponse.json({
      success: true,
      badges: {
        eggReview: pendingEggReviews,
        spermReview: pendingSpermReviews,
        completedFilesEgg: completedEggFiles,
        completedFilesSperm: completedSpermFiles,
        completedFilesTotal: completedEggFiles + completedSpermFiles,
        pendingInvoices: unpaidEggInvoices + unpaidSpermInvoices,
      },
    });
  } catch (error: any) {
    console.error("Badge counts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
