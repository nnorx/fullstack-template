import { db } from "../db/index.ts";
import { notification } from "../db/schema/projects.ts";
import { sendToUser } from "./ws.ts";

interface CreateNotificationParams {
	recipientId: string;
	actorId: string;
	type: string;
	projectId?: string;
	postId?: string;
	commentId?: string;
	message: string;
}

export async function createNotification(params: CreateNotificationParams) {
	const id = crypto.randomUUID();
	const now = new Date();

	await db.insert(notification).values({
		id,
		recipientId: params.recipientId,
		actorId: params.actorId,
		type: params.type,
		projectId: params.projectId ?? null,
		postId: params.postId ?? null,
		commentId: params.commentId ?? null,
		message: params.message,
		read: false,
		createdAt: now,
	});

	// Push via WebSocket
	sendToUser(params.recipientId, {
		type: "notification",
		data: {
			id,
			type: params.type,
			message: params.message,
			projectId: params.projectId,
			createdAt: now.toISOString(),
		},
	});
}
