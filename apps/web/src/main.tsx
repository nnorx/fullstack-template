// Sentry must be imported before other app code so it can instrument everything.
import "./lib/sentry.ts";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ApiError } from "./lib/api-error.ts";
import { initTheme } from "./lib/theme.ts";
import { routeTree } from "./routeTree.gen.ts";

// Initialize theme before React renders to avoid flash
initTheme();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minute
			retry: (failureCount, error) => {
				// Don't retry on client errors — they won't succeed on retry
				if (error instanceof ApiError && error.status < 500) return false;
				return failureCount < 1;
			},
		},
		mutations: {
			retry: false,
		},
	},
});

const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
});

// Register router for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
	<StrictMode>
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</ErrorBoundary>
	</StrictMode>,
);
