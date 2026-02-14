import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { REQUEST_ID_HEADER, requestIdMiddleware } from "./request-id.ts";

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createApp() {
	return new Hono()
		.use("*", requestIdMiddleware)
		.get("/", (c) => c.json({ requestId: c.get("requestId") }));
}

describe("requestIdMiddleware", () => {
	it("preserves valid incoming X-Request-ID and echoes it in response", async () => {
		const id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
		const app = createApp();
		const res = await app.request("/", {
			headers: { [REQUEST_ID_HEADER]: id },
		});

		expect(res.status).toBe(200);
		expect(res.headers.get(REQUEST_ID_HEADER)).toBe(id);
		const body = (await res.json()) as { requestId: string };
		expect(body.requestId).toBe(id);
	});

	it("generates a UUID when X-Request-ID is missing", async () => {
		const app = createApp();
		const res = await app.request("/");

		expect(res.status).toBe(200);
		const id = res.headers.get(REQUEST_ID_HEADER);
		expect(id).toBeDefined();
		if (id == null) throw new Error("unreachable");
		expect(UUID_REGEX.test(id)).toBe(true);
		const body = (await res.json()) as { requestId: string };
		expect(body.requestId).toBe(id);
	});

	it("generates a new ID when X-Request-ID is invalid (not a UUID)", async () => {
		const app = createApp();
		const res = await app.request("/", {
			headers: { [REQUEST_ID_HEADER]: "not-a-uuid" },
		});

		expect(res.status).toBe(200);
		const id = res.headers.get(REQUEST_ID_HEADER);
		expect(id).toBeDefined();
		expect(id).not.toBe("not-a-uuid");
		if (id == null) throw new Error("unreachable");
		expect(UUID_REGEX.test(id)).toBe(true);
	});

	it("generates a new ID when X-Request-ID exceeds max length", async () => {
		const app = createApp();
		const longValue = "a".repeat(200);
		const res = await app.request("/", {
			headers: { [REQUEST_ID_HEADER]: longValue },
		});

		expect(res.status).toBe(200);
		const id = res.headers.get(REQUEST_ID_HEADER);
		expect(id).toBeDefined();
		expect(id).not.toBe(longValue);
		if (id == null) throw new Error("unreachable");
		expect(UUID_REGEX.test(id)).toBe(true);
	});

	it("includes X-Request-ID on every response", async () => {
		const app = createApp();
		const res = await app.request("/");
		expect(res.headers.has(REQUEST_ID_HEADER)).toBe(true);
	});
});
