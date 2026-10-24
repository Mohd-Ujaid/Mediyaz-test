"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { PreviousDonor } from "@/models/PreviousDonor";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

function generateRecordCode(donorType: "egg" | "sperm"): string {
  const prefix = donorType === "egg" ? "PREV-ED" : "PREV-SD";
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
}

export async function getPreviousDonorsAction(params?: {
  donorType?: "all" | "egg" | "sperm";
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    await connectToDatabase();

    const donorType = params?.donorType || "all";
    const search = (params?.search || "").trim();
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, Math.min(100, params?.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (donorType && donorType !== "all") {
      query.donorType = donorType;
    }

    if (search) {
      const cleanDigits = search.replace(/\D/g, "");
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      
      const orClauses: any[] = [
        { recordCode: searchRegex },
        { legacyId: searchRegex },
        { "personalInfo.fullName": searchRegex },
        { "personalInfo.fatherName": searchRegex },
        { "personalInfo.spouseName": searchRegex },
        { "contactInfo.city": searchRegex },
        { "contactInfo.district": searchRegex },
        { "contactInfo.state": searchRegex },
        { hospitalOrClinic: searchRegex },
      ];

      if (cleanDigits.length >= 3) {
        orClauses.push({ "personalInfo.aadhaarNumber": new RegExp(cleanDigits) });
        orClauses.push({ "contactInfo.mobileNumber": new RegExp(cleanDigits) });
      }

      query.$or = orClauses;
    }

    const [records, totalCount, eggCount, spermCount, aadhaarCount] = await Promise.all([
      PreviousDonor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PreviousDonor.countDocuments(query),
      PreviousDonor.countDocuments({ donorType: "egg" }),
      PreviousDonor.countDocuments({ donorType: "sperm" }),
      PreviousDonor.countDocuments({ "personalInfo.aadhaarNumber": { $exists: true, $nin: ["", null] } }),
    ]);

    return {
      success: true,
      records: JSON.parse(JSON.stringify(records)),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        total: eggCount + spermCount,
        egg: eggCount,
        sperm: spermCount,
        withAadhaar: aadhaarCount,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch previous donor records.",
      records: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      stats: { total: 0, egg: 0, sperm: 0, withAadhaar: 0 },
    };
  }
}

export async function getPreviousDonorByIdAction(id: string) {
  try {
    await connectToDatabase();
    const record = await PreviousDonor.findById(id).lean();
    if (!record) {
      return { success: false, error: "Record not found." };
    }
    return { success: true, record: JSON.parse(JSON.stringify(record)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch record." };
  }
}

export async function checkAadhaarInPreviousDataAction(aadhaar: string, currentRecordId?: string) {
  try {
    await connectToDatabase();
    const clean = (aadhaar || "").toString().replace(/\D/g, "").trim();
    if (!clean || clean.length !== 12) {
      return { exists: false };
    }

    // 1. Check in PreviousDonor collection
    const prevQuery: any = { "personalInfo.aadhaarNumber": clean };
    if (currentRecordId) {
      prevQuery._id = { $ne: currentRecordId };
    }
    const prevMatch = await PreviousDonor.findOne(prevQuery).lean();
    if (prevMatch) {
      const typeLabel = prevMatch.donorType === "sperm" ? "Sperm Donor" : "Egg Donor";
      const code = prevMatch.recordCode || prevMatch.legacyId || "Archived File";
      return {
        exists: true,
        source: "previous",
        donorType: prevMatch.donorType,
        recordCode: code,
        name: prevMatch.personalInfo?.fullName || "Unnamed Record",
        message: `Aadhaar already registered in Previous Donor Database (${typeLabel}, Record: ${code})`,
      };
    }

    // 2. Check in Active Registrations
    const [eggMatch, spermMatch] = await Promise.all([
      EggDonorRegistration.findOne({ "personalInfo.aadhaarNumber": clean, status: { $nin: ["REJECTED", "DRAFT"] } }).lean(),
      SpermDonorRegistration.findOne({ "personalInfo.aadhaarNumber": clean, status: { $nin: ["REJECTED", "DRAFT"] } }).lean(),
    ]);

    if (eggMatch) {
      return {
        exists: true,
        source: "active",
        donorType: "egg",
        recordCode: eggMatch.registrationId,
        name: eggMatch.personalInfo?.fullName || "Egg Donor",
        message: `Aadhaar exists in Egg Donor Registry (App ID: ${eggMatch.registrationId})`,
      };
    }

    if (spermMatch) {
      return {
        exists: true,
        source: "active",
        donorType: "sperm",
        recordCode: spermMatch.registrationId,
        name: spermMatch.personalInfo?.fullName || "Sperm Donor",
        message: `Aadhaar exists in Sperm Donor Registry (App ID: ${spermMatch.registrationId})`,
      };
    }

    return { exists: false };
  } catch (error: any) {
    return { exists: false, error: error.message };
  }
}

export async function savePreviousDonorAction(payload: any) {
  try {
    await connectToDatabase();

    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    const employeeId = session?.user?.id || session?.user?.name || "admin";

    const { _id, ...data } = payload;
    const donorType: "egg" | "sperm" = data.donorType === "sperm" ? "sperm" : "egg";

    // Clean Aadhaar and mobile
    if (data.personalInfo?.aadhaarNumber) {
      data.personalInfo.aadhaarNumber = data.personalInfo.aadhaarNumber.toString().replace(/\D/g, "").trim();
    }
    if (data.contactInfo?.mobileNumber) {
      data.contactInfo.mobileNumber = data.contactInfo.mobileNumber.toString().replace(/\D/g, "").slice(-10);
    }
    if (data.personalInfo?.age && typeof data.personalInfo.age === "string") {
      const parsedAge = parseInt(data.personalInfo.age, 10);
      data.personalInfo.age = isNaN(parsedAge) ? undefined : parsedAge;
    }

    let record;
    if (_id) {
      record = await PreviousDonor.findByIdAndUpdate(
        _id,
        {
          ...data,
          donorType,
          updatedAt: new Date(),
        },
        { new: true, runValidators: false }
      ).lean();

      if (!record) {
        return { success: false, error: "Record not found for updating." };
      }
    } else {
      const recordCode = (data.recordCode || "").trim() || generateRecordCode(donorType);
      record = await PreviousDonor.create({
        ...data,
        recordCode,
        donorType,
        createdByEmployee: employeeId,
      });
      record = record.toObject();
    }

    return {
      success: true,
      record: JSON.parse(JSON.stringify(record)),
      message: _id ? "Record updated successfully." : "Previous donor record saved successfully.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to save record.",
    };
  }
}

export async function deletePreviousDonorAction(id: string) {
  try {
    const { getAuthenticatedActor } = await import("@/lib/rbac/guard");
    const { isSuperAdmin } = await import("@/lib/rbac/roles");
    const actor = await getAuthenticatedActor();

    if (!actor || !isSuperAdmin(actor.role)) {
      return {
        success: false,
        error: "Forbidden: Only the Super Administrator can permanently delete records. Standard Administrators must submit a Deletion Request.",
      };
    }

    await connectToDatabase();
    const deleted = await PreviousDonor.findByIdAndDelete(id);
    if (!deleted) {
      return { success: false, error: "Record not found." };
    }
    return { success: true, message: "Record deleted successfully." };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete record." };
  }
}
