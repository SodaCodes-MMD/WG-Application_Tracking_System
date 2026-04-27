// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = "test-jwt-secret-documents";

const request = require("supertest");
const app = require("../app").default;
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token-service");

jest.mock("../repositories/document-repository");
const docRepo = require("../repositories/document-repository");

// Prevent AI / HTML-to-DOCX calls for irrelevant endpoints
jest.mock("../services/ai-service", () => ({
  generateCoverLetterDraft: jest.fn(),
  generateResumeDraft: jest.fn(),
  rewriteDocumentContent: jest.fn(),
}));

describe("Documents API (S3-001, S3-010)", () => {
  const userId = "aaaa00000000000000000001";
  const docId  = "dddd00000000000000000004";
  const jobId  = "cccc00000000000000000003";

  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    token = jwt.sign(
      { userId, email: "user@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  // ─── S3-001: GET /api/documents?jobId= ────────────────────────────────────

  describe("GET /api/documents", () => {
    it("filters by jobId when provided", async () => {
      const mockDoc = {
        _id: docId,
        userId,
        name: "Test Resume",
        type: "Resume",
        status: "Draft",
        linkedJobs: [{ _id: jobId, title: "SWE", company: "Acme" }],
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([mockDoc]);

      const res = await request(app)
        .get(`/api/documents?jobId=${jobId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId, linkedJobs: jobId }),
        expect.any(Object)
      );
    });

    it("returns all user documents when no jobId filter is given", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      const res = await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.not.objectContaining({ linkedJobs: expect.anything() }),
        expect.any(Object)
      );
    });

    it("scopes results to the authenticated user", async () => {
      docRepo.findDocumentsByUserWithFilter.mockResolvedValue([]);

      await request(app)
        .get("/api/documents")
        .set("Authorization", `Bearer ${token}`);

      expect(docRepo.findDocumentsByUserWithFilter).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ userId }),
        expect.any(Object)
      );
    });

    it("requires authentication", async () => {
      const res = await request(app).get("/api/documents");
      expect(res.status).toBe(401);
    });
  });

  // ─── S3-010: PATCH /api/documents/:id/link ────────────────────────────────

  describe("PATCH /api/documents/:id/link", () => {
    it("links a document to a job with ownership enforcement", async () => {
      const mockDoc = { _id: docId, userId, linkedJobs: [jobId] };
      docRepo.linkDocumentToJob.mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/documents/${docId}/link`)
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ _id: docId });
      expect(docRepo.linkDocumentToJob).toHaveBeenCalledWith(docId, userId, jobId);
    });

    it("returns 400 when jobId is missing", async () => {
      const res = await request(app)
        .patch(`/api/documents/${docId}/link`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(docRepo.linkDocumentToJob).not.toHaveBeenCalled();
    });

    it("returns 404 when document is not found or belongs to another user", async () => {
      docRepo.linkDocumentToJob.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/documents/${docId}/link`)
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .patch(`/api/documents/${docId}/link`)
        .send({ jobId });

      expect(res.status).toBe(401);
    });
  });

  // ─── S3-010: PATCH /api/documents/:id/unlink ──────────────────────────────

  describe("PATCH /api/documents/:id/unlink", () => {
    it("unlinks a document from a job with ownership enforcement", async () => {
      const mockDoc = { _id: docId, userId, linkedJobs: [] };
      docRepo.unlinkDocumentFromJob.mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/documents/${docId}/unlink`)
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ _id: docId });
      expect(docRepo.unlinkDocumentFromJob).toHaveBeenCalledWith(docId, userId, jobId);
    });

    it("returns 400 when jobId is missing", async () => {
      const res = await request(app)
        .patch(`/api/documents/${docId}/unlink`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(docRepo.unlinkDocumentFromJob).not.toHaveBeenCalled();
    });

    it("returns 404 when document is not found or belongs to another user", async () => {
      docRepo.unlinkDocumentFromJob.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/documents/${docId}/unlink`)
        .set("Authorization", `Bearer ${token}`)
        .send({ jobId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("requires authentication", async () => {
      const res = await request(app)
        .patch(`/api/documents/${docId}/unlink`)
        .send({ jobId });

      expect(res.status).toBe(401);
    });
  });
});
