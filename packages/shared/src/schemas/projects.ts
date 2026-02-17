import { z } from "zod";

// ── Projects ─────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
	name: z
		.string()
		.min(1, { error: "Project name is required" })
		.max(200, { error: "Project name is too long" }),
	description: z
		.string()
		.max(2000, { error: "Description is too long" })
		.optional(),
});

export const updateProjectSchema = z.object({
	name: z
		.string()
		.min(1, { error: "Project name is required" })
		.max(200, { error: "Project name is too long" })
		.optional(),
	description: z
		.string()
		.max(2000, { error: "Description is too long" })
		.optional(),
});

// ── Posts ─────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
	title: z
		.string()
		.min(1, { error: "Title is required" })
		.max(300, { error: "Title is too long" }),
	content: z
		.string()
		.min(1, { error: "Content is required" })
		.max(50000, { error: "Content is too long" }),
});

// ── Comments ─────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
	content: z
		.string()
		.min(1, { error: "Comment is required" })
		.max(5000, { error: "Comment is too long" }),
});

// ── Sharing ──────────────────────────────────────────────────────────

export const shareProjectSchema = z.object({
	email: z.email({ error: "Invalid email address" }),
});

// ── Pagination ───────────────────────────────────────────────────────

export const paginationSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Types ────────────────────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ShareProjectInput = z.infer<typeof shareProjectSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
