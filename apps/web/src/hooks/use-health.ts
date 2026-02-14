import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Fetches the API health status.
 *
 * This hook serves as a working example of the data fetching pattern:
 * 1. Query key from the {@link queryKeys} factory
 * 2. Typed fetch via the {@link client} (openapi-fetch)
 * 3. Response type is inferred automatically from the OpenAPI spec
 *
 * @example
 * ```tsx
 * function StatusBadge() {
 *   const { data, isPending, isError } = useHealth();
 *   if (isPending) return <span>Checking...</span>;
 *   if (isError) return <span>Offline</span>;
 *   return <span>{data.status}</span>;
 * }
 * ```
 */
export function useHealth() {
	return useQuery({
		queryKey: queryKeys.health.check(),
		queryFn: async () => {
			const { data } = await client.GET("/api/health");
			// Error middleware throws ApiError on non-OK responses,
			// so data is always defined here.
			if (!data) throw new Error("Unexpected empty response");
			return data;
		},
		refetchInterval: 30_000, // Poll every 30 seconds
	});
}
