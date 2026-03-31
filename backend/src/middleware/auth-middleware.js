import jwt from "jsonwebtoken";

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

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = decoded;

        next(); // continue to route
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: {
                code: "INVALID_TOKEN",
                message: "Invalid or expired token"
            }
        });
    }
};
