import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App Component", () => {
  it("renders the ATS header", () => {
    render(<App />);
    const heading = screen.getByText("ATS for Candidates");
    expect(heading).toBeDefined();
  });

  it("displays the application subtitle", () => {
    render(<App />);
    const subtitle = screen.getByText("Application Tracking System");
    expect(subtitle).toBeDefined();
  });

  it("renders a button with count", () => {
    render(<App />);
    const button = screen.getByRole("button", { name: /Count:/i });
    expect(button).toBeDefined();
  });
});
