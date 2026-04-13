import { validationResult } from "express-validator";
import {
  findActiveJobsByUser, findArchivedJobsByUser, findJobById, findJobByIdAndUser,
  createJob, updateJobByIdAndUser, archiveJobByIdAndUser, restoreJobByIdAndUser, deleteJobByIdAndUser,
  addInterview, updateInterview, removeInterview,
} from "../repositories/job-repository.js";
import { triggerImmediateNotification, removeDeadlineNotifications } from "../services/deadline-checker.js";

const validationError = (res, errors) =>
  res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: errors.array()[0].msg } });

const notFound = (res) =>
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Job not found" } });

const handleError = (res, message) => {
  console.error(`[JobController] Error: ${message}`);
  return res.status(500).json({ success: false, error: { message } });
};

export const listJobs = async (req, res) => {
  try {
    const jobs = await findActiveJobsByUser(req.user.userId);
    return res.json({ success: true, data: jobs });
  } catch (err) {
    console.error("[JobController] listJobs:", err);
    return handleError(res, "Failed to fetch jobs");
  }
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
  } catch (err) {
    console.error("[JobController] getJob:", err);
    return handleError(res, "Failed to fetch job");
  }
};

//Updated - seeds initial status history entry when creating a job, and adds new entry on status change during update
export const createJobHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return validationError(res, errors);
  try {
    const { company, title, status, location, url, salary, notes, appliedAt, deadline, recruiterNotes } = req.body;
    const initialStatus = status || "Wishlist";
    const job = await createJob({
      userId: req.user.userId,
      company,
      title,
      status: initialStatus,
      location,
      url,
      salary,
      notes,
      appliedAt: appliedAt || null,
      deadline: deadline || null,
      recruiterNotes: recruiterNotes || "",
      statusHistory: [{ status: initialStatus, changedAt: new Date() }],
    });

    if (job.deadline) {
      try {
        await triggerImmediateNotification(req.user.userId, job);
      } catch (notifyErr) {
        console.error("[JobController] Failed to create immediate notification:", notifyErr);
      }
    }

    return res.status(201).json({ success: true, data: job });
  } catch (err) {
    console.error("[JobController] createJob:", err);
    return handleError(res, "Failed to create job");
  }
};

//Updated - detects status changed and appends a history entry
export const updateJobHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return validationError(res, errors);
  try {
    const allowed = ["company", "title", "status", "location", "url", "salary", "notes", "appliedAt", "deadline", "recruiterNotes"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    //
    let historyEntry = null;
    if (updates.status) {
      const current = await findJobByIdAndUser(req.params.id, req.user.userId);
      if (!current) return notFound(res);
      if (current.status !== updates.status) {
        historyEntry = { status: updates.status, changedAt: new Date() };
      }
    }
    //
    const job = await updateJobByIdAndUser(req.params.id, req.user.userId, updates, historyEntry);
    if (!job) return notFound(res);
    
    if (job.deadline) {
      try {
        await triggerImmediateNotification(req.user.userId, job);
      } catch (notifyErr) {
        console.error("[JobController] Failed to create immediate notification:", notifyErr);
      }
    }
    
    return res.json({ success: true, data: job });
  } catch (err) {
    console.error("[JobController] updateJob:", err);
    return handleError(res, "Failed to update job");
  }
};

export const addInterviewHandler = async (req, res) => {
  try {
    const { roundType, date, interviewer, notes } = req.body;
    if (!roundType) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Round type is required" } });
    const job = await addInterview(req.params.id, req.user.userId, {
      roundType,
      date: date || null,
      interviewer: interviewer || "",
      notes: notes || "",
    });
    if (!job) return notFound(res);
    return res.status(201).json({ success: true, data: job });
  } catch (err) {
    console.error("[JobController] addInterview:", err);
    return handleError(res, "Failed to add interview");
  }
};

export const updateInterviewHandler = async (req, res) => {
  try {
    const allowed = ["roundType", "date", "interviewer", "notes"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const job = await updateInterview(req.params.id, req.user.userId, req.params.interviewId, updates);
    if (!job) return notFound(res);
    return res.json({ success: true, data: job });
  } catch (err) {
    console.error("[JobController] updateInterview:", err);
    return handleError(res, "Failed to update interview");
  }
};

export const deleteInterviewHandler = async (req, res) => {
  try {
    const job = await removeInterview(req.params.id, req.user.userId, req.params.interviewId);
    if (!job) return notFound(res);
    return res.json({ success: true, data: job });
  } catch (err) {
    console.error("[JobController] deleteInterview:", err);
    return handleError(res, "Failed to delete interview");
  }
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
    
    try {
      await removeDeadlineNotifications(req.params.id);
    } catch (notifyErr) {
      console.error("[JobController] Failed to remove notifications:", notifyErr);
    }
    
    return res.json({ success: true, data: { message: "Job deleted" } });
  } catch (err) {
    console.error("[JobController] deleteJob:", err);
    return handleError(res, "Failed to delete job");
  }
};