import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobForm from "./JobForm.jsx";

describe("JobForm", () => {
  it("renders add job form when no job prop is provided", () => {
    render(<JobForm onSave={() => {}} onClose={() => {}} loading={false} />);
    expect(screen.getByText("Add Job Application")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Acme Corp")).toBeInTheDocument();
  });

  it("renders edit job form when job prop is provided", () => {
    const job = { _id: "1", company: "Test Corp", title: "Developer", status: "Applied" };
    render(<JobForm job={job} onSave={() => {}} onClose={() => {}} loading={false} />);
    expect(screen.getByText("Edit Job")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.some(input => input.value === "Test Corp")).toBe(true);
  });

  it("shows validation errors when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<JobForm onSave={() => {}} onClose={() => {}} loading={false} />);
    await user.click(screen.getByRole("button", { name: /add job/i }));
    expect(await screen.findByText("Company is required")).toBeInTheDocument();
  });

  it("calls onSave with form data when valid", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<JobForm onSave={onSave} onClose={() => {}} loading={false} />);
    await user.type(screen.getByPlaceholderText("e.g. Acme Corp"), "Acme Corp");
    await user.type(screen.getByPlaceholderText("e.g. Software Engineer"), "Software Engineer");
    await user.type(screen.getByPlaceholderText("Min"), "80000");
    await user.click(screen.getByRole("button", { name: /add job/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<JobForm onSave={() => {}} onClose={onClose} loading={false} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows loading state when loading prop is true", () => {
    render(<JobForm onSave={() => {}} onClose={() => {}} loading />);
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("switches salary mode between structured and custom", async () => {
    const user = userEvent.setup();
    render(<JobForm onSave={() => {}} onClose={() => {}} loading={false} />);
    expect(screen.getByPlaceholderText("Min")).toBeInTheDocument();
    await user.click(screen.getByText("Custom text"));
    expect(screen.getByPlaceholderText("e.g. OTE up to $180k")).toBeInTheDocument();
  });
});
