import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for frontend error tracking, performance monitoring,
 * and session replay.
 *
 * Called once in `main.tsx` before React renders. When `VITE_SENTRY_DSN`
 * is not set, Sentry is disabled and all calls are no-ops.
 */
const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
	Sentry.init({
		dsn,
		environment: import.meta.env.MODE, // "development" | "production"

		integrations: [
			// Performance monitoring — instruments page loads, navigations, and fetch.
			Sentry.browserTracingIntegration(),

			// Session Replay — records DOM changes so you can replay what happened
			// before an error. Only captures sessions that have errors by default.
			Sentry.replayIntegration(),
		],

		// ── Tracing ────────────────────────────────────────────────
		// 10% in production to stay within free tier limits; 100% in dev.
		tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

		// Propagate tracing headers to the API so frontend and backend
		// traces are linked. Matches the Vite dev proxy and production origin.
		tracePropagationTargets: [
			"localhost",
			/^\/api\//,
			...(import.meta.env.VITE_API_URL ? [import.meta.env.VITE_API_URL] : []),
		],

		// ── Session Replay ─────────────────────────────────────────
		// Capture 10% of normal sessions and 100% of sessions with errors.
		replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
		replaysOnErrorSampleRate: 1.0,

		// Send default PII (IP addresses). Disable if stricter privacy is needed.
		sendDefaultPii: true,
	});
}
