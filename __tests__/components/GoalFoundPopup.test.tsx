import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalFoundPopup } from "@/app/game/[id]/play/components/GoalFoundPopup";
import { playGoalFound, triggerHaptic } from "@/lib/audio/sounds";

// Mock audio functions
jest.mock("@/lib/audio/sounds", () => ({
  playGoalFound: jest.fn().mockResolvedValue(undefined),
  triggerHaptic: jest.fn(),
}));

const mockPlayGoalFound = playGoalFound as jest.Mock;
const mockTriggerHaptic = triggerHaptic as jest.Mock;

describe("GoalFoundPopup", () => {
  const defaultProps = {
    onClose: jest.fn(),
    content: "You found the treasure!",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders congratulations message", () => {
    render(<GoalFoundPopup {...defaultProps} />);

    expect(screen.getByText("Congratulations!")).toBeInTheDocument();
    expect(screen.getByText("You've reached the goal!")).toBeInTheDocument();
  });

  it("renders the content in quotes", () => {
    render(<GoalFoundPopup {...defaultProps} />);

    expect(screen.getByText(/You found the treasure!/)).toBeInTheDocument();
  });

  it("renders View Results button", () => {
    render(<GoalFoundPopup {...defaultProps} />);

    expect(screen.getByRole("button", { name: /view results/i })).toBeInTheDocument();
  });

  it("calls onClose when View Results button is clicked", async () => {
    const onClose = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<GoalFoundPopup onClose={onClose} content="Test" />);

    await user.click(screen.getByRole("button", { name: /view results/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("shows loading state while onClose is processing", async () => {
    // Create a promise that we can control
    let resolveOnClose: () => void;
    const onClose = jest.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveOnClose = resolve;
      });
    });

    const user = userEvent.setup();

    render(<GoalFoundPopup onClose={onClose} content="Test" />);

    // Click the button
    await user.click(screen.getByRole("button", { name: /view results/i }));

    // Button should now show loading state
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    // Button should be disabled during loading
    expect(screen.getByRole("button")).toBeDisabled();

    // Resolve the promise
    resolveOnClose!();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("disables button during loading to prevent double-clicks", async () => {
    let resolveOnClose: () => void;
    const onClose = jest.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveOnClose = resolve;
      });
    });

    const user = userEvent.setup();

    render(<GoalFoundPopup onClose={onClose} content="Test" />);

    // Click the button
    await user.click(screen.getByRole("button", { name: /view results/i }));

    // Try clicking again while loading
    await user.click(screen.getByRole("button"));

    // Should still only have been called once
    expect(onClose).toHaveBeenCalledTimes(1);

    // Cleanup
    resolveOnClose!();
  });

  it("handles sync onClose function", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<GoalFoundPopup onClose={onClose} content="Test" />);

    await user.click(screen.getByRole("button", { name: /view results/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("resets loading state on error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const onClose = jest.fn().mockRejectedValue(new Error("Failed"));
    const user = userEvent.setup();

    render(<GoalFoundPopup onClose={onClose} content="Test" />);

    await user.click(screen.getByRole("button", { name: /view results/i }));

    // Wait for error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error completing game:",
        expect.any(Error)
      );
    });

    // Button should be enabled again after error
    await waitFor(() => {
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("plays sound and haptic on mount", () => {
    render(<GoalFoundPopup {...defaultProps} />);

    expect(mockPlayGoalFound).toHaveBeenCalled();
    expect(mockTriggerHaptic).toHaveBeenCalledWith([200, 100, 200, 100, 400]);
  });
});

