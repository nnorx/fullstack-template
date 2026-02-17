import { z } from "@hono/zod-openapi";

/** Standard error response envelope used across all API error responses. */
export const ErrorResponseSchema = z
	.object({
		error: z.object({
			code: z.string(),
			message: z.string(),
			details: z.unknown().optional(),
		}),
	})
	.openapi("ErrorResponse");

/** Pagination metadata included in all list responses. */
export const PaginationMetaSchema = z
	.object({
		page: z.number(),
		limit: z.number(),
		total: z.number(),
		totalPages: z.number(),
	})
	.openapi("PaginationMeta");

/** Build pagination metadata from query params and total count. */
export function buildPagination(page: number, limit: number, total: number) {
	return {
		page,
		limit,
		total,
		totalPages: Math.ceil(total / limit),
	};
}
