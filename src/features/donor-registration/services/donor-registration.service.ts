import { connectToDatabase } from "@/lib/mongodb";
import { EggDonorRegistration } from "@/models/EggDonorRegistration";
import { SpermDonorRegistration } from "@/models/SpermDonorRegistration";
import { Notification } from "@/models/Notification";
import { Hospital } from "@/models/Hospital";
import { Agent } from "@/models/Agent";
import { computeEggDonorManagementStatus } from "../utils/egg-donor-status";
import { computeSpermDonorManagementStatus } from "../utils/sperm-donor-status";

function generateRegistrationId(donorType: string): string {
  const prefix = donorType === "egg" ? "MED-ED" : "MED-SD";
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ts = Date.now().toString().slice(-4);
  return `${prefix}-${year}-${rand}${ts}`;
}

async function findRegistrationInModels(id: string) {
  // If ID matches sperm prefix, check SpermDonorRegistration first
  if (id.startsWith("MED-SD") || id.startsWith("SPM")) {
    const spermDoc = await SpermDonorRegistration.findOne({
      $or: [
        { registrationId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
      ]
    });
    if (spermDoc) return { registration: spermDoc, model: SpermDonorRegistration, donorType: "sperm" as const };
  }

  // Otherwise check EggDonorRegistration first
  const eggDoc = await EggDonorRegistration.findOne({
    $or: [
      { registrationId: id },
      { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
    ]
  });
  if (eggDoc) return { registration: eggDoc, model: EggDonorRegistration, donorType: "egg" as const };

  // Fallback check SpermDonorRegistration
  const spermDoc = await SpermDonorRegistration.findOne({
    $or: [
      { registrationId: id },
      { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
    ]
  });
  if (spermDoc) return { registration: spermDoc, model: SpermDonorRegistration, donorType: "sperm" as const };

  return null;
}

export async function createDraftRegistration(donorType: string, bodyData: any) {
  await connectToDatabase();

  if (!donorType || !["sperm", "egg"].includes(donorType)) {
    throw new Error("Valid donorType (sperm/egg) is required.");
  }

  const Model = donorType === "egg" ? EggDonorRegistration : SpermDonorRegistration;

  const {
    personalInfo, contactInfo, medicalInfo, donorInfo,
    labReports, documents, emergencyContact, consent, referral
  } = bodyData;

  const aadhaarNum = personalInfo?.aadhaarNumber;
  const mobileNum = contactInfo?.mobileNumber;
  const cleanAgentCode = donorType === "egg" ? (bodyData.agentCode
    ? String(bodyData.agentCode).trim().toUpperCase()
    : (bodyData.referral?.sourceReferralType === "Agent / Referral Partner" && bodyData.referral?.patientOrDonorId
        ? String(bodyData.referral.patientOrDonorId).trim().toUpperCase()
        : undefined)) : undefined;

  let matchedAgent: any = null;
  let commissionAmount = 0;
  if (cleanAgentCode) {
    matchedAgent = await Agent.findOne({
      $or: [
        { agentCode: new RegExp(`^${cleanAgentCode}$`, "i") },
        { mobileNumber: cleanAgentCode }
      ]
    });
    if (matchedAgent) {
      commissionAmount = donorType === "egg"
        ? (matchedAgent.commissionRates?.eggDonorCommission || 5000)
        : (matchedAgent.commissionRates?.spermDonorCommission || 2000);
    }
  }

  if (aadhaarNum || mobileNum) {
    const query: any = { status: "DRAFT" };
    if (aadhaarNum && mobileNum) {
      query.$or = [
        { "personalInfo.aadhaarNumber": aadhaarNum },
        { "contactInfo.mobileNumber": mobileNum }
      ];
    } else if (aadhaarNum) {
      query["personalInfo.aadhaarNumber"] = aadhaarNum;
    } else {
      query["contactInfo.mobileNumber"] = mobileNum;
    }

    const existing = await Model.findOne(query);
    if (existing) {
      if (cleanAgentCode && (!existing.agentCode || existing.agentCode !== cleanAgentCode)) {
        existing.agentCode = cleanAgentCode;
        if (matchedAgent) {
          existing.agentId = matchedAgent._id;
          existing.agentPayout = {
            amount: commissionAmount,
            status: "PENDING",
            notes: `Referred by Agent ${matchedAgent.fullName} (${matchedAgent.agentCode})`
          };
          if (donorType === "egg") {
            matchedAgent.stats.totalEggDonors = (matchedAgent.stats.totalEggDonors || 0) + 1;
          } else {
            matchedAgent.stats.totalSpermDonors = (matchedAgent.stats.totalSpermDonors || 0) + 1;
          }
          matchedAgent.stats.pendingPayout = (matchedAgent.stats.pendingPayout || 0) + commissionAmount;
          matchedAgent.stats.totalEarnings = (matchedAgent.stats.totalEarnings || 0) + commissionAmount;
          await matchedAgent.save();
        }
        await existing.save();
      }
      return {
        registrationId: existing.registrationId,
        registration: JSON.parse(JSON.stringify(existing)),
      };
    }
  }

  const registrationId = generateRegistrationId(donorType);

  const initialPayout = matchedAgent ? {
    amount: commissionAmount,
    status: "PENDING",
    notes: `Referred by Agent ${matchedAgent.fullName} (${matchedAgent.agentCode})`
  } : undefined;

  const registration = await Model.create({
    registrationId,
    donorType,
    registrationSource: bodyData.registrationSource || "walk_in",
    createdByEmployee: bodyData.createdByEmployee || null,
    status: "DRAFT",
    currentStep: 1,
    personalInfo: personalInfo || {},
    contactInfo: contactInfo || {},
    medicalInfo: medicalInfo || {},
    donorInfo: donorInfo || {},
    labReports: labReports || {},
    documents: documents || {},
    emergencyContact: emergencyContact || {},
    consent: consent || {},
    referral: referral || {},
    agentCode: cleanAgentCode || null,
    agentId: matchedAgent ? matchedAgent._id : null,
    agentPayout: initialPayout,
  });

  if (matchedAgent) {
    if (donorType === "egg") {
      matchedAgent.stats.totalEggDonors = (matchedAgent.stats.totalEggDonors || 0) + 1;
    } else {
      matchedAgent.stats.totalSpermDonors = (matchedAgent.stats.totalSpermDonors || 0) + 1;
    }
    matchedAgent.stats.pendingPayout = (matchedAgent.stats.pendingPayout || 0) + commissionAmount;
    matchedAgent.stats.totalEarnings = (matchedAgent.stats.totalEarnings || 0) + commissionAmount;
    await matchedAgent.save();
  }

  return {
    registrationId: registration.registrationId,
    registration: JSON.parse(JSON.stringify(registration)),
  };
}

/**
 * Admin/Staff: Create a new registration for a walk-in donor directly.
 * Bypasses OTP verification - staff inputs the minimal required details.
 */
export async function createAdminRegistration(body: {
  donorType: string;
  fullName: string;
  aadhaarNumber: string;
  mobileNumber: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  registrationSource?: "walk_in" | "admin_created";
  createdByEmployee?: string;
  adminNotes?: string;
}, session: any) {
  await connectToDatabase();

  const role = session?.user?.role || "";
  if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role)) {
    throw new Error("Unauthorized. Only admin or staff can create walk-in registrations.");
  }

  const { donorType, fullName, aadhaarNumber, mobileNumber } = body;

  if (!donorType || !["sperm", "egg"].includes(donorType)) {
    throw new Error("Valid donorType (sperm/egg) is required.");
  }
  if (!fullName?.trim()) throw new Error("Full name is required.");
  if (!aadhaarNumber || aadhaarNumber.replace(/\D/g, "").length !== 12) {
    throw new Error("Valid 12-digit Aadhaar number is required.");
  }
  if (!mobileNumber || mobileNumber.replace(/\D/g, "").length < 10) {
    throw new Error("Valid mobile number is required.");
  }

  const Model = donorType === "egg" ? EggDonorRegistration : SpermDonorRegistration;

  // Check for duplicate by Aadhaar or mobile in the specific collection
  const existing = await Model.findOne({
    $or: [
      { "personalInfo.aadhaarNumber": aadhaarNumber.replace(/\D/g, "") },
      { "contactInfo.mobileNumber": mobileNumber }
    ]
  });
  if (existing) {
    throw new Error(
      `A registration for this Aadhaar/Mobile already exists: ${existing.registrationId}`
    );
  }

  const registrationId = generateRegistrationId(donorType);

  const registration = await Model.create({
    registrationId,
    donorType,
    registrationSource: body.registrationSource || "admin_created",
    createdByEmployee: body.createdByEmployee || session?.user?.id || null,
    status: "DRAFT",
    currentStep: 1,
    personalInfo: {
      fullName: fullName.trim(),
      aadhaarNumber: aadhaarNumber.replace(/\D/g, ""),
      dateOfBirth: body.dateOfBirth || "",
      gender: body.gender || (donorType === "egg" ? "Female" : "Male"),
      bloodGroup: body.bloodGroup || "",
    },
    contactInfo: {
      mobileNumber,
    },
    adminNotes: body.adminNotes || "",
  });

  return {
    registrationId: registration.registrationId,
    registration: JSON.parse(JSON.stringify(registration)),
  };
}

export async function getRegistrationById(id: string, session: any) {
  await connectToDatabase();
  const found = await findRegistrationInModels(id);

  if (!found) {
    throw new Error("Registration not found.");
  }

  const registration = found.registration;
  const role = session?.user?.role || "";
  const isAdminOrStaff = session && ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
  const isOwner = session && (
    (session.user?.email && registration.contactInfo?.emailAddress && session.user.email.toLowerCase() === registration.contactInfo.emailAddress.toLowerCase()) ||
    ((session.user as any)?.phone && registration.contactInfo?.mobileNumber && (session.user as any).phone === registration.contactInfo.mobileNumber)
  );

  if (!session || isAdminOrStaff || isOwner) {
    return { authorized: true, registration: JSON.parse(JSON.stringify(registration)) };
  }

  // Guest: return sanitized profile to prevent sensitive PII leakage
  const sanitized = {
    registrationId: registration.registrationId,
    donorType: registration.donorType,
    status: registration.status,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
    adminNotes: registration.adminNotes,
    personalInfo: {
      fullName: registration.personalInfo?.fullName ? registration.personalInfo.fullName.replace(/(?<=.).(?=.)/g, "*") : "Altruistic Donor",
      bloodGroup: registration.personalInfo?.bloodGroup || "TBD",
    }
  };

  return { authorized: false, registration: sanitized };
}

export async function updateRegistrationStep(id: string, bodyData: any, session: any) {
  await connectToDatabase();

  const found = await findRegistrationInModels(id);
  if (!found) {
    throw new Error("Registration not found.");
  }

  const registration = found.registration;

  // Check access: DRAFT registrations can be updated by the donor or admin/staff
  const role = session?.user?.role || "";
  const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
  if (registration.status !== "DRAFT" && session && !isAdminOrStaff) {
    throw new Error("Forbidden: Registration has already been submitted and cannot be modified.");
  }

  const update: any = {};
  const allowedKeys = [
    "personalInfo", "contactInfo", "medicalInfo", "donorInfo",
    "labReports", "documents", "emergencyContact",
    "consent", "referral", "currentStep", "status", "adminNotes", "reviewedBy", "reviewedAt",
    "agentCode", "agentId", "agentPayout"
  ];

  for (const key of allowedKeys) {
    if (bodyData[key] !== undefined) {
      if (typeof bodyData[key] === "object" && !Array.isArray(bodyData[key]) && bodyData[key] !== null) {
        for (const [subKey, subVal] of Object.entries(bodyData[key])) {
          update[`${key}.${subKey}`] = subVal;
        }
      } else {
        update[key] = bodyData[key];
      }
    }
  }

  const updatedRegistration = await found.model.findOneAndUpdate(
    { registrationId: registration.registrationId },
    { $set: update },
    { returnDocument: 'after' }
  );

  return updatedRegistration ? JSON.parse(JSON.stringify(updatedRegistration)) : null;
}

export async function submitRegistration(id: string, bodyData: any, session: any) {
  await connectToDatabase();

  const found = await findRegistrationInModels(id);
  if (!found) {
    throw new Error("Registration not found.");
  }

  const registration = found.registration;

  // Check access: DRAFT registrations can be submitted by the donor or admin/staff
  const role = session?.user?.role || "";
  const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
  if (registration.status !== "DRAFT" && session && !isAdminOrStaff) {
    throw new Error("Forbidden: Registration has already been submitted.");
  }

  const allowedKeys = [
    "personalInfo", "contactInfo", "medicalInfo", "donorInfo",
    "labReports", "documents", "emergencyContact", "consent", "referral",
    "agentCode", "agentId", "agentPayout"
  ];

  for (const key of allowedKeys) {
    if (bodyData[key]) {
      (registration as any)[key] = { ...(registration as any)[key]?.toObject?.() || (registration as any)[key], ...bodyData[key] };
    }
  }

  const isEgg = found.donorType === "egg";
  const cleanAgentCode = isEgg ? (bodyData.agentCode
    ? String(bodyData.agentCode).trim().toUpperCase()
    : (bodyData.referral?.sourceReferralType === "Agent / Referral Partner" && bodyData.referral?.patientOrDonorId
        ? String(bodyData.referral.patientOrDonorId).trim().toUpperCase()
        : (registration.agentCode || undefined))) : undefined;

  if (cleanAgentCode) {
    registration.agentCode = cleanAgentCode;
    try {
      const matchedAgent = await Agent.findOne({
        $or: [
          { agentCode: new RegExp(`^${cleanAgentCode}$`, "i") },
          { mobileNumber: cleanAgentCode }
        ]
      });
      if (matchedAgent) {
        registration.agentId = matchedAgent._id;
        const commissionAmount = isEgg
          ? (matchedAgent.commissionRates?.eggDonorCommission || 5000)
          : (matchedAgent.commissionRates?.spermDonorCommission || 2000);
        
        if (!registration.agentPayout || !registration.agentPayout.amount) {
          registration.agentPayout = {
            amount: commissionAmount,
            status: "PENDING",
            notes: `Referred by Agent ${matchedAgent.fullName} (${matchedAgent.agentCode})`
          };
          if (isEgg) {
            matchedAgent.stats.totalEggDonors = (matchedAgent.stats.totalEggDonors || 0) + 1;
          } else {
            matchedAgent.stats.totalSpermDonors = (matchedAgent.stats.totalSpermDonors || 0) + 1;
          }
          matchedAgent.stats.pendingPayout = (matchedAgent.stats.pendingPayout || 0) + commissionAmount;
          matchedAgent.stats.totalEarnings = (matchedAgent.stats.totalEarnings || 0) + commissionAmount;
          await matchedAgent.save();
        }
      }
    } catch (agErr) {
      console.warn("Error associating agent during submission:", agErr);
    }
  }

  registration.status = "SUBMITTED";
  registration.currentStep = 3;
  await registration.save();

  const notif = await Notification.create({
    title: "New Donor Registration",
    message: `A new ${registration.donorType} donor registration (${registration.registrationId}) has been submitted.`,
    type: "REGISTRATION",
    referenceId: registration.registrationId,
  });

  try {
    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger("notifications", "new_notification", notif);
  } catch (pushErr) {
    console.error("Failed to push notification via Pusher:", pushErr);
  }

  // Process referral reward
  if (bodyData.referral && bodyData.referral.sourceReferralType) {
    const { 
      sourceReferralType, 
      referrerName, 
      patientOrDonorId, 
      mobileNumber, 
      relationship, 
      clinicName, 
      department, 
      employeeId, 
      otherSourceDetails 
    } = bodyData.referral;
    
    let rewardEligible = false;
    let rewardAmount = 0;
    let rewardStatus: "Pending" | "Approved" | "Paid" | "Cancelled" = "Pending";
    
    if (["Existing Patient", "Existing Donor", "Staff Member"].includes(sourceReferralType)) {
      rewardEligible = true;
      rewardAmount = 5000;
      rewardStatus = "Pending";
    } else if (["Doctor / Clinic", "Friend / Family"].includes(sourceReferralType)) {
      rewardEligible = true;
      rewardAmount = 2500;
      rewardStatus = "Pending";
    } else {
      rewardEligible = false;
      rewardAmount = 0;
      rewardStatus = "Cancelled";
    }

    const Referral = (await import("@/models/Referral")).Referral;
    await Referral.findOneAndUpdate(
      { referredRegistrationId: registration.registrationId },
      {
        $set: {
          sourceReferralType,
          referrerName: referrerName || "Anonymous",
          patientOrDonorId,
          mobileNumber,
          relationship,
          clinicName,
          department,
          employeeId,
          otherSourceDetails,
          referredDonorName: bodyData.personalInfo?.fullName || registration.personalInfo?.fullName || "Altruistic Donor",
          rewardEligible,
          rewardAmount,
          rewardStatus,
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
  }

  // Trigger workflow notification for completed registration
  try {
    const { triggerWorkflowNotifications } = await import("@/features/notifications/services/workflow-notification.service");
    await triggerWorkflowNotifications(
      "registration_completed",
      registration.personalInfo?.fullName || "Donor Candidate",
      registration.contactInfo?.mobileNumber || "",
      {
        registrationId: registration.registrationId,
        email: registration.contactInfo?.emailAddress || "",
        interest: registration.donorType || (isEgg ? "egg" : "sperm"),
        bloodGroup: registration.personalInfo?.bloodGroup || "N/A"
      }
    );
  } catch (notifErr) {
    console.error("Failed to trigger registration completed notification:", notifErr);
  }

  return JSON.parse(JSON.stringify(registration));
}

export async function deleteDraftRegistration(id: string, session: any) {
  await connectToDatabase();

  const found = await findRegistrationInModels(id);
  if (!found) {
    throw new Error("Registration not found.");
  }

  const registration = found.registration;

  // Check access
  const role = session?.user?.role || "";
  const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
  const isOwner = session && (
    (session.user?.email && registration.contactInfo?.emailAddress && session.user.email.toLowerCase() === registration.contactInfo.emailAddress.toLowerCase()) ||
    ((session.user as any)?.phone && registration.contactInfo?.mobileNumber && (session.user as any).phone === registration.contactInfo.mobileNumber)
  );

  if (!isAdminOrStaff && !isOwner) {
    throw new Error("Forbidden: Access Denied.");
  }

  const result = await found.model.deleteOne({ registrationId: registration.registrationId });
  return result.deletedCount > 0;
}

export async function getAdminRegistrations(filters: {
  search?: string;
  donorType?: string;
  status?: string;
  bloodGroup?: string;
  hospital?: string;
  page?: number;
  limit?: number;
}, session: any) {
  if (!session) {
    throw new Error("Unauthorized: Access Denied.");
  }
  const role = (session.user as any).role;
  const permissions = (session.user as any).permissions || [];
  const isAllowed = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role) || permissions.includes("VIEW_REGISTRATIONS") || permissions.includes("VIEW_REG_CHECKS");
  
  if (!isAllowed) {
    throw new Error("Forbidden: Admins or Authorized Staff only.");
  }

  await connectToDatabase();
  const _forceRegisterHospital = Hospital.modelName;

  const isSperm = filters.donorType === "sperm";
  const Model = isSperm ? SpermDonorRegistration : EggDonorRegistration;

  const { search = "", status = "", bloodGroup = "", hospital = "", page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query: any = {};

  if (status) {
    if (status === "other") {
      query.status = { $in: ["COMPLETED", "UNDER_REVIEW", "SUSPENDED", "REJECTED"] };
    } else {
      query.status = status;
    }
  } else {
    query.status = { $in: ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED", "COMPLETED", "UNDER_REVIEW", "SUSPENDED", "REJECTED", "CANCELLED"] };
  }
  if (bloodGroup) query["personalInfo.bloodGroup"] = bloodGroup;
  if (hospital) query.assignedHospital = hospital;

  if (search) {
    const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    query.$or = [
      { registrationId: { $regex: escapedSearch, $options: "i" } },
      { donorId: { $regex: escapedSearch, $options: "i" } },
      { "personalInfo.fullName": { $regex: escapedSearch, $options: "i" } },
      { "contactInfo.emailAddress": { $regex: escapedSearch, $options: "i" } },
      { "contactInfo.mobileNumber": { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const total = await Model.countDocuments(query);
  const registrationsRaw = await Model.find(query)
    .populate("assignedHospital")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const registrations = registrationsRaw.map((r: any) => JSON.parse(JSON.stringify(r)));

  // Status counts for Management tabs directly from this donor type's collection
  const baseStatusQuery: any = {};
  if (bloodGroup) baseStatusQuery["personalInfo.bloodGroup"] = bloodGroup;
  if (hospital) baseStatusQuery.assignedHospital = hospital;

  const [
    allCount,
    approvedCount,
    waitingForm13Count,
    fileCompletedCount,
    completedCount,
    cancelledCount,
    underReviewCount,
    suspendedCount,
    rejectedCount,
    otherCount,
  ] = await Promise.all([
    Model.countDocuments({
      ...baseStatusQuery,
      status: { $in: ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED", "COMPLETED", "UNDER_REVIEW", "SUSPENDED", "REJECTED", "CANCELLED"] },
    }),
    Model.countDocuments({ ...baseStatusQuery, status: "APPROVED" }),
    Model.countDocuments({ ...baseStatusQuery, status: "WAITING_FORM13" }),
    Model.countDocuments({ ...baseStatusQuery, status: "FILE_COMPLETED" }),
    Model.countDocuments({ ...baseStatusQuery, status: "COMPLETED" }),
    Model.countDocuments({ ...baseStatusQuery, status: "CANCELLED" }),
    Model.countDocuments({ ...baseStatusQuery, status: "UNDER_REVIEW" }),
    Model.countDocuments({ ...baseStatusQuery, status: "SUSPENDED" }),
    Model.countDocuments({ ...baseStatusQuery, status: "REJECTED" }),
    Model.countDocuments({
      ...baseStatusQuery,
      status: { $nin: ["APPROVED", "WAITING_FORM13", "FILE_COMPLETED", "COMPLETED", "CANCELLED", "UNDER_REVIEW", "SUSPENDED", "REJECTED"] },
    }),
  ]);

  return {
    registrations,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit
    },
    statusCounts: {
      all: allCount,
      approved: approvedCount,
      waitingForm13: waitingForm13Count,
      fileCompleted: fileCompletedCount,
      completed: completedCount,
      cancelled: cancelledCount,
      underReview: underReviewCount,
      suspended: suspendedCount,
      rejected: rejectedCount,
      other: otherCount,
    }
  };
}

export async function updateAdminRegistrationStatus(bodyData: any, session: any) {
  if (!session) {
    throw new Error("Unauthorized: Access Denied.");
  }
  const role = (session.user as any).role;
  const permissions = (session.user as any).permissions || [];
  const isAllowed = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role) || permissions.includes("VIEW_REGISTRATIONS") || permissions.includes("VIEW_REG_CHECKS");

  if (!isAllowed) {
    throw new Error("Forbidden: Admins or Authorized Staff only.");
  }

  await connectToDatabase();
  const {
    registrationId,
    status,
    adminNotes,
    assignedHospitalId,
    pickupDate,
    recruitmentDate,
    supplyDate,
    paymentStatus,
    paidAt,
    paidBy,
    paymentReference,
    donorId
  } = bodyData;

  if (!registrationId) {
    throw new Error("Registration ID is required.");
  }

  const found = await findRegistrationInModels(registrationId);
  if (!found) {
    throw new Error("Registration profile not found.");
  }

  const { registration, model: TargetModel, donorType } = found;
  const oldValues = registration.toObject();

  // If status is provided, use it; otherwise compute automatically based on donorType
  let effectiveStatus = status;
  const isEgg = donorType === "egg";

  if (!effectiveStatus && isEgg) {
    const simulated = {
      ...registration.toObject(),
      pickupDate: pickupDate !== undefined ? pickupDate : registration.pickupDate,
      recruitmentDate: recruitmentDate !== undefined ? recruitmentDate : registration.recruitmentDate,
      supplyDate: supplyDate !== undefined ? supplyDate : registration.supplyDate,
      isDonorPaid: paymentStatus !== undefined ? paymentStatus === "PAID" : registration.isDonorPaid,
      donorDeal: {
        ...(registration.donorDeal || {}),
        paymentStatus: paymentStatus !== undefined ? paymentStatus : registration.donorDeal?.paymentStatus,
      },
    };
    if (["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(registration.status)) {
      effectiveStatus = computeEggDonorManagementStatus(simulated).status;
    }
  } else if (!effectiveStatus && !isEgg) {
    const simulated = {
      ...registration.toObject(),
      pickupDate: pickupDate !== undefined ? pickupDate : registration.pickupDate,
      recruitmentDate: recruitmentDate !== undefined ? recruitmentDate : registration.recruitmentDate,
      supplyDate: supplyDate !== undefined ? supplyDate : registration.supplyDate,
      isDonorPaid: paymentStatus !== undefined ? paymentStatus === "PAID" : registration.isDonorPaid,
      donorDeal: {
        ...(registration.donorDeal || {}),
        paymentStatus: paymentStatus !== undefined ? paymentStatus : registration.donorDeal?.paymentStatus,
      },
    };
    if (["APPROVED", "WAITING_FORM13", "FILE_COMPLETED"].includes(registration.status)) {
      effectiveStatus = computeSpermDonorManagementStatus(simulated).status;
    }
  }

  if (effectiveStatus) registration.status = effectiveStatus;
  const statusChanged = effectiveStatus && effectiveStatus !== oldValues.status;
  if (adminNotes !== undefined) registration.adminNotes = adminNotes;
  if (pickupDate !== undefined) registration.pickupDate = pickupDate;
  if (recruitmentDate !== undefined) registration.recruitmentDate = recruitmentDate;
  if (supplyDate !== undefined) registration.supplyDate = supplyDate;
  if (donorId !== undefined) registration.donorId = donorId;

  const adminActor = session.user.name || session.user.email || "Admin";
  const resolvedPaidBy = paidBy || (paymentStatus === "PAID" ? adminActor : null);
  const resolvedPaidAt = paymentStatus === "PAID" ? (paidAt ? new Date(paidAt) : new Date()) : null;

  if (paymentStatus !== undefined) {
    if (!registration.donorDeal) {
      registration.donorDeal = {} as any;
    }
    registration.donorDeal.paymentStatus = paymentStatus;
    registration.donorDeal.paidAt = resolvedPaidAt;
    registration.donorDeal.paidBy = resolvedPaidBy;
    registration.isDonorPaid = paymentStatus === "PAID";
    registration.paidAt = resolvedPaidAt;
    registration.paidBy = resolvedPaidBy;
    if (paymentReference !== undefined) {
      registration.donorDeal.paymentReference = paymentReference;
    }
  }
  
  if (assignedHospitalId !== undefined) {
    const oldHospitalId = registration.assignedHospital;
    const newHospitalId = assignedHospitalId ? assignedHospitalId : null;
    if (String(oldHospitalId) !== String(newHospitalId)) {
      const historyEntry = {
        oldHospital: oldHospitalId || null,
        newHospital: newHospitalId || null,
        assignedBy: session.user.name || session.user.email,
        assignedAt: new Date(),
        reason: bodyData.reason || "Reassigned by administrator"
      };
      
      if (!registration.assignmentHistory) {
        registration.assignmentHistory = [];
      }
      registration.assignmentHistory.push(historyEntry as any);

      registration.assignedHospital = newHospitalId;
      registration.assignedBy = newHospitalId ? (session.user.name || session.user.email) : null;
      registration.assignedAt = newHospitalId ? new Date() : null;
    }
  }

  if (bodyData.clinicDeal !== undefined) registration.clinicDeal = bodyData.clinicDeal;
  if (bodyData.donorDeal !== undefined) registration.donorDeal = bodyData.donorDeal;

  registration.reviewedBy = session.user.name || session.user.email;
  registration.reviewedAt = new Date();
  registration.updatedBy = session.user.name || session.user.email;

  // Track Audit Log for registration status change
  if (statusChanged) {
    try {
      const { createAuditLog } = await import("@/features/audit-logs/services/audit-log.service");
      await createAuditLog(
        null,
        "Registration Status Changed",
        isEgg ? "EggDonorRegistration" : "SpermDonorRegistration",
        registration._id.toString(),
        session.user.name || session.user.email,
        oldValues.status,
        effectiveStatus || status,
        `Changed status of registration ${registration.registrationId} from "${oldValues.status}" to "${effectiveStatus || status}"`
      );
    } catch (auditErr) {
      console.error("Failed to log donor registration update audit:", auditErr);
    }
  }

  if (status === "APPROVED") {
    const { User, UserRole } = await import("@/models/User");
    const { Donor } = await import("@/models/Donor");
    
    let user = await User.findOne({ email: registration.contactInfo.emailAddress.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: registration.personalInfo.fullName,
        email: registration.contactInfo.emailAddress.toLowerCase(),
        phone: registration.contactInfo.mobileNumber,
        role: UserRole.DONOR,
        status: "ACTIVE",
        emailVerified: true
      });
    } else {
      user.role = UserRole.DONOR;
      await user.save();
    }

    let donorRecord = await Donor.findOne({ user: user._id });
    let resolvedDonorId = donorId || registration.donorId || donorRecord?.donorId;
    if (!resolvedDonorId) {
      const count = await Donor.countDocuments();
      const prefix = isEgg ? "MED-ED" : "MED-SD";
      resolvedDonorId = `${prefix}-${new Date().getFullYear()}-${String(count + 1001).padStart(4, "0")}`;
    }

    registration.donorId = resolvedDonorId;

    if (!donorRecord) {
      donorRecord = await Donor.create({
        user: user._id,
        donorId: resolvedDonorId,
        personalInformation: {
          dateOfBirth: registration.personalInfo.dateOfBirth ? new Date(registration.personalInfo.dateOfBirth) : new Date(),
          gender: registration.personalInfo.gender || (isEgg ? "Female" : "Male"),
          bloodGroup: registration.personalInfo.bloodGroup || "O+",
          nationality: registration.personalInfo.nationality || "Indian",
          address: registration.contactInfo.currentAddress || "Not Provided",
          maritalStatus: registration.personalInfo.maritalStatus || "Single",
        },
        physicalAttributes: {
          height: Number(registration.personalInfo.height?.replace(/\D/g, "")) || 170,
          weight: Number(registration.personalInfo.weight?.replace(/\D/g, "")) || 65,
          eyeColor: registration.personalInfo.eyeColor || "Brown",
          hairColor: registration.personalInfo.hairColor || "Black",
          skinTone: registration.personalInfo.complexion || "Medium",
        },
        contactInformation: {
          emergencyContactName: registration.emergencyContact?.contactPersonName || "",
          emergencyContactPhone: registration.emergencyContact?.phoneNumber || "",
          city: registration.contactInfo.city || "",
          state: registration.contactInfo.state || "",
          country: registration.personalInfo.nationality || "India",
          pinCode: registration.contactInfo.pincode || "",
        },
        medicalInformation: {
          eligibility: true,
          hemoglobin: 14.5,
          bloodPressure: "120/80",
          allergies: registration.medicalInfo?.allergies || "None",
          diseases: registration.medicalInfo?.medicalHistory || "None",
          medications: registration.medicalInfo?.currentMedications || "None",
          medicalNotes: adminNotes || "",
        },
        donationInformation: {
          totalDonations: 0,
          certificates: [],
        },
        donationStatus: "ACTIVE",
        approvalStatus: "APPROVED",
        createdBy: session.user.name || "Admin Console",
      });
    }

    // If there's an associated referral, link referredDonorId
    const Referral = (await import("@/models/Referral")).Referral;
    const ref = await Referral.findOneAndUpdate(
      { referredRegistrationId: registration.registrationId },
      { 
        $set: { 
          referredDonorId: resolvedDonorId,
          rewardStatus: "Approved"
        }
      },
      { returnDocument: 'after' }
    );

    // Trigger notification for registration approval
    const { triggerWorkflowNotifications } = await import("@/features/notifications/services/workflow-notification.service");
    await triggerWorkflowNotifications(
      "registration_approved",
      registration.personalInfo.fullName,
      registration.contactInfo.mobileNumber,
      {
        registrationId: registration.registrationId,
        email: registration.contactInfo.emailAddress
      }
    );

    // Trigger notification for referral reward approval if eligible
    if (ref && ref.rewardEligible) {
      await triggerWorkflowNotifications(
        "referral_approved",
        ref.referrerName,
        ref.mobileNumber || "",
        {
          amount: String(ref.rewardAmount),
          referredDonor: registration.personalInfo.fullName
        }
      );
    }
  }

  await registration.save();

  return JSON.parse(JSON.stringify(registration));
}

export async function getAdminRegistrationById(id: string, session: any) {
  if (!session) {
    throw new Error("Unauthorized");
  }
  const role = (session.user as any).role;
  if (!["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role)) {
    throw new Error("Forbidden");
  }

  await connectToDatabase();
  const found = await findRegistrationInModels(id);
  if (!found) {
    throw new Error("Not found");
  }

  return JSON.parse(JSON.stringify(found.registration));
}

export async function patchAdminRegistrationFields(id: string, updateObj: Record<string, any>, session: any) {
  if (!session) {
    throw new Error("Unauthorized");
  }
  const role = (session.user as any).role;
  const permissions = (session.user as any).permissions || [];
  const isAllowed = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role) || permissions.includes("VIEW_REGISTRATIONS");
  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  await connectToDatabase();

  const allowedFields = [
    "personalInfo.fullName",
    "personalInfo.dateOfBirth",
    "personalInfo.aadhaarNumber",
    "personalInfo.age",
    "contactInfo.currentAddress",
    "contactInfo.mobileNumber",
    "consent.signatureDate",
    "documents.extraAttachment",
    "documents.form13",
    "documents.affidavit",
    "form13",
    "affidavit",
    "pickupDate",
    "recruitmentDate",
    "supplyDate",
    "status",
    "certificateIssued",
    "certificateIssuedAt",
    "certificateIssuedBy",
  ];

  const filteredUpdate: Record<string, any> = {};
  for (const key of Object.keys(updateObj)) {
    if (allowedFields.includes(key)) {
      filteredUpdate[key] = updateObj[key];
    }
  }

  if (Object.keys(filteredUpdate).length === 0) {
    throw new Error("No valid fields to update.");
  }

  const found = await findRegistrationInModels(id);
  if (!found) {
    throw new Error("Registration not found.");
  }

  const updated = await found.model.findOneAndUpdate(
    { registrationId: found.registration.registrationId },
    { $set: filteredUpdate },
    { returnDocument: 'after' }
  );

  return JSON.parse(JSON.stringify(updated));
}
