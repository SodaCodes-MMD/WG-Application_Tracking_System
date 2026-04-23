import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobForm from "./JobForm.jsx";

describe("JobForm", () => {
  it("renders add job form when no job prop is provided", () => {
    render(<JobForm onSave={() => {}} onClose={() => {}} loading={false} />);

    expect(screen.getByText("Add Job Application")).toBeInTheDocument();
    expect(screen.getByLabelText("Company")).toBeInTheDocument();
    expect(screen.getByLabelText("Job Title")).toBeInTheDocument();
  });

  it("renders edit job form when job prop is provided", () => {
    const job = {
      _id: "1",
      company: "Test Corp",
      title: "Developer",
      status: "Applied",
      location: "Remote",
    };

    render(<JobForm job={job} onSave={() => {}} onClose={() => {}} loading={false} />);

    expect(screen.getByText("Edit Job")).toBeInTheDocument();
    expect(screen.getByLabelText("Company")).toHaveValue("Test Corp");
    expect(screen.getByLabelText("Job Title")).toHaveValue("Developer");
  });

  it("shows validation errors when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<JobForm onSave={() => {}} onClose={() => {}} loading={false} />);

    await user.click(screen.getByRole("button", { name: /add job/i }));

    expect(await screen.findByText("Company is required")).toBeInTheDocument();
    expect(screen.getByText("Job title is required")).toBeInTheDocument();
  });

  it("calls onSave with form data when valid", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<JobForm onSave={onSave} onClose={() => {}} loading={false} />);

    await user.type(screen.getByLabelText("Company"), "Acme Corp");
    await user.type(screen.getByLabelText("Job Title"), "Software Engineer");
    await user.click(screen.getByRole("button", { name: /add job/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        company: "Acme Corp",
        title: "Software Engineer",
        status: "Wishlist",
      })
    );
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

  it("validates structured salary range", async () => {
    const user = userEvent.setup();
    render(<JobForm onSave={() => {}} onClose={() => {}} loading={false} />);

    await user.type(screen.getByLabelText("Company"), "Test Corp");
    await user.type(screen.getByLabelText("Job Title"), "Developer");
    await user.clear(screen.getByPlaceholderText("Min"));
    await user.clear(screen.getByPlaceholderText("Max"));
    await user.click(screen.getByRole("button", { name: /add job/i }));

    expect(await screen.findByText("Enter at least min or max salary")).toBeInTheDocument();
  });

  it("shows error when min salary exceeds max", async () => {
    const user = userEvent.setup();
    render(<JobForm onSave={() => {}} onClose={() => {}} loading={false} />);

    await user.type(screen.getByLabelText("Company"), "Test Corp");
    await user.type(screen.getByLabelText("Job Title"), "Developer");
    await user.type(screen.getByPlaceholderText("Min"), "100000");
    await user.type(screen.getByPlaceholderText("Max"), "50000");
    await user.click(screen.getByRole("button", { name: /add job/i }));

    expect(await screen.findByText("Min salary cannot exceed max salary")).toBeInTheDocument();
  });

  it("switches salary mode between structured and custom", async () => {
    const user = userEvent.setup();
    render(<JobForm onSave={() => {}} onClose={() => {}} loading={false} />);

    expect(screen.getByPlaceholderText("Min")).toBeInTheDocument();

    await user.click(screen.getByText("Custom text"));

    expect(screen.getByPlaceholderText("e.g. OTE up to $180k")).toBeInTheDocument();
  });
});
