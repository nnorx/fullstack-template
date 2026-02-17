import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, eq } from "drizzle-orm";
import { bodyLimit } from "hono/body-limit";
import { db } from "../db/index.ts";
import { user } from "../db/schema/auth.ts";
import { projectFile } from "../db/schema/projects.ts";
import {
	buildPagination,
	ErrorResponseSchema,
	PaginationMetaSchema,
} from "../lib/api-schemas.ts";
import { AppError } from "../lib/errors.ts";
import { getProjectWithAccess } from "../lib/project-auth.ts";
import {
	deleteFile,
	getAbsolutePath,
	isAllowedMimeType,
	isWithinSizeLimit,
	saveFile,
} from "../lib/storage.ts";
import type { AuthEnv } from "../middleware/auth.ts";
import { requireAuth } from "../middleware/auth.ts";

const fileRoutes = new OpenAPIHono<AuthEnv>();

// ── Schemas ───────────────────────────────────────────────────────────

const FileSchema = z
	.object({
		id: z.string(),
		projectId: z.string(),
		uploaderId: z.string(),
		filename: z.string(),
		mimeType: z.string(),
		sizeBytes: z.number(),
		createdAt: z.string(),
		uploaderName: z.string(),
	})
	.openapi("ProjectFile");

const FileListSchema = z
	.object({
		data: z.array(FileSchema),
		pagination: PaginationMetaSchema,
	})
	.openapi("FileList");

const ProjectIdParamsSchema = z.object({
	projectId: z.string().min(1),
});

const FileIdParamsSchema = z.object({
	projectId: z.string().min(1),
	fileId: z.string().min(1),
});

const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Upload File ───────────────────────────────────────────────────────

const uploadFileRoute = createRoute({
	method: "post",
	path: "/{projectId}/files",
	tags: ["Files"],
	summary: "Upload a file to a project",
	description: "Accepts image files up to 10MB (JPEG, PNG, GIF, WebP, SVG)",
	request: {
		params: ProjectIdParamsSchema,
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						file: z
							.instanceof(File)
							.openapi({ type: "string", format: "binary" }),
					}),
				},
			},
		},
	},
	responses: {
		201: {
			content: { "application/json": { schema: FileSchema } },
			description: "File uploaded",
		},
		400: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Invalid file type or size",
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

fileRoutes.use("/:projectId/files", bodyLimit({ maxSize: 10 * 1024 * 1024 }));

fileRoutes.openapi(uploadFileRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId } = c.req.valid("param");

	await getProjectWithAccess(projectId, currentUser.id);

	const body = await c.req.parseBody();
	const file = body.file;

	if (!(file instanceof File)) {
		throw AppError.badRequest("No file provided");
	}

	if (!isAllowedMimeType(file.type)) {
		throw AppError.badRequest(
			"Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG",
		);
	}

	if (!isWithinSizeLimit(file.size)) {
		throw AppError.badRequest("File too large. Maximum size is 10MB");
	}

	const id = crypto.randomUUID();
	const arrayBuffer = await file.arrayBuffer();
	const { storagePath, sizeBytes } = await saveFile(
		projectId,
		id,
		file.type,
		arrayBuffer,
	);

	const now = new Date();
	await db.insert(projectFile).values({
		id,
		projectId,
		uploaderId: currentUser.id,
		filename: file.name,
		storagePath,
		mimeType: file.type,
		sizeBytes,
		createdAt: now,
	});

	return c.json(
		{
			id,
			projectId,
			uploaderId: currentUser.id,
			filename: file.name,
			mimeType: file.type,
			sizeBytes,
			createdAt: now.toISOString(),
			uploaderName: currentUser.name,
		},
		201,
	);
});

// ── List Files ────────────────────────────────────────────────────────

const listFilesRoute = createRoute({
	method: "get",
	path: "/{projectId}/files",
	tags: ["Files"],
	summary: "List files in a project",
	request: {
		params: ProjectIdParamsSchema,
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: FileListSchema } },
			description: "List of files",
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

fileRoutes.openapi(listFilesRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId } = c.req.valid("param");
	const { page, limit } = c.req.valid("query");
	const offset = (page - 1) * limit;

	await getProjectWithAccess(projectId, currentUser.id);

	const [rows, countResult] = await Promise.all([
		db
			.select({
				id: projectFile.id,
				projectId: projectFile.projectId,
				uploaderId: projectFile.uploaderId,
				filename: projectFile.filename,
				mimeType: projectFile.mimeType,
				sizeBytes: projectFile.sizeBytes,
				createdAt: projectFile.createdAt,
				uploaderName: user.name,
			})
			.from(projectFile)
			.innerJoin(user, eq(user.id, projectFile.uploaderId))
			.where(eq(projectFile.projectId, projectId))
			.orderBy(projectFile.createdAt)
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(projectFile)
			.where(eq(projectFile.projectId, projectId)),
	]);
	const total = countResult[0]?.total ?? 0;

	const data = rows.map((row) => ({
		...row,
		createdAt: row.createdAt.toISOString(),
	}));

	return c.json({ data, pagination: buildPagination(page, limit, total) }, 200);
});

// ── Delete File ───────────────────────────────────────────────────────

const deleteFileRoute = createRoute({
	method: "delete",
	path: "/{projectId}/files/{fileId}",
	tags: ["Files"],
	summary: "Delete a file",
	description: "Uploader or project owner can delete",
	request: {
		params: FileIdParamsSchema,
	},
	responses: {
		204: {
			description: "File deleted",
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

fileRoutes.openapi(deleteFileRoute, async (c) => {
	const currentUser = c.get("user");
	const { projectId, fileId } = c.req.valid("param");

	const { role } = await getProjectWithAccess(projectId, currentUser.id);

	const found = await db.query.projectFile.findFirst({
		where: and(
			eq(projectFile.id, fileId),
			eq(projectFile.projectId, projectId),
		),
	});

	if (!found) {
		throw AppError.notFound("File not found");
	}

	if (found.uploaderId !== currentUser.id && role !== "owner") {
		throw AppError.forbidden(
			"Only the uploader or project owner can delete this file",
		);
	}

	await deleteFile(found.storagePath);
	await db.delete(projectFile).where(eq(projectFile.id, fileId));

	return c.body(null, 204);
});

export { fileRoutes };

// ── Download Route (mounted separately) ───────────────────────────────

const fileDownloadRoutes = new OpenAPIHono<AuthEnv>();
fileDownloadRoutes.use("*", requireAuth);

const DownloadParamsSchema = z.object({
	fileId: z.string().min(1),
});

const downloadFileRoute = createRoute({
	method: "get",
	path: "/{fileId}/download",
	tags: ["Files"],
	summary: "Download a file",
	request: {
		params: DownloadParamsSchema,
	},
	responses: {
		200: {
			description: "File content",
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

fileDownloadRoutes.openapi(downloadFileRoute, async (c) => {
	const currentUser = c.get("user");
	const { fileId } = c.req.valid("param");

	const found = await db.query.projectFile.findFirst({
		where: eq(projectFile.id, fileId),
	});

	if (!found) {
		throw AppError.notFound("File not found");
	}

	// Verify the user has access to the project
	await getProjectWithAccess(found.projectId, currentUser.id);

	const absPath = getAbsolutePath(found.storagePath);

	try {
		await import("node:fs/promises").then((fs) => fs.access(absPath));
	} catch {
		throw AppError.notFound("File not found on disk");
	}

	const { createReadStream } = await import("node:fs");
	const nodeStream = createReadStream(absPath);
	const webStream = new ReadableStream({
		start(controller) {
			nodeStream.on("data", (chunk: Buffer) =>
				controller.enqueue(new Uint8Array(chunk)),
			);
			nodeStream.on("end", () => controller.close());
			nodeStream.on("error", (err) => controller.error(err));
		},
		cancel() {
			nodeStream.destroy();
		},
	});

	return new Response(webStream, {
		headers: {
			"Content-Type": found.mimeType,
			"Content-Disposition": `inline; filename="${found.filename}"`,
			"Cache-Control": "private, max-age=86400",
		},
	});
});

export { fileDownloadRoutes };
