import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Invitation } from "@/models/Invitation";
import { getRoleDisplayName } from "@/lib/rbac/roles";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invitation token is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const invitation = await Invitation.findOne({ token }).populate("invitedBy", "name email");

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid or nonexistent invitation link." },
        { status: 404 }
      );
    }

    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { success: false, error: "This invitation has already been accepted. Please sign in." },
        { status: 400 }
      );
    }

    if (invitation.status === "REVOKED") {
      return NextResponse.json(
        { success: false, error: "This invitation has been revoked by an administrator." },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { success: false, error: "This invitation link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        roleDisplayName: getRoleDisplayName(invitation.role),
        designation: invitation.designation,
        department: invitation.department,
        invitedByName: (invitation.invitedBy as any)?.name || "Administrator",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
