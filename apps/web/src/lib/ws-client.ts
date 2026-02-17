type MessageHandler = (data: Record<string, unknown>) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<MessageHandler>();

function getWsUrl(): string {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}/ws`;
}

function connect() {
	if (
		ws?.readyState === WebSocket.OPEN ||
		ws?.readyState === WebSocket.CONNECTING
	) {
		return;
	}

	ws = new WebSocket(getWsUrl());

	ws.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data as string) as Record<string, unknown>;
			for (const handler of listeners) {
				handler(data);
			}
		} catch {
			// Ignore malformed messages
		}
	};

	ws.onclose = () => {
		ws = null;
		// Auto-reconnect after 3 seconds
		reconnectTimer = setTimeout(connect, 3000);
	};

	ws.onerror = () => {
		ws?.close();
	};
}

export function connectWebSocket() {
	connect();
}

export function disconnectWebSocket() {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	if (ws) {
		ws.onclose = null; // Prevent auto-reconnect
		ws.close();
		ws = null;
	}
}

export function onMessage(handler: MessageHandler): () => void {
	listeners.add(handler);
	return () => {
		listeners.delete(handler);
	};
}
