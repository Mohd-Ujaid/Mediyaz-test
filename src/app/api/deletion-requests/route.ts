import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DeletionRequest } from "@/models/DeletionRequest";
import { getAuthenticatedActor } from "@/lib/rbac/guard";
import { isSuperAdmin } from "@/lib/rbac/roles";

export async function GET() {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const query: any = {};
    if (!isSuperAdmin(actor.role)) {
      // Non-super-admins only see their own requests
      query.requestedBy = actor.id;
    }

    const requests = await DeletionRequest.find(query)
      .populate("requestedBy", "name email role")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { resourceType, resourceId, resourceTitle, reason } = body;

    if (!resourceType || !resourceId || !resourceTitle || !reason) {
      return NextResponse.json(
        { success: false, error: "Resource type, ID, title, and deletion reason are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const request = await DeletionRequest.create({
      resourceType,
      resourceId,
      resourceTitle,
      reason: reason.trim(),
      requestedBy: actor.id,
      status: "PENDING",
    });

    return NextResponse.json({
      success: true,
      message: "Deletion request submitted successfully for Super Administrator review.",
      request,
    });
  } catch (error: any) {
    console.error("Deletion request creation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
