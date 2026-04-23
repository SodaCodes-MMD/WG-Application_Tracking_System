import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobsApi, JOB_STATUSES, JOB_OUTCOMES, STATUS_COLORS, OUTCOME_COLORS } from "./jobs-api.js";

describe("jobs-api", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("JOB_STATUSES", () => {
    it("contains all expected statuses", () => {
      expect(JOB_STATUSES).toContain("Wishlist");
      expect(JOB_STATUSES).toContain("Applied");
      expect(JOB_STATUSES).toContain("Phone Screen");
      expect(JOB_STATUSES).toContain("Interview");
      expect(JOB_STATUSES).toContain("Offer");
      expect(JOB_STATUSES).toContain("Rejected");
      expect(JOB_STATUSES).toContain("Withdrawn");
    });
  });

  describe("JOB_OUTCOMES", () => {
    it("contains all expected outcomes", () => {
      expect(JOB_OUTCOMES).toContain("Pending");
      expect(JOB_OUTCOMES).toContain("Accepted");
      expect(JOB_OUTCOMES).toContain("Rejected");
      expect(JOB_OUTCOMES).toContain("Withdrawn");
      expect(JOB_OUTCOMES).toContain("Ghosted");
    });
  });

  describe("STATUS_COLORS", () => {
    it("has color definitions for all statuses", () => {
      JOB_STATUSES.forEach((status) => {
        expect(STATUS_COLORS[status]).toBeDefined();
        expect(STATUS_COLORS[status].bg).toBeDefined();
        expect(STATUS_COLORS[status].text).toBeDefined();
        expect(STATUS_COLORS[status].border).toBeDefined();
      });
    });
  });

  describe("OUTCOME_COLORS", () => {
    it("has color definitions for all outcomes", () => {
      JOB_OUTCOMES.forEach((outcome) => {
        expect(OUTCOME_COLORS[outcome]).toBeDefined();
        expect(OUTCOME_COLORS[outcome].bg).toBeDefined();
        expect(OUTCOME_COLORS[outcome].text).toBeDefined();
        expect(OUTCOME_COLORS[outcome].border).toBeDefined();
      });
    });
  });

  describe("jobsApi methods", () => {
    const mockResponse = { success: true, data: {} };

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
    });

    it("list fetches all jobs", async () => {
      await jobsApi.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("listArchived fetches archived jobs", async () => {
      await jobsApi.listArchived();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/archived"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("get fetches a single job by ID", async () => {
      await jobsApi.get("job-123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("create posts new job data", async () => {
      const jobData = { company: "Test Corp", title: "Developer" };
      await jobsApi.create(jobData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(jobData),
        })
      );
    });

    it("update patches job data", async () => {
      const updateData = { status: "Interview" };
      await jobsApi.update("job-123", updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
        })
      );
    });

    it("archive marks job as archived", async () => {
      await jobsApi.archive("job-123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123/archive"),
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("restore restores archived job", async () => {
      await jobsApi.restore("job-123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123/restore"),
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("remove deletes a job", async () => {
      await jobsApi.remove("job-123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("addInterview posts interview data", async () => {
      const interviewData = { roundType: "Technical", date: "2024-01-01" };
      await jobsApi.addInterview("job-123", interviewData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123/interviews"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(interviewData),
        })
      );
    });

    it("updateInterview patches interview data", async () => {
      const updateData = { notes: "Great interview" };
      await jobsApi.updateInterview("job-123", "interview-456", updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123/interviews/interview-456"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
        })
      );
    });

    it("removeInterview deletes an interview", async () => {
      await jobsApi.removeInterview("job-123", "interview-456");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123/interviews/interview-456"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("addTimelineEvent posts timeline data", async () => {
      const timelineData = { title: "Applied", eventDate: "2024-01-01" };
      await jobsApi.addTimelineEvent("job-123", timelineData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123/timeline"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(timelineData),
        })
      );
    });

    it("removeTimelineEvent deletes a timeline event", async () => {
      await jobsApi.removeTimelineEvent("job-123", "event-789");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/jobs/job-123/timeline/event-789"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("includes auth token in headers when present", async () => {
      localStorage.setItem("token", "test-token");
      await jobsApi.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("handles 401 by clearing token and redirecting", async () => {
      localStorage.setItem("token", "test-token");
      const mockNavigate = vi.fn();
      window.location = { href: '' };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: "Unauthorized" } }),
      });

      try {
        await jobsApi.list();
      } catch (error) {
        expect(error.message).toBe("Unauthorized");
      }

      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
