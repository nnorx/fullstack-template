import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { signOut, useSession } from "@/lib/auth-client";

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();

	const handleSignOut = () => {
		void signOut({
			fetchOptions: {
				onSuccess: () => {
					void navigate({ to: "/" });
				},
			},
		});
	};

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<Toaster />
			<header className="flex items-center justify-between border-border border-b px-6 py-4">
				<nav className="flex items-center gap-6">
					<Link to="/" className="font-semibold text-lg">
						Fullstack Template
					</Link>
					{session?.user && (
						<Link
							to="/dashboard"
							className="text-muted-foreground text-sm transition-colors hover:text-foreground [&.active]:text-foreground"
						>
							Dashboard
						</Link>
					)}
				</nav>
				<div className="flex items-center gap-2">
					{isPending ? null : session?.user ? (
						<>
							<span className="text-muted-foreground text-sm">
								{session.user.name}
							</span>
							<Button variant="ghost" size="sm" onClick={handleSignOut}>
								Sign Out
							</Button>
						</>
					) : (
						<>
							<Button variant="ghost" size="sm" asChild>
								<Link to="/login">Sign In</Link>
							</Button>
							<Button size="sm" asChild>
								<Link to="/register">Sign Up</Link>
							</Button>
						</>
					)}
					<ThemeToggle />
				</div>
			</header>
			<main className="flex flex-1 flex-col">
				<Outlet />
			</main>
		</div>
	);
}
