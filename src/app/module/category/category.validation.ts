import { z } from "zod";

const createCategorySchema = z
	.object({
		departmentId: z.string("Department is required"),
		name: z.string("Category name is required").trim().min(2),
		type: z.string("Type name is   'COMPLAIN' 'SERVICE'").trim().min(2),
		isPaid: z.boolean().optional().default(false),
		fee: z.number().positive("Fee must be a positive number").optional(),
	})
	.refine((data) => !data.isPaid || (data.isPaid && data.fee !== undefined), {
		message: "Fee is required when category is paid",
		path: ["fee"],
	});

const updateCategorySchema = z
	.object({
		departmentId: z.string().optional(),
		type: z.string().optional(),
		name: z.string().trim().min(2).optional(),
		isPaid: z.boolean().optional(),
		fee: z.number().positive().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update",
	});

export const CategoryValidation = {
	createCategorySchema,
	updateCategorySchema,
};
