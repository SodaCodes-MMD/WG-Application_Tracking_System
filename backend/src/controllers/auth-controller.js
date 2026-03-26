import { registerUser } from "../services/auth-service.js";

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
