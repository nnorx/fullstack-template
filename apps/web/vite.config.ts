import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
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
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
		conditions: ["source"],
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
		},
	},
	build: {
		minify: "esbuild",
		cssMinify: true,
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// React core libraries
					if (
						id.includes("react") &&
						!id.includes("@tanstack") &&
						!id.includes("lucide")
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
