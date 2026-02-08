import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const { data: session } = useSession();

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="fade-in slide-in-from-bottom-4 animate-in text-center duration-500">
				<h2 className="font-bold text-4xl">Fullstack Template</h2>
				<p className="mt-2 text-muted-foreground">
					A modern fullstack monorepo with React, Hono, Drizzle, and end-to-end
					type safety.
				</p>
				<div className="mt-6 flex items-center justify-center gap-4">
					{session?.user ? (
						<Button asChild>
							<Link to="/dashboard">Go to Dashboard</Link>
						</Button>
					) : (
						<>
							<Button asChild>
								<Link to="/register">Get Started</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link to="/login">Sign In</Link>
							</Button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
