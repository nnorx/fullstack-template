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
 * Both 200 (healthy) and 503 (unhealthy) are valid domain responses —
 * the error middleware only throws for the global error envelope, so
 * both land here as data. A TanStack Query error (`isError`) means
 * the API was truly unreachable (network failure, etc.).
 *
 * @example
 * ```tsx
 * function StatusBadge() {
 *   const { data, isPending, isError } = useHealth();
 *   if (isPending) return <span>Checking...</span>;
 *   if (isError) return <span>Unreachable</span>;
 *   return <span>{data.status}</span>;
 * }
 * ```
 */
export function useHealth() {
	return useQuery({
		queryKey: queryKeys.health.check(),
		queryFn: async () => {
			const result = await client.GET("/api/health");
			// Both 200 and 503 are valid domain responses with typed schemas.
			// `data` is set on 200, `error` is set on 503.
			if (result.data) return result.data;
			if (result.error) return result.error;
			throw new Error("Unexpected empty response");
		},
		refetchInterval: 30_000, // Poll every 30 seconds
	});
}
