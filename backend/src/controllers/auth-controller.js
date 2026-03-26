import { registerUser, loginUser } from "../services/auth-service.js";

/**
 * REGISTER CONTROLLER
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
 * LOGIN CONTROLLER (THIS IS WHAT YOU WERE MISSING)
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
