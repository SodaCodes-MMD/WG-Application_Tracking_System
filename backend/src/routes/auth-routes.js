import express from "express";
import { register } from "../controllers/auth-controller.js";

const router = express.Router();

router.post("/auth/register", register);

export default router;
