import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import { auth } from "./auth.ts";
import { logger } from "./logger.ts";

const wss = new WebSocketServer({ noServer: true });

// Track connected clients by userId → Set<WebSocket>
const clients = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws: WebSocket, userId: string) => {
	if (!clients.has(userId)) {
		clients.set(userId, new Set());
	}
	clients.get(userId)?.add(ws);

	ws.on("close", () => {
		const userSockets = clients.get(userId);
		if (userSockets) {
			userSockets.delete(ws);
			if (userSockets.size === 0) {
				clients.delete(userId);
			}
		}
	});

	ws.on("error", () => {
		ws.close();
	});
});

export async function handleUpgrade(
	request: IncomingMessage,
	socket: Duplex,
	head: Buffer,
) {
	try {
		// Authenticate via session cookie
		const cookieHeader = request.headers.cookie ?? "";
		const headers = new Headers({ cookie: cookieHeader });
		const session = await auth.api.getSession({ headers });

		if (!session) {
			socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
			socket.destroy();
			return;
		}

		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit("connection", ws, session.user.id);
		});
	} catch (err) {
		logger.error({ err }, "WebSocket upgrade failed");
		socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
		socket.destroy();
	}
}

export function sendToUser(userId: string, payload: Record<string, unknown>) {
	const userSockets = clients.get(userId);
	if (!userSockets) return;

	const message = JSON.stringify(payload);
	for (const ws of userSockets) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	}
}

export function closeAllConnections() {
	for (const sockets of clients.values()) {
		for (const ws of sockets) {
			ws.close();
		}
	}
	clients.clear();
	wss.close();
}
