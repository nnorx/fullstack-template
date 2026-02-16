import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

/**
 * Sentry must be initialized before any other imports.
 * This file is imported at the very top of `index.ts`.
 *
 * Reads SENTRY_DSN directly from process.env (not the validated env schema)
 * to avoid circular dependencies — the env validator depends on the logger
 * which must be imported after Sentry.
 *
 * When SENTRY_DSN is not set, Sentry is disabled and all calls are no-ops.
 */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV ?? "development",
		integrations: [nodeProfilingIntegration()],

		// ── Tracing ────────────────────────────────────────────────
		// Capture 10% of transactions in production to stay within free tier.
		// Set to 1.0 in development for full visibility.
		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

		// ── Profiling ──────────────────────────────────────────────
		// Profile 100% of sampled transactions (profiling is gated by tracesSampleRate).
		profileSessionSampleRate: 1.0,
		profileLifecycle: "trace",

		// Send default PII (e.g. IP addresses) — useful for debugging.
		// Set to false here if stricter privacy requirements apply.
		sendDefaultPii: true,
	});
}
