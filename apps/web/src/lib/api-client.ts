import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./api.d.ts";
import { ApiError } from "./api-error.ts";

/**
 * Middleware that throws an {@link ApiError} when the response matches the
 * API-wide error envelope: `{ error: { code, message, details? } }`.
 *
 * Non-2xx responses that use their own domain schema (e.g. a 503
 * `UnhealthyResponse` from `/api/health`) are left alone so that
 * openapi-fetch returns them in its typed `error` field and callers
 * can handle them as normal domain data.
 *
 * Exported for direct unit testing.
 */
export async function handleErrorResponse(response: Response): Promise<void> {
	if (response.ok) return;

	const body = await response
		.clone()
		.json()
		.catch(() => null);

	// Only throw for responses that match the global error envelope.
	// Domain-specific non-2xx responses (with their own OpenAPI schemas)
	// pass through so callers can inspect them via `{ error }`.
	if (!ApiError.isErrorEnvelope(body)) return;

	throw ApiError.fromResponse(response.status, body);
}

const errorMiddleware: Middleware = {
	onResponse: ({ response }) => handleErrorResponse(response),
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
