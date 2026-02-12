import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { env } from "../lib/env.ts";
import { AppError, type ErrorResponse } from "../lib/errors.ts";
import { logger } from "../lib/logger.ts";

/**
 * Global error handler — registered via `app.onError()`.
 *
 * Handles three cases:
 * 1. `AppError`      → structured response with the intended status code.
 * 2. `HTTPException` → compatibility with Hono ecosystem middleware.
 * 3. Unknown error   → 500 with no internal details leaked in production.
 */
export const errorHandler: ErrorHandler = (err, c) => {
	// ── AppError (our own) ──────────────────────────────────────────
	if (err instanceof AppError) {
		return c.json<ErrorResponse>(
			{
				error: {
					code: err.code,
					message: err.message,
					details: err.details,
					...(env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
				},
			},
			err.statusCode as ContentfulStatusCode,
		);
	}

	// ── HTTPException (Hono built-in) ───────────────────────────────
	if (err instanceof HTTPException) {
		return c.json<ErrorResponse>(
			{
				error: {
					code: "HTTP_EXCEPTION",
					message: err.message,
					...(env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
				},
			},
			err.status,
		);
	}

	// ── Unknown error ───────────────────────────────────────────────
	logger.error({ err }, "Unhandled error");

	return c.json<ErrorResponse>(
		{
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Internal server error",
				...(env.NODE_ENV !== "production"
					? {
							stack: err instanceof Error ? err.stack : undefined,
						}
					: {}),
			},
		},
		500,
	);
};

/**
 * 404 handler — registered via `app.notFound()`.
 * Returns the same structured shape as error responses.
 */
export const notFoundHandler: NotFoundHandler = (c) => {
	return c.json<ErrorResponse>(
		{
			error: {
				code: "NOT_FOUND",
				message: `Route not found: ${c.req.method} ${c.req.path}`,
			},
		},
		404,
	);
};
