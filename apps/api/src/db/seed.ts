import { and, eq } from "drizzle-orm";
import { auth } from "../lib/auth.ts";
import { env } from "../lib/env.ts";
import { db } from "./index.ts";
import { member, organization, user } from "./schema/auth.ts";
import { comment, post, project, projectMember } from "./schema/projects.ts";

// ── Seed credentials (for local development only) ───────────────────

const SEED_ADMIN = {
	name: "Admin",
	email: "admin@example.com",
	password: "TestPassword1!",
} as const;

const SEED_USER = {
	name: "Test User",
	email: "user@example.com",
	password: "TestPassword1!",
} as const;

const SEED_ORG = {
	id: "seed-org-001",
	name: "Acme Corp",
	slug: "acme-corp",
} as const;

// ── Helpers ─────────────────────────────────────────────────────────

async function findUserByEmail(email: string) {
	const rows = await db
		.select()
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	return rows[0] ?? null;
}

/** Create a user via Better Auth so the password is hashed and the account row is created. */
async function ensureUser(data: {
	name: string;
	email: string;
	password: string;
}) {
	const existing = await findUserByEmail(data.email);
	if (existing) {
		console.log(`  ✓ User "${data.email}" already exists`);
		return existing;
	}

	await auth.api.signUpEmail({ body: data });

	const created = await findUserByEmail(data.email);
	if (!created) {
		throw new Error(`Failed to create user "${data.email}"`);
	}

	console.log(`  + Created user "${data.email}"`);
	return created;
}

async function setRole(userId: string, newRole: string) {
	await db.update(user).set({ role: newRole }).where(eq(user.id, userId));
}

async function ensureOrganization(data: {
	id: string;
	name: string;
	slug: string;
}) {
	const rows = await db
		.select()
		.from(organization)
		.where(eq(organization.slug, data.slug))
		.limit(1);

	if (rows[0]) {
		console.log(`  ✓ Organization "${data.name}" already exists`);
		return rows[0];
	}

	const [created] = await db.insert(organization).values(data).returning();
	console.log(`  + Created organization "${data.name}"`);
	return created;
}

async function ensureMember(
	orgId: string,
	userId: string,
	role: string,
	label: string,
) {
	const rows = await db
		.select()
		.from(member)
		.where(eq(member.userId, userId))
		.limit(1);

	const existing = rows.find((m) => m.organizationId === orgId);
	if (existing) {
		console.log(`  ✓ ${label} is already a member`);
		return;
	}

	await db.insert(member).values({
		id: `seed-member-${userId}`,
		organizationId: orgId,
		userId,
		role,
	});
	console.log(`  + Added ${label} as "${role}"`);
}

// ── Project Helpers ─────────────────────────────────────────────────

async function ensureProject(
	id: string,
	name: string,
	description: string,
	ownerId: string,
) {
	const existing = await db.query.project.findFirst({
		where: eq(project.id, id),
	});
	if (existing) {
		console.log(`  ✓ Project "${name}" already exists`);
		return existing;
	}

	const [created] = await db
		.insert(project)
		.values({ id, name, description, ownerId })
		.returning();
	if (!created) {
		throw new Error(`Failed to create project "${name}"`);
	}
	console.log(`  + Created project "${name}"`);
	return created;
}

async function ensureProjectMember(
	projectId: string,
	userId: string,
	role: string,
) {
	const existing = await db.query.projectMember.findFirst({
		where: and(
			eq(projectMember.projectId, projectId),
			eq(projectMember.userId, userId),
		),
	});
	if (existing) return;

	await db.insert(projectMember).values({
		id: `seed-pm-${projectId}-${userId}`,
		projectId,
		userId,
		role,
	});
}

async function ensurePost(
	id: string,
	projectId: string,
	authorId: string,
	title: string,
	content: string,
) {
	const existing = await db.query.post.findFirst({
		where: eq(post.id, id),
	});
	if (existing) {
		console.log(`  ✓ Post "${title}" already exists`);
		return existing;
	}

	const [created] = await db
		.insert(post)
		.values({ id, projectId, authorId, title, content })
		.returning();
	if (!created) {
		throw new Error(`Failed to create post "${title}"`);
	}
	console.log(`  + Created post "${title}"`);
	return created;
}

async function ensureComment(
	id: string,
	postId: string,
	authorId: string,
	content: string,
) {
	const existing = await db.query.comment.findFirst({
		where: eq(comment.id, id),
	});
	if (existing) return;

	await db.insert(comment).values({ id, postId, authorId, content });
	console.log(`  + Created comment on post`);
}

// ── Main ────────────────────────────────────────────────────────────

async function seed() {
	// Prevent accidental seeding in production
	if (env.NODE_ENV === "production") {
		console.error(
			"❌ Cannot run seed script in production environment. Set NODE_ENV to development or test.",
		);
		process.exit(1);
	}

	console.log("\nSeeding database...\n");

	// 1. Create users via Better Auth (handles password hashing + account row)
	console.log("Users:");
	const adminUser = await ensureUser(SEED_ADMIN);
	await setRole(adminUser.id, "admin");
	console.log(`  ✓ Role set to "admin" for ${adminUser.email}\n`);

	const regularUser = await ensureUser(SEED_USER);
	console.log("");

	// 2. Create organization + memberships
	console.log("Organization:");
	const org = await ensureOrganization(SEED_ORG);

	if (org) {
		await ensureMember(org.id, adminUser.id, "owner", adminUser.name);
		await ensureMember(org.id, regularUser.id, "member", regularUser.name);
	}

	// 3. Create sample project with posts and comments
	console.log("\nProjects:");
	const sampleProject = await ensureProject(
		"seed-project-001",
		"Demo Project",
		"A sample project to demonstrate CRUD, sharing, posts, and comments.",
		adminUser.id,
	);

	await ensureProjectMember(sampleProject.id, adminUser.id, "owner");
	await ensureProjectMember(sampleProject.id, regularUser.id, "contributor");
	console.log(`  ✓ ${regularUser.name} added as contributor`);

	console.log("\nPosts:");
	const samplePost = await ensurePost(
		"seed-post-001",
		sampleProject.id,
		adminUser.id,
		"Welcome to the Demo Project",
		"This is the first post in the demo project. It demonstrates the posts feature within a project. Members can create posts and other members can comment on them.",
	);

	await ensureComment(
		"seed-comment-001",
		samplePost.id,
		regularUser.id,
		"Looks great! Excited to collaborate on this project.",
	);
	await ensureComment(
		"seed-comment-002",
		samplePost.id,
		adminUser.id,
		"Thanks! Feel free to add your own posts too.",
	);

	console.log("\n──────────────────────────────────────────");
	console.log("  Seed complete! Sign in with:\n");
	console.log(`  Admin:  ${SEED_ADMIN.email}`);
	console.log(`  User:   ${SEED_USER.email}`);
	console.log("\n  (see SEED_* constants in seed.ts for passwords)");
	console.log("──────────────────────────────────────────\n");

	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
