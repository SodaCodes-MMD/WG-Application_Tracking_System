import { NOTIFICATION_TYPES_LIST } from "../models/notification-model.js";
import {
  createNotification,
  findExistingNotification,
  deleteNotificationsByJobId,
  markEmailSent,
} from "../repositories/notification-repository.js";

const getDaysUntilDeadline = (deadline) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
};

const getNotificationType = (daysUntilDeadline) => {
  if (daysUntilDeadline < 0) return NOTIFICATION_TYPES_LIST.DEADLINE_OVERDUE;
  if (daysUntilDeadline === 0) return NOTIFICATION_TYPES_LIST.DEADLINE_TODAY;
  if (daysUntilDeadline === 1) return NOTIFICATION_TYPES_LIST.DEADLINE_1_DAY;
  if (daysUntilDeadline <= 3) return NOTIFICATION_TYPES_LIST.DEADLINE_3_DAYS;
  return null;
};

const getNotificationMessage = (type, job) => {
  const messages = {
    [NOTIFICATION_TYPES_LIST.DEADLINE_3_DAYS]: `${job.company} - ${job.title}: Deadline in 3 days`,
    [NOTIFICATION_TYPES_LIST.DEADLINE_1_DAY]: `${job.company} - ${job.title}: Deadline in 1 day!`,
    [NOTIFICATION_TYPES_LIST.DEADLINE_TODAY]: `${job.company} - ${job.title}: Deadline is TODAY!`,
    [NOTIFICATION_TYPES_LIST.DEADLINE_OVERDUE]: `${job.company} - ${job.title}: Deadline has passed`,
  };
  return messages[type] || `${job.company} - ${job.title}: Deadline reminder`;
};

export const createDeadlineNotification = async (userId, job) => {
  if (!job.deadline) return null;

  const daysUntil = getDaysUntilDeadline(job.deadline);
  const type = getNotificationType(daysUntil);

  if (!type) return null;

  const existing = await findExistingNotification(userId, job._id, type);
  if (existing) return null;

  const notification = await createNotification({
    userId,
    jobId: job._id,
    type,
    message: getNotificationMessage(type, job),
    metadata: {
      company: job.company,
      jobTitle: job.title,
      deadline: job.deadline,
      daysUntilDeadline: daysUntil,
    },
  });

  return notification;
};

export const createAllDeadlineNotifications = async (userId, job) => {
  if (!job.deadline) return [];

  const notifications = [];
  const daysUntil = getDaysUntilDeadline(job.deadline);

  const typesToCreate = [];
  if (daysUntil <= 3 && daysUntil >= 0) {
    typesToCreate.push(NOTIFICATION_TYPES_LIST.DEADLINE_3_DAYS);
  }
  if (daysUntil <= 1 && daysUntil >= 0) {
    typesToCreate.push(NOTIFICATION_TYPES_LIST.DEADLINE_1_DAY);
  }
  if (daysUntil === 0) {
    typesToCreate.push(NOTIFICATION_TYPES_LIST.DEADLINE_TODAY);
  }
  if (daysUntil < 0) {
    typesToCreate.push(NOTIFICATION_TYPES_LIST.DEADLINE_OVERDUE);
  }

  for (const type of typesToCreate) {
    try {
      const existing = await findExistingNotification(userId, job._id, type);
      if (!existing) {
        const notification = await createNotification({
          userId,
          jobId: job._id,
          type,
          message: getNotificationMessage(type, job),
          metadata: {
            company: job.company,
            jobTitle: job.title,
            deadline: job.deadline,
            daysUntilDeadline: daysUntil,
          },
        });
        notifications.push(notification);
      }
    } catch (err) {
      if (err.code !== 11000) {
        throw err;
      }
    }
  }

  return notifications;
};

export const removeDeadlineNotifications = async (jobId) => {
  await deleteNotificationsByJobId(jobId);
};

export const markNotificationEmailSent = async (notificationId) => {
  return await markEmailSent(notificationId);
};
