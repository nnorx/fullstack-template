import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AuthEnv } from "../middleware/auth.ts";
import { requireAdmin, requireAuth } from "../middleware/auth.ts";

const testRoutes = new OpenAPIHono<AuthEnv>();

// ── Error Response Schema ──────────────────────────────────────────
const ErrorResponseSchema = z
	.object({
		error: z.object({
			code: z.string(),
			message: z.string(),
			details: z.unknown().optional(),
		}),
	})
	.openapi("ErrorResponse");

// ── Test Sentry Error Route ────────────────────────────────────────
const sentryErrorRoute = createRoute({
	method: "get",
	path: "/sentry-error",
	tags: ["test"],
	summary: "Test Sentry Error Capture",
	description:
		"Throws an error to verify Sentry is capturing backend exceptions",
	responses: {
		500: {
			description: "Throws an error to test Sentry integration",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

testRoutes.openapi(sentryErrorRoute, (_c) => {
	throw new Error("Test error from backend - Sentry should capture this!");
});

// ── Test Admin Access Route ────────────────────────────────────────
const adminTestRoute = createRoute({
	method: "get",
	path: "/admin-only",
	tags: ["test"],
	summary: "Test Admin Access",
	description: "Endpoint that requires admin role to access",
	responses: {
		200: {
			description: "Success - user has admin role",
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
						user: z.object({
							id: z.string(),
							email: z.string(),
							role: z.string(),
						}),
					}),
				},
			},
		},
		401: {
			description: "Unauthorized - no valid session",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Forbidden - user is not an admin",
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

testRoutes.openapi(adminTestRoute, async (c) => {
	// Apply auth middleware manually for this route
	await requireAuth(c, async () => {});
	await requireAdmin(c, async () => {});

	const user = c.get("user");
	return c.json(
		{
			message: "Admin access granted",
			user: {
				id: user.id,
				email: user.email,
				role: user.role ?? "user",
			},
		},
		200,
	);
});

export { testRoutes };
