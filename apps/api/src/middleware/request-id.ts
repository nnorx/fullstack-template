import { randomUUID } from "node:crypto";
import * as Sentry from "@sentry/node";
import type { MiddlewareHandler } from "hono";

export const REQUEST_ID_HEADER = "X-Request-ID";

const MAX_REQUEST_ID_LENGTH = 128;
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidRequestId(value: string): boolean {
	return value.length <= MAX_REQUEST_ID_LENGTH && UUID_REGEX.test(value);
}

/**
 * Context shape: provides `requestId` for downstream middleware and handlers.
 * Set by requestIdMiddleware; consumed by requestLogger and others.
 */
export type RequestIdEnv = {
	Variables: { requestId: string };
};

/**
 * Generates or forwards a request ID for tracing.
 * Reads X-Request-ID from the request; if missing or invalid (not UUID or too long),
 * generates a new UUID. Sets the value on the response and on c.get("requestId").
 *
 * Tags the current Sentry scope with the request ID so errors, traces, and
 * breadcrumbs can be correlated end-to-end (frontend → backend → Sentry).
 */
export const requestIdMiddleware: MiddlewareHandler<RequestIdEnv> = async (
	c,
	next,
) => {
	const trimmed = c.req.header(REQUEST_ID_HEADER)?.trim();
	const id = trimmed && isValidRequestId(trimmed) ? trimmed : randomUUID();
	c.set("requestId", id);
	c.header(REQUEST_ID_HEADER, id);

	// Tag Sentry so every event in this request includes the request ID.
	Sentry.setTag("request_id", id);

	await next();
};
