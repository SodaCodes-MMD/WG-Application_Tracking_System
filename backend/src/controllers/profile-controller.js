import {
  getProfileForUser, saveProfileForUser,
  addExperience, updateExperience, deleteExperience, reorderExperience,
  addEducation, updateEducation, deleteEducation,
  addSkill, updateSkill, deleteSkill, reorderSkills,
  getPreferences, savePreferences,
} from "../services/profile-service.js";

const handleValidationOrServerError = (res, err, fallbackMessage) => {
  if (err.code === "VALIDATION_ERROR")
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: err.message } });
  console.error(`[ProfileController] ${fallbackMessage}:`, err);
  return res.status(500).json({ success: false, error: { message: fallbackMessage } });
};

export const getProfile = async (req, res) => {
  try {
    const profile = await getProfileForUser(req.user.userId);
    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error("[ProfileController] getProfile:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to fetch profile" } });
  }
};

export const saveProfile = async (req, res) => {
  try {
    if (req.body.userId && req.body.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Cannot modify another user's profile" },
      });
    }
    const profile = await saveProfileForUser(req.user.userId, req.body);
    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error("[ProfileController] saveProfile:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to save profile" } });
  }
};

// ── Experience ──────────────────────────────────────────────────────────────

export const addExperienceHandler = async (req, res) => {
  try {
    const profile = await addExperience(req.user.userId, req.body);
    return res.status(201).json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to add experience");
  }
};

export const updateExperienceHandler = async (req, res) => {
  try {
    const profile = await updateExperience(req.user.userId, req.params.entryId, req.body);
    if (!profile) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Experience entry not found" } });
    return res.json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to update experience");
  }
};

export const deleteExperienceHandler = async (req, res) => {
  try {
    const profile = await deleteExperience(req.user.userId, req.params.entryId);
    if (!profile) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Profile not found" } });
    return res.json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to delete experience");
  }
};

export const reorderExperienceHandler = async (req, res) => {
  try {
    const profile = await reorderExperience(req.user.userId, req.body.orderedIds);
    if (!profile) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Profile not found" } });
    return res.json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to reorder experience");
  }
};

// ── Education ───────────────────────────────────────────────────────────────

export const addEducationHandler = async (req, res) => {
  try {
    const profile = await addEducation(req.user.userId, req.body);
    return res.status(201).json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to add education");
  }
};

export const updateEducationHandler = async (req, res) => {
  try {
    const profile = await updateEducation(req.user.userId, req.params.entryId, req.body);
    if (!profile) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Education entry not found" } });
    return res.json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to update education");
  }
};

export const deleteEducationHandler = async (req, res) => {
  try {
    const profile = await deleteEducation(req.user.userId, req.params.entryId);
    if (!profile) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Profile not found" } });
    return res.json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to delete education");
  }
};

// ── Skills ───────────────────────────────────────────────────────────────────

export const addSkillHandler = async (req, res) => {
  try {
    const profile = await addSkill(req.user.userId, req.body);
    return res.status(201).json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to add skill");
  }
};

export const updateSkillHandler = async (req, res) => {
  try {
    const profile = await updateSkill(req.user.userId, req.params.skillId, req.body);
    if (!profile) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Skill not found" } });
    return res.json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to update skill");
  }
};

export const deleteSkillHandler = async (req, res) => {
  try {
    const profile = await deleteSkill(req.user.userId, req.params.skillId);
    if (!profile) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Profile not found" } });
    return res.json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to delete skill");
  }
};

export const reorderSkillsHandler = async (req, res) => {
  try {
    const profile = await reorderSkills(req.user.userId, req.body.orderedIds);
    if (!profile) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Profile not found" } });
    return res.json({ success: true, data: profile });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to reorder skills");
  }
};

// ── Career Preferences ───────────────────────────────────────────────────────

export const getPreferencesHandler = async (req, res) => {
  try {
    const data = await getPreferences(req.user.userId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[ProfileController] getPreferences:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to fetch preferences" } });
  }
};

export const savePreferencesHandler = async (req, res) => {
  try {
    const profile = await savePreferences(req.user.userId, req.body);
    return res.json({ success: true, data: profile.careerPreferences || {} });
  } catch (err) {
    return handleValidationOrServerError(res, err, "Failed to save preferences");
  }
};
