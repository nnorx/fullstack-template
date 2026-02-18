import { expect, test } from "../../fixtures/auth";

test.describe("Dashboard", () => {
	test("shows user info on the dashboard", async ({ page }) => {
		await page.goto("/dashboard");
		await expect(
			page.getByRole("heading", { name: "Dashboard" }),
		).toBeVisible();
		await expect(page.getByText("Welcome back,")).toBeVisible();
	});

	test("displays account email", async ({ page }) => {
		await page.goto("/dashboard");
		await expect(page.getByText("user@example.com")).toBeVisible();
	});

	test("shows API health status", async ({ page }) => {
		await page.goto("/dashboard");
		await expect(page.getByText("API Status")).toBeVisible();
		await expect(page.getByText("Healthy")).toBeVisible({ timeout: 10_000 });
	});

	test("navbar shows authenticated navigation links", async ({ page }) => {
		await page.goto("/dashboard");
		await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
		await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
	});
});
