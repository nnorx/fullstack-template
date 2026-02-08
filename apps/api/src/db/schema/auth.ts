import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

/**
 * Better Auth schema tables.
 * These tables are managed by Better Auth and should not be modified manually.
 * See: https://www.better-auth.com/docs/concepts/database
 */

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: text("role").notNull().default("user"),
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

/** @public */
export const member = pgTable("member", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	role: text("role").notNull().default("member"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** @public */
export const invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	organizationId: text("organization_id").notNull(),
	email: text("email").notNull(),
	role: text("role").notNull().default("member"),
	status: text("status").notNull().default("pending"),
	expiresAt: timestamp("expires_at").notNull(),
	inviterId: text("inviter_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

/** @public */
export const organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").unique(),
	logo: text("logo"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	metadata: text("metadata"),
});

/** @public */
export const jwks = pgTable("jwks", {
	id: text("id").primaryKey(),
	publicKey: text("public_key").notNull(),
	privateKey: text("private_key").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** @public */
export const role = pgTable("role", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	organizationId: text("organization_id"),
	permissions: text("permissions"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at"),
});

/** @public */
export const permission = pgTable("permission", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at"),
});

/** @public */
export const rolePermission = pgTable("role_permission", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	roleId: text("role_id")
		.notNull()
		.references(() => role.id, { onDelete: "cascade" }),
	permissionId: text("permission_id")
		.notNull()
		.references(() => permission.id, { onDelete: "cascade" }),
});
