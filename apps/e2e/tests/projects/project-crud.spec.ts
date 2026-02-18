// ────────────────────────────────────────────────────────────────────────────
// REPLACEABLE: These tests cover the example "Projects" domain.
// When you fork this template and replace the projects feature with your own,
// delete this file and write E2E tests for your domain following the same
// patterns. See tests/auth/ for examples of permanent (non-replaceable) tests.
// ────────────────────────────────────────────────────────────────────────────

import { expect, test } from "../../fixtures/auth";

test.describe("Projects", () => {
	test("lists seeded projects on the projects page", async ({ page }) => {
		await page.goto("/projects");
		await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
		await expect(page.getByText("Demo Project")).toBeVisible();
	});

	test("creates a new project", async ({ page }) => {
		const projectName = `E2E Project ${Date.now()}`;
		await page.goto("/projects/new");
		await expect(page.getByLabel("Name")).toBeVisible();
		await page.getByLabel("Name").fill(projectName);
		await page.getByLabel("Description").fill("Created by Playwright E2E test");
		await page.getByRole("button", { name: "Create Project" }).click();
		// Should navigate to the new project's detail page
		await expect(page.getByText(projectName)).toBeVisible();
	});

	test("navigates from project list to project detail", async ({ page }) => {
		await page.goto("/projects");
		await page.getByText("Demo Project").click();
		await expect(page.getByText("Demo Project")).toBeVisible();
	});
});
