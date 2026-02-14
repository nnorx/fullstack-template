import { z } from "zod";

export const paginationSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
});

export const apiErrorSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.unknown().optional(),
	}),
});

export const apiSuccessSchema = z.object({
	success: z.literal(true),
	message: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;
export type ApiSuccess = z.infer<typeof apiSuccessSchema>;
