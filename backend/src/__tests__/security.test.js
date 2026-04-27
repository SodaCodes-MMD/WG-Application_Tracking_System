// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = "test-jwt-secret-security";

const request = require("supertest");
const app = require("../app").default;
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token-service");
const { authLimiterStore } = require("../routes/auth-routes");

jest.mock("../repositories/job-repository");
const jobRepo = require("../repositories/job-repository");

jest.mock("../repositories/document-repository");
const docRepo = require("../repositories/document-repository");

jest.mock("../services/profile-service", () => ({
  getProfileForUser: jest.fn(),
  saveProfileForUser: jest.fn(),
  addExperience: jest.fn(),
  updateExperience: jest.fn(),
  deleteExperience: jest.fn(),
  reorderExperience: jest.fn(),
  addEducation: jest.fn(),
  updateEducation: jest.fn(),
  deleteEducation: jest.fn(),
  addSkill: jest.fn(),
  updateSkill: jest.fn(),
  deleteSkill: jest.fn(),
  reorderSkills: jest.fn(),
  getPreferences: jest.fn(),
  savePreferences: jest.fn(),
}));

jest.mock("../services/ai-service", () => ({
  generateCoverLetterDraft: jest.fn(),
  generateResumeDraft: jest.fn(),
  rewriteDocumentContent: jest.fn(),
}));

jest.mock("../services/auth-service");
const authService = require("../services/auth-service");

describe("Security Tests (S3-020)", () => {
  const userAId = "aaaa00000000000000000001";
  const userBId = "bbbb00000000000000000002";
  const docId   = "dddd00000000000000000004";
  const jobId   = "cccc00000000000000000003";

  let tokenA, tokenB;

  beforeEach(async () => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    await authLimiterStore.resetAll();

    tokenA = jwt.sign(
      { userId: userAId, email: "usera@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    tokenB = jwt.sign(
      { userId: userBId, email: "userb@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  // ─── Input Injection Protection ───────────────────────────────────────────

  describe("Input Injection Protection", () => {
    it("sanitizes or rejects NoSQL injection attempt in job title", async () => {
      jobRepo.createJob.mockResolvedValue({
        _id: jobId,
        userId: userAId,
        company: "Test Corp",
        title: "[object Object]",
        status: "Applied",
        statusHistory: [],
        interviews: [],
        timelineEvents: [],
      });

      const res = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ company: "Test Corp", title: { $gt: "" }, status: "Applied" });

      // Either rejected with 400 or sanitized to a plain string before storage
      expect([400, 201]).toContain(res.status);
      if (res.status === 201) {
        const calledTitle = jobRepo.createJob.mock.calls[0][0].title;
        expect(typeof calledTitle).toBe("string");
      }
    });

    it("stores XSS attempt in notes field as plain text without server-side execution", async () => {
      const xssPayload = "<script>alert('xss')</script>";
      jobRepo.createJob.mockResolvedValue({
        _id: jobId,
        userId: userAId,
        company: "Test Corp",
        title: "Engineer",
        notes: xssPayload,
        status: "Applied",
        statusHistory: [],
        interviews: [],
        timelineEvents: [],
      });

      const res = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ company: "Test Corp", title: "Engineer", status: "Applied", notes: xssPayload });

      expect(res.status).toBe(201);
      // Server returned the raw string — not executed server-side
      expect(res.body.data.notes).toBe(xssPayload);
    });
  });

  // ─── JWT Authentication Security ──────────────────────────────────────────

  describe("JWT Authentication Security", () => {
    it("returns 401 for an expired JWT", async () => {
      const expiredToken = jwt.sign(
        { userId: userAId, email: "a@test.com", exp: Math.floor(Date.now() / 1000) - 60 },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .get("/api/jobs")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it("returns 401 with INVALID_TOKEN for a malformed JWT", async () => {
      const res = await request(app)
        .get("/api/jobs")
        .set("Authorization", "Bearer this.is.not.a.valid.jwt");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });

    it("returns 401 with INVALID_TOKEN for a JWT signed with the wrong secret", async () => {
      const wrongSecretToken = jwt.sign(
        { userId: userAId, email: "a@test.com" },
        "wrong-secret",
        { expiresIn: "1h" }
      );

      const res = await request(app)
        .get("/api/jobs")
        .set("Authorization", `Bearer ${wrongSecretToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
  });

  // ─── Rate Limiting ────────────────────────────────────────────────────────

  describe("Rate Limiting", () => {
    it("returns 429 when login rate limit is exceeded", async () => {
      authService.loginUser.mockRejectedValue({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });

      // Exhaust the 5-request allowance
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/auth/login")
          .send({ email: "test@test.com", password: "wrong" });
      }

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "wrong" });

      expect(res.status).toBe(429);
    });
  });

  // ─── Cross-User Access Control ────────────────────────────────────────────

  describe("Cross-User Access Control", () => {
    it("returns 403 when user tries to save another user's profile", async () => {
      const res = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ userId: userAId, firstName: "Hacker" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 404 when user tries to access another user's document", async () => {
      // Doc belongs to userA; userB cannot see it via findDocumentByIdAndUser
      docRepo.findDocumentByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/documents/${docId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
