import * as docRepo from "../repositories/document-repository.js";
import * as profileRepo from "../repositories/profile-repository.js";
import * as jobRepo from "../repositories/job-repository.js";
import { generateCoverLetterDraft } from "../services/ai-service.js";

const handleError = (res, message) => {
  console.error(`[DocumentController] ${message}`);
  return res.status(500).json({ success: false, error: { message } });
};

export async function listDocuments(req, res) {
  try {
    const docs = await docRepo.findDocumentsByUser(req.user.userId);
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
    console.log("[DocumentController] generateAiCoverLetter called with jobId:", jobId);
    if (!jobId) return res.status(400).json({ success: false, error: { message: "jobId is required" } });

    const job = await jobRepo.findJobByIdAndUser(jobId, req.user.userId);
    console.log("[DocumentController] Job found:", job ? "yes" : "no");
    if (!job) return res.status(404).json({ success: false, error: { message: "Job not found" } });

    const profile = await profileRepo.findProfileByUserId(req.user.userId);
    console.log("[DocumentController] Profile found:", profile ? "yes" : "no", profile ? "with data:" : "", profile ? JSON.stringify(profile).substring(0, 100) : "");
    if (!profile) return res.status(404).json({ success: false, error: { message: "Profile not found" } });

    console.log("[DocumentController] Calling generateCoverLetterDraft...");
    const generatedContent = await generateCoverLetterDraft(profile, job);
    console.log("[DocumentController] Generated content length:", generatedContent?.length);

    const docName = `Cover Letter - ${job.title} at ${job.company}`;
    const doc = await docRepo.createDocument(req.user.userId, {
      name: docName,
      type: "Cover Letter",
      category: "General",
      status: "Draft",
      versions: [{ versionNumber: 1, content: generatedContent }],
      linkedJobs: [jobId],
    });

    console.log("[DocumentController] Document created with ID:", doc._id);
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error("[DocumentController] AI cover letter generation failed:", err);
    console.error("[DocumentController] Error stack:", err.stack);
    return handleError(res, "Failed to generate AI cover letter");
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

export async function getDocumentsByJob(req, res) {
  try {
    const { jobId } = req.params;
    const docs = await docRepo.findDocumentsByJob(req.user.userId, jobId);
    return res.json({ success: true, data: docs });
  } catch { return handleError(res, "Failed to fetch documents for job"); }
}