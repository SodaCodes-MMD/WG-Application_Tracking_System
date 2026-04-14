import { validationResult } from "express-validator";
import {
  findDocumentsByUser,
  findDocumentsByUserAndJob,
  createDocument,
  deleteDocumentByIdAndUser,
} from "../repositories/document-repository.js";
import { findJobByIdAndUser } from "../repositories/job-repository.js";
import { findProfileByUserId } from "../repositories/profile-repository.js";
import { generateCoverLetterDraft } from "../services/ai-service.js";

function sendValidationError(res, errors) {
  return res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: errors.array()[0].msg,
    },
  });
}

export const listDocumentsHandler = async (req, res) => {
  try {
    const { jobId } = req.query;

    const docs = jobId
      ? await findDocumentsByUserAndJob(req.user.userId, jobId)
      : await findDocumentsByUser(req.user.userId);

    return res.json({
      success: true,
      data: docs,
    });
  } catch (err) {
    console.error("[DocumentController] listDocumentsHandler:", err);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch documents",
      },
    });
  }
};

export const createDocumentHandler = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendValidationError(res, errors);
  }

  try {
    const { jobId, title, type, content } = req.body;

    const doc = await createDocument({
      userId: req.user.userId,
      jobId,
      title,
      type: type || "Other",
      content: content || "",
    });

    return res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    console.error("[DocumentController] createDocumentHandler:", err);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to save document",
      },
    });
  }
};

export const deleteDocumentHandler = async (req, res) => {
  try {
    const deleted = await deleteDocumentByIdAndUser(
      req.params.id,
      req.user.userId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Document not found",
        },
      });
    }

    return res.json({
      success: true,
      data: {
        message: "Document deleted",
      },
    });
  } catch (err) {
    console.error("[DocumentController] deleteDocumentHandler:", err);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to delete document",
      },
    });
  }
};

export const generateCoverLetterHandler = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: { message: "jobId is required" },
      });
    }

    const job = await findJobByIdAndUser(jobId, req.user.userId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { message: "Job not found" },
      });
    }

    const profile = await findProfileByUserId(req.user.userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          message:
            "Profile not found. Please complete your profile before generating a cover letter.",
        },
      });
    }

    const content = await generateCoverLetterDraft(profile, job);
    const title = `Cover Letter - ${job.title} at ${job.company}`;

    return res.json({
      success: true,
      data: { title, content },
    });
  } catch (err) {
    console.error("[DocumentController] generateCoverLetterHandler:", err);

    return res.status(500).json({
      success: false,
      error: { message: "Failed to generate cover letter" },
    });
  }
};