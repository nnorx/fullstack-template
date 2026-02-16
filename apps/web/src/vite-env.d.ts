/// <reference types="vite/client" />

// Augments Vite's ImportMetaEnv via declaration merging
// biome-ignore lint/correctness/noUnusedVariables: Ambient type augmentation
interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	readonly VITE_SENTRY_DSN: string;
}
