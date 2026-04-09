import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        passwordUpdatedAt: {
            type: Date,
            default: null
        },
        notificationPreferences: {
            emailEnabled: { type: Boolean, default: true },
            deadlineWarnings: { type: Boolean, default: true },
            deadlineDaysWarning: { type: Number, default: 3 },
        },
    },
    {
        collection: "users" // explicitly set — prevents Mongoose pluralization surprises
    }
);

export const User = mongoose.model("User", userSchema);
