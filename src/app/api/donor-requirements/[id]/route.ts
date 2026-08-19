import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DonorRequirement } from "@/models/DonorRequirement";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { sendRequirementStatusUpdateEmail } from "@/features/email/services/email.service";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();

    // 1. Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const requirement = await DonorRequirement.findById(params.id)
      .populate("user", "name email phone role")
      .populate("assignedStaff", "name email role");

    if (!requirement) {
      return NextResponse.json({ success: false, error: "Requirement record not found." }, { status: 404 });
    }

    // Role verification: Admin/Staff can see all, patients can only see their own requests
    const isAdminOrStaff = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "STAFF";
    const isOwner = requirement.user && (requirement.user as any)._id?.toString() === userId;

    if (!isAdminOrStaff && !isOwner) {
      return NextResponse.json({ success: false, error: "Access Denied." }, { status: 403 });
    }

    return NextResponse.json({ success: true, requirement });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();

    // 1. Auth check: CRM updates are restricted to Admins and Staff
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = session?.user?.role;
    const staffName = session?.user?.name || "Clinic Staff";

    const isAdminOrStaff = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "STAFF";
    if (!isAdminOrStaff) {
      return NextResponse.json({ success: false, error: "Administrative access required." }, { status: 403 });
    }

    const body = await req.json();
    const requirement = await DonorRequirement.findById(params.id);

    if (!requirement) {
      return NextResponse.json({ success: false, error: "Requirement record not found." }, { status: 404 });
    }

    const oldStatus = requirement.status;

    // 2. Perform granular updates based on body contents
    if (body.status && body.status !== oldStatus) {
      requirement.status = body.status;
      // Trigger status update email
      try {
        if (requirement.personalDetails?.email) {
          await sendRequirementStatusUpdateEmail(
            requirement.personalDetails.email,
            requirement.personalDetails.fullName,
            body.status,
            requirement._id.toString()
          );
        }
      } catch (emailErr) {
        console.warn("Failed to dispatch status email:", emailErr);
      }
    }

    if (body.priority) {
      requirement.priority = body.priority;
    }

    if (body.assignedStaff !== undefined) {
      requirement.assignedStaff = body.assignedStaff === "" ? null : body.assignedStaff;
    }

    if (body.tags) {
      requirement.tags = body.tags;
    }

    // Add internal note
    if (body.note) {
      requirement.internalNotes.push({
        author: staffName,
        note: body.note,
        createdAt: new Date(),
      });
    }

    // Add communication log
    if (body.communication) {
      requirement.communicationHistory.push({
        type: body.communication.type, // Call, WhatsApp, Email
        sender: staffName,
        content: body.communication.content,
        createdAt: new Date(),
      });
    }

    // CRM Tasks management
    if (body.newTask) {
      requirement.tasks.push({
        title: body.newTask.title,
        dueAt: new Date(body.newTask.dueAt || Date.now() + 86400000 * 2), // default 2 days due
        completed: false,
      });
    }

    if (body.toggleTaskId) {
      const task = requirement.tasks.id(body.toggleTaskId);
      if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : undefined;
      }
    }

    await requirement.save();

    const updated = await DonorRequirement.findById(params.id)
      .populate("user", "name email phone role")
      .populate("assignedStaff", "name email role");

    return NextResponse.json({ success: true, requirement: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
