import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./api.d.ts";
import { ApiError } from "./api-error.ts";

/**
 * Middleware that intercepts non-OK responses and throws an {@link ApiError}.
 *
 * This runs for every request made through the client, so error handling
 * is centralized — callers don't need to check `response.ok` themselves.
 */
const errorMiddleware: Middleware = {
	async onResponse({ response }) {
		if (response.ok) return;

		const body = await response
			.clone()
			.json()
			.catch(() => null);

		throw ApiError.fromResponse(response.status, body);
	},
};

/**
 * Typed API client — auto-generated types from the OpenAPI spec give
 * path autocomplete and inferred request/response types.
 *
 * @example
 * ```ts
 * const { data } = await client.GET("/api/health");
 * //      ^? { status: "healthy"; timestamp: string; uptime: number }
 * ```
 *
 * To regenerate types after changing API routes:
 * ```sh
 * pnpm --filter @fullstack-template/web typegen
 * ```
 */
export const client = createClient<paths>({
	baseUrl: import.meta.env.VITE_API_URL ?? "",
	credentials: "include",
});

client.use(errorMiddleware);
