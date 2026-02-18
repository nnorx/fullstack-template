type MessageHandler = (data: Record<string, unknown>) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const listeners = new Set<MessageHandler>();

const MAX_RECONNECT_ATTEMPTS = 20;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

function getBackoffDelay(): number {
	const delay = Math.min(BASE_DELAY_MS * 2 ** reconnectAttempts, MAX_DELAY_MS);
	// Add ±20% jitter to prevent thundering herd
	const jitter = delay * 0.2 * (Math.random() * 2 - 1);
	return delay + jitter;
}

function getWsUrl(): string {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}/ws`;
}

function scheduleReconnect() {
	if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
		return;
	}
	const delay = getBackoffDelay();
	reconnectAttempts++;
	reconnectTimer = setTimeout(connect, delay);
}

function connect() {
	if (
		ws?.readyState === WebSocket.OPEN ||
		ws?.readyState === WebSocket.CONNECTING
	) {
		return;
	}

	ws = new WebSocket(getWsUrl());

	ws.onopen = () => {
		reconnectAttempts = 0;
	};

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
		scheduleReconnect();
	};

	ws.onerror = () => {
		ws?.close();
	};
}

export function connectWebSocket() {
	reconnectAttempts = 0;
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
