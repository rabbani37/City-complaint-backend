// user.validation.ts
import { z } from "zod";

const citizenUpdateSchema = z
	.object({
		address: z.string().trim().min(1, "Address cannot be empty").optional(),
	})
	.strict();

const staffUpdateSchema = z
	.object({
		address: z.string().trim().min(1, "Address cannot be empty").optional(),
		abouts: z
			.string()
			.trim()
			.max(500, "About must be under 500 characters")
			.optional(),
		experienceYears: z
			.number("Experience years must be a number")
			.int()
			.min(0, "Experience years cannot be negative")
			.max(60, "Experience years seems invalid")
			.optional(),
		expertise: z.string().trim().min(1, "Expertise cannot be empty").optional(),
	})
	.strict();

const adminUpdateSchema = z
	.object({
		address: z.string().trim().min(1, "Address cannot be empty").optional(),
	})
	.strict();

const updateUserSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(2, "Name must be at least 2 characters")
			.optional(),
		phone: z
			.string()
			.trim()
			.regex(/^(\+?880|0)1[3-9]\d{8}$/, "Invalid Bangladeshi phone number")
			.optional(),
		citizen: citizenUpdateSchema.optional(),
		staff: staffUpdateSchema.optional(),
		admin: adminUpdateSchema.optional(),
	})
	.strict()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update",
	});

export const UserValidation = {
	updateUserSchema,
};

// z.object({
//     name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
//     phone: z
//         .string()
//         .trim()
//         .regex(/^(\+?880|0)1[3-9]\d{8}$/, "Invalid Bangladeshi phone number")
//         .optional(),
//     citizen: citizenUpdateSchema.optional(),
//     staff: staffUpdateSchema.optional(),
//     admin: adminUpdateSchema.optional(),

// })
//     .strict()
//     .refine(
//         (data) => Object.keys(data).length > 0,
//         { message: "At least one field is required to update" }
//     )
