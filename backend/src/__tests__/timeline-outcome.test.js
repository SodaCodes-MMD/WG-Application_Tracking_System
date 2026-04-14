process.env.JWT_SECRET = "test-jwt-secret-timeline-outcome";

const request = require("supertest");
const app = require("../app").default;
const jwt = require("jsonwebtoken");
const tokenService = require("../services/token-service");

jest.mock("../repositories/job-repository");
const jobRepo = require("../repositories/job-repository");

describe("Timeline and outcome workflow", () => {
  const userId = "aaaa00000000000000000001";
  const jobId = "cccc00000000000000000003";
  const eventId = "eeee00000000000000000005";
  let token;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    token = jwt.sign({ userId, email: "user@example.com" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  });

  it("updates outcome via PATCH /api/jobs/:id", async () => {
    jobRepo.updateJobByIdAndUser.mockResolvedValue({ _id: jobId, userId, outcome: "Accepted", outcomeNotes: "Strong fit" });

    const res = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ outcome: "Accepted", outcomeNotes: "Strong fit" });

    expect(res.status).toBe(200);
    expect(jobRepo.updateJobByIdAndUser).toHaveBeenCalledWith(
      jobId,
      userId,
      expect.objectContaining({ outcome: "Accepted", outcomeNotes: "Strong fit" }),
      null
    );
  });

  it("adds timeline event", async () => {
    jobRepo.addTimelineEvent.mockResolvedValue({ _id: jobId, userId, timelineEvents: [{ _id: eventId, title: "Recruiter follow-up" }] });

    const res = await request(app)
      .post(`/api/jobs/${jobId}/timeline`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Recruiter follow-up", notes: "Sent thank you email" });

    expect(res.status).toBe(201);
    expect(jobRepo.addTimelineEvent).toHaveBeenCalledWith(
      jobId,
      userId,
      expect.objectContaining({ title: "Recruiter follow-up", notes: "Sent thank you email" })
    );
  });

  it("rejects blank timeline title", async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/timeline`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "   " });

    expect(res.status).toBe(400);
    expect(jobRepo.addTimelineEvent).not.toHaveBeenCalled();
  });

  it("deletes timeline event", async () => {
    jobRepo.removeTimelineEvent.mockResolvedValue({ _id: jobId, userId, timelineEvents: [] });

    const res = await request(app)
      .delete(`/api/jobs/${jobId}/timeline/${eventId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(jobRepo.removeTimelineEvent).toHaveBeenCalledWith(jobId, userId, eventId);
  });
});
