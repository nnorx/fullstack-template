import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
	describe("hierarchy", () => {
		it("all keys are arrays starting with the domain name", () => {
			expect(queryKeys.auth.all).toEqual(["auth"]);
			expect(queryKeys.health.all).toEqual(["health"]);
			expect(queryKeys.projects.all).toEqual(["projects"]);
			expect(queryKeys.posts.all).toEqual(["posts"]);
			expect(queryKeys.comments.all).toEqual(["comments"]);
			expect(queryKeys.files.all).toEqual(["files"]);
			expect(queryKeys.notifications.all).toEqual(["notifications"]);
			expect(queryKeys.projectMembers.all).toEqual(["projectMembers"]);
		});

		it("derived keys start with their domain prefix", () => {
			expect(queryKeys.projects.list(1).slice(0, 1)).toEqual(["projects"]);
			expect(queryKeys.posts.list("p1", 1).slice(0, 1)).toEqual(["posts"]);
			expect(queryKeys.files.list("p1", 1).slice(0, 1)).toEqual(["files"]);
		});
	});

	describe("projects", () => {
		it("list includes page parameter", () => {
			expect(queryKeys.projects.list(1)).toEqual(["projects", "list", 1]);
			expect(queryKeys.projects.list(3)).toEqual(["projects", "list", 3]);
		});

		it("list without page includes undefined", () => {
			expect(queryKeys.projects.list()).toEqual([
				"projects",
				"list",
				undefined,
			]);
		});

		it("detail includes project id", () => {
			expect(queryKeys.projects.detail("abc")).toEqual([
				"projects",
				"detail",
				"abc",
			]);
		});
	});

	describe("posts", () => {
		it("list includes projectId and page", () => {
			expect(queryKeys.posts.list("p1", 2)).toEqual(["posts", "list", "p1", 2]);
		});

		it("detail includes projectId and postId", () => {
			expect(queryKeys.posts.detail("p1", "post-1")).toEqual([
				"posts",
				"detail",
				"p1",
				"post-1",
			]);
		});
	});

	describe("comments", () => {
		it("list includes projectId, postId, and page", () => {
			expect(queryKeys.comments.list("p1", "post-1", 1)).toEqual([
				"comments",
				"list",
				"p1",
				"post-1",
				1,
			]);
		});
	});

	describe("files", () => {
		it("list includes projectId and page", () => {
			expect(queryKeys.files.list("p1", 1)).toEqual(["files", "list", "p1", 1]);
		});
	});

	describe("notifications", () => {
		it("list includes page", () => {
			expect(queryKeys.notifications.list(1)).toEqual([
				"notifications",
				"list",
				1,
			]);
		});

		it("unreadCount is a fixed key", () => {
			expect(queryKeys.notifications.unreadCount()).toEqual([
				"notifications",
				"unreadCount",
			]);
		});
	});

	describe("prefix matching for invalidation", () => {
		it("posts.all is a prefix of posts.list", () => {
			const all = queryKeys.posts.all;
			const list = queryKeys.posts.list("p1", 1);
			expect(list.slice(0, all.length)).toEqual(all);
		});

		it("manually constructed prefix matches list keys", () => {
			const prefix = [...queryKeys.posts.all, "list", "p1"];
			const page1 = queryKeys.posts.list("p1", 1);
			const page2 = queryKeys.posts.list("p1", 2);
			expect(page1.slice(0, prefix.length)).toEqual(prefix);
			expect(page2.slice(0, prefix.length)).toEqual(prefix);
		});

		it("different projectIds do not match each other's prefix", () => {
			const prefixA = [...queryKeys.posts.all, "list", "p1"];
			const listB = queryKeys.posts.list("p2", 1);
			expect(listB.slice(0, prefixA.length)).not.toEqual(prefixA);
		});
	});
});
