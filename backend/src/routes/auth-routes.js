import express from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/auth-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";
import {
  forgotPassword,
  validateResetToken,
  resetPassword
} from "../controllers/password-reset-controller.js";

const router = express.Router();

// Validation rules for password reset endpoints
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

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
    .matches(PASSWORD_REGEX)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)")
];

/**
 * PUBLIC ROUTES
 */

router.post("/auth/register", register);
router.post("/auth/login", login);

// Password reset
router.post("/auth/forgot-password", forgotPasswordValidation, forgotPassword);
router.get("/auth/validate-reset-token/:token", validateResetToken);
router.post("/auth/reset-password", resetPasswordValidation, resetPassword);

/**
 * PROTECTED ROUTES
 */

router.get("/auth/me", authenticate, (req, res) => {
  return res.json({
    success: true,
    data: { userId: req.user.userId }
  });
});

export default router;
