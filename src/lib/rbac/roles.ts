import { UserRole } from "@/models/User";

export { UserRole };

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.MANAGER]: 60,
  [UserRole.EMPLOYEE]: 40,
  [UserRole.DOCTOR]: 40,
  [UserRole.STAFF]: 40,
  [UserRole.RECEPTIONIST]: 40,
  [UserRole.DONOR]: 10,
  [UserRole.RECIPIENT]: 10,
};

export const STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.EMPLOYEE,
  UserRole.DOCTOR,
  UserRole.STAFF,
  UserRole.RECEPTIONIST,
];

export function isStaffRole(role?: string | null): boolean {
  if (!role) return false;
  return STAFF_ROLES.includes(role as UserRole);
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === UserRole.SUPER_ADMIN;
}

/**
 * Super Admin is the ONLY role authorized to directly DELETE any record from the database.
 * Admins are strictly prohibited from deleting records directly.
 */
export function canDeleteRecords(role?: string | null): boolean {
  return role === UserRole.SUPER_ADMIN;
}

/**
 * Validates if actor can manage (edit, suspend, view audit of) target user.
 * - Super Admin can manage anyone except they cannot demote themselves if they are the only Super Admin.
 * - Admin can manage Managers and Employees. Admin CANNOT manage, view, edit, or delete Super Admin.
 * - Manager can manage Employees only. Manager CANNOT manage Admin or Super Admin.
 * - Employee cannot manage any user.
 */
export function canManageUser(actorRole: string, targetRole: string): boolean {
  const actorRank = ROLE_HIERARCHY[actorRole as UserRole] || 0;
  const targetRank = ROLE_HIERARCHY[targetRole as UserRole] || 0;

  // An actor can strictly only manage users of lower hierarchy rank
  return actorRank > targetRank;
}

/**
 * Validates if actor can assign or invite a user into a specific role.
 * - Super Admin can assign ADMIN, MANAGER, EMPLOYEE (cannot create 2nd Super Admin directly).
 * - Admin can assign MANAGER, EMPLOYEE. Admin CANNOT assign ADMIN or SUPER_ADMIN.
 * - Manager can assign EMPLOYEE.
 */
export function canAssignRole(actorRole: string, roleToAssign: UserRole): boolean {
  if (actorRole === UserRole.SUPER_ADMIN) {
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE].includes(roleToAssign);
  }
  if (actorRole === UserRole.ADMIN) {
    return [UserRole.MANAGER, UserRole.EMPLOYEE].includes(roleToAssign);
  }
  if (actorRole === UserRole.MANAGER) {
    return [UserRole.EMPLOYEE].includes(roleToAssign);
  }
  return false;
}

export function getRoleDisplayName(role?: string | null): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "Super Administrator";
    case UserRole.ADMIN:
      return "Administrator";
    case UserRole.MANAGER:
      return "Clinical Operations Manager";
    case UserRole.EMPLOYEE:
      return "Clinical Staff";
    case UserRole.DOCTOR:
      return "Medical Officer / Doctor";
    case UserRole.RECEPTIONIST:
      return "Clinic Receptionist";
    case UserRole.STAFF:
      return "Operations Staff";
    default:
      return role || "Staff Member";
  }
}
