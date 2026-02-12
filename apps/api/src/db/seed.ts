import { eq } from "drizzle-orm";
import { auth } from "../lib/auth.ts";
import { db } from "./index.ts";
import { member, organization, user } from "./schema/auth.ts";

// ── Seed credentials (for local development only) ───────────────────

const SEED_ADMIN = {
	name: "Admin",
	email: "admin@example.com",
	password: "password",
} as const;

const SEED_USER = {
	name: "Test User",
	email: "user@example.com",
	password: "password",
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

// ── Main ────────────────────────────────────────────────────────────

async function seed() {
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
