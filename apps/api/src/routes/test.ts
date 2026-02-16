import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const testRoutes = new OpenAPIHono();

// Test endpoint to verify Sentry is capturing backend errors
const sentryErrorRoute = createRoute({
	method: "get",
	path: "/sentry-error",
	tags: ["test"],
	responses: {
		500: {
			description: "Throws an error to test Sentry integration",
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.string(),
							message: z.string(),
						}),
					}),
				},
			},
		},
	},
});

testRoutes.openapi(sentryErrorRoute, (_c) => {
	throw new Error("Test error from backend - Sentry should capture this!");
});

export { testRoutes };
