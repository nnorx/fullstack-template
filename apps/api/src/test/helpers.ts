import { Hono } from "hono";
import type { ErrorResponse } from "../lib/errors.ts";
import { errorHandler, notFoundHandler } from "../middleware/error-handler.ts";

// ── Mock data factories ─────────────────────────────────────────────

type MockUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	role: string;
	banned: boolean;
	banReason: string | null;
	banExpires: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

type MockSession = {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
	ipAddress: string | null;
	userAgent: string | null;
};

/**
 * Create a mock user object with sensible defaults.
 * Pass partial overrides to customize specific fields.
 *
 * @example
 * ```ts
 * const user = createMockUser(); // defaults
 * const admin = createMockUser({ role: "admin", email: "admin@example.com" });
 * ```
 */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
	return {
		id: "user-123",
		name: "Test User",
		email: "test@example.com",
		emailVerified: true,
		image: null,
		role: "user",
		banned: false,
		banReason: null,
		banExpires: null,
		createdAt: new Date("2025-01-01"),
		updatedAt: new Date("2025-01-01"),
		...overrides,
	};
}

/**
 * Create a mock session object with sensible defaults.
 * Pass partial overrides to customize specific fields.
 *
 * @example
 * ```ts
 * const session = createMockSession();
 * const expired = createMockSession({ expiresAt: new Date("2020-01-01") });
 * ```
 */
export function createMockSession(
	overrides?: Partial<MockSession>,
): MockSession {
	return {
		id: "session-456",
		userId: "user-123",
		token: "mock-token",
		expiresAt: new Date("2099-01-01"),
		createdAt: new Date("2025-01-01"),
		updatedAt: new Date("2025-01-01"),
		ipAddress: null,
		userAgent: null,
		...overrides,
	};
}

// ── App scaffolding ─────────────────────────────────────────────────

/**
 * Create a minimal Hono app with the global error handler and notFound
 * handler pre-wired. Use this as the starting point for route tests.
 *
 * @example
 * ```ts
 * const app = createTestApp().get("/test", (c) => c.json({ ok: true }));
 * const res = await app.request("/test");
 * ```
 */
export function createTestApp() {
	return new Hono().onError(errorHandler).notFound(notFoundHandler);
}

// ── Response helpers ────────────────────────────────────────────────

/**
 * Parse a response body as a structured `ErrorResponse`.
 * Avoids the `(await res.json()) as ErrorResponse` cast in every test.
 */
export async function errorBody(res: Response): Promise<ErrorResponse> {
	return (await res.json()) as ErrorResponse;
}
