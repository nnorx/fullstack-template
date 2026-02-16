import * as Sentry from "@sentry/node";
import type { MiddlewareHandler } from "hono";
import { type Auth, auth } from "../lib/auth.ts";
import { AppError } from "../lib/errors.ts";

/**
 * Hono environment type that provides typed session context via `c.get()`.
 *
 * Pass this as the generic to `new Hono<AuthEnv>()` (or to individual routes)
 * so that `c.get("user")` and `c.get("session")` are properly typed.
 * @public
 */
export type AuthEnv = {
	Variables: {
		user: Auth["$Infer"]["Session"]["user"];
		session: Auth["$Infer"]["Session"]["session"];
	};
};

/**
 * Require a valid session. Throws 401 if the request has no valid session cookie.
 *
 * Sets `c.get("user")` and `c.get("session")` for downstream handlers.
 *
 * @example
 * ```ts
 * const protectedRoutes = new Hono<AuthEnv>()
 *   .use("*", requireAuth)
 *   .get("/profile", (c) => {
 *     const user = c.get("user"); // typed, non-null
 *     return c.json({ user });
 *   });
 * ```
 */
export const requireAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		throw AppError.unauthorized();
	}

	c.set("user", session.user);
	c.set("session", session.session);

	// Attach user context to Sentry so errors include who was affected.
	Sentry.setUser({
		id: session.user.id,
		email: session.user.email,
	});

	await next();
};

/**
 * Optionally attach session data if the request has a valid session cookie.
 *
 * Unlike `requireAuth`, this does **not** block unauthenticated requests —
 * `c.get("user")` and `c.get("session")` will be `null` when there is no session.
 *
 * Useful for routes that behave differently for logged-in vs anonymous users.
 */
export type OptionalAuthEnv = {
	Variables: {
		user: Auth["$Infer"]["Session"]["user"] | null;
		session: Auth["$Infer"]["Session"]["session"] | null;
	};
};

export const optionalAuth: MiddlewareHandler<OptionalAuthEnv> = async (
	c,
	next,
) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	c.set("user", session?.user ?? null);
	c.set("session", session?.session ?? null);

	await next();
};
