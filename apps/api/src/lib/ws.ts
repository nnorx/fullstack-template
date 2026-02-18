import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import { auth } from "./auth.ts";
import { logger } from "./logger.ts";

interface LiveWebSocket extends WebSocket {
	isAlive: boolean;
}

const wss = new WebSocketServer({ noServer: true });

// Track connected clients by userId → Set<LiveWebSocket>
const clients = new Map<string, Set<LiveWebSocket>>();

const PING_INTERVAL_MS = 30_000;

// Periodically ping all connected clients to detect stale connections.
// Clients that don't respond with a pong before the next ping are terminated.
const pingInterval = setInterval(() => {
	for (const sockets of clients.values()) {
		for (const ws of sockets) {
			if (!ws.isAlive) {
				ws.terminate();
				continue;
			}
			ws.isAlive = false;
			ws.ping();
		}
	}
}, PING_INTERVAL_MS);

// Clean up the interval if the server itself closes
wss.on("close", () => {
	clearInterval(pingInterval);
});

wss.on("connection", (raw: WebSocket, userId: string) => {
	const ws = raw as LiveWebSocket;
	ws.isAlive = true;

	ws.on("pong", () => {
		ws.isAlive = true;
	});

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
	clearInterval(pingInterval);
	for (const sockets of clients.values()) {
		for (const ws of sockets) {
			ws.close();
		}
	}
	clients.clear();
	wss.close();
}
