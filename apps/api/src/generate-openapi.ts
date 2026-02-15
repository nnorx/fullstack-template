import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import app from "./app.ts";

const response = await app.request("http://localhost/api/doc");
const spec = await response.json();

const outPath = resolve(import.meta.dirname, "..", "openapi.json");
writeFileSync(outPath, `${JSON.stringify(spec, null, "\t")}\n`);

console.info(`OpenAPI spec written to ${outPath}`);
process.exit(0);
