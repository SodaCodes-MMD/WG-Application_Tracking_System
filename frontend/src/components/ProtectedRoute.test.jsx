import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { renderWithRouter } from "../test/test-utils.jsx";

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", () => {
    renderWithRouter(
      <Routes>
        <Route path="/protected" element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: "/protected" },
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    localStorage.setItem("token", "test-token");

    renderWithRouter(<ProtectedRoute><div>Protected Content</div></ProtectedRoute>);

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
