import express from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth-middleware.js";
import { listJobs, listArchivedJobs, getJob, createJobHandler, updateJobHandler, archiveJobHandler, restoreJobHandler, deleteJobHandler } from "../controllers/job-controller.js";
import { JOB_STATUSES_LIST } from "../models/job-model.js";

const router = express.Router();
router.use(authenticate);

const jobBodyValidation = [
  body("company").notEmpty().withMessage("Company is required").trim(),
  body("title").notEmpty().withMessage("Job title is required").trim(),
  body("status").optional().isIn(JOB_STATUSES_LIST).withMessage("Invalid status"),
  body("url").optional().trim(),
  body("location").optional().trim(),
  body("salary").optional().trim(),
  body("notes").optional().trim(),
];

router.get("/jobs", listJobs);
router.get("/jobs/archived", listArchivedJobs);
router.get("/jobs/:id", getJob);
router.post("/jobs", jobBodyValidation, createJobHandler);
router.patch("/jobs/:id", jobBodyValidation, updateJobHandler);
router.patch("/jobs/:id/archive", archiveJobHandler);
router.patch("/jobs/:id/restore", restoreJobHandler);
router.delete("/jobs/:id", deleteJobHandler);

export default router;