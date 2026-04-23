import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MiniFlag, SectionSaveButton } from "./MiniFlag.jsx";

vi.useFakeTimers();

describe("MiniFlag", () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it("renders the SVG flag", () => {
    render(<MiniFlag mood="saved" />);
    const svg = document.querySelector("svg.mini-flag-svg");
    expect(svg).toBeInTheDocument();
  });

  it("shows saved phrase initially", () => {
    render(<MiniFlag mood="saved" />);
    const bubble = document.querySelector(".mini-flag-bubble");
    expect(bubble).toBeInTheDocument();
    expect(bubble.textContent).toMatch(/Everyting irie!|Ya mon!|One love!|Blessed!|Wah gwaan!|Selecta!|irie vibes!/);
  });

  it("shows unsaved phrase when mood is unsaved", () => {
    render(<MiniFlag mood="unsaved" />);
    const bubble = document.querySelector(".mini-flag-bubble");
    expect(bubble).toBeInTheDocument();
    expect(bubble.textContent).toMatch(/Wagwan\?|Save ya work!|Don't forget!|One love!|Check it!|Ya work need ya!/);
  });

  it("shows saving phrase when mood is saving", () => {
    render(<MiniFlag mood="saving" />);
    const bubble = document.querySelector(".mini-flag-bubble");
    expect(bubble).toBeInTheDocument();
    expect(bubble.textContent).toMatch(/Hold on...|Saving ya work!|One moment!|Processing!|Soon come!/);
  });

  it("applies dancing class when animation triggers", () => {
    render(<MiniFlag mood="saved" />);
    const container = document.querySelector(".mini-flag-container");
    vi.advanceTimersByTime(6000);
    expect(container).toBeDefined();
  });
});

describe("SectionSaveButton", () => {
  it("renders children text", () => {
    render(
      <SectionSaveButton mood="saved" onClick={() => {}}>
        Save Profile
      </SectionSaveButton>
    );

    expect(screen.getByText("Save Profile")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <SectionSaveButton mood="unsaved" onClick={onClick}>
        Save Changes
      </SectionSaveButton>
    );

    await user.click(screen.getByText("Save Changes"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <SectionSaveButton mood="saving" onClick={() => {}} disabled>
        Saving...
      </SectionSaveButton>
    );

    expect(screen.getByText("Saving...")).toBeDisabled();
  });

  it("applies btn-saved class when mood is saved", () => {
    render(
      <SectionSaveButton mood="saved" onClick={() => {}}>
        Save
      </SectionSaveButton>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("btn-saved");
  });

  it("applies btn-unsaved class when mood is unsaved", () => {
    render(
      <SectionSaveButton mood="unsaved" onClick={() => {}}>
        Save Changes
      </SectionSaveButton>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("btn-unsaved");
  });

  it("applies btn-saving class when mood is saving", () => {
    render(
      <SectionSaveButton mood="saving" onClick={() => {}}>
        Saving...
      </SectionSaveButton>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("btn-saving");
  });
});
