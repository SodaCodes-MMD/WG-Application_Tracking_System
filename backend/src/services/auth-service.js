import { findUserByEmail, createUser } from "../repositories/user-repository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (email, password) => {
    // 1. Validation
    if (!email || !password) {
        throw {
            code: "VALIDATION_ERROR",
            message: "Email and password are required"
        };
    }

    // Password must:
    // - be at least 8 characters
    // - contain at least one special character
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

    if (!passwordRegex.test(password)) {
        throw {
            code: "WEAK_PASSWORD",
            message: "Password must be at least 8 characters and include a special character"
        };
    }

    // 2. Duplicate check
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw {
            code: "EMAIL_ALREADY_EXISTS",
            message: "Email already registered"
        };
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create user
    const user = await createUser({
        email,
        passwordHash
    });

    console.log("USER CREATED:", user);

    return {
        id: user._id,
        email: user.email
    };
};

export const loginUser = async (email, password) => {
    // 1. Validation
    if (!email || !password) {
        throw {
            code: "VALIDATION_ERROR",
            message: "Email and password are required"
        };
    }

    // 2. Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
        throw {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password"
        };
    }

    // 3. Compare submitted password against stored hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
        throw {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password"
        };
    }

    // 4. Sign JWT with userId payload
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    // 5. Return token and safe user object (never return passwordHash)
    return {
        token,
        user: {
            id: user._id,
            email: user.email
        }
    };
};
