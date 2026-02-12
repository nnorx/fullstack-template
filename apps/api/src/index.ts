import { serve } from "@hono/node-server";
import app from "./app.ts";
import { env } from "./lib/env.ts";
import { logger } from "./lib/logger.ts";

serve(
	{
		fetch: app.fetch,
		port: env.API_PORT,
	},
	(info) => {
		logger.info(`API server running at http://localhost:${info.port}`);
	},
);
