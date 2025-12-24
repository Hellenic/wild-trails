import React from "react";
import { Button } from "@/app/components/ui/Button";

describe("Button Component", () => {
  it("should accept all required props", () => {
    const button = Button({
      children: "Click me",
      variant: "primary",
      size: "md",
      fullWidth: false,
    });
    expect(button).toBeDefined();
  });

  it("should have correct displayName", () => {
    expect(Button.displayName).toBe("Button");
  });

  it("should accept different variants", () => {
    const variants: Array<"primary" | "secondary" | "ghost" | "outline"> = [
      "primary",
      "secondary",
      "ghost",
      "outline",
    ];
    
    variants.forEach((variant) => {
      const button = Button({ children: "Test", variant });
      expect(button).toBeDefined();
    });
  });

  it("should accept different sizes", () => {
    const sizes: Array<"sm" | "md" | "lg"> = ["sm", "md", "lg"];
    
    sizes.forEach((size) => {
      const button = Button({ children: "Test", size });
      expect(button).toBeDefined();
    });
  });

  it("should accept fullWidth prop", () => {
    const button = Button({ children: "Test", fullWidth: true });
    expect(button).toBeDefined();
  });

  it("should accept disabled prop", () => {
    const button = Button({ children: "Test", disabled: true });
    expect(button).toBeDefined();
  });

  it("should accept custom className", () => {
    const button = Button({ children: "Test", className: "custom-class" });
    expect(button).toBeDefined();
  });

  it("should accept onClick handler", () => {
    const onClick = jest.fn();
    const button = Button({ children: "Test", onClick });
    expect(button).toBeDefined();
  });
});
