import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../lib/env.ts";
import * as schema from "./schema/auth.ts";

const client = postgres(env.DATABASE_URL, {
	// Connection pool settings — tune these for your workload.
	// See: https://github.com/porsager/postgres#connection-options
	max: 10, // Maximum connections in the pool (default: 10)
	idle_timeout: 20, // Close idle connections after 20 seconds
	connect_timeout: 10, // Fail if a connection isn't established within 10 seconds
	max_lifetime: 60 * 30, // Retire connections after 30 minutes
});

export const db = drizzle(client, { schema });

/**
 * Close all database connections. Call during graceful shutdown.
 */
export async function closeDatabase() {
	await client.end();
}

/**
 * @public
 */
export type Database = typeof db;
