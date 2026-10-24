import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User, UserRole, IUser } from "@/models/User";
import { isStaffRole, canDeleteRecords, canManageUser, isSuperAdmin } from "./roles";
import { hasPermission, Permission, PERMISSIONS } from "./permissions";

export interface AuthenticatedActor {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  designation?: string;
  permissions: string[];
  twoFactorEnabled?: boolean;
}

/**
 * Retrieves the currently authenticated actor from Better-Auth session and MongoDB.
 */
export async function getAuthenticatedActor(): Promise<AuthenticatedActor | null> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return null;
    }

    await connectToDatabase();
    const dbUser = await User.findById(session.user.id).select(
      "name email role status designation permissions twoFactorEnabled"
    );

    if (!dbUser || dbUser.status !== "ACTIVE") {
      return null;
    }

    return {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      designation: dbUser.designation,
      permissions: dbUser.permissions || [],
      twoFactorEnabled: dbUser.twoFactorEnabled,
    };
  } catch (error) {
    console.error("RBAC Guard Error getting session:", error);
    return null;
  }
}

/**
 * Enforces that an actor is logged in and belongs to an authorized staff role.
 */
export async function requireStaffActor(): Promise<
  { actor: AuthenticatedActor; errorResponse: null } | { actor: null; errorResponse: NextResponse }
> {
  const actor = await getAuthenticatedActor();

  if (!actor) {
    return {
      actor: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized: Please log in." },
        { status: 401 }
      ),
    };
  }

  if (!isStaffRole(actor.role)) {
    return {
      actor: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden: Staff portal authorization required." },
        { status: 403 }
      ),
    };
  }

  return { actor, errorResponse: null };
}

/**
 * Enforces a specific permission check.
 */
export async function requirePermission(permission: Permission): Promise<
  { actor: AuthenticatedActor; errorResponse: null } | { actor: null; errorResponse: NextResponse }
> {
  const check = await requireStaffActor();
  if (check.errorResponse) return check;

  const { actor } = check;
  const authorized =
    isSuperAdmin(actor.role) ||
    hasPermission(actor.role, permission) ||
    actor.permissions.includes(permission);

  if (!authorized) {
    return {
      actor: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: You do not have permission (${permission}) to perform this action.`,
        },
        { status: 403 }
      ),
    };
  }

  return { actor, errorResponse: null };
}

/**
 * EXCLUSIVE Super Admin Guard for DELETE operations.
 * Strictly prevents Admin or anyone else from deleting records.
 */
export async function requireSuperAdminForDelete(): Promise<
  { actor: AuthenticatedActor; errorResponse: null } | { actor: null; errorResponse: NextResponse }
> {
  const check = await requireStaffActor();
  if (check.errorResponse) return check;

  const { actor } = check;
  if (!canDeleteRecords(actor.role)) {
    return {
      actor: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: Deletion permission is strictly restricted to the Super Administrator. Administrators may submit a Deletion Request for review.",
        },
        { status: 403 }
      ),
    };
  }

  return { actor, errorResponse: null };
}

/**
 * Enforces hierarchy rules when managing users:
 * Admin cannot view/edit/delete/suspend Super Admin.
 * Manager cannot view/edit/delete Admin or Super Admin.
 */
export function checkUserManagementAccess(
  actorRole: UserRole,
  targetRole: UserRole
): { allowed: boolean; error?: string } {
  if (targetRole === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
    return {
      allowed: false,
      error: "Forbidden: Administrators cannot modify, view private keys of, or alter the Super Administrator.",
    };
  }

  if (!canManageUser(actorRole, targetRole)) {
    return {
      allowed: false,
      error: `Forbidden: Your role (${actorRole}) does not have authority over role (${targetRole}).`,
    };
  }

  return { allowed: true };
}
