import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();

	useEffect(() => {
		if (!isPending && !session?.user) {
			void navigate({ to: "/login" });
		}
	}, [isPending, session, navigate]);

	if (isPending) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (!session?.user) {
		return null;
	}

	return (
		<div className="flex flex-1 flex-col p-6">
			<div className="mx-auto w-full max-w-4xl space-y-6">
				<div>
					<h1 className="font-bold text-2xl">Dashboard</h1>
					<p className="text-muted-foreground">
						Welcome back, {session.user.name}
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-lg border bg-card p-6 shadow-sm">
						<h3 className="font-medium text-muted-foreground text-sm">
							Account
						</h3>
						<p className="mt-2 font-semibold text-2xl">{session.user.email}</p>
					</div>
					<div className="rounded-lg border bg-card p-6 shadow-sm">
						<h3 className="font-medium text-muted-foreground text-sm">Role</h3>
						<p className="mt-2 font-semibold text-2xl capitalize">
							{session.user.role ?? "user"}
						</p>
					</div>
					<div className="rounded-lg border bg-card p-6 shadow-sm">
						<h3 className="font-medium text-muted-foreground text-sm">
							Status
						</h3>
						<p className="mt-2 font-semibold text-2xl text-green-600">Active</p>
					</div>
				</div>

				<div className="rounded-lg border bg-card p-6 shadow-sm">
					<h2 className="font-semibold text-lg">Getting Started</h2>
					<p className="mt-2 text-muted-foreground">
						This is a protected page that only authenticated users can see.
						Start building your application by adding new routes and components.
					</p>
				</div>
			</div>
		</div>
	);
}
