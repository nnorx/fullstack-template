import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<Toaster />
			<Navbar />
			<main className="flex flex-1 flex-col">
				<Outlet />
			</main>
		</div>
	);
}
