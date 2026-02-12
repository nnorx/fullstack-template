import type { MiddlewareHandler } from "hono";
import { logger } from "../lib/logger.ts";

/**
 * Structured request logger middleware.
 *
 * Logs every request as a JSON object with `method`, `path`, `status`, and
 * `responseTime` fields. The log level is chosen based on the response status:
 * - 5xx → error
 * - 4xx → warn
 * - everything else → info
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
	const start = performance.now();
	await next();
	const ms = Math.round(performance.now() - start);
	const status = c.res.status;
	const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

	logger[level](
		{
			method: c.req.method,
			path: c.req.path,
			status,
			responseTime: ms,
		},
		`${c.req.method} ${c.req.path} ${status} ${ms}ms`,
	);
};
