import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationBell from "./NotificationBell.jsx";
import { notificationsApi } from "../services/notifications-api.js";

vi.mock("../services/notifications-api.js", () => ({
  notificationsApi: {
    list: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
  NOTIFICATION_TYPE_LABELS: {
    DEADLINE_3_DAYS: "3 days warning",
    DEADLINE_1_DAY: "1 day warning",
    DEADLINE_TODAY: "Deadline today",
    DEADLINE_OVERDUE: "Overdue",
  },
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("renders the notification bell button", () => {
    notificationsApi.list.mockResolvedValue({ data: { notifications: [], unreadCount: 0 } });
    notificationsApi.getUnreadCount.mockResolvedValue({ data: { count: 0 } });

    render(<NotificationBell />);

    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("shows unread count badge when there are unread notifications", async () => {
    notificationsApi.list.mockResolvedValue({
      data: {
        notifications: [{ _id: "1", message: "Test", type: "DEADLINE_3_DAYS", read: false, createdAt: new Date().toISOString() }],
        unreadCount: 1,
      },
    });
    notificationsApi.getUnreadCount.mockResolvedValue({ data: { count: 1 } });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("opens dropdown when bell is clicked", async () => {
    const user = userEvent.setup();
    notificationsApi.list.mockResolvedValue({ data: { notifications: [], unreadCount: 0 } });
    notificationsApi.getUnreadCount.mockResolvedValue({ data: { count: 0 } });

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));

    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", async () => {
    const user = userEvent.setup();
    notificationsApi.list.mockResolvedValue({ data: { notifications: [], unreadCount: 0 } });
    notificationsApi.getUnreadCount.mockResolvedValue({ data: { count: 0 } });

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));

    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("displays notifications in the dropdown", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      { _id: "1", message: "Deadline approaching", type: "DEADLINE_3_DAYS", read: false, createdAt: new Date().toISOString() },
    ];
    notificationsApi.list.mockResolvedValue({ data: { notifications: mockNotifications, unreadCount: 1 } });
    notificationsApi.getUnreadCount.mockResolvedValue({ data: { count: 1 } });

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText("Deadline approaching")).toBeInTheDocument();
    });
  });

  it("calls markAsRead when unread notification is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      { _id: "1", message: "Test notification", type: "DEADLINE_1_DAY", read: false, createdAt: new Date().toISOString() },
    ];
    notificationsApi.list.mockResolvedValue({ data: { notifications: mockNotifications, unreadCount: 1 } });
    notificationsApi.getUnreadCount.mockResolvedValue({ data: { count: 1 } });
    notificationsApi.markAsRead.mockResolvedValue({});

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText("Test notification")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Test notification"));

    expect(notificationsApi.markAsRead).toHaveBeenCalledWith("1");
  });

  it("calls markAllAsRead when mark all read button is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      { _id: "1", message: "Test 1", type: "DEADLINE_3_DAYS", read: false, createdAt: new Date().toISOString() },
      { _id: "2", message: "Test 2", type: "DEADLINE_1_DAY", read: false, createdAt: new Date().toISOString() },
    ];
    notificationsApi.list.mockResolvedValue({ data: { notifications: mockNotifications, unreadCount: 2 } });
    notificationsApi.getUnreadCount.mockResolvedValue({ data: { count: 2 } });
    notificationsApi.markAllAsRead.mockResolvedValue({});

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText("Mark all read")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Mark all read"));

    expect(notificationsApi.markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it("calls delete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mockNotifications = [
      { _id: "1", message: "Test notification", type: "DEADLINE_3_DAYS", read: true, createdAt: new Date().toISOString() },
    ];
    notificationsApi.list.mockResolvedValue({ data: { notifications: mockNotifications, unreadCount: 0 } });
    notificationsApi.getUnreadCount.mockResolvedValue({ data: { count: 0 } });
    notificationsApi.delete.mockResolvedValue({});

    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText("Test notification")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: /delete notification/i });
    await user.click(deleteButton);

    expect(notificationsApi.delete).toHaveBeenCalledWith("1");
  });
});
