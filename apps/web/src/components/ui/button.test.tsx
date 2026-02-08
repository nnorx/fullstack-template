import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { Button } from "./button";

describe("Button", () => {
	it("renders with text", () => {
		render(<Button>Click me</Button>);
		expect(
			screen.getByRole("button", { name: "Click me" }),
		).toBeInTheDocument();
	});

	it("handles click events", async () => {
		const handleClick = vi.fn();
		const { user } = render(<Button onClick={handleClick}>Click me</Button>);

		await user.click(screen.getByRole("button"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("renders different variants", () => {
		const { rerender } = render(<Button variant="default">Default</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-primary");

		rerender(<Button variant="destructive">Destructive</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-destructive");

		rerender(<Button variant="outline">Outline</Button>);
		expect(screen.getByRole("button")).toHaveClass("border");

		rerender(<Button variant="ghost">Ghost</Button>);
		expect(screen.getByRole("button")).toHaveClass("hover:bg-accent");
	});

	it("renders different sizes", () => {
		const { rerender } = render(<Button size="default">Default</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-9");

		rerender(<Button size="sm">Small</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-8");

		rerender(<Button size="lg">Large</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-10");

		rerender(<Button size="icon">Icon</Button>);
		expect(screen.getByRole("button")).toHaveClass("size-9");
	});

	it("is disabled when disabled prop is passed", () => {
		render(<Button disabled>Disabled</Button>);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("renders as a child component when asChild is true", () => {
		render(
			<Button asChild>
				<a href="/test">Link Button</a>
			</Button>,
		);
		expect(
			screen.getByRole("link", { name: "Link Button" }),
		).toBeInTheDocument();
	});
});
