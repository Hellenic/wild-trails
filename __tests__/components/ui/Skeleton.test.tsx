import React from "react";
import { render, screen } from "@testing-library/react";
import { Skeleton, GameCardSkeleton } from "@/app/components/ui/Skeleton";

describe("Skeleton Component", () => {
  it("renders correctly", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toBeInTheDocument();
  });

  it("applies rectangular variant by default", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("rounded-lg");
  });

  it("applies text variant styles", () => {
    render(<Skeleton variant="text" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("h-4", "rounded");
  });

  it("applies circular variant styles", () => {
    render(<Skeleton variant="circular" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("rounded-full");
  });

  it("applies custom width and height", () => {
    render(<Skeleton width="200px" height="100px" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveStyle({ width: "200px", height: "100px" });
  });

  it("has animate-pulse class", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("accepts custom className", () => {
    render(<Skeleton className="custom-skeleton" data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("custom-skeleton");
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has correct displayName for debugging", () => {
    expect(Skeleton.displayName).toBe("Skeleton");
  });
});

describe("GameCardSkeleton Component", () => {
  it("renders game card skeleton structure", () => {
    const { container } = render(<GameCardSkeleton />);
    const panel = container.querySelector(".glass-panel");
    expect(panel).toBeInTheDocument();
  });

  it("contains multiple skeleton elements", () => {
    const { container } = render(<GameCardSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(1);
  });
});
