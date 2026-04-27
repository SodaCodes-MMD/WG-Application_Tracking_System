import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniFlag, SectionSaveButton } from "./MiniFlag.jsx";

describe("MiniFlag", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders the SVG flag", () => {
    render(<MiniFlag mood="saved" />);
    expect(document.querySelector("svg.mini-flag-svg")).toBeInTheDocument();
  });

  it("shows a phrase bubble initially", () => {
    render(<MiniFlag mood="saved" />);
    expect(document.querySelector(".mini-flag-bubble")).toBeInTheDocument();
  });
});

describe("SectionSaveButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders children text", () => {
    render(
      <SectionSaveButton mood="saved" onClick={() => {}}>
        Save Profile
      </SectionSaveButton>
    );
    expect(screen.getByText("Save Profile")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const { container } = render(
      <SectionSaveButton mood="unsaved" onClick={onClick}>
        Save Changes
      </SectionSaveButton>
    );
    const button = container.querySelector("button");
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies btn-saved class when mood is saved", () => {
    render(
      <SectionSaveButton mood="saved" onClick={() => {}}>
        Save
      </SectionSaveButton>
    );
    expect(screen.getByRole("button")).toHaveClass("btn-saved");
  });

  it("applies btn-unsaved class when mood is unsaved", () => {
    render(
      <SectionSaveButton mood="unsaved" onClick={() => {}}>
        Save Changes
      </SectionSaveButton>
    );
    expect(screen.getByRole("button")).toHaveClass("btn-unsaved");
  });
});
