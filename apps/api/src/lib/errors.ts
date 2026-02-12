/**
 * Structured error class for consistent API error responses.
 * Throw from any route or middleware — the global error handler catches these
 * and returns a well-formed JSON response.
 * @public
 */
export class AppError extends Error {
	readonly statusCode: number;
	readonly code: string;
	readonly details: unknown;

	constructor(
		statusCode: number,
		code: string,
		message: string,
		details?: unknown,
	) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;
	}

	// ── Factory methods ────────────────────────────────────────────────

	static badRequest(message = "Bad request", details?: unknown) {
		return new AppError(400, "BAD_REQUEST", message, details);
	}

	static unauthorized(message = "Authentication required") {
		return new AppError(401, "UNAUTHORIZED", message);
	}

	static forbidden(message = "Insufficient permissions") {
		return new AppError(403, "FORBIDDEN", message);
	}

	static notFound(message = "Resource not found") {
		return new AppError(404, "NOT_FOUND", message);
	}

	static conflict(message = "Resource already exists") {
		return new AppError(409, "CONFLICT", message);
	}

	static tooManyRequests(message = "Too many requests") {
		return new AppError(429, "TOO_MANY_REQUESTS", message);
	}

	static internal(message = "Internal server error") {
		return new AppError(500, "INTERNAL_SERVER_ERROR", message);
	}
}

/**
 * Shape of every error response returned by the API.
 * @public
 */
export type ErrorResponse = {
	error: {
		code: string;
		message: string;
		details?: unknown;
		/** Only included when NODE_ENV !== "production" */
		stack?: string | undefined;
	};
};
