import { Hono } from "hono";
import { vi } from "vitest";
import type { ErrorResponse } from "../lib/errors.ts";
import type { AuthEnv, OptionalAuthEnv } from "./auth.ts";
import { optionalAuth, requireAuth } from "./auth.ts";
import { errorHandler } from "./error-handler.ts";

// Mock Better Auth's getSession
const mockGetSession = vi.fn();

vi.mock("../lib/auth.ts", () => ({
	auth: {
		api: {
			getSession: (...args: unknown[]) => mockGetSession(...args),
		},
	},
}));

const mockUser = {
	id: "user-123",
	email: "test@example.com",
	name: "Test User",
	createdAt: new Date(),
	updatedAt: new Date(),
	emailVerified: true,
	image: null,
	role: "user",
};

const mockSession = {
	id: "session-456",
	userId: "user-123",
	expiresAt: new Date(Date.now() + 86400000),
	token: "mock-token",
	createdAt: new Date(),
	updatedAt: new Date(),
	ipAddress: null,
	userAgent: null,
};

beforeEach(() => {
	mockGetSession.mockReset();
});

describe("requireAuth", () => {
	function createApp() {
		return new Hono<AuthEnv>()
			.onError(errorHandler)
			.use("*", requireAuth)
			.get("/protected", (c) => {
				const user = c.get("user");
				return c.json({ userId: user.id });
			});
	}

	it("allows requests with valid session", async () => {
		mockGetSession.mockResolvedValue({ user: mockUser, session: mockSession });

		const app = createApp();
		const res = await app.request("/protected");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ userId: "user-123" });
	});

	it("returns 401 when no session exists", async () => {
		mockGetSession.mockResolvedValue(null);

		const app = createApp();
		const res = await app.request("/protected");
		const body = (await res.json()) as ErrorResponse;

		expect(res.status).toBe(401);
		expect(body.error.code).toBe("UNAUTHORIZED");
		expect(body.error.message).toBe("Authentication required");
	});

	it("passes request headers to getSession", async () => {
		mockGetSession.mockResolvedValue({ user: mockUser, session: mockSession });

		const app = createApp();
		await app.request("/protected", {
			headers: { Cookie: "session=abc123" },
		});

		expect(mockGetSession).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: expect.any(Headers),
			}),
		);
	});
});

describe("optionalAuth", () => {
	function createApp() {
		return new Hono<OptionalAuthEnv>()
			.use("*", optionalAuth)
			.get("/public", (c) => {
				const user = c.get("user");
				return c.json({ userId: user?.id ?? null });
			});
	}

	it("attaches user when session exists", async () => {
		mockGetSession.mockResolvedValue({ user: mockUser, session: mockSession });

		const app = createApp();
		const res = await app.request("/public");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ userId: "user-123" });
	});

	it("sets user to null when no session exists", async () => {
		mockGetSession.mockResolvedValue(null);

		const app = createApp();
		const res = await app.request("/public");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ userId: null });
	});
});
