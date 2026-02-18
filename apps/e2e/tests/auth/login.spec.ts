import { expect, test } from "@playwright/test";
import { SEED_USER } from "../../fixtures/auth";

test.describe("Login", () => {
	test("shows login form", async ({ page }) => {
		await page.goto("/login");
		await expect(
			page.getByRole("heading", { name: "Welcome back" }),
		).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
	});

	test("logs in with valid credentials and redirects to dashboard", async ({
		page,
	}) => {
		await page.goto("/login");
		await page.getByLabel("Email").fill(SEED_USER.email);
		await page.getByLabel("Password").fill(SEED_USER.password);
		await page.getByRole("button", { name: "Sign In" }).click();
		await page.waitForURL("/dashboard");
		await expect(
			page.getByText(`Welcome back, ${SEED_USER.name}`),
		).toBeVisible();
	});

	test("shows error for invalid credentials", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel("Email").fill("wrong@example.com");
		await page.getByLabel("Password").fill("WrongPassword1!");
		await page.getByRole("button", { name: "Sign In" }).click();
		await expect(page.getByRole("alert")).toBeVisible();
	});

	test("navigates to register page", async ({ page }) => {
		await page.goto("/login");
		await page.getByRole("link", { name: "Sign up" }).click();
		await expect(page).toHaveURL(/\/register/);
		await expect(
			page.getByRole("heading", { name: "Create an account" }),
		).toBeVisible();
	});

	test("redirects back to original page after login", async ({ page }) => {
		await page.goto("/projects");
		await expect(page).toHaveURL(/\/login/);
		await page.getByLabel("Email").fill(SEED_USER.email);
		await page.getByLabel("Password").fill(SEED_USER.password);
		await page.getByRole("button", { name: "Sign In" }).click();
		await page.waitForURL(/\/projects/);
	});
});
