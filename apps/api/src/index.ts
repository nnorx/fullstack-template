import { serve } from "@hono/node-server";
import app from "./app.ts";
import { env } from "./lib/env.ts";

serve(
	{
		fetch: app.fetch,
		port: env.API_PORT,
	},
	(info) => {
		console.log(`API server running at http://localhost:${info.port}`);
	},
);
