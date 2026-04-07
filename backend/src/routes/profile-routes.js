import express from "express";
import { authenticate } from "../middleware/auth-middleware.js";
import {
  getProfile, saveProfile,
  addExperienceHandler, updateExperienceHandler, deleteExperienceHandler, reorderExperienceHandler,
  addEducationHandler, updateEducationHandler, deleteEducationHandler,
  addSkillHandler, updateSkillHandler, deleteSkillHandler, reorderSkillsHandler,
  getPreferencesHandler, savePreferencesHandler,
} from "../controllers/profile-controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/profile", getProfile);
router.put("/profile", saveProfile);

// Experience — "reorder" must come before ":entryId" to avoid being captured as an ID
router.post("/profile/experience", addExperienceHandler);
router.patch("/profile/experience/reorder", reorderExperienceHandler);
router.patch("/profile/experience/:entryId", updateExperienceHandler);
router.delete("/profile/experience/:entryId", deleteExperienceHandler);

// Education
router.post("/profile/education", addEducationHandler);
router.patch("/profile/education/:entryId", updateEducationHandler);
router.delete("/profile/education/:entryId", deleteEducationHandler);

// Skills — "reorder" must come before ":skillId"
router.post("/profile/skills", addSkillHandler);
router.patch("/profile/skills/reorder", reorderSkillsHandler);
router.patch("/profile/skills/:skillId", updateSkillHandler);
router.delete("/profile/skills/:skillId", deleteSkillHandler);

// Career Preferences
router.get("/profile/preferences", getPreferencesHandler);
router.put("/profile/preferences", savePreferencesHandler);

export default router;
