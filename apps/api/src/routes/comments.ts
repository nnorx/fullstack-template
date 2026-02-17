import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema/auth.ts";
import { comment, post } from "../db/schema/projects.ts";
import {
	buildPagination,
	ErrorResponseSchema,
	PaginationMetaSchema,
} from "../lib/api-schemas.ts";
import { AppError } from "../lib/errors.ts";
import { createNotification } from "../lib/notifications.ts";
import { getProjectWithAccess } from "../lib/project-auth.ts";
import type { AuthEnv } from "../middleware/auth.ts";

const commentRoutes = new OpenAPIHono<AuthEnv>();

// ── Schemas ───────────────────────────────────────────────────────────

const CommentSchema = z
	.object({
		id: z.string(),
		postId: z.string(),
		authorId: z.string(),
		content: z.string(),
		createdAt: z.string(),
		authorName: z.string(),
	})
	.openapi("Comment");

const CommentListSchema = z
	.object({
		data: z.array(CommentSchema),
		pagination: PaginationMetaSchema,
	})
	.openapi("CommentList");

const CommentParamsSchema = z.object({
	projectId: z.string().min(1),
	postId: z.string().min(1),
});

const DeleteCommentParamsSchema = z.object({
	projectId: z.string().min(1),
	postId: z.string().min(1),
	commentId: z.string().min(1),
});

const CreateCommentBodySchema = z
	.object({
		content: z.string().min(1).max(5000),
	})
	.openapi("CreateCommentBody");

const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Create Comment ────────────────────────────────────────────────────

const createCommentRoute = createRoute({
	method: "post",
	path: "/{projectId}/posts/{postId}/comments",
	tags: ["Comments"],
	summary: "Add a comment to a post",
	request: {
		params: CommentParamsSchema,
		body: {
			content: {
				"application/json": { schema: CreateCommentBodySchema },
			},
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: CommentSchema } },
			description: "Comment created",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Project or post not found",
		},
	},
});

commentRoutes.openapi(createCommentRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId, postId } = c.req.valid("param");
	const body = c.req.valid("json");

	await getProjectWithAccess(projectId, currentUser.id);

	// Verify the post belongs to this project
	const foundPost = await db.query.post.findFirst({
		where: and(eq(post.id, postId), eq(post.projectId, projectId)),
	});

	if (!foundPost) {
		throw AppError.notFound("Post not found");
	}

	const id = crypto.randomUUID();
	const now = new Date();
	await db.insert(comment).values({
		id,
		postId,
		authorId: currentUser.id,
		content: body.content,
		createdAt: now,
	});

	// Notify post author if different from commenter
	if (foundPost.authorId !== currentUser.id) {
		void createNotification({
			recipientId: foundPost.authorId,
			actorId: currentUser.id,
			type: "new_comment",
			projectId,
			postId,
			commentId: id,
			message: `${currentUser.name} commented on "${foundPost.title}"`,
		});
	}

	return c.json(
		{
			id,
			postId,
			authorId: currentUser.id,
			content: body.content,
			createdAt: now.toISOString(),
			authorName: currentUser.name,
		},
		201,
	);
});

// ── List Comments ─────────────────────────────────────────────────────

const listCommentsRoute = createRoute({
	method: "get",
	path: "/{projectId}/posts/{postId}/comments",
	tags: ["Comments"],
	summary: "List comments on a post",
	request: {
		params: CommentParamsSchema,
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: CommentListSchema } },
			description: "List of comments",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Project or post not found",
		},
	},
});

commentRoutes.openapi(listCommentsRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId, postId } = c.req.valid("param");
	const { page, limit } = c.req.valid("query");
	const offset = (page - 1) * limit;

	await getProjectWithAccess(projectId, currentUser.id);

	// Verify the post belongs to this project
	const foundPost = await db.query.post.findFirst({
		where: and(eq(post.id, postId), eq(post.projectId, projectId)),
	});

	if (!foundPost) {
		throw AppError.notFound("Post not found");
	}

	const [rows, countResult] = await Promise.all([
		db
			.select({
				id: comment.id,
				postId: comment.postId,
				authorId: comment.authorId,
				content: comment.content,
				createdAt: comment.createdAt,
				authorName: user.name,
			})
			.from(comment)
			.innerJoin(user, eq(user.id, comment.authorId))
			.where(eq(comment.postId, postId))
			.orderBy(comment.createdAt)
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(comment)
			.where(eq(comment.postId, postId)),
	]);
	const total = countResult[0]?.total ?? 0;

	const data = rows.map((row) => ({
		...row,
		createdAt: row.createdAt.toISOString(),
	}));

	return c.json({ data, pagination: buildPagination(page, limit, total) }, 200);
});

// ── Delete Comment ────────────────────────────────────────────────────

const deleteCommentRoute = createRoute({
	method: "delete",
	path: "/{projectId}/posts/{postId}/comments/{commentId}",
	tags: ["Comments"],
	summary: "Delete a comment",
	description: "Comment author or project owner can delete",
	request: {
		params: DeleteCommentParamsSchema,
	},
	responses: {
		204: {
			description: "Comment deleted",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
		403: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Forbidden",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Not found",
		},
	},
});

commentRoutes.openapi(deleteCommentRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId, postId, commentId } = c.req.valid("param");

	const { role } = await getProjectWithAccess(projectId, currentUser.id);

	const found = await db.query.comment.findFirst({
		where: and(eq(comment.id, commentId), eq(comment.postId, postId)),
	});

	if (!found) {
		throw AppError.notFound("Comment not found");
	}

	if (found.authorId !== currentUser.id && role !== "owner") {
		throw AppError.forbidden(
			"Only the comment author or project owner can delete this comment",
		);
	}

	await db.delete(comment).where(eq(comment.id, commentId));

	return c.body(null, 204);
});

export { commentRoutes };
