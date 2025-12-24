import React from "react";
import { Skeleton } from "@/app/components/ui/Skeleton";

describe("Skeleton Component", () => {
  it("should render with default props", () => {
    const skeleton = Skeleton({});
    expect(skeleton).toBeDefined();
  });

  it("should have correct displayName", () => {
    expect(Skeleton.displayName).toBe("Skeleton");
  });

  it("should accept variant prop", () => {
    const variants: Array<"text" | "rectangular" | "circular"> = [
      "text",
      "rectangular",
      "circular",
    ];
    
    variants.forEach((variant) => {
      const skeleton = Skeleton({ variant });
      expect(skeleton).toBeDefined();
    });
  });

  it("should accept custom width and height", () => {
    const skeleton = Skeleton({ width: "200px", height: "100px" });
    expect(skeleton).toBeDefined();
  });

  it("should accept custom className", () => {
    const skeleton = Skeleton({ className: "custom-skeleton" });
    expect(skeleton).toBeDefined();
  });

  it("should accept custom style", () => {
    const skeleton = Skeleton({ style: { margin: "10px" } });
    expect(skeleton).toBeDefined();
  });
});
