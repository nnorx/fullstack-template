import { describe, expect, it, vi } from "vitest";
import { AppError } from "./errors.ts";

// Mock the db module before importing the function under test
vi.mock("../db/index.ts", () => ({
	db: {
		query: {
			project: {
				findFirst: vi.fn(),
			},
			projectMember: {
				findFirst: vi.fn(),
			},
		},
	},
}));

// Import after mocking
const { db } = await import("../db/index.ts");
const { getProjectWithAccess } = await import("./project-auth.ts");

const mockProjectFind = vi.mocked(db.query.project.findFirst);
const mockMemberFind = vi.mocked(db.query.projectMember.findFirst);

const fakeProject = {
	id: "proj-1",
	name: "Test",
	description: null,
	ownerId: "user-owner",
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("getProjectWithAccess", () => {
	it("throws notFound when project does not exist", async () => {
		mockProjectFind.mockResolvedValue(undefined);

		await expect(getProjectWithAccess("proj-1", "user-1")).rejects.toThrow(
			AppError,
		);

		try {
			await getProjectWithAccess("proj-1", "user-1");
		} catch (err) {
			expect(err).toBeInstanceOf(AppError);
			expect((err as AppError).statusCode).toBe(404);
		}
	});

	it("returns owner role when user is the project owner", async () => {
		mockProjectFind.mockResolvedValue(fakeProject);

		const result = await getProjectWithAccess("proj-1", "user-owner");

		expect(result.role).toBe("owner");
		expect(result.project.id).toBe("proj-1");
		expect(mockMemberFind).not.toHaveBeenCalled();
	});

	it("returns contributor role for a project member", async () => {
		mockProjectFind.mockResolvedValue(fakeProject);
		mockMemberFind.mockResolvedValue({
			id: "member-1",
			projectId: "proj-1",
			userId: "user-contrib",
			role: "contributor",
			createdAt: new Date(),
		});

		const result = await getProjectWithAccess("proj-1", "user-contrib");

		expect(result.role).toBe("contributor");
	});

	it("throws notFound when user is not a member", async () => {
		mockProjectFind.mockResolvedValue(fakeProject);
		mockMemberFind.mockResolvedValue(undefined);

		try {
			await getProjectWithAccess("proj-1", "user-nobody");
		} catch (err) {
			expect(err).toBeInstanceOf(AppError);
			expect((err as AppError).statusCode).toBe(404);
		}
	});

	it("throws forbidden when contributor requests owner-only access", async () => {
		mockProjectFind.mockResolvedValue(fakeProject);
		mockMemberFind.mockResolvedValue({
			id: "member-1",
			projectId: "proj-1",
			userId: "user-contrib",
			role: "contributor",
			createdAt: new Date(),
		});

		try {
			await getProjectWithAccess("proj-1", "user-contrib", "owner");
		} catch (err) {
			expect(err).toBeInstanceOf(AppError);
			expect((err as AppError).statusCode).toBe(403);
		}
	});

	it("allows owner when requiredRole is owner", async () => {
		mockProjectFind.mockResolvedValue(fakeProject);

		const result = await getProjectWithAccess("proj-1", "user-owner", "owner");

		expect(result.role).toBe("owner");
	});
});
