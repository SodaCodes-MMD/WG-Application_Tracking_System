import express from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth-middleware.js";
import { listJobs, getJob, createJobHandler, updateJobHandler, deleteJobHandler } from "../controllers/job-controller.js";
import { JOB_STATUSES_LIST } from "../models/job-model.js";

const router = express.Router();
router.use(authenticate);

const jobCreateValidation = [
  body("company").notEmpty().withMessage("Company is required").trim(),
  body("title").notEmpty().withMessage("Job title is required").trim(),
  body("status").optional().isIn(JOB_STATUSES_LIST).withMessage("Invalid status"),
  body("url").optional().trim(),
  body("location").optional().trim(),
  body("salary").optional().trim(),
  body("notes").optional().trim(),
];

const jobUpdateValidation = [
  body("company").optional().notEmpty().withMessage("Company cannot be empty").trim(),
  body("title").optional().notEmpty().withMessage("Job title cannot be empty").trim(),
  body("status").optional().isIn(JOB_STATUSES_LIST).withMessage("Invalid status"),
  body("url").optional().trim(),
  body("location").optional().trim(),
  body("salary").optional().trim(),
  body("notes").optional().trim(),
];

router.get("/jobs", listJobs);
router.get("/jobs/:id", getJob);
router.post("/jobs", jobCreateValidation, createJobHandler);
router.patch("/jobs/:id", jobUpdateValidation, updateJobHandler);
router.delete("/jobs/:id", deleteJobHandler);

export default router;