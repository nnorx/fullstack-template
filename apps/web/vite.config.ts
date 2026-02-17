import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vite configuration runs at build time, before the application starts.
 * Environment variables like SENTRY_AUTH_TOKEN and SENTRY_ORG are read directly
 * from process.env (not from the validated env schema) because runtime validation
 * isn't available during the build phase.
 */
// https://vite.dev/config/
export default defineConfig({
	// Load .env files from the monorepo root (two levels up from this config file)
	envDir: "../../",

	plugins: [
		tanstackRouter({
			routesDirectory: "./src/routes",
			generatedRouteTree: "./src/routeTree.gen.ts",
			autoCodeSplitting: true,
		}),
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		tailwindcss(),
		tsconfigPaths(),

		// Upload source maps to Sentry for readable production stack traces.
		// Only runs when SENTRY_AUTH_TOKEN is set (typically in CI/CD).
		// The .map files are deleted after upload so they aren't served to users.
		...(process.env.SENTRY_AUTH_TOKEN
			? [
					sentryVitePlugin({
						org: process.env.SENTRY_ORG ?? "",
						project: process.env.SENTRY_PROJECT_WEB ?? "",
						authToken: process.env.SENTRY_AUTH_TOKEN,
						sourcemaps: {
							filesToDeleteAfterUpload: ["./dist/**/*.map"],
						},
					}),
				]
			: []),
	],
	resolve: {
		conditions: ["source"],
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
			"/ws": {
				target: "ws://localhost:3001",
				ws: true,
			},
		},
	},
	build: {
		minify: "esbuild",
		cssMinify: true,
		// Generate source maps for Sentry only when uploading (hidden = not linked
		// from JS bundles). Without the upload plugin, .map files would be served.
		sourcemap: process.env.SENTRY_AUTH_TOKEN ? "hidden" : false,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// React core libraries
					if (
						id.includes("react") &&
						!id.includes("@tanstack") &&
						!id.includes("lucide") &&
						!id.includes("@sentry")
					) {
						return "vendor-react";
					}
					// TanStack libraries (router + query)
					if (id.includes("@tanstack")) {
						return "vendor-tanstack";
					}
					// Radix UI and utility libraries
					if (
						id.includes("@radix-ui") ||
						id.includes("class-variance-authority") ||
						id.includes("clsx") ||
						id.includes("tailwind-merge")
					) {
						return "vendor-ui";
					}
					// Lucide icons (tree-shakeable but still large)
					if (id.includes("lucide-react")) {
						return "vendor-icons";
					}
					// Sentry SDK
					if (id.includes("@sentry")) {
						return "vendor-sentry";
					}
					// Other vendor dependencies
					if (
						id.includes("better-auth") ||
						id.includes("openapi-fetch") ||
						id.includes("sonner")
					) {
						return "vendor-misc";
					}
					// All other node_modules
					if (id.includes("node_modules")) {
						return "vendor";
					}
				},
			},
		},
	},
});
