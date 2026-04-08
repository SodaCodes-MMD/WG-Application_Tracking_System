import { validationResult } from "express-validator";
import {
  findNotificationsByUser,
  findUnreadCountByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../repositories/notification-repository.js";

const MAX_PAGINATION_LIMIT = 100;

const notFound = (res) =>
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Notification not found" } });

const handleError = (res, message) => {
  console.error(`[NotificationController] Error: ${message}`);
  return res.status(500).json({ success: false, error: { message } });
};

export const listNotifications = async (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit) || 50;
    const limit = Math.min(requestedLimit, MAX_PAGINATION_LIMIT);
    const notifications = await findNotificationsByUser(req.user.userId, { limit });
    const unreadCount = await findUnreadCountByUser(req.user.userId);
    return res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    console.error("[NotificationController] listNotifications:", err);
    return handleError(res, "Failed to fetch notifications");
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await findUnreadCountByUser(req.user.userId);
    return res.json({ success: true, data: { count } });
  } catch (err) {
    console.error("[NotificationController] getUnreadCount:", err);
    return handleError(res, "Failed to fetch unread count");
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await markNotificationAsRead(req.params.id, req.user.userId);
    if (!notification) return notFound(res);
    return res.json({ success: true, data: notification });
  } catch (err) {
    console.error("[NotificationController] markAsRead:", err);
    return handleError(res, "Failed to mark notification as read");
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await markAllNotificationsAsRead(req.user.userId);
    return res.json({ success: true, data: { message: "All notifications marked as read" } });
  } catch (err) {
    console.error("[NotificationController] markAllAsRead:", err);
    return handleError(res, "Failed to mark notifications as read");
  }
};

export const deleteNotificationHandler = async (req, res) => {
  try {
    const notification = await deleteNotification(req.params.id, req.user.userId);
    if (!notification) return notFound(res);
    return res.json({ success: true, data: { message: "Notification deleted" } });
  } catch (err) {
    console.error("[NotificationController] deleteNotification:", err);
    return handleError(res, "Failed to delete notification");
  }
};
