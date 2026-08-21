import { connectToDatabase } from "@/lib/mongodb";
import { DonorRegistration } from "@/models/DonorRegistration";
import { Notification } from "@/models/Notification";
import { Hospital } from "@/models/Hospital";

function generateRegistrationId(donorType: string): string {
  const prefix = donorType === "egg" ? "MED-ED" : "MED-SD";
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ts = Date.now().toString().slice(-4);
  return `${prefix}-${year}-${rand}${ts}`;
}

export async function createDraftRegistration(donorType: string, bodyData: any) {
  await connectToDatabase();

  if (!donorType || !["sperm", "egg"].includes(donorType)) {
    throw new Error("Valid donorType (sperm/egg) is required.");
  }

  const {
    personalInfo, contactInfo, medicalInfo, donorInfo,
    labReports, documents, emergencyContact, bankDetails, consent, referral
  } = bodyData;

  const aadhaarNum = personalInfo?.aadhaarNumber;
  const mobileNum = contactInfo?.mobileNumber;

  if (aadhaarNum || mobileNum) {
    const query: any = { status: "DRAFT", donorType };
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

    const existing = await DonorRegistration.findOne(query);
    if (existing) {
      return {
        registrationId: existing.registrationId,
        registration: JSON.parse(JSON.stringify(existing)),
      };
    }
  }

  const registrationId = generateRegistrationId(donorType);

  const registration = await DonorRegistration.create({
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
    bankDetails: bankDetails || {},
    consent: consent || {},
    referral: referral || {},
  });

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

  // Check for duplicate by Aadhaar or mobile
  const existing = await DonorRegistration.findOne({
    donorType,
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

  const registration = await DonorRegistration.create({
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
      gender: body.gender || "",
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
  const registration = await DonorRegistration.findOne({ registrationId: id });

  if (!registration) {
    throw new Error("Registration not found.");
  }

  const role = session?.user?.role || "";
  const isAdminOrStaff = session && ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
  const isOwner = session && (
    (session.user.email && registration.contactInfo?.emailAddress && session.user.email.toLowerCase() === registration.contactInfo.emailAddress.toLowerCase()) ||
    ((session.user as any).phone && registration.contactInfo?.mobileNumber && (session.user as any).phone === registration.contactInfo.mobileNumber)
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

  const registration = await DonorRegistration.findOne({ registrationId: id });
  if (!registration) {
    throw new Error("Registration not found.");
  }

  // Check access
  const role = session?.user?.role || "";
  const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
  const isOwner = session && (
    (session.user?.email && registration.contactInfo?.emailAddress && session.user.email.toLowerCase() === registration.contactInfo.emailAddress.toLowerCase()) ||
    ((session.user as any)?.phone && registration.contactInfo?.mobileNumber && (session.user as any).phone === registration.contactInfo.mobileNumber)
  );

  if (session && !isAdminOrStaff && !isOwner) {
    throw new Error("Forbidden: Access Denied.");
  }

  const update: any = {};
  const allowedKeys = [
    "personalInfo", "contactInfo", "medicalInfo", "donorInfo",
    "labReports", "documents", "emergencyContact", "bankDetails",
    "consent", "referral", "investigations", "physicalExamination", "currentStep", "status", "adminNotes", "reviewedBy", "reviewedAt"
  ];

  for (const key of allowedKeys) {
    if (bodyData[key] !== undefined) {
      if (typeof bodyData[key] === "object" && !Array.isArray(bodyData[key]) && bodyData[key] !== null) {
        // Merge sub-object fields
        for (const [subKey, subVal] of Object.entries(bodyData[key])) {
          update[`${key}.${subKey}`] = subVal;
        }
      } else {
        update[key] = bodyData[key];
      }
    }
  }

  const updatedRegistration = await DonorRegistration.findOneAndUpdate(
    { registrationId: id },
    { $set: update },
    { new: true }
  );

  return updatedRegistration ? JSON.parse(JSON.stringify(updatedRegistration)) : null;
}

export async function submitRegistration(id: string, bodyData: any, session: any) {
  await connectToDatabase();

  const registration = await DonorRegistration.findOne({ registrationId: id });
  if (!registration) {
    throw new Error("Registration not found.");
  }

  // Check access
  const role = session?.user?.role || "";
  const isAdminOrStaff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role);
  const isOwner = session && (
    (session.user?.email && registration.contactInfo?.emailAddress && session.user.email.toLowerCase() === registration.contactInfo.emailAddress.toLowerCase()) ||
    ((session.user as any)?.phone && registration.contactInfo?.mobileNumber && (session.user as any).phone === registration.contactInfo.mobileNumber)
  );

  if (session && !isAdminOrStaff && !isOwner) {
    throw new Error("Forbidden: Access Denied.");
  }

  const allowedKeys = [
    "personalInfo", "contactInfo", "medicalInfo", "donorInfo",
    "labReports", "documents", "emergencyContact", "bankDetails", "consent", "referral",
    "investigations", "physicalExamination"
  ];

  for (const key of allowedKeys) {
    if (bodyData[key]) {
      (registration as any)[key] = { ...(registration as any)[key]?.toObject?.() || (registration as any)[key], ...bodyData[key] };
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
      { referredRegistrationId: id },
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
      { upsert: true, new: true }
    );
  }

  // Trigger completed notification
  try {
    const isEmployee = ["SUPER_ADMIN", "ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role);
    if (!isEmployee) {
      const { triggerWorkflowNotifications } = await import("@/features/notifications/services/workflow-notification.service");
      await triggerWorkflowNotifications(
        "registration_completed",
        registration.personalInfo?.fullName || "Donor Candidate",
        registration.contactInfo?.mobileNumber || "",
        {
          registrationId: id,
          email: registration.contactInfo?.emailAddress || "",
          interest: registration.donorType || "sperm",
          bloodGroup: registration.personalInfo?.bloodGroup || "N/A"
        }
      );
    }
  } catch (notifErr) {
    console.error("Failed to trigger registration completed notification:", notifErr);
  }

  return JSON.parse(JSON.stringify(registration));
}

export async function deleteDraftRegistration(id: string, session: any) {
  await connectToDatabase();

  const registration = await DonorRegistration.findOne({ registrationId: id });
  if (!registration) {
    throw new Error("Registration not found.");
  }

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

  const result = await DonorRegistration.deleteOne({ registrationId: id });
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
  const isAllowed = ["ADMIN", "SUPER_ADMIN"].includes(role) || permissions.includes("VIEW_REGISTRATIONS") || permissions.includes("VIEW_REG_CHECKS");
  
  if (!isAllowed) {
    throw new Error("Forbidden: Admins or Authorized Staff only.");
  }

  await connectToDatabase();
  const _forceRegisterHospital = Hospital.modelName;

  const { search = "", donorType = "", status = "", bloodGroup = "", hospital = "", page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (donorType) query.donorType = donorType;
  if (status) query.status = status;
  if (bloodGroup) query["personalInfo.bloodGroup"] = bloodGroup;
  if (hospital) query.assignedHospital = hospital;

  if (search) {
    const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    query.$or = [
      { registrationId: { $regex: escapedSearch, $options: "i" } },
      { "personalInfo.fullName": { $regex: escapedSearch, $options: "i" } },
      { "contactInfo.emailAddress": { $regex: escapedSearch, $options: "i" } },
      { "contactInfo.mobileNumber": { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const total = await DonorRegistration.countDocuments(query);
  const registrationsRaw = await DonorRegistration.find(query)
    .populate("assignedHospital")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const registrations = registrationsRaw.map(r => JSON.parse(JSON.stringify(r)));

  return {
    registrations,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit
    }
  };
}

export async function updateAdminRegistrationStatus(bodyData: any, session: any) {
  if (!session) {
    throw new Error("Unauthorized: Access Denied.");
  }
  const role = (session.user as any).role;
  const permissions = (session.user as any).permissions || [];
  const isAllowed = ["ADMIN", "SUPER_ADMIN"].includes(role) || permissions.includes("VIEW_REGISTRATIONS") || permissions.includes("VIEW_REG_CHECKS");

  if (!isAllowed) {
    throw new Error("Forbidden: Admins or Authorized Staff only.");
  }

  await connectToDatabase();
  const { registrationId, status, adminNotes, assignedHospitalId } = bodyData;

  if (!registrationId) {
    throw new Error("Registration ID is required.");
  }

  const registration = await DonorRegistration.findOne({ registrationId });
  if (!registration) {
    throw new Error("Registration profile not found.");
  }

  const oldValues = registration.toObject();
  const statusChanged = status && status !== registration.status;

  if (status) registration.status = status;
  if (adminNotes !== undefined) registration.adminNotes = adminNotes;
  
  if (assignedHospitalId !== undefined) {
    const oldHospitalId = registration.assignedHospital;
    if (String(oldHospitalId) !== String(assignedHospitalId)) {
      const historyEntry = {
        oldHospital: oldHospitalId || null,
        newHospital: assignedHospitalId || null,
        assignedBy: session.user.name || session.user.email,
        assignedAt: new Date(),
        reason: bodyData.reason || "Reassigned by administrator"
      };
      
      if (!registration.assignmentHistory) {
        registration.assignmentHistory = [];
      }
      registration.assignmentHistory.push(historyEntry as any);

      registration.assignedHospital = assignedHospitalId || null;
      registration.assignedBy = assignedHospitalId ? (session.user.name || session.user.email) : null;
      registration.assignedAt = assignedHospitalId ? new Date() : null;
    }
  }
  
  registration.reviewedBy = session.user.name || session.user.email;
  registration.reviewedAt = new Date();
  registration.updatedBy = session.user.name || session.user.email;

  await registration.save();

  // Track Audit Log for registration status change
  if (statusChanged) {
    try {
      const { createAuditLog } = await import("@/features/audit-logs/services/audit-log.service");
      await createAuditLog(
        null,
        "Registration Status Changed",
        "DonorRegistration",
        registration._id.toString(),
        session.user.name || session.user.email,
        oldValues.status,
        status,
        `Changed status of registration ${registration.registrationId} from "${oldValues.status}" to "${status}"`
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

    const count = await Donor.countDocuments();
    const donorId = `DON-${new Date().getFullYear()}-${String(count + 1001).padStart(4, "0")}`;

    let donorRecord = await Donor.findOne({ user: user._id });
    if (!donorRecord) {
      donorRecord = await Donor.create({
        user: user._id,
        donorId,
        personalInformation: {
          dateOfBirth: registration.personalInfo.dateOfBirth ? new Date(registration.personalInfo.dateOfBirth) : new Date(),
          gender: registration.personalInfo.gender || "Male",
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
          allergies: registration.medicalInfo.allergies || "None",
          diseases: registration.medicalInfo.medicalHistory || "None",
          medications: registration.medicalInfo.currentMedications || "None",
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
      { referredRegistrationId: registrationId },
      { 
        $set: { 
          referredDonorId: donorId,
          rewardStatus: "Approved"
        }
      },
      { new: true }
    );

    // Trigger notification for registration approval
    const { triggerWorkflowNotifications } = await import("@/features/notifications/services/workflow-notification.service");
    await triggerWorkflowNotifications(
      "registration_approved",
      registration.personalInfo.fullName,
      registration.contactInfo.mobileNumber,
      {
        registrationId,
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

  return JSON.parse(JSON.stringify(registration));
}

export async function getAdminRegistrationById(id: string, session: any) {
  if (!session) {
    throw new Error("Unauthorized");
  }
  const role = (session.user as any).role;
  if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role)) {
    throw new Error("Forbidden");
  }

  await connectToDatabase();
  const registration = await DonorRegistration.findOne({ registrationId: id });
  if (!registration) {
    throw new Error("Not found");
  }

  return JSON.parse(JSON.stringify(registration));
}

export async function patchAdminRegistrationFields(id: string, updateObj: Record<string, any>, session: any) {
  if (!session) {
    throw new Error("Unauthorized");
  }
  const role = (session.user as any).role;
  const permissions = (session.user as any).permissions || [];
  const isAllowed = ["ADMIN", "SUPER_ADMIN"].includes(role) || permissions.includes("VIEW_REGISTRATIONS");
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

  const updated = await DonorRegistration.findOneAndUpdate(
    { registrationId: id },
    { $set: filteredUpdate },
    { new: true }
  );

  if (!updated) {
    throw new Error("Registration not found.");
  }

  return JSON.parse(JSON.stringify(updated));
}
