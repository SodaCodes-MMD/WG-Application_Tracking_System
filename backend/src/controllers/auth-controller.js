import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import { registerUser, loginUser } from "../services/auth-service.js";
import { blacklistToken } from "../services/token-service.js";
import { User } from "../models/user-model.js";

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await registerUser(email, password);

        return res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: error.code || "REGISTER_ERROR",
                message: error.message || "Registration failed"
            }
        });
    }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: error.code || "LOGIN_ERROR",
                message: error.message || "Login failed"
            }
        });
    }
};

/**
 * POST /api/auth/logout  (requires authenticate middleware)
 * Adds the current token to the blacklist so it can no longer be used.
 */
export const logout = (req, res) => {
    blacklistToken(req.token);
    return res.json({
        success: true,
        data: { message: "Logged out successfully" }
    });
};

/**
 * POST /api/auth/change-password  (requires authenticate middleware)
 * Validates the current password, then replaces it with a hashed new one.
 */
export const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: errors.array()[0].msg
                },
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: { code: "USER_NOT_FOUND", message: "User not found" }
            });
        }

        const matches = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!matches) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Current password is incorrect"
                }
            });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordUpdatedAt = new Date();
        await user.save();

        return res.json({
            success: true,
            data: { message: "Password changed successfully" }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: { code: "SERVER_ERROR", message: "Failed to change password" }
        });
    }
};
