import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

// Component that throws an error
function ThrowError({ message }: { message: string }): never {
	throw new Error(message);
}

// Suppress console.error for expected errors in tests
const suppressConsoleError = () => {
	const spy = vi.spyOn(console, "error").mockImplementation(() => {});
	return () => spy.mockRestore();
};

describe("ErrorBoundary", () => {
	it("renders children when there is no error", () => {
		render(
			<ErrorBoundary>
				<div>Hello World</div>
			</ErrorBoundary>,
		);

		expect(screen.getByText("Hello World")).toBeInTheDocument();
	});

	it("renders default fallback UI when child throws", () => {
		const restore = suppressConsoleError();

		render(
			<ErrorBoundary>
				<ThrowError message="Test error" />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(
			screen.getByText(/An unexpected error occurred/),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Refresh Page" }),
		).toBeInTheDocument();

		restore();
	});

	it("renders custom fallback when provided", () => {
		const restore = suppressConsoleError();

		render(
			<ErrorBoundary fallback={<div>Custom error message</div>}>
				<ThrowError message="Test error" />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Custom error message")).toBeInTheDocument();
		expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();

		restore();
	});

	it("logs error to console", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(
			<ErrorBoundary>
				<ThrowError message="Logged error" />
			</ErrorBoundary>,
		);

		expect(consoleSpy).toHaveBeenCalledWith(
			"ErrorBoundary caught an error:",
			expect.any(Error),
			expect.any(Object),
		);

		consoleSpy.mockRestore();
	});
});
