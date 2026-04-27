// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = "test-jwt-secret-doc-lifecycle";

const request = require("supertest");
const app = require("../app").default;
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token-service");

jest.mock("../repositories/document-repository");
const docRepo = require("../repositories/document-repository");

jest.mock("../services/ai-service", () => ({
  generateCoverLetterDraft: jest.fn(),
  generateResumeDraft: jest.fn(),
  rewriteDocumentContent: jest.fn(),
}));

describe("Document Lifecycle (S3-021)", () => {
  const userId = "aaaa00000000000000000001";
  const otherUserId = "bbbb00000000000000000002";
  const docId  = "dddd00000000000000000004";
  const jobId  = "cccc00000000000000000003";

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

  // ─── Create ───────────────────────────────────────────────────────────────

  it("creates a document successfully with valid data", async () => {
    const mockDoc = { _id: docId, userId, name: "My Resume", type: "Resume", status: "Draft", versions: [], linkedJobs: [] };
    docRepo.createDocument.mockResolvedValue(mockDoc);

    const res = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Resume", type: "Resume", status: "Draft" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ _id: docId, name: "My Resume" });
  });

  it("returns 500 when document creation fails (e.g. repo error)", async () => {
    docRepo.createDocument.mockRejectedValue(new Error("Validation failed: name is required"));

    const res = await request(app)
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it("requires authentication to create a document", async () => {
    const res = await request(app)
      .post("/api/documents")
      .send({ name: "Resume", type: "Resume" });

    expect(res.status).toBe(401);
  });

  // ─── Read ─────────────────────────────────────────────────────────────────

  it("returns 404 when fetching a document owned by another user", async () => {
    // otherUserId owns the doc; userId gets null back from the scoped query
    docRepo.findDocumentByIdAndUser.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ─── Versioning ───────────────────────────────────────────────────────────

  it("adds a document version successfully for the owner", async () => {
    const updatedDoc = { _id: docId, userId, name: "My Resume", versions: [{ versionNumber: 1, content: "v1 content" }] };
    docRepo.addDocumentVersion.mockResolvedValue(updatedDoc);

    const res = await request(app)
      .post(`/api/documents/${docId}/versions`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "v1 content" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.versions).toHaveLength(1);
  });

  it("returns 404 when adding a version to another user's document", async () => {
    docRepo.addDocumentVersion.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/documents/${docId}/versions`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ content: "v1 content" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ─── Job Linking ──────────────────────────────────────────────────────────

  it("links a document to a job successfully", async () => {
    const linkedDoc = { _id: docId, userId, linkedJobs: [jobId] };
    docRepo.linkDocumentToJob.mockResolvedValue(linkedDoc);

    const res = await request(app)
      .post(`/api/documents/${docId}/link-job`)
      .set("Authorization", `Bearer ${token}`)
      .send({ jobId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(docRepo.linkDocumentToJob).toHaveBeenCalledWith(docId, userId, jobId);
  });

  it("returns 404 when linking fails for the wrong user", async () => {
    docRepo.linkDocumentToJob.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/documents/${docId}/link-job`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ jobId });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ─── Job Unlinking ────────────────────────────────────────────────────────

  it("unlinks a document from a job successfully", async () => {
    const unlinkedDoc = { _id: docId, userId, linkedJobs: [] };
    docRepo.unlinkDocumentFromJob.mockResolvedValue(unlinkedDoc);

    const res = await request(app)
      .post(`/api/documents/${docId}/unlink-job`)
      .set("Authorization", `Bearer ${token}`)
      .send({ jobId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(docRepo.unlinkDocumentFromJob).toHaveBeenCalledWith(docId, userId, jobId);
  });

  // ─── Delete ───────────────────────────────────────────────────────────────

  it("deletes a document successfully for the owner", async () => {
    const deletedDoc = { _id: docId, userId, name: "My Resume" };
    docRepo.deleteDocumentByIdAndUser.mockResolvedValue(deletedDoc);

    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(docRepo.deleteDocumentByIdAndUser).toHaveBeenCalledWith(docId, userId);
  });

  it("returns 404 when deleting another user's document", async () => {
    docRepo.deleteDocumentByIdAndUser.mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/documents/${docId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("requires authentication to delete a document", async () => {
    const res = await request(app).delete(`/api/documents/${docId}`);

    expect(res.status).toBe(401);
  });
});
