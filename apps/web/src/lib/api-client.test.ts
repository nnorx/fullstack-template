import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";

/**
 * Tests for the error middleware used by the API client.
 *
 * We mirror the middleware's onResponse logic here so we can test it
 * in isolation without going through the full openapi-fetch client.
 */

/** Re-create the middleware's onResponse logic for unit testing. */
async function handleResponse(response: Response): Promise<void> {
	if (response.ok) return;

	const body = await response
		.clone()
		.json()
		.catch(() => null);

	const isErrorEnvelope =
		body &&
		typeof body === "object" &&
		"error" in body &&
		body.error &&
		typeof body.error === "object" &&
		"code" in body.error &&
		"message" in body.error &&
		typeof body.error.code === "string" &&
		typeof body.error.message === "string";

	if (!isErrorEnvelope) return;

	throw ApiError.fromResponse(response.status, body);
}

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), { status });
}

describe("API client error middleware", () => {
	it("does nothing for successful responses", async () => {
		const res = jsonResponse(200, { status: "healthy" });

		await expect(handleResponse(res)).resolves.toBeUndefined();
	});

	it("throws ApiError when body matches the error envelope", async () => {
		const res = jsonResponse(422, {
			error: {
				code: "VALIDATION_ERROR",
				message: "Request validation failed",
				details: { fieldErrors: { email: ["Required"] } },
			},
		});

		try {
			await handleResponse(res);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ApiError);
			const apiErr = err as ApiError;
			expect(apiErr.status).toBe(422);
			expect(apiErr.code).toBe("VALIDATION_ERROR");
			expect(apiErr.message).toBe("Request validation failed");
			expect(apiErr.details).toEqual({
				fieldErrors: { email: ["Required"] },
			});
		}
	});

	it("throws ApiError on 500 with error envelope", async () => {
		const res = jsonResponse(500, {
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Internal server error",
			},
		});

		try {
			await handleResponse(res);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ApiError);
			const apiErr = err as ApiError;
			expect(apiErr.status).toBe(500);
			expect(apiErr.code).toBe("INTERNAL_SERVER_ERROR");
		}
	});

	it("passes through domain responses that don't match the error envelope", async () => {
		// e.g. GET /api/health returns 503 with { status, timestamp, error }
		// — not the { error: { code, message } } envelope
		const res = jsonResponse(503, {
			status: "unhealthy",
			timestamp: "2026-01-01T00:00:00Z",
			error: "Database connection failed",
		});

		// Should NOT throw — let openapi-fetch return it as typed `error` data
		await expect(handleResponse(res)).resolves.toBeUndefined();
	});

	it("passes through non-JSON error responses", async () => {
		const res = new Response("Bad Gateway", {
			status: 502,
			headers: { "Content-Type": "text/plain" },
		});

		// body parse fails → null → not an error envelope → passes through
		await expect(handleResponse(res)).resolves.toBeUndefined();
	});

	it("passes through when error field is a string, not an object", async () => {
		const res = jsonResponse(400, { error: "some string" });

		await expect(handleResponse(res)).resolves.toBeUndefined();
	});
});
