import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
	it("accepts valid credentials", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "ValidPassword1!",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const result = loginSchema.safeParse({
			email: "not-an-email",
			password: "ValidPassword1!",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password shorter than 12 characters", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "Short1!",
		});
		expect(result.success).toBe(false);
	});

	it("accepts exactly 12 character password", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "123456789012",
		});
		expect(result.success).toBe(true);
	});
});

describe("registerSchema", () => {
	const validInput = {
		name: "Test User",
		email: "user@example.com",
		password: "ValidPassword1!",
	};

	it("accepts valid registration input", () => {
		const result = registerSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it("rejects empty name", () => {
		const result = registerSchema.safeParse({ ...validInput, name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects name longer than 100 characters", () => {
		const result = registerSchema.safeParse({
			...validInput,
			name: "a".repeat(101),
		});
		expect(result.success).toBe(false);
	});

	it("accepts name at exactly 100 characters", () => {
		const result = registerSchema.safeParse({
			...validInput,
			name: "a".repeat(100),
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const result = registerSchema.safeParse({
			...validInput,
			email: "bad-email",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password shorter than 12 characters", () => {
		const result = registerSchema.safeParse({
			...validInput,
			password: "Short1!Aa",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password longer than 128 characters", () => {
		const result = registerSchema.safeParse({
			...validInput,
			password: `Aa1!${"x".repeat(125)}`,
		});
		expect(result.success).toBe(false);
	});

	it("accepts password at exactly 128 characters", () => {
		const result = registerSchema.safeParse({
			...validInput,
			password: `Aa1!${"x".repeat(124)}`,
		});
		expect(result.success).toBe(true);
	});

	it("rejects password without uppercase letter", () => {
		const result = registerSchema.safeParse({
			...validInput,
			password: "nouppercase1!nouppercase",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password without lowercase letter", () => {
		const result = registerSchema.safeParse({
			...validInput,
			password: "NOLOWERCASE1!NOLOWERCASE",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password without number", () => {
		const result = registerSchema.safeParse({
			...validInput,
			password: "NoNumberHere!NoNumber",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password without special character", () => {
		const result = registerSchema.safeParse({
			...validInput,
			password: "NoSpecialChar1NoSpecial",
		});
		expect(result.success).toBe(false);
	});
});
