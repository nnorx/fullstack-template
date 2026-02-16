import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

/**
 * Extract the client IP from Cloudflare or proxy headers.
 * Falls back to the socket remote address if headers are absent.
 * Use as keyGenerator for rate limiters.
 */
export function getClientIp(c: Context): string {
	// Cloudflare sets cf-connecting-ip to the real client IP
	const cfIp = c.req.header("cf-connecting-ip");
	if (cfIp) return cfIp;

	// Reverse proxies set x-forwarded-for (leftmost = client)
	const forwardedFor = c.req.header("x-forwarded-for");
	if (forwardedFor) {
		const clientIp = forwardedFor.split(",")[0]?.trim();
		if (clientIp) return clientIp;
	}

	// Fall back to socket remote address (direct connection or when not behind proxy)
	// In test environments (app.request()), getConnInfo may not be available
	try {
		const info = getConnInfo(c);
		return info.remote.address ?? "unknown";
	} catch {
		return "unknown";
	}
}
