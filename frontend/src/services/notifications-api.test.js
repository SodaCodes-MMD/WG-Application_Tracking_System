import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationsApi, NOTIFICATION_TYPE_LABELS } from "./notifications-api.js";

describe("notifications-api", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("NOTIFICATION_TYPE_LABELS", () => {
    it("contains labels for all notification types", () => {
      expect(NOTIFICATION_TYPE_LABELS.DEADLINE_3_DAYS).toBe("3 days warning");
      expect(NOTIFICATION_TYPE_LABELS.DEADLINE_1_DAY).toBe("1 day warning");
      expect(NOTIFICATION_TYPE_LABELS.DEADLINE_TODAY).toBe("Deadline today");
      expect(NOTIFICATION_TYPE_LABELS.DEADLINE_OVERDUE).toBe("Overdue");
    });
  });

  describe("notificationsApi methods", () => {
    const mockResponse = { success: true, data: {} };

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
    });

    it("list fetches notifications with default limit", async () => {
      await notificationsApi.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications?limit=50"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("list fetches notifications with custom limit", async () => {
      await notificationsApi.list(20);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications?limit=20"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("getUnreadCount fetches unread count", async () => {
      await notificationsApi.getUnreadCount();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/unread-count"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("markAsRead marks notification as read", async () => {
      await notificationsApi.markAsRead("notif-123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/notif-123/read"),
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("markAllAsRead marks all notifications as read", async () => {
      await notificationsApi.markAllAsRead();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/read-all"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("delete removes a notification", async () => {
      await notificationsApi.delete("notif-123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/notif-123"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("includes auth token in headers when present", async () => {
      localStorage.setItem("token", "test-token");
      await notificationsApi.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("throws error on failed request", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: "Server error" } }),
      });

      await expect(notificationsApi.list()).rejects.toThrow("Server error");
    });
  });
});
