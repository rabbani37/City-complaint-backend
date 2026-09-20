import { z } from "zod";

const createDepartmentSchema = z.object({
	name: z.string("Department name is required").trim().min(2),
	description: z.string().trim().optional(),
});

const updateDepartmentSchema = z
	.object({
		name: z.string().trim().min(2).optional(),
		description: z.string().trim().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update",
	});

export const DepartmentValidation = {
	createDepartmentSchema,
	updateDepartmentSchema,
};
