import { and, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { project, projectMember } from "../db/schema/projects.ts";
import { AppError } from "./errors.ts";

type ProjectAccess = {
	project: typeof project.$inferSelect;
	role: "owner" | "contributor";
};

/**
 * Verify the user has access to a project and return their role.
 *
 * Returns the project and the user's role ("owner" or "contributor").
 * Throws `AppError.notFound()` if the project doesn't exist or the user
 * has no access (avoids leaking project existence).
 * Throws `AppError.forbidden()` if `requiredRole` is "owner" and the user is not.
 */
export async function getProjectWithAccess(
	projectId: string,
	userId: string,
	requiredRole?: "owner",
): Promise<ProjectAccess> {
	const found = await db.query.project.findFirst({
		where: eq(project.id, projectId),
	});

	if (!found) {
		throw AppError.notFound("Project not found");
	}

	// Owner always has access
	if (found.ownerId === userId) {
		return { project: found, role: "owner" };
	}

	// Check membership
	const membership = await db.query.projectMember.findFirst({
		where: and(
			eq(projectMember.projectId, projectId),
			eq(projectMember.userId, userId),
		),
	});

	if (!membership) {
		throw AppError.notFound("Project not found");
	}

	if (requiredRole === "owner") {
		throw AppError.forbidden("Only the project owner can perform this action");
	}

	return { project: found, role: "contributor" };
}
