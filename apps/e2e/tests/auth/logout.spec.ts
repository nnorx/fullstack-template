import { expect, test } from "@playwright/test";
import { SEED_USER } from "../../fixtures/auth";

test.describe("Logout", () => {
	test("logs out via navbar and redirects away from authenticated pages", async ({
		page,
	}) => {
		// First log in
		await page.goto("/login");
		await page.getByLabel("Email").fill(SEED_USER.email);
		await page.getByLabel("Password").fill(SEED_USER.password);
		await page.getByRole("button", { name: "Sign In" }).click();
		await page.waitForURL("/dashboard");

		// Verify we're authenticated — user name visible in navbar
		const navbar = page.locator("header");
		await expect(navbar.getByText(SEED_USER.name)).toBeVisible();

		// Click Sign Out
		await page.getByRole("button", { name: "Sign Out" }).click();

		// Should no longer see the user name in the navbar
		await expect(navbar.getByText(SEED_USER.name)).not.toBeVisible();

		// Navbar should show Sign In / Sign Up links
		await expect(navbar.getByRole("link", { name: "Sign In" })).toBeVisible();
	});
});
