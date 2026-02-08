import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.{test,spec}.ts"],
		env: {
			DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test",
			BETTER_AUTH_SECRET: "test-secret-for-vitest",
			BETTER_AUTH_URL: "http://localhost:3001",
			API_PORT: "3001",
			NODE_ENV: "test",
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"src/db/migrate.ts",
				"src/db/seed.ts",
				"**/*.d.ts",
				"**/*.config.*",
				"dist/",
			],
		},
	},
});
