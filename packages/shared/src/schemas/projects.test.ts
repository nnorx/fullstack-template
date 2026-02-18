import { describe, expect, it } from "vitest";
import {
	createCommentSchema,
	createPostSchema,
	createProjectSchema,
	paginationSchema,
	shareProjectSchema,
	updateProjectSchema,
} from "./projects";

describe("createProjectSchema", () => {
	it("accepts valid project", () => {
		const result = createProjectSchema.safeParse({ name: "My Project" });
		expect(result.success).toBe(true);
	});

	it("accepts project with description", () => {
		const result = createProjectSchema.safeParse({
			name: "My Project",
			description: "A description",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty name", () => {
		const result = createProjectSchema.safeParse({ name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects name longer than 200 characters", () => {
		const result = createProjectSchema.safeParse({
			name: "a".repeat(201),
		});
		expect(result.success).toBe(false);
	});

	it("accepts name at exactly 200 characters", () => {
		const result = createProjectSchema.safeParse({
			name: "a".repeat(200),
		});
		expect(result.success).toBe(true);
	});

	it("rejects description longer than 2000 characters", () => {
		const result = createProjectSchema.safeParse({
			name: "Test",
			description: "a".repeat(2001),
		});
		expect(result.success).toBe(false);
	});

	it("accepts description at exactly 2000 characters", () => {
		const result = createProjectSchema.safeParse({
			name: "Test",
			description: "a".repeat(2000),
		});
		expect(result.success).toBe(true);
	});
});

describe("updateProjectSchema", () => {
	it("accepts partial update with name only", () => {
		const result = updateProjectSchema.safeParse({ name: "Updated" });
		expect(result.success).toBe(true);
	});

	it("accepts partial update with description only", () => {
		const result = updateProjectSchema.safeParse({
			description: "New desc",
		});
		expect(result.success).toBe(true);
	});

	it("accepts empty object", () => {
		const result = updateProjectSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("rejects empty name string", () => {
		const result = updateProjectSchema.safeParse({ name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects name longer than 200 characters", () => {
		const result = updateProjectSchema.safeParse({
			name: "a".repeat(201),
		});
		expect(result.success).toBe(false);
	});
});

describe("createPostSchema", () => {
	it("accepts valid post", () => {
		const result = createPostSchema.safeParse({
			title: "Hello",
			content: "World",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty title", () => {
		const result = createPostSchema.safeParse({
			title: "",
			content: "Content",
		});
		expect(result.success).toBe(false);
	});

	it("rejects title longer than 300 characters", () => {
		const result = createPostSchema.safeParse({
			title: "a".repeat(301),
			content: "Content",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty content", () => {
		const result = createPostSchema.safeParse({
			title: "Title",
			content: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects content longer than 50000 characters", () => {
		const result = createPostSchema.safeParse({
			title: "Title",
			content: "a".repeat(50001),
		});
		expect(result.success).toBe(false);
	});
});

describe("createCommentSchema", () => {
	it("accepts valid comment", () => {
		const result = createCommentSchema.safeParse({ content: "Nice post!" });
		expect(result.success).toBe(true);
	});

	it("rejects empty content", () => {
		const result = createCommentSchema.safeParse({ content: "" });
		expect(result.success).toBe(false);
	});

	it("rejects content longer than 5000 characters", () => {
		const result = createCommentSchema.safeParse({
			content: "a".repeat(5001),
		});
		expect(result.success).toBe(false);
	});

	it("accepts content at exactly 5000 characters", () => {
		const result = createCommentSchema.safeParse({
			content: "a".repeat(5000),
		});
		expect(result.success).toBe(true);
	});
});

describe("shareProjectSchema", () => {
	it("accepts valid email", () => {
		const result = shareProjectSchema.safeParse({
			email: "user@example.com",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const result = shareProjectSchema.safeParse({ email: "not-an-email" });
		expect(result.success).toBe(false);
	});
});

describe("paginationSchema", () => {
	it("uses defaults when no input provided", () => {
		const result = paginationSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(1);
			expect(result.data.limit).toBe(20);
		}
	});

	it("coerces string values to numbers", () => {
		const result = paginationSchema.safeParse({ page: "3", limit: "10" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(3);
			expect(result.data.limit).toBe(10);
		}
	});

	it("rejects page of 0", () => {
		const result = paginationSchema.safeParse({ page: 0 });
		expect(result.success).toBe(false);
	});

	it("rejects negative page", () => {
		const result = paginationSchema.safeParse({ page: -1 });
		expect(result.success).toBe(false);
	});

	it("rejects limit of 0", () => {
		const result = paginationSchema.safeParse({ limit: 0 });
		expect(result.success).toBe(false);
	});

	it("rejects limit greater than 100", () => {
		const result = paginationSchema.safeParse({ limit: 101 });
		expect(result.success).toBe(false);
	});

	it("accepts limit at exactly 100", () => {
		const result = paginationSchema.safeParse({ limit: 100 });
		expect(result.success).toBe(true);
	});
});
