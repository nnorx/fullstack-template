import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { env } from "./lib/env.ts";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.ts";
import { requestLogger } from "./middleware/logger.ts";
import { authRoutes, healthRoutes } from "./routes/index.ts";

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

const app = new Hono()
	.use("*", requestLogger)
	.use("*", apiLimiter) // Apply general rate limit to all routes
	.use(
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
	)
	.use("/api/auth/*", authLimiter) // Apply stricter rate limit to auth routes
	.route("/api/auth", authRoutes)
	.route("/api/health", healthRoutes)
	.onError(errorHandler)
	.notFound(notFoundHandler);

export type AppType = typeof app;
export default app;
