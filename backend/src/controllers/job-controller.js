import { validationResult } from "express-validator";
import {
  findJobsByUser, findJobById, findJobByIdAndUser,
  createJob, updateJobByIdAndUser, deleteJobByIdAndUser,
} from "../repositories/job-repository.js";

const validationError = (res, errors) =>
  res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: errors.array()[0].msg } });

const notFound = (res) =>
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Job not found" } });

export const listJobs = async (req, res) => {
  try {
    const jobs = await findJobsByUser(req.user.userId);
    return res.json({ success: true, data: jobs });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to fetch jobs" } }); }
};

export const getJob = async (req, res) => {
  try {
    const job = await findJobById(req.params.id);
    if (!job) return notFound(res);
    if (job.userId.toString() !== req.user.userId)
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied" } });
    return res.json({ success: true, data: job });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to fetch job" } }); }
};

export const createJobHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return validationError(res, errors);
  try {
    const { company, title, status, location, url, salary, notes, appliedAt, outcome, outcomeNotes } = req.body;
    const job = await createJob({ userId: req.user.userId, company, title, status, location, url, salary, notes, appliedAt: appliedAt || null, outcome: outcome || "", outcomeNotes: outcomeNotes || "" });
    return res.status(201).json({ success: true, data: job });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to create job" } }); }
};

export const updateJobHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return validationError(res, errors);
  try {
    const allowed = ["company", "title", "status", "location", "url", "salary", "notes", "appliedAt", "outcome", "outcomeNotes"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const job = await updateJobByIdAndUser(req.params.id, req.user.userId, updates);
    if (!job) return notFound(res);
    return res.json({ success: true, data: job });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to update job" } }); }
};

export const deleteJobHandler = async (req, res) => {
  try {
    const job = await deleteJobByIdAndUser(req.params.id, req.user.userId);
    if (!job) return notFound(res);
    return res.json({ success: true, data: { message: "Job deleted" } });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to delete job" } }); }
};