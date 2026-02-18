import { expect, test as setup } from "@playwright/test";
import {
	ADMIN_STORAGE_STATE,
	SEED_ADMIN,
	SEED_USER,
	USER_STORAGE_STATE,
} from "../fixtures/auth";

setup("authenticate as user", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill(SEED_USER.email);
	await page.getByLabel("Password").fill(SEED_USER.password);
	await page.getByRole("button", { name: "Sign In" }).click();
	await page.waitForURL("/dashboard");
	await expect(page.getByText(`Welcome back, ${SEED_USER.name}`)).toBeVisible();
	await page.context().storageState({ path: USER_STORAGE_STATE });
});

setup("authenticate as admin", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill(SEED_ADMIN.email);
	await page.getByLabel("Password").fill(SEED_ADMIN.password);
	await page.getByRole("button", { name: "Sign In" }).click();
	await page.waitForURL("/dashboard");
	await expect(
		page.getByText(`Welcome back, ${SEED_ADMIN.name}`),
	).toBeVisible();
	await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
