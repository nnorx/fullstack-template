import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { user } from "../db/schema/auth.ts";
import { notification } from "../db/schema/projects.ts";
import {
	buildPagination,
	ErrorResponseSchema,
	PaginationMetaSchema,
} from "../lib/api-schemas.ts";
import { AppError } from "../lib/errors.ts";
import type { AuthEnv } from "../middleware/auth.ts";
import { requireAuth } from "../middleware/auth.ts";

const notificationRoutes = new OpenAPIHono<AuthEnv>();
notificationRoutes.use("*", requireAuth);

// ── Schemas ───────────────────────────────────────────────────────────

const NotificationSchema = z
	.object({
		id: z.string(),
		type: z.string(),
		message: z.string(),
		read: z.boolean(),
		projectId: z.string().nullable(),
		postId: z.string().nullable(),
		createdAt: z.string(),
		actorName: z.string(),
	})
	.openapi("Notification");

const NotificationListSchema = z
	.object({
		data: z.array(NotificationSchema),
		pagination: PaginationMetaSchema,
	})
	.openapi("NotificationList");

const UnreadCountSchema = z
	.object({
		count: z.number(),
	})
	.openapi("UnreadCount");

const PaginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

const NotificationIdParamsSchema = z.object({
	notificationId: z.string().min(1),
});

// ── List Notifications ────────────────────────────────────────────────

const listNotificationsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Notifications"],
	summary: "List notifications",
	request: {
		query: PaginationQuerySchema,
	},
	responses: {
		200: {
			content: { "application/json": { schema: NotificationListSchema } },
			description: "List of notifications",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
	},
});

notificationRoutes.openapi(listNotificationsRoute, async (c) => {
	const currentUser = c.get("user");
	const { page, limit } = c.req.valid("query");
	const offset = (page - 1) * limit;

	const [rows, countResult] = await Promise.all([
		db
			.select({
				id: notification.id,
				type: notification.type,
				message: notification.message,
				read: notification.read,
				projectId: notification.projectId,
				postId: notification.postId,
				createdAt: notification.createdAt,
				actorName: user.name,
			})
			.from(notification)
			.innerJoin(user, eq(user.id, notification.actorId))
			.where(eq(notification.recipientId, currentUser.id))
			.orderBy(desc(notification.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ total: count() })
			.from(notification)
			.where(eq(notification.recipientId, currentUser.id)),
	]);
	const total = countResult[0]?.total ?? 0;

	const data = rows.map((row) => ({
		...row,
		createdAt: row.createdAt.toISOString(),
	}));

	return c.json({ data, pagination: buildPagination(page, limit, total) }, 200);
});

// ── Unread Count ──────────────────────────────────────────────────────

const unreadCountRoute = createRoute({
	method: "get",
	path: "/unread-count",
	tags: ["Notifications"],
	summary: "Get unread notification count",
	responses: {
		200: {
			content: { "application/json": { schema: UnreadCountSchema } },
			description: "Unread count",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
	},
});

notificationRoutes.openapi(unreadCountRoute, async (c) => {
	const currentUser = c.get("user");

	const result = await db
		.select({ total: count() })
		.from(notification)
		.where(
			and(
				eq(notification.recipientId, currentUser.id),
				eq(notification.read, false),
			),
		);
	const total = result[0]?.total ?? 0;

	return c.json({ count: total }, 200);
});

// ── Mark as Read ──────────────────────────────────────────────────────

const markAsReadRoute = createRoute({
	method: "patch",
	path: "/{notificationId}/read",
	tags: ["Notifications"],
	summary: "Mark a notification as read",
	request: {
		params: NotificationIdParamsSchema,
	},
	responses: {
		204: {
			description: "Marked as read",
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

notificationRoutes.openapi(markAsReadRoute, async (c) => {
	const currentUser = c.get("user");
	const { notificationId } = c.req.valid("param");

	const found = await db.query.notification.findFirst({
		where: and(
			eq(notification.id, notificationId),
			eq(notification.recipientId, currentUser.id),
		),
	});

	if (!found) {
		throw AppError.notFound("Notification not found");
	}

	await db
		.update(notification)
		.set({ read: true })
		.where(eq(notification.id, notificationId));

	return c.body(null, 204);
});

// ── Mark All as Read ──────────────────────────────────────────────────

const markAllAsReadRoute = createRoute({
	method: "post",
	path: "/mark-all-read",
	tags: ["Notifications"],
	summary: "Mark all notifications as read",
	responses: {
		204: {
			description: "All marked as read",
		},
		401: {
			content: { "application/json": { schema: ErrorResponseSchema } },
			description: "Unauthorized",
		},
	},
});

notificationRoutes.openapi(markAllAsReadRoute, async (c) => {
	const currentUser = c.get("user");

	await db
		.update(notification)
		.set({ read: true })
		.where(
			and(
				eq(notification.recipientId, currentUser.id),
				eq(notification.read, false),
			),
		);

	return c.body(null, 204);
});

export { notificationRoutes };
