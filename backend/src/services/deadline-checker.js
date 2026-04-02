import { Job } from "../models/job-model.js";
import { User } from "../models/user-model.js";
import { findNotificationsByUser, markEmailSent } from "../repositories/notification-repository.js";
import emailService from "./email-service.js";
import {
  createDeadlineNotification,
  createAllDeadlineNotifications,
} from "./notification-service.js";

export const checkAndCreateDeadlineNotifications = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jobs = await Job.find({
    deadline: { $ne: null },
    status: { $nin: ["Rejected", "Withdrawn", "Offer"] },
  }).lean();

  const userIds = [...new Set(jobs.map(j => j.userId))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const usersMap = new Map(users.map(u => [u._id.toString(), u]));

  const created = [];
  for (const job of jobs) {
    const user = usersMap.get(job.userId.toString());
    if (user?.notificationPreferences?.deadlineWarnings !== false) {
      try {
        const notifications = await createAllDeadlineNotifications(job.userId, job);
        created.push(...notifications);
      } catch (err) {
        if (err.code !== 11000) {
          console.error(`[DeadlineChecker] Failed to create notification for job ${job._id}:`, err.message);
        }
      }
    }
  }

  console.log(`[DeadlineChecker] Created ${created.length} deadline notifications`);
  return created;
};

export const sendDailyDeadlineDigest = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jobs = await Job.find({
    deadline: { $ne: null },
    status: { $nin: ["Rejected", "Withdrawn", "Offer"] },
  }).lean();

  const userIds = [...new Set(jobs.map(j => j.userId))];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  
  const usersWithDeadlines = new Map();
  for (const user of users) {
    if (user.notificationPreferences?.emailEnabled !== false && user.notificationPreferences?.deadlineWarnings !== false) {
      usersWithDeadlines.set(user._id.toString(), { user, jobs: [] });
    }
  }

  for (const job of jobs) {
    if (usersWithDeadlines.has(job.userId.toString())) {
      usersWithDeadlines.get(job.userId.toString()).jobs.push(job);
    }
  }

  const sent = [];
  for (const [userId, { user, jobs: userJobs }] of usersWithDeadlines) {
    const unreadNotifications = await findNotificationsByUser(userId, { unreadOnly: true });
    const notificationsWithDeadline = unreadNotifications.filter(
      (n) => n.metadata?.deadline && !n.emailSent
    );

    if (notificationsWithDeadline.length > 0) {
      try {
        const result = await emailService.sendDeadlineDigestEmail(user.email, userJobs, notificationsWithDeadline);
        if (result.success) {
          for (const notification of notificationsWithDeadline) {
            await markEmailSent(notification._id);
          }
          sent.push(userId);
        }
      } catch (err) {
        console.error(`[DeadlineDigest] Failed to send email to user ${userId}:`, err.message);
      }
    }
  }

  console.log(`[DeadlineDigest] Sent ${sent.length} deadline digest emails`);
  return sent;
};

export const triggerImmediateNotification = async (userId, job) => {
  try {
    const user = await User.findById(userId).lean();
    if (user?.notificationPreferences?.deadlineWarnings === false) {
      return null;
    }
    return await createDeadlineNotification(userId, job);
  } catch (err) {
    if (err.code !== 11000) {
      throw err;
    }
    return null;
  }
};

export const removeDeadlineNotifications = async (jobId) => {
  const { deleteNotificationsByJobId } = await import("../repositories/notification-repository.js");
  return await deleteNotificationsByJobId(jobId);
};
