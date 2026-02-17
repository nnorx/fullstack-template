import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { env } from "./env.ts";

const ALLOWED_MIME_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_TO_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/gif": "gif",
	"image/webp": "webp",
	"image/svg+xml": "svg",
};

export function isAllowedMimeType(mimeType: string): boolean {
	return ALLOWED_MIME_TYPES.has(mimeType);
}

export function isWithinSizeLimit(sizeBytes: number): boolean {
	return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE;
}

function getStoragePath(
	projectId: string,
	fileId: string,
	mimeType: string,
): string {
	const ext = MIME_TO_EXT[mimeType] ?? "bin";
	return join(projectId, `${fileId}.${ext}`);
}

export function getAbsolutePath(storagePath: string): string {
	return join(env.UPLOAD_DIR, storagePath);
}

export async function saveFile(
	projectId: string,
	fileId: string,
	mimeType: string,
	data: ArrayBuffer,
): Promise<{ storagePath: string; sizeBytes: number }> {
	const storagePath = getStoragePath(projectId, fileId, mimeType);
	const absPath = getAbsolutePath(storagePath);
	const dir = join(env.UPLOAD_DIR, projectId);

	await mkdir(dir, { recursive: true });
	const buffer = Buffer.from(data);
	await writeFile(absPath, buffer);

	return { storagePath, sizeBytes: buffer.byteLength };
}

export async function deleteFile(storagePath: string): Promise<void> {
	const absPath = getAbsolutePath(storagePath);
	await rm(absPath, { force: true });
}
