import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.ts";

const healthRoutes = new Hono();

healthRoutes.get("/", async (c) => {
	try {
		// Check database connectivity
		await db.execute(sql`SELECT 1`);

		return c.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
		});
	} catch {
		return c.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: "Database connection failed",
			},
			503,
		);
	}
});

export { healthRoutes };
