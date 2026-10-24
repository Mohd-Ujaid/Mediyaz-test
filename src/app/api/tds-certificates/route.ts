import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TdsCertificate } from "@/models/TdsCertificate";
import { ClinicPayment } from "@/models/ClinicPayment";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

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
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get("hospitalId") || "";
    const fy = searchParams.get("financialYear") || searchParams.get("fy") || "";
    const quarter = searchParams.get("quarter") || "";

    const filter: any = {};
    if (hospitalId && hospitalId !== "ALL" && mongoose.Types.ObjectId.isValid(hospitalId)) {
      filter.hospital = new mongoose.Types.ObjectId(hospitalId);
    }
    if (fy && fy !== "ALL") {
      filter.financialYear = fy;
    }
    if (quarter && quarter !== "ALL") {
      filter.quarter = quarter;
    }

    const certificates = await TdsCertificate.find(filter)
      .populate("hospital", "name shortName code city state gstNumber")
      .sort({ financialYear: -1, quarter: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, certificates });
  } catch (error: any) {
    console.error("[TDS_CERTIFICATES_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load TDS certificates" },
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
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const userName = session.user?.name || session.user?.email || "Admin";
    const body = await req.json();
    const {
      hospitalId,
      financialYear,
      quarter,
      certificateNo,
      tdsAmountAsPerCert,
      receivedOn,
      fileUrl = "",
      notes = "",
    } = body;

    if (!hospitalId || !financialYear || !quarter || tdsAmountAsPerCert === undefined) {
      return NextResponse.json(
        { success: false, error: "hospitalId, financialYear, quarter and tdsAmountAsPerCert are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const hosp = await Hospital.findById(hospitalId);
    if (!hosp) {
      return NextResponse.json({ success: false, error: "Hospital not found" }, { status: 404 });
    }

    // Query system recorded TDS for this hospital, FY and quarter
    const paymentAgg = await ClinicPayment.aggregate([
      {
        $match: {
          hospital: hosp._id,
          financialYear,
          quarter,
          isVoided: false,
        },
      },
      {
        $group: {
          _id: null,
          totalTdsDeducted: { $sum: "$totalTdsDeducted" },
        },
      },
    ]);

    const tdsDeductedInSystem = paymentAgg[0]?.totalTdsDeducted || 0;
    const certAmt = Number(tdsAmountAsPerCert);
    const diff = certAmt - tdsDeductedInSystem;

    let status: "MATCHED" | "SHORT" | "SURPLUS" | "PENDING" = "MATCHED";
    if (Math.abs(diff) <= 10) {
      status = "MATCHED";
    } else if (diff < 0) {
      status = "SHORT"; // Certificate shows less TDS than what was deducted in payments
    } else {
      status = "SURPLUS";
    }

    const certData = {
      hospital: hosp._id,
      hospitalName: hosp.name,
      financialYear,
      quarter,
      certificateNo: certificateNo || "",
      tdsAmountAsPerCert: certAmt,
      tdsDeductedInSystem,
      differenceAmount: diff,
      status,
      receivedOn: receivedOn ? new Date(receivedOn) : new Date(),
      fileUrl,
      notes,
      recordedBy: userName,
    };

    const updatedCert = await TdsCertificate.findOneAndUpdate(
      { hospital: hosp._id, financialYear, quarter },
      { $set: certData },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Form 16A Certificate for ${hosp.name} (${financialYear} ${quarter}) recorded successfully`,
      certificate: updatedCert,
    });
  } catch (error: any) {
    console.error("[TDS_CERTIFICATES_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save TDS certificate" },
      { status: 500 }
    );
  }
}
