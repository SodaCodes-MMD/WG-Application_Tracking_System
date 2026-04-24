import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./SettingsPage.jsx";
import * as authService from "../services/auth-service.js";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { renderWithRouter } from "../test/test-utils.jsx";

vi.mock("../services/auth-service.js", () => ({
  isStrongPassword: vi.fn(),
  changePassword: vi.fn(),
}));

const mockThemeContext = {
  theme: "light",
  toggleTheme: vi.fn(),
};

const renderSettingsPage = (ui) => {
  return renderWithRouter(
    <ThemeContext.Provider value={mockThemeContext}>
      {ui}
    </ThemeContext.Provider>
  );
};

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders settings page with email display", () => {
    localStorage.setItem("user", JSON.stringify({ email: "test@example.com" }));
    renderSettingsPage(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders change password form", () => {
    renderSettingsPage(<SettingsPage />);
    expect(screen.getByText("Change password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("renders theme toggle buttons", () => {
    renderSettingsPage(<SettingsPage />);
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("renders danger zone with delete account button", () => {
    renderSettingsPage(<SettingsPage />);
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
  });

  it("shows validation error when current password is missing", async () => {
    const user = userEvent.setup();
    renderSettingsPage(<SettingsPage />);
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByText("Current password is required")).toBeInTheDocument();
  });

  it("calls changePassword with correct credentials", async () => {
    const user = userEvent.setup();
    authService.isStrongPassword.mockReturnValue(true);
    authService.changePassword.mockResolvedValue({ success: true });

    renderSettingsPage(<SettingsPage />);

    await user.type(screen.getByLabelText("Current password"), "oldPass1!");
    await user.type(screen.getByLabelText("New password"), "newPass1!");
    await user.type(screen.getByLabelText("Confirm new password"), "newPass1!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(authService.changePassword).toHaveBeenCalledWith("oldPass1!", "newPass1!");
  });

  it("shows success message on password change", async () => {
    const user = userEvent.setup();
    authService.isStrongPassword.mockReturnValue(true);
    authService.changePassword.mockResolvedValue({ success: true });

    renderSettingsPage(<SettingsPage />);

    await user.type(screen.getByLabelText("Current password"), "oldPass1!");
    await user.type(screen.getByLabelText("New password"), "newPass1!");
    await user.type(screen.getByLabelText("Confirm new password"), "newPass1!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText("Password changed successfully.")).toBeInTheDocument();
  });

  it("shows delete account modal when button is clicked", async () => {
    const user = userEvent.setup();
    renderSettingsPage(<SettingsPage />);
    await user.click(screen.getByRole("button", { name: /delete account/i }));
    expect(screen.getByText("Delete your account?")).toBeInTheDocument();
  });

  it("closes delete account modal when cancel is clicked", async () => {
    const user = userEvent.setup();
    renderSettingsPage(<SettingsPage />);
    await user.click(screen.getByRole("button", { name: /delete account/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByText("Delete your account?")).not.toBeInTheDocument();
  });
});
