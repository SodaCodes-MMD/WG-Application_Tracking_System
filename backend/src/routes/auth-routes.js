import express from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/auth-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";
import {
  forgotPassword,
  validateResetToken,
  resetPassword
} from "../controllers/password-reset-controller.js";
import { User } from "../models/user-model.js";

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

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile
 * Protected route - requires valid JWT token
 */
router.get("/auth/me", authenticate, async (req, res) => {
  try {
    // Fetch full user data from database (excluding password)
    const user = await User.findById(req.user.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }
    
    return res.json({
      success: true,
      data: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name || null,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to fetch user profile"
      }
    });
  }
});

export default router;
