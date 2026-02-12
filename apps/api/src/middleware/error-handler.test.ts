import { HTTPException } from "hono/http-exception";
import { AppError } from "../lib/errors.ts";
import { createTestApp, errorBody } from "../test/helpers.ts";

describe("errorHandler", () => {
	it("handles AppError with correct status and structured response", async () => {
		const app = createTestApp().get("/test", () => {
			throw AppError.badRequest("Invalid input", { field: "email" });
		});

		const res = await app.request("/test");
		const body = await errorBody(res);

		expect(res.status).toBe(400);
		expect(body).toMatchObject({
			error: {
				code: "BAD_REQUEST",
				message: "Invalid input",
				details: { field: "email" },
			},
		});
	});

	it("handles AppError.unauthorized with 401", async () => {
		const app = createTestApp().get("/test", () => {
			throw AppError.unauthorized();
		});

		const res = await app.request("/test");
		const body = await errorBody(res);

		expect(res.status).toBe(401);
		expect(body.error.code).toBe("UNAUTHORIZED");
		expect(body.error.message).toBe("Authentication required");
	});

	it("handles AppError.forbidden with 403", async () => {
		const app = createTestApp().get("/test", () => {
			throw AppError.forbidden("Admin only");
		});

		const res = await app.request("/test");
		const body = await errorBody(res);

		expect(res.status).toBe(403);
		expect(body.error.code).toBe("FORBIDDEN");
		expect(body.error.message).toBe("Admin only");
	});

	it("handles AppError.notFound with 404", async () => {
		const app = createTestApp().get("/test", () => {
			throw AppError.notFound("User not found");
		});

		const res = await app.request("/test");
		const body = await errorBody(res);

		expect(res.status).toBe(404);
		expect(body.error.code).toBe("NOT_FOUND");
		expect(body.error.message).toBe("User not found");
	});

	it("handles Hono HTTPException", async () => {
		const app = createTestApp().get("/test", () => {
			throw new HTTPException(503, { message: "Service unavailable" });
		});

		const res = await app.request("/test");
		const body = await errorBody(res);

		expect(res.status).toBe(503);
		expect(body.error.code).toBe("HTTP_EXCEPTION");
		expect(body.error.message).toBe("Service unavailable");
	});

	it("handles unknown errors with 500 and hides internals", async () => {
		const app = createTestApp().get("/test", () => {
			throw new Error("database password leaked");
		});

		const res = await app.request("/test");
		const body = await errorBody(res);

		expect(res.status).toBe(500);
		expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
		// Generic message returned — the original error text is never in `message`
		expect(body.error.message).toBe("Internal server error");
		expect(body.error.message).not.toContain("database password leaked");
	});

	it("includes stack trace in non-production", async () => {
		const app = createTestApp().get("/test", () => {
			throw AppError.badRequest("test");
		});

		const res = await app.request("/test");
		const body = await errorBody(res);

		// NODE_ENV is "test" in vitest config, so stack should be present
		expect(body.error.stack).toBeDefined();
	});
});

describe("notFoundHandler", () => {
	it("returns 404 with structured response for unknown routes", async () => {
		const app = createTestApp();

		const res = await app.request("/api/nonexistent");
		const body = await errorBody(res);

		expect(res.status).toBe(404);
		expect(body.error.code).toBe("NOT_FOUND");
		expect(body.error.message).toContain("GET");
		expect(body.error.message).toContain("/api/nonexistent");
	});

	it("includes HTTP method in not-found message", async () => {
		const app = createTestApp();

		const res = await app.request("/api/nonexistent", { method: "POST" });
		const body = await errorBody(res);

		expect(res.status).toBe(404);
		expect(body.error.message).toContain("POST");
	});
});
