import { Notification } from "../models/notification-model.js";

export const findNotificationsByUser = (userId, options = {}) => {
  const { limit = 50, unreadOnly = false } = options;
  const query = { userId };
  if (unreadOnly) query.read = false;
  return Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
};

export const findUnreadCountByUser = (userId) =>
  Notification.countDocuments({ userId, read: false }).lean();

export const findNotificationByUserAndId = (id, userId) =>
  Notification.findOne({ _id: id, userId }).lean();

export const createNotification = (data) => Notification.create(data);

export const markNotificationAsRead = (id, userId) =>
  Notification.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }, { new: true }).lean();

export const markAllNotificationsAsRead = (userId) =>
  Notification.updateMany({ userId, read: false }, { $set: { read: true } }).lean();

export const markEmailSent = (id) =>
  Notification.findByIdAndUpdate(id, { $set: { emailSent: true } }, { new: true }).lean();

export const findExistingNotification = async (userId, jobId, type) =>
  Notification.findOne({ userId, jobId, type }).lean();

export const deleteNotification = (id, userId) =>
  Notification.findOneAndDelete({ _id: id, userId }).lean();

export const deleteNotificationsByJobId = (jobId) =>
  Notification.deleteMany({ jobId }).lean();
