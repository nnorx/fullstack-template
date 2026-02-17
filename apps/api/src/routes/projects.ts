import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { count, desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { project, projectMember } from "../db/schema/projects.ts";
import {
	buildPagination,
	ErrorResponseSchema,
	PaginationMetaSchema,
} from "../lib/api-schemas.ts";
import { AppError } from "../lib/errors.ts";
import { getProjectWithAccess } from "../lib/project-auth.ts";
import type { AuthEnv } from "../middleware/auth.ts";
import { requireAuth } from "../middleware/auth.ts";
import { commentRoutes } from "./comments.ts";
import { fileRoutes } from "./files.ts";
import { postRoutes } from "./posts.ts";
import { projectMemberRoutes } from "./project-members.ts";

const projectRoutes = new OpenAPIHono<AuthEnv>();

// All project routes require authentication
projectRoutes.use("*", requireAuth);

// ── Response Schemas ──────────────────────────────────────────────────

const ProjectSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		ownerId: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
		role: z.enum(["owner", "contributor"]),
	})
	.openapi("Project");

const ProjectListSchema = z
	.object({
		data: z.array(ProjectSchema),
		pagination: PaginationMetaSchema,
	})
	.openapi("ProjectList");

// ── Request Schemas ───────────────────────────────────────────────────

const ProjectIdParamsSchema = z.object({
	projectId: z.string().min(1),
});

const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

const CreateProjectBodySchema = z
	.object({
		name: z.string().min(1).max(200),
		description: z.string().max(2000).optional(),
	})
	.openapi("CreateProjectBody");

const UpdateProjectBodySchema = z
	.object({
		name: z.string().min(1).max(200).optional(),
		description: z.string().max(2000).optional(),
	})
	.openapi("UpdateProjectBody");

// ── Create Project ────────────────────────────────────────────────────

const createProjectRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Projects"],
	summary: "Create a project",
	request: {
		body: {
			content: {
				"application/json": { schema: CreateProjectBodySchema },
			},
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: ProjectSchema } },
			description: "Project created",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
	},
});

projectRoutes.openapi(createProjectRoute, async (c) => {
	const user = c.get("user");
	const body = c.req.valid("json");

	const id = crypto.randomUUID();
	const now = new Date();

	await db.insert(project).values({
		id,
		name: body.name,
		description: body.description ?? null,
		ownerId: user.id,
		createdAt: now,
		updatedAt: now,
	});

	// Add owner as a member
	await db.insert(projectMember).values({
		id: crypto.randomUUID(),
		projectId: id,
		userId: user.id,
		role: "owner",
	});

	return c.json(
		{
			id,
			name: body.name,
			description: body.description ?? null,
			ownerId: user.id,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
			role: "owner" as const,
		},
		201,
	);
});

// ── List Projects ─────────────────────────────────────────────────────

const listProjectsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Projects"],
	summary: "List projects",
	description: "Lists projects the user owns or has been shared with",
	request: {
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: ProjectListSchema } },
			description: "List of projects",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
	},
});

projectRoutes.openapi(listProjectsRoute, async (c) => {
	const user = c.get("user");
	const { page, limit } = c.req.valid("query");
	const offset = (page - 1) * limit;

	// Query through project_member (owner is always a member with role "owner")
	const [rows, countResult] = await Promise.all([
		db
			.select({
				id: project.id,
				name: project.name,
				description: project.description,
				ownerId: project.ownerId,
				createdAt: project.createdAt,
				updatedAt: project.updatedAt,
				role: projectMember.role,
			})
			.from(projectMember)
			.innerJoin(project, eq(project.id, projectMember.projectId))
			.where(eq(projectMember.userId, user.id))
			.orderBy(desc(project.updatedAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(projectMember)
			.where(eq(projectMember.userId, user.id)),
	]);

	const data = rows.map((row) => ({
		...row,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		role: row.role as "owner" | "contributor",
	}));

	const total = countResult[0]?.total ?? 0;

	return c.json({ data, pagination: buildPagination(page, limit, total) }, 200);
});

// ── Get Project ───────────────────────────────────────────────────────

const getProjectRoute = createRoute({
	method: "get",
	path: "/{projectId}",
	tags: ["Projects"],
	summary: "Get a project",
	request: {
		params: ProjectIdParamsSchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: ProjectSchema } },
			description: "Project details",
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

projectRoutes.openapi(getProjectRoute, async (c) => {
	const user = c.get("user");
	const { projectId } = c.req.valid("param");

	const { project: found, role } = await getProjectWithAccess(
		projectId,
		user.id,
	);

	return c.json(
		{
			id: found.id,
			name: found.name,
			description: found.description,
			ownerId: found.ownerId,
			createdAt: found.createdAt.toISOString(),
			updatedAt: found.updatedAt.toISOString(),
			role,
		},
		200,
	);
});

// ── Update Project ────────────────────────────────────────────────────

const updateProjectRoute = createRoute({
	method: "patch",
	path: "/{projectId}",
	tags: ["Projects"],
	summary: "Update a project",
	description: "Only the project owner can update a project",
	request: {
		params: ProjectIdParamsSchema,
		body: {
			content: {
				"application/json": { schema: UpdateProjectBodySchema },
			},
		},
	},
	responses: {
		200: {
			content: { "application/json": { schema: ProjectSchema } },
			description: "Project updated",
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

projectRoutes.openapi(updateProjectRoute, async (c) => {
	const user = c.get("user");
	const { projectId } = c.req.valid("param");
	const body = c.req.valid("json");

	await getProjectWithAccess(projectId, user.id, "owner");

	const updated = await db
		.update(project)
		.set({ ...body, updatedAt: new Date() })
		.where(eq(project.id, projectId))
		.returning();

	const result = updated[0];
	if (!result) {
		throw AppError.notFound("Project not found");
	}

	return c.json(
		{
			id: result.id,
			name: result.name,
			description: result.description,
			ownerId: result.ownerId,
			createdAt: result.createdAt.toISOString(),
			updatedAt: result.updatedAt.toISOString(),
			role: "owner" as const,
		},
		200,
	);
});

// ── Delete Project ────────────────────────────────────────────────────

const deleteProjectRoute = createRoute({
	method: "delete",
	path: "/{projectId}",
	tags: ["Projects"],
	summary: "Delete a project",
	description: "Only the project owner can delete a project",
	request: {
		params: ProjectIdParamsSchema,
	},
	responses: {
		204: {
			description: "Project deleted",
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

projectRoutes.openapi(deleteProjectRoute, async (c) => {
	const user = c.get("user");
	const { projectId } = c.req.valid("param");

	await getProjectWithAccess(projectId, user.id, "owner");

	await db.delete(project).where(eq(project.id, projectId));

	return c.body(null, 204);
});

// ── Compose Sub-Routes ────────────────────────────────────────────────

projectRoutes.route("/", projectMemberRoutes);
projectRoutes.route("/", postRoutes);
projectRoutes.route("/", commentRoutes);
projectRoutes.route("/", fileRoutes);

export { projectRoutes };
