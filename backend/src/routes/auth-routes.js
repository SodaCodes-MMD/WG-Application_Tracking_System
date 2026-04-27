import express from "express";
import { body } from "express-validator";
import rateLimit, { MemoryStore } from "express-rate-limit";
import { register, login, logout, changePassword } from "../controllers/auth-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";
import {
  forgotPassword,
  validateResetToken,
  resetPassword
} from "../controllers/password-reset-controller.js";

export const authLimiterStore = new MemoryStore();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: authLimiterStore,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later" } },
});

const router = express.Router();

// ─── Shared validation constants ──────────────────────────────────────────────
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_RESET_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// ─── Validation rule arrays ────────────────────────────────────────────────────

const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
];

const resetPasswordValidation = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required"),
  body("password")
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
    .matches(PASSWORD_RESET_REGEX)
    .withMessage("Password must contain uppercase, lowercase, a number, and a special character (@$!%*?&)")
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`New password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
    .matches(PASSWORD_RESET_REGEX)
    .withMessage("New password must contain uppercase, lowercase, a number, and a special character (@$!%*?&)")
];

// ─── Public routes ─────────────────────────────────────────────────────────────

router.post("/auth/register", authLimiter, register);
router.post("/auth/login", authLimiter, login);

// Password reset flow
router.post("/auth/forgot-password", forgotPasswordValidation, forgotPassword);
router.get("/auth/validate-reset-token/:token", validateResetToken);
router.post("/auth/reset-password", resetPasswordValidation, resetPassword);

// ─── Protected routes ──────────────────────────────────────────────────────────

router.get("/auth/me", authenticate, (req, res) => {
  return res.json({
    success: true,
    data: { userId: req.user.userId }
  });
});

router.post("/auth/logout", authenticate, logout);

router.post("/auth/change-password", authenticate, changePasswordValidation, changePassword);

export default router;
