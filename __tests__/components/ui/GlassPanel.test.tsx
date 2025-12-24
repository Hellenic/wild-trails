import React from "react";
import { GlassPanel, type GlassPanelProps } from "@/app/components/ui/GlassPanel";

describe("GlassPanel Component", () => {
  it("should accept children", () => {
    const panel = GlassPanel({
      children: React.createElement("div", null, "Test Content"),
    });
    expect(panel).toBeDefined();
  });

  it("should have correct displayName", () => {
    expect(GlassPanel.displayName).toBe("GlassPanel");
  });

  it("should accept dark variant", () => {
    const panel = GlassPanel({
      variant: "dark",
      children: "Dark Panel",
    });
    expect(panel).toBeDefined();
  });

  it("should accept light variant", () => {
    const panel = GlassPanel({
      variant: "light",
      children: "Light Panel",
    });
    expect(panel).toBeDefined();
  });

  it("should accept custom className", () => {
    const panel = GlassPanel({
      className: "custom-panel",
      children: "Custom",
    });
    expect(panel).toBeDefined();
  });

  it("should accept additional props", () => {
    const props: GlassPanelProps & { "data-testid"?: string; "aria-label"?: string } = {
      "data-testid": "test-panel",
      "aria-label": "Test Panel",
      children: "Panel",
    };
    const panel = GlassPanel(props);
    expect(panel).toBeDefined();
  });
});
