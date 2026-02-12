import { Hono } from "hono";
import { vi } from "vitest";
import {
	createMockSession,
	createMockUser,
	createTestApp,
	errorBody,
} from "../test/helpers.ts";
import type { OptionalAuthEnv } from "./auth.ts";
import { optionalAuth, requireAuth } from "./auth.ts";

// Mock Better Auth's getSession - use vi.hoisted to avoid TDZ issues
const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock("../lib/auth.ts", () => ({
	auth: {
		api: {
			getSession: mockGetSession,
		},
	},
}));

const mockUser = createMockUser();
const mockSession = createMockSession();

beforeEach(() => {
	mockGetSession.mockReset();
});

describe("requireAuth", () => {
	function createApp() {
		return createTestApp()
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
		const body = await errorBody(res);

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
