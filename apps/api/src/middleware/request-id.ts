import type { MiddlewareHandler } from "hono";

const HEADER = "X-Request-ID";

/**
 * Context shape: provides `requestId` for downstream middleware and handlers.
 * Set by requestIdMiddleware; consumed by requestLogger and others.
 */
export type RequestIdEnv = {
	Variables: { requestId: string };
};

/**
 * Generates or forwards a request ID for tracing.
 * Reads X-Request-ID from the request; if missing, generates a UUID.
 * Sets the same value on the response and on c.get("requestId").
 */
export const requestIdMiddleware: MiddlewareHandler<RequestIdEnv> = async (
	c,
	next,
) => {
	const id = c.req.header(HEADER) ?? crypto.randomUUID();
	c.set("requestId", id);
	c.header(HEADER, id);
	await next();
};
