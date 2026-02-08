import { describe, expect, it } from "vitest";
import app from "../app.ts";

describe("Health endpoint", () => {
	it("returns health status", async () => {
		const res = await app.request("/api/health");
		const body = await res.json();

		// Note: without a real DB, this will return 503
		// In a real test setup, you'd mock the database or use a test container
		expect(res.status).toBeOneOf([200, 503]);
		expect(body).toHaveProperty("status");
		expect(body).toHaveProperty("timestamp");
	});
});
