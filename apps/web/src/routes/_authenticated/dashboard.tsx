import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useHealth } from "@/hooks/use-health";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { data: session } = useSession();
	const {
		data: health,
		isPending: isHealthPending,
		isError: isHealthError,
	} = useHealth();

	// Session is guaranteed by the _authenticated layout's beforeLoad guard
	const user = session?.user;

	return (
		<div className="flex flex-1 flex-col p-6">
			<div className="mx-auto w-full max-w-4xl space-y-6">
				<div>
					<h1 className="font-bold text-2xl">Dashboard</h1>
					<p className="text-muted-foreground">Welcome back, {user?.name}</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="font-medium text-muted-foreground text-sm">
								Account
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-semibold text-2xl">{user?.email}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="font-medium text-muted-foreground text-sm">
								Role
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-semibold text-2xl capitalize">
								{user?.role ?? "user"}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="font-medium text-muted-foreground text-sm">
								Status
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-semibold text-2xl text-green-600">Active</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>API Status</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							{isHealthPending ? (
								<span className="flex items-center gap-2 text-muted-foreground text-sm">
									<Spinner />
									Checking...
								</span>
							) : isHealthError ? (
								<>
									<span className="inline-block size-2 rounded-full bg-red-500" />
									<span className="text-sm">Unreachable</span>
								</>
							) : health?.status === "healthy" ? (
								<>
									<span className="inline-block size-2 rounded-full bg-green-500" />
									<span className="text-sm">
										Healthy &mdash; uptime {Math.floor(health.uptime / 60)}m
									</span>
								</>
							) : (
								<>
									<span className="inline-block size-2 rounded-full bg-yellow-500" />
									<span className="text-sm">
										Unhealthy &mdash; {health?.error}
									</span>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
