import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "./LoginPage.jsx";
import * as authService from "../services/auth-service.js";

vi.mock("../services/auth-service.js", () => ({
  loginUser: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders login form", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("calls loginUser with credentials", async () => {
    const user = userEvent.setup();
    authService.loginUser.mockResolvedValue({
      success: true,
      data: { token: "test-token", user: { email: "test@example.com" } },
    });
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(authService.loginUser).toHaveBeenCalledWith("test@example.com", "password123!");
  });

  it("stores token and user on successful login", async () => {
    const user = userEvent.setup();
    authService.loginUser.mockResolvedValue({
      success: true,
      data: { token: "test-token", user: { email: "test@example.com" } },
    });
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(localStorage.getItem("token")).toBe("test-token");
  });

  it("navigates to home on successful login", async () => {
    const user = userEvent.setup();
    authService.loginUser.mockResolvedValue({
      success: true,
      data: { token: "test-token", user: { email: "test@example.com" } },
    });
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("displays error message on failed login", async () => {
    const user = userEvent.setup();
    authService.loginUser.mockResolvedValue({
      success: false,
      error: { message: "Invalid credentials" },
    });
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });

  it("shows link to forgot password page", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/forgot your password/i)).toHaveAttribute("href", "/forgot-password");
  });

  it("shows link to register page", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/create one/i)).toHaveAttribute("href", "/register");
  });
});
