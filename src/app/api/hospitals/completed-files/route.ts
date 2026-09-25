import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { DonorRegistration } from "@/models/DonorRegistration";
import { Hospital } from "@/models/Hospital";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

// GET handler: Fetch all completed files for ART Clinic Management
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
    const permissions = (session.user as any)?.permissions || [];
    const isAllowed =
      ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role) ||
      permissions.includes("VIEW_HOSPITALS") ||
      permissions.includes("VIEW_REGISTRATIONS") ||
      permissions.includes("VIEW_REG_CHECKS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const _forceRegisterHosp = Hospital.modelName;

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const hospitalId = searchParams.get("hospitalId") || "";
    const statusParam = searchParams.get("status") || "all_completed";
    const donorPaymentStatus = searchParams.get("donorPaymentStatus") || "ALL";
    const hospitalPaymentStatus = searchParams.get("hospitalPaymentStatus") || "ALL";
    const donorType = searchParams.get("donorType") || "egg";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const skip = (page - 1) * limit;

    // Status filter
    const query: any = {};
    if (statusParam === "all_completed") {
      query.status = { $in: ["FILE_COMPLETED", "COMPLETED"] };
    } else if (statusParam === "ALL") {
      query.status = { $in: ["APPROVED", "FILE_COMPLETED", "COMPLETED"] };
    } else if (statusParam) {
      query.status = statusParam;
    }

    // Hospital filter
    if (hospitalId && hospitalId !== "ALL") {
      if (mongoose.Types.ObjectId.isValid(hospitalId)) {
        query.assignedHospital = new mongoose.Types.ObjectId(hospitalId);
      } else {
        query.assignedHospital = hospitalId;
      }
    }

    // Donor payment filter
    if (donorPaymentStatus !== "ALL") {
      if (donorPaymentStatus === "PAID") {
        query.$or = [
          { isDonorPaid: true },
          { "donorDeal.paymentStatus": "PAID" },
        ];
      } else if (donorPaymentStatus === "PENDING") {
        query.$and = [
          { isDonorPaid: { $ne: true } },
          { "donorDeal.paymentStatus": { $in: ["PENDING", null, undefined] } },
        ];
      } else if (donorPaymentStatus === "PARTIALLY_PAID") {
        query["donorDeal.paymentStatus"] = "PARTIALLY_PAID";
      }
    }

    // Hospital payment filter
    if (hospitalPaymentStatus !== "ALL") {
      if (hospitalPaymentStatus === "RECEIVED") {
        query.$or = [
          { "clinicDeal.isPaymentReceived": true },
          { "clinicDeal.paymentStatus": "RECEIVED" },
        ];
      } else if (hospitalPaymentStatus === "PENDING") {
        query.$and = [
          { "clinicDeal.isPaymentReceived": { $ne: true } },
          { "clinicDeal.paymentStatus": { $in: ["PENDING", null, undefined] } },
        ];
      } else if (hospitalPaymentStatus === "PARTIALLY_RECEIVED") {
        query["clinicDeal.paymentStatus"] = "PARTIALLY_RECEIVED";
      }
    }

    // Search query
    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    if (search) {
      const searchRegex = { $regex: escapeRegex(search), $options: "i" };
      // Search matching hospital IDs first if search might be hospital name
      const matchingHospitals = await Hospital.find({
        $or: [{ name: searchRegex }, { shortName: searchRegex }, { city: searchRegex }],
      }).select("_id").lean();
      const hospitalIds = matchingHospitals.map((h) => h._id);

      const orClauses: any[] = [
        { registrationId: searchRegex },
        { donorId: searchRegex },
        { "personalInfo.fullName": searchRegex },
        { "personalInfo.husbandName": searchRegex },
        { "personalInfo.spouseName": searchRegex },
        { "contactInfo.emailAddress": searchRegex },
        { "contactInfo.mobileNumber": searchRegex },
      ];

      if (hospitalIds.length > 0) {
        orClauses.push({ assignedHospital: { $in: hospitalIds } });
      }

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: orClauses }];
        delete query.$or;
      } else {
        query.$or = orClauses;
      }
    }

    // Determine collection based on donorType
    let targetModel: any = EggDonorRegistration;
    if (donorType === "sperm") {
      targetModel = SpermDonorRegistration;
    } else if (donorType === "all") {
      targetModel = DonorRegistration;
    }

    const total = await targetModel.countDocuments(query);
    const rawRegistrations = await targetModel
      .find(query)
      .populate("assignedHospital")
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Map and fill defaults for clinic deal & donor deal
    const registrations = rawRegistrations.map((r: any) => {
      const assignedHosp = r.assignedHospital || null;
      let clinicDeal = r.clinicDeal || {};
      const category = clinicDeal.donorCategory || r.donorDeal?.donorCategory || "normal";

      if (!clinicDeal.hospitalDealPrice && assignedHosp) {
        const defaultHospPrice =
          category === "profile"
            ? assignedHosp.profiledonorDealPrice || assignedHosp.donorDealPrice || 85000
            : assignedHosp.donorDealPrice || 65000;
        clinicDeal = {
          ...clinicDeal,
          donorCategory: category,
          hospitalDealPrice: defaultHospPrice,
          currency: assignedHosp.currency || "INR",
          paymentStatus: clinicDeal.paymentStatus || "PENDING",
          isPaymentReceived: !!clinicDeal.isPaymentReceived,
          receivedAmount: clinicDeal.receivedAmount || 0,
        };
      }

      let donorDeal = r.donorDeal || {};
      if (!donorDeal.compensationAmount && assignedHosp) {
        const defaultComp = category === "profile" ? 60000 : 40000;
        donorDeal = {
          ...donorDeal,
          donorCategory: category,
          compensationAmount: defaultComp,
          paymentMethod: donorDeal.paymentMethod || "bank_transfer",
          paymentTerms: donorDeal.paymentTerms || "Full on Retrieval",
          paymentStatus: donorDeal.paymentStatus || (r.isDonorPaid ? "PAID" : "PENDING"),
          advanceAmount: donorDeal.advanceAmount || 0,
          balanceAmount: donorDeal.balanceAmount || (r.isDonorPaid ? 0 : defaultComp),
        };
      }

      const isDonorPaid =
        r.isDonorPaid === true ||
        donorDeal.paymentStatus === "PAID" ||
        (donorDeal.balanceAmount === 0 && (donorDeal.advanceAmount || 0) > 0);

      const isHospitalPaid =
        clinicDeal.isPaymentReceived === true ||
        clinicDeal.paymentStatus === "RECEIVED" ||
        (clinicDeal.receivedAmount && clinicDeal.receivedAmount >= (clinicDeal.hospitalDealPrice || 0));

      return {
        ...r,
        clinicDeal: {
          ...clinicDeal,
          paymentStatus: isHospitalPaid ? "RECEIVED" : (clinicDeal.paymentStatus || "PENDING"),
          isPaymentReceived: isHospitalPaid,
          receivedAmount: clinicDeal.receivedAmount || (isHospitalPaid ? clinicDeal.hospitalDealPrice : 0),
        },
        donorDeal: {
          ...donorDeal,
          paymentStatus: isDonorPaid ? "PAID" : (donorDeal.paymentStatus || "PENDING"),
        },
        isDonorPaid,
      };
    });

    // Calculate aggregated overall KPIs for completed files
    const statsQuery: any = { status: { $in: ["FILE_COMPLETED", "COMPLETED"] } };
    if (targetModel === DonorRegistration) {
      if (donorType === "sperm") statsQuery.donorType = "sperm";
      else if (donorType === "egg") statsQuery.donorType = "egg";
    }

    const allCompletedRecords = await targetModel.find(statsQuery).populate("assignedHospital").lean();

    let totalHospitalDeals = 0;
    let totalHospitalReceived = 0;
    let hospitalPaidCount = 0;
    let hospitalPendingCount = 0;

    let totalDonorDeals = 0;
    let totalDonorPaid = 0;
    let donorPaidCount = 0;
    let donorPendingCount = 0;

    let scheduledPickupsCount = 0;

    for (const rec of allCompletedRecords as any[]) {
      const hosp = rec.assignedHospital;
      const cat = rec.clinicDeal?.donorCategory || "normal";
      const hospPrice =
        rec.clinicDeal?.hospitalDealPrice ||
        (hosp
          ? cat === "profile"
            ? hosp.profiledonorDealPrice || hosp.donorDealPrice || 85000
            : hosp.donorDealPrice || 65000
          : 65000);

      const donorComp =
        rec.donorDeal?.compensationAmount || (cat === "profile" ? 60000 : 40000);

      totalHospitalDeals += hospPrice;
      totalDonorDeals += donorComp;

      const isHospPaid =
        rec.clinicDeal?.isPaymentReceived === true ||
        rec.clinicDeal?.paymentStatus === "RECEIVED";
      const hospRecAmount = rec.clinicDeal?.receivedAmount || (isHospPaid ? hospPrice : 0);
      totalHospitalReceived += hospRecAmount;

      if (isHospPaid || hospRecAmount >= hospPrice) {
        hospitalPaidCount++;
      } else {
        hospitalPendingCount++;
      }

      const isDnrPaid =
        rec.isDonorPaid === true ||
        rec.donorDeal?.paymentStatus === "PAID";
      const donorPaidAmt =
        rec.donorDeal?.advanceAmount && !isDnrPaid
          ? rec.donorDeal.advanceAmount
          : isDnrPaid
          ? donorComp
          : 0;
      totalDonorPaid += donorPaidAmt;

      if (isDnrPaid) {
        donorPaidCount++;
      } else {
        donorPendingCount++;
      }

      if (rec.pickupDate || rec.supplyDate || rec.recruitmentDate) {
        scheduledPickupsCount++;
      }
    }

    const stats = {
      totalCompletedFiles: allCompletedRecords.length,
      totalHospitalDeals,
      totalHospitalReceived,
      totalHospitalPending: Math.max(0, totalHospitalDeals - totalHospitalReceived),
      hospitalPaidCount,
      hospitalPendingCount,
      totalDonorDeals,
      totalDonorPaid,
      totalDonorPending: Math.max(0, totalDonorDeals - totalDonorPaid),
      donorPaidCount,
      donorPendingCount,
      scheduledPickupsCount,
    };

    return NextResponse.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      page,
      limit,
      registrations,
      stats,
    });
  } catch (error: any) {
    console.error("Error in GET /api/hospitals/completed-files:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH handler: Update deals, payouts, hospital receipt status, schedule dates, or file status
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
    const permissions = (session.user as any)?.permissions || [];
    const isAllowed =
      ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR"].includes(role) ||
      permissions.includes("VIEW_HOSPITALS") ||
      permissions.includes("VIEW_REGISTRATIONS");

    if (!isAllowed) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userName = session.user?.name || session.user?.email || "Admin";
    const body = await req.json();
    const { registrationId, donorType = "egg", ...updateFields } = body;

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "registrationId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find existing registration across collections
    const existingEgg = await EggDonorRegistration.findOne({ registrationId });
    const existingSperm = !existingEgg ? await SpermDonorRegistration.findOne({ registrationId }) : null;
    const existingDonor = !existingEgg && !existingSperm ? await DonorRegistration.findOne({ registrationId }) : null;

    const existing = existingEgg || existingSperm || existingDonor;
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Registration record not found" },
        { status: 404 }
      );
    }

    const updatePayload: any = {
      updatedBy: userName,
      updatedAt: new Date(),
    };

    // Hospital Deal & Payment Received from Hospital
    if (updateFields.clinicDeal !== undefined) {
      const prevClinic = existing.clinicDeal || {};
      const isReceived =
        updateFields.clinicDeal.paymentStatus === "RECEIVED" ||
        updateFields.clinicDeal.isPaymentReceived === true;

      const receivedAmt =
        updateFields.clinicDeal.receivedAmount !== undefined
          ? Number(updateFields.clinicDeal.receivedAmount)
          : isReceived
          ? updateFields.clinicDeal.hospitalDealPrice || prevClinic.hospitalDealPrice || 0
          : prevClinic.receivedAmount || 0;

      updatePayload.clinicDeal = {
        ...prevClinic,
        ...updateFields.clinicDeal,
        isPaymentReceived: isReceived,
        paymentStatus: isReceived ? "RECEIVED" : (updateFields.clinicDeal.paymentStatus || prevClinic.paymentStatus || "PENDING"),
        receivedAmount: receivedAmt,
        receivedAt: isReceived ? (updateFields.clinicDeal.receivedAt || new Date()) : null,
        agreedBy: prevClinic.agreedBy || userName,
        agreedAt: prevClinic.agreedAt || new Date(),
      };
    }

    // Donor Deal & Donor Payout Status
    if (updateFields.donorDeal !== undefined || updateFields.isDonorPaid !== undefined) {
      const prevDonorDeal = existing.donorDeal || {};
      const isPaid =
        updateFields.isDonorPaid === true ||
        updateFields.donorDeal?.paymentStatus === "PAID";

      const compensationAmount =
        updateFields.donorDeal?.compensationAmount !== undefined
          ? Number(updateFields.donorDeal.compensationAmount)
          : prevDonorDeal.compensationAmount || 40000;

      const advanceAmount =
        updateFields.donorDeal?.advanceAmount !== undefined
          ? Number(updateFields.donorDeal.advanceAmount)
          : prevDonorDeal.advanceAmount || 0;

      const balanceAmount = isPaid
        ? 0
        : Math.max(0, compensationAmount - advanceAmount);

      updatePayload.donorDeal = {
        ...prevDonorDeal,
        ...(updateFields.donorDeal || {}),
        compensationAmount,
        advanceAmount,
        balanceAmount,
        paymentStatus: isPaid ? "PAID" : (updateFields.donorDeal?.paymentStatus || prevDonorDeal.paymentStatus || "PENDING"),
        paidAt: isPaid ? (updateFields.donorDeal?.paidAt || new Date()) : null,
        paidBy: isPaid ? (updateFields.donorDeal?.paidBy || userName) : null,
      };

      updatePayload.isDonorPaid = isPaid;
      updatePayload.paidAt = isPaid ? new Date() : null;
      updatePayload.paidBy = isPaid ? userName : null;
    }

    // Schedule Dates
    if (updateFields.pickupDate !== undefined) updatePayload.pickupDate = updateFields.pickupDate;
    if (updateFields.recruitmentDate !== undefined) updatePayload.recruitmentDate = updateFields.recruitmentDate;
    if (updateFields.supplyDate !== undefined) updatePayload.supplyDate = updateFields.supplyDate;

    // Assigned Hospital
    if (updateFields.assignedHospital !== undefined) {
      if (updateFields.assignedHospital && mongoose.Types.ObjectId.isValid(updateFields.assignedHospital)) {
        updatePayload.assignedHospital = new mongoose.Types.ObjectId(updateFields.assignedHospital);
      } else {
        updatePayload.assignedHospital = updateFields.assignedHospital || null;
      }
    }

    // Status (e.g. FILE_COMPLETED, COMPLETED)
    if (updateFields.status !== undefined) {
      updatePayload.status = updateFields.status;
      updatePayload.reviewedBy = userName;
      updatePayload.reviewedAt = new Date();
    }

    if (updateFields.adminNotes !== undefined) {
      updatePayload.adminNotes = updateFields.adminNotes;
    }

    // Update EggDonorRegistration if applicable
    let updatedDoc: any = null;
    if (existingEgg) {
      updatedDoc = await EggDonorRegistration.findOneAndUpdate(
        { registrationId },
        { $set: updatePayload },
        { new: true }
      ).populate("assignedHospital");
    }

    // Update SpermDonorRegistration if applicable
    if (existingSperm) {
      updatedDoc = await SpermDonorRegistration.findOneAndUpdate(
        { registrationId },
        { $set: updatePayload },
        { new: true }
      ).populate("assignedHospital");
    }

    // Audit logging
    try {
      const { createAuditLog } = await import("@/features/audit-logs/services/audit-log.service");
      await createAuditLog(
        null,
        "Completed File & Deals Updated",
        existingEgg ? "EggDonorRegistration" : "SpermDonorRegistration",
        existing._id.toString(),
        userName,
        existing.status,
        updatePayload.status || existing.status,
        `Updated details for registration ${registrationId}: Hospital Payment: ${updatePayload.clinicDeal?.paymentStatus || "unchanged"}, Donor Payout: ${updatePayload.donorDeal?.paymentStatus || "unchanged"}, Schedule: Pickup (${updatePayload.pickupDate || "N/A"}), Supply (${updatePayload.supplyDate || "N/A"})`
      );
    } catch (auditErr) {
      console.warn("Audit log non-fatal error:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Completed file details updated successfully",
      registration: updatedDoc || existing,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/hospitals/completed-files:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
