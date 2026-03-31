import express from "express";
import { register, login } from "../controllers/auth-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";

// ✅ ALWAYS initialize router FIRST
const router = express.Router();

/**
 * PUBLIC ROUTES
 */

// Register user
router.post("/auth/register", register);

// Login user
router.post("/auth/login", login);

/**
 * PROTECTED ROUTES
 */

// Get current user (requires token)
router.get("/auth/me", authenticate, (req, res) => {
    return res.json({
        success: true,
        data: {
            userId: req.user.userId
        }
    });
});

// ✅ export at the end
export default router;
