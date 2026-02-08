import { db } from "./index.ts";
import { user } from "./schema/index.ts";

async function seed() {
	console.log("Seeding database...");

	// Create a default admin user (password is managed by Better Auth)
	await db
		.insert(user)
		.values({
			id: "admin-001",
			name: "Admin",
			email: "admin@example.com",
			emailVerified: true,
			role: "admin",
		})
		.onConflictDoNothing();

	console.log("Seeding complete.");
	process.exit(0);
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
