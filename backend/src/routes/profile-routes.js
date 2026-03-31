import express from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth-middleware.js";
import { getProfile, updateProfile } from "../controllers/profile-controller.js";

const router = express.Router();
router.use(authenticate);

router.get("/profile", getProfile);
router.patch("/profile", [
  body("displayName").optional().trim().isLength({ max: 100 }).withMessage("Max 100 chars"),
  body("bio").optional().trim().isLength({ max: 500 }).withMessage("Max 500 chars"),
  body("location").optional().trim().isLength({ max: 100 }).withMessage("Max 100 chars"),
], updateProfile);

export default router;