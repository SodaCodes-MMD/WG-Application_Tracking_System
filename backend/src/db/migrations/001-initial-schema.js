import { Job } from "../../models/job-model.js";
import { User } from "../../models/user-model.js";
import { Document } from "../../models/document-model.js";
import { Notification } from "../../models/notification-model.js";
import { PasswordResetToken } from "../../models/password-reset-model.js";
import { Profile } from "../../models/profile-model.js";

export const version = "001";
export const name = "Initial schema and indexes setup";

export const up = async (db) => {
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("users").createIndex({ createdAt: -1 });

  await db.collection("jobs").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("jobs").createIndex({ userId: 1, archivedAt: 1 });
  await db.collection("jobs").createIndex({ userId: 1, status: 1 });
  await db.collection("jobs").createIndex({ deadline: 1 });
  await db.collection("jobs").createIndex({ archivedAt: 1 });

  await db.collection("documents").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("documents").createIndex({ userId: 1, status: 1 });
  await db.collection("documents").createIndex({ userId: 1, type: 1 });

  await db.collection("profiles").createIndex({ userId: 1 }, { unique: true });

  await db.collection("notifications").createIndex({ userId: 1, read: 1, createdAt: -1 });
  await db.collection("notifications").createIndex({ userId: 1, jobId: 1, type: 1 }, { unique: true });
  await db.collection("notifications").createIndex({ userId: 1, read: 1, emailSent: 1 });

  await db.collection("passwordresettokens").createIndex({ token: 1 }, { unique: true });
  await db.collection("passwordresettokens").createIndex({ userId: 1 });
  await db.collection("passwordresettokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  console.log("[Migration 001] All indexes created successfully");
};

export const down = async (db) => {
  await db.collection("users").dropIndex("email_1");
  await db.collection("users").dropIndex("createdAt_-1");

  await db.collection("jobs").dropIndex("userId_1_createdAt_-1");
  await db.collection("jobs").dropIndex("userId_1_archivedAt_1");
  await db.collection("jobs").dropIndex("userId_1_status_1");
  await db.collection("jobs").dropIndex("deadline_1");
  await db.collection("jobs").dropIndex("archivedAt_1");

  await db.collection("documents").dropIndex("userId_1_createdAt_-1");
  await db.collection("documents").dropIndex("userId_1_status_1");
  await db.collection("documents").dropIndex("userId_1_type_1");

  await db.collection("profiles").dropIndex("userId_1");

  await db.collection("notifications").dropIndex("userId_1_read_1_createdAt_-1");
  await db.collection("notifications").dropIndex("userId_1_jobId_1_type_1");
  await db.collection("notifications").dropIndex("userId_1_read_1_emailSent_1");

  await db.collection("passwordresettokens").dropIndex("token_1");
  await db.collection("passwordresettokens").dropIndex("userId_1");
  await db.collection("passwordresettokens").dropIndex("expiresAt_1");

  console.log("[Migration 001] All indexes dropped successfully");
};
