import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "./ConfirmDialog.jsx";

describe("ConfirmDialog", () => {
  it("renders title and message", () => {
    render(
      <ConfirmDialog
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to delete this item?")).toBeInTheDocument();
  });

  it("renders with default confirm label 'Delete'", () => {
    render(
      <ConfirmDialog
        title="Confirm"
        message="Please confirm"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("renders custom confirm label", () => {
    render(
      <ConfirmDialog
        title="Confirm"
        message="Please confirm"
        confirmLabel="Yes, proceed"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("Yes, proceed")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        title="Delete"
        message="Confirm deletion"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );

    await user.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete"
        message="Confirm deletion"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when overlay is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete"
        message="Confirm deletion"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("dialog").parentElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel when dialog content is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete"
        message="Confirm deletion"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByText("Delete"));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
