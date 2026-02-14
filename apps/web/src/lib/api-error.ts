/**
 * Structured error class for API error responses.
 *
 * The API returns errors in the shape:
 * ```json
 * { "error": { "code": "NOT_FOUND", "message": "Resource not found", "details": ... } }
 * ```
 *
 * This class mirrors that structure and is thrown by the API client middleware
 * so that TanStack Query and components can handle errors consistently.
 */
export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly details: unknown;

	constructor(
		status: number,
		code: string,
		message: string,
		details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
		this.details = details;
	}

	get isUnauthorized(): boolean {
		return this.status === 401;
	}

	get isForbidden(): boolean {
		return this.status === 403;
	}

	get isNotFound(): boolean {
		return this.status === 404;
	}

	get isValidationError(): boolean {
		return this.status === 422;
	}

	/**
	 * Parse an API error response body into an ApiError instance.
	 */
	static fromResponse(status: number, body: unknown): ApiError {
		if (
			body &&
			typeof body === "object" &&
			"error" in body &&
			body.error &&
			typeof body.error === "object" &&
			"code" in body.error &&
			"message" in body.error
		) {
			const err = body.error as {
				code: string;
				message: string;
				details?: unknown;
			};
			return new ApiError(status, err.code, err.message, err.details);
		}

		return new ApiError(
			status,
			"UNKNOWN_ERROR",
			`Request failed with status ${status}`,
		);
	}
}
