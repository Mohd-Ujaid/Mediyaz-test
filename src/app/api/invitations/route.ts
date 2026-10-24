import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Invitation } from "@/models/Invitation";
import { User, UserRole } from "@/models/User";
import { getAuthenticatedActor } from "@/lib/rbac/guard";
import { canAssignRole, getRoleDisplayName } from "@/lib/rbac/roles";
import { sendEmail } from "@/features/email/services/email.service";

export async function GET() {
  try {
    const actor = await getAuthenticatedActor();
    if (!actor) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const query: any = {};
    if (actor.role === UserRole.MANAGER) {
      query.role = UserRole.EMPLOYEE;
    }

    const invitations = await Invitation.find(query)
      .populate("invitedBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ success: true, invitations });
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
    const { email, role, designation, department } = body;

    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: "Email and role are required." },
        { status: 400 }
      );
    }

    const targetRole = role as UserRole;

    // RBAC Hierarchy Enforcement:
    // Admin CANNOT invite Super Admin or Admin.
    // Manager CANNOT invite Super Admin, Admin, or Manager.
    if (!canAssignRole(actor.role, targetRole)) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Your role (${actor.role}) does not have authority to invite a user with role (${targetRole}).`,
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email address is already registered." },
        { status: 400 }
      );
    }

    // Check if pending invitation exists
    const existingInvite = await Invitation.findOne({
      email: email.toLowerCase().trim(),
      status: "PENDING",
      expiresAt: { $gt: new Date() },
    });

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: "A pending invitation already exists for this email address." },
        { status: 400 }
      );
    }

    // Generate secure token (64 hex characters)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const invitation = await Invitation.create({
      email: email.toLowerCase().trim(),
      role: targetRole,
      designation: designation || "Staff",
      department: department || "Clinical Operations",
      token,
      invitedBy: actor.id,
      expiresAt,
      status: "PENDING",
    });

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/accept-invite?token=${token}`;
    const roleName = getRoleDisplayName(targetRole);

    try {
      await sendEmail({
        to: email,
        subject: `Invitation to join Mediyaz ART Bank as ${roleName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0 0 8px;">Mediyaz ART Bank</h2>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Clinical Operations & Administration Portal</p>
            </div>
            
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Hello,<br/><br/>
              You have been invited by <strong>${actor.name}</strong> (${actor.role}) to join the Mediyaz ART Bank system as a <strong>${roleName}</strong>.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteLink}" style="background-color: #285b63; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block;">
                Accept Invitation & Set Up Account
              </a>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              This invitation link is valid for 72 hours.
            </p>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">
              Mediyaz ART Bank Reproductive Healthcare Platform • Confidential
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send invitation email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${email}`,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        inviteLink,
      },
    });
  } catch (error: any) {
    console.error("Invitation creation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
