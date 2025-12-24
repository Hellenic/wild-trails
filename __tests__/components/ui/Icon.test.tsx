import React from "react";
import { render, screen } from "@testing-library/react";
import { Icon } from "@/app/components/ui/Icon";

describe("Icon Component", () => {
  it("renders with icon name", () => {
    render(<Icon name="home" />);
    const icon = screen.getByText("home");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("material-symbols-outlined");
  });

  it("applies size variants correctly", () => {
    const { rerender } = render(<Icon name="star" size="sm" />);
    let icon = screen.getByText("star");
    expect(icon).toHaveClass("text-xl");

    rerender(<Icon name="star" size="md" />);
    icon = screen.getByText("star");
    expect(icon).toHaveClass("text-2xl");

    rerender(<Icon name="star" size="lg" />);
    icon = screen.getByText("star");
    expect(icon).toHaveClass("text-4xl");

    rerender(<Icon name="star" size="xl" />);
    icon = screen.getByText("star");
    expect(icon).toHaveClass("text-5xl");
  });

  it("applies medium size by default", () => {
    render(<Icon name="settings" />);
    expect(screen.getByText("settings")).toHaveClass("text-2xl");
  });

  it("accepts custom className", () => {
    render(<Icon name="check" className="text-green-500" />);
    const icon = screen.getByText("check");
    expect(icon).toHaveClass("text-green-500");
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Icon name="info" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("spreads additional props", () => {
    render(<Icon name="warning" data-testid="warning-icon" aria-label="Warning" />);
    const icon = screen.getByTestId("warning-icon");
    expect(icon).toHaveAttribute("aria-label", "Warning");
  });

  it("renders different icon names", () => {
    const { rerender } = render(<Icon name="delete" />);
    expect(screen.getByText("delete")).toBeInTheDocument();

    rerender(<Icon name="add" />);
    expect(screen.getByText("add")).toBeInTheDocument();

    rerender(<Icon name="close" />);
    expect(screen.getByText("close")).toBeInTheDocument();
  });

  it("has correct displayName for debugging", () => {
    expect(Icon.displayName).toBe("Icon");
  });
});
