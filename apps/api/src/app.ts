import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { env } from "./lib/env.ts";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.ts";
import { requestLogger } from "./middleware/logger.ts";
import { authRoutes } from "./routes/auth.ts";
import { healthRoutes } from "./routes/health.ts";

// Rate limiter for authentication endpoints
const authLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 20, // Limit each IP to 20 requests per window
	standardHeaders: "draft-7", // Set RateLimit-* headers
	keyGenerator: (c) => {
		// Cloudflare sets CF-Connecting-IP, fallback to X-Forwarded-For (first IP in chain)
		const cfIp = c.req.header("cf-connecting-ip");
		const forwardedFor = c.req.header("x-forwarded-for");
		const ip =
			cfIp ??
			(forwardedFor
				? (forwardedFor.split(",")[0]?.trim() ?? "unknown")
				: "unknown");
		return ip;
	},
});

// General API rate limiter (more permissive)
const apiLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per window
	standardHeaders: "draft-7",
	keyGenerator: (c) => {
		// Cloudflare sets CF-Connecting-IP, fallback to X-Forwarded-For (first IP in chain)
		const cfIp = c.req.header("cf-connecting-ip");
		const forwardedFor = c.req.header("x-forwarded-for");
		const ip =
			cfIp ??
			(forwardedFor
				? (forwardedFor.split(",")[0]?.trim() ?? "unknown")
				: "unknown");
		return ip;
	},
});

const app = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Request validation failed",
						details: z.flattenError(result.error),
					},
				},
				422,
			);
		}
	},
});

// ── Middleware ──────────────────────────────────────────────────────
app.use("*", requestLogger);
app.use("*", apiLimiter);
app.use(
	"*",
	cors({
		origin: (origin) => {
			// Allow requests from trusted origins
			const allowedOrigins = [env.FRONTEND_URL, env.BETTER_AUTH_URL];
			return allowedOrigins.includes(origin) ? origin : env.FRONTEND_URL;
		},
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
);
app.use("/api/auth/*", authLimiter);

// ── Routes ─────────────────────────────────────────────────────────
app.route("/api/auth", authRoutes);
app.route("/api/health", healthRoutes);

// ── OpenAPI Documentation ──────────────────────────────────────────
app.doc31("/api/doc", (c) => ({
	openapi: "3.1.0",
	info: {
		title: "Fullstack Template API",
		version: "1.0.0",
		description: "API documentation for the fullstack template",
	},
	servers: [
		{
			url: new URL(c.req.url).origin,
			description: "Current environment",
		},
	],
}));

app.get("/api/ui", swaggerUI({ url: "/api/doc" }));

// ── Error Handling ─────────────────────────────────────────────────
app.onError(errorHandler);
app.notFound(notFoundHandler);

export type AppType = typeof app;
export default app;
