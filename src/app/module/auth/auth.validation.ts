import { z } from "zod";

const registerCitizenSchema = z.object({
	name: z.string("Name is required").min(2),
	email: z.string("Email is required").email("Invalid email"),
	password: z
		.string("Password is required")
		.min(6, "Password must be at least 6 characters"),
	phone: z.string().optional(),
});

const registerStaffSchema = z.object({
	name: z.string("Name is required").min(2),
	email: z.string("Email is required").email("Invalid email"),
	password: z.string("Password is required").min(6),
	nid: z.string("nid is required"),
	departmentId: z.string("Department is required"),
	experienceYears: z.number("experienceYears is required"),
	expertise: z.string("expertise is required"),
});

const loginSchema = z.object({
	email: z.email("Provide a valid Email"),
	password: z.
		string("Password id required")
		.min(6, "Password must be at least 6 characters")
});

 const 	accountVerifySchema = z.object({
	email: z.email("Email is required"),
	otp: z.string().length(6)
})

export const AuthValidation = {
	registerCitizenSchema,
	registerStaffSchema,
	loginSchema,
	accountVerifySchema
};
