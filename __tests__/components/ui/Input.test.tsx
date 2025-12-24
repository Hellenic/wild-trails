import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/app/components/ui/Input";

describe("Input Component", () => {
  it("renders input field", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders with label", () => {
    render(<Input label="Username" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("displays error message", () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("applies error styles when error is present", () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-500");
  });

  it("applies normal styles when no error", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-white/10");
  });

  it("handles value and onChange", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Input value="" onChange={handleChange} />);
    
    const input = screen.getByRole("textbox");
    await user.type(input, "test");
    
    expect(handleChange).toHaveBeenCalled();
  });

  it("applies fullWidth by default", () => {
    render(<Input data-testid="input-wrapper" />);
    const input = screen.getByRole("textbox");
    const wrapper = input.parentElement;
    expect(wrapper).toHaveClass("w-full");
  });

  it("can disable fullWidth", () => {
    render(<Input fullWidth={false} />);
    const input = screen.getByRole("textbox");
    const wrapper = input.parentElement;
    expect(wrapper).not.toHaveClass("w-full");
  });

  it("handles disabled state", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("accepts custom className", () => {
    render(<Input className="custom-input" />);
    expect(screen.getByRole("textbox")).toHaveClass("custom-input");
  });

  it("supports different input types", () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

    rerender(<Input type="password" />);
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
  });

  it("has correct displayName for debugging", () => {
    expect(Input.displayName).toBe("Input");
  });
});
