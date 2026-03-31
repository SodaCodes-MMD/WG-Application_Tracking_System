import { getProfileForUser, saveProfileForUser } from "../services/profile-service.js";

export const getProfile = async (req, res) => {
  try {
    const profile = await getProfileForUser(req.user.userId);
    return res.json({ success: true, data: profile });
  } catch {
    return res.status(500).json({ success: false, error: { message: "Failed to fetch profile" } });
  }
};

export const saveProfile = async (req, res) => {
  try {
    // Reject attempts to write to another user's profile via body userId
    if (req.body.userId && req.body.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Cannot modify another user's profile" },
      });
    }
    const profile = await saveProfileForUser(req.user.userId, req.body);
    return res.json({ success: true, data: profile });
  } catch {
    return res.status(500).json({ success: false, error: { message: "Failed to save profile" } });
  }
};
