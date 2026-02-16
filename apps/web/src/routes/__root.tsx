import * as Sentry from "@sentry/react";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	Outlet,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

interface RouterContext {
	queryClient: QueryClient;
}

function RouteErrorComponent({ error }: ErrorComponentProps) {
	// Report to Sentry when error component mounts
	useEffect(() => {
		console.error("Route error:", error);
		Sentry.captureException(error);
	}, [error]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="font-semibold text-2xl text-destructive">
				Something went wrong
			</h1>
			<p className="max-w-md text-muted-foreground">
				An unexpected error occurred. Please refresh the page to try again.
			</p>
			<Button onClick={() => window.location.reload()}>Refresh Page</Button>
			{import.meta.env.DEV && error && (
				<pre className="mt-4 max-w-2xl overflow-auto rounded-lg bg-muted p-4 text-left text-muted-foreground text-sm">
					{error instanceof Error ? error.message : String(error)}
					{"\n\n"}
					{error instanceof Error && error.stack}
				</pre>
			)}
		</div>
	);
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
	errorComponent: RouteErrorComponent,
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
