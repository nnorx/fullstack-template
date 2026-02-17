import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useWebSocketNotifications } from "@/hooks/use-notifications";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

function AuthenticatedLayout() {
	useWebSocketNotifications();
	return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		const session = await context.queryClient.ensureQueryData({
			queryKey: queryKeys.auth.session(),
			queryFn: async () => {
				const { data } = await authClient.getSession();
				return data;
			},
			staleTime: 30_000, // 30s — avoid re-fetching on every hover/navigation
		});

		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		return { session };
	},
	component: AuthenticatedLayout,
});
