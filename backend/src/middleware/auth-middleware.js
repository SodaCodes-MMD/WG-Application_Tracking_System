import jwt from "jsonwebtoken";
import { isBlacklisted } from "../services/token-service.js";

// Middleware to protect routes
export const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "NO_TOKEN",
                    message: "No token provided"
                }
            });
        }

        // Format: "Bearer <token>"
        const token = authHeader.split(" ")[1];

        // Reject blacklisted tokens before doing any crypto work
        if (isBlacklisted(token)) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Invalid or expired token"
                }
            });
        }

        // Verify signature and expiry
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info and raw token to request
        req.user = decoded;
        req.token = token; // used by the logout handler

        next();
    } catch {
        return res.status(401).json({
            success: false,
            error: {
                code: "INVALID_TOKEN",
                message: "Invalid or expired token"
            }
        });
    }
};
