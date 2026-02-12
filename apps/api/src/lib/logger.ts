import pino from "pino";

/**
 * Structured JSON logger for the API server.
 *
 * Reads `LOG_LEVEL` directly from `process.env` (not from the validated env
 * schema) to avoid a circular dependency — the env validator itself uses this
 * logger.
 * @public
 */
export const logger = pino({
	name: "api",
	level: process.env.LOG_LEVEL ?? "info",
});
