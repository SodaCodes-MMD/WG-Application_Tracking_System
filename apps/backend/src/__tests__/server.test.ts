import request from "supertest";
import app from "../index";

describe("Backend API", () => {
  it("should start successfully", () => {
    expect(app).toBeDefined();
  });

  it("should respond to health check", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("should respond to root endpoint", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.message).toContain("ATS Backend API");
  });
});
