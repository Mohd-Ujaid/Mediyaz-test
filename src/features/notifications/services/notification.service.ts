import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";

export interface SerializedNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Fetch latest 50 notifications for a user based on their role, and count unread notifications.
 */
export async function getNotificationsForUser(
  userId: string,
  userRole: string
): Promise<{ notifications: SerializedNotification[]; unreadCount: number }> {
  await connectToDatabase();

  const notificationsRaw = await Notification.find({ targetRoles: { $in: [userRole] } })
    .sort({ createdAt: -1 })
    .limit(50);

  const notifications: SerializedNotification[] = notificationsRaw.map((n) => {
    const obj = n.toObject();
    return {
      _id: obj._id.toString(),
      title: obj.title,
      message: obj.message,
      type: obj.type,
      referenceId: obj.referenceId || undefined,
      isRead: obj.readBy?.some((id: any) => id.toString() === userId.toString()) || false,
      createdAt: obj.createdAt.toISOString(),
    };
  });

  const unreadCount = await Notification.countDocuments({
    targetRoles: { $in: [userRole] },
    readBy: { $ne: userId },
  });

  return { notifications, unreadCount };
}

/**
 * Mark a specific notification as read by the user, if targeted to their role.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
  userRole: string
): Promise<SerializedNotification> {
  await connectToDatabase();

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, targetRoles: { $in: [userRole] } },
    { $addToSet: { readBy: userId } },
    { new: true }
  );

  if (!notification) {
    throw new Error("Notification not found or access denied.");
  }

  const obj = notification.toObject();
  return {
    _id: obj._id.toString(),
    title: obj.title,
    message: obj.message,
    type: obj.type,
    referenceId: obj.referenceId || undefined,
    isRead: true,
    createdAt: obj.createdAt.toISOString(),
  };
}

/**
 * Mark all unread notifications targeted at the user's role as read.
 */
export async function markAllNotificationsAsRead(
  userId: string,
  userRole: string
): Promise<void> {
  await connectToDatabase();

  await Notification.updateMany(
    { targetRoles: { $in: [userRole] }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
}
