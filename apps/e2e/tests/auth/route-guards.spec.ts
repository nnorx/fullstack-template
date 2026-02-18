import { expect, test } from "@playwright/test";

test.describe("Route Guards", () => {
	test("unauthenticated user is redirected from /dashboard to /login", async ({
		page,
	}) => {
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/login/);
	});

	test("unauthenticated user is redirected from /projects to /login", async ({
		page,
	}) => {
		await page.goto("/projects");
		await expect(page).toHaveURL(/\/login/);
	});

	test("redirect includes the original path so user returns after login", async ({
		page,
	}) => {
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/login.*redirect/);
	});
});
