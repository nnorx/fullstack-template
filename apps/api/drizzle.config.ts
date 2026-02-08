import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: "../../.env" });

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: required for drizzle-kit CLI
		url: process.env.DATABASE_URL!,
	},
});
