import { Input } from "@/app/components/ui/Input";

describe("Input Component", () => {
  it("should accept all required props", () => {
    const input = Input({
      placeholder: "Enter text",
      label: "Username",
    });
    expect(input).toBeDefined();
  });

  it("should have correct displayName", () => {
    expect(Input.displayName).toBe("Input");
  });

  it("should accept error prop", () => {
    const input = Input({
      label: "Email",
      error: "Invalid email",
    });
    expect(input).toBeDefined();
  });

  it("should accept fullWidth prop", () => {
    const input = Input({ fullWidth: true });
    expect(input).toBeDefined();
    
    const inputNoWidth = Input({ fullWidth: false });
    expect(inputNoWidth).toBeDefined();
  });

  it("should accept disabled prop", () => {
    const input = Input({ disabled: true });
    expect(input).toBeDefined();
  });

  it("should accept different input types", () => {
    const types: Array<"text" | "email" | "password" | "number"> = ["text", "email", "password", "number"];
    
    types.forEach((type) => {
      const input = Input({ type });
      expect(input).toBeDefined();
    });
  });

  it("should accept value and onChange", () => {
    const onChange = jest.fn();
    const input = Input({ value: "test", onChange });
    expect(input).toBeDefined();
  });

  it("should accept custom className", () => {
    const input = Input({ className: "custom-input" });
    expect(input).toBeDefined();
  });

  it("should accept required prop", () => {
    const input = Input({ required: true });
    expect(input).toBeDefined();
  });
});
