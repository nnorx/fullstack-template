import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema/auth.ts";
import { comment, post, projectMember } from "../db/schema/projects.ts";
import {
	buildPagination,
	ErrorResponseSchema,
	PaginationMetaSchema,
} from "../lib/api-schemas.ts";
import { AppError } from "../lib/errors.ts";
import { createNotification } from "../lib/notifications.ts";
import { getProjectWithAccess } from "../lib/project-auth.ts";
import type { AuthEnv } from "../middleware/auth.ts";

const postRoutes = new OpenAPIHono<AuthEnv>();

// ── Schemas ───────────────────────────────────────────────────────────

const PostSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		authorId: z.string(),
		title: z.string(),
		content: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
		authorName: z.string(),
	})
	.openapi("Post");

const PostDetailSchema = PostSchema.extend({
	commentCount: z.number(),
}).openapi("PostDetail");

const PostListSchema = z
	.object({
		data: z.array(PostDetailSchema),
		pagination: PaginationMetaSchema,
	})
	.openapi("PostList");

const CommentInPostSchema = z
	.object({
		id: z.string(),
		postId: z.string(),
		authorId: z.string(),
		content: z.string(),
		createdAt: z.string(),
		authorName: z.string(),
	})
	.openapi("CommentInPost");

const PostWithCommentsSchema = PostSchema.extend({
	comments: z.array(CommentInPostSchema),
}).openapi("PostWithComments");

const ProjectIdParamsSchema = z.object({
	projectId: z.string().min(1),
});

const PostIdParamsSchema = z.object({
	projectId: z.string().min(1),
	postId: z.string().min(1),
});

const CreatePostBodySchema = z
	.object({
		title: z.string().min(1).max(300),
		content: z.string().min(1).max(50000),
	})
	.openapi("CreatePostBody");

const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Create Post ───────────────────────────────────────────────────────

const createPostRoute = createRoute({
	method: "post",
	path: "/{projectId}/posts",
	tags: ["Posts"],
	summary: "Create a post in a project",
	request: {
		params: ProjectIdParamsSchema,
		body: {
			content: { "application/json": { schema: CreatePostBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: PostSchema } },
			description: "Post created",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Project not found",
		},
	},
});

postRoutes.openapi(createPostRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId } = c.req.valid("param");
	const body = c.req.valid("json");

	await getProjectWithAccess(projectId, currentUser.id);

	const id = crypto.randomUUID();
	const now = new Date();
	await db.insert(post).values({
		id,
		projectId,
		authorId: currentUser.id,
		title: body.title,
		content: body.content,
		createdAt: now,
		updatedAt: now,
	});

	// Notify all other project members
	const members = await db
		.select({ userId: projectMember.userId })
		.from(projectMember)
		.where(eq(projectMember.projectId, projectId));
	for (const m of members) {
		if (m.userId !== currentUser.id) {
			void createNotification({
				recipientId: m.userId,
				actorId: currentUser.id,
				type: "new_post",
				projectId,
				postId: id,
				message: `${currentUser.name} posted "${body.title}"`,
			});
		}
	}

	return c.json(
		{
			id,
			projectId,
			authorId: currentUser.id,
			title: body.title,
			content: body.content,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
			authorName: currentUser.name,
		},
		201,
	);
});

// ── List Posts ─────────────────────────────────────────────────────────

const listPostsRoute = createRoute({
	method: "get",
	path: "/{projectId}/posts",
	tags: ["Posts"],
	summary: "List posts in a project",
	request: {
		params: ProjectIdParamsSchema,
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: PostListSchema } },
			description: "List of posts",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Project not found",
		},
	},
});

postRoutes.openapi(listPostsRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId } = c.req.valid("param");
	const { page, limit } = c.req.valid("query");
	const offset = (page - 1) * limit;

	await getProjectWithAccess(projectId, currentUser.id);

	const [rows, countResult] = await Promise.all([
		db
			.select({
				id: post.id,
				projectId: post.projectId,
				authorId: post.authorId,
				title: post.title,
				content: post.content,
				createdAt: post.createdAt,
				updatedAt: post.updatedAt,
				authorName: user.name,
			})
			.from(post)
			.innerJoin(user, eq(user.id, post.authorId))
			.where(eq(post.projectId, projectId))
			.orderBy(desc(post.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(post)
			.where(eq(post.projectId, projectId)),
	]);
	const total = countResult[0]?.total ?? 0;

	// Get comment counts for each post
	const postIds = rows.map((r) => r.id);
	const commentCounts =
		postIds.length > 0
			? await db
					.select({
						postId: comment.postId,
						count: count(),
					})
					.from(comment)
					.where(inArray(comment.postId, postIds))
					.groupBy(comment.postId)
			: [];

	const countMap = new Map(commentCounts.map((cc) => [cc.postId, cc.count]));

	const data = rows.map((row) => ({
		...row,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		commentCount: countMap.get(row.id) ?? 0,
	}));

	return c.json({ data, pagination: buildPagination(page, limit, total) }, 200);
});

// ── Get Post ──────────────────────────────────────────────────────────

const getPostRoute = createRoute({
	method: "get",
	path: "/{projectId}/posts/{postId}",
	tags: ["Posts"],
	summary: "Get a post with its comments",
	request: {
		params: PostIdParamsSchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: PostWithCommentsSchema } },
			description: "Post with comments",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
		404: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Not found",
		},
	},
});

postRoutes.openapi(getPostRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId, postId } = c.req.valid("param");

	await getProjectWithAccess(projectId, currentUser.id);

	const [postRow] = await db
		.select({
			id: post.id,
			projectId: post.projectId,
			authorId: post.authorId,
			title: post.title,
			content: post.content,
			createdAt: post.createdAt,
			updatedAt: post.updatedAt,
			authorName: user.name,
		})
		.from(post)
		.innerJoin(user, eq(user.id, post.authorId))
		.where(and(eq(post.id, postId), eq(post.projectId, projectId)));

	if (!postRow) {
		throw AppError.notFound("Post not found");
	}

	// Fetch comments with author info
	const comments = await db
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
		.orderBy(comment.createdAt);

	return c.json(
		{
			...postRow,
			createdAt: postRow.createdAt.toISOString(),
			updatedAt: postRow.updatedAt.toISOString(),
			comments: comments.map((cm) => ({
				...cm,
				createdAt: cm.createdAt.toISOString(),
			})),
		},
		200,
	);
});

// ── Delete Post ───────────────────────────────────────────────────────

const deletePostRoute = createRoute({
	method: "delete",
	path: "/{projectId}/posts/{postId}",
	tags: ["Posts"],
	summary: "Delete a post",
	description: "Post author or project owner can delete",
	request: {
		params: PostIdParamsSchema,
	},
	responses: {
		204: {
			description: "Post deleted",
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

postRoutes.openapi(deletePostRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId, postId } = c.req.valid("param");

	const { role } = await getProjectWithAccess(projectId, currentUser.id);

	const found = await db.query.post.findFirst({
		where: and(eq(post.id, postId), eq(post.projectId, projectId)),
	});

	if (!found) {
		throw AppError.notFound("Post not found");
	}

	// Only post author or project owner can delete
	if (found.authorId !== currentUser.id && role !== "owner") {
		throw AppError.forbidden(
			"Only the post author or project owner can delete this post",
		);
	}

	await db.delete(post).where(eq(post.id, postId));

	return c.body(null, 204);
});

export { postRoutes };
