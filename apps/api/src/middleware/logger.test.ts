import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../lib/logger.ts";
import { requestLogger } from "./logger.ts";
import { REQUEST_ID_HEADER, requestIdMiddleware } from "./request-id.ts";

describe("requestLogger", () => {
	beforeEach(() => {
		vi.spyOn(logger, "info");
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("includes requestId in the structured log payload when requestIdMiddleware runs first", async () => {
		const requestId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
		const app = new Hono()
			.use("*", requestIdMiddleware)
			.use("*", requestLogger)
			.get("/", (c) => c.json({ ok: true }));

		await app.request("/", {
			headers: { [REQUEST_ID_HEADER]: requestId },
		});

		expect(logger.info).toHaveBeenCalled();
		const calls = (logger.info as ReturnType<typeof vi.fn>).mock.calls;
		const call = calls[0];
		expect(call).toBeDefined();
		if (!call) throw new Error("expected logger.info to be called");
		const payload = call[0] as Record<string, unknown>;
		expect(payload).toMatchObject({
			requestId,
			method: "GET",
			path: "/",
			status: 200,
		});
		expect(typeof payload.responseTime).toBe("number");
	});
});
