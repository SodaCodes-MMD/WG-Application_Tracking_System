import { User } from "../models/user-model.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ success: false, error: { message: "User not found" } });
    return res.json({ success: true, data: { id: user._id, email: user.email, displayName: user.displayName || "", bio: user.bio || "", location: user.location || "", createdAt: user.createdAt, passwordUpdatedAt: user.passwordUpdatedAt } });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to fetch profile" } }); }
};

export const updateProfile = async (req, res) => {
  try {
    const allowed = ["displayName", "bio", "location"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
    const user = await User.findByIdAndUpdate(req.user.userId, { $set: updates }, { new: true, runValidators: true }).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ success: false, error: { message: "User not found" } });
    return res.json({ success: true, data: { id: user._id, email: user.email, displayName: user.displayName || "", bio: user.bio || "", location: user.location || "", createdAt: user.createdAt, passwordUpdatedAt: user.passwordUpdatedAt } });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to update profile" } }); }
};