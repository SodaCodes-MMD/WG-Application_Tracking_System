import express from "express";
import { authenticate } from "../middleware/auth-middleware.js";
import { getProfile, saveProfile } from "../controllers/profile-controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/profile", getProfile);
router.put("/profile", saveProfile);

export default router;
