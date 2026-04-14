import express from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth-middleware.js";
import { listJobs, listArchivedJobs, getJob, createJobHandler, updateJobHandler, archiveJobHandler, restoreJobHandler, deleteJobHandler, addInterviewHandler, updateInterviewHandler, deleteInterviewHandler, addTimelineEventHandler, updateTimelineEventHandler, deleteTimelineEventHandler } from "../controllers/job-controller.js";
import { JOB_STATUSES_LIST, JOB_OUTCOMES_LIST } from "../models/job-model.js";

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
  body("appliedAt").optional({ nullable: true }).isISO8601().toDate().withMessage("Invalid date format"),
  body("deadline").optional({ nullable: true }).isISO8601().toDate().withMessage("Invalid date format"),
  body("recruiterNotes").optional().trim().isLength({ max: 5000 }).withMessage("Recruiter notes too long"),
  body("outcome").optional({ nullable: true }).isIn(JOB_OUTCOMES_LIST).withMessage("Invalid outcome"),
  body("outcomeNotes").optional().trim().isLength({ max: 5000 }).withMessage("Outcome notes too long"),
  body("respondedAt").optional({ nullable: true }).isISO8601().toDate().withMessage("Invalid date format"),
];

const jobUpdateValidation = [
  body("company").optional().notEmpty().withMessage("Company cannot be empty").trim(),
  body("title").optional().notEmpty().withMessage("Job title cannot be empty").trim(),
  body("status").optional().isIn(JOB_STATUSES_LIST).withMessage("Invalid status"),
  body("url").optional().trim(),
  body("location").optional().trim(),
  body("salary").optional().trim(),
  body("notes").optional().trim(),
  body("appliedAt").optional({ nullable: true }).isISO8601().toDate().withMessage("Invalid date format"),
  body("deadline").optional({ nullable: true }).isISO8601().toDate().withMessage("Invalid date format"),
  body("recruiterNotes").optional().trim().isLength({ max: 5000 }).withMessage("Recruiter notes too long"),
  body("outcome").optional({ nullable: true }).isIn(JOB_OUTCOMES_LIST).withMessage("Invalid outcome"),
  body("outcomeNotes").optional().trim().isLength({ max: 5000 }).withMessage("Outcome notes too long"),
  body("respondedAt").optional({ nullable: true }).isISO8601().toDate().withMessage("Invalid date format"),
];

router.get("/jobs", listJobs);

router.get("/jobs/archived", listArchivedJobs);
router.get("/jobs/:id", getJob);
router.post("/jobs", jobCreateValidation, createJobHandler);
router.patch("/jobs/:id", jobUpdateValidation, updateJobHandler);
router.patch("/jobs/:id/archive", archiveJobHandler);
router.patch("/jobs/:id/restore", restoreJobHandler);
router.delete("/jobs/:id", deleteJobHandler);

router.post("/jobs/:id/interviews", addInterviewHandler);
router.patch("/jobs/:id/interviews/:interviewId", updateInterviewHandler);
router.delete("/jobs/:id/interviews/:interviewId", deleteInterviewHandler);

router.post("/jobs/:id/timeline", addTimelineEventHandler);
router.patch("/jobs/:id/timeline/:eventId", updateTimelineEventHandler);
router.delete("/jobs/:id/timeline/:eventId", deleteTimelineEventHandler);

export default router;
