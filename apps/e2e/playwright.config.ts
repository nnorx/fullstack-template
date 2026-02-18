import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const API_URL = "http://localhost:3001";

// Nix dev shells provide browsers via PLAYWRIGHT_BROWSERS_PATH but only include
// the full Chrome binary, not the headless shell variant. Detect this and point
// Playwright to the full executable so it works in both Nix and standard environments.
function resolveNixChromium(): string | undefined {
	const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
	if (!browsersPath || process.env.CI) return undefined;
	try {
		const entries = readdirSync(browsersPath);
		const chromiumDir = entries.find((e) => e.startsWith("chromium-"));
		if (!chromiumDir) return undefined;
		const execPath = path.join(
			browsersPath,
			chromiumDir,
			"chrome-linux64",
			"chrome",
		);
		return existsSync(execPath) ? execPath : undefined;
	} catch {
		return undefined;
	}
}

const chromiumExecutable = resolveNixChromium();
const launchOptions = chromiumExecutable
	? { executablePath: chromiumExecutable }
	: {};

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI
		? [["html", { open: "never" }], ["github"]]
		: [["html", { open: "on-failure" }]],

	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		launchOptions,
	},

	projects: [
		{
			name: "setup",
			testMatch: /global-setup\.ts/,
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: ".auth/user.json",
			},
			dependencies: ["setup"],
			testIgnore: /auth\//,
		},
		{
			name: "auth",
			use: { ...devices["Desktop Chrome"] },
			testMatch: /auth\//,
		},
	],

	webServer: [
		{
			command: "pnpm --filter @fullstack-template/api dev",
			url: `${API_URL}/api/health`,
			reuseExistingServer: !process.env.CI,
			cwd: "../..",
			env: {
				DATABASE_URL:
					"postgresql://postgres:postgres@localhost:5432/fullstack_template_test",
				BETTER_AUTH_SECRET:
					"e2e-test-secret-must-be-at-least-32-characters-long",
				BETTER_AUTH_URL: API_URL,
				FRONTEND_URL: BASE_URL,
				API_PORT: "3001",
				NODE_ENV: "test",
				LOG_LEVEL: "silent",
			},
			timeout: 30_000,
		},
		{
			command: "pnpm --filter @fullstack-template/web dev",
			url: BASE_URL,
			reuseExistingServer: !process.env.CI,
			cwd: "../..",
			timeout: 30_000,
		},
	],
});
