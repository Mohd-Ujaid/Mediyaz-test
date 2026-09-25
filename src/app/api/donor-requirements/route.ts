import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRequirement } from "@/models/DonorRequirement";
import { User, UserRole } from "@/models/User";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import {
  sendRequirementConfirmationUserEmail,
  sendRequirementNotificationAdminEmail,
} from "@/features/email/services/email.service";
import { triggerWorkflowNotifications } from "@/features/notifications/services/workflow-notification.service";

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    // 1. Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const lookingFor = searchParams.get("lookingFor") || "";
    const assignedStaff = searchParams.get("assignedStaff") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const city = searchParams.get("city") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // 2. Query permissions
    let query: any = {};

    const escapeRegex = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "STAFF") {
      // Admin query filters
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (lookingFor) query["treatmentRequirement.lookingFor"] = lookingFor;
      if (bloodGroup) query["donorPreferences.bloodGroup"] = bloodGroup;
      if (city) query["personalDetails.city"] = { $regex: escapeRegex(city), $options: "i" };
      if (assignedStaff) {
        if (assignedStaff === "unassigned") {
          query.assignedStaff = { $exists: false };
        } else {
          query.assignedStaff = assignedStaff;
        }
      }

      if (search) {
        const safeSearch = escapeRegex(search);
        query.$or = [
          { "personalDetails.fullName": { $regex: safeSearch, $options: "i" } },
          { "personalDetails.email": { $regex: safeSearch, $options: "i" } },
          { "personalDetails.phone": { $regex: safeSearch, $options: "i" } },
        ];
      }
    } else {
      // Normal patients can only fetch their own submitted requests
      if (!userId) {
        return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
      }
      query.user = userId;
    }

    const total = await DonorRequirement.countDocuments(query);
    const requirements = await DonorRequirement.find(query)
      .populate("user", "name email phone role")
      .populate("assignedStaff", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      requirements,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // 1. Extract session if available
    const session = await auth.api.getSession({ headers: await headers() });
    let reqUser = session?.user;
    let userId = reqUser?.id;

    // 2. Resolve target User database record
    let targetUserRecord = null;
    const personalEmail = body.personalDetails?.email || reqUser?.email;
    const personalName = body.personalDetails?.fullName || reqUser?.name;
    const personalPhone = body.personalDetails?.phone || (reqUser as any)?.phone;

    if (userId) {
      targetUserRecord = await User.findById(userId);
    } else if (personalEmail) {
      // Security: Only create new recipient record if email is unregistered.
      // Do NOT attach guest submission to an existing account without authentication.
      const existing = await User.findOne({ email: personalEmail.toLowerCase() });
      if (!existing) {
        targetUserRecord = await User.create({
          name: personalName,
          email: personalEmail.toLowerCase(),
          phone: personalPhone,
          role: UserRole.RECIPIENT,
          status: "ACTIVE",
        });
      }
    }

    // 3. Create requirements document
    const donorRequirement = await DonorRequirement.create({
      user: targetUserRecord ? targetUserRecord._id : undefined,
      personalDetails: body.personalDetails,
      treatmentRequirement: body.treatmentRequirement,
      donorPreferences: body.donorPreferences,
      medicalInformation: body.medicalInformation,
      consent: body.consent,
      status: "New",
      priority: "Medium",
    });

    // 4. Dispatch Email Alerts
    try {
      if (personalEmail) {
        await sendRequirementConfirmationUserEmail(
          personalEmail,
          personalName || "Valued Patient",
          donorRequirement._id.toString()
        );
      }

      await sendRequirementNotificationAdminEmail(
        donorRequirement,
        personalName || "A Patient",
        personalEmail || "N/A"
      );

      // Trigger automatic WhatsApp & SMS notifications
      await triggerWorkflowNotifications(
        "requirement_submitted",
        personalName || "Valued Patient",
        personalPhone || "",
        {
          email: personalEmail || "",
          phone: personalPhone || "",
          requirementId: donorRequirement._id.toString()
        }
      );
    } catch (emailError) {
      console.warn("Failed to dispatch donor requirements notifications:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Donor requirement successfully submitted and queued for specialist review!",
      requirement: donorRequirement,
    });
  } catch (error: any) {
    console.error("Submission failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
