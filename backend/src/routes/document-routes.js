import express from "express";
import { body, param, validationResult } from "express-validator";
import multer from "multer";
import * as docCtrl from "../controllers/document-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: { message: "Validation failed", details: errors.array() } });
  }
  next();
};

router.use(authenticate);

router.get("/documents", docCtrl.listDocuments);
router.get("/documents/:id", docCtrl.getDocument);
router.post("/documents", docCtrl.createDocument);
router.patch("/documents/:id", docCtrl.updateDocument);
router.delete("/documents/:id", docCtrl.deleteDocument);
router.post("/documents/:id/versions", docCtrl.addVersion);
router.post("/documents/:id/link-job", docCtrl.linkDocumentToJob);
router.post("/documents/:id/unlink-job", docCtrl.unlinkDocumentFromJob);
router.get("/documents/job/:jobId", docCtrl.getDocumentsByJob);
router.post("/documents/generate-cover-letter", docCtrl.generateAiCoverLetter);
router.post("/documents/generate-resume", docCtrl.generateAiResume);
router.post("/documents/upload", upload.single("file"), docCtrl.uploadDocument);
router.get("/documents/:id/download-docx", docCtrl.downloadDocx);
router.post("/documents/:id/ai-rewrite", docCtrl.aiRewriteDocument);
router.post("/documents/:id/duplicate", docCtrl.duplicateDocument);
router.patch("/documents/:id/rename", docCtrl.renameDocument);

export default router;