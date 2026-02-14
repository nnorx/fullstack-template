import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";

/**
 * Tests for the error middleware used by the API client.
 *
 * We test the middleware logic in isolation rather than going through
 * openapi-fetch, so there's no need to mock the full client.
 */

/** Re-create the middleware's onResponse logic for unit testing. */
async function handleResponse(response: Response): Promise<void> {
	if (response.ok) return;

	const body = await response
		.clone()
		.json()
		.catch(() => null);

	throw ApiError.fromResponse(response.status, body);
}

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
		// Response.ok is derived from status (200-299), but we set it
		// explicitly for edge-case testing when needed.
	});
}

describe("API client error middleware", () => {
	it("does nothing for successful responses", async () => {
		const res = jsonResponse(200, { status: "healthy" });

		// Should not throw
		await expect(handleResponse(res)).resolves.toBeUndefined();
	});

	it("throws ApiError with parsed body on 4xx", async () => {
		const res = jsonResponse(422, {
			error: {
				code: "VALIDATION_ERROR",
				message: "Request validation failed",
				details: { fieldErrors: { email: ["Required"] } },
			},
		});

		await expect(handleResponse(res)).rejects.toThrow(ApiError);

		try {
			await handleResponse(res);
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

	it("throws ApiError with UNKNOWN_ERROR when body is not JSON", async () => {
		const res = new Response("Bad Gateway", {
			status: 502,
			headers: { "Content-Type": "text/plain" },
		});

		try {
			await handleResponse(res);
			expect.fail("Should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(ApiError);
			const apiErr = err as ApiError;
			expect(apiErr.status).toBe(502);
			expect(apiErr.code).toBe("UNKNOWN_ERROR");
		}
	});

	it("throws ApiError on 500 with structured error body", async () => {
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
});
