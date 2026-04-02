import mongoose from "mongoose";

const NOTIFICATION_TYPES = {
  DEADLINE_3_DAYS: "DEADLINE_3_DAYS",
  DEADLINE_1_DAY: "DEADLINE_1_DAY",
  DEADLINE_TODAY: "DEADLINE_TODAY",
  DEADLINE_OVERDUE: "DEADLINE_OVERDUE",
};

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    metadata: {
      company: String,
      jobTitle: String,
      deadline: Date,
      daysUntilDeadline: Number,
    },
  },
  { collection: "notifications", timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, jobId: 1, type: 1 }, { unique: true });
notificationSchema.index({ userId: 1, read: 1, emailSent: 1 });

export const NOTIFICATION_TYPES_LIST = NOTIFICATION_TYPES;
export const Notification = mongoose.model("Notification", notificationSchema);
