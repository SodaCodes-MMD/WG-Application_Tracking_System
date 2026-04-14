import express from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth-middleware.js";
import {
  listDocumentsHandler,
  createDocumentHandler,
  deleteDocumentHandler,
  generateCoverLetterHandler,
} from "../controllers/document-controller.js";
import { DOCUMENT_TYPES_LIST } from "../models/document-model.js";

const router = express.Router();

router.use(authenticate);

router.get("/documents", listDocumentsHandler);

router.post(
  "/documents",
  [
    body("jobId").notEmpty().withMessage("jobId is required"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("type")
      .optional()
      .isIn(DOCUMENT_TYPES_LIST)
      .withMessage("Invalid document type"),
    body("content").optional().trim(),
  ],
  createDocumentHandler
);

router.post("/documents/generate-cover-letter", generateCoverLetterHandler);

router.delete("/documents/:id", deleteDocumentHandler);

export default router;