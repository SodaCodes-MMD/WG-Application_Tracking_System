import express from "express";
import { authenticate } from "../middleware/auth-middleware.js";
import {
  getProfile, saveProfile,
  addExperienceHandler, updateExperienceHandler, deleteExperienceHandler, reorderExperienceHandler,
  addEducationHandler, updateEducationHandler, deleteEducationHandler,
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

export default router;
