process.env.JWT_SECRET = "test-jwt-secret-job-workflow";

const request = require("supertest");
const app = require("../app").default;
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token-service");

jest.mock("../repositories/job-repository");
const jobRepo = require("../repositories/job-repository");

jest.mock("../services/deadline-checker", () => ({
  triggerImmediateNotification: jest.fn(),
  removeDeadlineNotifications: jest.fn(),
}));

const deadlineChecker = require("../services/deadline-checker");

describe("Job Workflow Status History (SCRUM-58)", () => {
  const userId = "aaaa00000000000000000001";
  const jobId = "cccc00000000000000000003";

  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    token = jwt.sign({ userId, email: "user@example.com" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  });

  describe("POST /api/jobs", () => {
    it("seeds statusHistory with default Wishlist when status is omitted", async () => {
      jobRepo.createJob.mockImplementation(async (payload) => ({ _id: jobId, ...payload }));

      const res = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${token}`)
        .send({ company: "Acme Corp", title: "Software Engineer" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(jobRepo.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          status: "Wishlist",
          statusHistory: [
            expect.objectContaining({
              status: "Wishlist",
              changedAt: expect.any(Date),
            }),
          ],
        })
      );
      expect(deadlineChecker.triggerImmediateNotification).not.toHaveBeenCalled();
    });

    it("seeds statusHistory with provided status", async () => {
      jobRepo.createJob.mockImplementation(async (payload) => ({ _id: jobId, ...payload }));

      const res = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${token}`)
        .send({ company: "Acme Corp", title: "Software Engineer", status: "Applied" });

      expect(res.status).toBe(201);
      expect(jobRepo.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "Applied",
          statusHistory: [expect.objectContaining({ status: "Applied", changedAt: expect.any(Date) })],
        })
      );
    });

    it("triggers immediate notification when deadline exists", async () => {
      jobRepo.createJob.mockResolvedValue({
        _id: jobId,
        userId,
        company: "Acme Corp",
        title: "Software Engineer",
        status: "Applied",
        deadline: new Date("2026-05-01").toISOString(),
      });

      const res = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${token}`)
        .send({ company: "Acme Corp", title: "Software Engineer", status: "Applied", deadline: "2026-05-01" });

      expect(res.status).toBe(201);
      expect(deadlineChecker.triggerImmediateNotification).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ _id: jobId })
      );
    });
  });

  describe("PATCH /api/jobs/:id", () => {
    it("adds history entry when status changes", async () => {
      jobRepo.findJobByIdAndUser.mockResolvedValue({ _id: jobId, userId, status: "Wishlist" });
      jobRepo.updateJobByIdAndUser.mockResolvedValue({
        _id: jobId,
        userId,
        status: "Applied",
        statusHistory: [
          { status: "Wishlist", changedAt: "2026-04-01T00:00:00.000Z" },
          { status: "Applied", changedAt: "2026-04-02T00:00:00.000Z" },
        ],
      });

      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Applied" });

      expect(res.status).toBe(200);
      expect(jobRepo.findJobByIdAndUser).toHaveBeenCalledWith(jobId, userId);
      expect(jobRepo.updateJobByIdAndUser).toHaveBeenCalledWith(
        jobId,
        userId,
        expect.objectContaining({ status: "Applied" }),
        expect.objectContaining({ status: "Applied", changedAt: expect.any(Date) })
      );
    });

    it("does not add history entry when status does not change", async () => {
      jobRepo.findJobByIdAndUser.mockResolvedValue({ _id: jobId, userId, status: "Applied" });
      jobRepo.updateJobByIdAndUser.mockResolvedValue({ _id: jobId, userId, status: "Applied" });

      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Applied", notes: "No status change" });

      expect(res.status).toBe(200);
      expect(jobRepo.updateJobByIdAndUser).toHaveBeenCalledWith(
        jobId,
        userId,
        expect.objectContaining({ status: "Applied", notes: "No status change" }),
        null
      );
    });

    it("returns 404 when current job is missing during status update", async () => {
      jobRepo.findJobByIdAndUser.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Interview" });

      expect(res.status).toBe(404);
      expect(jobRepo.updateJobByIdAndUser).not.toHaveBeenCalled();
    });

    it("does not read current job when status is not in payload", async () => {
      jobRepo.updateJobByIdAndUser.mockResolvedValue({ _id: jobId, userId, notes: "Updated notes" });

      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ notes: "Updated notes", unknownField: "ignored" });

      expect(res.status).toBe(200);
      expect(jobRepo.findJobByIdAndUser).not.toHaveBeenCalled();
      expect(jobRepo.updateJobByIdAndUser).toHaveBeenCalledWith(jobId, userId, { notes: "Updated notes" }, null);
    });
  });
});
