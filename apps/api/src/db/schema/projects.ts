import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

// ── Projects ─────────────────────────────────────────────────────────

export const project = pgTable(
	"project",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		ownerId: text("owner_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [index("project_owner_id_idx").on(table.ownerId)],
);

// ── Project Members (sharing) ────────────────────────────────────────

export const projectMember = pgTable(
	"project_member",
	{
		id: text("id").primaryKey(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: text("role").notNull().default("contributor"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("project_member_project_user_idx").on(
			table.projectId,
			table.userId,
		),
	],
);

// ── Posts ─────────────────────────────────────────────────────────────

export const post = pgTable(
	"post",
	{
		id: text("id").primaryKey(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		authorId: text("author_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		content: text("content").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("post_project_id_idx").on(table.projectId),
		index("post_author_id_idx").on(table.authorId),
	],
);

// ── Comments ─────────────────────────────────────────────────────────

export const comment = pgTable(
	"comment",
	{
		id: text("id").primaryKey(),
		postId: text("post_id")
			.notNull()
			.references(() => post.id, { onDelete: "cascade" }),
		authorId: text("author_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("comment_post_id_idx").on(table.postId),
		index("comment_author_id_idx").on(table.authorId),
	],
);

// ── Files ────────────────────────────────────────────────────────────

export const projectFile = pgTable(
	"project_file",
	{
		id: text("id").primaryKey(),
		projectId: text("project_id")
			.notNull()
			.references(() => project.id, { onDelete: "cascade" }),
		uploaderId: text("uploader_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		filename: text("filename").notNull(),
		storagePath: text("storage_path").notNull(),
		mimeType: text("mime_type").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("project_file_project_id_idx").on(table.projectId),
		index("project_file_uploader_id_idx").on(table.uploaderId),
	],
);

// ── Notifications ────────────────────────────────────────────────────

export const notification = pgTable(
	"notification",
	{
		id: text("id").primaryKey(),
		recipientId: text("recipient_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		actorId: text("actor_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		projectId: text("project_id").references(() => project.id, {
			onDelete: "cascade",
		}),
		postId: text("post_id").references(() => post.id, {
			onDelete: "cascade",
		}),
		commentId: text("comment_id").references(() => comment.id, {
			onDelete: "cascade",
		}),
		message: text("message").notNull(),
		read: boolean("read").notNull().default(false),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("notification_recipient_id_idx").on(table.recipientId),
		index("notification_recipient_read_idx").on(table.recipientId, table.read),
		index("notification_actor_id_idx").on(table.actorId),
	],
);
