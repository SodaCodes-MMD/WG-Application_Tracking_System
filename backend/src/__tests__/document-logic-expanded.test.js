// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = "test-jwt-secret-doc-expanded";

const request = require("supertest");
const app = require("../app").default;
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token-service");

jest.mock("../repositories/document-repository");
const docRepo = require("../repositories/document-repository");

jest.mock("../repositories/profile-repository");
const profileRepo = require("../repositories/profile-repository");

jest.mock("../repositories/job-repository");
const jobRepo = require("../repositories/job-repository");

jest.mock("pdf-parse", () => jest.fn().mockResolvedValue({ text: "extracted text" }));
jest.mock("mammoth", () => ({ convertToHtml: jest.fn().mockResolvedValue({ value: "<html>converted</html>" }) }));
jest.mock("html-to-docx", () => jest.fn().mockResolvedValue(Buffer.from("mock docx")));

jest.mock("../services/ai-service", () => ({
  generateCoverLetterDraft: jest.fn(),
  generateResumeDraft: jest.fn(),
  rewriteDocumentContent: jest.fn(),
}));

const aiService = require("../services/ai-service");

describe("Document Logic Expanded Tests (SCRUM-192)", () => {
  const userId = "aaaa00000000000000000001";
  const otherUserId = "bbbb00000000000000000002";
  const docId = "dddd00000000000000000004";
  const jobId = "cccc00000000000000000003";
  const otherJobId = "eeee00000000000000000005";

  let token, otherToken;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    token = jwt.sign(
      { userId, email: "user@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    otherToken = jwt.sign(
      { userId: otherUserId, email: "other@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  // ─── Document Versioning Tests ────────────────────────────────────────────

  describe("Document Versioning", () => {
    it("adds a version and increments version number correctly", async () => {
      const existingDoc = {
        _id: docId,
        userId,
        name: "Resume",
        versions: [
          { versionNumber: 1, content: "original content" },
          { versionNumber: 2, content: "second version" },
        ],
      };
      docRepo.addDocumentVersion.mockResolvedValue({
        ...existingDoc,
        versions: [
          ...existingDoc.versions,
          { versionNumber: 3, content: "new content" },
        ],
      });

      const res = await request(app)
        .post(`/api/documents/${docId}/versions`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "new content" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.versions).toHaveLength(3);
      expect(res.body.data.versions[2].versionNumber).toBe(3);
      expect(docRepo.addDocumentVersion).toHaveBeenCalledWith(
        docId,
        userId,
        "new content"
      );
    });

    it("returns 404 when adding version to non-existent document", async () => {
      docRepo.addDocumentVersion.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/versions`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "new content" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Document not found");
    });

    it("returns 404 when adding version to another user's document", async () => {
      docRepo.addDocumentVersion.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/versions`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ content: "new content" });

      expect(res.status).toBe(404);
      expect(docRepo.addDocumentVersion).toHaveBeenCalledWith(
        docId,
        otherUserId,
        "new content"
      );
    });

    it("returns 500 when versioning fails due to repository error", async () => {
      docRepo.addDocumentVersion.mockRejectedValue(
        new Error("Database connection failed")
      );

      const res = await request(app)
        .post(`/api/documents/${docId}/versions`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "new content" });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("requires authentication to add version", async () => {
      const res = await request(app)
        .post(`/api/documents/${docId}/versions`)
        .send({ content: "new content" });

      expect(res.status).toBe(401);
    });
  });

  // ─── Archive/Restore Tests ────────────────────────────────────────────────

  describe("Document Archive/Restore", () => {
    it("archives a document successfully", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Resume",
        status: "Archived",
      };
      docRepo.archiveDocumentByIdAndUser.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post(`/api/documents/${docId}/archive`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Archived");
      expect(docRepo.archiveDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        userId
      );
    });

    it("returns 404 when archiving non-existent document", async () => {
      docRepo.archiveDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/archive`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when archiving another user's document", async () => {
      docRepo.archiveDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/archive`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
      expect(docRepo.archiveDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        otherUserId
      );
    });

    it("restores an archived document successfully", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Resume",
        status: "Draft",
      };
      docRepo.restoreDocumentByIdAndUser.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post(`/api/documents/${docId}/restore`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("Draft");
      expect(docRepo.restoreDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        userId
      );
    });

    it("returns 404 when restoring non-existent document", async () => {
      docRepo.restoreDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/restore`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when restoring another user's document", async () => {
      docRepo.restoreDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/restore`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
      expect(docRepo.restoreDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        otherUserId
      );
    });

    it("requires authentication to archive", async () => {
      const res = await request(app).post(`/api/documents/${docId}/archive`);
      expect(res.status).toBe(401);
    });

    it("requires authentication to restore", async () => {
      const res = await request(app).post(`/api/documents/${docId}/restore`);
      expect(res.status).toBe(401);
    });

    it("returns 500 when archive fails due to repository error", async () => {
      docRepo.archiveDocumentByIdAndUser.mockRejectedValue(
        new Error("Database error")
      );

      const res = await request(app)
        .post(`/api/documents/${docId}/archive`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("returns 500 when restore fails due to repository error", async () => {
      docRepo.restoreDocumentByIdAndUser.mockRejectedValue(
        new Error("Database error")
      );

      const res = await request(app)
        .post(`/api/documents/${docId}/restore`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Upload/Download Tests ────────────────────────────────────────────────

  describe("Document Upload", () => {
    it("uploads a PDF document successfully", async () => {
      const mockFile = {
        mimetype: "application/pdf",
        size: 1024,
        buffer: Buffer.from("mock pdf content"),
        originalname: "test.pdf",
      };

      const mockParsed = { text: "extracted text from pdf" };
      jest.mock("pdf-parse", () => jest.fn().mockResolvedValue(mockParsed));

      const mockDoc = {
        _id: docId,
        userId,
        name: "test",
        type: "Resume",
        status: "Draft",
        versions: [{ versionNumber: 1, content: "extracted text from pdf" }],
      };
      docRepo.createDocument.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .field("type", "Resume")
        .attach("file", Buffer.from("mock pdf content"), "test.pdf");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(docRepo.createDocument).toHaveBeenCalledWith(userId, {
        name: "test",
        type: "Resume",
        category: "General",
        status: "Draft",
        versions: [{ versionNumber: 1, content: expect.any(String) }],
      });
    });

    it("uploads a DOCX document successfully", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "test",
        type: "Cover Letter",
        status: "Draft",
        versions: [{ versionNumber: 1, content: "<html>converted content</html>" }],
      };
      docRepo.createDocument.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .field("type", "Cover Letter")
        .attach("file", Buffer.from("mock docx content"), "test.docx");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("returns 400 when no file is uploaded", async () => {
      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "Resume" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("No file uploaded");
    });

    it("returns 400 when file type is not supported", async () => {
      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .field("type", "Resume")
        .attach("file", Buffer.from("mock content"), "test.txt");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("Unsupported file type");
    });

    it("returns 400 when type is missing", async () => {
      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("mock content"), "test.pdf");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("type must be");
    });

    it("returns 400 when type is invalid", async () => {
      const res = await request(app)
        .post("/api/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .field("type", "InvalidType")
        .attach("file", Buffer.from("mock content"), "test.pdf");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("type must be");
    });

    it("requires authentication to upload", async () => {
      const res = await request(app)
        .post("/api/documents/upload")
        .attach("file", Buffer.from("mock content"), "test.pdf");

      expect(res.status).toBe(401);
    });
  });

  describe("Document Download", () => {
    it("downloads latest version as DOCX", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "My Resume",
        type: "Resume",
        versions: [
          {
            _id: "v1",
            versionNumber: 1,
            content: "<p>Resume content</p>",
          },
          {
            _id: "v2",
            versionNumber: 2,
            content: "<p>Updated resume content</p>",
          },
        ],
      };
      docRepo.findDocumentByIdAndUser.mockResolvedValue(mockDoc);

      jest.mock("html-to-docx", () => jest.fn().mockResolvedValue(Buffer.from("mock docx")));

      const res = await request(app)
        .get(`/api/documents/${docId}/download-docx`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.header["content-type"]).toContain(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      expect(res.header["content-disposition"]).toContain("attachment");
    });

    it("downloads specific version when versionId provided", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "My Resume",
        type: "Resume",
        versions: [
          {
            _id: "v1",
            versionNumber: 1,
            content: "<p>Version 1 content</p>",
          },
          {
            _id: "v2",
            versionNumber: 2,
            content: "<p>Version 2 content</p>",
          },
        ],
      };
      docRepo.findDocumentByIdAndUser.mockResolvedValue(mockDoc);

      const res = await request(app)
        .get(`/api/documents/${docId}/download-docx?versionId=v1`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.header["content-disposition"]).toContain("v1");
    });

    it("returns 404 when document not found for download", async () => {
      docRepo.findDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/documents/${docId}/download-docx`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when document has no content", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Empty Doc",
        type: "Resume",
        versions: [],
      };
      docRepo.findDocumentByIdAndUser.mockResolvedValue(mockDoc);

      const res = await request(app)
        .get(`/api/documents/${docId}/download-docx`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain("No content to download");
    });

    it("returns 404 when specific version not found", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "My Resume",
        type: "Resume",
        versions: [
          {
            _id: "v1",
            versionNumber: 1,
            content: "<p>Content</p>",
          },
        ],
      };
      docRepo.findDocumentByIdAndUser.mockResolvedValue(mockDoc);

      const res = await request(app)
        .get(`/api/documents/${docId}/download-docx?versionId=nonexistent`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain("No content to download");
    });

    it("requires authentication to download", async () => {
      const res = await request(app).get(
        `/api/documents/${docId}/download-docx`
      );
      expect(res.status).toBe(401);
    });
  });

  // ─── Job-Link Ownership Tests ─────────────────────────────────────────────

  describe("Job-Link Ownership Rules", () => {
    it("links document to job with ownership enforcement", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        linkedJobs: [jobId],
      };
      docRepo.linkDocumentToJob.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post(`/api/documents/${docId}/link-job`)
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(docRepo.linkDocumentToJob).toHaveBeenCalledWith(
        docId,
        userId,
        jobId
      );
    });

    it("returns 404 when linking job to another user's document", async () => {
      docRepo.linkDocumentToJob.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/link-job`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ jobId });

      expect(res.status).toBe(404);
      expect(docRepo.linkDocumentToJob).toHaveBeenCalledWith(
        docId,
        otherUserId,
        jobId
      );
    });

    it("returns 400 when jobId is missing for link", async () => {
      const res = await request(app)
        .post(`/api/documents/${docId}/link-job`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(docRepo.linkDocumentToJob).not.toHaveBeenCalled();
    });

    it("unlinks document from job with ownership enforcement", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        linkedJobs: [],
      };
      docRepo.unlinkDocumentFromJob.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post(`/api/documents/${docId}/unlink-job`)
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(docRepo.unlinkDocumentFromJob).toHaveBeenCalledWith(
        docId,
        userId,
        jobId
      );
    });

    it("returns 404 when unlinking job from another user's document", async () => {
      docRepo.unlinkDocumentFromJob.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/unlink-job`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ jobId });

      expect(res.status).toBe(404);
      expect(docRepo.unlinkDocumentFromJob).toHaveBeenCalledWith(
        docId,
        otherUserId,
        jobId
      );
    });

    it("returns 400 when jobId is missing for unlink", async () => {
      const res = await request(app)
        .post(`/api/documents/${docId}/unlink-job`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(docRepo.unlinkDocumentFromJob).not.toHaveBeenCalled();
    });

    it("gets documents by job with ownership scoping", async () => {
      const mockDocs = [
        { _id: docId, userId, name: "Doc1", linkedJobs: [jobId] },
      ];
      docRepo.findDocumentsByJob.mockResolvedValue(mockDocs);

      const res = await request(app)
        .get(`/api/documents/job/${jobId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(docRepo.findDocumentsByJob).toHaveBeenCalledWith(userId, jobId);
    });

    it("returns empty array when no documents linked to job", async () => {
      docRepo.findDocumentsByJob.mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/documents/job/${jobId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("requires authentication for job document retrieval", async () => {
      const res = await request(app).get(`/api/documents/job/${jobId}`);
      expect(res.status).toBe(401);
    });
  });

  // ─── Duplicate/Rename/AI Rewrite Tests ────────────────────────────────────

  describe("Document Duplicate", () => {
    it("duplicates a document successfully", async () => {
      const originalDoc = {
        _id: docId,
        userId,
        name: "Original Resume",
        type: "Resume",
        versions: [{ versionNumber: 1, content: "content" }],
      };
      const copyDoc = {
        _id: "newid000000000000000001",
        userId,
        name: "Original Resume (Copy)",
        type: "Resume",
        versions: [{ versionNumber: 1, content: "content" }],
        linkedJobs: [],
      };
      docRepo.duplicateDocument.mockResolvedValue(copyDoc);

      const res = await request(app)
        .post(`/api/documents/${docId}/duplicate`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Original Resume (Copy)");
      expect(res.body.data.linkedJobs).toEqual([]);
      expect(docRepo.duplicateDocument).toHaveBeenCalledWith(docId, userId);
    });

    it("returns 404 when duplicating non-existent document", async () => {
      docRepo.duplicateDocument.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/duplicate`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when duplicating another user's document", async () => {
      docRepo.duplicateDocument.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/duplicate`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
      expect(docRepo.duplicateDocument).toHaveBeenCalledWith(
        docId,
        otherUserId
      );
    });

    it("requires authentication to duplicate", async () => {
      const res = await request(app).post(`/api/documents/${docId}/duplicate`);
      expect(res.status).toBe(401);
    });
  });

  describe("Document Rename", () => {
    it("renames a document successfully", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "New Name",
        type: "Resume",
      };
      docRepo.renameDocument.mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/documents/${docId}/rename`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Name");
      expect(docRepo.renameDocument).toHaveBeenCalledWith(
        docId,
        userId,
        "New Name"
      );
    });

    it("trims whitespace from name", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Trimmed Name",
        type: "Resume",
      };
      docRepo.renameDocument.mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/documents/${docId}/rename`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "  Trimmed Name  " });

      expect(res.status).toBe(200);
      expect(docRepo.renameDocument).toHaveBeenCalledWith(
        docId,
        userId,
        "Trimmed Name"
      );
    });

    it("returns 400 when name is empty", async () => {
      const res = await request(app)
        .patch(`/api/documents/${docId}/rename`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Name is required");
    });

    it("returns 400 when name is only whitespace", async () => {
      const res = await request(app)
        .patch(`/api/documents/${docId}/rename`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "   " });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when renaming non-existent document", async () => {
      docRepo.renameDocument.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/documents/${docId}/rename`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when renaming another user's document", async () => {
      docRepo.renameDocument.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/documents/${docId}/rename`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(404);
      expect(docRepo.renameDocument).toHaveBeenCalledWith(
        docId,
        otherUserId,
        "New Name"
      );
    });

    it("requires authentication to rename", async () => {
      const res = await request(app)
        .patch(`/api/documents/${docId}/rename`)
        .send({ name: "New Name" });

      expect(res.status).toBe(401);
    });
  });

  describe("AI Rewrite Document", () => {
    it("rewrites document content successfully", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Resume",
        type: "Resume",
        versions: [
          { versionNumber: 1, content: "<p>Original content</p>" },
          { versionNumber: 2, content: "<p>Updated content</p>" },
        ],
      };
      docRepo.findDocumentByIdAndUser.mockResolvedValue(mockDoc);
      aiService.rewriteDocumentContent.mockResolvedValue(
        "<p>Rewritten content</p>"
      );

      const res = await request(app)
        .post(`/api/documents/${docId}/ai-rewrite`)
        .set("Authorization", `Bearer ${token}`)
        .send({ instruction: "Make it more professional" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rewritten).toBe("<p>Rewritten content</p>");
      expect(aiService.rewriteDocumentContent).toHaveBeenCalledWith(
        "<p>Updated content</p>",
        "Resume",
        "Make it more professional"
      );
    });

    it("uses latest version content for rewrite", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Resume",
        type: "Resume",
        versions: [
          { versionNumber: 1, content: "<p>Old content</p>" },
          { versionNumber: 2, content: "<p>Latest content</p>" },
        ],
      };
      docRepo.findDocumentByIdAndUser.mockResolvedValue(mockDoc);
      aiService.rewriteDocumentContent.mockResolvedValue("<p>Rewritten</p>");

      await request(app)
        .post(`/api/documents/${docId}/ai-rewrite`)
        .set("Authorization", `Bearer ${token}`)
        .send({ instruction: "Improve" });

      expect(aiService.rewriteDocumentContent).toHaveBeenCalledWith(
        "<p>Latest content</p>",
        "Resume",
        "Improve"
      );
    });

    it("returns 404 when document not found for rewrite", async () => {
      docRepo.findDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/ai-rewrite`)
        .set("Authorization", `Bearer ${token}`)
        .send({ instruction: "Improve" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 when document has no content", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Empty Doc",
        type: "Resume",
        versions: [],
      };
      docRepo.findDocumentByIdAndUser.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post(`/api/documents/${docId}/ai-rewrite`)
        .set("Authorization", `Bearer ${token}`)
        .send({ instruction: "Improve" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("No content to rewrite");
    });

    it("returns 404 when rewriting another user's document", async () => {
      docRepo.findDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/documents/${docId}/ai-rewrite`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ instruction: "Improve" });

      expect(res.status).toBe(404);
      expect(docRepo.findDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        otherUserId
      );
    });

    it("requires authentication to rewrite", async () => {
      const res = await request(app)
        .post(`/api/documents/${docId}/ai-rewrite`)
        .send({ instruction: "Improve" });

      expect(res.status).toBe(401);
    });
  });

  // ─── Filter and Sort Tests ────────────────────────────────────────────────

  describe("Document Filtering and Sorting", () => {
    it("filters documents by type", async () => {
      const mockDocs = [
        { _id: docId, userId, name: "Resume", type: "Resume" },
      ];
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue(mockDocs);

      const res = await request(app)
        .get("/api/documents?type=Resume")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId, type: "Resume" }),
        expect.any(Object)
      );
    });

    it("filters documents by status", async () => {
      const mockDocs = [
        { _id: docId, userId, name: "Resume", status: "Ready" },
      ];
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue(mockDocs);

      const res = await request(app)
        .get("/api/documents?status=Ready")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId, status: "Ready" }),
        expect.any(Object)
      );
    });

    it("filters documents by tag", async () => {
      const mockDocs = [
        { _id: docId, userId, name: "Resume", tags: ["important"] },
      ];
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue(mockDocs);

      const res = await request(app)
        .get("/api/documents?tag=important")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId, tags: "important" }),
        expect.any(Object)
      );
    });

    it("sorts documents by name ascending", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents?sortBy=name&sortOrder=asc")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId }),
        { name: 1 }
      );
    });

    it("sorts documents by name descending", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents?sortBy=name&sortOrder=desc")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId }),
        { name: -1 }
      );
    });

    it("sorts documents by type", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents?sortBy=type&sortOrder=asc")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId }),
        { type: 1 }
      );
    });

    it("sorts documents by status", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents?sortBy=status&sortOrder=asc")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId }),
        { status: 1 }
      );
    });

    it("sorts documents by createdAt", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents?sortBy=createdAt&sortOrder=asc")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId }),
        { createdAt: 1 }
      );
    });

    it("sorts documents by updatedAt", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents?sortBy=updatedAt&sortOrder=asc")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId }),
        { updatedAt: 1 }
      );
    });

    it("defaults to updatedAt descending sort", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId }),
        { updatedAt: -1 }
      );
    });

    it("combines multiple filters", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents?type=Resume&status=Ready&tag=important")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          userId,
          type: "Resume",
          status: "Ready",
          tags: "important",
        }),
        expect.any(Object)
      );
    });
  });

  // ─── CRUD Operations Tests ────────────────────────────────────────────────

  describe("Document CRUD Operations", () => {
    it("creates a document with all fields", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Full Resume",
        type: "Resume",
        category: "Backend",
        status: "Ready",
        tags: ["python", "django"],
        versions: [{ versionNumber: 1, content: "content" }],
        linkedJobs: [jobId],
      };
      docRepo.createDocument.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post("/api/documents")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Full Resume",
          type: "Resume",
          category: "Backend",
          status: "Ready",
          tags: ["python", "django"],
          versions: [{ versionNumber: 1, content: "content" }],
          linkedJobs: [jobId],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(docRepo.createDocument).toHaveBeenCalledWith(userId, {
        name: "Full Resume",
        type: "Resume",
        category: "Backend",
        status: "Ready",
        tags: ["python", "django"],
        versions: [{ versionNumber: 1, content: "content" }],
        linkedJobs: [jobId],
      });
    });

    it("creates a document with defaults", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Basic Doc",
        type: "Notes",
        category: "General",
        status: "Draft",
        versions: [],
        linkedJobs: [],
      };
      docRepo.createDocument.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post("/api/documents")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Basic Doc", type: "Notes" });

      expect(res.status).toBe(201);
      expect(docRepo.createDocument).toHaveBeenCalledWith(userId, {
        name: "Basic Doc",
        type: "Notes",
      });
    });

    it("updates a document successfully", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Updated Name",
        type: "Resume",
        status: "Ready",
      };
      docRepo.updateDocumentByIdAndUser.mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/documents/${docId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name", status: "Ready" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated Name");
      expect(docRepo.updateDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        userId,
        { name: "Updated Name", status: "Ready" }
      );
    });

    it("returns 404 when updating non-existent document", async () => {
      docRepo.updateDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/documents/${docId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when updating another user's document", async () => {
      docRepo.updateDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/documents/${docId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
      expect(docRepo.updateDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        otherUserId,
        { name: "Updated" }
      );
    });

    it("deletes a document successfully", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Deleted Doc",
      };
      docRepo.deleteDocumentByIdAndUser.mockResolvedValue(mockDoc);

      const res = await request(app)
        .delete(`/api/documents/${docId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(docRepo.deleteDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        userId
      );
    });

    it("returns 404 when deleting non-existent document", async () => {
      docRepo.deleteDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/documents/${docId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when deleting another user's document", async () => {
      docRepo.deleteDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/documents/${docId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
      expect(docRepo.deleteDocumentByIdAndUser).toHaveBeenCalledWith(
        docId,
        otherUserId
      );
    });
  });

  // ─── AI Generation Tests ──────────────────────────────────────────────────

  describe("AI Document Generation", () => {
    it("generates AI cover letter successfully", async () => {
      const mockJob = {
        _id: jobId,
        userId,
        title: "Software Engineer",
        company: "TechCorp",
      };
      const mockProfile = {
        userId,
        firstName: "John",
        lastName: "Doe",
        summary: "Experienced developer",
      };
      const mockDoc = {
        _id: docId,
        userId,
        name: "Cover Letter - Software Engineer at TechCorp",
        type: "Cover Letter",
        status: "Draft",
        versions: [{ versionNumber: 1, content: "Generated content" }],
        linkedJobs: [jobId],
      };

      jobRepo.findJobByIdAndUser.mockResolvedValue(mockJob);
      profileRepo.findProfileByUserId.mockResolvedValue(mockProfile);
      aiService.generateCoverLetterDraft.mockResolvedValue("Generated content");
      docRepo.createDocument.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post("/api/documents/generate-cover-letter")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(docRepo.createDocument).toHaveBeenCalledWith(userId, {
        name: "Cover Letter - Software Engineer at TechCorp",
        type: "Cover Letter",
        category: "General",
        status: "Draft",
        versions: [{ versionNumber: 1, content: "Generated content" }],
        linkedJobs: [jobId],
      });
    });

    it("returns 400 when jobId is missing for cover letter generation", async () => {
      const res = await request(app)
        .post("/api/documents/generate-cover-letter")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("jobId is required");
    });

    it("returns 404 when job not found for cover letter generation", async () => {
      jobRepo.findJobByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/documents/generate-cover-letter")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Job not found");
    });

    it("returns 404 when profile not found for cover letter generation", async () => {
      const mockJob = { _id: jobId, userId, title: "Engineer", company: "Co" };
      jobRepo.findJobByIdAndUser.mockResolvedValue(mockJob);
      profileRepo.findProfileByUserId.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/documents/generate-cover-letter")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Profile not found");
    });

    it("generates AI resume successfully", async () => {
      const mockJob = {
        _id: jobId,
        userId,
        title: "Software Engineer",
        company: "TechCorp",
      };
      const mockProfile = {
        userId,
        firstName: "John",
        lastName: "Doe",
        summary: "Experienced developer",
      };
      const mockDoc = {
        _id: docId,
        userId,
        name: "Resume - Software Engineer at TechCorp",
        type: "Resume",
        status: "Draft",
        versions: [{ versionNumber: 1, content: "Generated content" }],
        linkedJobs: [jobId],
      };

      jobRepo.findJobByIdAndUser.mockResolvedValue(mockJob);
      profileRepo.findProfileByUserId.mockResolvedValue(mockProfile);
      aiService.generateResumeDraft.mockResolvedValue("Generated content");
      docRepo.createDocument.mockResolvedValue(mockDoc);

      const res = await request(app)
        .post("/api/documents/generate-resume")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(docRepo.createDocument).toHaveBeenCalledWith(userId, {
        name: "Resume - Software Engineer at TechCorp",
        type: "Resume",
        category: "General",
        status: "Draft",
        versions: [{ versionNumber: 1, content: "Generated content" }],
        linkedJobs: [jobId],
      });
    });

    it("returns 400 when jobId is missing for resume generation", async () => {
      const res = await request(app)
        .post("/api/documents/generate-resume")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("jobId is required");
    });

    it("returns 404 when job not found for resume generation", async () => {
      jobRepo.findJobByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/documents/generate-resume")
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Job not found");
    });

    it("requires authentication for AI cover letter generation", async () => {
      const res = await request(app)
        .post("/api/documents/generate-cover-letter")
        .send({ jobId });

      expect(res.status).toBe(401);
    });

    it("requires authentication for AI resume generation", async () => {
      const res = await request(app)
        .post("/api/documents/generate-resume")
        .send({ jobId });

      expect(res.status).toBe(401);
    });
  });
});
