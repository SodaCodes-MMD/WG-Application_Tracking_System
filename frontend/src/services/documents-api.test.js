import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  addDocumentVersion,
  linkDocumentToJob,
  unlinkDocumentFromJob,
  getDocumentsByJob,
  generateAiCoverLetter,
  generateAiResume,
  aiRewriteDocument,
} from "./documents-api.js";

describe("documents-api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("listDocuments", () => {
    it("fetches documents without filters", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await listDocuments("test-token");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("fetches documents with filters", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await listDocuments("test-token", { type: "Resume", status: "Draft" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("type=Resume"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=Draft"),
        expect.any(Object)
      );
    });

    it("fetches documents with sorting", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await listDocuments("test-token", { sortBy: "createdAt", sortOrder: "asc" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=createdAt"),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("sortOrder=asc"),
        expect.any(Object)
      );
    });
  });

  describe("getDocument", () => {
    it("fetches a single document by ID", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { _id: "doc-123" } }),
      });

      const result = await getDocument("test-token", "doc-123");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/doc-123",
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  describe("createDocument", () => {
    it("creates a new document", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { _id: "doc-123" } }),
      });

      const docData = { name: "My Resume", type: "Resume" };
      const result = await createDocument("test-token", docData);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(docData),
        })
      );
    });
  });

  describe("updateDocument", () => {
    it("updates an existing document", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { _id: "doc-123" } }),
      });

      const updateData = { name: "Updated Resume" };
      await updateDocument("test-token", "doc-123", updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/doc-123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe("deleteDocument", () => {
    it("deletes a document", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      await deleteDocument("test-token", "doc-123");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/doc-123",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("addDocumentVersion", () => {
    it("adds a new version to a document", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { _id: "doc-123" } }),
      });

      const content = "<html>Resume content</html>";
      await addDocumentVersion("test-token", "doc-123", content);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/doc-123/versions",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ content }),
        })
      );
    });
  });

  describe("linkDocumentToJob", () => {
    it("links a document to a job", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      await linkDocumentToJob("test-token", "doc-123", "job-456");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/doc-123/link-job",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ jobId: "job-456" }),
        })
      );
    });
  });

  describe("unlinkDocumentFromJob", () => {
    it("unlinks a document from a job", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      await unlinkDocumentFromJob("test-token", "doc-123", "job-456");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/doc-123/unlink-job",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ jobId: "job-456" }),
        })
      );
    });
  });

  describe("getDocumentsByJob", () => {
    it("fetches documents for a specific job", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await getDocumentsByJob("test-token", "job-456");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/job/job-456",
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  describe("generateAiCoverLetter", () => {
    it("generates AI cover letter for a job", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { _id: "doc-123" } }),
      });

      await generateAiCoverLetter("test-token", "job-456");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/generate-cover-letter",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ jobId: "job-456" }),
        })
      );
    });
  });

  describe("generateAiResume", () => {
    it("generates AI resume for a job", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { _id: "doc-123" } }),
      });

      await generateAiResume("test-token", "job-456");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/generate-resume",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ jobId: "job-456" }),
        })
      );
    });
  });

  describe("aiRewriteDocument", () => {
    it("sends AI rewrite request", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { rewritten: "new content" } }),
      });

      await aiRewriteDocument("test-token", "doc-123", "Make it more professional");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/documents/doc-123/ai-rewrite",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ instruction: "Make it more professional" }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("returns error object on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await listDocuments("test-token");

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("NETWORK_ERROR");
    });
  });
});
