import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	email: z.string().email("Invalid email address"),
	password: z
		.string()
		.min(12, "Password must be at least 12 characters")
		.max(128, "Password is too long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
});

export const userProfileSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	role: z.enum(["user", "admin"]),
	image: z.string().nullable().optional(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserRole = UserProfile["role"];
