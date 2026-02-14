/**
 * Hierarchical query key factory for TanStack Query.
 *
 * Organises cache keys by domain so invalidation is predictable:
 * - `queryKeys.health.all`   → invalidate everything under "health"
 * - `queryKeys.health.check()` → target a single query
 *
 * When adding a new feature domain, follow this pattern:
 *
 * @example
 * ```ts
 * export const queryKeys = {
 *   ...existing,
 *   users: {
 *     all: ["users"] as const,
 *     list: (filters?: UserFilters) => [...queryKeys.users.all, "list", filters] as const,
 *     detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
 *   },
 * } as const;
 * ```
 */
export const queryKeys = {
	auth: {
		all: ["auth"] as const,
		session: () => [...queryKeys.auth.all, "session"] as const,
	},
	health: {
		all: ["health"] as const,
		check: () => [...queryKeys.health.all, "check"] as const,
	},
} as const;
