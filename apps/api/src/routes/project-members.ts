import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema/auth.ts";
import { projectMember } from "../db/schema/projects.ts";
import {
	buildPagination,
	ErrorResponseSchema,
	PaginationMetaSchema,
} from "../lib/api-schemas.ts";
import { AppError } from "../lib/errors.ts";
import { createNotification } from "../lib/notifications.ts";
import { getProjectWithAccess } from "../lib/project-auth.ts";
import type { AuthEnv } from "../middleware/auth.ts";

const projectMemberRoutes = new OpenAPIHono<AuthEnv>();

// ── Schemas ───────────────────────────────────────────────────────────

const MemberSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		userId: z.string(),
		role: z.string(),
		createdAt: z.string(),
		userName: z.string(),
		userEmail: z.string(),
	})
	.openapi("ProjectMember");

const MemberListSchema = z
	.object({
		data: z.array(MemberSchema),
		pagination: PaginationMetaSchema,
	})
	.openapi("ProjectMemberList");

const ProjectIdParamsSchema = z.object({
	projectId: z.string().min(1),
});

const MemberIdParamsSchema = z.object({
	projectId: z.string().min(1),
	memberId: z.string().min(1),
});

const ShareBodySchema = z
	.object({
		email: z.email(),
	})
	.openapi("ShareProjectBody");

const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Share Project ─────────────────────────────────────────────────────

const shareProjectRoute = createRoute({
	method: "post",
	path: "/{projectId}/members",
	tags: ["Project Members"],
	summary: "Share a project with a user",
	description: "Only the project owner can share a project",
	request: {
		params: ProjectIdParamsSchema,
		body: {
			content: { "application/json": { schema: ShareBodySchema } },
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: MemberSchema } },
			description: "Member added",
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
			description: "User or project not found",
		},
		409: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "User is already a member",
		},
	},
});

projectMemberRoutes.openapi(shareProjectRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId } = c.req.valid("param");
	const { email } = c.req.valid("json");

	const { project: proj } = await getProjectWithAccess(
		projectId,
		currentUser.id,
		"owner",
	);

	// Find the user to share with
	const targetUser = await db.query.user.findFirst({
		where: eq(user.email, email),
	});

	if (!targetUser) {
		throw AppError.notFound("No user found with that email address");
	}

	if (targetUser.id === currentUser.id) {
		throw AppError.badRequest("You are already the project owner");
	}

	// Check if already a member
	const existing = await db.query.projectMember.findFirst({
		where: and(
			eq(projectMember.projectId, projectId),
			eq(projectMember.userId, targetUser.id),
		),
	});

	if (existing) {
		throw AppError.conflict("User is already a member of this project");
	}

	const id = crypto.randomUUID();
	const now = new Date();
	await db.insert(projectMember).values({
		id,
		projectId,
		userId: targetUser.id,
		role: "contributor",
		createdAt: now,
	});

	void createNotification({
		recipientId: targetUser.id,
		actorId: currentUser.id,
		type: "project_shared",
		projectId,
		message: `${currentUser.name} shared "${proj.name}" with you`,
	});

	return c.json(
		{
			id,
			projectId,
			userId: targetUser.id,
			role: "contributor",
			createdAt: now.toISOString(),
			userName: targetUser.name,
			userEmail: targetUser.email,
		},
		201,
	);
});

// ── List Members ──────────────────────────────────────────────────────

const listMembersRoute = createRoute({
	method: "get",
	path: "/{projectId}/members",
	tags: ["Project Members"],
	summary: "List project members",
	request: {
		params: ProjectIdParamsSchema,
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: MemberListSchema } },
			description: "List of members",
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

projectMemberRoutes.openapi(listMembersRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId } = c.req.valid("param");
	const { page, limit } = c.req.valid("query");
	const offset = (page - 1) * limit;

	await getProjectWithAccess(projectId, currentUser.id);

	const [rows, countResult] = await Promise.all([
		db
			.select({
				id: projectMember.id,
				projectId: projectMember.projectId,
				userId: projectMember.userId,
				role: projectMember.role,
				createdAt: projectMember.createdAt,
				userName: user.name,
				userEmail: user.email,
			})
			.from(projectMember)
			.innerJoin(user, eq(user.id, projectMember.userId))
			.where(eq(projectMember.projectId, projectId))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(projectMember)
			.where(eq(projectMember.projectId, projectId)),
	]);
	const total = countResult[0]?.total ?? 0;

	const data = rows.map((row) => ({
		...row,
		createdAt: row.createdAt.toISOString(),
	}));

	return c.json({ data, pagination: buildPagination(page, limit, total) }, 200);
});

// ── Remove Member ─────────────────────────────────────────────────────

const removeMemberRoute = createRoute({
	method: "delete",
	path: "/{projectId}/members/{memberId}",
	tags: ["Project Members"],
	summary: "Remove a member from a project",
	description: "Only the project owner can remove members",
	request: {
		params: MemberIdParamsSchema,
	},
	responses: {
		204: {
			description: "Member removed",
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

projectMemberRoutes.openapi(removeMemberRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId, memberId } = c.req.valid("param");

	await getProjectWithAccess(projectId, currentUser.id, "owner");

	const member = await db.query.projectMember.findFirst({
		where: and(
			eq(projectMember.id, memberId),
			eq(projectMember.projectId, projectId),
		),
	});

	if (!member) {
		throw AppError.notFound("Member not found");
	}

	if (member.role === "owner") {
		throw AppError.badRequest("Cannot remove the project owner");
	}

	await db.delete(projectMember).where(eq(projectMember.id, memberId));

	return c.body(null, 204);
});

export { projectMemberRoutes };
