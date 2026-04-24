import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isStrongPassword,
  getToken,
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
} from "./auth-service.js";

describe("auth-service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("isStrongPassword", () => {
    it("returns true for password with 8+ chars and special character", () => {
      expect(isStrongPassword("password1!")).toBe(true);
    });

    it("returns false for password without special character", () => {
      expect(isStrongPassword("password123")).toBe(false);
    });

    it("returns false for password shorter than 8 characters", () => {
      expect(isStrongPassword("Pass1!")).toBe(false);
    });

    it("returns true for password with various special characters", () => {
      expect(isStrongPassword("test@pass")).toBe(true);
      expect(isStrongPassword("test#pass")).toBe(true);
      expect(isStrongPassword("test$pass")).toBe(true);
      expect(isStrongPassword("test%pass")).toBe(true);
    });
  });

  describe("getToken", () => {
    it("returns token from localStorage", () => {
      localStorage.setItem("token", "test-token-123");
      expect(getToken()).toBe("test-token-123");
    });

    it("returns null when no token exists", () => {
      expect(getToken()).toBeNull();
    });
  });

  describe("registerUser", () => {
    it("returns success response on successful registration", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { user: { email: "test@example.com" } } }),
      });

      const result = await registerUser("test@example.com", "password123!");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/auth/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123!" }),
        })
      );
    });

    it("returns error on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await registerUser("test@example.com", "password123!");

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("NETWORK_ERROR");
    });
  });

  describe("loginUser", () => {
    it("returns success response on successful login", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { token: "jwt-token", user: { email: "test@example.com" } } }),
      });

      const result = await loginUser("test@example.com", "password123!");

      expect(result.success).toBe(true);
      expect(result.data.token).toBe("jwt-token");
    });

    it("returns error on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await loginUser("test@example.com", "password123!");

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("NETWORK_ERROR");
    });
  });

  describe("logoutUser", () => {
    it("returns success when no token exists", async () => {
      const result = await logoutUser();
      expect(result.success).toBe(true);
    });

    it("calls logout endpoint with token", async () => {
      localStorage.setItem("token", "test-token");
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const result = await logoutUser();

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/auth/logout",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("returns error on network failure", async () => {
      localStorage.setItem("token", "test-token");
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await logoutUser();

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("NETWORK_ERROR");
    });
  });

  describe("changePassword", () => {
    it("calls change password endpoint with correct payload", async () => {
      localStorage.setItem("token", "test-token");
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const result = await changePassword("oldPass1!", "newPass1!");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/auth/change-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ currentPassword: "oldPass1!", newPassword: "newPass1!" }),
        })
      );
    });

    it("returns error on network failure", async () => {
      localStorage.setItem("token", "test-token");
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await changePassword("oldPass1!", "newPass1!");

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("NETWORK_ERROR");
    });
  });
});
