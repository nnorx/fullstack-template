import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	deleteFile,
	getAbsolutePath,
	isAllowedMimeType,
	isWithinSizeLimit,
	saveFile,
} from "./storage.ts";

describe("isAllowedMimeType", () => {
	it.each([
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/svg+xml",
	])("accepts %s", (mime) => {
		expect(isAllowedMimeType(mime)).toBe(true);
	});

	it.each([
		"application/pdf",
		"text/html",
		"image/bmp",
		"video/mp4",
		"",
		"image/JPEG",
	])("rejects %s", (mime) => {
		expect(isAllowedMimeType(mime)).toBe(false);
	});
});

describe("isWithinSizeLimit", () => {
	it("accepts 1 byte", () => {
		expect(isWithinSizeLimit(1)).toBe(true);
	});

	it("accepts exactly 10MB", () => {
		expect(isWithinSizeLimit(10 * 1024 * 1024)).toBe(true);
	});

	it("rejects 0 bytes", () => {
		expect(isWithinSizeLimit(0)).toBe(false);
	});

	it("rejects negative size", () => {
		expect(isWithinSizeLimit(-1)).toBe(false);
	});

	it("rejects size exceeding 10MB", () => {
		expect(isWithinSizeLimit(10 * 1024 * 1024 + 1)).toBe(false);
	});
});

describe("getAbsolutePath", () => {
	it("joins UPLOAD_DIR with the storage path", () => {
		const result = getAbsolutePath("proj-1/file-1.png");
		expect(result).toBe(join("./uploads", "proj-1/file-1.png"));
	});
});

describe("saveFile / deleteFile", () => {
	const testDir = join("./uploads", "__test-project__");

	beforeEach(async () => {
		await mkdir(testDir, { recursive: true });
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it("saves a file to disk and returns correct metadata", async () => {
		const data = new TextEncoder().encode("hello").buffer as ArrayBuffer;
		const result = await saveFile(
			"__test-project__",
			"file-1",
			"image/png",
			data,
		);

		expect(result.storagePath).toBe(join("__test-project__", "file-1.png"));
		expect(result.sizeBytes).toBe(5);

		const absPath = getAbsolutePath(result.storagePath);
		const contents = await readFile(absPath, "utf-8");
		expect(contents).toBe("hello");
	});

	it("uses correct extension for each mime type", async () => {
		const mimeToExt: Record<string, string> = {
			"image/jpeg": "jpg",
			"image/png": "png",
			"image/gif": "gif",
			"image/webp": "webp",
			"image/svg+xml": "svg",
		};

		const data = new TextEncoder().encode("x").buffer as ArrayBuffer;

		for (const [mime, ext] of Object.entries(mimeToExt)) {
			const result = await saveFile(
				"__test-project__",
				`file-${ext}`,
				mime,
				data,
			);
			expect(result.storagePath).toBe(
				join("__test-project__", `file-${ext}.${ext}`),
			);
		}
	});

	it("falls back to .bin for unknown mime types", async () => {
		const data = new TextEncoder().encode("x").buffer as ArrayBuffer;
		const result = await saveFile(
			"__test-project__",
			"file-unknown",
			"application/octet-stream",
			data,
		);
		expect(result.storagePath).toBe(
			join("__test-project__", "file-unknown.bin"),
		);
	});

	it("deleteFile removes the file from disk", async () => {
		const data = new TextEncoder().encode("delete me").buffer as ArrayBuffer;
		const { storagePath } = await saveFile(
			"__test-project__",
			"to-delete",
			"image/png",
			data,
		);

		const absPath = getAbsolutePath(storagePath);
		await expect(stat(absPath)).resolves.toBeDefined();

		await deleteFile(storagePath);
		await expect(stat(absPath)).rejects.toThrow();
	});

	it("deleteFile does not throw for non-existent files", async () => {
		await expect(
			deleteFile("__test-project__/nonexistent.png"),
		).resolves.toBeUndefined();
	});
});
