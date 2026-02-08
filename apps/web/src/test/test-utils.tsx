import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";

const testQueryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

/**
 * Custom render function that wraps components with necessary providers.
 * Includes QueryClientProvider for React Query support.
 */
function AllProviders({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={testQueryClient}>
			{children}
		</QueryClientProvider>
	);
}

function customRender(
	ui: ReactElement,
	options?: Omit<RenderOptions, "wrapper">,
) {
	return {
		user: userEvent.setup(),
		...render(ui, { wrapper: AllProviders, ...options }),
	};
}

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render with custom version
export { customRender as render };
