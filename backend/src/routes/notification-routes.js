import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth-middleware.js";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotificationHandler,
} from "../controllers/notification-controller.js";

const router = express.Router();
router.use(authenticate);

const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { message: "Too many requests, please try again later" } },
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: { message: "Too many write requests, please try again later" } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/notifications", notificationLimiter, listNotifications);
router.get("/notifications/unread-count", notificationLimiter, getUnreadCount);
router.patch("/notifications/:id/read", writeLimiter, markAsRead);
router.post("/notifications/read-all", writeLimiter, markAllAsRead);
router.delete("/notifications/:id", writeLimiter, deleteNotificationHandler);

export default router;
