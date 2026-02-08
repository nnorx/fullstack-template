import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
	BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
	BETTER_AUTH_URL: z
		.string()
		.url("BETTER_AUTH_URL must be a valid URL")
		.default("http://localhost:3001"),
	FRONTEND_URL: z
		.string()
		.url("FRONTEND_URL must be a valid URL")
		.default("http://localhost:5173"),
	API_PORT: z.coerce.number().int().positive().default(3001),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
});

/**
 * @public
 */
export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

/**
 * Get validated environment variables.
 * Validates lazily on first access to avoid crashing during test imports.
 * @public
 */
export function getEnv(): Env {
	if (_env) return _env;

	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error("Invalid environment variables:");
		for (const issue of result.error.issues) {
			console.error(`  ${issue.path.join(".")}: ${issue.message}`);
		}
		process.exit(1);
	}

	_env = result.data;
	return _env;
}

/**
 * Convenience accessor - validates env on first use.
 * Use `getEnv()` if you need the function form.
 */
export const env = new Proxy({} as Env, {
	get(_, prop: string) {
		return getEnv()[prop as keyof Env];
	},
});
