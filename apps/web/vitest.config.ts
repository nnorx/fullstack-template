import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// biome-ignore lint/suspicious/noExplicitAny: Plugin type incompatibility between vite versions
	plugins: [react()] as any,
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"src/test/",
				"src/main.tsx",
				"src/routeTree.gen.ts",
				"**/*.d.ts",
				"**/*.config.*",
				"dist/",
			],
		},
	},
});
