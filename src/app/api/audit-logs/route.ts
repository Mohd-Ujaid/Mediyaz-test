import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/features/audit-logs/services/audit-log.service";

// GET — Retrieve administrative audit logs (Admin Only)
export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const entityId = searchParams.get("entityId") || "";
    const entityType = searchParams.get("entityType") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100"); // Allow fetching full chain at once
    const skip = (page - 1) * limit;

    const query: any = {};
    if (entityId) query.entityId = entityId;
    if (entityType) query.entityType = entityType;
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { performedBy: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } }
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      success: true, 
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit
      }
    });
  } catch (error: any) {
    console.error("Fetch audit logs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch audit logs." },
      { status: 500 }
    );
  }
}

// POST — Create a new audit log entry (from client action triggers, e.g. downloads, prints)
export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const { action, entityType, entityId, details, oldValue, newValue } = body;

    if (!action || !entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: "Action, entityType, and entityId are required parameters." },
        { status: 400 }
      );
    }

    await createAuditLog(
      req,
      action,
      entityType,
      entityId,
      session.user.name || session.user.email,
      oldValue,
      newValue,
      details
    );

    return NextResponse.json({ success: true, message: "Audit log recorded successfully." });
  } catch (error: any) {
    console.error("Create audit log error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log event." },
      { status: 500 }
    );
  }
}
