/// <reference types="vite/client" />

// Augments Vite's ImportMetaEnv via declaration merging
interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_SENTRY_DSN?: string;
}
