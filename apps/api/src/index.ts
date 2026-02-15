import { serve } from "@hono/node-server";
import app from "./app.ts";
import { closeDatabase } from "./db/index.ts";
import { env } from "./lib/env.ts";
import { logger } from "./lib/logger.ts";

const server = serve(
	{
		fetch: app.fetch,
		port: env.API_PORT,
	},
	(info) => {
		logger.info(`API server running at http://localhost:${info.port}`);
	},
);

// ── Graceful Shutdown ──────────────────────────────────────────────
// Container runtimes (Docker, Kubernetes) send SIGTERM before killing the process.
// This ensures in-flight requests finish and database connections are released.
async function shutdown(signal: string) {
	logger.info(`Received ${signal}, shutting down gracefully...`);
	server.close(); // Stop accepting new connections
	await closeDatabase(); // Close database pool
	logger.info("Shutdown complete");
	process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
