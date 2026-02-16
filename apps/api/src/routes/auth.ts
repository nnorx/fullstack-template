import { loginSchema, registerSchema } from "@fullstack-template/shared";
import { Hono } from "hono";
import type { z } from "zod";
import { auth } from "../lib/auth.ts";
import { AppError } from "../lib/errors.ts";

const authRoutes = new Hono();

/**
 * Validate request body against a Zod schema.
 * Throws AppError with validation details if invalid.
 */
function validateBody<T extends z.ZodType>(
	body: unknown,
	schema: T,
): z.infer<T> {
	const result = schema.safeParse(body);
	if (!result.success) {
		throw AppError.badRequest("Validation failed", result.error.flatten());
	}
	return result.data;
}

/**
 * Middleware to validate sign-up requests before they reach Better Auth.
 * Clones the request to read the body for validation — the original body
 * must remain unconsumed for Better Auth's handler.
 */
authRoutes.post("/sign-up/email", async (c, next) => {
	const body = await c.req.raw.clone().json();
	validateBody(body, registerSchema);
	await next();
});

/**
 * Middleware to validate sign-in requests before they reach Better Auth.
 * Clones the request to read the body for validation — the original body
 * must remain unconsumed for Better Auth's handler.
 */
authRoutes.post("/sign-in/email", async (c, next) => {
	const body = await c.req.raw.clone().json();
	validateBody(body, loginSchema);
	await next();
});

/**
 * Better Auth handler - handles all auth routes.
 * This catches all /api/auth/* requests and delegates to Better Auth.
 * Validation middleware above runs first for sign-up/sign-in.
 */
authRoutes.on(["POST", "GET"], "/*", (c) => {
	return auth.handler(c.req.raw);
});

export { authRoutes };
