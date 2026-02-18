import path from "node:path";
import { test as base, type Page } from "@playwright/test";

// Seed credentials — must match apps/api/src/db/seed.ts
export const SEED_ADMIN = {
	name: "Admin",
	email: "admin@example.com",
	password: "TestPassword1!",
} as const;

export const SEED_USER = {
	name: "Test User",
	email: "user@example.com",
	password: "TestPassword1!",
} as const;

// Storage state paths
const AUTH_DIR = path.join(import.meta.dirname, "..", ".auth");
export const USER_STORAGE_STATE = path.join(AUTH_DIR, "user.json");
export const ADMIN_STORAGE_STATE = path.join(AUTH_DIR, "admin.json");

// Extend the base test with authenticated page fixtures
type AuthFixtures = {
	adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
	adminPage: async ({ browser }, use) => {
		const context = await browser.newContext({
			storageState: ADMIN_STORAGE_STATE,
		});
		const page = await context.newPage();
		await use(page);
		await context.close();
	},
});

export { expect } from "@playwright/test";
