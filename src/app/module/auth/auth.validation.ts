import { z } from "zod";

const registerCitizenSchema = z.object({
	name: z.string("Name is required").min(2),
	email: z.string("Email is required").email("Invalid email"),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(100, { message: "Password cannot exceed 100 characters" })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one uppercase letter",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character",
		}),
	phone: z.string().optional(),
});

const registerStaffSchema = z.object({
	name: z.string("Name is required").min(2),
	email: z.string("Email is required").email("Invalid email"),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(100, { message: "Password cannot exceed 100 characters" })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one uppercase letter",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character",
		}),
	nid: z.string("nid is required"),
	departmentId: z.string("Department is required"),
	experienceYears: z.number("experienceYears is required"),
	expertise: z.string("expertise is required"),
});

const loginSchema = z.object({
	email: z.email("Provide a valid Email"),
	password: z
		.string("Password id required")
		.min(6, "Password must be at least 6 characters"),
});

const accountVerifySchema = z.object({
	email: z.email("Email is required"),
	otp: z.string().length(6),
});

const forgetPasswordShcema = z.object({
	email: z.email("Email is required"),
});

export const resetPasswordSchema = z.object({
	email: z.email(),
	newPassword: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(100, { message: "Password cannot exceed 100 characters" })
		.regex(/[A-Z]/, {
			message: "Password must contain at least one uppercase letter",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter",
		})
		.regex(/[0-9]/, { message: "Password must contain at least one number" })
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character",
		}),
	otp: z.string().length(6),
});

export const AuthValidation = {
	registerCitizenSchema,
	registerStaffSchema,
	loginSchema,
	accountVerifySchema,
	forgetPasswordShcema,
	resetPasswordSchema,
};
