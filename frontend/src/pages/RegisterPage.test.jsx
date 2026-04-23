import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RegisterPage from "./RegisterPage.jsx";
import * as authService from "../services/auth-service.js";

vi.mock("../services/auth-service.js", () => ({
  registerUser: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders registration form", () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    expect(screen.getByText("Join Hirify")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("calls registerUser with credentials", async () => {
    const user = userEvent.setup();
    authService.registerUser.mockResolvedValue({
      success: true,
      data: { user: { email: "test@example.com" } },
    });
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(authService.registerUser).toHaveBeenCalledWith("test@example.com", "password123!");
  });

  it("navigates to login on successful registration", async () => {
    const user = userEvent.setup();
    authService.registerUser.mockResolvedValue({
      success: true,
      data: { user: { email: "test@example.com" } },
    });
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("displays error message on failed registration", async () => {
    const user = userEvent.setup();
    authService.registerUser.mockResolvedValue({
      success: false,
      error: { message: "Email already exists" },
    });
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText("Email already exists")).toBeInTheDocument();
  });

  it("shows link to login page", () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/sign in/i)).toHaveAttribute("href", "/login");
  });
});
