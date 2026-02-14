import type { Context } from "hono";

/**
 * Extract the client IP from Cloudflare or proxy headers.
 * Use as keyGenerator for rate limiters.
 */
export function getClientIp(c: Context): string {
	const cfIp = c.req.header("cf-connecting-ip");
	const forwardedFor = c.req.header("x-forwarded-for");
	return (
		cfIp ??
		(forwardedFor
			? (forwardedFor.split(",")[0]?.trim() ?? "unknown")
			: "unknown")
	);
}
