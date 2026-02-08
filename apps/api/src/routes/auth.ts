import { Hono } from "hono";
import { auth } from "../lib/auth.ts";

const authRoutes = new Hono();

/**
 * Better Auth handler - handles all auth routes.
 * This catches all /api/auth/* requests and delegates to Better Auth.
 */
authRoutes.on(["POST", "GET"], "/*", (c) => {
	return auth.handler(c.req.raw);
});

export { authRoutes };
