"use server";

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationsForUser,
} from "../services/notification.service";

const ALLOWED_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
  "STAFF",
  "DOCTOR",
  "RECEPTIONIST",
  "EMPLOYEE",
];

async function getAuthorizedSession() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    throw new Error("Unauthorized: Not logged in.");
  }

  const role = (session.user as any).role;
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Forbidden: Access denied.");
  }

  return { userId: session.user.id, role };
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const { userId, role } = await getAuthorizedSession();
    const result = await markNotificationAsRead(notificationId, userId, role);
    return { success: true, notification: result };
  } catch (error: any) {
    console.error("markNotificationAsReadAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const { userId, role } = await getAuthorizedSession();
    await markAllNotificationsAsRead(userId, role);
    return { success: true };
  } catch (error: any) {
    console.error("markAllNotificationsAsReadAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function getNotificationsAction() {
  try {
    const { userId, role } = await getAuthorizedSession();
    const { notifications, unreadCount } = await getNotificationsForUser(userId, role);
    return { success: true, notifications, unreadCount };
  } catch (error: any) {
    console.error("getNotificationsAction error:", error);
    return { success: false, error: error.message };
  }
}
