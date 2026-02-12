import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { db } from "../db/index.ts";
import * as schema from "../db/schema/auth.ts";
import { env } from "./env.ts";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
	plugins: [admin(), organization()],
	trustedOrigins: [env.BETTER_AUTH_URL, env.FRONTEND_URL],
});

/**
 * @public
 */
export type Auth = typeof auth;
