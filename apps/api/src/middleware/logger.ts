import type { MiddlewareHandler } from "hono";
import { logger } from "../lib/logger.ts";
import type { RequestIdEnv } from "./request-id.ts";

/**
 * Structured request logger middleware.
 * Expects requestId to be set (requestIdMiddleware must run first).
 *
 * Logs every request as a JSON object with `method`, `path`, `status`, and
 * `responseTime` fields. The log level is chosen based on the response status:
 * - 5xx → error
 * - 4xx → warn
 * - everything else → info
 */
export const requestLogger: MiddlewareHandler<RequestIdEnv> = async (
	c,
	next,
) => {
	const start = performance.now();
	await next();
	const ms = Math.round(performance.now() - start);
	const status = c.res.status;
	const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
	const requestId = c.get("requestId");

	logger[level](
		{
			requestId,
			method: c.req.method,
			path: c.req.path,
			status,
			responseTime: ms,
		},
		`${c.req.method} ${c.req.path} ${status} ${ms}ms`,
	);
};
