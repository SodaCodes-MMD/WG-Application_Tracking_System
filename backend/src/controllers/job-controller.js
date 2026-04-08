import { validationResult } from "express-validator";
import {
  findActiveJobsByUser, findArchivedJobsByUser, findJobById, findJobByIdAndUserInclusive,
  createJob, updateJobByIdAndUser, archiveJobByIdAndUser, restoreJobByIdAndUser, deleteJobByIdAndUser,
} from "../repositories/job-repository.js";

const validationError = (res, errors) =>
  res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: errors.array()[0].msg } });

const notFound = (res) =>
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Job not found" } });

export const listJobs = async (req, res) => {
  try {
    const jobs = await findActiveJobsByUser(req.user.userId);
    return res.json({ success: true, data: jobs });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to fetch jobs" } }); }
};

export const listArchivedJobs = async (req, res) => {
  try {
    const jobs = await findArchivedJobsByUser(req.user.userId);
    return res.json({ success: true, data: jobs });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to fetch archived jobs" } }); }
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
    const { company, title, status, location, url, salary, notes, appliedAt } = req.body;
    const job = await createJob({ userId: req.user.userId, company, title, status, location, url, salary, notes, appliedAt: appliedAt || null });
    return res.status(201).json({ success: true, data: job });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to create job" } }); }
};

export const updateJobHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return validationError(res, errors);
  try {
    const allowed = ["company", "title", "status", "location", "url", "salary", "notes", "appliedAt"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const job = await updateJobByIdAndUser(req.params.id, req.user.userId, updates);
    if (!job) return notFound(res);
    return res.json({ success: true, data: job });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to update job" } }); }
};

export const archiveJobHandler = async (req, res) => {
  try {
    const job = await archiveJobByIdAndUser(req.params.id, req.user.userId);
    if (!job) return notFound(res);
    return res.json({ success: true, data: job });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to archive job" } }); }
};

export const restoreJobHandler = async (req, res) => {
  try {
    const job = await restoreJobByIdAndUser(req.params.id, req.user.userId);
    if (!job) return notFound(res);
    return res.json({ success: true, data: job });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to restore job" } }); }
};

export const deleteJobHandler = async (req, res) => {
  try {
    const job = await deleteJobByIdAndUser(req.params.id, req.user.userId);
    if (!job) return notFound(res);
    return res.json({ success: true, data: { message: "Job deleted" } });
  } catch { return res.status(500).json({ success: false, error: { message: "Failed to delete job" } }); }
};