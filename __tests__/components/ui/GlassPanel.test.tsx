import React from "react";
import { render, screen } from "@testing-library/react";
import { GlassPanel } from "@/app/components/ui/GlassPanel";

describe("GlassPanel Component", () => {
  it("renders children correctly", () => {
    render(
      <GlassPanel>
        <div>Test Content</div>
      </GlassPanel>
    );
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies dark variant by default", () => {
    render(<GlassPanel data-testid="panel">Dark Panel</GlassPanel>);
    const panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("glass-panel");
  });

  it("applies light variant when specified", () => {
    render(<GlassPanel variant="light" data-testid="panel">Light Panel</GlassPanel>);
    const panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("glass-panel-light");
  });

  it("applies rounded and shadow classes", () => {
    render(<GlassPanel data-testid="panel">Panel</GlassPanel>);
    const panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("rounded-2xl", "shadow-2xl");
  });

  it("accepts custom className", () => {
    render(<GlassPanel className="custom-panel" data-testid="panel">Custom</GlassPanel>);
    const panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("custom-panel");
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<GlassPanel ref={ref}>With Ref</GlassPanel>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("spreads additional props", () => {
    render(
      <GlassPanel data-testid="test-panel" aria-label="Test Panel">
        Panel
      </GlassPanel>
    );
    const panel = screen.getByTestId("test-panel");
    expect(panel).toHaveAttribute("aria-label", "Test Panel");
  });

  it("can be nested", () => {
    render(
      <GlassPanel>
        <GlassPanel variant="light">Nested Panel</GlassPanel>
      </GlassPanel>
    );
    expect(screen.getByText("Nested Panel")).toBeInTheDocument();
  });

  it("has correct displayName for debugging", () => {
    expect(GlassPanel.displayName).toBe("GlassPanel");
  });
});
