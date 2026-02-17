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
	projects: {
		all: ["projects"] as const,
		list: (page?: number) => [...queryKeys.projects.all, "list", page] as const,
		detail: (id: string) => [...queryKeys.projects.all, "detail", id] as const,
	},
	projectMembers: {
		all: ["projectMembers"] as const,
		list: (projectId: string) =>
			[...queryKeys.projectMembers.all, "list", projectId] as const,
	},
	posts: {
		all: ["posts"] as const,
		list: (projectId: string, page?: number) =>
			[...queryKeys.posts.all, "list", projectId, page] as const,
		detail: (projectId: string, postId: string) =>
			[...queryKeys.posts.all, "detail", projectId, postId] as const,
	},
	comments: {
		all: ["comments"] as const,
		list: (projectId: string, postId: string, page?: number) =>
			[...queryKeys.comments.all, "list", projectId, postId, page] as const,
	},
	files: {
		all: ["files"] as const,
		list: (projectId: string, page?: number) =>
			[...queryKeys.files.all, "list", projectId, page] as const,
	},
	notifications: {
		all: ["notifications"] as const,
		list: (page?: number) =>
			[...queryKeys.notifications.all, "list", page] as const,
		unreadCount: () => [...queryKeys.notifications.all, "unreadCount"] as const,
	},
} as const;
