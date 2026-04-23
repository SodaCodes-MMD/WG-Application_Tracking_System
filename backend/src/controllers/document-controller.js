import * as docRepo from "../repositories/document-repository.js";
import * as profileRepo from "../repositories/profile-repository.js";
import * as jobRepo from "../repositories/job-repository.js";
import HTMLtoDOCX from "html-to-docx";
import { generateCoverLetterDraft, generateResumeDraft, rewriteDocumentContent } from "../services/ai-service.js";

const handleError = (res, message) => {
  console.error(`[DocumentController] ${message}`);
  return res.status(500).json({ success: false, error: { message } });
};

export async function listDocuments(req, res) {
  try {
    const { type, status, tag, sortBy, sortOrder } = req.query;
    
    const filter = { userId: req.user.userId };
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (tag) filter.tags = tag;
    
    const sortOptions = {};
    if (sortBy === "name") {
      sortOptions.name = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "type") {
      sortOptions.type = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "status") {
      sortOptions.status = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "createdAt") {
      sortOptions.createdAt = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "updatedAt") {
      sortOptions.updatedAt = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions.updatedAt = -1;
    }
    
    const docs = await docRepo.findDocumentsByUserWithFilter(req.user.userId, filter, sortOptions);
    return res.json({ success: true, data: docs });
  } catch { return handleError(res, "Failed to fetch documents"); }
}

export async function getDocument(req, res) {
  try {
    const doc = await docRepo.findDocumentByIdAndUser(req.params.id, req.user.userId);
    if (!doc) return res.status(404).json({ success: false, error: { message: "Document not found" } });
    return res.json({ success: true, data: doc });
  } catch { return handleError(res, "Failed to fetch document"); }
}

export async function createDocument(req, res) {
  try {
    const doc = await docRepo.createDocument(req.user.userId, req.body);
    return res.status(201).json({ success: true, data: doc });
  } catch { return handleError(res, "Failed to create document"); }
}

export async function updateDocument(req, res) {
  try {
    const doc = await docRepo.updateDocumentByIdAndUser(req.params.id, req.user.userId, req.body);
    if (!doc) return res.status(404).json({ success: false, error: { message: "Document not found" } });
    return res.json({ success: true, data: doc });
  } catch { return handleError(res, "Failed to update document"); }
}

export async function deleteDocument(req, res) {
  try {
    const doc = await docRepo.deleteDocumentByIdAndUser(req.params.id, req.user.userId);
    if (!doc) return res.status(404).json({ success: false, error: { message: "Document not found" } });
    return res.json({ success: true, data: doc });
  } catch { return handleError(res, "Failed to delete document"); }
}

export async function addVersion(req, res) {
  try {
    const doc = await docRepo.addDocumentVersion(req.params.id, req.user.userId, req.body.content);
    if (!doc) return res.status(404).json({ success: false, error: { message: "Document not found" } });
    return res.json({ success: true, data: doc });
  } catch { return handleError(res, "Failed to add version"); }
}

export async function generateAiCoverLetter(req, res) {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, error: { message: "jobId is required" } });

    const job = await jobRepo.findJobByIdAndUser(jobId, req.user.userId);
    if (!job) return res.status(404).json({ success: false, error: { message: "Job not found" } });

    const profile = await profileRepo.findProfileByUserId(req.user.userId);
    if (!profile) return res.status(404).json({ success: false, error: { message: "Profile not found" } });

    const generatedContent = await generateCoverLetterDraft(profile, job);

    const docName = `Cover Letter - ${job.title} at ${job.company}`;
    const doc = await docRepo.createDocument(req.user.userId, {
      name: docName,
      type: "Cover Letter",
      category: "General",
      status: "Draft",
      versions: [{ versionNumber: 1, content: generatedContent }],
      linkedJobs: [jobId],
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error("[DocumentController] AI cover letter generation failed:", err);
    return handleError(res, "Failed to generate AI cover letter");
  }
}

export async function generateAiResume(req, res) {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, error: { message: "jobId is required" } });

    const job = await jobRepo.findJobByIdAndUser(jobId, req.user.userId);
    if (!job) return res.status(404).json({ success: false, error: { message: "Job not found" } });

    const profile = await profileRepo.findProfileByUserId(req.user.userId);
    if (!profile) return res.status(404).json({ success: false, error: { message: "Profile not found" } });

    const generatedContent = await generateResumeDraft(profile, job);

    const docName = `Resume - ${job.title} at ${job.company}`;
    const doc = await docRepo.createDocument(req.user.userId, {
      name: docName,
      type: "Resume",
      category: "General",
      status: "Draft",
      versions: [{ versionNumber: 1, content: generatedContent }],
      linkedJobs: [jobId],
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error("[DocumentController] AI resume generation failed:", err);
    return handleError(res, "Failed to generate AI resume");
  }
}

export async function linkDocumentToJob(req, res) {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, error: { message: "jobId is required" } });

    const doc = await docRepo.linkDocumentToJob(req.params.id, req.user.userId, jobId);
    if (!doc) return res.status(404).json({ success: false, error: { message: "Document not found" } });
    return res.json({ success: true, data: doc });
  } catch { return handleError(res, "Failed to link document to job"); }
}

export async function unlinkDocumentFromJob(req, res) {
  try {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, error: { message: "jobId is required" } });

    const doc = await docRepo.unlinkDocumentFromJob(req.params.id, req.user.userId, jobId);
    if (!doc) return res.status(404).json({ success: false, error: { message: "Document not found" } });
    return res.json({ success: true, data: doc });
  } catch { return handleError(res, "Failed to unlink document from job"); }
}

export async function aiRewriteDocument(req, res) {
  try {
    const doc = await docRepo.findDocumentByIdAndUser(req.params.id, req.user.userId);
    if (!doc) return res.status(404).json({ success: false, error: { message: "Document not found" } });

    const latestVersion = doc.versions?.[doc.versions.length - 1];
    if (!latestVersion?.content) return res.status(400).json({ success: false, error: { message: "No content to rewrite" } });

    const { instruction } = req.body;
    const rewritten = await rewriteDocumentContent(latestVersion.content, doc.type, instruction);

    return res.json({ success: true, data: { rewritten } });
  } catch (err) {
    console.error("[DocumentController] AI rewrite failed:", err);
    return handleError(res, "Failed to rewrite document");
  }
}

export async function downloadDocx(req, res) {
  try {
    const doc = await docRepo.findDocumentByIdAndUser(req.params.id, req.user.userId);
    if (!doc) return res.status(404).json({ success: false, error: { message: "Document not found" } });

    const latestVersion = doc.versions?.[doc.versions.length - 1];
    if (!latestVersion?.content) return res.status(404).json({ success: false, error: { message: "No content to download" } });

    const docxBuffer = await HTMLtoDOCX(latestVersion.content, null, {
      table: { row: { cantSplit: true } },
      footer: false,
      pageNumber: false,
    });

    const safeName = doc.name.replace(/[^a-z0-9]/gi, "_");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.docx"`);
    return res.send(docxBuffer);
  } catch (err) {
    console.error("[DocumentController] DOCX download failed:", err);
    return handleError(res, "Failed to generate DOCX");
  }
}

export async function getDocumentsByJob(req, res) {
  try {
    const { jobId } = req.params;
    const docs = await docRepo.findDocumentsByJob(req.user.userId, jobId);
    return res.json({ success: true, data: docs });
  } catch { return handleError(res, "Failed to fetch documents for job"); }
}