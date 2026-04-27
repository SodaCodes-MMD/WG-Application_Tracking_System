// S3-022: tests for GET /api/health deployment health-check endpoint
const request = require("supertest");
const app = require("../app").default;

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns timestamp and uptime fields", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    // timestamp should be a valid ISO 8601 string
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });
});
