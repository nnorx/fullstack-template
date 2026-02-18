import { expect, test } from "@playwright/test";

test.describe("Register", () => {
	test("shows registration form", async ({ page }) => {
		await page.goto("/register");
		await expect(
			page.getByRole("heading", { name: "Create an account" }),
		).toBeVisible();
		await expect(page.getByLabel("Name")).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Create Account" }),
		).toBeVisible();
	});

	test("registers a new user and redirects to dashboard", async ({ page }) => {
		const unique = Date.now();
		await page.goto("/register");
		await page.getByLabel("Name").fill(`E2E User ${unique}`);
		await page.getByLabel("Email").fill(`e2e-${unique}@example.com`);
		await page.getByLabel("Password").fill("TestPassword1!");
		await page.getByRole("button", { name: "Create Account" }).click();
		await page.waitForURL("/dashboard");
		await expect(
			page.getByText(`Welcome back, E2E User ${unique}`),
		).toBeVisible();
	});

	test("shows validation errors for weak password", async ({ page }) => {
		await page.goto("/register");
		await page.getByLabel("Name").fill("Test");
		await page.getByLabel("Email").fill("test-weak@example.com");
		await page.getByLabel("Password").fill("short");
		await page.getByRole("button", { name: "Create Account" }).click();
		await expect(page.getByRole("alert")).toBeVisible();
	});

	test("navigates to login page", async ({ page }) => {
		await page.goto("/register");
		await page.getByRole("link", { name: "Sign in" }).click();
		await expect(page).toHaveURL(/\/login/);
		await expect(
			page.getByRole("heading", { name: "Welcome back" }),
		).toBeVisible();
	});
});
