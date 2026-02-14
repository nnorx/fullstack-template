import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";

describe("ApiError", () => {
	describe("constructor", () => {
		it("sets all properties from arguments", () => {
			const err = new ApiError(404, "NOT_FOUND", "Resource not found", {
				id: "123",
			});

			expect(err).toBeInstanceOf(Error);
			expect(err.name).toBe("ApiError");
			expect(err.status).toBe(404);
			expect(err.code).toBe("NOT_FOUND");
			expect(err.message).toBe("Resource not found");
			expect(err.details).toEqual({ id: "123" });
		});

		it("defaults details to undefined", () => {
			const err = new ApiError(500, "INTERNAL_SERVER_ERROR", "Oops");

			expect(err.details).toBeUndefined();
		});
	});

	describe("status helpers", () => {
		it("isUnauthorized is true for 401", () => {
			const err = new ApiError(401, "UNAUTHORIZED", "Auth required");
			expect(err.isUnauthorized).toBe(true);
			expect(err.isForbidden).toBe(false);
		});

		it("isForbidden is true for 403", () => {
			const err = new ApiError(403, "FORBIDDEN", "No access");
			expect(err.isForbidden).toBe(true);
			expect(err.isUnauthorized).toBe(false);
		});

		it("isNotFound is true for 404", () => {
			const err = new ApiError(404, "NOT_FOUND", "Gone");
			expect(err.isNotFound).toBe(true);
		});

		it("isValidationError is true for 422", () => {
			const err = new ApiError(422, "VALIDATION_ERROR", "Bad input");
			expect(err.isValidationError).toBe(true);
		});
	});

	describe("fromResponse", () => {
		it("parses a well-formed API error body", () => {
			const body = {
				error: {
					code: "BAD_REQUEST",
					message: "Invalid email",
					details: { field: "email" },
				},
			};
			const err = ApiError.fromResponse(400, body);

			expect(err.status).toBe(400);
			expect(err.code).toBe("BAD_REQUEST");
			expect(err.message).toBe("Invalid email");
			expect(err.details).toEqual({ field: "email" });
		});

		it("parses a body without details", () => {
			const body = {
				error: { code: "CONFLICT", message: "Already exists" },
			};
			const err = ApiError.fromResponse(409, body);

			expect(err.status).toBe(409);
			expect(err.code).toBe("CONFLICT");
			expect(err.message).toBe("Already exists");
			expect(err.details).toBeUndefined();
		});

		it("returns UNKNOWN_ERROR for null body", () => {
			const err = ApiError.fromResponse(500, null);

			expect(err.status).toBe(500);
			expect(err.code).toBe("UNKNOWN_ERROR");
			expect(err.message).toBe("Request failed with status 500");
		});

		it("returns UNKNOWN_ERROR for malformed body", () => {
			const err = ApiError.fromResponse(502, { unexpected: "shape" });

			expect(err.status).toBe(502);
			expect(err.code).toBe("UNKNOWN_ERROR");
		});

		it("returns UNKNOWN_ERROR when error field is a string instead of object", () => {
			const err = ApiError.fromResponse(400, {
				error: "some string",
			});

			expect(err.code).toBe("UNKNOWN_ERROR");
		});
	});
});
