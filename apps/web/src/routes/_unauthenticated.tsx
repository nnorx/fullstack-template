import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/_unauthenticated")({
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData({
			queryKey: queryKeys.auth.session(),
			queryFn: async () => {
				const { data } = await authClient.getSession();
				return data;
			},
			staleTime: 30_000,
		});

		if (session) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: () => <Outlet />,
});
