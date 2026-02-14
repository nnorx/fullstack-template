import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import { db } from "../db/index.ts";

const HealthyResponseSchema = z
	.object({
		status: z.literal("healthy"),
		timestamp: z.string(),
		uptime: z.number(),
	})
	.openapi("HealthyResponse");

const UnhealthyResponseSchema = z
	.object({
		status: z.literal("unhealthy"),
		timestamp: z.string(),
		error: z.string(),
	})
	.openapi("UnhealthyResponse");

const healthCheckRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["System"],
	summary: "Health Check",
	description: "Check API and database connectivity",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: HealthyResponseSchema,
				},
			},
			description: "API is healthy",
		},
		503: {
			content: {
				"application/json": {
					schema: UnhealthyResponseSchema,
				},
			},
			description: "API is unhealthy",
		},
	},
});

const healthRoutes = new OpenAPIHono().openapi(healthCheckRoute, async (c) => {
	try {
		// Check database connectivity
		await db.execute(sql`SELECT 1`);

		return c.json(
			{
				status: "healthy" as const,
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
			},
			200,
		);
	} catch {
		return c.json(
			{
				status: "unhealthy" as const,
				timestamp: new Date().toISOString(),
				error: "Database connection failed",
			},
			503,
		);
	}
});

export { healthRoutes };
