import { Icon, type IconProps } from "@/app/components/ui/Icon";

describe("Icon Component", () => {
  it("should accept icon name", () => {
    const icon = Icon({ name: "home" });
    expect(icon).toBeDefined();
  });

  it("should have correct displayName", () => {
    expect(Icon.displayName).toBe("Icon");
  });

  it("should accept size variants", () => {
    const sizes: Array<"sm" | "md" | "lg" | "xl"> = ["sm", "md", "lg", "xl"];
    
    sizes.forEach((size) => {
      const icon = Icon({ name: "star", size });
      expect(icon).toBeDefined();
    });
  });

  it("should accept fill prop", () => {
    const icon = Icon({ name: "star", fill: true });
    expect(icon).toBeDefined();
  });

  it("should accept custom className", () => {
    const icon = Icon({ name: "check", className: "text-green-500" });
    expect(icon).toBeDefined();
  });

  it("should accept different icon names", () => {
    const names = ["delete", "add", "close", "settings", "info"];
    
    names.forEach((name) => {
      const icon = Icon({ name });
      expect(icon).toBeDefined();
    });
  });

  it("should accept additional props", () => {
    const props: IconProps & { "data-testid"?: string; "aria-label"?: string } = {
      name: "warning",
      "data-testid": "warning-icon",
      "aria-label": "Warning",
    };
    const icon = Icon(props);
    expect(icon).toBeDefined();
  });
});
